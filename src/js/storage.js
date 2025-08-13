/**
 * 存储管理模块
 * 为时钟应用的所有功能提供永久化存储
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            WORLD_CLOCKS: 'worldClocks',
            ALARMS: 'alarms',
            STOPWATCHES: 'stopwatches',
            TIMERS: 'timers',
            SETTINGS: 'settings'
        };
        
        this.defaultSettings = {
            theme: 'light',
            language: 'zh-CN',
            timeFormat: '24h',
            notifications: true,
            soundVolume: 0.7
        };
    }

    /**
     * 保存数据到本地存储
     * @param {string} key - 存储键名
     * @param {any} data - 要保存的数据
     */
    save(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            console.log(`数据已保存到 ${key}:`, data);
        } catch (error) {
            console.error(`保存数据到 ${key} 失败:`, error);
        }
    }

    /**
     * 从本地存储加载数据
     * @param {string} key - 存储键名
     * @param {any} defaultValue - 默认值
     * @returns {any} 加载的数据或默认值
     */
    load(key, defaultValue = null) {
        try {
            const serializedData = localStorage.getItem(key);
            if (serializedData === null) {
                return defaultValue;
            }
            const data = JSON.parse(serializedData);
            console.log(`从 ${key} 加载数据:`, data);
            return data;
        } catch (error) {
            console.error(`从 ${key} 加载数据失败:`, error);
            return defaultValue;
        }
    }

    /**
     * 删除存储的数据
     * @param {string} key - 存储键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            console.log(`已删除存储键 ${key}`);
        } catch (error) {
            console.error(`删除存储键 ${key} 失败:`, error);
        }
    }

    /**
     * 清空所有应用数据
     */
    clearAll() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('已清空所有应用数据');
        } catch (error) {
            console.error('清空应用数据失败:', error);
        }
    }

    /**
     * 获取存储使用情况
     * @returns {object} 存储使用信息
     */
    getStorageInfo() {
        try {
            const totalSize = new Blob([localStorage.getItem('') || '']).size;
            let appSize = 0;
            
            Object.values(this.storageKeys).forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    appSize += new Blob([data]).size;
                }
            });

            return {
                totalSize,
                appSize,
                availableSpace: 5 * 1024 * 1024 - totalSize, // 假设5MB限制
                usagePercentage: (totalSize / (5 * 1024 * 1024)) * 100
            };
        } catch (error) {
            console.error('获取存储信息失败:', error);
            return null;
        }
    }
}

/**
 * 世界时钟存储管理
 */
class WorldClockStorage {
    constructor(storageManager) {
        this.storage = storageManager;
        this.key = storageManager.storageKeys.WORLD_CLOCKS;
    }

    /**
     * 保存世界时钟数据
     * @param {Array} worldClocks - 世界时钟数组
     */
    saveWorldClocks(worldClocks) {
        this.storage.save(this.key, worldClocks);
    }

    /**
     * 加载世界时钟数据
     * @returns {Array} 世界时钟数组
     */
    loadWorldClocks() {
        return this.storage.load(this.key, []);
    }

    /**
     * 添加世界时钟
     * @param {Object} clock - 时钟对象
     */
    addWorldClock(clock) {
        const clocks = this.loadWorldClocks();
        clocks.push(clock);
        this.saveWorldClocks(clocks);
    }

    /**
     * 删除世界时钟
     * @param {number} id - 时钟ID
     */
    removeWorldClock(id) {
        const clocks = this.loadWorldClocks();
        const filteredClocks = clocks.filter(clock => clock.id !== id);
        this.saveWorldClocks(filteredClocks);
    }

    /**
     * 更新世界时钟
     * @param {number} id - 时钟ID
     * @param {Object} updates - 更新数据
     */
    updateWorldClock(id, updates) {
        const clocks = this.loadWorldClocks();
        const index = clocks.findIndex(clock => clock.id === id);
        if (index !== -1) {
            clocks[index] = { ...clocks[index], ...updates };
            this.saveWorldClocks(clocks);
        }
    }
}

/**
 * 闹钟存储管理
 */
class AlarmStorage {
    constructor(storageManager) {
        this.storage = storageManager;
        this.key = storageManager.storageKeys.ALARMS;
    }

    /**
     * 保存闹钟数据
     * @param {Array} alarms - 闹钟数组
     */
    saveAlarms(alarms) {
        this.storage.save(this.key, alarms);
    }

    /**
     * 加载闹钟数据
     * @returns {Array} 闹钟数组
     */
    loadAlarms() {
        return this.storage.load(this.key, []);
    }

    /**
     * 添加闹钟
     * @param {Object} alarm - 闹钟对象
     */
    addAlarm(alarm) {
        const alarms = this.loadAlarms();
        alarms.push(alarm);
        this.saveAlarms(alarms);
    }

    /**
     * 删除闹钟
     * @param {number} id - 闹钟ID
     */
    removeAlarm(id) {
        const alarms = this.loadAlarms();
        const filteredAlarms = alarms.filter(alarm => alarm.id !== id);
        this.saveAlarms(filteredAlarms);
    }

    /**
     * 更新闹钟
     * @param {number} id - 闹钟ID
     * @param {Object} updates - 更新数据
     */
    updateAlarm(id, updates) {
        const alarms = this.loadAlarms();
        const index = alarms.findIndex(alarm => alarm.id === id);
        if (index !== -1) {
            alarms[index] = { ...alarms[index], ...updates };
            this.saveAlarms(alarms);
        }
    }

    /**
     * 切换闹钟状态
     * @param {number} id - 闹钟ID
     */
    toggleAlarm(id) {
        const alarms = this.loadAlarms();
        const index = alarms.findIndex(alarm => alarm.id === id);
        if (index !== -1) {
            alarms[index].isEnabled = !alarms[index].isEnabled;
            this.saveAlarms(alarms);
        }
    }

    /**
     * 获取启用的闹钟
     * @returns {Array} 启用的闹钟数组
     */
    getEnabledAlarms() {
        const alarms = this.loadAlarms();
        return alarms.filter(alarm => alarm.isEnabled);
    }
}

/**
 * 秒表存储管理
 */
class StopwatchStorage {
    constructor(storageManager) {
        this.storage = storageManager;
        this.key = storageManager.storageKeys.STOPWATCHES;
    }

    /**
     * 保存秒表数据
     * @param {Array} stopwatches - 秒表数组
     */
    saveStopwatches(stopwatches) {
        // 保存时保持运行状态，只保存累计时间
        const processedStopwatches = stopwatches.map(sw => {
            if (sw.isRunning) {
                return {
                    ...sw,
                    time: sw.time + (Date.now() - sw.startTime),
                    startTime: Date.now() // 重置开始时间，保持运行状态
                };
            }
            return sw;
        });
        this.storage.save(this.key, processedStopwatches);
    }

    /**
     * 加载秒表数据
     * @returns {Array} 秒表数组
     */
    loadStopwatches() {
        return this.storage.load(this.key, []);
    }

    /**
     * 添加秒表
     * @param {Object} stopwatch - 秒表对象
     */
    addStopwatch(stopwatch) {
        const stopwatches = this.loadStopwatches();
        stopwatches.push(stopwatch);
        this.saveStopwatches(stopwatches);
    }

    /**
     * 删除秒表
     * @param {number} id - 秒表ID
     */
    removeStopwatch(id) {
        const stopwatches = this.loadStopwatches();
        const filteredStopwatches = stopwatches.filter(sw => sw.id !== id);
        this.saveStopwatches(filteredStopwatches);
    }

    /**
     * 更新秒表
     * @param {number} id - 秒表ID
     * @param {Object} updates - 更新数据
     */
    updateStopwatch(id, updates) {
        const stopwatches = this.loadStopwatches();
        const index = stopwatches.findIndex(sw => sw.id === id);
        if (index !== -1) {
            stopwatches[index] = { ...stopwatches[index], ...updates };
            this.saveStopwatches(stopwatches);
        }
    }

    /**
     * 开始秒表
     * @param {number} id - 秒表ID
     */
    startStopwatch(id) {
        const stopwatches = this.loadStopwatches();
        const index = stopwatches.findIndex(sw => sw.id === id);
        if (index !== -1) {
            stopwatches[index].isRunning = true;
            stopwatches[index].startTime = Date.now();
            this.saveStopwatches(stopwatches);
        }
    }

    /**
     * 暂停秒表
     * @param {number} id - 秒表ID
     */
    pauseStopwatch(id) {
        const stopwatches = this.loadStopwatches();
        const index = stopwatches.findIndex(sw => sw.id === id);
        if (index !== -1 && stopwatches[index].isRunning) {
            stopwatches[index].time += Date.now() - stopwatches[index].startTime;
            stopwatches[index].isRunning = false;
            stopwatches[index].startTime = null;
            this.saveStopwatches(stopwatches);
        }
    }

    /**
     * 重置秒表
     * @param {number} id - 秒表ID
     */
    resetStopwatch(id) {
        const stopwatches = this.loadStopwatches();
        const index = stopwatches.findIndex(sw => sw.id === id);
        if (index !== -1) {
            stopwatches[index].time = 0;
            stopwatches[index].isRunning = false;
            stopwatches[index].startTime = null;
            stopwatches[index].laps = [];
            this.saveStopwatches(stopwatches);
        }
    }

    /**
     * 添加计次记录
     * @param {number} id - 秒表ID
     * @param {number} lapTime - 计次时间
     */
    addLap(id, lapTime) {
        const stopwatches = this.loadStopwatches();
        const index = stopwatches.findIndex(sw => sw.id === id);
        if (index !== -1) {
            if (!stopwatches[index].laps) {
                stopwatches[index].laps = [];
            }
            stopwatches[index].laps.push(lapTime);
            this.saveStopwatches(stopwatches);
        }
    }
}

/**
 * 计时器存储管理
 */
class TimerStorage {
    constructor(storageManager) {
        this.storage = storageManager;
        this.key = storageManager.storageKeys.TIMERS;
    }

    /**
     * 保存计时器数据
     * @param {Array} timers - 计时器数组
     */
    saveTimers(timers) {
        // 保存时保持运行状态，只保存剩余时间和运行状态
        const processedTimers = timers.map(timer => {
            if (timer.isRunning) {
                const elapsed = Date.now() - timer.startTime;
                return {
                    ...timer,
                    remainingTime: Math.max(0, timer.remainingTime - elapsed),
                    startTime: Date.now() // 重置开始时间，保持运行状态
                };
            }
            return timer;
        });
        this.storage.save(this.key, processedTimers);
    }

    /**
     * 加载计时器数据
     * @returns {Array} 计时器数组
     */
    loadTimers() {
        return this.storage.load(this.key, []);
    }

    /**
     * 添加计时器
     * @param {Object} timer - 计时器对象
     */
    addTimer(timer) {
        const timers = this.loadTimers();
        timers.push(timer);
        this.saveTimers(timers);
    }

    /**
     * 删除计时器
     * @param {number} id - 计时器ID
     */
    removeTimer(id) {
        const timers = this.loadTimers();
        const filteredTimers = timers.filter(timer => timer.id !== id);
        this.saveTimers(filteredTimers);
    }

    /**
     * 更新计时器
     * @param {number} id - 计时器ID
     * @param {Object} updates - 更新数据
     */
    updateTimer(id, updates) {
        const timers = this.loadTimers();
        const index = timers.findIndex(timer => timer.id === id);
        if (index !== -1) {
            timers[index] = { ...timers[index], ...updates };
            this.saveTimers(timers);
        }
    }

    /**
     * 开始计时器
     * @param {number} id - 计时器ID
     */
    startTimer(id) {
        const timers = this.loadTimers();
        const index = timers.findIndex(timer => timer.id === id);
        if (index !== -1) {
            timers[index].isRunning = true;
            timers[index].startTime = Date.now();
            this.saveTimers(timers);
        }
    }

    /**
     * 暂停计时器
     * @param {number} id - 计时器ID
     */
    pauseTimer(id) {
        const timers = this.loadTimers();
        const index = timers.findIndex(timer => timer.id === id);
        if (index !== -1 && timers[index].isRunning) {
            const elapsed = Date.now() - timers[index].startTime;
            timers[index].remainingTime = Math.max(0, timers[index].remainingTime - elapsed);
            timers[index].isRunning = false;
            timers[index].startTime = null;
            this.saveTimers(timers);
        }
    }

    /**
     * 重置计时器
     * @param {number} id - 计时器ID
     */
    resetTimer(id) {
        const timers = this.loadTimers();
        const index = timers.findIndex(timer => timer.id === id);
        if (index !== -1) {
            timers[index].remainingTime = timers[index].totalTime;
            timers[index].isRunning = false;
            timers[index].startTime = null;
            this.saveTimers(timers);
        }
    }

    /**
     * 设置计时器时间
     * @param {number} id - 计时器ID
     * @param {number} hours - 小时
     * @param {number} minutes - 分钟
     * @param {number} seconds - 秒
     */
    setTimerTime(id, hours, minutes, seconds) {
        const timers = this.loadTimers();
        const index = timers.findIndex(timer => timer.id === id);
        if (index !== -1) {
            const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
            const maxTime = 48 * 3600 * 1000; // 48小时
            const finalTime = Math.min(totalMs, maxTime);
            timers[index].totalTime = finalTime;
            timers[index].remainingTime = finalTime;
            this.saveTimers(timers);
        }
    }
}

/**
 * 设置存储管理
 */
class SettingsStorage {
    constructor(storageManager) {
        this.storage = storageManager;
        this.key = storageManager.storageKeys.SETTINGS;
    }

    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        this.storage.save(this.key, settings);
    }

    /**
     * 加载设置
     * @returns {Object} 设置对象
     */
    loadSettings() {
        return this.storage.load(this.key, storageManager.defaultSettings);
    }

    /**
     * 更新设置
     * @param {Object} updates - 更新的设置
     */
    updateSettings(updates) {
        const settings = this.loadSettings();
        const newSettings = { ...settings, ...updates };
        this.saveSettings(newSettings);
    }

    /**
     * 获取特定设置
     * @param {string} key - 设置键名
     * @param {any} defaultValue - 默认值
     * @returns {any} 设置值
     */
    getSetting(key, defaultValue = null) {
        const settings = this.loadSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    /**
     * 设置特定设置
     * @param {string} key - 设置键名
     * @param {any} value - 设置值
     */
    setSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        this.saveSettings(settings);
    }
}

// 创建全局存储管理器实例
const storageManager = new StorageManager();

// 创建各功能模块的存储管理器
const worldClockStorage = new WorldClockStorage(storageManager);
const alarmStorage = new AlarmStorage(storageManager);
const stopwatchStorage = new StopwatchStorage(storageManager);
const timerStorage = new TimerStorage(storageManager);
const settingsStorage = new SettingsStorage(storageManager);

// 导出存储管理器供其他模块使用
window.storageManager = storageManager;
window.worldClockStorage = worldClockStorage;
window.alarmStorage = alarmStorage;
window.stopwatchStorage = stopwatchStorage;
window.timerStorage = timerStorage;
window.settingsStorage = settingsStorage; 