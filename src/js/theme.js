(function() {
    const THEME_KEY = 'theme-mode'; // auto | light | dark
    const btn = document.getElementById('theme-toggle-btn');
    const label = document.getElementById('theme-toggle-label');
    const mBtn = document.getElementById('mobile-theme-toggle-btn');
    const mLabel = document.getElementById('mobile-theme-toggle-label');
    let mode = localStorage.getItem(THEME_KEY) || 'auto';

    function applyTheme(m) {
        document.documentElement.classList.remove('theme-dark');
        document.documentElement.classList.remove('theme-light');
        if (m === 'dark') {
            document.documentElement.classList.add('theme-dark');
            if (label) label.textContent = '深色';
            if (mLabel) mLabel.textContent = '深色';
        } else if (m === 'light') {
            document.documentElement.classList.add('theme-light');
            if (label) label.textContent = '明亮';
            if (mLabel) mLabel.textContent = '明亮';
        } else {
            // auto
            const hour = new Date().getHours();
            if (hour >= 18 || hour < 6) {
                document.documentElement.classList.add('theme-dark');
                if (label) label.textContent = '自动(深色)';
                if (mLabel) mLabel.textContent = '自动(深色)';
            } else {
                document.documentElement.classList.add('theme-light');
                if (label) label.textContent = '自动(明亮)';
                if (mLabel) mLabel.textContent = '自动(明亮)';
            }
        }
    }

    function nextMode(m) {
        if (m === 'auto') return 'light';
        if (m === 'light') return 'dark';
        return 'auto';
    }

    function setTheme(m) {
        mode = m;
        localStorage.setItem(THEME_KEY, m);
        applyTheme(m);
    }

    // 桌面端切换按钮
    if (btn) {
        btn.onclick = function() {
            setTheme(nextMode(mode));
        };
    }
    // 移动端切换按钮
    if (mBtn) {
        mBtn.onclick = function() {
            setTheme(nextMode(mode));
        };
    }

    // 自动切换（每分钟检测一次）
    if (mode === 'auto') {
        setInterval(() => {
            if (localStorage.getItem(THEME_KEY) === 'auto') {
                applyTheme('auto');
            }
        }, 60000);
    }

    // 页面加载时应用主题
    applyTheme(mode);
})(); 