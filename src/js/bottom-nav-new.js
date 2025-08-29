/**
 * New Bottom Navigation Bar Manager
 * Includes: Soon, Focus, Downtime
 */
class BottomNavNewManager {
    constructor() {
        this.currentView = 'recent';
        this.navItems = [];
        this.viewSections = [];
        this.isInitialized = false;
        this.focusManager = null;
        this.relaxManager = null;
        this.taskManager = null;
    }

    /**
     * Initialize the bottom navigation bar
     */
    init() {
        if (this.isInitialized) return;
        
        // Check if the user is logged in
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            console.log('User not logged in, bottom navigation bar will not be displayed');
            return;
        }
        
        console.log('Initializing new bottom navigation bar');
        
        // Create the bottom navigation bar HTML
        this.createBottomNav();
        
        // Cache DOM elements
        this.cacheElements();
        
        // Bind events
        this.bindEvents();
        
        // Set initial state
        this.setActiveView('recent');
        
        // Listen for Focus mode changes
        this.setupFocusModeListener();
        
        this.isInitialized = true;
    }

    /**
     * Create the HTML structure for the bottom navigation bar
     */
    createBottomNav() {
        // Remove the old bottom navigation bar
        const oldNav = document.querySelector('.bottom-nav');
        if (oldNav) {
            oldNav.remove();
        }

        // Check if the new bottom navigation bar already exists
        const existingNewNav = document.querySelector('.bottom-nav-new');
        if (existingNewNav) {
            existingNewNav.remove();
        }

        // Create the new bottom navigation bar
        const bottomNav = document.createElement('nav');
        bottomNav.className = 'bottom-nav-new';
        bottomNav.innerHTML = `
            <button id="nav-recent-new" class="nav-item-new" data-view="recent">
                <i class="fas fa-calendar-day"></i>
                <span>Soon</span>
            </button>
            <button id="nav-focus-new" class="nav-item-new" data-view="focus">
                <i class="fas fa-hourglass-half"></i>
                <span>Focus</span>
            </button>
            <button id="nav-relax-new" class="nav-item-new" data-view="relax">
                <i class="fas fa-gamepad"></i>
                <span>Downtime</span>
            </button>
        `;

        // Insert into the page
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.appendChild(bottomNav);
        } else {
            // If app-container is not found, append directly to the body
            document.body.appendChild(bottomNav);
        }
        
        console.log('New bottom navigation bar created');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.navItems = document.querySelectorAll('.nav-item-new');
        this.viewSections = document.querySelectorAll('.view-section');
        
        // Get manager instances
        this.focusManager = window.FocusManager;
        this.relaxManager = window.RelaxManager;
        this.taskManager = window.TaskManager;
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                this.handleNavClick(view, e);
            });
        });

        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Handle navigation click events
     */
    handleNavClick(view, event) {
        console.log('Navigation click:', view);

        // Check Focus mode status
        if (view === 'relax' && this.isFocusTimerActive()) {
            event.preventDefault();
            this.showNotification('Timer is active, cannot enter Downtime');
            return;
        }

        // New: Clicking Focus directly navigates to pomodoro_tracker.html
        if (view === 'focus') {
            window.location.href = 'pomodoro_tracker.html';
            return;
        }

        // Switch to the corresponding view
        this.setActiveView(view);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Only respond to shortcuts when no input field is focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '1':
                this.setActiveView('recent');
                break;
            case '2':
                this.setActiveView('focus');
                break;
            case '3':
                if (!this.isFocusTimerActive()) {
                    this.setActiveView('relax');
                }
                break;
        }
    }

    /**
     * Set the active view
     */
    setActiveView(view) {
        console.log('Setting active view:', view);

        this.currentView = view;

        // Update navigation item states
        this.updateNavItems(view);

        // Update view sections
        this.updateViewSections(view);

        // Initialize the corresponding manager
        this.initializeManager(view);

        // Update Focus mode status
        this.updateFocusModeStatus();

        // Control AI floating button visibility
        if (window.AIFloatButtonManager) {
            window.AIFloatButtonManager.toggleByView(view);
        }
    }

    /**
     * Update navigation item states
     */
    updateNavItems(activeView) {
        this.navItems.forEach(item => {
            const view = item.getAttribute('data-view');
            const isActive = view === activeView;
            
            item.classList.toggle('active', isActive);
            
            // Remove special state classes
            item.classList.remove('focus-active', 'relax-active');
            
            // Add special state classes
            if (view === 'focus' && this.isFocusTimerActive()) {
                item.classList.add('focus-active');
            } else if (view === 'relax' && isActive) {
                item.classList.add('relax-active');
            }
        });
    }

    /**
     * Update view sections
     */
    updateViewSections(activeView) {
        this.viewSections.forEach(section => {
            const sectionId = section.id;
            
            // Determine if this section should be activated
            const isActive = this.shouldActivateSection(sectionId, activeView);
            
            if (sectionId === 'focus-mode') {
                this.handleFocusModeSection(section, isActive, activeView);
            } else if (sectionId === 'relax') {
                this.handleRelaxSection(section, isActive, activeView);
            } else if (sectionId === 'recent-tasks') {
                this.handleRecentTasksSection(section, isActive);
            } else {
                // Normal switching for other views
                section.classList.toggle('active', isActive);
            }
        });
    }

    /**
     * Determine if a section should be activated
     */
    shouldActivateSection(sectionId, activeView) {
        return sectionId === activeView || 
               (activeView === 'focus' && sectionId === 'focus-mode') ||
               (activeView === 'recent' && sectionId === 'recent-tasks');
    }

    /**
     * Handle Focus mode section
     */
    handleFocusModeSection(section, isActive, activeView) {
        const isTimerActive = this.isFocusTimerActive();
        
        if (isTimerActive && activeView !== 'focus') {
            // Focus timer is active but user switched to another view - keep Focus running in the background
            section.classList.remove('active');
            this.hideSectionVisually(section);
        } else if (activeView === 'focus') {
            // User switched to Focus view - restore full display
            section.classList.add('active');
            this.showSectionVisually(section);
        } else if (!isTimerActive) {
            // Focus timer is not active and not the current view - hide normally
            section.classList.remove('active');
            this.showSectionVisually(section);
        }
    }

    /**
     * Handle Downtime section
     */
    handleRelaxSection(section, isActive, activeView) {
        const isTimerActive = this.isFocusTimerActive();
        
        if (isTimerActive) {
            // Timer is active, hide Downtime view
            section.classList.remove('active');
            section.style.display = 'none';
        } else if (activeView === 'relax') {
            // Not in Focus mode and switched to Downtime view - show Downtime
            section.style.display = '';
            section.classList.add('active');
        } else {
            // Other views - deactivate but maintain normal display
            section.classList.remove('active');
            section.style.display = '';
        }
    }

    /**
     * Handle recent tasks section
     */
    handleRecentTasksSection(section, isActive) {
        section.classList.toggle('active', isActive);
    }

    /**
     * Hide section visually
     */
    hideSectionVisually(section) {
        section.style.position = 'fixed';
        section.style.top = '-9999px';
        section.style.left = '-9999px';
        section.style.opacity = '0';
        section.style.pointerEvents = 'none';
        section.style.zIndex = '-1';
        section.style.height = '1px';
        section.style.width = '1px';
        section.style.overflow = 'hidden';
    }

    /**
     * Show section visually
     */
    showSectionVisually(section) {
        section.style.position = '';
        section.style.top = '';
        section.style.left = '';
        section.style.opacity = '';
        section.style.pointerEvents = '';
        section.style.zIndex = '';
        section.style.height = '';
        section.style.width = '';
        section.style.overflow = '';
    }

    /**
     * Initialize the corresponding manager
     */
    initializeManager(view) {
        switch (view) {
            case 'recent':
                if (this.taskManager) {
                    this.taskManager.init(false);
                }
                break;
            case 'focus':
                if (this.focusManager) {
                    this.focusManager.init();
                }
                break;
            case 'relax':
                if (this.relaxManager) {
                    this.relaxManager.init();
                }
                break;
        }
    }

    /**
     * Set up Focus mode listener
     */
    setupFocusModeListener() {
        // Listen for Focus mode status changes
        if (this.focusManager) {
            this.focusManager.onStatusChange = (status) => {
                this.updateFocusModeStatus();
            };
        }

        // Periodically check Focus mode status
        setInterval(() => {
            this.updateFocusModeStatus();
        }, 1000);
    }

    /**
     * Update Focus mode status
     */
    updateFocusModeStatus() {
        const isTimerActive = this.isFocusTimerActive();
        const focusNavItem = document.getElementById('nav-focus-new');
        const relaxNavItem = document.getElementById('nav-relax-new');

        if (focusNavItem) {
            focusNavItem.classList.toggle('focus-active', isTimerActive);
        }

        if (relaxNavItem) {
            if (isTimerActive) {
                relaxNavItem.classList.add('disabled');
                relaxNavItem.style.pointerEvents = 'none';
                relaxNavItem.style.opacity = '0.5';
                relaxNavItem.style.filter = 'grayscale(100%)';
                relaxNavItem.title = 'Timer is active, Downtime unavailable';
            } else {
                relaxNavItem.classList.remove('disabled');
                relaxNavItem.style.pointerEvents = 'auto';
                relaxNavItem.style.opacity = '1';
                relaxNavItem.style.filter = 'none';
                relaxNavItem.title = '';
            }
        }

        // Update floating indicator
        this.updateFloatingIndicator(isTimerActive);
    }

    /**
     * Check if Focus timer is active
     */
    isFocusTimerActive() {
        return this.focusManager && 
               this.focusManager.status === 'active' && 
               this.focusManager.startTime !== null;
    }

    /**
     * Update floating indicator
     */
    updateFloatingIndicator(isTimerActive) {
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        if (floatingIndicator) {
            if (isTimerActive && this.currentView !== 'focus') {
                floatingIndicator.style.display = 'flex';
                // Update floating indicator time
                if (this.focusManager) {
                    const minutes = Math.floor(this.focusManager.remainingTime / 60);
                    const seconds = this.focusManager.remainingTime % 60;
                    const floatingTimer = document.getElementById('floating-timer');
                    if (floatingTimer) {
                        floatingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
            } else {
                floatingIndicator.style.display = 'none';
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(message, duration = 3000) {
        // Use existing notification system
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification(message, duration);
        } else {
            // Simple notification implementation
            const notification = document.createElement('div');
            notification.className = 'toast';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
    }

    /**
     * Get the current view
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Destroy the instance
     */
    destroy() {
        this.isInitialized = false;
        // Remove event listeners
        this.navItems.forEach(item => {
            item.removeEventListener('click', this.handleNavClick);
        });
    }
}

// Create a global instance
window.BottomNavNewManager = new BottomNavNewManager();

// Initialize after the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is logged in
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
        console.log('User not logged in, bottom navigation bar will not be initialized');
        return;
    }
    
    // Delay initialization to ensure other managers are loaded
    setTimeout(() => {
        if (window.BottomNavNewManager) {
            window.BottomNavNewManager.init();
        }
    }, 500); // Increase delay to ensure DOM is fully loaded
});

// Additional initialization check to ensure execution after the page is fully loaded
window.addEventListener('load', function() {
    // Check if the user is logged in
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
        console.log('User not logged in, bottom navigation bar will not be initialized');
        return;
    }
    
    setTimeout(() => {
        if (window.BottomNavNewManager && !window.BottomNavNewManager.isInitialized) {
            window.BottomNavNewManager.init();
        }
    }, 200);
}); 

// Listen for settings modal show/hide, hide bottom bar on mobile
// Recommended to place at the end of the file

document.addEventListener('DOMContentLoaded', function() {
    const settingsModal = document.getElementById('settings-modal');
    const bottomNav = document.querySelector('.bottom-nav-new');
    if (!settingsModal || !bottomNav) return;

    // Check if it's a mobile device
    function isMobile() {
        return window.innerWidth <= 900;
    }

    // Listen for settings modal attribute changes
    const observer = new MutationObserver(() => {
        if (isMobile()) {
            if (settingsModal.classList.contains('show') || settingsModal.style.display === 'block') {
                bottomNav.style.display = 'none';
            } else {
                bottomNav.style.display = '';
            }
        }
    });
    observer.observe(settingsModal, { attributes: true, attributeFilter: ['class', 'style'] });

    // Also sync on screen resize
    window.addEventListener('resize', () => {
        if (isMobile() && (settingsModal.classList.contains('show') || settingsModal.style.display === 'block')) {
            bottomNav.style.display = 'none';
        } else {
            bottomNav.style.display = '';
        }
    });
});