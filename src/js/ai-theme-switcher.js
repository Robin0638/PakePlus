// AI助手页面主题切换器
class AIThemeSwitcher {
    constructor() {
        this.currentTheme = 'light';
        this.darkModeStartHour = 18; // 18点开始深色模式
        this.darkModeEndHour = 6;    // 6点结束深色模式
        this.darkStylesheet = null;
        this.init();
    }

    init() {
        // 创建深色模式样式表链接
        this.createDarkStylesheet();
        
        // 检查当前时间并设置主题
        this.checkTimeAndSetTheme();
        
        // 设置定时器，每分钟检查一次时间
        setInterval(() => {
            this.checkTimeAndSetTheme();
        }, 60000); // 每分钟检查一次
        
        // 监听系统主题变化
        this.listenToSystemTheme();
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
        // 18点到第二天6点使用深色模式
        if (this.darkModeStartHour <= this.darkModeEndHour) {
            // 正常情况：18点到6点
            return currentHour >= this.darkModeStartHour || currentHour < this.darkModeEndHour;
        } else {
            // 跨天情况：18点到第二天6点
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
        
        // 保存主题状态到localStorage
        localStorage.setItem('aiThemeMode', 'dark');
        
        // 触发主题变化事件
        this.triggerThemeChangeEvent('dark');
    }

    setLightMode() {
        if (this.darkStylesheet) {
            this.darkStylesheet.disabled = true;
        }
        this.currentTheme = 'light';
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        
        // 保存主题状态到localStorage
        localStorage.setItem('aiThemeMode', 'light');
        
        // 触发主题变化事件
        this.triggerThemeChangeEvent('light');
    }

    listenToSystemTheme() {
        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleSystemThemeChange = (e) => {
                // 只有在用户没有手动设置主题时才跟随系统
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
            
            // 初始检查
            handleSystemThemeChange(mediaQuery);
        }
    }

    triggerThemeChangeEvent(theme) {
        // 触发自定义事件，供其他脚本监听
        const event = new CustomEvent('aiThemeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    }

    // 手动设置主题（覆盖时间规则）
    setTheme(theme) {
        if (theme === 'dark') {
            this.setDarkMode();
        } else if (theme === 'light') {
            this.setLightMode();
        }
    }

    // 重置为自动模式
    resetToAuto() {
        localStorage.removeItem('aiThemeMode');
        this.checkTimeAndSetTheme();
    }
}

// 页面加载完成后初始化主题切换器
document.addEventListener('DOMContentLoaded', () => {
    window.aiThemeSwitcher = new AIThemeSwitcher();
});

// 导出类供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIThemeSwitcher;
} 