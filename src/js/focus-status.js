/**
 * 专注时钟状态显示管理器
 * 在顶部栏显示专注时钟的状态和倒计时
 */
const FocusStatusManager = {
    // 状态枚举
    STATUS: {
        IDLE: 'idle',        // 空闲
        ACTIVE: 'active',    // 专注中
        PAUSED: 'paused',    // 暂停
        COMPLETED: 'completed' // 已完成
    },

    // 配置
    config: {
        updateInterval: 1000, // 更新间隔（毫秒）
        checkInterval: 3000,  // 检查专注状态间隔（毫秒）
        maxEventNameLength: 15, // 事件名称最大显示长度
        immediateCheckDelay: 100 // 页面加载后立即检查的延迟（毫秒）
    },

    // 状态变量
    currentStatus: 'idle',
    currentEvent: null,
    timeLeft: 0,
    updateTimer: null,
    checkTimer: null,
    container: null,
    lastCheckTime: 0,
    _completedTimeout: null, // 新增：用于控制completed状态的自动隐藏

    /**
     * 初始化
     */
    init() {
        this.createStatusContainer();
        this.bindEvents();
        
        // 立即检查专注状态（延迟一点确保其他组件已加载）
        setTimeout(() => {
            this.immediateStatusCheck();
        }, this.config.immediateCheckDelay);
        
        // 启动定期检查
        this.startStatusCheck();
        
        // 监听来自番茄时钟页面的消息
        this.setupMessageListener();
        
        console.log('专注时钟状态管理器已初始化');
    },

    /**
     * 立即检查专注状态（页面刷新时调用）
     */
    immediateStatusCheck() {
        console.log('立即检查专注状态...');
        
        // 1. 首先从localStorage获取pomodoro_tracker.html的数据
        this.checkPomodoroTrackerData();
        
        // 2. 从StorageManager获取数据
        this.checkStorageManagerData();
        
        // 3. 检查localStorage中的focusStats
        this.checkFocusStats();
        
        // 4. 更新显示
        this.updateDisplay();
        
        console.log('立即检查完成，当前状态:', this.currentStatus);
    },

    /**
     * 检查pomodoro_tracker.html的数据
     */
    checkPomodoroTrackerData() {
        try {
            const pomodoroData = localStorage.getItem('pomodoroAppData');
            if (pomodoroData) {
                const data = JSON.parse(pomodoroData);
                // 检查是否有正在进行的专注
                if (data.currentEvent && data.currentEvent.isRunning) {
                    const currentEvent = data.events?.find(e => e.id === data.currentEvent.id);
                    if (currentEvent) {
                        // 计算剩余时间
                        const startTime = data.currentEvent.startTime;
                        const elapsedSeconds = Math.floor((new Date().getTime() - startTime) / 1000);
                        const timeLeft = Math.max(0, currentEvent.duration * 60 - elapsedSeconds);
                        if (timeLeft > 0) {
                            this.setStatus(this.STATUS.ACTIVE, {
                                eventName: currentEvent.name,
                                timeLeft: timeLeft
                            });
                            return;
                        } else {
                            // 时间已用完，标记为完成
                            this.setStatus(this.STATUS.COMPLETED, {
                                eventName: currentEvent.name,
                                timeLeft: 0
                            });
                            return;
                        }
                    }
                }
                // 检查是否有暂停的专注
                if (data.currentEvent && data.currentEvent.isRunning === false && data.currentEvent.timeLeft > 0) {
                    const currentEvent = data.events?.find(e => e.id === data.currentEvent.id);
                    if (currentEvent) {
                        this.setStatus(this.STATUS.PAUSED, {
                            eventName: currentEvent.name,
                            timeLeft: data.currentEvent.timeLeft
                        });
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('检查pomodoro_tracker数据失败:', error);
        }
    },

    /**
     * 检查StorageManager的数据
     */
    checkStorageManagerData() {
        try {
            if (window.StorageManager) {
                const data = StorageManager.getData();
                const today = new Date().toISOString().split('T')[0];
                
                // 检查今日专注记录
                if (data.focusTime && data.focusTime.history) {
                    const todayRecord = data.focusTime.history.find(h => h.date === today);
                    if (todayRecord && todayRecord.minutes > 0) {
                        // 如果有今日专注记录但没有正在进行的专注，显示完成状态
                        if (this.currentStatus === this.STATUS.IDLE) {
                            this.setStatus(this.STATUS.COMPLETED, {
                                eventName: '今日专注',
                                timeLeft: 0
                            });
                        }
                    }
                }
                
                // 检查积分变化（可能表示刚完成专注）
                const currentPoints = data.points || 0;
                const lastPoints = localStorage.getItem('lastPoints');
                if (lastPoints && currentPoints > parseInt(lastPoints)) {
                    // 积分增加了，可能刚完成专注
                    if (this.currentStatus === this.STATUS.IDLE) {
                        this.setStatus(this.STATUS.COMPLETED, {
                            eventName: '专注完成',
                            timeLeft: 0
                        });
                    }
                }
                localStorage.setItem('lastPoints', currentPoints.toString());
            }
        } catch (error) {
            console.error('检查StorageManager数据失败:', error);
        }
    },

    /**
     * 检查focusStats数据
     */
    checkFocusStats() {
        try {
            const focusStats = localStorage.getItem('focusStats');
            if (focusStats) {
                const stats = JSON.parse(focusStats);
                // 暂停状态检测
                if (stats.isRunning === false && stats.timeLeft > 0) {
                    this.setStatus(this.STATUS.PAUSED, {
                        eventName: stats.currentEvent || '已暂停',
                        timeLeft: stats.timeLeft || 0
                    });
                    return;
                }
                // 如果focusStats显示正在运行，但pomodoro数据没有，则同步状态
                if (stats.isRunning && this.currentStatus === this.STATUS.IDLE) {
                    this.setStatus(this.STATUS.ACTIVE, {
                        eventName: stats.currentEvent || '专注中',
                        timeLeft: stats.timeLeft || 0
                    });
                }
            }
        } catch (error) {
            console.error('检查focusStats失败:', error);
        }
    },

    /**
     * 创建状态显示容器
     */
    createStatusContainer() {
        // 检查是否已存在
        if (document.getElementById('focus-status-container')) {
            this.container = document.getElementById('focus-status-container');
            return;
        }

        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'focus-status-container';
        this.container.className = 'focus-status-container hidden';
        this.container.title = '点击跳转到专注时钟页面';

        // 创建图标
        const icon = document.createElement('div');
        icon.className = 'focus-status-icon';
        icon.innerHTML = '<i class="fas fa-hourglass-half"></i>';

        // 创建信息区域
        const info = document.createElement('div');
        info.className = 'focus-status-info';

        const eventName = document.createElement('div');
        eventName.className = 'focus-status-event';
        eventName.textContent = '准备专注';

        const timer = document.createElement('div');
        timer.className = 'focus-status-timer';
        timer.textContent = '00:00';

        info.appendChild(eventName);
        info.appendChild(timer);

        this.container.appendChild(icon);
        this.container.appendChild(info);

        // 插入到积分显示之前
        const pointsInfo = document.querySelector('.points-info');
        if (pointsInfo && pointsInfo.parentNode) {
            pointsInfo.parentNode.insertBefore(this.container, pointsInfo);
        } else {
            // 如果找不到积分显示，插入到用户控制区域
            const userControls = document.querySelector('.user-controls');
            if (userControls) {
                userControls.insertBefore(this.container, userControls.firstChild);
            }
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        if (!this.container) return;

        // 点击跳转到专注时钟页面
        this.container.addEventListener('click', () => {
            this.openPomodoroTracker();
        });

        // 监听主题变化
        document.addEventListener('themechange', () => {
            this.updateDisplay();
        });

        // 监听storage变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'pomodoroAppData' || e.key === 'focusStats') {
                console.log('检测到专注数据变化:', e.key);
                setTimeout(() => {
                    this.immediateStatusCheck();
                }, 100);
            }
        });
    },

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // 只处理来自同源的消息
            if (event.origin !== window.location.origin) return;

            const { type, data } = event.data;

            switch (type) {
                case 'focusStats':
                    this.updateFromFocusStats(data);
                    break;
                case 'focusComplete':
                    this.handleFocusComplete(data);
                    break;
                case 'focusStart':
                    this.handleFocusStart(data);
                    break;
                case 'focusPause':
                    this.handleFocusPause(data);
                    break;
                case 'focusReset':
                    this.handleFocusReset(data);
                    break;
            }
        });
    },

    /**
     * 开始状态检查
     */
    startStatusCheck() {
        // 定期检查专注状态
        this.checkTimer = setInterval(() => {
            this.checkFocusStatus();
        }, this.config.checkInterval);
    },

    /**
     * 检查专注状态
     */
    checkFocusStatus() {
        const now = Date.now();
        // 避免过于频繁的检查
        if (now - this.lastCheckTime < this.config.checkInterval) {
            return;
        }
        this.lastCheckTime = now;

        try {
            // 从localStorage获取专注状态
            const focusStats = localStorage.getItem('focusStats');
            if (focusStats) {
                const stats = JSON.parse(focusStats);
                this.updateFromFocusStats(stats);
            } else {
                // 如果没有专注状态，检查是否有正在进行的专注
                this.checkActiveFocus();
            }
        } catch (error) {
            console.error('检查专注状态失败:', error);
        }
    },

    /**
     * 检查是否有正在进行的专注
     */
    checkActiveFocus() {
        try {
            // 从StorageManager获取数据
            if (window.StorageManager) {
                const data = StorageManager.getData();
                const today = new Date().toISOString().split('T')[0];
                
                // 检查今日是否有专注记录
                if (data.focusTime && data.focusTime.history) {
                    const todayRecord = data.focusTime.history.find(h => h.date === today);
                    if (todayRecord && todayRecord.minutes > 0) {
                        // 有专注记录，但可能已经完成
                        if (this.currentStatus === this.STATUS.IDLE) {
                            this.setStatus(this.STATUS.COMPLETED, {
                                eventName: '今日专注',
                                timeLeft: 0
                            });
                        }
                        return;
                    }
                }
            }
            
            // 没有专注活动
            if (this.currentStatus !== this.STATUS.IDLE) {
                this.setStatus(this.STATUS.IDLE);
            }
        } catch (error) {
            console.error('检查活跃专注失败:', error);
        }
    },

    /**
     * 从专注统计数据更新状态
     */
    updateFromFocusStats(stats) {
        if (!stats) return;
        const { currentEvent, totalFocusTime, completedPomodoros, isRunning, timeLeft } = stats;
        // 检查是否有暂停的专注
        if (isRunning === false && timeLeft > 0) {
            this.setStatus(this.STATUS.PAUSED, {
                eventName: currentEvent || '已暂停',
                timeLeft: timeLeft || 0
            });
        } else if (isRunning === true) {
            this.setStatus(this.STATUS.ACTIVE, {
                eventName: currentEvent || '专注中',
                timeLeft: timeLeft || 0
            });
        } else if (completedPomodoros > 0 || totalFocusTime > 0) {
            if (this.currentStatus === this.STATUS.IDLE) {
                this.setStatus(this.STATUS.COMPLETED, {
                    eventName: currentEvent || '专注完成',
                    timeLeft: 0
                });
            }
        } else {
            if (this.currentStatus !== this.STATUS.IDLE) {
                this.setStatus(this.STATUS.IDLE);
            }
        }
    },

    /**
     * 检查专注是否活跃
     */
    isFocusActive() {
        try {
            const focusStats = localStorage.getItem('focusStats');
            if (focusStats) {
                const stats = JSON.parse(focusStats);
                return stats.isRunning === true;
            }
            
            // 检查pomodoro数据
            const pomodoroData = localStorage.getItem('pomodoroAppData');
            if (pomodoroData) {
                const data = JSON.parse(pomodoroData);
                return data.currentEvent && data.currentEvent.isRunning === true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    },

    /**
     * 获取剩余时间
     */
    getTimeLeft() {
        try {
            const focusStats = localStorage.getItem('focusStats');
            if (focusStats) {
                const stats = JSON.parse(focusStats);
                return stats.timeLeft || 0;
            }
            
            // 检查pomodoro数据
            const pomodoroData = localStorage.getItem('pomodoroAppData');
            if (pomodoroData) {
                const data = JSON.parse(pomodoroData);
                if (data.currentEvent && data.currentEvent.isRunning) {
                    const startTime = data.currentEvent.startTime;
                    const currentEvent = data.events?.find(e => e.id === data.currentEvent.id);
                    if (currentEvent && startTime) {
                        const elapsedSeconds = Math.floor((new Date().getTime() - startTime) / 1000);
                        return Math.max(0, currentEvent.duration * 60 - elapsedSeconds);
                    }
                }
                return data.currentEvent?.timeLeft || 0;
            }
            
            return 0;
        } catch (error) {
            return 0;
        }
    },

    /**
     * 设置状态
     */
    setStatus(status, data = {}) {
        // 允许同一事件不同状态切换（如active<->paused），但同一状态同一内容不重复渲染
        if (this.currentStatus === status && this.currentEvent === (data.eventName || '') && this.timeLeft === (data.timeLeft || 0)) return;
        console.log('专注状态变化:', this.currentStatus, '->', status, data);
        this.currentStatus = status;
        this.currentEvent = data.eventName || '';
        this.timeLeft = data.timeLeft || 0;
        // 更新容器类名
        this.updateContainerClass(status);
        // 更新显示
        this.updateDisplay();
        // 根据状态启动或停止定时器
        if (status === this.STATUS.ACTIVE) {
            this.startUpdateTimer();
        } else {
            this.stopUpdateTimer();
        }
        // 新增：如果是completed，3秒后自动隐藏
        if (status === this.STATUS.COMPLETED) {
            if (this._completedTimeout) clearTimeout(this._completedTimeout);
            this._completedTimeout = setTimeout(() => {
                this.setStatus(this.STATUS.IDLE);
            }, 3000);
        }
    },

    /**
     * 更新容器类名
     */
    updateContainerClass(status) {
        if (!this.container) return;

        // 移除所有状态类
        this.container.classList.remove('active', 'paused', 'completed', 'hidden');

        // 添加当前状态类
        switch (status) {
            case this.STATUS.ACTIVE:
                this.container.classList.add('active');
                break;
            case this.STATUS.PAUSED:
                this.container.classList.add('paused');
                break;
            case this.STATUS.COMPLETED:
                this.container.classList.add('completed');
                break;
            case this.STATUS.IDLE:
                this.container.classList.add('hidden');
                break;
        }
    },

    /**
     * 更新显示
     */
    updateDisplay() {
        if (!this.container) return;
        const eventElement = this.container.querySelector('.focus-status-event');
        const timerElement = this.container.querySelector('.focus-status-timer');
        if (eventElement) {
            let eventName = this.currentEvent || '准备专注';
            if (this.currentStatus === this.STATUS.PAUSED) {
                eventName = eventName === '已暂停' ? eventName : `${eventName}（已暂停）`;
            } else if (this.currentStatus === this.STATUS.COMPLETED) {
                eventName = eventName === '专注完成' || eventName === '今日专注' ? eventName : `${eventName}（已完成）`;
            }
            eventElement.textContent = this.truncateText(eventName, this.config.maxEventNameLength);
        }
        if (timerElement) {
            if (this.currentStatus === this.STATUS.ACTIVE && this.timeLeft > 0) {
                timerElement.textContent = this.formatTime(this.timeLeft);
            } else if (this.currentStatus === this.STATUS.PAUSED && this.timeLeft > 0) {
                timerElement.textContent = this.formatTime(this.timeLeft);
            } else if (this.currentStatus === this.STATUS.COMPLETED) {
                timerElement.textContent = '已完成';
            } else {
                timerElement.textContent = '00:00';
            }
        }
    },

    /**
     * 启动更新定时器
     */
    startUpdateTimer() {
        this.stopUpdateTimer();
        
        this.updateTimer = setInterval(() => {
            if (this.currentStatus === this.STATUS.ACTIVE) {
                this.timeLeft = Math.max(0, this.timeLeft - 1);
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.setStatus(this.STATUS.COMPLETED, {
                        eventName: this.currentEvent,
                        timeLeft: 0
                    });
                }
            }
        }, this.config.updateInterval);
    },

    /**
     * 停止更新定时器
     */
    stopUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    },

    /**
     * 处理专注开始
     */
    handleFocusStart(data) {
        this.setStatus(this.STATUS.ACTIVE, {
            eventName: data.eventName || '专注中',
            timeLeft: data.timeLeft || 0
        });
    },

    /**
     * 处理专注暂停
     */
    handleFocusPause(data) {
        this.setStatus(this.STATUS.PAUSED, {
            eventName: data.eventName || '已暂停',
            timeLeft: data.timeLeft || 0
        });
    },

    /**
     * 处理专注完成
     */
    handleFocusComplete(data) {
        this.setStatus(this.STATUS.COMPLETED, {
            eventName: data.eventName || '专注完成',
            timeLeft: 0
        });
        
        // 3秒后隐藏
        setTimeout(() => {
            this.setStatus(this.STATUS.IDLE);
        }, 3000);
    },

    /**
     * 处理专注重置
     */
    handleFocusReset(data) {
        this.setStatus(this.STATUS.IDLE);
    },

    /**
     * 打开专注时钟页面
     */
    openPomodoroTracker() {
        try {
            // 直接在当前页面跳转到专注时钟页面
            console.log('跳转到专注时钟页面');
            window.location.href = 'pomodoro_tracker.html';
        } catch (error) {
            console.error('跳转到专注时钟页面失败:', error);
            // 降级处理：尝试其他方式
            try {
                window.location.replace('pomodoro_tracker.html');
            } catch (e) {
                console.error('所有跳转方式都失败:', e);
            }
        }
    },

    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    /**
     * 截断文本
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '...';
    },

    /**
     * 销毁
     */
    destroy() {
        this.stopUpdateTimer();
        
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => {
        FocusStatusManager.init();
    }, 500);
});

// 导出到全局
window.FocusStatusManager = FocusStatusManager; 