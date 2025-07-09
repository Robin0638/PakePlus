// 轻松一刻分组tab切换逻辑

document.addEventListener('DOMContentLoaded', function() {
    const tabBar = document.querySelector('.relax-group-tabs');
    if (!tabBar) return;
    const tabs = tabBar.querySelectorAll('.relax-group-tab');

    // 卡片分组映射：分组名 => 选择器数组
    const groupMap = {
        'score': [
            '.medals-wall',
            '.points-display',
            '.lucky-wheel'
        ],
        'travel': [
            '#horoscope-section'
        ],
        'news': [
            '.hot-section',
            '.history-section'
        ],
        'health': [
            '#water-reminder-panel'
        ],
        'tools': [
            '.lucky-wheel'
        ]
    };

    // 兼容：如果星座运势卡片未加id，尝试自动加
    const horoscope = document.querySelector('.horoscope-section, .horoscope-card, .horoscope');
    if (horoscope && !horoscope.id) horoscope.id = 'horoscope-section';

    function showGroup(group) {
        window.currentRelaxGroup = group; // 记录当前分组
        // 先全部隐藏
        const allCards = [
            ...document.querySelectorAll('.medals-wall'),
            ...document.querySelectorAll('.points-display'),
            ...document.querySelectorAll('.lucky-wheel'),
            ...document.querySelectorAll('#horoscope-section'),
            ...document.querySelectorAll('.hot-section'),
            ...document.querySelectorAll('.history-section'),
            ...document.querySelectorAll('#water-reminder-panel')
        ];
        allCards.forEach(card => card.style.display = 'none');

        if (group === 'all') {
            allCards.forEach(card => card.style.display = '');
        } else if (group === 'news') {
            // 只显示见闻卡片
            ['.hot-section', '.history-section'].forEach(sel => {
                document.querySelectorAll(sel).forEach(card => card.style.display = '');
            });
        } else {
            // 其他分组，显示对应卡片，但强制隐藏.hot-section和.history-section
            const selectors = groupMap[group] || [];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(card => card.style.display = '');
            });
            document.querySelectorAll('.hot-section, .history-section').forEach(card => card.style.display = 'none');
        }
        // 分组切换后主动触发一次积分卡片显示逻辑
        if (typeof window.showRelaxCardsByPoints === 'function') {
            window.showRelaxCardsByPoints();
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const group = this.getAttribute('data-group');
            showGroup(group);
        });
    });

    // 默认显示全部
    showGroup('all');
}); 