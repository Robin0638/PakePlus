/**
 * 主题管理器 - 深色模式自动切换
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.autoMode = true;
        this.darkStartHour = 18; // 晚上6点
        this.darkEndHour = 6;    // 早上6点
        this.themeToggle = null;
        this.init();
    }

    init() {
        this.loadThemeSettings();
        this.createThemeToggle();
        this.applyTheme();
        this.startAutoThemeCheck();
        this.setupEventListeners();
    }

    /**
     * 从localStorage加载主题设置
     */
    loadThemeSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('themeSettings') || '{}');
            this.currentTheme = settings.theme || 'light';
            this.autoMode = settings.autoMode !== false; // 默认开启自动模式
            this.darkStartHour = settings.darkStartHour || 18;
            this.darkEndHour = settings.darkEndHour || 6;
        } catch (error) {
            console.warn('加载主题设置失败:', error);
        }
    }

    /**
     * 保存主题设置到localStorage
     */
    saveThemeSettings() {
        try {
            const settings = {
                theme: this.currentTheme,
                autoMode: this.autoMode,
                darkStartHour: this.darkStartHour,
                darkEndHour: this.darkEndHour
            };
            localStorage.setItem('themeSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('保存主题设置失败:', error);
        }
    }

    /**
     * 创建主题切换按钮
     */
    createThemeToggle() {
        // 检查是否已存在主题切换按钮
        if (document.querySelector('.theme-toggle')) {
            return;
        }

        this.themeToggle = document.createElement('button');
        this.themeToggle.className = 'theme-toggle';
        this.themeToggle.title = '切换深色模式';
        this.themeToggle.innerHTML = this.getThemeIcon();
        
        document.body.appendChild(this.themeToggle);
    }

    /**
     * 获取主题图标
     */
    getThemeIcon() {
        if (this.currentTheme === 'dark') {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
        } else {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.autoMode) {
                    this.updateThemeBasedOnTime();
                }
            });
        }

        // 设置面板事件监听器
        this.setupSettingsEventListeners();
    }

    /**
     * 设置面板相关的事件监听器
     */
    setupSettingsEventListeners() {
        // 等待DOM加载完成
        setTimeout(() => {
            const autoThemeToggle = document.getElementById('autoThemeToggle');
            const darkStartHour = document.getElementById('darkStartHour');
            const darkEndHour = document.getElementById('darkEndHour');

            if (autoThemeToggle) {
                autoThemeToggle.checked = this.autoMode;
                autoThemeToggle.addEventListener('change', (e) => {
                    this.setAutoMode(e.target.checked);
                    this.updateSettingsUI();
                });
            }

            if (darkStartHour) {
                darkStartHour.value = `${this.darkStartHour.toString().padStart(2, '0')}:00`;
                darkStartHour.addEventListener('change', (e) => {
                    const hour = parseInt(e.target.value.split(':')[0]);
                    this.setDarkModeHours(hour, this.darkEndHour);
                });
            }

            if (darkEndHour) {
                darkEndHour.value = `${this.darkEndHour.toString().padStart(2, '0')}:00`;
                darkEndHour.addEventListener('change', (e) => {
                    const hour = parseInt(e.target.value.split(':')[0]);
                    this.setDarkModeHours(this.darkStartHour, hour);
                });
            }

            // 初始化设置面板UI
            this.updateSettingsUI();
        }, 100);
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        this.autoMode = false; // 手动切换时关闭自动模式
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveThemeSettings();
        this.updateThemeIcon();
        
        // 显示提示
        this.showThemeNotification();
    }

    /**
     * 应用主题
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // 更新主题切换按钮的图标
        if (this.themeToggle) {
            this.themeToggle.innerHTML = this.getThemeIcon();
        }
    }

    /**
     * 更新主题图标
     */
    updateThemeIcon() {
        if (this.themeToggle) {
            this.themeToggle.innerHTML = this.getThemeIcon();
        }
    }

    /**
     * 根据时间自动更新主题
     */
    updateThemeBasedOnTime() {
        if (!this.autoMode) return;

        const now = new Date();
        const currentHour = now.getHours();
        let shouldBeDark = false;

        if (this.darkStartHour > this.darkEndHour) {
            // 跨夜的情况，比如18点到6点
            shouldBeDark = currentHour >= this.darkStartHour || currentHour < this.darkEndHour;
        } else {
            // 同一天的情况
            shouldBeDark = currentHour >= this.darkStartHour && currentHour < this.darkEndHour;
        }

        const newTheme = shouldBeDark ? 'dark' : 'light';
        
        if (newTheme !== this.currentTheme) {
            this.currentTheme = newTheme;
            this.applyTheme();
            this.updateThemeIcon();
            this.saveThemeSettings();
        }
    }

    /**
     * 开始自动主题检查
     */
    startAutoThemeCheck() {
        // 立即检查一次
        this.updateThemeBasedOnTime();
        
        // 每分钟检查一次
        setInterval(() => {
            this.updateThemeBasedOnTime();
        }, 60000); // 60秒
    }

    /**
     * 显示主题切换通知
     */
    showThemeNotification() {
        const themeName = this.currentTheme === 'dark' ? '深色' : '浅色';
        const message = `已切换到${themeName}模式`;
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--card-bg);
            color: var(--text-primary);
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: var(--card-shadow);
            z-index: 1002;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 设置自动模式
     */
    setAutoMode(enabled) {
        this.autoMode = enabled;
        this.saveThemeSettings();
        
        if (enabled) {
            this.updateThemeBasedOnTime();
        }
    }

    /**
     * 设置深色模式时间范围
     */
    setDarkModeHours(startHour, endHour) {
        this.darkStartHour = startHour;
        this.darkEndHour = endHour;
        this.saveThemeSettings();
        
        if (this.autoMode) {
            this.updateThemeBasedOnTime();
        }
    }

    /**
     * 获取当前主题信息
     */
    getThemeInfo() {
        return {
            currentTheme: this.currentTheme,
            autoMode: this.autoMode,
            darkStartHour: this.darkStartHour,
            darkEndHour: this.darkEndHour,
            isDarkTime: this.isDarkTime()
        };
    }

    /**
     * 检查当前是否为深色时间
     */
    isDarkTime() {
        const now = new Date();
        const currentHour = now.getHours();
        
        if (this.darkStartHour > this.darkEndHour) {
            return currentHour >= this.darkStartHour || currentHour < this.darkEndHour;
        } else {
            return currentHour >= this.darkStartHour && currentHour < this.darkEndHour;
        }
    }

    /**
     * 强制应用指定主题（不保存设置）
     */
    forceTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme();
        this.updateThemeIcon();
    }

    /**
     * 更新设置面板UI
     */
    updateSettingsUI() {
        const autoThemeToggle = document.getElementById('autoThemeToggle');
        const darkStartHour = document.getElementById('darkStartHour');
        const darkEndHour = document.getElementById('darkEndHour');
        const manualThemeBtn = document.getElementById('manualThemeBtn');
        const themeTimeSettings = document.getElementById('themeTimeSettings');

        if (autoThemeToggle) {
            autoThemeToggle.checked = this.autoMode;
        }

        if (darkStartHour) {
            darkStartHour.value = `${this.darkStartHour.toString().padStart(2, '0')}:00`;
        }

        if (darkEndHour) {
            darkEndHour.value = `${this.darkEndHour.toString().padStart(2, '0')}:00`;
        }

        if (themeTimeSettings) {
            themeTimeSettings.style.display = this.autoMode ? 'block' : 'none';
        }

        if (manualThemeBtn) {
            const isDark = this.currentTheme === 'dark';
            manualThemeBtn.innerHTML = isDark ? 
                '<i data-lucide="sun"></i>切换到浅色模式' : 
                '<i data-lucide="moon"></i>切换到深色模式';
            manualThemeBtn.onclick = () => this.toggleTheme();
        }
    }

    /**
     * 重置为默认设置
     */
    resetToDefault() {
        this.currentTheme = 'light';
        this.autoMode = true;
        this.darkStartHour = 18;
        this.darkEndHour = 6;
        this.applyTheme();
        this.saveThemeSettings();
        this.updateThemeIcon();
        this.updateSettingsUI();
    }
}

// 创建全局主题管理器实例
let themeManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
});

// 导出主题管理器类（如果需要在其他文件中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

// 全局函数，供HTML中的onclick调用
function toggleManualTheme() {
    if (themeManager) {
        themeManager.toggleTheme();
    }
}

// 当设置面板显示时更新UI
function updateThemeSettingsUI() {
    if (themeManager) {
        themeManager.updateSettingsUI();
    }
} 