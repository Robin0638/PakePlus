// 依赖 StorageManager 和页面已渲染的Things列表
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
        // 判断是否今天的Things
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);
        // 已结束且是今天的Things
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

    // 监听Things列表渲染（假设Things渲染后会触发CustomizationThings）
    document.addEventListener('taskListRendered', highlightOngoingEvents);
    // 或定时刷新，防止遗漏
    setInterval(highlightOngoingEvents, 60 * 1000);
    // 页面初times加载后也执行一times
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(highlightOngoingEvents, 500);
    });
    // 供外部手动调用
    window.highlightOngoingEvents = highlightOngoingEvents;
})(); 