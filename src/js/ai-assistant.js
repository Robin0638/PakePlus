// AI Assistant Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const backBtn = document.getElementById('back-btn');
    const toggleInstructionsBtn = document.getElementById('toggle-instructions');
    const instructionsContent = document.getElementById('instructions-content');
    const toggleText = document.querySelector('.toggle-text');
    const toggleIcon = document.querySelector('.toggle-icon');
    const aiIframe = document.querySelector('.ai-iframe');

    // Back button functionality
    backBtn.addEventListener('click', function() {
        // Check if we can go back to previous page
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            // If no previous page record, redirect to homepage
            window.location.href = 'index.html';
        }
    });

    // Keyboard shortcuts support
    document.addEventListener('keydown', function(event) {
        // ESC key to go back
        if (event.key === 'Escape') {
            backBtn.click();
        }
        
        // Ctrl/Cmd + I to toggle instructions display
        if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
            event.preventDefault();
            toggleInstructionsBtn.click();
        }
    });

    // Instructions collapse functionality
    let isInstructionsCollapsed = false;
    
    toggleInstructionsBtn.addEventListener('click', function() {
        isInstructionsCollapsed = !isInstructionsCollapsed;
        
        if (isInstructionsCollapsed) {
            instructionsContent.classList.add('collapsed');
            toggleText.textContent = 'Expand';
            toggleIcon.classList.add('rotated');
        } else {
            instructionsContent.classList.remove('collapsed');
            toggleText.textContent = 'Collapse';
            toggleIcon.classList.remove('rotated');
        }
        
        // Save state to localStorage
        localStorage.setItem('aiInstructionsCollapsed', isInstructionsCollapsed);
    });

    // Restore instructions collapse state
    const savedCollapsedState = localStorage.getItem('aiInstructionsCollapsed');
    if (savedCollapsedState === 'true') {
        isInstructionsCollapsed = true;
        instructionsContent.classList.add('collapsed');
        toggleText.textContent = 'Expand';
        toggleIcon.classList.add('rotated');
    }

    // iframe loading handler
    if (aiIframe) {
        aiIframe.addEventListener('load', function() {
            // Remove loading indicator
            aiIframe.classList.add('loaded');
            
            // Also add loaded class to container
            const frameContainer = aiIframe.closest('.ai-frame-container');
            if (frameContainer) {
                frameContainer.classList.add('loaded');
            }
            
            // Add loading complete animation
            aiIframe.style.opacity = '0';
            setTimeout(() => {
                aiIframe.style.transition = 'opacity 0.3s ease';
                aiIframe.style.opacity = '1';
                
                // Show login prompt
                setTimeout(() => {
                    showSuccessMessage('AI Assistant loaded successfully!\nTo use full features, please log in to your iFLYTEK account.');
                }, 500);
            }, 100);
        });

        // Handle iframe loading errors
        aiIframe.addEventListener('error', function() {
            console.error('AI Assistant iframe failed to load');
            showErrorMessage('AI Assistant failed to load, please check your network connection and refresh the page');
            
            // Hide loading indicator even if loading fails
            aiIframe.classList.add('loaded');
            const frameContainer = aiIframe.closest('.ai-frame-container');
            if (frameContainer) {
                frameContainer.classList.add('loaded');
            }
        });
    }

    // Display error message
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 0.7rem 1.2rem;
            border-radius: 6px;
            box-shadow: 0 3px 15px rgba(220, 53, 69, 0.3);
            z-index: 1000;
            max-width: 280px;
            font-size: 0.85rem;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            errorDiv.style.transition = 'opacity 0.3s ease';
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 3000);
    }

    // Display success message
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        successDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${isDarkMode ? '#28a745' : '#28a745'};
            color: white;
            padding: 0.7rem 1.2rem;
            border-radius: 6px;
            box-shadow: 0 3px 15px ${isDarkMode ? 'rgba(40, 167, 69, 0.4)' : 'rgba(40, 167, 69, 0.3)'};
            z-index: 1000;
            max-width: 320px;
            font-size: 0.85rem;
            line-height: 1.3;
            white-space: pre-line;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // Auto-remove after 5.5 seconds (success message displays longer)
        setTimeout(() => {
            successDiv.style.transition = 'opacity 0.3s ease';
            successDiv.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }, 5500);
    }

    // Listen for theme changes
    document.addEventListener('aiThemeChanged', (event) => {
        console.log('AI Assistant theme changed to:', event.detail.theme);
        // Additional theme change handling logic can be added here
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // When page becomes visible again, iframe can be refreshed
            // Decide whether to refresh based on requirements
        }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Recalculate iframe height
            if (aiIframe) {
                // Trigger iframe layout recalculation
                aiIframe.style.height = aiIframe.offsetHeight + 'px';
                setTimeout(() => {
                    aiIframe.style.height = '';
                }, 10);
            }
        }, 250);
    });

    // Add page loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Add touch device support
    if ('ontouchstart' in window) {
        // Optimize interaction for touch devices
        backBtn.style.minHeight = '44px'; // iOS recommended minimum touch target
        toggleInstructionsBtn.style.minHeight = '44px';
        
        // Add touch feedback
        backBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        backBtn.addEventListener('touchend', function() {
            this.style.transform = '';
        });
        
        toggleInstructionsBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        toggleInstructionsBtn.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    }

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('AI Assistant page loading time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }

    // Error handling
    window.addEventListener('error', function(event) {
        console.error('Page error:', event.error);
    });

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled Promise rejection:', event.reason);
    });
}); 