/**
 * Water Reminder Management Module
 * Responsible for managing water reminders, point rewards and goal settings
 */

const WaterReminderManager = {
    // Timer ID
    reminderTimer: null,
    
    // Current settings
    settings: {
        enabled: false,
        interval: 40, // Default 40min
        startTime: '09:00',
        endTime: '22:00',
        dailyGoal: 8, // Daily water goal (cups)
        dailyGoalML: 2000, // Daily water goal (ml)
        enableMLGoal: false, // Whether to enable ml goal
        customTypes: {} // Custom beverage types
    },
    
    // Today's drinking record
    todayRecord: {
        count: 0,
        totalML: 0, // Today's total water intake (ml)
        types: [],
        lastDrinkTime: null
    },
    
    // Drinking type point rules
    drinkTypes: {
        'Water': { icon: '💧', points: 20, name: 'Water', mlPerCup: 250 },
        'Tea': { icon: '🍵', points: 14, name: 'Tea', mlPerCup: 200 },
        'Coffee': { icon: '☕', points: 13, name: 'Coffee', mlPerCup: 180 },
        'Juice': { icon: '🧃', points: 14, name: 'Juice', mlPerCup: 200 },
        'Milk Tea': { icon: '🥤', points: 12, name: 'Milk Tea', mlPerCup: 300 }
    },
    
    /**
     * Initialize water reminder
     */
    init() {
        console.log('Initializing water reminder functionality');
        this.loadSettings();
        this.loadTodayRecord();
        this.renderSettings();
        this.updateGoalProgress();
        
        if (this.settings.enabled) {
            this.startReminder();
        }
    },
    
    /**
     * Load settings
     */
    loadSettings() {
        const data = StorageManager.getData();
        if (data.waterReminder) {
            this.settings = { ...this.settings, ...data.waterReminder };
        }
        
        // Load custom beverage types
        if (data.waterReminder && data.waterReminder.customTypes) {
            this.settings.customTypes = data.waterReminder.customTypes;
        }
    },
    
    /**
     * Save settings
     */
    saveSettings() {
        const data = StorageManager.getData();
        data.waterReminder = this.settings;
        StorageManager.saveData(data);
    },
    
    /**
     * Load today's record
     */
    loadTodayRecord() {
        const data = StorageManager.getData();
        const today = new Date().toISOString().split('T')[0];
        
        if (data.waterRecords && data.waterRecords[today]) {
            this.todayRecord = data.waterRecords[today];
        } else {
            this.todayRecord = {
                count: 0,
                totalML: 0, // Today's total water intake (ml)
                types: [],
                lastDrinkTime: null
            };
        }
    },
    
    /**
     * Save today's record
     */
    saveTodayRecord() {
        const data = StorageManager.getData();
        const today = new Date().toISOString().split('T')[0];
        
        if (!data.waterRecords) {
            data.waterRecords = {};
        }
        
        data.waterRecords[today] = this.todayRecord;
        StorageManager.saveData(data);
    },
    
    /**
     * Render settings panel
     */
    renderSettings() {
        const container = document.getElementById('water-reminder-panel');
        if (!container) return;
        
        // 预设间隔选项
        const intervalOptions = [
            { value: 15, label: '15min' },
            { value: 20, label: '20min' },
            { value: 30, label: '30min' },
            { value: 40, label: '40min' },
            { value: 45, label: '45min' },
            { value: 60, label: '1h' },
            { value: 90, label: '1.5h' },
            { value: 120, label: '2h' },
            { value: 180, label: '3h' },
            { value: 240, label: '4h' },
            { value: 300, label: '5h' },
            { value: 360, label: '6h' },
            { value: 'custom', label: 'Customization...' }
        ];
        
        // 检查当前间隔是否在预设选项medium
        const currentIntervalExists = intervalOptions.some(option => option.value === this.settings.interval);
        const selectedValue = currentIntervalExists ? this.settings.interval : 'custom';
        
        container.innerHTML = `
            <h3>Drinking reminder</h3>
            <div class="water-reminder-settings">
                <div class="water-reminder-setting">
                    <label for="water-interval">Reminder interval</label>
                    <select id="water-interval">
                        ${intervalOptions.map(option => 
                            `<option value="${option.value}" ${selectedValue === option.value ? 'selected' : ''}>
                                ${option.label}
                            </option>`
                        ).join('')}
                    </select>
                    <input type="number" id="water-custom-interval" 
                           placeholder="Enter a custom interval (min)" 
                           min="1" max="480" 
                           value="${currentIntervalExists ? '' : this.settings.interval}"
                           style="display: ${selectedValue === 'custom' ? 'block' : 'none'}; margin-top: 8px;">
                </div>
                <div class="water-reminder-setting">
                    <label for="water-start-time">Start time</label>
                    <input type="time" id="water-start-time" value="${this.settings.startTime}">
                </div>
                <div class="water-reminder-setting">
                    <label for="water-end-time">End time</label>
                    <input type="time" id="water-end-time" value="${this.settings.endTime}">
                </div>
                <div class="water-reminder-setting">
                    <label for="water-daily-goal">Daily Goal (Cup)</label>
                    <input type="number" id="water-daily-goal" min="1" max="20" value="${this.settings.dailyGoal}">
                </div>
                <div class="water-reminder-setting">
                    <label class="water-reminder-checkbox">
                        <input type="checkbox" id="water-enable-ml-goal" ${this.settings.enableMLGoal ? 'checked' : ''}>
                        <span>Enable ml target</span>
                    </label>
                </div>
                <div class="water-reminder-setting" id="water-ml-goal-container" style="display: ${this.settings.enableMLGoal ? 'block' : 'none'};">
                    <label for="water-daily-goal-ml">Daily Target (ml)</label>
                    <input type="number" id="water-daily-goal-ml" min="100" max="5000" step="50" value="${this.settings.dailyGoalML}">
                </div>
            </div>
            <div class="water-reminder-controls">
                <button class="water-reminder-btn primary" id="water-toggle-btn">
                    ${this.settings.enabled ? 'Stop' : 'Start'}
                </button>
                <button class="water-reminder-btn secondary" id="water-reset-btn">Reset today</button>
            </div>
            <div class="water-reminder-status ${this.settings.enabled ? 'active' : 'inactive'}">
                ${this.settings.enabled ? '✅ Reminder is enabled' : '⏸️ The reminder is paused'}
            </div>
            <div class="water-goal-progress">
                <div class="water-goal-header">
                    <span class="water-goal-title">Today's progress</span>
                    <span class="water-goal-count">
                        ${this.todayRecord.count}/${this.settings.dailyGoal} cups
                        ${this.settings.enableMLGoal ? `，${this.todayRecord.totalML}/${this.settings.dailyGoalML} ml` : ''}
                    </span>
                </div>
                <div class="water-goal-bar">
                    <div class="water-goal-fill" style="width: ${this.settings.enableMLGoal ? Math.min((this.todayRecord.totalML / this.settings.dailyGoalML) * 100, 100) : Math.min((this.todayRecord.count / this.settings.dailyGoal) * 100, 100)}%"></div>
                </div>
            </div>
        `;
        
        this.bindSettingsEvents();
    },
    
    /**
     * Bind settings events
     */
    bindSettingsEvents() {
        // 先移除可能存在的旧Things监听器
        this.removeSettingsEvents();
        
        // 提醒间隔
        const intervalSelect = document.getElementById('water-interval');
        const customIntervalInput = document.getElementById('water-custom-interval');
        
        if (intervalSelect) {
            intervalSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                
                if (value === 'custom') {
                    // 显示自定义输入框
                    if (customIntervalInput) {
                        customIntervalInput.style.display = 'block';
                        customIntervalInput.focus();
                    }
                } else {
                    // 隐藏自定义输入框并Set间隔
                    if (customIntervalInput) {
                        customIntervalInput.style.display = 'none';
                    }
                    
                    const intervalValue = parseInt(value);
                    if (intervalValue >= 15 && intervalValue <= 360) {
                        this.settings.interval = intervalValue;
                        this.saveSettings();
                        if (this.settings.enabled) {
                            this.restartReminder();
                        }
                    }
                }
            });
        }
        
        // 自定义间隔输入
        if (customIntervalInput) {
            customIntervalInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 480) {
                    this.settings.interval = value;
                    this.saveSettings();
                    if (this.settings.enabled) {
                        this.restartReminder();
                    }
                } else {
                    // 重置为有效值
                    e.target.value = this.settings.interval;
                    UIManager.showNotification('Custom intervals must be between 1-480min', 'warning');
                }
            });
            
            customIntervalInput.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value);
                if (value < 1 || value > 480) {
                    e.target.value = this.settings.interval;
                }
            });
        }
        
        // 开始time
        const startTimeInput = document.getElementById('water-start-time');
        if (startTimeInput) {
            startTimeInput.addEventListener('change', (e) => {
                this.settings.startTime = e.target.value;
                this.saveSettings();
                if (this.settings.enabled) {
                    this.restartReminder();
                }
            });
        }
        
        // 结束time
        const endTimeInput = document.getElementById('water-end-time');
        if (endTimeInput) {
            endTimeInput.addEventListener('change', (e) => {
                this.settings.endTime = e.target.value;
                this.saveSettings();
                if (this.settings.enabled) {
                    this.restartReminder();
                }
            });
        }
        
        // 每日目标
        const dailyGoalInput = document.getElementById('water-daily-goal');
        if (dailyGoalInput) {
            dailyGoalInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 20) {
                    this.settings.dailyGoal = value;
                    this.saveSettings();
                    this.updateGoalProgress();
                } else {
                    // 重置为有效值
                    e.target.value = this.settings.dailyGoal;
                    UIManager.showNotification('The daily goal must be between 1-20 cups', 'warning');
                }
            });
        }
        
        // 每日目标毫升
        const dailyGoalMLInput = document.getElementById('water-daily-goal-ml');
        if (dailyGoalMLInput) {
            dailyGoalMLInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 100 && value <= 5000) {
                    this.settings.dailyGoalML = value;
                    this.saveSettings();
                    this.updateGoalProgress();
                } else {
                    // 重置为有效值
                    e.target.value = this.settings.dailyGoalML;
                    UIManager.showNotification('The daily goal must be between 100-5000 ml', 'warning');
                }
            });
        }
        
        // 毫升目标开关
        const enableMLGoalCheckbox = document.getElementById('water-enable-ml-goal');
        const mlGoalContainer = document.getElementById('water-ml-goal-container');
        if (enableMLGoalCheckbox) {
            enableMLGoalCheckbox.addEventListener('change', (e) => {
                this.settings.enableMLGoal = e.target.checked;
                this.saveSettings();
                
                if (mlGoalContainer) {
                    mlGoalContainer.style.display = this.settings.enableMLGoal ? 'block' : 'none';
                }
                
                this.updateGoalProgress();
            });
        }
        
        // 开关按钮
        const toggleBtn = document.getElementById('water-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleReminder();
            });
        }
        
        // 重置按钮
        const resetBtn = document.getElementById('water-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset your drinking record today?')) {
                    this.resetTodayRecord();
                }
            });
        }
    },
    
    /**
     * 移除SetThings监听器（防止Repeat绑定）
     */
    removeSettingsEvents() {
        const elements = [
            'water-interval',
            'water-custom-interval',
            'water-start-time', 
            'water-end-time',
            'water-daily-goal',
            'water-daily-goal-ml',
            'water-enable-ml-goal',
            'water-toggle-btn',
            'water-reset-btn'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // 克隆元素来移除所有Things监听器
                const newElement = element.cloneNode(true);
                if (element.parentNode) {
                    element.parentNode.replaceChild(newElement, element);
                }
            }
        });
    },
    
    /**
     * 切换提醒状态
     */
    toggleReminder() {
        this.settings.enabled = !this.settings.enabled;
        this.saveSettings();
        
        if (this.settings.enabled) {
            this.startReminder();
        } else {
            this.stopReminder();
        }
        
        this.renderSettings();
    },
    
    /**
     * 开始提醒
     */
    startReminder() {
        this.stopReminder(); // 先停止现有定时器
        
        if (!this.isWithinActiveTime()) {
            // 如果不在活跃time内，Set到下一个活跃time
            this.scheduleNextReminder();
            return;
        }
        
        // 立即检查是否需要提醒
        this.checkAndShowReminder();
        
        // Set定时器
        this.reminderTimer = setInterval(() => {
            if (this.isWithinActiveTime()) {
                this.checkAndShowReminder();
            }
        }, this.settings.interval * 60 * 1000);
        
        console.log(`Drinking water reminder activated, interval:${this.settings.interval}min`);
    },
    
    /**
     * 停止提醒
     */
    stopReminder() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
        }
        console.log('The water reminder has stopped');
    },
    
    /**
     * 重启提醒
     */
    restartReminder() {
        if (this.settings.enabled) {
            this.startReminder();
        }
    },
    
    /**
     * 检查是否在活跃time内
     */
    isWithinActiveTime() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
        const [endHour, endMin] = this.settings.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return currentTime >= startMinutes && currentTime <= endMinutes;
    },
    
    /**
     * 安排下一times提醒
     */
    scheduleNextReminder() {
        const now = new Date();
        const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
        const startTime = new Date(now);
        startTime.setHours(startHour, startMin, 0, 0);
        
        // 如果今天的开始time已过，Set为明天
        if (startTime <= now) {
            startTime.setDate(startTime.getDate() + 1);
        }
        
        const delay = startTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.startReminder();
        }, delay);
        
        console.log(`The next water reminder will be at${startTime.toLocaleString()} Start`);
    },
    
    /**
     * 检查并显示提醒
     */
    checkAndShowReminder() {
        // 检查是否在活跃time内
        if (!this.isWithinActiveTime()) {
            return;
        }
        // 检查5min内是否刚Close过
        const lastClose = localStorage.getItem('waterReminderCloseTime');
        if (lastClose) {
            const now = Date.now();
            if (now - parseInt(lastClose) < 5 * 60 * 1000) {
                return;
            }
        }
        // 检查距离上times喝水是否超过设定time
        const now = new Date();
        const lastDrinkTime = this.todayRecord.lastDrinkTime ? new Date(this.todayRecord.lastDrinkTime) : null;
        if (!lastDrinkTime || (now - lastDrinkTime) >= this.settings.interval * 60 * 1000) {
            this.showWaterNotification();
        }
    },
    
    /**
     * 显示喝水提醒通知
     */
    showWaterNotification() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'water-notification-overlay';
        document.body.appendChild(overlay);
        
        // 创建通知弹窗
        const notification = document.createElement('div');
        notification.className = 'water-notification';
        notification.innerHTML = `
            <div class="water-notification-header">
                <div class="water-notification-icon">💧</div>
                <div class="water-notification-title">It's time to drink water!</div>
                <div class="water-notification-subtitle">Stay hydrated and stay healthy!</div>
            </div>
            <div class="water-notification-content">
                <div class="water-notification-message">
                    It's been since the last time I drank water ${this.settings.interval} min，<br>
                    Remember to stay hydrated!
                </div>
                <div class="water-notification-time">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
            <div class="water-notification-actions">
                <button class="water-notification-btn primary" id="water-drank-btn">Drank</button>
                <button class="water-notification-btn secondary" id="water-drank-what-btn">What did I drink</button>
            </div>
            <div class="water-notification-footer">
                <button class="water-notification-footer-btn" id="water-close-btn">Close</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 绑定Things
        this.bindNotificationEvents(notification, overlay);
        
        // 播放提示音（如果可用）
        this.playNotificationSound();
    },
    
    /**
     * 绑定通知Things
     */
    bindNotificationEvents(notification, overlay) {
        // 喝了按钮
        const drankBtn = notification.querySelector('#water-drank-btn');
        drankBtn.addEventListener('click', () => {
            this.recordDrink('Water');
            this.closeNotification(notification, overlay);
        });
        
        // What did I drink button
        const drankWhatBtn = notification.querySelector('#water-drank-what-btn');
        drankWhatBtn.addEventListener('click', () => {
            this.showDrinkTypeModal(notification, overlay);
        });
        
        // Close按钮
        const closeBtn = notification.querySelector('#water-close-btn');
        closeBtn.addEventListener('click', () => {
            // 记录Closetime
            localStorage.setItem('waterReminderCloseTime', Date.now().toString());
            this.closeNotification(notification, overlay);
        });
    },
    
    /**
     * 显示喝水类型Select弹窗
     */
    showDrinkTypeModal(notification, overlay) {
        // 隐藏原通知
        notification.style.display = 'none';
        
        // 创建类型Select弹窗
        const typeModal = document.createElement('div');
        typeModal.className = 'water-type-modal';
        typeModal.innerHTML = `
            <h3>Select Beverage</h3>
            <div class="water-type-options">
                ${Object.entries(this.drinkTypes).map(([key, type]) => `
                    <div class="water-type-option" data-type="${key}">
                        <span class="water-type-icon">${type.icon}</span>
                        <span class="water-type-name">${type.name}</span>
                        <span class="water-type-points">+${type.points}Points</span>
                    </div>
                `).join('')}
            </div>
            <div class="water-type-custom">
                <input type="text" id="custom-drink-input" placeholder="Enter other beverage name">
                <div class="water-type-actions">
                    <button class="water-notification-btn secondary" id="custom-drink-btn">Confirm</button>
                    <button class="water-notification-btn secondary" id="cancel-type-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(typeModal);
        
        // 绑定类型SelectThings
        this.bindTypeModalEvents(typeModal, notification, overlay);
    },
    
    /**
     * 绑定类型Select弹窗Things
     */
    bindTypeModalEvents(typeModal, notification, overlay) {
        // 预设类型Select
        const typeOptions = typeModal.querySelectorAll('.water-type-option');
        typeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const drinkType = option.dataset.type;
                this.recordDrink(drinkType);
                // Select饮品后直接Close整个通知
                this.closeNotification(notification, overlay);
                document.body.removeChild(typeModal);
            });
        });
        
        // 自定义类型
        const customBtn = typeModal.querySelector('#custom-drink-btn');
        const customInput = typeModal.querySelector('#custom-drink-input');
        
        customBtn.addEventListener('click', () => {
            const customType = customInput.value.trim();
            if (customType) {
                this.recordDrink(customType);
                // Select饮品后直接Close整个通知
                this.closeNotification(notification, overlay);
                document.body.removeChild(typeModal);
            }
        });
        
        // 回车键确认
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const customType = customInput.value.trim();
                if (customType) {
                    this.recordDrink(customType);
                    // Select饮品后直接Close整个通知
                    this.closeNotification(notification, overlay);
                    document.body.removeChild(typeModal);
                }
            }
        });
        
        // Cancel button
        const cancelBtn = typeModal.querySelector('#cancel-type-btn');
        cancelBtn.addEventListener('click', () => {
            this.closeTypeModal(typeModal, notification, overlay);
        });
    },
    
    /**
     * Close类型Select弹窗
     */
    closeTypeModal(typeModal, notification, overlay) {
        document.body.removeChild(typeModal);
        notification.style.display = 'block';
    },
    
    /**
     * Close通知
     */
    closeNotification(notification, overlay) {
        document.body.removeChild(notification);
        document.body.removeChild(overlay);
    },
    
    /**
     * 记录喝水
     */
    recordDrink(drinkType) {
        const now = new Date();
        let ml = 0;
        
        // 如果启用了毫升目标，要求用户输入喝水量
        if (this.settings.enableMLGoal) {
            const userInput = prompt(`Please enter the amount of water to drink (ml) of "${DrinkType}"`, '200');
            if (userInput === null) {
                // 用户点击取消，不记录喝水
                return;
            }
            ml = parseInt(userInput);
            if (isNaN(ml) || ml <= 0) {
                UIManager.showNotification('Please enter a valid milliliter', 'warning');
                return;
            }
        } else {
            // 未启用毫升目标时，使用预设类型或询问
            if (this.drinkTypes[drinkType]) {
                ml = this.drinkTypes[drinkType].mlPerCup;
            } else if (this.settings.customTypes[drinkType]) {
                ml = this.settings.customTypes[drinkType];
            } else {
                // 自定义类型，询问用户是否要输入毫升数
                const userInput = prompt(`Please enter the milliliter number of "${drinkType}" (optional, use the default 200ml directly to enter)`, '200');
                if (userInput === null) {
                    // 用户点击取消，不记录喝水
                    return;
                }
                ml = parseInt(userInput) || 200; // 如果输入Empty效或为空，使用默认值200
            }
        }
        
        // 更新今日记录
        this.todayRecord.count++;
        this.todayRecord.lastDrinkTime = now.toISOString();
        this.todayRecord.totalML = (this.todayRecord.totalML || 0) + ml;
        this.todayRecord.types.push({
            type: drinkType,
            time: now.toISOString(),
            points: this.getDrinkPoints(drinkType),
            ml: ml
        });
        this.saveTodayRecord();
        // 添加积分
        const points = this.getDrinkPoints(drinkType);
        StorageManager.addPoints(points, 'Drinking water rewards', `Types of drinks：${drinkType}`);
        // 显示积分奖励动画
        this.showPointsReward(points, drinkType);
        // 更新进度显示
        this.updateGoalProgress();
        // 检查是否达到目标
        if (this.settings.enableMLGoal && this.todayRecord.totalML >= this.settings.dailyGoalML) {
            this.showGoalAchieved();
        } else if (!this.settings.enableMLGoal && this.todayRecord.count >= this.settings.dailyGoal) {
            this.showGoalAchieved();
        }
        console.log(`Record water drinking：${drinkType}，${ml}ml，get${points} points`);
    },
    
    /**
     * 获取饮品积分
     */
    getDrinkPoints(drinkType) {
        // 检查预设类型
        if (this.drinkTypes[drinkType]) {
            return this.drinkTypes[drinkType].points;
        }
        
        // 检查自定义类型
        if (this.settings.customTypes[drinkType]) {
            return this.settings.customTypes[drinkType];
        }
        
        // 默认积分
        return 10;
    },
    
    /**
     * 显示积分奖励动画
     */
    showPointsReward(points, drinkType) {
        const reward = document.createElement('div');
        reward.className = 'points-reward';
        reward.textContent = `+${points}Record water drinking：${drinkType}`;
        document.body.appendChild(reward);
        
        // 2秒后移除
        setTimeout(() => {
            if (reward.parentNode) {
                document.body.removeChild(reward);
            }
        }, 2000);
    },
    
    /**
     * 更新目标进度
     */
    updateGoalProgress() {
        const progressFill = document.querySelector('.water-goal-fill');
        const goalCount = document.querySelector('.water-goal-count');
        
        if (progressFill) {
            const percentage = this.settings.enableMLGoal 
                ? Math.min((this.todayRecord.totalML / this.settings.dailyGoalML) * 100, 100)
                : Math.min((this.todayRecord.count / this.settings.dailyGoal) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }
        
        if (goalCount) {
            goalCount.textContent = `${this.todayRecord.count}/${this.settings.dailyGoal} 杯${this.settings.enableMLGoal ? `，${this.todayRecord.totalML}/${this.settings.dailyGoalML} 毫升` : ''}`;
        }
        
        // 重新渲染Set面板以确保进度条正确更新
        this.renderSettings();
    },
    
    /**
     * 显示目标达成通知
     */
    showGoalAchieved() {
        UIManager.showNotification(`🎉 Congratulations! Today's drinking water goal has been achieved! \nI drank ${this.todayRecord.count} glass of water`, 'success');
        
        // 目标达成奖励积分
        StorageManager.addPoints(50, 'Water Drinking Reward', 'Achieving the daily water drinking goal');
    },
    
    /**
     * 重置今日记录
     */
    resetTodayRecord() {
        this.todayRecord = {
            count: 0,
            totalML: 0, // Today's total water intake (ml)
            types: [],
            lastDrinkTime: null
        };
        this.saveTodayRecord();
        this.updateGoalProgress();
        this.renderSettings();
        
        UIManager.showNotification('the drinking record today has been reset', 'info');
    },
    
    /**
     * 播放提示音
     */
    playNotificationSound() {
        // 尝试播放提示音
        try {
            if (window.FocusManager && FocusManager.soundsEnabled) {
                // 使用Focus的提示音
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                audio.play().catch(() => {
                    // 静默处理播放失败
                });
            }
        } catch (error) {
            // 静默处理错误
        }
    },
    
    /**
     * 获取Today
     */
    getTodayStats() {
        return {
            count: this.todayRecord.count,
            goal: this.settings.dailyGoal,
            progress: Math.min((this.todayRecord.totalML / this.settings.dailyGoalML) * 100, 100),
            types: this.todayRecord.types,
            lastDrinkTime: this.todayRecord.lastDrinkTime
        };
    },
    
    /**
     * 添加自定义喝水类型
     */
    addCustomDrinkType(name, points) {
        this.settings.customTypes[name] = points;
        this.saveSettings();
    },
    
    /**
     * 移除自定义喝水类型
     */
    removeCustomDrinkType(name) {
        delete this.settings.customTypes[name];
        this.saveSettings();
    },
    
    /**
     * 重新初始化Set面板（供外部调用）
     */
    reinit() {
        this.loadSettings();
        this.loadTodayRecord();
        this.renderSettings();
        this.updateGoalProgress();
        
        if (this.settings.enabled) {
            this.startReminder();
        }
    }
};

// 导出到全局
window.WaterReminderManager = WaterReminderManager; 