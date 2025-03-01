const AUTO_LOAD_INTERVAL = 1000;

enum FilterType {
  All = 'all',
  Comments = 'comments',
  NonComments = 'nonComments'
}

// Current active filter
let currentFilter: FilterType = FilterType.All;
// Show hidden items setting (disabled by default)
let showHidden: boolean = false;

function clickLoadMoreButton() {
    const loadMoreButtons = document.querySelectorAll<HTMLButtonElement>('.ajax-pagination-btn');

    loadMoreButtons.forEach(button => {
        if (
            button.textContent?.includes('Load more') &&
            button.offsetParent !== null // Check if button is visible
        ) {
            button.click();
        }
    });
}

function filterTimelineItems() {
    // Get all timeline items
    const timelineItems = document.querySelectorAll('.js-timeline-item');

    if (currentFilter === FilterType.All) {
        // Show all items
        timelineItems.forEach((item: Element) => {
            (item as HTMLElement).style.display = '';
        });
        return;
    }

    timelineItems.forEach((item: Element) => {
        const itemElement = item as HTMLElement;

        const isComment = item.querySelector('.js-comment-container') || item.querySelector('.js-comment') !== null;
        if (currentFilter === FilterType.Comments) {
            itemElement.style.display = isComment ? '' : 'none';
        }
        else if (currentFilter === FilterType.NonComments) {
            itemElement.style.display = isComment ? 'none' : '';
        } else {
            itemElement.style.display = 'none';
        }

        // Always show the first item (PR description)
        const isFirst = item.querySelector('[id^="issue-"]') !== null;
        if (isFirst) {
            itemElement.style.display = '';
        }
    });
}

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setFilter') {
        currentFilter = message.filter;
        filterTimelineItems();
        sendResponse({ success: true });
    } else if (message.action === 'setShowHidden') {
        showHidden = message.showHidden;
        sendResponse({ success: true });
    } else if (message.action === 'getCurrentFilter') {
        sendResponse({ currentFilter });
    } else if (message.action === 'getSettings') {
        sendResponse({
            currentFilter,
            showHidden
        });
    }
    return true; // Required for async sendResponse
});

function startObserver() {
    // Start auto-loading hidden items immediately
    if (showHidden) {
        clickLoadMoreButton();
    }

    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations) => {
        // Apply current filter to any new content
        if (currentFilter !== FilterType.All) {
            filterTimelineItems();
        }

        // Auto-load hidden items if enabled
        if (showHidden) {
            clickLoadMoreButton();
        }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also check periodically in case the observer misses something
    setInterval(() => {
        // Apply current filter to any new content
        if (currentFilter !== FilterType.All) {
            filterTimelineItems();
        }

        // If showing hidden items, click load more buttons
        if (showHidden) {
            clickLoadMoreButton();
        }
    }, AUTO_LOAD_INTERVAL);
}

// Start when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
} else {
    startObserver();
}
