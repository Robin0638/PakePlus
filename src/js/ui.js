/**
 * UI交互模块
 * 负责处理页面UI相关的交互逻辑
 */

const UIManager = {
    // DOM元素缓存
    elements: {},
    
    /**
     * 初始化UI管理器
     */
    init() {
        // 防止页面上移
        this.preventPageShift();
        
        // 缓存DOM元素
        this.cacheElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化主题
        this.initTheme();
        
        // 初始化大屏模式/电视模式
        this.initLargeScreenMode();
        
        // 添加专注模式样式
        this.addFocusModeStyles();
        
        // 检查是否需要显示登录界面
        this.showLoginIfNeeded();
        
        // 加载用户信息
        this.loadUserInfo();
        
        // 更新头部积分显示
        this.updateHeaderPoints();
        
        // 初始检查当前专注模式状态
        if (FocusManager.status === 'active') {
            this.disableRelaxButton(true);
            // 强制隐藏轻松一刻视图
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.classList.remove('active');
                relaxView.style.display = 'none';
            }
        } else {
            // 如果不在专注模式，确保轻松一刻可用
            this.disableRelaxButton(false);
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.style.display = '';
            }
        }
    },
    
    /**
     * 防止页面上移
     * 处理移动设备上的键盘弹出和滚动行为
     */
    preventPageShift() {
        // 防止iOS设备上的键盘弹出导致页面上移
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // 延迟执行，确保键盘完全弹出
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
            
            input.addEventListener('blur', () => {
                // 延迟执行，确保键盘完全收起
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });
        
        // 防止Android设备上的滚动行为
        document.addEventListener('touchmove', (e) => {
            // 如果触摸事件发生在可滚动元素内，则允许滚动
            if (e.target.closest('.task-list, .view-content, .modal-content, .settings-content, .countdown-list, .lists-nav, .list-items-container, .app-container, main, section, .projects-container, .view-header, .create-tabs, .form-group, .modal-body, .import-container, .import-section, .ai-modal-content, .kimi-iframe, .analog-clock, .focus-timer, .timer-display, .timer-controls, .focus-container, .focus-stats, .countdown-container, .relax-container, .wheel-container, .list-content, .date-header, .weather-tips-container, .modal, button, input, select, textarea')) {
                return;
            }
            
            // 仅在视口顶部和底部进行弹性滚动时阻止默认行为
            if (document.documentElement.scrollTop <= 0 && e.touches[0].clientY > 0) {
                // 防止顶部下拉刷新
                e.preventDefault();
            } else if ((document.documentElement.scrollTop + window.innerHeight) >= document.documentElement.scrollHeight && e.touches[0].clientY < window.innerHeight) {
                // 防止底部上拉刷新
                e.preventDefault();
            }
        }, { passive: false });
        
        // 防止双击缩放
        document.addEventListener('dblclick', (e) => {
            // 允许特定元素上的双击操作
            if (e.target.closest('input, textarea, select, [data-allow-dblclick="true"]')) {
                return;
            }
            e.preventDefault();
        });
        
        // 添加viewport meta来控制缩放
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        
        // 防止iOS设备上的弹性滚动
        document.body.style.overscrollBehavior = 'none';
    },
    
    /**
     * 初始化大屏模式/电视模式
     * 为大屏幕设备添加电视模式切换功能
     */
    initLargeScreenMode() {
        // 禁止缩放
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
        
        // 禁止双击缩放
        document.addEventListener('dblclick', function(e) {
            e.preventDefault();
        });
        
        // 禁止按键缩放
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
                e.preventDefault();
            }
        });
        
        // 检测是否为大屏幕设备
        const isLargeScreen = window.matchMedia('(min-width: 2560px)').matches;
        
        if (isLargeScreen) {
            // 创建电视模式切换按钮
            this.createTVModeToggle();
            
            // 加载保存的大屏模式设置
            const settings = StorageManager.getSettings() || {};
            if (settings.tvMode === true) {
                this.enableTVMode();
            }
        }
    },
    
    /**
     * 创建电视模式切换按钮
     */
    createTVModeToggle() {
        // 先检查按钮是否已存在
        if (document.getElementById('tv-mode-toggle')) return;
        
        // 创建电视模式切换按钮
        const tvModeToggle = document.createElement('button');
        tvModeToggle.id = 'tv-mode-toggle';
        tvModeToggle.className = 'tv-mode-toggle';
        tvModeToggle.innerHTML = '<i class="fas fa-tv"></i> 电视模式';
        tvModeToggle.title = '切换至适合远距离观看的界面';
        
        // 添加点击事件
        tvModeToggle.addEventListener('click', () => {
            this.toggleTVMode();
        });
        
        // 从设置中读取当前状态并设置按钮样式
        const settings = StorageManager.getSettings() || {};
        if (settings.tvMode === true) {
            tvModeToggle.classList.add('active');
        }
        
        // 将按钮添加到顶部栏
        const userControls = document.querySelector('.user-controls');
        if (userControls) {
            // 添加到设置按钮之前
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) {
                userControls.insertBefore(tvModeToggle, settingsBtn);
            } else {
                userControls.appendChild(tvModeToggle);
            }
        }
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .tv-mode-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                background: transparent;
                border: 2px solid var(--primary-color);
                color: var(--primary-color);
                padding: 6px 12px;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
            }
            
            .tv-mode-toggle:hover {
                background: var(--primary-color);
                color: white;
            }
            
            .tv-mode-toggle.active {
                background: var(--primary-color);
                color: white;
            }
            
            .tv-mode-toggle i {
                font-size: 1.1em;
            }
            
            body.tv-mode {
                font-size: calc(16px * var(--tv-font-scale));
            }
            
            @media (max-width: 2559px) {
                .tv-mode-toggle {
                    display: none;
                }
            }
            
            /* 电视模式下的焦点状态 */
            body.tv-mode .nav-item:focus,
            body.tv-mode button:focus,
            body.tv-mode a:focus,
            body.tv-mode input:focus,
            body.tv-mode textarea:focus,
            body.tv-mode select:focus {
                outline: 3px solid var(--accent-color);
                outline-offset: 3px;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    /**
     * 切换电视模式
     */
    toggleTVMode() {
        const isTVModeActive = document.body.classList.contains('tv-mode');
        
        if (isTVModeActive) {
            this.disableTVMode();
        } else {
            this.enableTVMode();
        }
    },
    
    /**
     * 启用电视模式
     */
    enableTVMode() {
        document.body.classList.add('tv-mode');
        
        // 更新按钮状态
        const tvModeToggle = document.getElementById('tv-mode-toggle');
        if (tvModeToggle) {
            tvModeToggle.classList.add('active');
            tvModeToggle.title = '关闭电视模式';
        }
        
        // 保存设置
        const settings = StorageManager.getSettings() || {};
        settings.tvMode = true;
        StorageManager.updateSettings(settings);
        
        // 显示通知
        this.showNotification('已开启电视模式，UI更适合远距离观看');
    },
    
    /**
     * 禁用电视模式
     */
    disableTVMode() {
        document.body.classList.remove('tv-mode');
        
        // 更新按钮状态
        const tvModeToggle = document.getElementById('tv-mode-toggle');
        if (tvModeToggle) {
            tvModeToggle.classList.remove('active');
            tvModeToggle.title = '切换至适合远距离观看的界面';
        }
        
        // 保存设置
        const settings = StorageManager.getSettings() || {};
        settings.tvMode = false;
        StorageManager.updateSettings(settings);
        
        // 显示通知
        this.showNotification('已关闭电视模式');
    },
    
    /**
     * 更新顶部和积分栏显示
     */
    updateHeaderPoints() {
        // 获取当前积分
        const points = StorageManager.getPoints();
        
        // 更新顶部栏积分显示
        if (this.elements.headerPoints) {
            this.elements.headerPoints.textContent = points;
            
            // 根据积分数量添加不同的样式
            this.elements.headerPoints.className = '';
            if (points >= 1000) {
                this.elements.headerPoints.classList.add('points-master');
            } else if (points >= 500) {
                this.elements.headerPoints.classList.add('points-expert');
            } else if (points >= 100) {
                this.elements.headerPoints.classList.add('points-advanced');
            } else {
                this.elements.headerPoints.classList.add('points-beginner');
            }
        }
        
        // 更新轻松一刻页面的积分显示
        if (this.elements.userPoints) {
            this.elements.userPoints.textContent = points;
        }
    },
    
    /**
     * 禁用或启用轻松一刻按钮
     * @param {Boolean} disable 是否禁用
     */
    disableRelaxButton(disable) {
        const relaxNavBtn = document.getElementById('nav-relax');
        if (!relaxNavBtn) return;
        
        if (disable) {
            relaxNavBtn.classList.add('disabled');
            relaxNavBtn.style.pointerEvents = 'none';
            relaxNavBtn.style.opacity = '0.5';
            relaxNavBtn.style.filter = 'grayscale(100%)';
            relaxNavBtn.title = '计时进行中，轻松一刻不可用';
            
            // 确保轻松一刻视图被隐藏
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.classList.remove('active');
                relaxView.style.display = 'none';
            }
        } else {
            relaxNavBtn.classList.remove('disabled');
            relaxNavBtn.style.pointerEvents = 'auto';
            relaxNavBtn.style.opacity = '1';
            relaxNavBtn.style.filter = 'none';
            relaxNavBtn.title = '';
            
            // 允许轻松一刻视图显示（但不主动切换到该视图）
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.style.display = '';
            }
        }
    },
    
    /**
     * 添加专注模式下轻松一刻按钮的动态样式
     */
    addFocusModeStyles() {
        // 创建样式元素
        const style = document.createElement('style');
        style.id = 'focus-mode-dynamic-styles';
        
        // 添加样式规则
        style.textContent = `
            /* 专注模式下轻松一刻按钮样式 */
            .nav-item.disabled {
                opacity: 0.5 !important;
                pointer-events: none !important;
                filter: grayscale(100%) !important;
                cursor: not-allowed !important;
            }
            
            /* 禁用时的鼠标悬停状态 */
            .nav-item.disabled:hover {
                transform: none !important;
                background: none !important;
            }
            
            /* 计时进行中，隐藏轻松一刻视图 */
            html[data-focus-timer-active="true"] #relax {
                display: none !important;
            }
        `;
        
        // 将样式添加到文档头部
        document.head.appendChild(style);
    },
    
    /**
     * 清理主题相关的事件监听器
     */
    cleanupThemeListeners() {
        // 移除系统主题变化的监听器
        if (this._darkModeChangeHandler) {
            try {
                const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                darkModeMediaQuery.removeEventListener('change', this._darkModeChangeHandler);
            } catch (error) {
                console.warn('清理主题监听器失败', error);
            }
            this._darkModeChangeHandler = null;
        }

        // 清除主题检测计时器
        if (this._themeCheckInterval) {
            clearInterval(this._themeCheckInterval);
            this._themeCheckInterval = null;
        }
        
        // 清除自动主题检测计时器
        if (this._autoThemeInterval) {
            clearInterval(this._autoThemeInterval);
            this._autoThemeInterval = null;
        }
    },
    
    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // 导航栏
            navItems: document.querySelectorAll('.nav-item'),
        
        // 登录模态框
            loginModal: document.getElementById('login-modal'),
            nicknameInput: document.getElementById('nickname-input'),
            loginBtn: document.getElementById('login-btn'),
        
        // 用户信息
            userAvatar: document.getElementById('user-avatar'),
            userName: document.getElementById('user-name'),
            userPoints: document.getElementById('user-points'),
            headerPoints: document.getElementById('header-points'),
            
            // 视图相关
            viewSections: document.querySelectorAll('.view-section'),
        
        // 主题切换
            themeToggle: document.getElementById('theme-toggle'),
            themeOptions: document.querySelectorAll('input[name="theme"]'),
            systemThemeToggleContainer: document.getElementById('system-theme-toggle-container'),
            forceToggleSystemTheme: document.getElementById('force-toggle-system-theme'),
            
            // 电视模式设置
            enableTVMode: document.getElementById('enable-tv-mode'),
            
            // 设置弹窗
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            settingsClose: document.getElementById('settings-close'),
            settingsCancel: document.getElementById('settings-cancel'),
            settingsSave: document.getElementById('settings-save'),
            
            settingsTabs: document.querySelectorAll('.settings-tab'),
            settingsSections: document.querySelectorAll('.settings-section'),
            
            // 头像和昵称设置
            settingsNickname: document.getElementById('settings-nickname'),
            settingsAvatar: document.getElementById('settings-avatar'),
            saveUserSettings: document.getElementById('save-user-settings'),
        
        // 数据管理
            exportAllData: document.getElementById('export-all-data'),
            importAllData: document.getElementById('import-all-data'),
            clearAllData: document.getElementById('clear-all-data'),
            backupToLocal: document.getElementById('backup-to-local'),
            restoreFromLocal: document.getElementById('restore-from-local'),
            manageLocalBackups: document.getElementById('manage-local-backups'),
            
            // 列表和日历视图切换
            listViewBtn: document.getElementById('list-view-btn'),
            calendarViewBtn: document.getElementById('calendar-view-btn'),
            listView: document.getElementById('list-view'),
            calendarView: document.getElementById('calendar-view'),
            
            // 新建视图标签页
            createTabs: document.querySelectorAll('#create .create-tabs button'),
            createContents: document.querySelectorAll('.create-content'),
        
        // 事件详情模态框
            eventDetailsModal: document.getElementById('event-details-modal'),
            closeDetails: document.getElementById('close-details'),
        
        // 导出模态框
            exportTasksBtn: document.getElementById('export-tasks-btn'),
            exportModal: document.getElementById('export-modal'),
            closeExport: document.getElementById('close-export'),
            startExport: document.getElementById('start-export'),
            exportFormatOptions: document.querySelectorAll('input[name="export-format"]')
        };
    },
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 底部导航切换 - 特殊处理轻松一刻按钮
        this.elements.navItems.forEach(item => {
            // 如果是轻松一刻按钮，单独处理
            if (item.id === 'nav-relax') {
                item.addEventListener('click', (e) => {
                    // 检查是否在专注模式计时状态
                    const isTimerActive = window.FocusManager && 
                        FocusManager.status === 'active' && 
                        FocusManager.startTime !== null;
                    
                    if (isTimerActive) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showNotification('计时进行中，无法进入轻松一刻');
                        return false;
                    }
                    // 非计时状态下正常切换
                    this.switchView('relax');
                });
            } else {
                // 其他按钮正常处理
                item.addEventListener('click', () => {
                    this.switchView(item.id.replace('nav-', ''));
                });
            }
        });
        
        // 登录按钮
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                this.handleLogin();
            });
        }
        
        // 登录页面昵称输入框回车键
        if (this.elements.nicknameInput) {
            this.elements.nicknameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }
        
        // 主题切换
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 设置按钮
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                if (this.elements.settingsModal) {
                    this.elements.settingsModal.style.display = 'block';
                    this.elements.settingsModal.classList.add('active');
                    this.loadCurrentSettings();
                }
            });
        }
        
        // 关闭设置
        if (this.elements.settingsClose) {
            this.elements.settingsClose.addEventListener('click', () => {
                this.closeSettings();
            });
        }
        
        if (this.elements.settingsCancel) {
            this.elements.settingsCancel.addEventListener('click', () => {
                this.cancelSettings();
            });
        }
        
        // 设置标签页切换
        this.elements.settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchSettingsTab(tab.dataset.tab);
            });
        });
        
        // 头像上传预览
        if (this.elements.settingsAvatar) {
            this.elements.settingsAvatar.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // 验证文件类型
                    if (!file.type.startsWith('image/')) {
                        this.showNotification('请选择图片文件');
                        return;
                    }
                    
                    // 验证文件大小（最大 20MB）
                    if (file.size > 20 * 1024 * 1024) {
                        this.showNotification('图片大小不能超过20MB');
                        return;
                    }

                    // 预览图片并自动保存
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        // 更新头像显示
                        this.elements.userAvatar.src = e.target.result;
                        
                        // 自动保存到本地存储
                        localStorage.setItem('userAvatar', e.target.result);
                        
                        // 更新存储管理器中的用户信息
                        StorageManager.updateUserInfo({
                            avatar: e.target.result
                        });
                        
                        // 显示保存成功提示
                        this.showNotification('头像已更新');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // 保存用户设置
        if (this.elements.settingsSave) {
            this.elements.settingsSave.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        // 昵称输入框回车键保存
        if (this.elements.settingsNickname) {
            this.elements.settingsNickname.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveNickname();
                }
            });
        }
        
        // 主题选项变更 - 自动保存
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setTheme(e.target.value);
                    // 自动保存主题设置
                    this.autoSaveSettings('theme');
                }
            });
        });
        
        // 通知设置变更 - 自动保存
        if (document.getElementById('enable-notifications')) {
            document.getElementById('enable-notifications').addEventListener('change', () => {
                this.autoSaveSettings('notifications');
            });
        }
        
        if (document.getElementById('enable-sounds')) {
            document.getElementById('enable-sounds').addEventListener('change', () => {
                this.autoSaveSettings('notifications');
            });
        }
        
        // 专注模式设置变更 - 自动保存
        if (document.getElementById('auto-start-break')) {
            document.getElementById('auto-start-break').addEventListener('change', () => {
                this.autoSaveSettings('focus');
            });
        }
        
        if (document.getElementById('strict-mode')) {
            document.getElementById('strict-mode').addEventListener('change', () => {
                this.autoSaveSettings('focus');
            });
        }
        
        // AI设置变更 - 自动保存
        if (document.getElementById('ollama-server-url')) {
            document.getElementById('ollama-server-url').addEventListener('change', () => {
                this.autoSaveSettings('ai');
            });
        }
        
        if (document.getElementById('ai-model')) {
            document.getElementById('ai-model').addEventListener('change', () => {
                this.autoSaveSettings('ai');
            });
        }
        
        // 导出所有数据
        if (this.elements.exportAllData) {
            this.elements.exportAllData.addEventListener('click', () => {
                this.exportAllData();
            });
        }
        
        // 导入数据
        if (this.elements.importAllData) {
            this.elements.importAllData.addEventListener('click', () => {
                this.importAllData();
            });
        }
        
        // 清除所有数据
        if (this.elements.clearAllData) {
            this.elements.clearAllData.addEventListener('click', () => {
                this.clearAllData();
            });
        }
        
        // 视图切换（列表/日历）
        if (this.elements.listViewBtn) {
            this.elements.listViewBtn.addEventListener('click', () => {
                this.switchRecentView('list');
            });
        }
        
        if (this.elements.calendarViewBtn) {
            this.elements.calendarViewBtn.addEventListener('click', () => {
                this.switchRecentView('calendar');
            });
        }
        
        // 新建视图标签页切换
        this.elements.createTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchCreateTab(tab.id.replace('-tab', ''));
            });
        });
        
        // 关闭事件详情
        if (this.elements.closeDetails) {
            this.elements.closeDetails.addEventListener('click', () => {
                this.closeEventDetails();
            });
        }
        
        // 导出任务按钮
        if (this.elements.exportTasksBtn) {
            this.elements.exportTasksBtn.addEventListener('click', () => {
                this.openExportModal();
            });
        }
        
        // 关闭导出模态框
        if (this.elements.closeExport) {
            this.elements.closeExport.addEventListener('click', () => {
                this.closeExportModal();
            });
        }
        
        // 开始导出
        if (this.elements.startExport) {
            this.elements.startExport.addEventListener('click', () => {
                this.handleExport();
            });
        }
        
        // 强制切换系统主题按钮
        if (this.elements.forceToggleSystemTheme) {
            this.elements.forceToggleSystemTheme.addEventListener('click', () => {
                this.toggleSystemTheme();
            });
        }
        
        // 点击外部关闭设置
        if (this.elements.settingsModal) {
            this.elements.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.elements.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        // 移除专业模式相关的事件绑定
        if (this.proModeBtn) {
            this.proModeBtn.removeEventListener('click', this.enterProMode);
        }
        if (this.exitProModeBtn) {
            this.exitProModeBtn.removeEventListener('click', this.exitProMode);
        }
        
        // 备份到本地
        if (this.elements.backupToLocal) {
            this.elements.backupToLocal.addEventListener('click', () => {
                this.backupToLocal();
            });
        }
        
        // 从本地恢复
        if (this.elements.restoreFromLocal) {
            this.elements.restoreFromLocal.addEventListener('click', () => {
                this.restoreFromLocal();
            });
        }
        
        // 管理本地备份
        if (this.elements.manageLocalBackups) {
            this.elements.manageLocalBackups.addEventListener('click', () => {
                this.showBackupManager();
            });
        }
        
        // 电视模式设置变更 - 自动保存
        if (this.elements.enableTVMode) {
            this.elements.enableTVMode.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.enableTVMode();
                } else {
                    this.disableTVMode();
                }
                // 自动保存设置
                this.autoSaveSettings('display');
            });
        }
        
        // 主题设置变更 - 自动保存
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setTheme(e.target.value);
                    // 自动保存主题设置
                    this.autoSaveSettings('theme');
                }
            });
        });
        
        // 触摸设备优化
        this.optimizeForTouchDevices();
        
        // 隐私政策同意复选框
        const privacyAgree = document.getElementById('privacy-agree');
        const loginBtn = document.getElementById('login-btn');
        if (privacyAgree && loginBtn) {
            privacyAgree.addEventListener('change', () => {
                loginBtn.disabled = !privacyAgree.checked;
            });
        }

        // 处理隐私政策链接点击
        const privacyLink = document.querySelector('.privacy-agreement a');
        if (privacyLink) {
            privacyLink.addEventListener('click', (e) => {
                // 保存当前输入的信息
                const nickname = document.getElementById('nickname-input').value.trim();
                const avatarPreview = document.getElementById('avatar-preview');
                
                if (nickname) {
                    localStorage.setItem('tempUserNickname', nickname);
                }
                
                if (avatarPreview && avatarPreview.src !== 'images/default-avatar.png') {
                    localStorage.setItem('tempUserAvatar', avatarPreview.src);
                }
            });
        }
    },
    
    /**
     * 为触摸设备优化交互
     */
    optimizeForTouchDevices() {
        // 检测是否为触摸设备
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            // 为所有按钮和可交互元素添加触摸反馈
            const interactiveElements = document.querySelectorAll('button, .nav-item, .settings-tab, .task-item, .list-item, .countdown-item');
            
            interactiveElements.forEach(element => {
                // 触摸开始时添加活跃状态
                element.addEventListener('touchstart', function(e) {
                    this.classList.add('touch-active');
                }, { passive: true });
                
                // 触摸结束或取消时移除活跃状态
                ['touchend', 'touchcancel'].forEach(eventType => {
                    element.addEventListener(eventType, function() {
                        this.classList.remove('touch-active');
                    }, { passive: true });
                });
            });
            
            // 添加触摸反馈样式
            const style = document.createElement('style');
            style.textContent = `
                .touch-active {
                    opacity: 0.7;
                    transform: scale(0.98);
                    transition: transform 0.1s ease-in-out, opacity 0.1s ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    /**
     * 如果需要，显示登录模态框
     */
    showLoginIfNeeded() {
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname) {
            // 检查是否有临时保存的信息
            const tempNickname = localStorage.getItem('tempUserNickname');
            const tempAvatar = localStorage.getItem('tempUserAvatar');
            
            if (tempNickname) {
                document.getElementById('nickname-input').value = tempNickname;
                localStorage.removeItem('tempUserNickname');
            }
            
            if (tempAvatar) {
                document.getElementById('avatar-preview').src = tempAvatar;
                localStorage.removeItem('tempUserAvatar');
            }
            
            this.openModal(document.getElementById('login-modal'));
        }
    },
    
    /**
     * 加载用户信息
     */
    loadUserInfo() {
        const nickname = localStorage.getItem('userNickname');
        const avatar = localStorage.getItem('userAvatar');
        
        if (nickname) {
            // 更新昵称显示
            const nicknameElements = document.querySelectorAll('.user-nickname');
            nicknameElements.forEach(element => {
                element.textContent = nickname;
            });
            
            // 更新头像显示
            if (avatar) {
                const avatarElements = document.querySelectorAll('.user-avatar');
                avatarElements.forEach(element => {
                    element.src = avatar;
                });
            }
        }
    },
    
    /**
     * 验证昵称
     * @param {String} nickname 昵称
     * @returns {Object} 验证结果
     */
    validateNickname(nickname) {
        const result = {
            isValid: true,
            message: ''
        };

        // 检查是否为空
        if (!nickname) {
            result.isValid = false;
            result.message = '请输入昵称';
            return result;
        }

        // 检查长度（2-20个字符）
        if (nickname.length < 2 || nickname.length > 20) {
            result.isValid = false;
            result.message = '昵称长度应在2-20个字符之间';
            return result;
        }

        // 检查特殊字符（只允许中文、英文、数字和下划线）
        if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(nickname)) {
            result.isValid = false;
            result.message = '昵称只能包含中文、英文、数字和下划线';
            return result;
        }

        return result;
    },
    
    /**
     * 加载当前设置
     */
    loadCurrentSettings() {
        // 加载昵称
        const nickname = localStorage.getItem('userNickname');
        const settingsNickname = document.getElementById('settings-nickname');
        if (settingsNickname) {
            settingsNickname.value = nickname || '';
        }

        // 加载头像
        const avatar = localStorage.getItem('userAvatar');
        const settingsAvatar = document.getElementById('settings-avatar');
        if (settingsAvatar) {
            // 监听头像更改
            settingsAvatar.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                // 检查文件类型
                if (!file.type.match('image.*')) {
                    UIManager.showNotification('请选择图片文件（JPG、PNG格式）', 'error');
                    return;
                }

                // 检查文件大小
                const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
                if (file.size > MAX_FILE_SIZE) {
                    UIManager.showNotification('文件大小不能超过20MB', 'error');
                    return;
                }

                // 预览新头像
                const reader = new FileReader();
                reader.onload = function(e) {
                    // 更新所有头像显示
                    const avatarElements = document.querySelectorAll('.user-avatar');
                    avatarElements.forEach(element => {
                        element.src = e.target.result;
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        // 加载其他设置...
    },
    
    /**
     * 保存设置
     */
    saveSettings() {
        // 保存昵称
        const settingsNickname = document.getElementById('settings-nickname');
        if (settingsNickname) {
            const nickname = settingsNickname.value.trim();
            if (nickname) {
                localStorage.setItem('userNickname', nickname);
                // 更新所有昵称显示
                const nicknameElements = document.querySelectorAll('.user-nickname');
                nicknameElements.forEach(element => {
                    element.textContent = nickname;
                });
            }
        }

        // 保存头像
        const settingsAvatar = document.getElementById('settings-avatar');
        if (settingsAvatar && settingsAvatar.files.length > 0) {
            const file = settingsAvatar.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                localStorage.setItem('userAvatar', e.target.result);
            };
            reader.readAsDataURL(file);
        }

        // 保存其他设置...

        // 显示保存成功提示
        this.showNotification('设置已保存');
    },
    
    /**
     * 保存昵称
     */
    saveNickname() {
        const nickname = this.elements.settingsNickname.value.trim();
        
        // 验证昵称
        const validationResult = this.validateNickname(nickname);
        if (!validationResult.isValid) {
            this.showNotification(validationResult.message, 'error');
            return;
        }
        
        // 保存昵称到本地存储
        localStorage.setItem('userNickname', nickname);
        
        // 更新所有昵称显示
        const nicknameElements = document.querySelectorAll('.user-nickname');
        nicknameElements.forEach(element => {
            element.textContent = nickname;
        });
        
        // 更新存储管理器中的用户信息
        if (StorageManager && StorageManager.updateUserInfo) {
            StorageManager.updateUserInfo({
                nickname: nickname
            });
        }
        
        // 显示保存成功提示
        this.showNotification('昵称已更新');
    },
    
    /**
     * 自动保存设置 - 自动保存主题、通知、专注模式等设置
     * 不需要保存按钮，更改时自动保存
     */
    autoSaveSettings(settingType) {
        const settings = {...(StorageManager.getSettings() || {})};
        let updatedSettings = {};
        
        switch (settingType) {
            case 'theme':
                // 保存主题设置
                updatedSettings.theme = document.querySelector('input[name="theme"]:checked')?.value || 'system';
                this.showNotification(`已切换到${this.getThemeDisplayName(updatedSettings.theme)}主题`);
                break;
                
            case 'display':
                // 保存显示相关设置
                updatedSettings.tvMode = this.elements.enableTVMode?.checked ?? false;
                this.showNotification(updatedSettings.tvMode ? '已开启电视模式' : '已关闭电视模式');
                break;
                
            case 'notifications':
                // 保存通知设置
                updatedSettings.notifications = document.getElementById('enable-notifications')?.checked ?? true;
                updatedSettings.sounds = document.getElementById('enable-sounds')?.checked ?? true;
                this.showNotification('通知设置已更新');
                break;
                
            case 'focus':
                // 保存专注模式设置
                updatedSettings.autoStartBreak = document.getElementById('auto-start-break')?.checked ?? true;
                updatedSettings.strictMode = document.getElementById('strict-mode')?.checked ?? false;
                this.showNotification('专注模式设置已更新');
                break;
                
            case 'ai':
                // 保存AI设置
                updatedSettings.aiServer = document.getElementById('ollama-server-url')?.value || 'http://localhost:11434';
                updatedSettings.aiModel = document.getElementById('ai-model')?.value || 'llama2';
                this.showNotification('AI设置已更新');
                break;
                
            default:
                return;
        }
        
        // 合并并保存设置
        Object.assign(settings, updatedSettings);
        StorageManager.updateSettings(settings);
        
        // 立即应用新设置
        this.applySettings(settings);
    },
    
    /**
     * 获取主题的显示名称
     */
    getThemeDisplayName(theme) {
        switch (theme) {
            case 'system': return '跟随系统';
            case 'dark': return '深色';
            case 'light': return '浅色';
            case 'auto': return '自动切换';
            default: return theme;
        }
    },
    
    /**
     * 取消设置
     */
    cancelSettings() {
        // 恢复原始昵称
        if (this.elements.settingsNickname) {
            this.elements.settingsNickname.value = this.elements.settingsNickname.dataset.originalValue;
        }
        
        // 恢复原始头像
        if (this.newAvatar) {
            this.elements.userAvatar.src = StorageManager.getUserInfo().avatar;
            this.newAvatar = null;
        }
        
        // 恢复原始设置
        if (this.originalSettings) {
            this.applySettings(this.originalSettings);
        }
        
        // 关闭设置面板
        this.closeSettings();
    },
    
    /**
     * 处理登录
     */
    handleLogin() {
        const nickname = document.getElementById('nickname-input').value.trim();
        const privacyAgree = document.getElementById('privacy-agree').checked;
        
        // 验证昵称
        const validationResult = this.validateNickname(nickname);
        if (!validationResult.isValid) {
            this.showNotification(validationResult.message, 'error');
            return;
        }
        
        if (!privacyAgree) {
            this.showNotification('请阅读并同意隐私政策', 'error');
            return;
        }
        
        // 保存用户信息
        localStorage.setItem('userNickname', nickname);
        
        // 保存头像（如果已上传）
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview && avatarPreview.src !== 'images/default-avatar.png') {
            localStorage.setItem('userAvatar', avatarPreview.src);
        }
        
        // 关闭登录模态框
        this.closeModal(document.getElementById('login-modal'));
        
        // 更新用户信息显示
        this.loadUserInfo();
        
        // 显示欢迎消息
        this.showNotification(`欢迎使用，${nickname}！`);
    },
    
    /**
     * 导出所有数据
     */
    exportAllData() {
        StorageManager.exportData();
        this.showNotification('数据已导出');
    },
    
    /**
     * 导入数据
     */
    importAllData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const success = StorageManager.importData(jsonData);
                    
                    if (success) {
                        this.showNotification('数据导入成功');
                        // 重新加载页面以应用导入的数据
                        window.location.reload();
                    } else {
                        this.showNotification('数据导入失败');
                    }
                } catch (error) {
                    console.error('导入数据错误:', error);
                    this.showNotification('数据格式错误');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    },
    
    /**
     * 清除所有数据
     */
    clearAllData() {
        // 直接使用新的对话框管理器
        if (window.clearDialogManager) {
            clearDialogManager.show();
        } else {
            // 如果对话框管理器未初始化，直接跳转到清除页面
            sessionStorage.setItem('clearDataConfirmed', 'true');
            window.location.href = 'clear.html';
        }
    },
    
    /**
     * 打开模态框
     * @param {HTMLElement} modal 模态框元素
     */
    openModal(modal) {
        if (!modal) return;
        modal.classList.add('open');
    },
    
    /**
     * 关闭模态框
     * @param {HTMLElement} modal 模态框元素
     */
    closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('open');
    },
    
    /**
     * 打开事件详情模态框
     * @param {Object} event 事件对象
     */
    openEventDetails(event) {
        if (!this.elements.eventDetailsModal) return;
        
        // 设置事件ID
        this.elements.eventDetailsModal.dataset.eventId = event.id;
        
        // 更新详情内容
        document.getElementById('detail-event-name').textContent = event.name;
        
        // 设置项目
        const projectElement = document.getElementById('detail-event-project');
        if (event.projectId) {
            const project = StorageManager.getProjects().find(p => p.id === event.projectId);
            projectElement.textContent = project ? project.name : '';
        } else {
            projectElement.textContent = '';
        }
        
        // 设置时间
        const timeElement = document.getElementById('detail-event-time');
        let timeText = '';
        if (event.startTime) {
            const startTime = new Date(event.startTime);
            // 使用更友好的格式显示时间
            const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
            
            const dateStr = startTime.toLocaleDateString('zh-CN', dateOptions);
            const timeStr = startTime.toLocaleTimeString('zh-CN', timeOptions);
            
            timeText = `${dateStr} ${timeStr}`;
            
            if (event.endTime) {
                const endTime = new Date(event.endTime);
                
                // 如果开始和结束日期相同，只显示时间
                if (startTime.toDateString() === endTime.toDateString()) {
                    timeText += ` - ${endTime.toLocaleTimeString('zh-CN', timeOptions)}`;
                } else {
                    // 如果跨天，则显示完整的结束日期和时间
                    const endDateStr = endTime.toLocaleDateString('zh-CN', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    timeText += ` 至 ${endDateStr} ${endTimeStr}`;
                }
            }
        }
        timeElement.textContent = timeText;
        
        // 设置地点
        document.getElementById('detail-event-location').textContent = event.location || '';
        
        // 设置参与人员
        document.getElementById('detail-event-participants').textContent = 
            Array.isArray(event.participants) ? event.participants.join('、') : (event.participants || '');
        
        // 设置标签
        const tagsContainer = document.getElementById('detail-event-tags');
        tagsContainer.innerHTML = '';
        if (event.tags && event.tags.length > 0) {
            event.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = `task-tag ${tag}`;
                tagElement.innerHTML = `<i class="fas fa-tag"></i>${tag}`;
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // 设置备注
        document.getElementById('detail-event-notes').textContent = event.notes || '';
        
        // 显示模态框
        this.showModal(this.elements.eventDetailsModal);
    },
    
    /**
     * 关闭事件详情模态框
     */
    closeEventDetails() {
        this.closeModal(this.elements.eventDetailsModal);
    },
    
    /**
     * 打开导出模态框
     */
    openExportModal() {
        // 设置默认日期范围（当前月份）
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        document.getElementById('export-start-date').valueAsDate = startDate;
        document.getElementById('export-end-date').valueAsDate = endDate;
        
        // 更新导出格式选项的样式
        this.updateExportFormatOptions();
        
        // 绑定格式选项的点击事件
        const formatOptions = document.querySelectorAll('.format-option');
        formatOptions.forEach(option => {
            option.addEventListener('click', () => {
                formatOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
            });
        });
        
        // 默认选中第一个选项
        const firstOption = document.querySelector('.format-option');
        if (firstOption) {
            firstOption.classList.add('active');
        }
        
        this.openModal(this.elements.exportModal);
    },
    
    /**
     * 更新导出格式选项的样式
     */
    updateExportFormatOptions() {
        const formatOptions = document.querySelectorAll('.format-option');
        formatOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    },
    
    /**
     * 处理导出
     */
    handleExport() {
        const startDate = document.getElementById('export-start-date').value;
        const endDate = document.getElementById('export-end-date').value;
        const includeCompleted = document.getElementById('export-completed').checked;
        const includeUncompleted = document.getElementById('export-uncompleted').checked;
        const format = document.querySelector('input[name="export-format"]:checked').value;
        
        // 验证日期
        if (!startDate || !endDate) {
            this.showNotification('请设置导出日期范围');
            return;
        }
        
        // 构建过滤条件
        const filter = {
            startDate,
            endDate: new Date(endDate + 'T23:59:59').toISOString() // 结束日期设为当天的最后一刻
        };
        
        // 如果两者不都选中，则应用筛选
        if (includeCompleted !== includeUncompleted) {
            filter.completed = includeCompleted;
        }
        
        let data, filename, mimeType;
        
        switch (format) {
            case 'csv':
                data = StorageManager.getEventsCSV(filter);
                filename = `events_${startDate}_to_${endDate}.csv`;
                mimeType = 'text/csv';
                break;
            case 'ics':
                data = StorageManager.getEventsICS(filter);
                filename = `events_${startDate}_to_${endDate}.ics`;
                mimeType = 'text/calendar';
                break;
            case 'txt':
                data = StorageManager.getEventsTXT(filter);
                filename = `events_${startDate}_to_${endDate}.txt`;
                mimeType = 'text/plain';
                break;
            case 'md':
                data = StorageManager.getEventsMD(filter);
                filename = `events_${startDate}_to_${endDate}.md`;
                mimeType = 'text/markdown';
                break;
        }
        
        if (!data) {
            this.showNotification('没有符合条件的事件');
            return;
        }
        
        // 创建下载
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.closeExportModal();
        this.showNotification(`已导出为${format.toUpperCase()}格式`);
    },
    
    /**
     * 关闭导出模态框
     */
    closeExportModal() {
        this.closeModal(this.elements.exportModal);
    },
    
    /**
     * 显示通知
     * @param {String} message 通知消息
     * @param {Number} duration 持续时间（毫秒）
     */
    showNotification(message, duration = 3000) {
        // 检查是否已有通知元素
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
            
            // 添加样式
            notification.style.position = 'fixed';
            notification.style.bottom = '70px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px 20px';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '9999';
            notification.style.transition = 'opacity 0.3s';
        }
        
        // 设置消息
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // 清除之前的计时器
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }
        
        // 设置新计时器
        this.notificationTimer = setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },
    
    /**
     * 应用设置
     */
    applySettings(settings) {
        // 应用主题
        if (settings.theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else if (settings.theme === 'auto') {
            // 根据当前时间设置自动主题
            const isDark = this._shouldUseDarkTheme();
            this.applyTheme(isDark ? 'dark' : 'light');
        } else {
            this.applyTheme(settings.theme);
        }

        // 更新主题选项的选中状态
        const themeInput = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
        if (themeInput) {
            themeInput.checked = true;
        }

        // 应用通知设置
        if (window.NotificationManager) {
            if (settings.notifications !== false) {
                console.log('启用通知，请求权限');
                NotificationManager.requestPermission();
            } else {
                console.log('禁用通知');
                // 取消通知权限需要用户手动操作，所以这里只记录状态
            }
        } else {
            // 如果没有NotificationManager，尝试直接请求权限
            if (settings.notifications !== false && window.Notification && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    console.log('通知权限请求结果:', permission);
                }).catch(err => {
                    console.error('请求通知权限出错:', err);
                });
            }
        }
        
        // 应用声音设置
        if (window.FocusManager) {
            if (settings.sounds === false) {
                console.log('禁用声音');
                FocusManager.disableSounds();
            } else {
                console.log('启用声音');
                FocusManager.enableSounds();
            }

            // 应用专注模式设置
            FocusManager.setStrictMode(settings.strictMode === true);
            FocusManager.setAutoStartBreak(settings.autoStartBreak !== false);
            
            // 立即更新UI反映设置变化
            if (FocusManager.status === 'active') {
                FocusManager.updateUIForActive();
            }
        }
    },
    
    /**
     * 根据当前时间判断是否应该使用深色主题
     * 晚上6点到早上6点使用深色主题
     * @returns {Boolean} 是否应该使用深色主题
     */
    _shouldUseDarkTheme() {
        const hours = new Date().getHours();
        return hours >= 18 || hours < 6; // 晚上6点到早上6点使用深色主题
    },
    
    /**
     * 自动检测主题切换
     * 用于自动模式下定时检查是否需要切换主题
     */
    _checkAutoThemeChange() {
        const settings = StorageManager.getSettings() || {};
        if (settings.theme !== 'auto') return;
        
        const isDarkNow = this._shouldUseDarkTheme();
        
        // 如果需要切换主题且与当前不同，则切换
        if (isDarkNow !== document.body.classList.contains('dark-theme')) {
            console.log('自动主题变化 (定时检测):', isDarkNow ? '深色' : '浅色');
            this.applyTheme(isDarkNow ? 'dark' : 'light');
        }
    },
    
    /**
     * 初始化主题
     */
    initTheme() {
        const settings = StorageManager.getSettings() || {};
        let theme = settings.theme || 'light';
        
        // 设置主题选项的选中状态
        const themeOption = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (themeOption) {
            themeOption.checked = true;
        }
        
        // 调试日志
        console.log('初始化主题：', theme);
        
        // 保存上次检测到的系统主题状态，用于定时检查
        this._lastSystemThemeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('初始系统主题状态：', this._lastSystemThemeDark ? '深色' : '浅色');
        
        // 根据主题类型显示或隐藏系统主题切换按钮
        if (this.elements.systemThemeToggleContainer) {
            this.elements.systemThemeToggleContainer.style.display = 
                theme === 'system' ? '' : 'none';
        }
        
        // 根据不同主题类型进行处理
        if (theme === 'system') {
            const prefersDark = this._lastSystemThemeDark;
            this.applyTheme(prefersDark ? 'dark' : 'light');
            
            // 设置系统主题检测
            this._setupSystemThemeDetection();
            
            // 启动定时检测 - 每5秒检查一次系统主题变化
            // 这是为了在媒体查询事件不可靠的情况下的备选方案
            this._themeCheckInterval = setInterval(() => {
                this._checkSystemThemeChange();
            }, 5000);
        } else if (theme === 'auto') {
            // 根据当前时间设置自动主题
            const isDark = this._shouldUseDarkTheme();
            console.log('自动主题检测结果:', isDark ? '深色' : '浅色');
            this.applyTheme(isDark ? 'dark' : 'light');
            
            // 启动自动主题检测
            this._autoThemeInterval = setInterval(() => {
                this._checkAutoThemeChange();
            }, 60000); // 每分钟检查一次
        } else {
            this.applyTheme(theme);
        }
    },
    
    /**
     * 设置系统主题检测
     * 包含多种检测机制来确保可靠性
     */
    _setupSystemThemeDetection() {
        try {
            // 方法1: 标准媒体查询 addEventListener
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // 先移除可能存在的旧监听器，防止重复添加
            try {
                if (this._darkModeChangeHandler) {
                    darkModeMediaQuery.removeEventListener('change', this._darkModeChangeHandler);
                }
            } catch (error) {
                console.warn('移除旧监听器失败', error);
            }
            
            // 保存监听器函数以便后续可以移除
            this._darkModeChangeHandler = (e) => {
                const currentSettings = StorageManager.getSettings() || {};
                if (currentSettings.theme === 'system') {
                    console.log('系统主题变化 (事件):', e.matches ? '深色' : '浅色');
                    this.applyTheme(e.matches ? 'dark' : 'light');
                    // 更新上次检测状态
                    this._lastSystemThemeDark = e.matches;
                }
            };
            
            // 添加新的监听器
            darkModeMediaQuery.addEventListener('change', this._darkModeChangeHandler);
            
            // 方法2: 兼容性处理 - 对于不支持 addEventListener 的旧浏览器
            if (typeof darkModeMediaQuery.addEventListener !== 'function') {
                console.log('浏览器不支持媒体查询addEventListener，使用备选方案');
                // 使用旧式的 addListener 方法
                try {
                    darkModeMediaQuery.addListener(this._darkModeChangeHandler);
                } catch (error) {
                    console.warn('添加媒体查询监听器失败', error);
                }
            }
        } catch (error) {
            console.error('设置系统主题检测失败', error);
        }
    },
    
    /**
     * 定时检查系统主题变化
     * 作为事件监听器的备选方案
     */
    _checkSystemThemeChange() {
        const settings = StorageManager.getSettings() || {};
        if (settings.theme !== 'system') return;
        
        // 检测当前系统主题
        const isDarkNow = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 如果与上次检测结果不同，则应用新主题
        if (isDarkNow !== this._lastSystemThemeDark) {
            console.log('系统主题变化 (定时检测):', isDarkNow ? '深色' : '浅色');
            this.applyTheme(isDarkNow ? 'dark' : 'light');
            this._lastSystemThemeDark = isDarkNow;
        }
    },
    
    /**
     * 设置主题
     * @param {String} themeSetting 主题设置 (light/dark/system/auto)
     */
    setTheme(themeSetting) {
        console.log('设置主题:', themeSetting);
        
        const settings = StorageManager.getSettings() || {};
        settings.theme = themeSetting;
        StorageManager.updateSettings(settings);
        
        // 清理现有的主题监听器和计时器
        this.cleanupThemeListeners();
        
        // 根据主题类型显示或隐藏系统主题切换按钮
        if (this.elements.systemThemeToggleContainer) {
            this.elements.systemThemeToggleContainer.style.display = 
                themeSetting === 'system' ? '' : 'none';
        }
        
        // 根据不同主题类型进行处理
        if (themeSetting === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log('系统主题检测结果:', prefersDark ? '深色' : '浅色');
            this.applyTheme(prefersDark ? 'dark' : 'light');
            
            // 保存当前系统主题状态
            this._lastSystemThemeDark = prefersDark;
            
            // 设置系统主题检测
            this._setupSystemThemeDetection();
            
            // 启动定时检测备选方案
            this._themeCheckInterval = setInterval(() => {
                this._checkSystemThemeChange();
            }, 5000);
        } else if (themeSetting === 'auto') {
            // 根据当前时间设置自动主题
            const isDark = this._shouldUseDarkTheme();
            console.log('自动主题检测结果:', isDark ? '深色' : '浅色');
            this.applyTheme(isDark ? 'dark' : 'light');
            
            // 启动自动主题检测
            this._autoThemeInterval = setInterval(() => {
                this._checkAutoThemeChange();
            }, 60000); // 每分钟检查一次
        } else {
            this.applyTheme(themeSetting);
        }
        
        // 更新主题选项的选中状态
        const themeOption = document.querySelector(`input[name="theme"][value="${themeSetting}"]`);
        if (themeOption) {
            themeOption.checked = true;
        }
    },
    
    /**
     * 应用主题
     * @param {String} theme 主题 (light/dark)
     */
    applyTheme(theme) {
        console.log('应用主题:', theme);
        
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
        
        // 设置HTML元素的data属性，便于CSS选择器使用
        document.documentElement.setAttribute('data-theme', theme);
        
        // 触发自定义事件，允许其他组件响应主题变化
        document.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme }
        }));
    },
    
    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },
    
    /**
     * 强制切换系统主题状态
     * 这是一个调试/备用功能，允许用户在系统主题检测不工作时手动切换
     */
    toggleSystemTheme() {
        const settings = StorageManager.getSettings() || {};
        
        // 如果当前不是系统主题，先切换到系统主题
        if (settings.theme !== 'system') {
            this.setTheme('system');
            return;
        }
        
        // 切换当前检测到的系统主题状态
        this._lastSystemThemeDark = !this._lastSystemThemeDark;
        console.log('手动切换系统主题状态为:', this._lastSystemThemeDark ? '深色' : '浅色');
        
        // 应用新主题
        this.applyTheme(this._lastSystemThemeDark ? 'dark' : 'light');
        
        // 显示提示
        this.showNotification(`已手动切换到${this._lastSystemThemeDark ? '深色' : '浅色'}主题`);
    },
    
    /**
     * 切换视图
     * @param {String} viewId 视图ID (recent/projects/create/focus/relax)
     */
    switchView(viewId) {
        console.log('切换视图:', viewId);
        
        // 检查是否在专注模式计时中尝试切换到轻松一刻
        const isTimerActive = window.FocusManager && FocusManager.status === 'active' && FocusManager.startTime !== null;
        if (viewId === 'relax' && isTimerActive) {
            this.showNotification('计时进行中，无法进入轻松一刻');
            return;
        }
        
        // 激活导航项
        this.elements.navItems.forEach(item => {
            item.classList.toggle('active', item.id === `nav-${viewId}`);
        });
        
        // 处理轻松一刻视图
        const relaxView = document.getElementById('relax');
        
        if (relaxView) {
            // 如果当前是计时状态，隐藏轻松一刻视图
            if (isTimerActive) {
                relaxView.classList.remove('active');
                relaxView.style.display = 'none';
            } else if (viewId === 'relax') {
                // 非专注模式下，且切换到轻松一刻视图时，显示轻松一刻
                relaxView.style.display = '';
                relaxView.classList.add('active');
                
                // 确保初始化轻松一刻
                if (window.RelaxManager) {
                    RelaxManager.init();
                }
            } else {
                // 其他视图下，轻松一刻不激活但保持正常display
                relaxView.classList.remove('active');
                relaxView.style.display = '';
            }
        }
        
        // 获取专注模式视图
        const focusModeView = document.getElementById('focus-mode');
        
        // 显示对应的视图
        this.elements.viewSections.forEach(section => {
            if (section.id === 'relax') {
                // 轻松一刻视图已单独处理
                return;
            }
            
            const sectionId = section.id;
            
            // 判断是否应该激活此视图
            const isActive = sectionId === viewId || 
                           (viewId === 'focus' && sectionId === 'focus-mode') ||
                           (viewId === 'recent' && sectionId === 'recent-tasks');
            
            // 特殊处理专注模式视图
            if (sectionId === 'focus-mode') {
                if (isTimerActive && viewId !== 'focus') {
                    // 专注模式正在计时但用户切换到其他视图 - 保持专注模式在后台运行
                    section.classList.remove('active');
                    
                    // 不设置display:none，而是把它移到视图之外但仍然保持活跃
                    section.style.position = 'fixed';
                    section.style.top = '-9999px';
                    section.style.left = '-9999px';
                    section.style.opacity = '0';
                    section.style.pointerEvents = 'none';
                    section.style.zIndex = '-1';
                    section.style.height = '1px';
                    section.style.width = '1px';
                    section.style.overflow = 'hidden';
                } else if (viewId === 'focus') {
                    // 用户切换到专注模式视图 - 恢复完全显示
                    section.classList.add('active');
                    section.style.position = '';
                    section.style.top = '';
                    section.style.left = '';
                    section.style.opacity = '';
                    section.style.pointerEvents = '';
                    section.style.zIndex = '';
                    section.style.height = '';
                    section.style.width = '';
                    section.style.overflow = '';
                } else if (!isTimerActive) {
                    // 专注模式没有计时且不是当前视图 - 正常隐藏
                    section.classList.remove('active');
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
            } else {
                // 其他视图正常切换
                section.classList.toggle('active', isActive);
            }
            
            // 如果切换到对应视图，初始化相应的管理器
            if (isActive) {
                switch (sectionId) {
                    case 'recent-tasks':
                        if (window.TaskManager) {
                            // 避免重新加载所有内容，只刷新UI
                            TaskManager.init(false);
                        }
                        break;
                    case 'focus-mode':
                        if (window.FocusManager) {
                            FocusManager.init();
                        }
                        break;
                }
            }
        });
        
        // 更新悬浮指示器
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        if (floatingIndicator) {
            if (isTimerActive && viewId !== 'focus') {
                floatingIndicator.style.display = 'flex';
                // 更新悬浮指示器时间
                const minutes = Math.floor(FocusManager.remainingTime / 60);
                const seconds = FocusManager.remainingTime % 60;
                const floatingTimer = document.getElementById('floating-timer');
                if (floatingTimer) {
                    floatingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            } else {
                floatingIndicator.style.display = 'none';
            }
        }
    },
    
    /**
     * 切换最近任务视图模式
     * @param {String} mode 视图模式 (list/calendar)
     */
    switchRecentView(mode) {
        this.elements.listViewBtn.classList.toggle('active', mode === 'list');
        this.elements.calendarViewBtn.classList.toggle('active', mode === 'calendar');
        
        this.elements.listView.classList.toggle('active', mode === 'list');
        this.elements.calendarView.classList.toggle('active', mode === 'calendar');
        
        // 如果切换到日历视图，触发日历初始化或刷新
        if (mode === 'calendar' && window.CalendarManager) {
            window.CalendarManager.refreshCalendar();
        }
    },
    
    /**
     * 切换新建视图标签页
     * @param {String} tabId 标签页ID (traditional/ai/import)
     */
    switchCreateTab(tabId) {
        // 激活标签
        this.elements.createTabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabId}-create-tab` || tab.id === `${tabId}-tab`);
        });
        
        // 显示对应内容
        this.elements.createContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId || content.id === `${tabId}-create`);
        });
    },
    
    /**
     * 打开设置面板
     */
    openSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'block';
            this.elements.settingsModal.classList.add('active');
            this.loadCurrentSettings();
        }
    },
    
    /**
     * 关闭设置面板
     */
    closeSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
            this.elements.settingsModal.classList.remove('active');
        }
    },
    
    /**
     * 切换设置标签页
     * @param {String} tabId 标签页ID
     */
    switchSettingsTab(tabId) {
        // 激活标签
        this.elements.settingsTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // 显示对应内容
        this.elements.settingsSections.forEach(section => {
            section.classList.toggle('active', section.id === tabId);
        });
        
        // 获取底部按钮区域
        const settingsFooter = document.getElementById('settings-footer');
        const saveBtn = document.getElementById('settings-save');
        const cancelBtn = document.getElementById('settings-cancel');
        const settingsModal = document.getElementById('settings-modal');
        
        // 根据当前标签页添加或移除特殊类
        if (settingsModal) {
            if (tabId === 'user-settings') {
                settingsModal.classList.add('show-footer');
            } else {
                settingsModal.classList.remove('show-footer');
            }
        }
        
        if (tabId === 'user-settings') {
            // 在用户设置标签页显示底部按钮区域和保存/取消按钮
            if (settingsFooter) {
                settingsFooter.style.display = 'flex';
                settingsFooter.style.visibility = 'visible';
            }
            
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
                saveBtn.style.visibility = 'visible';
            }
            if (cancelBtn) {
                cancelBtn.style.display = 'inline-block';
                cancelBtn.style.visibility = 'visible';
            }
        } else {
            // 在其他标签页隐藏整个底部按钮区域
            if (settingsFooter) {
                settingsFooter.style.display = 'none';
                settingsFooter.style.visibility = 'hidden';
            }
            
            // 同时也隐藏保存和取消按钮
            if (saveBtn) {
                saveBtn.style.display = 'none';
                saveBtn.style.visibility = 'hidden';
            }
            if (cancelBtn) {
                cancelBtn.style.display = 'none';
                cancelBtn.style.visibility = 'hidden';
            }
        }
    },
    
    /**
     * 备份数据到本地
     */
    backupToLocal() {
        try {
            const backupMeta = StorageManager.createLocalBackup();
            this.showNotification(`已成功创建备份 (${backupMeta.eventCount}个事件, ${backupMeta.projectCount}个项目)`);
        } catch (error) {
            console.error('备份失败:', error);
            this.showNotification(`备份失败: ${error.message}`, 'error');
        }
    },
    
    /**
     * 从本地恢复备份
     */
    restoreFromLocal() {
        const backups = StorageManager.getBackupIndex();
        
        // 如果没有备份，提示用户
        if (backups.length === 0) {
            this.showNotification('没有可用的备份', 'error');
            return;
        }
        
        // 创建备份选择列表
        const backupsList = document.createElement('div');
        backupsList.className = 'backups-list';
        
        backups.forEach(backup => {
            const backupItem = document.createElement('div');
            backupItem.className = 'backup-item';
            backupItem.dataset.id = backup.id;
            
            const createdAt = new Date(backup.createdAt).toLocaleString('zh-CN');
            const size = StorageManager._formatSize(backup.dataSize || 0);
            
            backupItem.innerHTML = `
                <div class="backup-meta">
                    <span class="backup-time">${createdAt}</span>
                    <span class="backup-description">${backup.description || '无描述'}</span>
                    <span class="backup-size">${size}</span>
                </div>
                <div class="backup-stats">
                    <span>事件: ${backup.eventCount || '未知'}</span>
                    <span>项目: ${backup.projectCount || '未知'}</span>
                </div>
                <button class="restore-btn">恢复此备份</button>
            `;
            
            const restoreBtn = backupItem.querySelector('.restore-btn');
            restoreBtn.addEventListener('click', () => {
                this.confirmRestore(backup);
            });
            
            backupsList.appendChild(backupItem);
        });
        
        // 显示备份选择对话框
        this.showModal('选择要恢复的备份', backupsList);
    },
    
    /**
     * 确认恢复备份
     * @param {Object} backup 备份元数据
     */
    confirmRestore(backup) {
        if (confirm(`您确定要恢复此备份吗？\n备份时间: ${new Date(backup.createdAt).toLocaleString('zh-CN')}\n此操作将覆盖当前所有数据。`)) {
            // 执行恢复
            const success = StorageManager.restoreFromBackup(backup.id);
            
            if (success) {
                this.showNotification('备份恢复成功，即将刷新页面...');
                
                // 延迟刷新页面，让用户看到通知
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showNotification('备份恢复失败', 'error');
            }
        }
    },
    
    /**
     * 显示备份管理器
     */
    showBackupManager() {
        // 获取备份列表
        const backups = StorageManager.getBackupIndex();
        const stats = StorageManager.getStorageStats();
        
        // 创建管理器界面
        const managerContent = document.createElement('div');
        managerContent.className = 'backup-manager';
        
        // 添加统计信息
        managerContent.innerHTML = `
            <div class="storage-stats">
                <h3>存储统计</h3>
                <div class="stats-grid">
                    <div class="stat-item">当前数据大小: ${stats.currentDataSize}</div>
                    <div class="stat-item">备份数量: ${stats.backupCount}个</div>
                    <div class="stat-item">总备份大小: ${stats.totalBackupSize}</div>
                    <div class="stat-item">存储使用率: ${stats.usagePercentage}%</div>
                </div>
            </div>
            <div class="backup-controls">
                <button id="create-new-backup" class="settings-btn secondary">创建新备份</button>
                <button id="clear-all-backups" class="settings-btn danger">清除所有备份</button>
            </div>
        `;
        
        // 添加备份列表
        const backupsList = document.createElement('div');
        backupsList.className = 'backups-list manager-list';
        
        if (backups.length === 0) {
            backupsList.innerHTML = '<div class="empty-message">没有备份</div>';
        } else {
            backups.forEach(backup => {
                const backupItem = document.createElement('div');
                backupItem.className = 'backup-item';
                backupItem.dataset.id = backup.id;
                
                const createdAt = new Date(backup.createdAt).toLocaleString('zh-CN');
                const size = StorageManager._formatSize(backup.dataSize || 0);
                
                backupItem.innerHTML = `
                    <div class="backup-meta">
                        <span class="backup-time">${createdAt}</span>
                        <span class="backup-description">${backup.description || '无描述'}</span>
                        <span class="backup-size">${size}</span>
                    </div>
                    <div class="backup-actions">
                        <button class="restore-backup-btn">恢复</button>
                        <button class="export-backup-btn">导出</button>
                        <button class="delete-backup-btn">删除</button>
                    </div>
                `;
                
                // 添加事件监听
                const restoreBtn = backupItem.querySelector('.restore-backup-btn');
                restoreBtn.addEventListener('click', () => {
                    this.confirmRestore(backup);
                });
                
                const exportBtn = backupItem.querySelector('.export-backup-btn');
                exportBtn.addEventListener('click', () => {
                    StorageManager.exportBackup(backup.id);
                    this.showNotification('备份已导出');
                });
                
                const deleteBtn = backupItem.querySelector('.delete-backup-btn');
                deleteBtn.addEventListener('click', () => {
                    // 防止重复点击
                    if (deleteBtn.disabled) {
                        return;
                    }
                    
                    // 禁用按钮防止重复点击
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = '删除中...';
                    
                    if (confirm(`确定要删除此备份吗？\n备份时间: ${createdAt}`)) {
                        StorageManager.deleteBackup(backup.id);
                        this.showBackupManager(); // 刷新管理器
                        this.showNotification('备份已删除');
                    } else {
                        // 用户点击取消，恢复按钮状态
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = '删除';
                    }
                });
                
                backupsList.appendChild(backupItem);
            });
        }
        
        managerContent.appendChild(backupsList);
        
        // 显示管理器
        this.showModal('备份管理', managerContent);
        
        // 添加创建新备份和清除所有备份的事件监听
        const createNewBackupBtn = document.getElementById('create-new-backup');
        if (createNewBackupBtn) {
            createNewBackupBtn.addEventListener('click', () => {
                this.backupToLocal();
                this.showBackupManager(); // 刷新管理器
            });
        }
        
        const clearAllBackupsBtn = document.getElementById('clear-all-backups');
        if (clearAllBackupsBtn) {
            clearAllBackupsBtn.addEventListener('click', () => {
                // 防止重复点击
                if (clearAllBackupsBtn.disabled) {
                    return;
                }
                
                // 禁用按钮防止重复点击
                clearAllBackupsBtn.disabled = true;
                clearAllBackupsBtn.textContent = '清除中...';
                
                if (confirm('确定要清除所有备份吗？此操作不可恢复！')) {
                    StorageManager.clearAllBackups();
                    this.showBackupManager(); // 刷新管理器
                    this.showNotification('所有备份已清除');
                } else {
                    // 用户点击取消，恢复按钮状态
                    clearAllBackupsBtn.disabled = false;
                    clearAllBackupsBtn.textContent = '清除所有备份';
                }
            });
        }
    },
    
    /**
     * 显示模态对话框
     * @param {String} title 标题
     * @param {HTMLElement|String} content 内容
     */
    showModal(title, content) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal open';
        
        // 创建内容容器
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content backup-modal-content';
        
        // 创建标题和关闭按钮
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'close-btn';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        // 创建内容区域
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        if (typeof content === 'string') {
            modalBody.innerHTML = content;
        } else {
            modalBody.appendChild(content);
        }
        
        // 添加底部按钮区域
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        const closeModalBtn = document.createElement('button');
        closeModalBtn.className = 'settings-btn secondary';
        closeModalBtn.textContent = '关闭';
        closeModalBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modalFooter.appendChild(closeModalBtn);
        
        // 组装模态框
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        
        modal.appendChild(modalContent);
        
        // 添加到文档
        document.body.appendChild(modal);
        
        return modal;
    },
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
    
    // 确保立即显示积分（再次调用确保即使初始化过程中有延迟也能正确显示）
    setTimeout(() => {
        UIManager.updateHeaderPoints();
    }, 100);
    
    // 确保专注模式和轻松一刻视图状态一致
    setTimeout(() => {
        if (window.FocusManager) {
            // 检查是否处于计时状态（active且有startTime）
            const isTimerActive = FocusManager.status === 'active' && FocusManager.startTime !== null;
            
            // 设置全局CSS变量
            document.documentElement.style.setProperty('--focus-timer-active', isTimerActive ? 'true' : 'false');
            
            // 根据计时状态设置轻松一刻菜单和视图
            UIManager.disableRelaxButton(isTimerActive);
            
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                if (isTimerActive) {
                    // 在计时状态下隐藏轻松一刻视图
                    relaxView.classList.remove('active');
                    relaxView.style.display = 'none';
                } else {
                    // 在非计时状态下恢复轻松一刻视图
                    relaxView.style.display = '';
                }
            }
            
            // 为轻松一刻按钮重新绑定点击事件
            const relaxNavBtn = document.getElementById('nav-relax');
            if (relaxNavBtn) {
                // 清除旧的事件监听器（防止重复绑定）
                const newBtn = relaxNavBtn.cloneNode(true);
                if (relaxNavBtn.parentNode) {
                    relaxNavBtn.parentNode.replaceChild(newBtn, relaxNavBtn);
                }
                
                // 添加新的事件监听器
                newBtn.addEventListener('click', () => {
                    // 再次检查计时状态，确保最新
                    const isTimerActive = window.FocusManager && 
                        FocusManager.status === 'active' && 
                        FocusManager.startTime !== null;
                    
                    if (isTimerActive) {
                        UIManager.showNotification('计时进行中，无法进入轻松一刻');
                    } else {
                        UIManager.switchView('relax');
                    }
                });
            }
        }
    }, 100);
});

// 导出
window.UIManager = UIManager; 

// 头像上传功能
function initAvatarUpload() {
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (!file) return;

        // 检查文件类型
        if (!file.type.match('image.*')) {
            showToast('请选择图片文件（JPG、PNG格式）', 'error');
            return;
        }

        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            showToast('文件大小不能超过20MB', 'error');
            return;
        }

        // 预览图片
        const reader = new FileReader();
        reader.onload = function(e) {
            avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 在页面加载完成后初始化头像上传功能
document.addEventListener('DOMContentLoaded', function() {
    initAvatarUpload();
}); 