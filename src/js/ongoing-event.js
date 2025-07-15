// 依赖 StorageManager 和页面已渲染的事件列表
(function() {
    function isOngoing(event) {
        if (!event.startTime || !event.endTime) return false;
        const now = new Date();
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        return start <= now && now <= end;
    }

    function isPastToday(event) {
        if (!event.startTime || !event.endTime) return false;
        const now = new Date();
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        // 判断是否今天的事件
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);
        // 已结束且是今天的事件
        return startDay.getTime() === today.getTime() && end < now;
    }

    function highlightOngoingEvents() {
        if (!window.StorageManager) return;
        const events = StorageManager.getEvents({ recent: true });
        events.forEach(event => {
            if (!event.id) return;
            const el = document.querySelector(`.task-item[data-id='${event.id}']`);
            if (el) {
                if (isOngoing(event)) {
                    el.classList.add('ongoing-event');
                    el.classList.remove('past-today-event');
                } else if (isPastToday(event)) {
                    el.classList.remove('ongoing-event');
                    el.classList.add('past-today-event');
                } else {
                    el.classList.remove('ongoing-event');
                    el.classList.remove('past-today-event');
                }
            }
        });
    }

    // 监听事件列表渲染（假设事件渲染后会触发自定义事件）
    document.addEventListener('taskListRendered', highlightOngoingEvents);
    // 或定时刷新，防止遗漏
    setInterval(highlightOngoingEvents, 60 * 1000);
    // 页面初次加载后也执行一次
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(highlightOngoingEvents, 500);
    });
    // 供外部手动调用
    window.highlightOngoingEvents = highlightOngoingEvents;
})(); 