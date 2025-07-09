// 主应用初始化和管理
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化应用');
    
    // 初始化存储
    StorageManager.init();
    
    // 初始化UI
    UIManager.init();
    
    // 检查用户是否已登录
    const userNickname = localStorage.getItem('userNickname');
    
    if (userNickname) {
        // 用户已登录，初始化所有功能
        console.log('用户已登录，初始化所有功能');
        
        // 确保默认显示"最近要做"视图
        UIManager.switchView('recent');
        
        // 初始化任务管理器
        TaskManager.init();
        
        // 初始化清单管理器
        TodoListManager.init();

        // 初始化倒数日管理器
        CountdownManager.init();
        
        // 初始化底部导航栏（仅在用户已登录时）
        if (window.BottomNavNewManager) {
            window.BottomNavNewManager.init();
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

    // 专注模式窗口打开处理
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
                    console.log('专注模式窗口已打开');
                    // 添加窗口加载完成的检查
                    focusWindow.onload = function() {
                        console.log('专注模式窗口加载完成');
                    };
                } else {
                    console.error('窗口打开失败');
                    alert('请允许浏览器打开新窗口，或检查pomodoro_tracker.html文件是否存在');
                }
            } catch (error) {
                console.error('打开专注模式窗口时出错:', error);
                alert('打开专注模式窗口失败: ' + error.message);
            }
        });
    } else {
        console.error('未找到打开专注模式按钮');
    }

    // 监听来自番茄时钟窗口的消息
    window.addEventListener('message', function(event) {
        if (event.data.type === 'focusStats') {
            updateFocusStats(event.data.data);
        }
        
        // 处理其他消息类型
        console.log('收到消息:', event.data); // 添加调试日志
        const data = event.data;
        
        switch (data.type) {
            case 'focusStart':
                console.log('开始专注:', data.data); // 添加调试日志
                // 显示专注模式悬浮指示器
                const floatingIndicator = document.getElementById('focus-floating-indicator');
                if (floatingIndicator) {
                    floatingIndicator.classList.add('show');
                    // 更新事件名称
                    const floatingText = floatingIndicator.querySelector('.focus-floating-text');
                    if (floatingText) {
                        floatingText.textContent = `专注进行中: ${data.data.eventName}`;
                    }
                    console.log('已显示悬浮指示器'); // 添加调试日志
                } else {
                    console.error('未找到悬浮指示器元素'); // 添加调试日志
                }
                break;
                
            case 'focusTimerUpdate':
                // 更新悬浮指示器的时间
                const floatingTimer = document.getElementById('floating-timer');
                if (floatingTimer) {
                    floatingTimer.textContent = data.data.timeString;
                }
                // 更新事件名称（如果发生变化）
                const floatingIndicator2 = document.getElementById('focus-floating-indicator');
                if (floatingIndicator2 && data.data.currentEvent) {
                    const floatingText = floatingIndicator2.querySelector('.focus-floating-text');
                    if (floatingText) {
                        floatingText.textContent = `专注进行中: ${data.data.currentEvent}`;
                    }
                }
                break;
                
            case 'focusPause':
                // 暂停时保持浮窗显示，但更新文本
                const floatingIndicator3 = document.getElementById('focus-floating-indicator');
                if (floatingIndicator3) {
                    const floatingText = floatingIndicator3.querySelector('.focus-floating-text');
                    if (floatingText) {
                        floatingText.textContent = '专注已暂停';
                    }
                }
                break;
                
            case 'focusReset':
            case 'focusComplete':
                // 隐藏专注模式悬浮指示器
                const indicator = document.getElementById('focus-floating-indicator');
                if (indicator) {
                    indicator.classList.remove('show');
                }
                
                // 如果是专注完成，更新积分显示
                if (data.type === 'focusComplete') {
                    // 延迟一下确保积分已经更新
                    setTimeout(() => {
                        if (window.UIManager) {
                            UIManager.updateHeaderPoints();
                        }
                    }, 500);
                }
                break;
        }
    });

    // 定期检查并更新统计数据
    function checkAndUpdateStats() {
        const stats = JSON.parse(localStorage.getItem('focusStats') || '{"completedPomodoros":0,"totalFocusTime":0,"currentEvent":"无"}');
        updateFocusStats(stats);
    }

    // 页面加载时立即检查一次统计数据
    checkAndUpdateStats();

    // 每30秒更新一次统计数据
    setInterval(checkAndUpdateStats, 30000);

    // 每5秒检查一次统计数据
    setInterval(checkFocusStats, 5000);

    // 初始加载统计数据
    checkFocusStats();
    
    // 页面加载时立即检查专注状态
    checkFocusStatus();
    
    // 检查小工具冷却状态
    checkToolsCooldown();
    
    // 登录表单提交事件
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            if (!validateNickname()) {
                e.preventDefault();
                return false;
            }
        });
    }
    
    // 定期检查专注状态
    setInterval(checkFocusStatus, 1000);
});

// 打开番茄钟页面
function openPomodoroTracker() {
    window.open('pomodoro_tracker.html', '_blank');
}

// 清除所有数据
function clearAllData() {
    // 直接使用新的对话框管理器
    if (window.clearDialogManager) {
        clearDialogManager.show();
    } else {
        // 如果对话框管理器未初始化，直接跳转到清除页面
        sessionStorage.setItem('clearDataConfirmed', 'true');
        window.location.href = 'clear.html';
    }
}

// 检查积分并重定向到工具页面
function checkPointsAndRedirect() {
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
        StorageManager.addPoints(-20);
        // 更新显示的积分
        UIManager.updateHeaderPoints();
        
        // 记录使用时间并开始倒计时
        const lastUseTime = new Date().getTime();
        localStorage.setItem('toolsLastUseTime', lastUseTime);
        startToolsCountdown();
        
        // 跳转到工具页面
        window.location.href = 'tools.html';
    } else {
        // 显示积分不足提示
        UIManager.showNotification('积分不足，需要20积分', 'warning');
    }
}

// 检查小工具冷却状态
function checkToolsCooldown() {
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
}

// 开始倒计时
function startToolsCountdown() {
    const toolsBtn = document.getElementById('tools-btn');
    const countdownBtn = document.getElementById('tools-countdown-btn');
    const countdownSpan = document.getElementById('tools-countdown');
    
    if (toolsBtn && countdownBtn && countdownSpan) {
        toolsBtn.style.display = 'none';
        countdownBtn.style.display = 'block';
        
        const lastUseTime = parseInt(localStorage.getItem('toolsLastUseTime'));
        const cooldownTime = 24 * 60 * 60 * 1000; // 24小时的毫秒数
        
        function updateCountdown() {
            const now = new Date().getTime();
            const timeDiff = now - lastUseTime;
            const remainingTime = cooldownTime - timeDiff;
            
            if (remainingTime <= 0) {
                // 倒计时结束
                resetToolsButtons();
                return;
            }
            
            // 计算剩余时间
            const hours = Math.floor(remainingTime / (60 * 60 * 1000));
            const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
            
            // 更新显示
            countdownSpan.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            // 继续倒计时
            setTimeout(updateCountdown, 1000);
        }
        
        updateCountdown();
    }
}

// 重置按钮显示
function resetToolsButtons() {
    const toolsBtn = document.getElementById('tools-btn');
    const countdownBtn = document.getElementById('tools-countdown-btn');
    
    if (toolsBtn && countdownBtn) {
        toolsBtn.style.display = 'block';
        countdownBtn.style.display = 'none';
    }
    
    // 清除存储的时间
    localStorage.removeItem('toolsLastUseTime');
}

// 验证昵称
function validateNickname() {
    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput.value.trim();
    const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
    
    if (!nicknameRegex.test(nickname)) {
        nicknameInput.setCustomValidity('昵称长度必须在2-20个字符之间，仅支持中文、英文、数字和下划线');
        return false;
    } else {
        nicknameInput.setCustomValidity('');
        return true;
    }
}

// 检查专注状态并更新浮窗
function checkFocusStatus() {
    try {
        const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
        const floatingIndicator = document.getElementById('focus-floating-indicator');
        
        if (focusStats.isRunning && floatingIndicator) {
            floatingIndicator.classList.add('show');
            const floatingText = floatingIndicator.querySelector('.focus-floating-text');
            const floatingTimer = floatingIndicator.querySelector('.timer-mini');
            
            if (floatingText) {
                floatingText.textContent = `专注进行中: ${focusStats.currentEvent || '无'}`;
            }
            
            if (floatingTimer && focusStats.timeString) {
                floatingTimer.textContent = focusStats.timeString;
            }
        } else if (floatingIndicator) {
            floatingIndicator.classList.remove('show');
        }
    } catch (error) {
        console.error('检查专注状态失败:', error);
    }
}

// 检查专注统计数据
function checkFocusStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('focusStats') || '{"completedPomodoros":0,"totalFocusTime":0,"currentEvent":"无"}');
        updateFocusStats(stats);
    } catch (error) {
        console.error('检查专注统计数据失败:', error);
    }
}

// 更新专注统计信息
function updateFocusStats(stats) {
    document.getElementById('focus-completed-pomodoros').textContent = stats.completedPomodoros;
    document.getElementById('focus-total-time').textContent = stats.totalFocusTime + '分钟';
    document.getElementById('focus-current-event').textContent = stats.currentEvent;
} 