/**
 * 专注模式管理模块
 * 负责专注时间的计时和提醒功能
 */

const FocusManager = {
    // 专注模式状态
    _status: 'inactive', // inactive, active, paused, completed
    
    get status() {
        return this._status;
    },
    
    set status(value) {
        this._status = value;
        
        // 更新CSS变量，标记专注模式状态
        document.documentElement.style.setProperty('--focus-mode', value);
        document.documentElement.style.setProperty('--focus-active', value === 'active' ? 'true' : 'false');
        
        // 添加对dataset的设置，与CSS变量保持一致
        document.documentElement.dataset.focusMode = value;
        document.documentElement.dataset.focusActive = value === 'active' ? 'true' : 'false';
        
        // 检查是否在计时状态（有startTime且status为active）
        const isTimerActive = value === 'active' && this.startTime !== null;
        
        // 根据计时状态更新轻松一刻按钮和视图
        if (window.UIManager) {
            // 只在计时状态下禁用轻松一刻
            if (isTimerActive) {
                // 如果处于计时状态，隐藏轻松一刻视图
                const relaxView = document.getElementById('relax');
                if (relaxView) {
                    relaxView.classList.remove('active');
                    relaxView.style.display = 'none'; // 强制隐藏
                    // 如果当前在轻松一刻视图，切换到专注模式视图
                    if (relaxView.classList.contains('active')) {
                        window.UIManager.switchView('focus');
                    }
                }
                
                // 禁用轻松一刻导航按钮
                const relaxNavBtn = document.getElementById('nav-relax');
                if (relaxNavBtn) {
                    relaxNavBtn.classList.add('disabled');
                    relaxNavBtn.style.pointerEvents = 'none';
                    relaxNavBtn.style.opacity = '0.5';
                    relaxNavBtn.style.filter = 'grayscale(100%)';
                    relaxNavBtn.title = '计时进行中，无法进入轻松一刻';
                }
                
                // 通知UIManager禁用按钮
                UIManager.disableRelaxButton(true);
            } else if (value === 'inactive' || value === 'completed') {
                // 恢复轻松一刻导航按钮和视图显示
                const relaxNavBtn = document.getElementById('nav-relax');
                if (relaxNavBtn) {
                    relaxNavBtn.classList.remove('disabled');
                    relaxNavBtn.style.pointerEvents = 'auto';
                    relaxNavBtn.style.opacity = '1';
                    relaxNavBtn.style.filter = 'none';
                    relaxNavBtn.title = '';
                }
                
                // 恢复轻松一刻视图的显示样式
                const relaxView = document.getElementById('relax');
                if (relaxView) {
                    relaxView.style.display = ''; // 移除强制隐藏
                }
                
                // 通知UIManager启用按钮
                UIManager.disableRelaxButton(false);
            }
        }
    },
    
    // 定时器ID
    timer: null,
    
    // 专注时间（秒）
    focusTime: 25 * 60,
    
    // 休息时间（秒）
    breakTime: 5 * 60,
    
    // 长休息时间（秒）
    longBreakTime: 15 * 60,
    
    // 当前进行的专注次数
    focusCount: 0,
    
    // 完成长休息的专注次数阈值
    longBreakThreshold: 4,
    
    // 当前剩余时间（秒）
    remainingTime: 0,
    
    // 开始时间
    startTime: null,
    
    // 暂停时的剩余时间
    pausedTime: null,
    
    isPaused: false,
    lastPauseTime: null,
    
    // 声音启用状态
    soundsEnabled: true,
    
    // 通知启用状态
    notificationsEnabled: true,
    
    // 自动开始休息
    autoStartBreak: true,
    
    // 严格模式
    strictMode: false,
    
    /**
     * 加载任务选项到任务选择器
     */
    loadTaskOptions() {
        if (!this.elements.taskSelector) return;
        
        // 清空现有选项，仅保留默认选项
        while (this.elements.taskSelector.options.length > 1) {
            this.elements.taskSelector.remove(1);
        }
        
        // 获取事件列表
        const events = StorageManager.getEvents();
        
        // 如果没有事件，显示提示选项
        if (!events || events.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.text = '没有可用的事件';
            option.disabled = true;
            this.elements.taskSelector.add(option);
            return;
        }
        
        // 按照开始时间排序事件，最近的事件排在前面
        events.sort((a, b) => {
            if (!a.startTime && !b.startTime) return 0;
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return new Date(b.startTime) - new Date(a.startTime);
        });
        
        // 添加事件选项
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            
            // 格式化显示文本，显示事件名称和日期
            let optionText = event.name;
            if (event.startTime) {
                const startDate = new Date(event.startTime);
                const dateStr = startDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                optionText += ` (${dateStr})`;
            }
            
            option.text = optionText;
            this.elements.taskSelector.add(option);
        });
        
        // 如果有以前选择的任务，尝试恢复选择
        const data = StorageManager.getData();
        if (data.lastSelectedTask) {
            // 检查该任务是否仍然存在
            const taskExists = Array.from(this.elements.taskSelector.options).some(option => option.value === data.lastSelectedTask);
            if (taskExists) {
                this.elements.taskSelector.value = data.lastSelectedTask;
            }
        }
        
        // 无论是否恢复了之前的选择，都更新任务专注时间显示
        this.updateTaskFocusTimeDisplay();
    },
    
    /**
     * 初始化专注模式管理器
     */
    init() {
        console.log('初始化专注模式管理器');
        
        // 缓存元素
        this.cacheElements();
        
        // 加载设置
        this.loadSettings();
        
        // 加载任务选项
        this.loadTaskOptions();
        
        // 检查是否有保存的专注状态
        const savedState = this.checkSavedState();
        
        if (savedState.active) {
            console.log('发现正在进行的专注会话，恢复状态');
            
            // 恢复保存的状态
            this._status = savedState.status;
            this.startTime = savedState.startTime ? new Date(savedState.startTime) : null;
            this.pausedTime = savedState.pausedTime || 0;
            this.isPaused = savedState.isPaused || false;
            this.lastPauseTime = savedState.lastPauseTime ? new Date(savedState.lastPauseTime) : null;
            
            // 计算剩余时间
            if (this.startTime) {
                const now = new Date();
                const elapsed = Math.floor((now - this.startTime) / 1000) - this.pausedTime;
                this.remainingTime = Math.max(0, this.focusTime - elapsed);
                
                // 如果剩余时间小于等于0，重置专注（可能是之前未正确结束的会话）
                if (this.remainingTime <= 0) {
                    this.resetFocus();
                    this.setupInitialState();
                } else {
                    // 设置CSS变量标记专注模式计时已开始
                    document.documentElement.style.setProperty('--focus-timer-active', 'true');
                    document.documentElement.dataset.focusTimerActive = 'true';
                    
                    // 如果之前是暂停状态
                    if (this.status === 'paused') {
                        this.updateUIForPaused();
                    } else {
                        // 重新启动计时器
                        clearInterval(this.timer);
                        this.timer = setInterval(() => {
                            if (!this.isPaused) {
                                this.updateTimer();
                            }
                        }, 1000);
                        
                        this.updateUIForActive();
                        
                        // 显示状态指示器
                        const statusIndicator = document.getElementById('focus-background-status');
                        if (statusIndicator) {
                            statusIndicator.style.display = 'flex';
                        }
                    }
                }
            } else {
                // 如果没有有效的开始时间，重置状态
                this.resetFocus();
                this.setupInitialState();
            }
        } else {
            // 没有保存的会话，设置初始状态
            this.setupInitialState();
        }
        
        // 绑定事件 - 必须在加载设置之后绑定，确保事件处理能访问到正确的设置
        this.bindEvents();
        
        // 绑定悬浮指示器
        this.bindFloatingIndicator();
        
        // 更新显示
        this.updateTimerDisplay();
        this.updateAnalogClock();
        this.updateFocusTimeDisplay();

        // 确保专注模式视图显示
        const focusModeView = document.getElementById('focus-mode');
        if (focusModeView) {
            focusModeView.classList.add('active');
        }

        // 激活专注模式导航按钮
        const focusNavBtn = document.getElementById('nav-focus');
        if (focusNavBtn) {
            focusNavBtn.classList.add('active');
        }
    },
    
    /**
     * 设置初始状态
     */
    setupInitialState() {
        // 设置CSS变量标记专注模式已激活但计时未开始
        document.documentElement.style.setProperty('--focus-mode', 'active');
        document.documentElement.style.setProperty('--focus-active', 'true');
        document.documentElement.style.setProperty('--focus-timer-active', 'false');
        
        // 同时设置dataset属性
        document.documentElement.dataset.focusMode = 'active';
        document.documentElement.dataset.focusActive = 'true';
        document.documentElement.dataset.focusTimerActive = 'false';
        
        // 初始化轻松一刻状态 - 初始化时默认不在计时状态，保持轻松一刻按钮可用
        const relaxNavBtn = document.getElementById('nav-relax');
        if (relaxNavBtn) {
            relaxNavBtn.classList.remove('disabled');
            relaxNavBtn.style.pointerEvents = 'auto';
            relaxNavBtn.style.opacity = '1';
            relaxNavBtn.style.filter = 'none';
            relaxNavBtn.title = '';
        }
        
        // 首先隐藏轻松一刻视图，但不禁用按钮
        const relaxView = document.getElementById('relax');
        if (relaxView) {
            relaxView.classList.remove('active');
            // 允许显示，但默认不激活
            relaxView.style.display = '';
        }

        // 通知 UIManager 不禁用按钮（因为没有开始计时）
        if (window.UIManager) {
            UIManager.disableRelaxButton(false);
        }
        
        // 设置初始状态
        this._status = 'inactive';
        this.timer = null;
        this.focusCount = 0;
        this.remainingTime = this.focusTime;
        this.startTime = null;
        this.pausedTime = null;
        
        // 加载已保存的专注次数
        const data = StorageManager.getData();
        if (data && data.focusCount) {
            this.focusCount = data.focusCount;
        }
        
        // 更新UI
        this.updateUIForInactive();
    },
    
    /**
     * 检查保存的专注状态
     * @returns {Object} 包含活动状态和相关信息的对象
     */
    checkSavedState() {
        const result = {
            active: false,
            status: 'inactive',
            startTime: null,
            pausedTime: 0,
            isPaused: false,
            lastPauseTime: null
        };
        
        // 从本地存储中读取专注状态
        try {
            const data = StorageManager.getData();
            if (data && data.focusState) {
                const state = data.focusState;
                
                // 检查状态是否有效（active或paused）
                if (state.status === 'active' || state.status === 'paused') {
                    result.active = true;
                    result.status = state.status;
                    result.startTime = state.startTime;
                    result.pausedTime = state.pausedTime || 0;
                    result.isPaused = state.isPaused || false;
                    result.lastPauseTime = state.lastPauseTime;
                }
            }
        } catch (error) {
            console.error('读取专注状态失败', error);
        }
        
        return result;
    },
    
    /**
     * 保存当前专注状态
     */
    saveCurrentState() {
        try {
            const data = StorageManager.getData();
            
            // 准备要保存的状态对象
            const focusState = {
                status: this.status,
                startTime: this.startTime ? this.startTime.toISOString() : null,
                pausedTime: this.pausedTime,
                isPaused: this.isPaused,
                lastPauseTime: this.lastPauseTime ? this.lastPauseTime.toISOString() : null
            };
            
            // 更新数据对象
            data.focusState = focusState;
            
            // 保存到存储
            StorageManager.saveData(data);
        } catch (error) {
            console.error('保存专注状态失败', error);
        }
    },
    
    /**
     * 缓存DOM元素
     */
    cacheElements() {
        // 创建elements对象
        this.elements = {};
        
        // 容器
        this.elements.container = document.querySelector('.focus-container');
        
        // 计时器显示
        this.elements.minutesDisplay = document.getElementById('timer-minutes');
        this.elements.secondsDisplay = document.getElementById('timer-seconds');
        
        // 控制按钮
        this.elements.startButton = document.getElementById('start-timer');
        this.elements.pauseButton = document.getElementById('pause-timer');
        this.elements.resetButton = document.getElementById('reset-timer');
        
        // 任务选择器
        this.elements.taskSelector = document.getElementById('focus-task');
        
        // 统计显示
        this.elements.todayFocusTime = document.getElementById('today-focus-time');
        this.elements.totalFocusTime = document.getElementById('total-focus-time');
        
        // 模拟时钟
        this.elements.clockHour = document.querySelector('.clock-hour');
        this.elements.clockMinute = document.querySelector('.clock-minute');
        this.elements.clockSecond = document.querySelector('.clock-second');
        
        // 检查必要元素是否存在
        if (!this.elements.minutesDisplay || !this.elements.secondsDisplay) {
            console.warn('未找到计时器显示元素');
        }
        
        if (!this.elements.startButton || !this.elements.pauseButton || !this.elements.resetButton) {
            console.warn('未找到控制按钮');
        }
    },
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        if (!this.elements) return;
        
        // 绑定开始按钮事件
        if (this.elements.startButton) {
            this.elements.startButton.addEventListener('click', () => {
                this.startFocus();
            });
        }
        
        // 绑定暂停按钮事件
        if (this.elements.pauseButton) {
            this.elements.pauseButton.addEventListener('click', () => {
                if (this.status === 'active') {
                    this.pauseFocus();
                } else if (this.status === 'paused') {
                    this.resumeFocus();
                }
            });
        }
        
        // 绑定重置按钮事件
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                this.resetFocus();
            });
        }
        
        // 绑定任务选择器变更事件
        if (this.elements.taskSelector) {
            this.elements.taskSelector.addEventListener('change', () => {
                const selectedTask = this.elements.taskSelector.value;
                
                // 保存选择的任务
                if (selectedTask) {
                    const data = StorageManager.getData();
                    data.lastSelectedTask = selectedTask;
                    StorageManager.saveData(data);
                }
                
                // 更新任务专注时间显示
                this.updateTaskFocusTimeDisplay();
            });
        }
    },
    
    /**
     * 绑定悬浮指示器事件
     */
    bindFloatingIndicator() {
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        if (!floatingIndicator) return;
        
        // 清除之前的事件监听器
        const newIndicator = floatingIndicator.cloneNode(true);
        floatingIndicator.parentNode.replaceChild(newIndicator, floatingIndicator);
        
        // 点击悬浮指示器切换回专注模式视图
        newIndicator.addEventListener('click', () => {
            if (window.UIManager) {
                UIManager.switchView('focus');
            }
        });
    },
    
    /**
     * 加载设置
     */
    loadSettings() {
        const settings = StorageManager.getSettings();
        
        // 更新专注模式设置
        if (settings) {
            this.soundsEnabled = settings.sounds !== false;
            this.notificationsEnabled = settings.notifications !== false;
            this.autoStartBreak = settings.autoStartBreak !== false;
            this.strictMode = settings.strictMode === true;
        }
        
        // 重置剩余时间
        this.remainingTime = this.focusTime;
        
        // 更新显示
        this.updateTimerDisplay();
        this.updateUIForCurrentState();
    },
    
    /**
     * 设置声音开关
     * @param {Boolean} enabled 是否启用声音
     */
    setSoundsEnabled(enabled) {
        this.soundsEnabled = enabled;
        const settings = StorageManager.getSettings();
        settings.sounds = enabled;
        StorageManager.updateSettings(settings);
    },
    
    /**
     * 设置通知开关
     * @param {Boolean} enabled 是否启用通知
     */
    setNotificationsEnabled(enabled) {
        this.notificationsEnabled = enabled;
        const settings = StorageManager.getSettings();
        settings.notifications = enabled;
        StorageManager.updateSettings(settings);
    },
    
    /**
     * 设置自动开始休息
     * @param {Boolean} enabled 是否启用
     */
    setAutoStartBreak(enabled) {
        this.autoStartBreak = enabled;
        const settings = StorageManager.getSettings();
        settings.autoStartBreak = enabled;
        StorageManager.updateSettings(settings);
    },
    
    /**
     * 设置严格模式
     * @param {Boolean} enabled 是否启用
     */
    setStrictMode(enabled) {
        this.strictMode = enabled;
        const settings = StorageManager.getSettings();
        settings.strictMode = enabled;
        StorageManager.updateSettings(settings);
    },
    
    /**
     * 开始专注
     */
    startFocus() {
        if (this.status !== 'inactive') return;
        
        console.log('开始专注');
        
        // 加载最新的设置
        this.loadSettings();
        
        // 设置CSS变量标记专注模式计时开始
        document.documentElement.style.setProperty('--focus-timer-active', 'true');
        document.documentElement.dataset.focusTimerActive = 'true';
        
        this.status = 'active';
        this.isPaused = false;
        this.startTime = new Date();
        this.remainingTime = this.focusTime;
        this.pausedTime = 0;
        
        // 记录开始时间
        this.logFocusStart();
        
        // 更新UI
        this.updateUIForActive();
        
        // 确保轻松一刻视图被隐藏
        const relaxView = document.getElementById('relax');
        if (relaxView) {
            relaxView.classList.remove('active');
            relaxView.style.display = 'none';
            // 如果当前在轻松一刻视图，切换到专注模式视图
            if (relaxView.classList.contains('active')) {
                window.UIManager?.switchView('focus');
            }
        }
        
        // 禁用轻松一刻按钮 - 只在计时进行时禁用
        if (window.UIManager) {
            UIManager.disableRelaxButton(true);
            
            // 设置轻松一刻按钮为灰色
            const relaxNavBtn = document.getElementById('nav-relax');
            if (relaxNavBtn) {
                relaxNavBtn.classList.add('disabled');
                relaxNavBtn.style.pointerEvents = 'none';
                relaxNavBtn.style.opacity = '0.5';
                relaxNavBtn.style.filter = 'grayscale(100%)';
                relaxNavBtn.title = '计时进行中，轻松一刻不可用';
            }
        }
        
        // 开始计时
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.updateTimer();
            }
        }, 1000);
        
        // 发送通知
        this.sendNotification('专注开始', '保持专注，远离干扰');
        
        // 更新模拟时钟
        this.updateAnalogClock();
        
        // 显示状态指示器
        const statusIndicator = document.getElementById('focus-background-status');
        if (statusIndicator) {
            statusIndicator.style.display = 'flex';
        }
        
        // 保存当前状态
        this.saveCurrentState();
    },
    
    /**
     * 暂停专注
     */
    pauseFocus() {
        if (this.status !== 'active' || this.isPaused) return;
        
        // 检查是否在严格模式下，严格模式下不允许暂停
        if (this.strictMode) {
            console.log('严格模式已启用，无法暂停');
            // 播放错误音效
            this.playSound('error');
            // 显示提示
            if (window.UIManager) {
                UIManager.showNotification('严格模式已启用，无法暂停计时');
            }
            return;
        }
        
        console.log('暂停专注');
        
        // 停止计时器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 更新状态
        this.isPaused = true;
        this.lastPauseTime = new Date();
        this.status = 'paused';
        
        // 更新UI
        this.updateUIForPaused();
        
        // 播放暂停音效
        this.playSound('pause');
        
        // 保存当前状态
        this.saveCurrentState();
        
        // 更新页面标题
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${formattedTime} - 已暂停 | 有数`;
    },
    
    /**
     * 恢复专注
     */
    resumeFocus() {
        if (this.status !== 'paused' || !this.isPaused) return;
        
        console.log('恢复专注');
        
        // 更新状态
        this.isPaused = false;
        this.status = 'active';
        
        // 计算暂停的时间
        if (this.lastPauseTime) {
            const now = new Date();
            const pauseDuration = Math.floor((now - this.lastPauseTime) / 1000); // 确保使用整数秒
            this.pausedTime = (this.pausedTime || 0) + pauseDuration;
            console.log(`暂停时间: ${pauseDuration}秒，总暂停时间: ${this.pausedTime}秒`);
        }
        
        // 重新启动计时器
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.updateTimer();
            }
        }, 1000);
        
        // 更新UI
        this.updateUIForActive();
        
        // 确保轻松一刻视图被隐藏
        const relaxView = document.getElementById('relax');
        if (relaxView) {
            relaxView.classList.remove('active');
            // 如果当前在轻松一刻视图，切换到专注模式视图
            if (relaxView.classList.contains('active')) {
                window.UIManager?.switchView('focus');
            }
        }
        
        // 播放恢复音效
        this.playSound('resume');
        
        // 保存当前状态
        this.saveCurrentState();
        
        // 更新页面标题
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${formattedTime} - 专注中 | 有数`;
    },
    
    /**
     * 重置专注
     */
    resetFocus() {
        console.log('重置专注');
        
        // 设置CSS变量标记计时器已停止
        document.documentElement.style.setProperty('--focus-timer-active', 'false');
        // 同时重置dataset属性
        document.documentElement.dataset.focusTimerActive = 'false';
        
        // 停止计时器
        clearInterval(this.timer);
        
        // 如果当前处于活动状态且已经开始计时，记录已经完成的时间
        if ((this.status === 'active' || this.status === 'paused') && this.startTime) {
            // 计算已经专注的时间（秒）
            const now = new Date();
            const totalElapsedSeconds = Math.floor((now - this.startTime) / 1000);
            const focusedSeconds = totalElapsedSeconds - (this.pausedTime || 0);
            
            console.log(`总经过时间: ${totalElapsedSeconds}秒，暂停时间: ${this.pausedTime || 0}秒，实际专注: ${focusedSeconds}秒`);
            
            // 只有当专注时间超过30秒时才记录
            if (focusedSeconds > 30) {
                const data = StorageManager.getData();
                if (data) {
                    // 更新专注时间统计
                    data.todayFocusTime = (data.todayFocusTime || 0) + focusedSeconds;
                    data.totalFocusTime = (data.totalFocusTime || 0) + focusedSeconds;
                    
                    // 更新日志
                    if (data.focusLogs && data.focusLogs.length > 0) {
                        const lastLog = data.focusLogs[data.focusLogs.length - 1];
                        lastLog.endTime = now.toISOString();
                        lastLog.completed = false;
                        lastLog.actualDuration = focusedSeconds;
                        lastLog.pausedDuration = this.pausedTime || 0;
                    }
                    
                    // 保存数据
                    StorageManager.saveData(data);
                    
                    // 更新专注时间显示
                    this.updateFocusTimeDisplay();

                    // 更新任务专注时间
                    this.updateTaskFocusTimeDisplay();
                }
            }
        }
        
        // 隐藏后台状态指示器和悬浮指示器
        const statusIndicator = document.getElementById('focus-background-status');
        if (statusIndicator) {
            statusIndicator.style.display = 'none';
        }
        
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        if (floatingIndicator) {
            floatingIndicator.style.display = 'none';
        }
        
        // 重置状态
        this.status = 'inactive';
        this.startTime = null;
        this.pausedTime = null;
        this.remainingTime = this.focusTime;
        this.isPaused = false;
        
        // 更新页面标题
        document.title = '有数';
        
        // 更新UI
        this.updateUIForInactive();
        
        // 取消禁用轻松一刻按钮和视图
        if (window.UIManager) {
            UIManager.disableRelaxButton(false);
            
            // 恢复轻松一刻按钮
            const relaxNavBtn = document.getElementById('nav-relax');
            if (relaxNavBtn) {
                relaxNavBtn.classList.remove('disabled');
                relaxNavBtn.style.pointerEvents = 'auto';
                relaxNavBtn.style.opacity = '1';
                relaxNavBtn.style.filter = 'none';
                relaxNavBtn.title = '';
            }
            
            // 恢复轻松一刻视图的显示
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.style.display = '';
            }
        }
        
        // 更新选择器状态
        if (this.elements.taskSelector) {
            this.elements.taskSelector.disabled = false;
        }
        
        // 更新计时器显示
        this.updateTimerDisplay();
        
        // 始终更新任务专注时间显示，即使没有足够的时间记录
        this.updateTaskFocusTimeDisplay();
        
        // 清除保存的状态
        try {
            const data = StorageManager.getData();
            if (data) {
                // 删除保存的专注状态
                delete data.focusState;
                StorageManager.saveData(data);
            }
        } catch (error) {
            console.error('清除专注状态失败', error);
        }
    },
    
    /**
     * 完成专注
     */
    completeFocus() {
        if (this.status !== 'active') return;
        
        // 停止计时器
        clearInterval(this.timer);
        
        // 设置状态为已完成
        this.status = 'completed';
        
        // 计算总经过时间（毫秒）
        const totalElapsedMs = Date.now() - (this.startTime ? this.startTime.getTime() : 0);
        
        // 计算专注时长（分钟），需要减去暂停的时间
        const pausedMinutes = Math.floor((this.pausedTime || 0) / 60);
        const totalMinutes = Math.floor(totalElapsedMs / 60000);
        const duration = Math.max(totalMinutes - pausedMinutes, 0);
        
        console.log(`专注完成 - 总时间: ${totalMinutes}分钟，暂停: ${pausedMinutes}分钟，实际专注: ${duration}分钟`);
        
        // 记录完成并更新时间统计
        this.logFocusComplete();
        
        // 更新专注统计
        this.updateFocusStats(duration);
        
        // 更新专注时间记录和获取积分信息（仅任务相关的逻辑）
        let pointsInfo = null;
        if (this.elements.taskSelector) {
            pointsInfo = StorageManager.updateFocusTime(duration, this.elements.taskSelector.value);
            
            // 更新任务完成状态
            TaskManager.toggleTaskCompletion(this.elements.taskSelector.value);
        }
        
        // 显示完成通知
        if (pointsInfo) {
            let notificationText = `专注完成！\n`;
            notificationText += `本次专注：${duration}分钟\n`;
            notificationText += `获得积分：${pointsInfo.totalPoints}分\n`;
            notificationText += `（基础${pointsInfo.basePoints}分，连续奖励${pointsInfo.streakBonus}分）\n`;
            notificationText += `今日累计：${pointsInfo.todayDuration}分钟，${pointsInfo.todayPoints}分`;
            
            UIManager.showNotification(notificationText);
        } else {
            UIManager.showNotification('专注完成！');
        }
        
        // 播放完成音效
        this.playCompleteSound();
        
        // 显示成就
        this.checkAchievements(duration);
        
        // 更新专注时间显示
        this.updateFocusTimeDisplay();

        // 显示继续专注的选项
        if (confirm('是否继续专注？')) {
            // 重置计时器但保持当前任务
            this.remainingTime = this.focusTime;
            this.startTime = new Date();
            this.isPaused = false;
            
            // 更新状态
            this.status = 'active';
            
            // 开始新的计时
            this.timer = setInterval(() => {
                if (!this.isPaused) {
                    this.updateTimer();
                }
            }, 1000);
            
            // 更新UI
            this.updateUIForActive();
        } else {
            // 如果用户选择不继续，则重置状态
            this.resetFocus();
        }
    },
    
    /**
     * 更新专注统计
     * @param {number} duration 专注时长（分钟）
     */
    updateFocusStats(duration) {
        const stats = this.getFocusStats();
        
        // 确保duration是有效的数字
        if (typeof duration !== 'number' || isNaN(duration)) {
            console.error('无效的专注时长:', duration);
            return;
        }
        
        // 更新今日专注时间（转换为分钟）
        const today = new Date().toISOString().split('T')[0];
        if (!stats.dailyStats[today]) {
            stats.dailyStats[today] = 0;
        }
        stats.dailyStats[today] += duration;
        
        // 更新总专注时间（转换为分钟）
        stats.totalFocusTime = (stats.totalFocusTime || 0) + duration;
        
        // 更新最长专注时间
        if (duration > (stats.longestFocusTime || 0)) {
            stats.longestFocusTime = duration;
        }
        
        // 更新专注次数
        stats.totalFocusSessions = (stats.totalFocusSessions || 0) + 1;
        
        // 保存统计
        this.saveFocusStats(stats);
        
        // 更新显示
        this.updateFocusDisplay();
    },
    
    /**
     * 获取专注统计数据
     * @returns {Object} 统计数据
     */
    getFocusStats() {
        const data = StorageManager.getData();
        if (!data.focusStats) {
            data.focusStats = {
                dailyStats: {},
                totalFocusTime: 0,
                longestFocusTime: 0,
                totalFocusSessions: 0
            };
            StorageManager.saveData(data);
        }
        return data.focusStats;
    },
    
    /**
     * 保存专注统计数据
     * @param {Object} stats 统计数据
     */
    saveFocusStats(stats) {
        const data = StorageManager.getData();
        data.focusStats = stats;
        
        // 确保今日和总专注时间也被更新（转换为秒）
        const today = new Date().toISOString().split('T')[0];
        if (stats.dailyStats && stats.dailyStats[today]) {
            data.todayFocusTime = Math.floor(stats.dailyStats[today] * 60);
        }
        if (stats.totalFocusTime) {
            data.totalFocusTime = Math.floor(stats.totalFocusTime * 60);
        }
        
        StorageManager.saveData(data);
    },
    
    /**
     * 更新专注显示
     */
    updateFocusDisplay() {
        // 更新专注时间显示
        this.updateFocusTimeDisplay();
    },
    
    /**
     * 更新计时器
     */
    updateTimer() {
        if (this.status !== 'active' || this.isPaused) return;
        
        // 计算剩余时间，考虑暂停时间
        const now = new Date();
        const totalElapsed = Math.floor((now - this.startTime) / 1000);
        const actualElapsed = totalElapsed - (this.pausedTime || 0);
        this.remainingTime = Math.max(0, this.focusTime - actualElapsed);
        
        // 更新显示
        this.updateTimerDisplay();
        this.updateProgressBar();
        this.updateAnalogClock();
        
        // 每分钟保存一次状态（当秒数为0时）
        const seconds = this.remainingTime % 60;
        if (seconds === 0) {
            this.saveCurrentState();
        }
        
        // 检查是否完成
        if (this.remainingTime <= 0) {
            this.completeFocus();
        }
    },
    
    /**
     * 更新计时器显示
     */
    updateTimerDisplay() {
        if (!this.elements.minutesDisplay || !this.elements.secondsDisplay) return;
        
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        
        // 更新主计时器显示
        this.elements.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.elements.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
        
        // 更新悬浮指示器时间
        const floatingTimer = document.getElementById('floating-timer');
        if (floatingTimer) {
            floatingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 更新页面标题以显示剩余时间
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${formattedTime} - 专注中 | 有数`;
    },
    
    /**
     * 更新进度条
     */
    updateProgressBar(progress) {
        const progressBar = document.querySelector('.focus-progress-bar');
        if (!progressBar) return;
        
        if (typeof progress === 'undefined') {
            // 计算进度
            const total = this.focusTime;
            const remaining = this.remainingTime;
            progress = ((total - remaining) / total) * 100;
        }
        
        progressBar.style.width = `${progress}%`;
    },
    
    /**
     * 更新模拟时钟
     */
    updateAnalogClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // 计算角度（加入毫秒以实现平滑动画）
        const secondDegrees = ((seconds + milliseconds / 1000) / 60) * 360;
        const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
        const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

        // 应用变换
        this.elements.clockHour.style.transform = `rotate(${hourDegrees}deg)`;
        this.elements.clockMinute.style.transform = `rotate(${minuteDegrees}deg)`;
        this.elements.clockSecond.style.transform = `rotate(${secondDegrees}deg)`;

        // 使用requestAnimationFrame实现平滑动画
        requestAnimationFrame(() => this.updateAnalogClock());
    },
    
    /**
     * 更新专注时间显示
     */
    updateFocusTimeDisplay() {
        if (!this.elements.todayFocusTime || !this.elements.totalFocusTime) return;
        
        const data = StorageManager.getData();
        if (!data) return;
        
        // 更新今日专注时间
        const todayMinutes = Math.floor((data.todayFocusTime || 0) / 60);
        this.elements.todayFocusTime.textContent = `${todayMinutes}分钟`;
        
        // 更新总专注时间
        const totalMinutes = Math.floor((data.totalFocusTime || 0) / 60);
        this.elements.totalFocusTime.textContent = `${totalMinutes}分钟`;
    },
    
    /**
     * 更新UI为活动状态
     */
    updateUIForActive() {
        if (!this.elements) return;
        
        // 更新容器状态
        this.elements.container.classList.remove('inactive', 'paused', 'completed');
        this.elements.container.classList.add('active');
        
        // 更新按钮状态
        if (this.elements.startButton) {
            this.elements.startButton.style.display = 'none';
        }
        
        if (this.elements.pauseButton) {
            this.elements.pauseButton.style.display = 'inline-block';
            this.elements.pauseButton.textContent = '暂停';
            
            // 根据严格模式设置暂停按钮状态
            if (this.strictMode) {
                this.elements.pauseButton.disabled = true;
                this.elements.pauseButton.style.opacity = '0.5';
                this.elements.pauseButton.style.cursor = 'not-allowed';
                this.elements.pauseButton.title = '严格模式已启用，无法暂停';
            } else {
                this.elements.pauseButton.disabled = false;
                this.elements.pauseButton.style.opacity = '1';
                this.elements.pauseButton.style.cursor = 'pointer';
                this.elements.pauseButton.title = '';
            }
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.style.display = 'inline-block';
        }
        
        // 更新进度条
        if (this.remainingTime && this.focusTime) {
            const progress = 1 - (this.remainingTime / this.focusTime);
            this.updateProgressBar(progress);
        }
        
        // 更新页面标题
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${formattedTime} - 专注进行中`;
        
        // 更新动画
        document.documentElement.style.setProperty('--focus-timer-active', 'true');
        document.documentElement.dataset.focusTimerActive = 'true';
        
        // 禁用轻松一刻按钮
        const relaxNavBtn = document.getElementById('nav-relax');
        if (relaxNavBtn) {
            relaxNavBtn.classList.add('disabled');
            relaxNavBtn.style.pointerEvents = 'none';
            relaxNavBtn.style.opacity = '0.5';
            relaxNavBtn.style.filter = 'grayscale(100%)';
            relaxNavBtn.title = '计时进行中，轻松一刻不可用';
        }
        
        // 完全隐藏轻松一刻视图
        const relaxView = document.getElementById('relax');
        if (relaxView) {
            relaxView.classList.remove('active');
            relaxView.style.display = 'none';
        }
    },
    
    /**
     * 更新UI为暂停状态
     */
    updateUIForPaused() {
        if (!this.elements) return;
        
        // 更新容器状态
        this.elements.container.classList.remove('inactive', 'active', 'completed');
        this.elements.container.classList.add('paused');
        
        // 更新按钮状态
        if (this.elements.startButton) {
            this.elements.startButton.style.display = 'inline-block';
            this.elements.startButton.textContent = '继续';
        }
        
        if (this.elements.pauseButton) {
            this.elements.pauseButton.style.display = 'none';
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.style.display = 'inline-block';
        }
        
        // 更新进度条样式
        const progressBar = document.querySelector('.focus-progress-bar');
        if (progressBar) {
            progressBar.classList.add('paused');
        }
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--focus-timer-active', 'false');
        document.documentElement.dataset.focusTimerActive = 'false';
    },
    
    /**
     * 更新UI为完成状态
     */
    updateUIForCompleted() {
        if (this.elements.startButton) this.elements.startButton.style.display = 'inline-block';
        if (this.elements.pauseButton) this.elements.pauseButton.style.display = 'none';
        if (this.elements.resetButton) this.elements.resetButton.style.display = 'none';
        
        // 移除所有状态类
        const container = document.querySelector('.focus-container');
        if (container) {
            container.classList.remove('active', 'paused', 'completed');
        }
    },
    
    /**
     * 更新UI为非活动状态
     */
    updateUIForInactive() {
        if (this.elements.startButton) {
            this.elements.startButton.style.display = 'inline-block';
            this.elements.startButton.textContent = '开始专注';
        }
        if (this.elements.pauseButton) this.elements.pauseButton.style.display = 'none';
        if (this.elements.resetButton) this.elements.resetButton.style.display = 'none';
        
        // 移除所有状态类
        const container = document.querySelector('.focus-container');
        if (container) {
            container.classList.remove('active', 'paused', 'completed');
        }
    },
    
    /**
     * 发送通知
     * @param {String} title 通知标题
     * @param {String} message 通知内容
     */
    sendNotification(title, message) {
        // 检查设置是否启用通知
        if (!this.notificationsEnabled) {
            console.log('通知已禁用，跳过发送');
            return;
        }
        
        // 使用NotificationManager发送系统通知
        if (window.NotificationManager) {
            NotificationManager.sendNotification(title, message, {
                requireInteraction: true,
                tag: 'focus-notification',
                onClick: () => {
                    // 确保窗口获得焦点
                    window.focus();
                    if (this.status === 'completed') {
                        this.playSound('completed');
                    }
                }
            });
            return;
        }
        
        // 如果NotificationManager不可用，则使用原有方法
        try {
            // 请求通知权限
            if (Notification.permission === 'granted') {
                this._showNotification(title, message);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this._showNotification(title, message);
                    } else {
                        // 如果用户拒绝了权限，使用应用内通知
                        if (window.UIManager) {
                            UIManager.showNotification(`${title}: ${message}`);
                        }
                    }
                });
            } else {
                // 通知被拒绝，使用应用内通知
                if (window.UIManager) {
                    UIManager.showNotification(`${title}: ${message}`);
                }
            }
        } catch (error) {
            console.error('发送通知失败', error);
            
            // 出错时使用应用内通知
            if (window.UIManager) {
                UIManager.showNotification(`${title}: ${message}`);
            }
        }
    },
    
    /**
     * 显示通知 (私有方法)
     * @param {String} title 通知标题
     * @param {String} message 通知内容
     * @private
     */
    _showNotification(title, message) {
        try {
            const notification = new Notification(title, {
                body: message,
                icon: 'assets/notification-icon.png',
                badge: 'assets/notification-badge.png',
                silent: false,
                vibrate: [200, 100, 200],
                requireInteraction: true
            });
            
            // 设置点击事件
            notification.onclick = () => {
                window.focus();
                if (this.status === 'completed') {
                    this.playSound('completed');
                }
                notification.close();
            };
        } catch (error) {
            console.error('创建通知失败', error);
            
            // 使用应用内通知作为备选
            if (window.UIManager) {
                UIManager.showNotification(`${title}: ${message}`);
            }
        }
    },
    
    /**
     * 播放完成音效
     */
    playCompleteSound() {
        try {
            const audio = new Audio('/assets/sounds/complete.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => {
                console.warn('音频播放失败', e);
            });
        } catch (error) {
            console.error('播放音效失败', error);
        }
    },
    
    /**
     * 记录专注开始
     */
    logFocusStart() {
        const data = StorageManager.getData();
        const now = new Date();
        
        // 获取当前选择的任务
        const selectedTask = this.elements.taskSelector ? this.elements.taskSelector.value : null;
        
        // 记录开始时间
        const focusLog = {
            startTime: now.toISOString(),
            duration: this.focusTime,
            task: selectedTask,
            taskId: selectedTask || 'undefined_task'
        };
        
        // 保存到存储
        if (!data.focusLogs) data.focusLogs = [];
        data.focusLogs.push(focusLog);
        
        // 初始化任务的专注时间记录（如果不存在）
        if (!data.taskFocusStats) data.taskFocusStats = {};
        if (selectedTask && !data.taskFocusStats[selectedTask]) {
            data.taskFocusStats[selectedTask] = {
                totalFocusTime: 0,
                focusSessions: 0,
                lastFocusDate: now.toISOString().split('T')[0]
            };
        }
        
        StorageManager.saveData(data);
    },
    
    /**
     * 记录专注完成
     */
    logFocusComplete() {
        const data = StorageManager.getData();
        const now = new Date();
        
        if (data.focusLogs && data.focusLogs.length > 0) {
            // 更新最后一条记录
            const lastLog = data.focusLogs[data.focusLogs.length - 1];
            lastLog.endTime = now.toISOString();
            lastLog.completed = true;
            
            // 计算实际专注时长（秒）
            let focusSeconds = 0;
            if (lastLog.startTime) {
                const startTime = new Date(lastLog.startTime).getTime();
                const endTime = now.getTime();
                focusSeconds = Math.floor((endTime - startTime) / 1000);
                
                // 减去暂停的时间
                if (this.pausedTime) {
                    focusSeconds -= this.pausedTime;
                }
                
                // 确保至少有1秒
                focusSeconds = Math.max(1, focusSeconds);
                
                // 更新持续时间
                lastLog.actualDuration = focusSeconds;
                
                // 更新任务的专注时间统计
                const taskId = lastLog.task || 'undefined_task';
                if (!data.taskFocusStats) data.taskFocusStats = {};
                if (!data.taskFocusStats[taskId]) {
                    data.taskFocusStats[taskId] = {
                        totalFocusTime: 0,
                        focusSessions: 0,
                        lastFocusDate: now.toISOString().split('T')[0]
                    };
                }
                
                // 更新任务专注统计
                data.taskFocusStats[taskId].totalFocusTime += focusSeconds;
                data.taskFocusStats[taskId].focusSessions += 1;
                data.taskFocusStats[taskId].lastFocusDate = now.toISOString().split('T')[0];
                
                // 如果是关联到具体事件的任务，更新事件记录
                if (taskId !== 'undefined_task') {
                    const events = data.events || [];
                    const taskEvent = events.find(e => e.id === taskId);
                    if (taskEvent) {
                        if (!taskEvent.focusStats) {
                            taskEvent.focusStats = {
                                totalFocusTime: 0,
                                focusSessions: 0
                            };
                        }
                        taskEvent.focusStats.totalFocusTime += focusSeconds;
                        taskEvent.focusStats.focusSessions += 1;
                        taskEvent.lastFocusTime = now.toISOString();
                    }
                }
            } else {
                // 如果没有开始时间，使用预设时间
                focusSeconds = this.focusTime;
            }
            
            // 更新专注时间统计
            data.todayFocusTime = (data.todayFocusTime || 0) + focusSeconds;
            data.totalFocusTime = (data.totalFocusTime || 0) + focusSeconds;
            
            // 保存更新
            StorageManager.saveData(data);
            
            // 更新显示
            this.updateFocusTimeDisplay();
            
            // 更新任务专注时间显示
            this.updateTaskFocusTimeDisplay();
        }
    },
    
    /**
     * 更新任务专注时间显示
     */
    updateTaskFocusTimeDisplay() {
        // 获取当前选择的任务
        const selectedTask = this.elements.taskSelector ? this.elements.taskSelector.value : null;
        
        // 获取相关DOM元素
        const taskFocusTimeElement = document.getElementById('task-focus-time');
        const taskFocusSessionsElement = document.getElementById('task-focus-sessions');
        const taskFocusStatsContainer = document.querySelector('.task-focus-stats');
        
        // 如果没有选择任务，显示默认值
        if (!selectedTask) {
            if (taskFocusTimeElement) taskFocusTimeElement.textContent = '0分钟';
            if (taskFocusSessionsElement) taskFocusSessionsElement.textContent = '0';
            // 移除高亮效果
            if (taskFocusStatsContainer) {
                taskFocusStatsContainer.classList.remove('highlighted');
            }
            return;
        }
        
        // 获取存储的数据
        const data = StorageManager.getData();
        
        // 如果没有数据或没有该任务的统计信息，显示默认值
        if (!data || !data.taskFocusStats || !data.taskFocusStats[selectedTask]) {
            if (taskFocusTimeElement) taskFocusTimeElement.textContent = '0分钟';
            if (taskFocusSessionsElement) taskFocusSessionsElement.textContent = '0';
            // 移除高亮效果
            if (taskFocusStatsContainer) {
                taskFocusStatsContainer.classList.remove('highlighted');
            }
            return;
        }
        
        // 获取任务统计数据
        const taskStats = data.taskFocusStats[selectedTask];
        
        // 查找任务名称
        let taskName = "当前任务";
        if (selectedTask !== 'undefined_task') {
            const events = data.events || [];
            const taskEvent = events.find(e => e.id === selectedTask);
            if (taskEvent) {
                taskName = taskEvent.name || "当前任务";
            }
        }
        
        // 更新任务专注时间显示（如果有对应元素）
        if (taskFocusTimeElement) {
            const taskMinutes = Math.floor(taskStats.totalFocusTime / 60);
            taskFocusTimeElement.textContent = `${taskMinutes}分钟`;
        }
        
        // 更新任务专注次数显示（如果有对应元素）
        if (taskFocusSessionsElement) {
            taskFocusSessionsElement.textContent = taskStats.focusSessions;
        }
        
        // 更新统计标签显示任务名称
        const statLabel = taskFocusStatsContainer ? taskFocusStatsContainer.querySelector('.stat-label') : null;
        if (statLabel) {
            statLabel.textContent = `"${taskName}" 专注：`;
        }
        
        // 添加高亮效果表示数据已更新
        if (taskFocusStatsContainer) {
            // 添加高亮类
            taskFocusStatsContainer.classList.add('highlighted');
            
            // 2秒后移除高亮效果
            setTimeout(() => {
                taskFocusStatsContainer.classList.remove('highlighted');
            }, 2000);
        }
    },
    
    /**
     * 根据当前状态更新UI
     */
    updateUIForCurrentState() {
        switch (this.status) {
            case 'active':
                this.updateUIForActive();
                break;
            case 'paused':
                this.updateUIForPaused();
                break;
            case 'completed':
                this.updateUIForCompleted();
                break;
            case 'inactive':
            default:
                this.updateUIForInactive();
                break;
        }
    }
};

// 导出模块
window.FocusManager = FocusManager; 
