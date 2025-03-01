document.addEventListener('DOMContentLoaded', function() {
  const filterButtons: Record<string, string> = {
    'filter-all': 'all',
    'filter-comments': 'comments',
    'filter-non-comments': 'nonComments'
  };

  // Get current active filter and showHidden setting
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {action: 'getSettings'},
        function(response: {currentFilter?: string, showHidden?: boolean} | undefined) {
          if (response) {
            // Update filter buttons UI
            if (response.currentFilter) {
              Object.entries(filterButtons).forEach(([buttonId, filterValue]) => {
                const button = document.getElementById(buttonId);
                if (button) {
                  if (filterValue === response.currentFilter) {
                    button.classList.add('active');
                  } else {
                    button.classList.remove('active');
                  }
                }
              });
            }

            // Update show hidden items button UI
            const showHiddenItemsButton = document.getElementById('show-hidden-items');
            if (showHiddenItemsButton && response.showHidden !== undefined) {
              if (response.showHidden) {
                showHiddenItemsButton.classList.add('active');
              } else {
                showHiddenItemsButton.classList.remove('active');
              }
            }
          }
        }
      );
    }
  });

  // Add click handler for show hidden items button
  const showHiddenItemsButton = document.getElementById('show-hidden-items');
  if (showHiddenItemsButton) {
    showHiddenItemsButton.addEventListener('click', function() {
      // Toggle button state
      const isActive = this.classList.contains('active');
      if (isActive) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
      }

      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'setShowHidden',
            showHidden: !isActive
          });
        }
      });
    });
  }

  // Add click handlers for filter buttons
  Object.entries(filterButtons).forEach(([buttonId, filterValue]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', function() {
        // Update UI for filter buttons only (not affecting show-hidden-items)
        Object.keys(filterButtons).forEach(id => {
          const btn = document.getElementById(id);
          if (btn) {
            btn.classList.remove('active');
          }
        });
        this.classList.add('active');

        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'setFilter',
              filter: filterValue
            });
          }
        });
      });
    }
  });
});
