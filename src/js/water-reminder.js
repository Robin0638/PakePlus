/**
 * 喝水提醒管理模块
 * 负责管理喝水提醒、积分奖励和目标设置
 */

const WaterReminderManager = {
    // 定时器ID
    reminderTimer: null,
    
    // 当前设置
    settings: {
        enabled: false,
        interval: 40, // 默认40分钟
        startTime: '09:00',
        endTime: '22:00',
        dailyGoal: 8, // 每日喝水目标（杯）
        dailyGoalML: 2000, // 每日喝水目标（毫升）
        enableMLGoal: false, // 是否启用毫升目标
        customTypes: {} // 自定义喝水类型
    },
    
    // 今日喝水记录
    todayRecord: {
        count: 0,
        totalML: 0, // 今日总喝水量（毫升）
        types: [],
        lastDrinkTime: null
    },
    
    // 喝水类型积分规则
    drinkTypes: {
        '水': { icon: '💧', points: 20, name: '水', mlPerCup: 250 },
        '茶': { icon: '🍵', points: 14, name: '茶', mlPerCup: 200 },
        '咖啡': { icon: '☕', points: 13, name: '咖啡', mlPerCup: 180 },
        '果汁': { icon: '🧃', points: 14, name: '果汁', mlPerCup: 200 },
        '奶茶': { icon: '🥤', points: 12, name: '奶茶', mlPerCup: 300 }
    },
    
    /**
     * 初始化喝水提醒
     */
    init() {
        console.log('初始化喝水提醒功能');
        this.loadSettings();
        this.loadTodayRecord();
        this.renderSettings();
        this.updateGoalProgress();
        
        if (this.settings.enabled) {
            this.startReminder();
        }
    },
    
    /**
     * 加载设置
     */
    loadSettings() {
        const data = StorageManager.getData();
        if (data.waterReminder) {
            this.settings = { ...this.settings, ...data.waterReminder };
        }
        
        // 加载自定义喝水类型
        if (data.waterReminder && data.waterReminder.customTypes) {
            this.settings.customTypes = data.waterReminder.customTypes;
        }
    },
    
    /**
     * 保存设置
     */
    saveSettings() {
        const data = StorageManager.getData();
        data.waterReminder = this.settings;
        StorageManager.saveData(data);
    },
    
    /**
     * 加载今日记录
     */
    loadTodayRecord() {
        const data = StorageManager.getData();
        const today = new Date().toISOString().split('T')[0];
        
        if (data.waterRecords && data.waterRecords[today]) {
            this.todayRecord = data.waterRecords[today];
        } else {
            this.todayRecord = {
                count: 0,
                totalML: 0, // 今日总喝水量（毫升）
                types: [],
                lastDrinkTime: null
            };
        }
    },
    
    /**
     * 保存今日记录
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
     * 渲染设置面板
     */
    renderSettings() {
        const container = document.getElementById('water-reminder-panel');
        if (!container) return;
        
        // 预设间隔选项
        const intervalOptions = [
            { value: 15, label: '15分钟' },
            { value: 20, label: '20分钟' },
            { value: 30, label: '30分钟' },
            { value: 40, label: '40分钟' },
            { value: 45, label: '45分钟' },
            { value: 60, label: '1小时' },
            { value: 90, label: '1.5小时' },
            { value: 120, label: '2小时' },
            { value: 180, label: '3小时' },
            { value: 240, label: '4小时' },
            { value: 300, label: '5小时' },
            { value: 360, label: '6小时' },
            { value: 'custom', label: '自定义...' }
        ];
        
        // 检查当前间隔是否在预设选项中
        const currentIntervalExists = intervalOptions.some(option => option.value === this.settings.interval);
        const selectedValue = currentIntervalExists ? this.settings.interval : 'custom';
        
        container.innerHTML = `
            <h3>喝水提醒设置</h3>
            <div class="water-reminder-settings">
                <div class="water-reminder-setting">
                    <label for="water-interval">提醒间隔</label>
                    <select id="water-interval">
                        ${intervalOptions.map(option => 
                            `<option value="${option.value}" ${selectedValue === option.value ? 'selected' : ''}>
                                ${option.label}
                            </option>`
                        ).join('')}
                    </select>
                    <input type="number" id="water-custom-interval" 
                           placeholder="输入自定义间隔（分钟）" 
                           min="1" max="480" 
                           value="${currentIntervalExists ? '' : this.settings.interval}"
                           style="display: ${selectedValue === 'custom' ? 'block' : 'none'}; margin-top: 8px;">
                </div>
                <div class="water-reminder-setting">
                    <label for="water-start-time">开始时间</label>
                    <input type="time" id="water-start-time" value="${this.settings.startTime}">
                </div>
                <div class="water-reminder-setting">
                    <label for="water-end-time">结束时间</label>
                    <input type="time" id="water-end-time" value="${this.settings.endTime}">
                </div>
                <div class="water-reminder-setting">
                    <label for="water-daily-goal">每日目标（杯）</label>
                    <input type="number" id="water-daily-goal" min="1" max="20" value="${this.settings.dailyGoal}">
                </div>
                <div class="water-reminder-setting">
                    <label class="water-reminder-checkbox">
                        <input type="checkbox" id="water-enable-ml-goal" ${this.settings.enableMLGoal ? 'checked' : ''}>
                        <span>启用毫升目标</span>
                    </label>
                </div>
                <div class="water-reminder-setting" id="water-ml-goal-container" style="display: ${this.settings.enableMLGoal ? 'block' : 'none'};">
                    <label for="water-daily-goal-ml">每日目标（毫升）</label>
                    <input type="number" id="water-daily-goal-ml" min="100" max="5000" step="50" value="${this.settings.dailyGoalML}">
                </div>
            </div>
            <div class="water-reminder-controls">
                <button class="water-reminder-btn primary" id="water-toggle-btn">
                    ${this.settings.enabled ? '停止提醒' : '开始提醒'}
                </button>
                <button class="water-reminder-btn secondary" id="water-reset-btn">重置今日</button>
            </div>
            <div class="water-reminder-status ${this.settings.enabled ? 'active' : 'inactive'}">
                ${this.settings.enabled ? '✅ 提醒已开启' : '⏸️ 提醒已暂停'}
            </div>
            <div class="water-goal-progress">
                <div class="water-goal-header">
                    <span class="water-goal-title">今日进度</span>
                    <span class="water-goal-count">
                        ${this.todayRecord.count}/${this.settings.dailyGoal} 杯
                        ${this.settings.enableMLGoal ? `，${this.todayRecord.totalML}/${this.settings.dailyGoalML} 毫升` : ''}
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
     * 绑定设置事件
     */
    bindSettingsEvents() {
        // 先移除可能存在的旧事件监听器
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
                    // 隐藏自定义输入框并设置间隔
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
                    UIManager.showNotification('自定义间隔必须在1-480分钟之间', 'warning');
                }
            });
            
            customIntervalInput.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value);
                if (value < 1 || value > 480) {
                    e.target.value = this.settings.interval;
                }
            });
        }
        
        // 开始时间
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
        
        // 结束时间
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
                    UIManager.showNotification('每日目标必须在1-20杯之间', 'warning');
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
                    UIManager.showNotification('每日目标必须在100-5000毫升之间', 'warning');
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
                if (confirm('确定要重置今日的喝水记录吗？')) {
                    this.resetTodayRecord();
                }
            });
        }
    },
    
    /**
     * 移除设置事件监听器（防止重复绑定）
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
                // 克隆元素来移除所有事件监听器
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
            // 如果不在活跃时间内，设置到下一个活跃时间
            this.scheduleNextReminder();
            return;
        }
        
        // 立即检查是否需要提醒
        this.checkAndShowReminder();
        
        // 设置定时器
        this.reminderTimer = setInterval(() => {
            if (this.isWithinActiveTime()) {
                this.checkAndShowReminder();
            }
        }, this.settings.interval * 60 * 1000);
        
        console.log(`喝水提醒已启动，间隔：${this.settings.interval}分钟`);
    },
    
    /**
     * 停止提醒
     */
    stopReminder() {
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
        }
        console.log('喝水提醒已停止');
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
     * 检查是否在活跃时间内
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
     * 安排下一次提醒
     */
    scheduleNextReminder() {
        const now = new Date();
        const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
        const startTime = new Date(now);
        startTime.setHours(startHour, startMin, 0, 0);
        
        // 如果今天的开始时间已过，设置为明天
        if (startTime <= now) {
            startTime.setDate(startTime.getDate() + 1);
        }
        
        const delay = startTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.startReminder();
        }, delay);
        
        console.log(`下次喝水提醒将在 ${startTime.toLocaleString()} 开始`);
    },
    
    /**
     * 检查并显示提醒
     */
    checkAndShowReminder() {
        // 检查是否在活跃时间内
        if (!this.isWithinActiveTime()) {
            return;
        }
        // 检查5分钟内是否刚关闭过
        const lastClose = localStorage.getItem('waterReminderCloseTime');
        if (lastClose) {
            const now = Date.now();
            if (now - parseInt(lastClose) < 5 * 60 * 1000) {
                return;
            }
        }
        // 检查距离上次喝水是否超过设定时间
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
                <div class="water-notification-title">该喝水啦！</div>
                <div class="water-notification-subtitle">保持水分，保持健康</div>
            </div>
            <div class="water-notification-content">
                <div class="water-notification-message">
                    距离上次喝水已经 ${this.settings.interval} 分钟了，<br>
                    记得补充水分哦！
                </div>
                <div class="water-notification-time">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
            <div class="water-notification-actions">
                <button class="water-notification-btn primary" id="water-drank-btn">喝了</button>
                <button class="water-notification-btn secondary" id="water-drank-what-btn">喝了什么</button>
            </div>
            <div class="water-notification-footer">
                <button class="water-notification-footer-btn" id="water-close-btn">关闭</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 绑定事件
        this.bindNotificationEvents(notification, overlay);
        
        // 播放提示音（如果可用）
        this.playNotificationSound();
    },
    
    /**
     * 绑定通知事件
     */
    bindNotificationEvents(notification, overlay) {
        // 喝了按钮
        const drankBtn = notification.querySelector('#water-drank-btn');
        drankBtn.addEventListener('click', () => {
            this.recordDrink('水');
            this.closeNotification(notification, overlay);
        });
        
        // 喝了什么按钮
        const drankWhatBtn = notification.querySelector('#water-drank-what-btn');
        drankWhatBtn.addEventListener('click', () => {
            this.showDrinkTypeModal(notification, overlay);
        });
        
        // 关闭按钮
        const closeBtn = notification.querySelector('#water-close-btn');
        closeBtn.addEventListener('click', () => {
            // 记录关闭时间
            localStorage.setItem('waterReminderCloseTime', Date.now().toString());
            this.closeNotification(notification, overlay);
        });
    },
    
    /**
     * 显示喝水类型选择弹窗
     */
    showDrinkTypeModal(notification, overlay) {
        // 隐藏原通知
        notification.style.display = 'none';
        
        // 创建类型选择弹窗
        const typeModal = document.createElement('div');
        typeModal.className = 'water-type-modal';
        typeModal.innerHTML = `
            <h3>选择喝的饮品</h3>
            <div class="water-type-options">
                ${Object.entries(this.drinkTypes).map(([key, type]) => `
                    <div class="water-type-option" data-type="${key}">
                        <span class="water-type-icon">${type.icon}</span>
                        <span class="water-type-name">${type.name}</span>
                        <span class="water-type-points">+${type.points}积分</span>
                    </div>
                `).join('')}
            </div>
            <div class="water-type-custom">
                <input type="text" id="custom-drink-input" placeholder="输入其他饮品名称">
                <div class="water-type-actions">
                    <button class="water-notification-btn secondary" id="custom-drink-btn">确定</button>
                    <button class="water-notification-btn secondary" id="cancel-type-btn">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(typeModal);
        
        // 绑定类型选择事件
        this.bindTypeModalEvents(typeModal, notification, overlay);
    },
    
    /**
     * 绑定类型选择弹窗事件
     */
    bindTypeModalEvents(typeModal, notification, overlay) {
        // 预设类型选择
        const typeOptions = typeModal.querySelectorAll('.water-type-option');
        typeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const drinkType = option.dataset.type;
                this.recordDrink(drinkType);
                // 选择饮品后直接关闭整个通知
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
                // 选择饮品后直接关闭整个通知
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
                    // 选择饮品后直接关闭整个通知
                    this.closeNotification(notification, overlay);
                    document.body.removeChild(typeModal);
                }
            }
        });
        
        // 取消按钮
        const cancelBtn = typeModal.querySelector('#cancel-type-btn');
        cancelBtn.addEventListener('click', () => {
            this.closeTypeModal(typeModal, notification, overlay);
        });
    },
    
    /**
     * 关闭类型选择弹窗
     */
    closeTypeModal(typeModal, notification, overlay) {
        document.body.removeChild(typeModal);
        notification.style.display = 'block';
    },
    
    /**
     * 关闭通知
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
            const userInput = prompt(`请输入"${drinkType}"的喝水量（毫升）`, '200');
            if (userInput === null) {
                // 用户点击取消，不记录喝水
                return;
            }
            ml = parseInt(userInput);
            if (isNaN(ml) || ml <= 0) {
                UIManager.showNotification('请输入有效的毫升数', 'warning');
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
                const userInput = prompt(`请输入"${drinkType}"的毫升数（可选，直接回车使用默认200ml）`, '200');
                if (userInput === null) {
                    // 用户点击取消，不记录喝水
                    return;
                }
                ml = parseInt(userInput) || 200; // 如果输入无效或为空，使用默认值200
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
        StorageManager.addPoints(points);
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
        console.log(`记录喝水：${drinkType}，${ml}ml，获得${points}积分`);
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
        reward.textContent = `+${points}积分`;
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
        
        // 重新渲染设置面板以确保进度条正确更新
        this.renderSettings();
    },
    
    /**
     * 显示目标达成通知
     */
    showGoalAchieved() {
        UIManager.showNotification(`🎉 恭喜！今日喝水目标已达成！\n共喝了${this.todayRecord.count}杯水`, 'success');
        
        // 目标达成奖励积分
        StorageManager.addPoints(50);
    },
    
    /**
     * 重置今日记录
     */
    resetTodayRecord() {
        this.todayRecord = {
            count: 0,
            totalML: 0, // 今日总喝水量（毫升）
            types: [],
            lastDrinkTime: null
        };
        this.saveTodayRecord();
        this.updateGoalProgress();
        this.renderSettings();
        
        UIManager.showNotification('今日喝水记录已重置', 'info');
    },
    
    /**
     * 播放提示音
     */
    playNotificationSound() {
        // 尝试播放提示音
        try {
            if (window.FocusManager && FocusManager.soundsEnabled) {
                // 使用专注模式的提示音
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
     * 获取今日统计
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
     * 重新初始化设置面板（供外部调用）
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