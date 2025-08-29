// rest-reminder.js
(function() {
    // Time period definitions
    const REMINDERS = [
        {
            name: 'breakfast',
            start: {h: 7, m: 0},
            end: {h: 8, m: 30},
            id: 'breakfast-reminder',
            title: '🍞 Don\'t forget breakfast',
            msg: 'Eat a good breakfast for a nutritious day!'
        },
        {
            name: 'lunch',
            start: {h: 11, m: 30},
            end: {h: 13, m: 0},
            id: 'lunch-reminder',
            title: '🍚 Have lunch earlier',
            msg: 'Lunch time! Remember to replenish energy!'
        },
        {
            name: 'dinner',
            start: {h: 17, m: 0},
            end: {h: 19, m: 0},
            id: 'dinner-reminder',
            title: '🍲 Don\'t forget dinner',
            msg: 'Eat dinner on time for a healthy life!'
        },
        {
            name: 'rest',
            start: {h: 23, m: 0},
            end: {h: 4, m: 0},
            id: 'rest-reminder',
            title: '🌙 Rest early',
            msg: 'It\'s late at night, rest well and stay healthy!'
        }
    ];
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5min检查一times
    let reminderTimer = null;

    // --- LocalStorage-based completion tracking ---
    const getTodayStorageKey = () => {
        const today = new Date();
        return `completedRestReminders_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    };

    const getCompletedForToday = () => {
        const key = getTodayStorageKey();
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    };

    const markAsCompleted = (name) => {
        const key = getTodayStorageKey();
        const completed = getCompletedForToday();
        if (!completed.includes(name)) {
            completed.push(name);
            localStorage.setItem(key, JSON.stringify(completed));
        }
    };
    // ---------------------------------------------

    function isInTimeRange(now, start, end) {
        const nowM = now.getHours() * 60 + now.getMinutes();
        const startM = start.h * 60 + start.m;
        const endM = end.h * 60 + end.m;
        if (startM < endM) {
            return nowM >= startM && nowM < endM;
        } else {
            // 跨夜
            return nowM >= startM || nowM < endM;
        }
    }

    function showNotification(id, title, msg, name) {
        if (document.getElementById(id)) return;
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = 'rest-reminder-notification';
        notification.innerHTML = `
            <div class="rest-reminder-content">
                <span class="rest-reminder-title">${title}</span>
                <span class="rest-reminder-msg">${msg}</span>
            </div>
            <div class="rest-reminder-actions">
                <button class="rest-reminder-btn complete-btn">Completed (+5 points)</button>
                <button class="rest-reminder-close">×</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        const closeNotification = () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 450); // 动画时长为0.5秒，稍提前移除
        };

        notification.querySelector('.rest-reminder-close').onclick = closeNotification;
        
        notification.querySelector('.complete-btn').onclick = () => {
            markAsCompleted(name);
            if (window.StorageManager) {
                StorageManager.addPoints(5, '休息提醒', `Completed健康提醒：${name}`);
                 if (window.UIManager) {
                    UIManager.showNotification('Completed，获得5积分', 'success');
                }
            }
            closeNotification();
        };

        setTimeout(closeNotification, 5000); // 5秒后自动Close
    }

    function checkReminders() {
        // Check if the user is logged in
        const userNickname = localStorage.getItem('userNickname');
        if (!userNickname || userNickname === 'Not logged in') {
            return; // Do not show reminders if not logged in
        }

        const now = new Date();
        const completedToday = getCompletedForToday();

        REMINDERS.forEach(reminder => {
            if (!completedToday.includes(reminder.name) && isInTimeRange(now, reminder.start, reminder.end)) {
                showNotification(reminder.id, reminder.title, reminder.msg, reminder.name);
            }
        });
    }

    function startReminders() {
        if (reminderTimer) clearInterval(reminderTimer);
        checkReminders();
        reminderTimer = setInterval(checkReminders, CHECK_INTERVAL);
    }

    // Listen for login state changes
    function handleLoginStateChange() {
        const userNickname = localStorage.getItem('userNickname');
        if (userNickname && userNickname !== 'Not logged in') {
            // User logged in, start reminders
            startReminders();
        } else {
            // User not logged in, stop reminders
            if (reminderTimer) {
                clearInterval(reminderTimer);
                reminderTimer = null;
            }
            // Clear all existing reminder notifications
            const existingNotifications = document.querySelectorAll('.rest-reminder-notification');
            existingNotifications.forEach(notification => {
                notification.remove();
            });
        }
    }

    // 监听localStorage变化
    window.addEventListener('storage', (e) => {
        if (e.key === 'userNickname') {
            handleLoginStateChange();
        }
    });

    // 页面加载时检查登录状态
    window.addEventListener('DOMContentLoaded', () => {
        handleLoginStateChange();
        
        // 监听User Info更新Things
        window.addEventListener('userLoginStateChanged', handleLoginStateChange);
    });
})(); 