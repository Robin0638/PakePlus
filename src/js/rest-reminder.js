// rest-reminder.js
(function() {
    // 时间段定义
    const REMINDERS = [
        {
            name: 'breakfast',
            start: {h: 7, m: 0},
            end: {h: 8, m: 30},
            id: 'breakfast-reminder',
            title: '🍞 别忘了吃早餐',
            msg: '早饭要吃好，营养一整天！'
        },
        {
            name: 'lunch',
            start: {h: 11, m: 30},
            end: {h: 13, m: 0},
            id: 'lunch-reminder',
            title: '🍚 早点吃午饭',
            msg: '午餐时间到，记得补充能量！'
        },
        {
            name: 'dinner',
            start: {h: 17, m: 0},
            end: {h: 19, m: 0},
            id: 'dinner-reminder',
            title: '🍲 别忘了吃晚饭',
            msg: '晚餐要按时，健康有活力！'
        },
        {
            name: 'rest',
            start: {h: 23, m: 0},
            end: {h: 4, m: 0},
            id: 'rest-reminder',
            title: '🌙 早点休息',
            msg: '现在已是深夜，注意休息，保持健康！'
        }
    ];
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次
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
                <button class="rest-reminder-btn complete-btn">完成 (+5分)</button>
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
                StorageManager.addPoints(5, '休息提醒', `完成健康提醒：${name}`);
                 if (window.UIManager) {
                    UIManager.showNotification('已完成，获得5积分', 'success');
                }
            }
            closeNotification();
        };

        setTimeout(closeNotification, 5000); // 5秒后自动关闭
    }

    function checkReminders() {
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

    window.addEventListener('DOMContentLoaded', startReminders);
})(); 