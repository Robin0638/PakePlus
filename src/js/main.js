// 主应用初始化和管理
// 定期检查并更新统计数据
function checkAndUpdateStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('focusStats') || '{"completedPomodoros":0,"totalFocusTime":0,"currentEvent":"Empty"}');
        updateFocusStats(stats);
    } catch (error) {
        console.error('解析统计数据失败:', error);
        // 使用默认值
        updateFocusStats({completedPomodoros:0, totalFocusTime:0, currentEvent:"Empty"});
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化应用');
    
    try {
        // 初始化存储
        StorageManager.init();
        
        // 初始化UI
        UIManager.init();
    
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    
    if (userNickname) {
        // 用户已登录，初始化所有功能
        console.log('用户已登录，初始化所有功能');
        
        // 确保默认显示"Soon"视图
        UIManager.switchView('recent');
        
        // 初始化任务管理器
        TaskManager.init();
        
        // 初始化List管理器
        TodoListManager.init();

        // 初始化 Countdown Day管理器
        CountdownManager.init();
        
        // 初始化底部导航栏（仅在用户已登录时）
        if (window.BottomNavNewManager) {
            window.BottomNavNewManager.init();
        }
        
        // 初始化侧边菜单栏（仅在桌面端且用户已登录时）
        if (window.SidebarNavManager) {
            window.SidebarNavManager.init();
        }
        
        // 初始化AI浮球（仅在用户已登录时）
        if (window.AIFloatButtonManager) {
            window.AIFloatButtonManager.init();
        }
    } else {
        // 用户未登录，只初始化基础功能
        console.log('用户未登录，只初始化基础功能');
        
        // 显示登录界面
        UIManager.showLoginIfNeeded();
    }

    // 在UIManager.handleLogin成功后，主动初始化侧边栏
    if (window.UIManager) {
        const oldHandleLogin = UIManager.handleLogin;
        UIManager.handleLogin = function(...args) {
            const result = oldHandleLogin.apply(this, args);
            // 登录成功后延迟初始化侧边栏，确保DOM已渲染
            if (window.SidebarNavManager && typeof SidebarNavManager.init === 'function') {
                setTimeout(() => {
                    SidebarNavManager.init();
                }, 100);
            }
            return result;
        };
    }

    // Focus窗口打开处理
    const openFocusWindow = document.getElementById('open-focus-window');
    if (openFocusWindow) {
        openFocusWindow.addEventListener('click', function() {
            try {
                // 检查TaskManager是否存在
                if (typeof TaskManager === 'undefined') {
                    throw new Error('TaskManager未初始化');
                }

                // 获取当前任务列表
                const tasks = TaskManager.getTasks ? TaskManager.getTasks() : [];
                console.log('获取到的任务列表:', tasks);
                
                if (!Array.isArray(tasks)) {
                    throw new Error('获取任务列表失败');
                }

                // 将任务数据存储到sessionStorage
                sessionStorage.setItem('focusTasks', JSON.stringify(tasks));
                
                // 尝试打开新窗口
                const focusWindow = window.open('./pomodoro_tracker.html', 'focus_window', 'width=800,height=600');
                
                if (focusWindow) {
                    console.log('Focus窗口已打开');
                    // 添加窗口加载完成的检查
                    focusWindow.onload = function() {
                        console.log('Focus窗口加载完成');
                    };
                } else {
                    console.error('窗口打开失败');
                    alert('请允许浏览器打开新窗口，或检查pomodoro_tracker.html文件是否存在');
                }
            } catch (error) {
                console.error('打开Focus窗口时出错:', error);
                alert('打开Focus窗口失败: ' + error.message);
            }
        });
    } else {
        console.error('未找到打开Focus按钮');
    }
        
        // 页面加载时立即检查一times统计数据
        checkAndUpdateStats();

        // 优化定时器：使用单个定时器处理多个任务
        // 每秒检查专注状态
        setInterval(checkFocusStatus, 1000);
        
        // 每5秒检查一times统计数据
        setInterval(checkFocusStats, 5000);
        
        // 每30秒更新一times统计数据
        setInterval(checkAndUpdateStats, 30000);

        // 初始加载统计数据
        checkFocusStats();
        
        // 页面加载时立即检查专注状态
        checkFocusStatus();
        
        // 检查小工具冷却状态
        checkToolsCooldown();
        
        // 登录表单提交验证
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                if (!validateNickname()) {
                    e.preventDefault();
                    return false;
                }
            });
        }
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert('应用初始化失败，请刷新页面重试');
    }
});

// 打开番茄钟页面
function openPomodoroTracker() {
    window.open('pomodoro_tracker.html', '_blank');
}

// Purge所有Content
function clearAllData() {
    // 直接使用新的对话框管理器
    if (window.clearDialogManager) {
        clearDialogManager.show();
    } else {
        // 如果对话框管理器未初始化，直接跳转到Purge页面
        sessionStorage.setItem('clearDataConfirmed', 'true');
        window.location.href = 'clear.html';
    }
}

// 检查积分并重定向到工具页面
function checkPointsAndRedirect() {
    try {
        const lastUseTime = localStorage.getItem('toolsLastUseTime');
        
        // 检查是否在倒计时期间
        if (lastUseTime) {
            const now = new Date().getTime();
            const timeDiff = now - parseInt(lastUseTime);
            const cooldownTime = 24 * 60 * 60 * 1000; // 24小时的毫秒数
            
            if (timeDiff < cooldownTime) {
                // 在倒计时期间，直接跳转
                window.location.href = 'tools.html';
                return;
            }
        }
        
        // 不在倒计时期间，检查积分
        const currentPoints = StorageManager.getPoints();
        if (currentPoints >= 20) {
            // 扣除积分
            StorageManager.addPoints(-20, '工具', '使用工具功能');
            // 更新显示的积分
            UIManager.updateHeaderPoints();
            
            // 记录使用time并开始倒计时
            const lastUseTime = new Date().getTime();
            localStorage.setItem('toolsLastUseTime', lastUseTime);
            startToolsCountdown();
            
            // 跳转到工具页面
            window.location.href = 'tools.html';
        } else {
            // 显示积分不足提示
            UIManager.showNotification('积分不足，需要20积分', 'warning');
        }
    } catch (error) {
        console.error('检查积分失败:', error);
        UIManager.showNotification('检查积分失败，请重试', 'error');
    }
}

// 检查小工具冷却状态
function checkToolsCooldown() {
    try {
        const lastUseTime = localStorage.getItem('toolsLastUseTime');
        if (lastUseTime) {
            const now = new Date().getTime();
            const timeDiff = now - parseInt(lastUseTime);
            const cooldownTime = 24 * 60 * 60 * 1000; // 24小时的毫秒数
            
            if (timeDiff < cooldownTime) {
                // 还在冷却中
                startToolsCountdown();
            } else {
                // 冷却结束
                resetToolsButtons();
            }
        }
    } catch (error) {
        console.error('检查工具冷却状态失败:', error);
        // 出错时重置按钮状态，确保用户可以使用
        resetToolsButtons();
    }
}

// 开始倒计时
function startToolsCountdown() {
    try {
        const toolsBtn = document.getElementById('tools-btn');
        const countdownBtn = document.getElementById('tools-countdown-btn');
        const countdownSpan = document.getElementById('tools-countdown');
        
        if (toolsBtn && countdownBtn && countdownSpan) {
            toolsBtn.style.display = 'none';
            countdownBtn.style.display = 'block';
            
            // 安全地解析time戳
            let lastUseTime;
            try {
                const storedTime = localStorage.getItem('toolsLastUseTime');
                if (!storedTime) {
                    throw new Error('未找到上times使用time');
                }
                lastUseTime = parseInt(storedTime, 10);
                if (isNaN(lastUseTime)) {
                    throw new Error('time戳格式无效');
                }
            } catch (error) {
                console.error('解析time戳失败:', error);
                // 如果解析失败，使用当前time
                lastUseTime = new Date().getTime();
                localStorage.setItem('toolsLastUseTime', lastUseTime.toString());
            }
            
            const cooldownTime = 24 * 60 * 60 * 1000; // 24小时的毫秒数
            let countdownTimer = null;
            
            function updateCountdown() {
                const now = new Date().getTime();
                const timeDiff = now - lastUseTime;
                const remainingTime = cooldownTime - timeDiff;
                
                if (remainingTime <= 0) {
                    // 倒计时结束
                    resetToolsButtons();
                    // Purge定时器
                    if (countdownTimer) {
                        clearTimeout(countdownTimer);
                        countdownTimer = null;
                    }
                    return;
                }
                
                // 计算剩余time
                const hours = Math.floor(remainingTime / (60 * 60 * 1000));
                const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
                
                // 更新显示
                countdownSpan.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                // 继续倒计时
                countdownTimer = setTimeout(updateCountdown, 1000);
            }
            
            updateCountdown();
        }
    } catch (error) {
        console.error('启动倒计时失败:', error);
        // 出错时重置按钮状态
        resetToolsButtons();
    }
}

// 重置按钮显示
function resetToolsButtons() {
    try {
        const toolsBtn = document.getElementById('tools-btn');
        const countdownBtn = document.getElementById('tools-countdown-btn');
        
        if (toolsBtn && countdownBtn) {
            toolsBtn.style.display = 'block';
            countdownBtn.style.display = 'none';
        }
        
        // Purge存储的time
        localStorage.removeItem('toolsLastUseTime');
    } catch (error) {
        console.error('重置工具按钮失败:', error);
    }
}

// 验证昵称
function validateNickname() {
    try {
        const nicknameInput = document.getElementById('nickname-input');
        if (!nicknameInput) {
            console.error('未找到昵称输入框');
            return false;
        }
        
        const nickname = nicknameInput.value.trim();
        const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
        
        if (!nicknameRegex.test(nickname)) {
            nicknameInput.setCustomValidity('昵称长度必须在2-20个字符之间，仅支持中文、英文、数字和下划线');
            return false;
        } else {
            nicknameInput.setCustomValidity('');
            return true;
        }
    } catch (error) {
        console.error('验证昵称失败:', error);
        return false;
    }
}

// 检查专注状态并更新浮窗
function checkFocusStatus() {
    try {
        // 安全地解析 JSON 数据
        let focusStats;
        try {
            const statsData = localStorage.getItem('focusStats');
            focusStats = statsData ? JSON.parse(statsData) : {};
            if (typeof focusStats !== 'object' || focusStats === null) {
                throw new Error('无效的专注状态数据');
            }
        } catch (parseError) {
            console.error('解析专注状态数据失败:', parseError);
            focusStats = {}; // 使用默认空对象
        }
        
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        // 检查当前是否在Focus视图
        const focusModeSection = document.getElementById('focus-mode');
        const isFocusModeActive = focusModeSection && focusModeSection.classList.contains('active');
        
        if (focusStats.isRunning && floatingIndicator) {
            floatingIndicator.classList.add('show');
            floatingIndicator.style.display = 'flex'; // 强制显示
            
            const floatingText = floatingIndicator.querySelector('.focus-floating-text');
            const floatingTimer = floatingIndicator.querySelector('.timer-mini');
            
            // 安全地设置文本Content
            if (floatingText) {
                const eventName = focusStats.currentEvent || 'Empty';
                // 防止XSS攻击，对事件名称进行安全处理
                const safeEventName = eventName
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
                floatingText.textContent = `Focus on: ${safeEventName}`;
            }
            
            if (floatingTimer && focusStats.timeString) {
                // 确保time字符串是有效的格式
                const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
                if (typeof focusStats.timeString === 'string' && timePattern.test(focusStats.timeString)) {
                    floatingTimer.textContent = focusStats.timeString;
                } else {
                    floatingTimer.textContent = '00:00';
                }
            }
        } else if (floatingIndicator) {
            // 只在完全未专注时隐藏
            floatingIndicator.classList.remove('show');
            floatingIndicator.style.display = 'none';
        }
    } catch (error) {
        console.error('检查专注状态失败:', error);
    }
}

// 检查专注统计数据
function checkFocusStats() {
    try {
        // 安全地解析 JSON 数据
        let stats;
        try {
            const statsData = localStorage.getItem('focusStats');
            stats = statsData ? JSON.parse(statsData) : {
                completedPomodoros: 0,
                totalFocusTime: 0,
                currentEvent: "Empty"
            };
            
            // 验证数据格式
            if (typeof stats !== 'object' || stats === null) {
                throw new Error('无效的统计数据格式');
            }
            
            // 确保必要的字段存在
            stats.completedPomodoros = stats.completedPomodoros || 0;
            stats.totalFocusTime = stats.totalFocusTime || 0;
            stats.currentEvent = stats.currentEvent || 'Empty';
            
        } catch (parseError) {
            console.error('解析专注统计数据失败:', parseError);
            // 使用默认值
            stats = {
                completedPomodoros: 0,
                totalFocusTime: 0,
                currentEvent: "Empty"
            };
        }
        
        updateFocusStats(stats);
    } catch (error) {
        console.error('检查专注统计数据失败:', error);
    }
}

// 更新专注Stats
function updateFocusStats(stats) {
    try {
        // 确保stats是有效对象
        if (!stats || typeof stats !== 'object') {
            stats = {
                completedPomodoros: 0,
                totalFocusTime: 0,
                currentEvent: "Empty"
            };
        }
        
        // 安全地更新DOM元素
        const completedElement = document.getElementById('focus-completed-pomodoros');
        const totalTimeElement = document.getElementById('focus-total-time');
        const currentEventElement = document.getElementById('focus-current-event');
        
        if (completedElement) {
            // 确保是数字
            const pomodoros = parseInt(stats.completedPomodoros) || 0;
            completedElement.textContent = pomodoros;
        }
        
        if (totalTimeElement) {
            // 确保是数字
            const totalTime = parseInt(stats.totalFocusTime) || 0;
            totalTimeElement.textContent = totalTime + 'min';
        }
        
        if (currentEventElement) {
            // 防止XSS攻击
            const eventName = stats.currentEvent || 'Empty';
            const safeEventName = String(eventName)
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            currentEventElement.textContent = safeEventName;
        }
    } catch (error) {
        console.error('更新专注统计数据失败:', error);
    }
} 