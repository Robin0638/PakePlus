1/**
 * 存储管理模块
 * 负责所有数据的存储和读取
 */

// 数据结构
const DEFAULT_DATA = {
    user: {
        nickname: '',
        avatar: 'assets/avatar-default.png'
    },
    settings: {
        theme: 'system',
        notifications: true,
        sounds: true,
        autoStartBreak: true,
        strictMode: false
    },
    events: [],
    projects: [],
    notes: [],
    focusTime: {
        total: 0,
        today: 0,
        history: []
    },
    medals: [
        { id: 'newcomer', name: '初来乍到', icon: '🎯', description: '欢迎使用有数！', unlocked: true },
        { id: 'points-100', name: '积分达人', icon: '🌟', description: '累计获得100积分', unlocked: false },
        { id: 'points-500', name: '积分大师', icon: '💫', description: '累计获得500积分', unlocked: false },
        { id: 'points-1000', name: '积分王者', icon: '✨', description: '累计获得1000积分', unlocked: false },
        { id: 'time-1h', name: '时间探索者', icon: '⏱️', description: '累计使用1小时', unlocked: false },
        { id: 'time-5h', name: '时间管理者', icon: '⌛', description: '累计使用5小时', unlocked: false },
        { id: 'time-24h', name: '时间大师', icon: '⏳', description: '累计使用24小时', unlocked: false },
        { id: 'streak-3', name: '坚持不懈', icon: '🔥', description: '连续使用3天', unlocked: false },
        { id: 'streak-7', name: '持之以恒', icon: '💪', description: '连续使用7天', unlocked: false },
        { id: 'streak-30', name: '习惯养成', icon: '🏆', description: '连续使用30天', unlocked: false }
    ],
    points: 0,
    wheelItems: [
        { text: '听听歌', color: '#4285f4' },
        { text: '歇会儿', color: '#34a853' },
        { text: '打局游戏', color: '#fbbc05' },
        { text: '出去走走', color: '#ea4335' },
        { text: '再忙会儿', color: '#673ab7' },
        { text: '喝杯水', color: '#3f51b5' }
    ],
    loginDates: [],
    lastLogin: null,
    repeatTypes: {
        none: '不重复',
        daily: '每天',
        weekly: '每周',
        monthly: '每月',
        yearly: '每年'
    }
};

// 存储键名
const STORAGE_KEY = 'schedule_app_data';
const BACKUP_KEY_PREFIX = 'schedule_app_backup_';

// 存储所有用户数据
const ALL_USERS_KEY = 'schedule_app_all_users';

// 获取当前登录昵称
function getCurrentNickname() {
    return localStorage.getItem('userNickname') || '';
}

// 获取所有用户数据
function getAllUsersData() {
    const data = localStorage.getItem(ALL_USERS_KEY);
    return data ? JSON.parse(data) : {};
}

// 保存所有用户数据
function saveAllUsersData(allData) {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allData));
}

// 获取当前用户数据
function getCurrentUserData() {
    const nickname = getCurrentNickname();
    const allData = getAllUsersData();
    // 如果没有数据，返回null（后续StorageManager会处理）
    return allData[nickname] || null;
}

// 保存当前用户数据
function saveCurrentUserData(data) {
    const nickname = getCurrentNickname();
    const allData = getAllUsersData();
    allData[nickname] = data;
    saveAllUsersData(allData);
}

/**
 * 存储管理器
 */
const StorageManager = {
    /**
     * 初始化存储
     */
    init() {
        const nickname = getCurrentNickname();
        if (!nickname) {
            // 如果没有昵称，则初始化默认数据
            this.saveData(DEFAULT_DATA);
            return DEFAULT_DATA;
        }

        const userData = getCurrentUserData();
        if (!userData) {
            // 如果昵称存在但数据不存在，则初始化该昵称的数据
            this.saveData(DEFAULT_DATA);
            return DEFAULT_DATA;
        }
        return userData;
    },

    /**
     * 获取所有数据
     */
    getData() {
        const nickname = getCurrentNickname();
        const userData = getCurrentUserData();
        // 如果没有数据，返回默认数据的深拷贝，防止UI串号
        if (!userData) {
            // 不直接返回DEFAULT_DATA，防止引用问题
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
        return userData;
    },

    /**
     * 保存所有数据
     * @param {Object} data 要保存的数据
     */
    saveData(data) {
        const nickname = getCurrentNickname();
        const allData = getAllUsersData();
        allData[nickname] = data;
        saveAllUsersData(allData);
    },

    /**
     * 更新部分数据
     * @param {String} key 数据键名
     * @param {*} value 数据值
     */
    updateData(key, value) {
        const data = this.getData();
        data[key] = value;
        this.saveData(data);
    },

    /**
     * 保存单个倒数日
     * @param {Object} countdown 倒数日对象
     */
    saveCountdown(countdown) {
        const data = this.getData();
        if (!data.countdowns) {
            data.countdowns = [];
        }
        
        const index = data.countdowns.findIndex(c => c.id === countdown.id);
        if (index !== -1) {
            // 更新现有倒数日
            countdown.updateTime = new Date().toISOString();
            if (!countdown.createTime && data.countdowns[index].createTime) {
                countdown.createTime = data.countdowns[index].createTime;
            }
            data.countdowns[index] = countdown;
        } else {
            // 添加新倒数日
            if (!countdown.id) {
                countdown.id = 'countdown_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            if (!countdown.createTime) {
                countdown.createTime = new Date().toISOString();
            }
            countdown.updateTime = new Date().toISOString();
            data.countdowns.push(countdown);
        }
        
        this.saveData(data);
        
        return countdown;
    },

    /**
     * 保存单个清单
     * @param {Object} list 清单对象
     */
    saveList(list) {
        const data = this.getData();
        if (!data.lists) {
            data.lists = [];
        }
        
        // 检查是否存在相同名称的清单
        const existingList = data.lists.find(l => l.name === list.name);
        if (existingList) {
            // 如果存在相同名称的清单，更新现有清单
            list.id = existingList.id;
            list.updateTime = new Date().toISOString();
            if (!list.createTime && existingList.createTime) {
                list.createTime = existingList.createTime;
            }
            const index = data.lists.findIndex(l => l.id === list.id);
            data.lists[index] = list;
        } else {
            // 添加新清单
            if (!list.id) {
                list.id = 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            if (!list.createTime) {
                list.createTime = new Date().toISOString();
            }
            list.updateTime = new Date().toISOString();
            data.lists.push(list);
        }
        
        this.saveData(data);
        
        return list;
    },

    /**
     * 导入数据
     * @param {Object} jsonData 导入的JSON数据
     */
    importData(jsonData) {
        try {
            // 验证数据结构
            const requiredKeys = Object.keys(DEFAULT_DATA);
            const jsonKeys = Object.keys(jsonData);
            
            const missingKeys = requiredKeys.filter(key => !jsonKeys.includes(key));
            if (missingKeys.length > 0) {
                throw new Error(`导入的数据缺少必要字段: ${missingKeys.join(', ')}`);
            }
            
            this.saveData(jsonData);
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    },

    /**
     * 清除所有数据
     */
    clearData() {
        try {
            // 清除所有localStorage数据
            localStorage.clear();
            // 清除所有sessionStorage数据
            sessionStorage.clear();
            // 重新初始化默认数据
            this.init();
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    },

    /**
     * 保存事件
     * @param {Object} event 事件对象
     */
    saveEvent(event) {
        const data = this.getData();
        
        // 确保事件有唯一ID
        if (!event.id) {
            event.id = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // 检查是否已存在相同ID的事件
        const existingIndex = data.events.findIndex(e => e.id === event.id);
        if (existingIndex !== -1) {
            // 更新现有事件，保持完成状态
            const existingEvent = data.events[existingIndex];
            data.events[existingIndex] = {
                ...existingEvent,
                ...event,
                // 保持原有的完成状态，除非明确要修改
                completed: event.completed !== undefined ? event.completed : existingEvent.completed,
                completedTime: event.completedTime !== undefined ? event.completedTime : existingEvent.completedTime,
                updateTime: new Date().toISOString()
            };
        } else {
            // 添加新事件
            event.createTime = new Date().toISOString();
            event.updateTime = event.createTime;
            data.events.push(event);
        }
        
        this.saveData(data);
        
        // 如果事件有关联的项目，更新项目统计信息
        if (event.projectId) {
            this.updateProjectStats(event.projectId);
        }
        
        return event.id;
    },

    /**
     * 获取事件列表
     * @param {Object} filter 过滤条件
     */
    getEvents(filter = {}) {
        const data = this.getData();
        let events = [...data.events];
        
        // 按条件过滤
        if (filter.completed !== undefined) {
            events = events.filter(e => e.completed === filter.completed);
        }
        
        if (filter.projectId) {
            events = events.filter(e => e.projectId === filter.projectId);
        }
        
        if (filter.startDate && filter.endDate) {
            const start = new Date(filter.startDate).getTime();
            const end = new Date(filter.endDate).getTime();
            
            events = events.filter(e => {
                const eventStart = e.startTime ? new Date(e.startTime).getTime() : 0;
                return eventStart >= start && eventStart <= end;
            });
        }
        
        // 如果是最近的事件，按时间排序
        if (filter.recent) {
            events.sort((a, b) => {
                const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
                const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
                return aTime - bTime;
            });
        }
        
        return events;
    },

    /**
     * 获取指定ID的事件
     * @param {String} eventId 事件ID
     * @returns {Object|null} 事件对象，如果未找到则返回null
     */
    getEventById(eventId) {
        const data = this.getData();
        return data.events.find(e => e.id === eventId) || null;
    },

    /**
     * 删除事件
     * @param {String} eventId 事件ID
     */
    deleteEvent(eventId) {
        const data = this.getData();
        const index = data.events.findIndex(e => e.id === eventId);
        
        if (index !== -1) {
            // 保存项目ID以便后续更新统计
            const projectId = data.events[index].projectId;
            
            data.events.splice(index, 1);
            this.saveData(data);
            
            // 如果事件有关联的项目，更新项目统计信息
            if (projectId) {
                this.updateProjectStats(projectId);
            }
            
            return true;
        }
        
        return false;
    },

    /**
     * 标记事件完成状态
     * @param {String} eventId 事件ID
     * @param {Boolean} completed 是否完成
     * @returns {Boolean} 是否更新成功
     */
    markEventCompleted(eventId, completed) {
        if (!eventId) {
            console.error('缺少事件ID');
            return false;
        }
        
        const data = this.getData();
        // 使用严格匹配确保找到正确的事件
        const eventIndex = data.events.findIndex(e => e.id === eventId);
        
        if (eventIndex !== -1) {
            // 保存修改前的状态和项目ID
            const previousState = data.events[eventIndex].completed;
            const projectId = data.events[eventIndex].projectId;
            
            // 只更新当前事件的完成状态
            data.events[eventIndex] = {
                ...data.events[eventIndex],
                completed: completed,
                completedTime: completed ? new Date().toISOString() : null,
                updateTime: new Date().toISOString()
            };
            
            // 保存数据
            this.saveData(data);
            
            // 如果完成状态发生变化，更新积分
            if (previousState !== completed) {
                // 完成任务加分，取消完成减分
                if (completed) {
                    this.addPoints(20);
                } else {
                    this.addPoints(-20);
                }
            }
            
            // 如果事件有关联的项目，更新项目统计信息
            if (projectId) {
                this.updateProjectStats(projectId);
            }
            
            return true;
        } else {
            console.error(`未找到ID为 ${eventId} 的事件`);
            return false;
        }
    },

    /**
     * 获取或创建项目
     * @param {String} projectName 项目名称
     */
    getOrCreateProject(projectName) {
        if (!projectName) return null;
        
        const data = this.getData();
        
        // 确保projects数组存在
        if (!data.projects) {
            data.projects = [];
        }
        
        // 查找现有项目（按名称匹配）
        let project = data.projects.find(p => p.name === projectName);
        
        if (!project) {
            // 创建新项目，使用更安全的ID生成方式
            project = {
                id: 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: projectName,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
                tasks: [], // 添加任务数组
                priority: 2, // 默认中等优先级
                startDate: null,
                deadline: null
            };
            data.projects.push(project);
            this.saveData(data);
        } else {
            // 更新现有项目的更新时间
            project.updateTime = new Date().toISOString();
            this.saveData(data);
        }
        
        return project;
    },

    /**
     * 获取所有项目
     */
    getProjects() {
        const data = this.getData();
        return data.projects;
    },

    /**
     * 获取项目的统计信息
     * @param {String} projectId 项目ID
     */
    getProjectStats(projectId) {
        const data = this.getData();
        const events = data.events.filter(e => e.projectId === projectId);
        
        const total = events.length;
        const completed = events.filter(e => e.completed).length;
        const uncompleted = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            total,
            completed,
            uncompleted,
            progress
        };
    },

    /**
     * 更新用户信息
     * @param {Object} userInfo 用户信息
     */
    updateUserInfo(userInfo) {
        const data = this.getData();
        
        // 如果有头像数据且是 File 对象，转换为 Base64
        if (userInfo.avatar instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                data.user = { 
                    ...data.user, 
                    ...userInfo,
                    avatar: e.target.result // 存储 Base64 格式的图片数据
                };
                this.saveData(data);
            };
            reader.readAsDataURL(userInfo.avatar);
        } else {
            data.user = { ...data.user, ...userInfo };
            this.saveData(data);
        }
    },

    /**
     * 获取用户信息
     */
    getUserInfo() {
        const data = this.getData();
        // 如果没有user字段，返回默认user
        return data.user || { ...DEFAULT_DATA.user };
    },

    /**
     * 更新设置
     * @param {Object} settings 设置信息
     */
    updateSettings(settings) {
        const data = this.getData();
        const currentSettings = data.settings || DEFAULT_DATA.settings;
        
        // 验证设置值
        const validatedSettings = {
            theme: ['light', 'dark', 'system', 'auto'].includes(settings.theme) ? settings.theme : currentSettings.theme,
            notifications: typeof settings.notifications === 'boolean' ? settings.notifications : currentSettings.notifications,
            sounds: typeof settings.sounds === 'boolean' ? settings.sounds : currentSettings.sounds,
            autoStartBreak: typeof settings.autoStartBreak === 'boolean' ? settings.autoStartBreak : currentSettings.autoStartBreak,
            strictMode: typeof settings.strictMode === 'boolean' ? settings.strictMode : currentSettings.strictMode
        };
        
        // 合并设置
        data.settings = { ...currentSettings, ...validatedSettings };
        
        // 保存数据
        this.saveData(data);
        
        return data.settings;
    },

    /**
     * 获取设置
     * @returns {Object} 设置对象
     */
    getSettings() {
        const data = this.getData();
        return data?.settings || { ...DEFAULT_DATA.settings };
    },

    /**
     * 记录专注时间
     * @param {Number} minutes 专注分钟数
     * @param {String} eventId 关联的事件ID
     */
    recordFocusTime(minutes, eventId = null) {
        const data = this.getData();
        const today = new Date().toISOString().slice(0, 10);
        
        // 更新总时间
        data.focusTime.total += minutes;
        
        // 更新今日时间
        const todayRecord = data.focusTime.history.find(h => h.date === today);
        if (todayRecord) {
            todayRecord.minutes += minutes;
            if (eventId) {
                const eventRecord = todayRecord.events.find(e => e.id === eventId);
                if (eventRecord) {
                    eventRecord.minutes += minutes;
                } else {
                    todayRecord.events.push({ id: eventId, minutes });
                }
            }
        } else {
            data.focusTime.history.push({
                date: today,
                minutes,
                events: eventId ? [{ id: eventId, minutes }] : []
            });
        }
        
        // 更新今日时间
        data.focusTime.today = todayRecord ? todayRecord.minutes : minutes;
        
        // 如果完成了专注，添加积分
        this.addPoints(Math.floor(minutes / 5));
        
        this.saveData(data);
        return data.focusTime;
    },

    /**
     * 获取专注时间信息
     */
    getFocusTimeInfo() {
        const data = this.getData();
        
        // 检查是否需要重置今日时间
        const today = new Date().toISOString().slice(0, 10);
        const todayRecord = data.focusTime.history.find(h => h.date === today);
        
        if (!todayRecord) {
            data.focusTime.today = 0;
            this.saveData(data);
        } else {
            data.focusTime.today = todayRecord.minutes;
        }
        
        return data.focusTime;
    },

    /**
     * 添加积分
     * @param {Number} points 积分数量
     * @param {String} type 积分类型（如'番茄钟'、'任务'等）
     * @param {String} desc 说明
     */
    addPoints(points, type = '', desc = '') {
        const data = this.getData();
        data.points += points;
        if (data.points < 0) data.points = 0;
        // 记录积分明细
        if (!Array.isArray(data.pointsHistory)) data.pointsHistory = [];
        data.pointsHistory.push({
            points,
            type,
            desc,
            time: new Date().toISOString()
        });
        this.saveData(data);
        // 更新顶部积分显示
        if (window.UIManager) {
            UIManager.updateHeaderPoints();
        }
        return data.points;
    },

    /**
     * 获取积分
     */
    getPoints() {
        const data = this.getData();
        return data.points;
    },

    /**
     * 获取所有勋章
     */
    getMedals() {
        const data = this.getData();
        return data.medals;
    },

    /**
     * 解锁勋章
     * @param {String} medalId 勋章ID
     */
    unlockMedal(medalId) {
        const data = this.getData();
        const medal = data.medals.find(m => m.id === medalId);
        
        if (medal && !medal.unlocked) {
            medal.unlocked = true;
            medal.unlockTime = new Date().toISOString();
            this.saveData(data);
            
            // 解锁勋章奖励积分
            this.addPoints(100);
            
            return true;
        }
        
        return false;
    },

    /**
     * 获取转盘项目
     */
    getWheelItems() {
        const data = this.getData();
        return data.wheelItems;
    },

    /**
     * 更新转盘项目
     * @param {Array} items 转盘项目
     */
    updateWheelItems(items) {
        const data = this.getData();
        data.wheelItems = items;
        this.saveData(data);
    },

    /**
     * 记录登录
     */
    recordLogin() {
        const data = this.getData();
        const today = new Date().toISOString().slice(0, 10);
        
        // 避免重复记录同一天
        if (!data.loginDates.includes(today)) {
            data.loginDates.push(today);
            
            // 检查连续登录天数
            let streak = 1;
            const sortedDates = [...data.loginDates].sort((a, b) => new Date(b) - new Date(a));
            
            for (let i = 1; i < sortedDates.length; i++) {
                const currDate = new Date(sortedDates[i-1]);
                const prevDate = new Date(sortedDates[i]);
                
                // 计算日期差
                const diffTime = Math.abs(currDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }
            
            // 检查是否满足勋章条件
            if (streak >= 10) {
                this.unlockMedal('streak10');
            }
            
            if (streak >= 22) {
                this.unlockMedal('streak22');
            }
        }
        
        data.lastLogin = today;
        this.saveData(data);
    },

    /**
     * 获取CSV格式的事件数据
     * @param {Object} filter 过滤条件
     */
    getEventsCSV(filter = {}) {
        const events = this.getEvents(filter);
        
        if (events.length === 0) {
            return null;
        }
        
        // 如果有项目ID，添加项目名称作为标题
        let title = '';
        if (filter.projectId) {
            const project = this.getProjects().find(p => p.id === filter.projectId);
            if (project) {
                title = `${project.name}\n`;
            }
        }
        
        // CSV 头
        const headers = ['事件名称', '所属项目', '开始时间', '结束时间', '地点', '参与人员', '是否完成', '创建时间', '备注'];
        
        // 转换数据
        const rows = events.map(event => {
            const project = event.projectId ? this.getProjects().find(p => p.id === event.projectId)?.name || '' : '';
            
            return [
                event.name,
                project,
                event.startTime || '',
                event.endTime || '',
                event.location || '',
                event.participants || '',
                event.completed ? '是' : '否',
                event.createTime ? new Date(event.createTime).toLocaleString() : '',
                event.notes || ''
            ];
        });
        
        // 合并成CSV
        const csvContent = [
            title,
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].filter(line => line).join('\n');
        
        return csvContent;
    },

    /**
     * 获取ICS格式的事件数据
     * @param {Object} filter 过滤条件
     */
    getEventsICS(filter = {}) {
        const events = this.getEvents(filter);
        
        if (events.length === 0) {
            return null;
        }
        
        // 获取项目名称（如果有）
        let projectName = '';
        if (filter.projectId) {
            const project = this.getProjects().find(p => p.id === filter.projectId);
            if (project) {
                projectName = project.name;
            }
        }
        
        // ICS 头部
        const icsHeader = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TaskManager//CN',
            'CALSCALE:GREGORIAN',
            projectName ? `X-WR-CALNAME:${projectName}` : '',
            'METHOD:PUBLISH'
        ].filter(line => line).join('\r\n');
        
        // 转换事件为ICS格式
        const icsEvents = events.map(event => {
            const lines = [
                'BEGIN:VEVENT',
                `UID:${event.id || Date.now().toString()}`,
                `SUMMARY:${event.name}`,
                event.startTime ? `DTSTART:${new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z` : '',
                event.endTime ? `DTEND:${new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z` : '',
                event.location ? `LOCATION:${event.location}` : '',
                event.participants ? `DESCRIPTION:参与人员：${event.participants}` : '',
                event.notes ? `DESCRIPTION:${event.notes}` : '',
                'END:VEVENT'
            ].filter(line => line);
            
            return lines.join('\r\n');
        });
        
        // ICS 尾部
        const icsFooter = 'END:VCALENDAR';
        
        return [icsHeader, ...icsEvents, icsFooter].join('\r\n');
    },

    /**
     * 获取TXT格式的事件数据
     * @param {Object} filter 过滤条件
     */
    getEventsTXT(filter = {}) {
        const events = this.getEvents(filter);
        
        if (events.length === 0) {
            return null;
        }
        
        let content = '';
        
        // 如果有项目ID，添加项目名称作为标题
        if (filter.projectId) {
            const project = this.getProjects().find(p => p.id === filter.projectId);
            if (project) {
                content += `${project.name}\n`;
                content += '='.repeat(project.name.length) + '\n\n';
            }
        } else {
            content += '日程列表\n';
            content += '='.repeat(20) + '\n\n';
        }
        
        events.forEach(event => {
            const project = event.projectId ? this.getProjects().find(p => p.id === event.projectId)?.name || '' : '';
            
            content += `事件：${event.name}\n`;
            if (project) content += `项目：${project}\n`;
            if (event.startTime) {
                content += `时间：${new Date(event.startTime).toLocaleString()}`;
                if (event.endTime) {
                    content += ` - ${new Date(event.endTime).toLocaleString()}`;
                }
                content += '\n';
            }
            if (event.location) content += `地点：${event.location}\n`;
            if (event.participants) content += `参与人员：${event.participants}\n`;
            content += `状态：${event.completed ? '已完成' : '未完成'}\n`;
            if (event.notes) content += `备注：${event.notes}\n`;
            content += '-'.repeat(40) + '\n\n';
        });
        
        return content;
    },

    /**
     * 获取Markdown格式的事件数据
     * @param {Object} filter 过滤条件
     */
    getEventsMD(filter = {}) {
        const events = this.getEvents(filter);
        
        if (events.length === 0) {
            return null;
        }
        
        let content = '';
        
        // 如果有项目ID，添加项目名称作为标题
        if (filter.projectId) {
            const project = this.getProjects().find(p => p.id === filter.projectId);
            if (project) {
                content += `# ${project.name}\n\n`;
            }
        } else {
            content += '# 日程列表\n\n';
        }
        
        events.forEach(event => {
            const project = event.projectId ? this.getProjects().find(p => p.id === event.projectId)?.name || '' : '';
            
            content += `## ${event.name}\n\n`;
            if (project) content += `**项目：**${project}\n\n`;
            if (event.startTime) {
                content += `**时间：**${new Date(event.startTime).toLocaleString()}`;
                if (event.endTime) {
                    content += ` - ${new Date(event.endTime).toLocaleString()}`;
                }
                content += '\n\n';
            }
            if (event.location) content += `**地点：**${event.location}\n\n`;
            if (event.participants) content += `**参与人员：**${event.participants}\n\n`;
            content += `**状态：**${event.completed ? '已完成' : '未完成'}\n\n`;
            if (event.notes) content += `**备注：**${event.notes}\n\n`;
            content += '---\n\n';
        });
        
        return content;
    },

    /**
     * 删除项目
     * @param {String} projectId 项目ID
     * @returns {Boolean} 是否删除成功
     */
    deleteProject(projectId) {
        const data = this.getData();
        const projectIndex = data.projects.findIndex(p => p.id === projectId);
        
        if (projectIndex !== -1) {
            // 删除项目
            data.projects.splice(projectIndex, 1);
            
            // 删除该项目下的所有相关日程
            data.events = data.events.filter(event => event.projectId !== projectId);
            
            this.saveData(data);
            return true;
        }
        
        return false;
    },

    /**
     * 更新专注时间记录
     * @param {number} duration 本次专注时长（分钟）
     * @param {string} taskId 任务ID
     */
    updateFocusTime(duration, taskId) {
        const data = this.getData();
        
        // 获取任务信息
        const task = data.events.find(e => e.id === taskId);
        if (!task) return;
        
        // 更新任务的总专注时间
        task.totalFocusTime = (task.totalFocusTime || 0) + duration;
        
        // 更新任务的本次专注时间
        task.lastFocusTime = duration;
        
        // 更新任务的最后专注时间
        task.lastFocusDate = new Date().toISOString();
        
        // 保存数据
        this.saveData(data);
        
        // 更新用户总专注时间
        const userData = this.getUserData();
        userData.totalFocusTime = (userData.totalFocusTime || 0) + duration;
        
        // 计算并添加积分
        // 基础积分：每5分钟1分
        const basePoints = Math.floor(duration / 5);
        
        // 连续专注奖励：如果连续专注超过1次，额外加分
        const focusCount = userData.focusCount || 0;
        const streakBonus = focusCount > 1 ? Math.min(10, focusCount) : 0;
        
        // 总积分
        const totalPoints = basePoints + streakBonus;
        
        // 更新积分
        userData.points = (userData.points || 0) + totalPoints;
        
        // 更新专注次数
        userData.focusCount = (userData.focusCount || 0) + 1;
        
        // 更新专注历史记录
        const today = new Date().toISOString().split('T')[0];
        if (!userData.focusHistory) {
            userData.focusHistory = [];
        }
        
        // 查找今天的记录
        let todayRecord = userData.focusHistory.find(h => h.date === today);
        if (!todayRecord) {
            todayRecord = {
                date: today,
                duration: 0,
                points: 0,
                tasks: []
            };
            userData.focusHistory.push(todayRecord);
        }
        
        // 更新今天的记录
        todayRecord.duration += duration;
        todayRecord.points += totalPoints;
        
        // 更新任务记录
        const taskRecord = todayRecord.tasks.find(t => t.id === taskId);
        if (taskRecord) {
            taskRecord.duration += duration;
            taskRecord.points += totalPoints;
        } else {
            todayRecord.tasks.push({
                id: taskId,
                name: task.name,
                duration: duration,
                points: totalPoints
            });
        }
        
        // 保存用户数据
        this.saveUserData(userData);
        
        // 返回积分信息
        return {
            basePoints,
            streakBonus,
            totalPoints,
            todayDuration: todayRecord.duration,
            todayPoints: todayRecord.points
        };
    },

    /**
     * 获取用户数据
     */
    getUserData() {
        const data = this.getData();
        return {
            totalFocusTime: data.focusTime?.total || 0,
            todayFocusTime: data.focusTime?.today || 0,
            points: data.points || 0,
            focusCount: data.focusCount || 0,
            focusHistory: data.focusTime?.history || []
        };
    },

    /**
     * 保存用户数据
     * @param {Object} userData 用户数据
     */
    saveUserData(userData) {
        const data = this.getData();
        
        // 更新专注时间
        data.focusTime = {
            total: userData.totalFocusTime,
            today: userData.todayFocusTime,
            history: userData.focusHistory
        };
        
        // 更新积分
        data.points = userData.points;
        
        // 更新专注次数
        data.focusCount = userData.focusCount;
        
        // 保存数据
        this.saveData(data);
    },

    /**
     * 创建本地备份
     * @returns {Object} 备份信息，包括备份ID、创建时间等
     */
    createLocalBackup() {
        try {
            const currentData = this.getData();
            if (!currentData) {
                throw new Error('没有数据可备份');
            }
            
            // 创建备份ID和元信息
            const backupId = Date.now().toString();
            const backupMeta = {
                id: backupId,
                createdAt: new Date().toISOString(),
                description: `自动备份 - ${new Date().toLocaleString('zh-CN')}`,
                dataSize: JSON.stringify(currentData).length,
                eventCount: currentData.events.length,
                projectCount: currentData.projects.length
            };
            
            // 存储备份和元信息
            const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
            localStorage.setItem(backupKey, JSON.stringify({
                meta: backupMeta,
                data: currentData
            }));
            
            // 更新备份索引
            const backupIndex = this.getBackupIndex();
            backupIndex.push(backupMeta);
            localStorage.setItem(`${BACKUP_KEY_PREFIX}index`, JSON.stringify(backupIndex));
            
            return backupMeta;
        } catch (error) {
            console.error('创建备份失败:', error);
            throw error;
        }
    },
    
    /**
     * 获取备份索引列表
     * @returns {Array} 备份列表，按创建时间降序排列
     */
    getBackupIndex() {
        try {
            const indexJson = localStorage.getItem(`${BACKUP_KEY_PREFIX}index`);
            const index = indexJson ? JSON.parse(indexJson) : [];
            
            // 按创建时间降序排列
            return index.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('获取备份索引失败:', error);
            return [];
        }
    },
    
    /**
     * 获取特定备份的详细信息
     * @param {String} backupId 备份ID
     * @returns {Object} 备份详细信息
     */
    getBackupDetails(backupId) {
        try {
            const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
            const backupJson = localStorage.getItem(backupKey);
            
            if (!backupJson) {
                throw new Error('备份不存在');
            }
            
            return JSON.parse(backupJson);
        } catch (error) {
            console.error(`获取备份 ${backupId} 详情失败:`, error);
            throw error;
        }
    },
    
    /**
     * 恢复特定备份
     * @param {String} backupId 备份ID
     * @returns {Boolean} 恢复是否成功
     */
    restoreFromBackup(backupId) {
        try {
            const backupJson = localStorage.getItem(`${BACKUP_KEY_PREFIX}${backupId}`);
            if (!backupJson) {
                throw new Error('备份不存在');
            }
            
            const backup = JSON.parse(backupJson);
            if (!backup.data) {
                throw new Error('备份数据无效');
            }
            
            // 恢复数据
            this.saveData(backup.data);
            
            // 创建一个恢复前的备份（以防需要回滚）
            this.createLocalBackup();
            
            return true;
        } catch (error) {
            console.error(`从备份 ${backupId} 恢复失败:`, error);
            return false;
        }
    },
    
    /**
     * 删除特定备份
     * @param {String} backupId 备份ID
     * @returns {Boolean} 删除是否成功
     */
    deleteBackup(backupId) {
        try {
            const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
            localStorage.removeItem(backupKey);
            
            // 更新备份索引
            const backupIndex = this.getBackupIndex();
            const updatedIndex = backupIndex.filter(backup => backup.id !== backupId);
            localStorage.setItem(`${BACKUP_KEY_PREFIX}index`, JSON.stringify(updatedIndex));
            
            return true;
        } catch (error) {
            console.error(`删除备份 ${backupId} 失败:`, error);
            return false;
        }
    },
    
    /**
     * 更新备份描述
     * @param {String} backupId 备份ID
     * @param {String} description 新描述
     * @returns {Boolean} 更新是否成功
     */
    updateBackupDescription(backupId, description) {
        try {
            // 获取备份信息
            const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
            const backupJson = localStorage.getItem(backupKey);
            
            if (!backupJson) {
                throw new Error('备份不存在');
            }
            
            const backup = JSON.parse(backupJson);
            backup.meta.description = description;
            
            // 保存更新后的备份
            localStorage.setItem(backupKey, JSON.stringify(backup));
            
            // 更新备份索引
            const backupIndex = this.getBackupIndex();
            const updatedIndex = backupIndex.map(item => {
                if (item.id === backupId) {
                    return { ...item, description };
                }
                return item;
            });
            
            localStorage.setItem(`${BACKUP_KEY_PREFIX}index`, JSON.stringify(updatedIndex));
            
            return true;
        } catch (error) {
            console.error(`更新备份 ${backupId} 描述失败:`, error);
            return false;
        }
    },
    
    /**
     * 清除所有备份
     * @returns {Boolean} 清除是否成功
     */
    clearAllBackups() {
        try {
            // 获取所有备份ID
            const backupIndex = this.getBackupIndex();
            
            // 删除每个备份
            backupIndex.forEach(backup => {
                localStorage.removeItem(`${BACKUP_KEY_PREFIX}${backup.id}`);
            });
            
            // 清除备份索引
            localStorage.removeItem(`${BACKUP_KEY_PREFIX}index`);
            
            return true;
        } catch (error) {
            console.error('清除所有备份失败:', error);
            return false;
        }
    },
    /**
     * 获取存储统计信息
     * @returns {Object} 存储统计信息
     */
    getStorageStats() {
        try {
            // 获取当前数据大小
            const currentData = this.getData();
            const currentSize = currentData ? JSON.stringify(currentData).length : 0;
            
            // 获取所有备份信息
            const backups = this.getBackupIndex();
            const backupCount = backups.length;
            
            // 计算总备份大小（估计值）
            let totalBackupSize = 0;
            backups.forEach(backup => {
                totalBackupSize += backup.dataSize || 0;
            });
            
            // localStorage 限制（通常为5MB）
            const localStorageLimit = 5 * 1024 * 1024;
            const usedSpace = this._estimateLocalStorageUsage();
            const availableSpace = Math.max(0, localStorageLimit - usedSpace);
            
            return {
                currentDataSize: this._formatSize(currentSize),
                backupCount,
                totalBackupSize: this._formatSize(totalBackupSize),
                usedSpace: this._formatSize(usedSpace),
                availableSpace: this._formatSize(availableSpace),
                usagePercentage: Math.min(100, Math.round(usedSpace / localStorageLimit * 100))
            };
        } catch (error) {
            console.error('获取存储统计信息失败:', error);
            return {
                error: error.message
            };
        }
    },
    
    /**
     * 估算localStorage已使用空间
     * @returns {Number} 估计使用的字节数
     */
    _estimateLocalStorageUsage() {
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                // 键和值都占用空间
                total += (key.length + value.length) * 2; // 按UTF-16计算（每个字符占2个字节）
            }
            return total;
        } catch (error) {
            console.error('估算存储使用空间失败:', error);
            return 0;
        }
    },
    
    /**
     * 格式化文件大小显示
     * @param {Number} size 字节数
     * @returns {String} 格式化后的大小字符串
     */
    _formatSize(size) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let formattedSize = size;
        let unitIndex = 0;
        
        while (formattedSize >= 1024 && unitIndex < units.length - 1) {
            formattedSize /= 1024;
            unitIndex++;
        }
        
        return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
    },

    /**
     * 更新项目信息
     * @param {Object} project 项目对象
     */
    updateProject(project) {
        const data = this.getData();
        const index = data.projects.findIndex(p => p.id === project.id);
        
        if (index !== -1) {
            project.updateTime = new Date().toISOString();
            data.projects[index] = project;
            this.saveData(data);
            return project;
        }
        
        return null;
    },

    /**
     * 获取与某个事件相关的所有重复事件
     * @param {String} eventId 事件ID
     * @returns {Array} 相关事件数组
     */
    getRelatedEvents(eventId) {
        const data = this.getData();
        const event = data.events.find(e => e.id === eventId);
        
        if (!event) return [];
        
        // 如果事件有重复设置，查找所有具有相同名称和重复设置的事件
        if (event.repeat && event.repeat.type !== 'none') {
            return data.events.filter(e => 
                e.name === event.name && 
                e.repeat && 
                e.repeat.type === event.repeat.type &&
                e.projectId === event.projectId
            );
        }
        
        // 如果没有重复设置，只返回当前事件
        return [event];
    },

    /**
     * 导出所有数据为JSON文件
     */
    exportData() {
        const data = this.getData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `有数备份_${timestamp}.json`;
        if (typeof downloadFile === 'function') {
            downloadFile(url, filename);
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    },

    /**
     * 从JSON文件导入数据
     * @param {File} file JSON文件
     * @returns {Promise<boolean>} 导入是否成功
     */
    importDataFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    // 验证数据结构
                    const requiredKeys = Object.keys(DEFAULT_DATA);
                    const jsonKeys = Object.keys(jsonData);
                    
                    const missingKeys = requiredKeys.filter(key => !jsonKeys.includes(key));
                    if (missingKeys.length > 0) {
                        throw new Error(`导入的数据缺少必要字段: ${missingKeys.join(', ')}`);
                    }
                    
                    this.saveData(jsonData);
                    resolve(true);
                } catch (error) {
                    console.error('导入数据失败:', error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    },

    /**
     * 更新项目统计信息
     * @param {String} projectId 项目ID
     */
    updateProjectStats(projectId) {
        const data = this.getData();
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) return;
        
        // 获取该项目下的所有事件
        const projectEvents = data.events.filter(e => e.projectId === projectId);
        
        // 更新项目统计
        project.totalTasks = projectEvents.length;
        project.completedTasks = projectEvents.filter(e => e.completed).length;
        project.progress = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
        project.updateTime = new Date().toISOString();
        
        this.saveData(data);
        
        return {
            totalTasks: project.totalTasks,
            completedTasks: project.completedTasks,
            progress: project.progress
        };
    },
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化存储
    StorageManager.init();
    
    // 记录登录
    StorageManager.recordLogin();
});

// 导出
window.StorageManager = StorageManager; 