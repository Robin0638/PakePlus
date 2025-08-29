// AI Assistant page theme switcher
class AIThemeSwitcher {
    constructor() {
        this.currentTheme = 'light';
        this.darkModeStartHour = 18; // Dark mode starts at 18:00
        this.darkModeEndHour = 6;    // Dark mode ends at 6:00
        this.darkStylesheet = null;
        this.init();
    }

    init() {
        // Create dark mode stylesheet link
        this.createDarkStylesheet();
        
        // Check current time and set theme
        this.checkTimeAndSetTheme();
        
        // Set timer to check time every minute
        setInterval(() => {
            this.checkTimeAndSetTheme();
        }, 60000); // Check once per minute
        
        // Listen for system theme changes
        this.ListenToSystemTheme();
    }

    createDarkStylesheet() {
        this.darkStylesheet = document.createElement('link');
        this.darkStylesheet.rel = 'stylesheet';
        this.darkStylesheet.href = 'css/ai-assistant-dark.css';
        this.darkStylesheet.id = 'ai-dark-theme';
        this.darkStylesheet.disabled = true; // 默认禁用
        document.head.appendChild(this.darkStylesheet);
    }

    checkTimeAndSetTheme() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // 判断是否应该使用深色模式
        const shouldUseDarkMode = this.shouldUseDarkMode(currentHour);
        
        if (shouldUseDarkMode && this.currentTheme !== 'dark') {
            this.setDarkMode();
        } else if (!shouldUseDarkMode && this.currentTheme !== 'light') {
            this.setLightMode();
        }
    }

    shouldUseDarkMode(currentHour) {
        // Use dark mode from 18:00 to 6:00 the next day
        if (this.darkModeStartHour <= this.darkModeEndHour) {
            // Normal case: 18:00 to 6:00
            return currentHour >= this.darkModeStartHour || currentHour < this.darkModeEndHour;
        } else {
            // Cross-day case: 18:00 to 6:00 the next day
            return currentHour >= this.darkModeStartHour || currentHour < this.darkModeEndHour;
        }
    }

    setDarkMode() {
        if (this.darkStylesheet) {
            this.darkStylesheet.disabled = false;
        }
        this.currentTheme = 'dark';
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        
        // Save theme state to localStorage
        localStorage.setItem('aiThemeMode', 'dark');
        
        // Trigger theme change event
        this.triggerThemeChangeEvent('dark');
    }

    setLightMode() {
        if (this.darkStylesheet) {
            this.darkStylesheet.disabled = true;
        }
        this.currentTheme = 'light';
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        
        // Save theme state to localStorage
        localStorage.setItem('aiThemeMode', 'light');
        
        // Trigger theme change event
        this.triggerThemeChangeEvent('light');
    }

    ListenToSystemTheme() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleSystemThemeChange = (e) => {
                // Only follow system theme if user hasn't manually set a theme
                const savedTheme = localStorage.getItem('aiThemeMode');
                if (!savedTheme) {
                    if (e.matches) {
                        this.setDarkMode();
                    } else {
                        this.setLightMode();
                    }
                }
            };
            
            mediaQuery.addListener(handleSystemThemeChange);
            
            // Initial check
            handleSystemThemeChange(mediaQuery);
        }
    }

    triggerThemeChangeEvent(theme) {
        // Trigger custom event for other scripts to listen to
        const event = new CustomEvent('aiThemeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Manually set theme (override time rules)
    setTheme(theme) {
        if (theme === 'dark') {
            this.setDarkMode();
        } else if (theme === 'light') {
            this.setLightMode();
        }
    }

    // Reset to automatic mode
    resetToAuto() {
        localStorage.removeItem('aiThemeMode');
        this.checkTimeAndSetTheme();
    }
}

// Initialize theme switcher after page load
document.addEventListener('DOMContentLoaded', () => {
    window.aiThemeSwitcher = new AIThemeSwitcher();
});

// Export class for use by other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIThemeSwitcher;
} 