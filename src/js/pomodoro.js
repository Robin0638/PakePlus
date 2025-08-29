// 全局变量
let timer = null;
let timeLeft = 25 * 60; // 25min，以秒为单位
let isRunning = false;
let currentEvent = null;
let events = [];
let completedPomodoros = 0;
let totalFocusTime = 0;
let sessionHistory = []; // 保存历史会话记录
let dailyStats = {}; // 按日期保存统计数据
let totalPomodoros = 0; // 总番茄数
let dailyTarget = 0; // 每日目标
let dailyTargetType = 'pomodoros'; // 每日目标类型：'pomodoros' 或 'minutes'
let settings = { // 用户Set
    defaultDuration: 25,
    autoBreak: false,
    soundEnabled: true,
    theme: 'default'
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从sessionStorage获取任务数据
    const focusTasks = JSON.parse(sessionStorage.getItem('focusTasks') || '[]');
    
    // 将任务转换为Things
    events = focusTasks.map(task => ({
        id: task.id,
        name: task.name,
        duration: 25, // 默认25min
        completedTime: 0,
        isActive: false,
        createdAt: new Date()
    }));

    loadData();
    checkDailyReset(); // 检查是否需要每日重置
    updateDisplay();
    updateStats();
    updateProgressRing();
    enableAutoSave();
    renderEvents();
    
    // Set每日重置检查
    setInterval(checkDailyReset, 60000); // 每min检查一times
    
    // 通知主页当前状态
    try {
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusStart',
                data: {
                    eventName: currentEvent ? currentEvent.name : 'Empty',
                    duration: currentEvent ? currentEvent.duration : 25
                }
            };
            console.log('发送初始状态到主页:', message);
            window.opener.postMessage(message, '*');
        }
        
        // 保存初始状态到localStorage
        const focusStats = {
            isRunning: false,
            currentEvent: currentEvent ? currentEvent.name : 'Empty',
            completedPomodoros: completedPomodoros,
            totalFocusTime: totalFocusTime,
            dailyTarget: dailyTarget,
            totalPomodoros: totalPomodoros
        };
        localStorage.setItem('focusStats', JSON.stringify(focusStats));
        
    } catch (error) {
        console.error('发送初始状态失败:', error);
    }
    
    // 页面卸载时保存数据
    window.addEventListener('beforeunload', saveData);
    
    // 监听页面可见性变化，在页面隐藏时保存数据
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            saveData();
        }
    });
});

// 监听时长Select变化
document.getElementById('eventDuration').addEventListener('change', function() {
    const customDurationInput = document.getElementById('customDuration');
    if (this.value === 'custom') {
        customDurationInput.style.display = 'block';
        customDurationInput.focus();
    } else {
        customDurationInput.style.display = 'none';
    }
});

// 修改Add Event函数
function addEvent() {
    const name = document.getElementById('eventName').value.trim();
    let duration;
    
    if (document.getElementById('eventDuration').value === 'custom') {
        duration = parseInt(document.getElementById('customDuration').value);
        if (!duration || duration < 1 || duration > 180) {
            alert('请输入1-180min之间的时长');
            return;
        }
    } else {
        duration = parseInt(document.getElementById('eventDuration').value);
    }
    
    if (!name) {
        alert('Please enter the event name');
        return;
    }

    const event = {
        id: Date.now(),
        name: name,
        duration: duration,
        completedTime: 0,
        isActive: false,
        createdAt: new Date()
    };

    events.push(event);
    document.getElementById('eventName').value = '';
    document.getElementById('customDuration').value = '';
    document.getElementById('eventDuration').value = '25';
    document.getElementById('customDuration').style.display = 'none';
    saveData();
    renderEvents();
}

// 渲染Things列表
function renderEvents() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';

    // 判断专注是否进行medium
    const isFocusRunning = typeof isRunning !== 'undefined' ? isRunning : false;

    events.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${event.isActive ? 'active' : ''}`;
        // 按钮禁用逻辑
        const disableBtn = isFocusRunning ? 'disabled' : '';
        const disableClass = isFocusRunning ? 'disabled-btn' : '';
        eventItem.innerHTML = `
            <div>
                <div class="event-name">${event.name}</div>
                <div class="event-time">
                    Goal: ${event.duration}min | Completed: ${event.completedTime}min
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-small secondary ${disableClass}" onclick="selectEvent(${event.id})" ${disableBtn}>
                    ${event.isActive ? 'Cancel Select' : 'Select'}
                </button>
                <button class="btn btn-small ${disableClass}" onclick="deleteEvent(${event.id})" style="background: #e74c3c;" ${disableBtn}>Delet</button>
            </div>
        `;
        eventList.appendChild(eventItem);
    });
}

// SelectThings
function selectEvent(eventId) {
    // 取消所有Things的激活状态
    events.forEach(event => event.isActive = false);
    
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.isActive = true;
        currentEvent = event;
        timeLeft = event.duration * 60;
        updateDisplay();
        document.getElementById('currentEvent').style.display = 'block';
        document.getElementById('currentEventDisplay').textContent = event.name;
    }

    saveData();
    renderEvents();
    updateStats();

    // Close移动端模态框
    const mobileModal = document.getElementById('mobileModal');
    if (mobileModal) {
        mobileModal.classList.remove('show');
    }
    
    // 重置导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-btn').classList.add('active');
}

// DeletThings
function deleteEvent(eventId) {
    if (confirm('确定Delet这个Things吗？')) {
        events = events.filter(e => e.id !== eventId);
        if (currentEvent && currentEvent.id === eventId) {
            currentEvent = null;
            document.getElementById('currentEvent').style.display = 'none';
            resetTimer();
        }
        saveData();
        renderEvents();
        renderMobileEvents();
        updateStats();
    }
}

// 更新显示
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = timeString;
    
    // 更新悬浮指示器
    const floatingTimer = document.getElementById('floating-timer');
    if (floatingTimer) {
        floatingTimer.textContent = timeString;
    }

    // 同步到 index.html
    try {
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusTimerUpdate',
                data: {
                    timeString: timeString,
                    isRunning: isRunning,
                    currentEvent: currentEvent ? currentEvent.name : 'Empty'
                }
            };
            console.log('发送计时器更新到主页:', message);
            window.opener.postMessage(message, '*');
        }
        
        // 同时保存到localStorage供主页检查
        const focusStats = {
            isRunning: isRunning,
            timeString: timeString,
            timeLeft: timeLeft,
            currentEvent: currentEvent ? currentEvent.name : 'Empty',
            completedPomodoros: completedPomodoros,
            totalFocusTime: totalFocusTime,
            dailyTarget: dailyTarget,
            totalPomodoros: totalPomodoros
        };
        localStorage.setItem('focusStats', JSON.stringify(focusStats));
        
    } catch (error) {
        console.error('同步计时器数据失败:', error);
    }
}

// 计时器控制
function startTimer() {
    if (!currentEvent) {
        alert('Please select a Thing first');
        return;
    }

    isRunning = true;
    // 新增：开始专注时立即渲染Things列表，使按钮立即变灰
    renderEvents();
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';
    document.getElementById('completeBtn').style.display = 'inline-block';
    document.getElementById('timerLabel').textContent = 'Focusing...';
    
    // 通知 index.html 开始专注
    try {
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusStart',
                data: {
                    eventName: currentEvent.name,
                    duration: currentEvent.duration
                }
            };
            console.log('发送开始专注消息到主页:', message);
            window.opener.postMessage(message, '*');
        }
        
        // 保存专注状态到localStorage
        const focusStats = {
            isRunning: true,
            currentEvent: currentEvent.name,
            duration: currentEvent.duration,
            completedPomodoros: completedPomodoros,
            totalFocusTime: totalFocusTime,
            dailyTarget: dailyTarget,
            totalPomodoros: totalPomodoros,
            timeLeft: timeLeft
        };
        localStorage.setItem('focusStats', JSON.stringify(focusStats));
        
        // 发送专注开始消息到所有相关窗口
        sendFocusMessage('focusStart', {
            eventName: currentEvent.name,
            timeLeft: timeLeft
        });
        
    } catch (error) {
        console.error('通知开始专注失败:', error);
    }

    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();
        updateProgressRing();

        if (timeLeft <= 0) {
            clearInterval(timer); // 立即Purge定时器
            completePomodoro();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timer);
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('timerLabel').textContent = 'Stopped';
    
    // 通知 index.html 暂停专注
    try {
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusPause'
            };
            console.log('发送暂停专注消息到主页:', message);
            window.opener.postMessage(message, '*');
        }
        
        // 保存暂停状态到localStorage
        const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
        focusStats.isRunning = false;
        localStorage.setItem('focusStats', JSON.stringify(focusStats));
        
        // 发送专注暂停消息到所有相关窗口
        sendFocusMessage('focusPause', {
            eventName: currentEvent ? currentEvent.name : 'Stopped',
            timeLeft: timeLeft
        });
        
    } catch (error) {
        console.error('通知暂停专注失败:', error);
    }
}

function resetTimer() {
    isRunning = false;
    clearInterval(timer);
    timeLeft = currentEvent ? currentEvent.duration * 60 : 25 * 60;
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('completeBtn').style.display = 'none';
    document.getElementById('timerLabel').textContent = '准备开始专注';
    
    // 通知 index.html 重置专注
    try {
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusReset'
            };
            console.log('发送重置专注消息到主页:', message);
            window.opener.postMessage(message, '*');
        }
        
        // PurgelocalStoragemedium的专注状态
        const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
        focusStats.isRunning = false;
        localStorage.setItem('focusStats', JSON.stringify(focusStats));
        
        // 发送专注重置消息到所有相关窗口
        sendFocusMessage('focusReset', {
            eventName: '已重置',
            timeLeft: timeLeft
        });
        
    } catch (error) {
        console.error('通知重置专注失败:', error);
    }
    
    updateDisplay();
    updateProgressRing();
}

function completePomodoro() {
    // 如果计时器正在运行，停止它
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
    }

    // 如果没有当前Things，直接返回
    if (!currentEvent) {
        console.log('没有当前Things，Empty法Completed专注');
        return;
    }

    // 计算实际Completed的时长（min）
    const actualCompletedTime = currentEvent.duration - Math.ceil(timeLeft / 60);
    const completedMinutes = Math.max(0, actualCompletedTime);

    // 更新统计数据
    completedPomodoros++;
    totalPomodoros++;
    
    // 更新当前Things的Completedtime（累加实际Completed的时长）
    if (currentEvent) {
        currentEvent.completedTime += completedMinutes;
    }
    
    // 更新Today
    const today = new Date().toISOString().split('T')[0];
    if (!dailyStats[today]) {
        dailyStats[today] = {
            completed: 0,
            target: dailyTarget,
            targetType: dailyTargetType,
            focusTime: 0
        };
    }
    dailyStats[today].completed++;
    dailyStats[today].focusTime += completedMinutes;

    // 添加积分奖励 - Completed番茄时钟获得15积分
    try {
        if (window.StorageManager) {
            StorageManager.addPoints(15, '番茄钟', 'Completed一tomatoes钟');
            showNotification('Focus on Completed! +15 points', 'success');
            
            // 触发User Info更新Things
            document.dispatchEvent(new CustomEvent('userInfoUpdate'));
        } else {
            showNotification('专注Completed！');
        }
    } catch (error) {
        console.error('添加积分失败:', error);
        showNotification('专注Completed！');
    }

    // 更新显示
    updateDisplay();
    updateStats();
    updateProgressRing();
    
    // 播放Completed音效
    playNotificationSound();
    
    // 通知主页专注Completed
    try {
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusComplete',
                data: {
                    completedPomodoros: completedPomodoros,
                    totalFocusTime: dailyStats[today].focusTime, // 使用今日Time
                    currentEvent: currentEvent ? currentEvent.name : 'Empty'
                }
            };
            console.log('发送专注Completed消息到主页:', message);
            window.opener.postMessage(message, '*');
        }
        
        // PurgelocalStoragemedium的专注状态
        const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
        focusStats.isRunning = false;
        localStorage.setItem('focusStats', JSON.stringify(focusStats));
        
        // 发送专注Completed消息到所有相关窗口
        sendFocusMessage('focusComplete', {
            eventName: currentEvent ? currentEvent.name : '专注Completed',
            timeLeft: 0
        });
        
    } catch (error) {
        console.error('通知专注Completed失败:', error);
    }
    
    // 重置计时器
    resetTimer();

    // 保存数据
    saveData();
    // 新增：Completed后重新渲染Things列表，使按钮恢复可用
    renderEvents();
}

// 更新进度环
function updateProgressRing() {
    const circle = document.getElementById('progressCircle');
    const totalTime = currentEvent ? currentEvent.duration * 60 : 25 * 60;
    const progress = (totalTime - timeLeft) / totalTime;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (progress * circumference);
    
    circle.style.strokeDashoffset = offset;
    circle.classList.toggle('active', isRunning);
}

// 更新Stats
function updateStats() {
    // 计算今日Time（从今日的dailyStatsmedium获取）
    const today = new Date().toISOString().split('T')[0];
    const todayFocusTime = dailyStats[today] ? dailyStats[today].focusTime : 0;
    
    document.getElementById('completedPomodoros').textContent = completedPomodoros;
    document.getElementById('totalTime').textContent = todayFocusTime + 'min';
    document.getElementById('currentEventName').textContent = 
        currentEvent ? currentEvent.name : 'Empty';
    
    // 显示目标（根据类型显示不同格式）
    const targetText = dailyTargetType === 'pomodoros' ? 
        `${dailyTarget} tomatoes` : 
        `${dailyTarget} min`;
    document.getElementById('dailyTarget').textContent = targetText;
    
    document.getElementById('totalPomodoros').textContent = totalPomodoros;
    
    // 计算今日目标达成率（根据目标类型）
    let targetRate = 0;
    if (dailyTarget > 0) {
        if (dailyTargetType === 'pomodoros') {
            // 番茄数目标：Completed数/目标数
            targetRate = Math.round((completedPomodoros / dailyTarget) * 100);
        } else {
            // min数目标：Time/目标时长
            targetRate = Math.round((todayFocusTime / dailyTarget) * 100);
        }
    }
    document.getElementById('targetCompletionRate').textContent = targetRate + '%';
    
    // 计算总目标达成率 - 根据目标类型分别计算
    let totalCompletedPomodoros = 0;
    let totalTargetPomodoros = 0;
    let totalCompletedMinutes = 0;
    let totalTargetMinutes = 0;
    let daysWithPomodoroTarget = 0;
    let daysWithMinuteTarget = 0;
    
    Object.values(dailyStats).forEach(day => {
        if (day.completed !== undefined) {
            totalCompletedPomodoros += day.completed;
        }
        
        // 根据目标类型分别计算
        if (day.target !== undefined && day.target > 0) {
            if (day.targetType === 'pomodoros') {
                // 番茄数目标
                totalTargetPomodoros += day.target;
                daysWithPomodoroTarget++;
            } else if (day.targetType === 'minutes') {
                // min数目标
                totalTargetMinutes += day.target;
                daysWithMinuteTarget++;
                // 对于min数目标，Completed数应该是Time
                if (day.focusTime !== undefined) {
                    totalCompletedMinutes += day.focusTime;
                }
            }
        }
    });
    
    // 计算总目标达成率
    let totalRate = 0;
    if (daysWithPomodoroTarget > 0 && daysWithMinuteTarget === 0) {
        // 只有番茄数目标
        totalRate = Math.round((totalCompletedPomodoros / totalTargetPomodoros) * 100);
    } else if (daysWithMinuteTarget > 0 && daysWithPomodoroTarget === 0) {
        // 只有min数目标
        totalRate = Math.round((totalCompletedMinutes / totalTargetMinutes) * 100);
    } else if (daysWithPomodoroTarget > 0 && daysWithMinuteTarget > 0) {
        // 混合目标类型，计算加权平均
        const pomodoroRate = totalTargetPomodoros > 0 ? (totalCompletedPomodoros / totalTargetPomodoros) : 0;
        const minuteRate = totalTargetMinutes > 0 ? (totalCompletedMinutes / totalTargetMinutes) : 0;
        const totalDays = daysWithPomodoroTarget + daysWithMinuteTarget;
        const weightedRate = ((pomodoroRate * daysWithPomodoroTarget) + (minuteRate * daysWithMinuteTarget)) / totalDays;
        totalRate = Math.round(weightedRate * 100);
    }
    
    document.getElementById('totalCompletionRate').textContent = totalRate + '%';

    // 计算总Time - 基于所有历史数据
    let totalFocusTimeAll = 0;
    
    // 累加所有日期的Time
    Object.values(dailyStats).forEach(day => {
        if (day.focusTime !== undefined) {
            totalFocusTimeAll += day.focusTime;
        }
    });

    // 更新总Time显示
    const totalFocusTimeElement = document.getElementById('totalFocusTime');
    if (totalFocusTimeElement) {
        totalFocusTimeElement.textContent = totalFocusTimeAll + 'min';
    }

    // 同步数据到主页面
    try {
        const stats = {
            completedPomodoros: completedPomodoros,
            totalFocusTime: totalFocusTimeAll, // 使用计算出的总Time
            currentEvent: currentEvent ? currentEvent.name : 'Empty',
            dailyTarget: targetText, // 发送格式化的目标文本
            targetCompletionRate: targetRate,
            totalPomodoros: totalPomodoros,
            totalCompletionRate: totalRate
        };
        localStorage.setItem('focusStats', JSON.stringify(stats));
        
        // 如果主页面窗口存在，直接更新
        if (window.opener && !window.opener.closed) {
            const message = {
                type: 'focusStats',
                data: stats
            };
            console.log('发送统计数据到主页:', message);
            window.opener.postMessage(message, '*');
        }
    } catch (error) {
        console.error('同步统计数据失败:', error);
    }
}

// 显示Things详细统计
function showEventStats() {
    if (events.length === 0) {
        showNotification('Empty', 'warning');
        return;
    }
    
    let statsText = '📊 Things统计详情\n\n';
    
    // 按Completed进度排序
    const sortedEvents = [...events].sort((a, b) => {
        const progressA = a.duration > 0 ? (a.completedTime / a.duration) * 100 : 0;
        const progressB = b.duration > 0 ? (b.completedTime / b.duration) * 100 : 0;
        return progressB - progressA;
    });
    
    sortedEvents.forEach((event, index) => {
        const progress = event.duration > 0 ? Math.round((event.completedTime / event.duration) * 100) : 0;
        const status = progress >= 100 ? '✅ Completed' : progress > 0 ? '🔄 进行medium' : '⏳ 未开始';
        
        statsText += `${index + 1}. ${event.name}\n`;
        statsText += `   Goal: ${event.duration}min | Completed: ${event.completedTime}min\n`;
        statsText += `   Progress:${progress}% | 状态: ${status}\n\n`;
    });
    
    // 计算总体统计
    const totalTarget = events.reduce((sum, event) => sum + event.duration, 0);
    const totalCompleted = events.reduce((sum, event) => sum + event.completedTime, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    
    // 显示当前目标Set
    const currentTargetText = dailyTargetType === 'pomodoros' ? 
        `${dailyTarget} tomatoes` : 
        `${dailyTarget} min`;
    
    statsText += `📈 总体统计\n`;
    statsText += `总目标时长: ${totalTarget}min\n`;
    statsText += `总Completed时长: ${totalCompleted}min\n`;
    statsText += `总体Progress:${overallProgress}%\n\n`;
    statsText += `🎯 今日目标Set\n`;
    statsText += `Goal: ${currentTargetText}\n`;
    statsText += `达成率: ${(() => {
        if (dailyTarget > 0) {
            if (dailyTargetType === 'pomodoros') {
                return Math.round((completedPomodoros / dailyTarget) * 100);
            } else {
                // 从今日的dailyStatsmedium获取Time
                const today = new Date().toISOString().split('T')[0];
                const todayFocusTime = dailyStats[today] ? dailyStats[today].focusTime : 0;
                return Math.round((todayFocusTime / dailyTarget) * 100);
            }
        }
        return 0;
    })()}%`;
    
    alert(statsText);
}

// 显示每日统计详情
function showDailyStats() {
    if (Object.keys(dailyStats).length === 0) {
        showNotification('Empty', 'warning');
        return;
    }
    
    let statsText = '📅 每日统计详情\n\n';
    
    // 按日期排序（最新的在前）
    const sortedDays = Object.entries(dailyStats).sort((a, b) => {
        return new Date(b[0]) - new Date(a[0]);
    });
    
    sortedDays.forEach(([date, day]) => {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('en-US');
        
        // 根据目标类型计算达成率
        let targetRate = 0;
        if (day.target > 0) {
            if (day.targetType === 'minutes') {
                // min数目标：Time/目标时长
                targetRate = Math.round((day.focusTime / day.target) * 100);
            } else {
                // 番茄数目标：Completed数/目标数
                targetRate = Math.round((day.completed / day.target) * 100);
            }
        }
        
        // 显示目标（根据类型显示不同格式）
        const targetText = day.targetType === 'minutes' ? 
            `${day.target || 0} min` : 
            `${day.target || 0} tomatoes`;
        
        statsText += `📅 ${dateStr}\n`;
        statsText += `   Completed: ${day.completed || 0} tomatoes\n`;
        statsText += `   Goal: ${targetText}\n`;
        statsText += `   Time: ${day.focusTime || 0} min\n`;
        statsText += `   达成率: ${targetRate}%\n\n`;
    });
    
    // 计算总体统计 - 根据目标类型分别计算
    let totalCompletedPomodoros = 0;
    let totalTargetPomodoros = 0;
    let totalCompletedMinutes = 0;
    let totalTargetMinutes = 0;
    let daysWithPomodoroTarget = 0;
    let daysWithMinuteTarget = 0;
    
    sortedDays.forEach(([_, day]) => {
        if (day.completed !== undefined) {
            totalCompletedPomodoros += day.completed;
        }
        
        // 根据目标类型分别计算
        if (day.target !== undefined && day.target > 0) {
            if (day.targetType === 'pomodoros') {
                // 番茄数目标
                totalTargetPomodoros += day.target;
                daysWithPomodoroTarget++;
            } else if (day.targetType === 'minutes') {
                // min数目标
                totalTargetMinutes += day.target;
                daysWithMinuteTarget++;
                // 对于min数目标，Completed数应该是Time
                if (day.focusTime !== undefined) {
                    totalCompletedMinutes += day.focusTime;
                }
            }
        }
    });
    
    const totalFocusTime = sortedDays.reduce((sum, [_, day]) => sum + (day.focusTime || 0), 0);
    
    // 计算总体达成率
    let overallRate = 0;
    if (daysWithPomodoroTarget > 0 && daysWithMinuteTarget === 0) {
        // 只有番茄数目标
        overallRate = Math.round((totalCompletedPomodoros / totalTargetPomodoros) * 100);
    } else if (daysWithMinuteTarget > 0 && daysWithPomodoroTarget === 0) {
        // 只有min数目标
        overallRate = Math.round((totalCompletedMinutes / totalTargetMinutes) * 100);
    } else if (daysWithPomodoroTarget > 0 && daysWithMinuteTarget > 0) {
        // 混合目标类型，计算加权平均
        const pomodoroRate = totalTargetPomodoros > 0 ? (totalCompletedPomodoros / totalTargetPomodoros) : 0;
        const minuteRate = totalTargetMinutes > 0 ? (totalCompletedMinutes / totalTargetMinutes) : 0;
        const totalDays = daysWithPomodoroTarget + daysWithMinuteTarget;
        const weightedRate = ((pomodoroRate * daysWithPomodoroTarget) + (minuteRate * daysWithMinuteTarget)) / totalDays;
        overallRate = Math.round(weightedRate * 100);
    }
    
    statsText += `📈 总体统计\n`;
    statsText += `总Completed: ${totalCompletedPomodoros} tomatoes\n`;
    statsText += `Total Time: ${totalFocusTime} min\n`;
    statsText += `总体达成率: ${overallRate}%`;
    
    alert(statsText);
}

// 监听来自主页面的消息
window.addEventListener('message', function(event) {
    if (event.data.type === 'requestFocusStats') {
        updateStats(); // 更新并发送最新数据
    } else if (event.data.type === 'clearAllData') {
        // 当收到Purge数据的消息时，执行Purge操作
        clearAllData();
    }
});

// 页面Close时保存数据
window.addEventListener('beforeunload', function() {
    saveData();
    updateStats(); // 确保最后的数据被同步
});

// 移动端功能
function showMobileSection(section) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const modal = document.getElementById('mobileModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    switch (section) {
        case 'events':
            modalTitle.textContent = 'Event Management';
            modalContent.innerHTML = `
                <div class="event-form">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" id="mobileEventName" placeholder="Enter name">
                    </div>
                    <div class="form-group">
                        <label>Time (min)</label>
                        <div style="display: flex; gap: 10px;">
                            <select id="mobileEventDuration" style="flex: 1;">
                                <option value="25">25min</option>
                                <option value="30">30min</option>
                                <option value="45">45min</option>
                                <option value="60">60min</option>
                                <option value="custom">Customize</option>
                            </select>
                            <input type="number" id="mobileCustomDuration" placeholder="Customize" style="display: none; width: 120px;" min="1" max="180">
                        </div>
                    </div>
                    <button class="btn" onclick="addMobileEvent()" style="width: 100%; margin-bottom: 20px;">Add Event</button>
                </div>
                <div id="mobileEventList"></div>
            `;
            
            // 添加移动端时长Select监听
            document.getElementById('mobileEventDuration').addEventListener('change', function() {
                const customDurationInput = document.getElementById('mobileCustomDuration');
                if (this.value === 'custom') {
                    customDurationInput.style.display = 'block';
                    customDurationInput.focus();
                } else {
                    customDurationInput.style.display = 'none';
                }
            });
            
            renderMobileEvents();
            modal.classList.add('show');
            break;
        case 'stats':
            // 计算今日Time（从今日的dailyStatsmedium获取）
            const today = new Date().toISOString().split('T')[0];
            const todayFocusTime = dailyStats[today] ? dailyStats[today].focusTime : 0;
            
            // 计算总Time - 基于所有历史数据
            let totalFocusTimeAll = 0;
            Object.values(dailyStats).forEach(day => {
                if (day.focusTime !== undefined) {
                    totalFocusTimeAll += day.focusTime;
                }
            });
            
            // 计算总目标达成率 - 根据目标类型分别计算
            let totalCompletedPomodoros = 0;
            let totalTargetPomodoros = 0;
            let totalCompletedMinutes = 0;
            let totalTargetMinutes = 0;
            let daysWithPomodoroTarget = 0;
            let daysWithMinuteTarget = 0;
            
            Object.values(dailyStats).forEach(day => {
                if (day.completed !== undefined) {
                    totalCompletedPomodoros += day.completed;
                }
                
                // 根据目标类型分别计算
                if (day.target !== undefined && day.target > 0) {
                    if (day.targetType === 'pomodoros') {
                        // 番茄数目标
                        totalTargetPomodoros += day.target;
                        daysWithPomodoroTarget++;
                    } else if (day.targetType === 'minutes') {
                        // min数目标
                        totalTargetMinutes += day.target;
                        daysWithMinuteTarget++;
                        // 对于min数目标，Completed数应该是Time
                        if (day.focusTime !== undefined) {
                            totalCompletedMinutes += day.focusTime;
                        }
                    }
                }
            });
            
            // 计算总目标达成率
            let totalRate = 0;
            if (daysWithPomodoroTarget > 0 && daysWithMinuteTarget === 0) {
                // 只有番茄数目标
                totalRate = Math.round((totalCompletedPomodoros / totalTargetPomodoros) * 100);
            } else if (daysWithMinuteTarget > 0 && daysWithPomodoroTarget === 0) {
                // 只有min数目标
                totalRate = Math.round((totalCompletedMinutes / totalTargetMinutes) * 100);
            } else if (daysWithPomodoroTarget > 0 && daysWithMinuteTarget > 0) {
                // 混合目标类型，计算加权平均
                const pomodoroRate = totalTargetPomodoros > 0 ? (totalCompletedPomodoros / totalTargetPomodoros) : 0;
                const minuteRate = totalTargetMinutes > 0 ? (totalCompletedMinutes / totalTargetMinutes) : 0;
                const totalDays = daysWithPomodoroTarget + daysWithMinuteTarget;
                const weightedRate = ((pomodoroRate * daysWithPomodoroTarget) + (minuteRate * daysWithMinuteTarget)) / totalDays;
                totalRate = Math.round(weightedRate * 100);
            }
            
            // 计算今日目标达成率（根据目标类型）
            let targetRate = 0;
            if (dailyTarget > 0) {
                if (dailyTargetType === 'pomodoros') {
                    // 番茄数目标：Completed数/目标数
                    targetRate = Math.round((completedPomodoros / dailyTarget) * 100);
                } else {
                    // min数目标：Time/目标时长
                    targetRate = Math.round((todayFocusTime / dailyTarget) * 100);
                }
            }
            
            // 显示目标（根据类型显示不同格式）
            const targetText = dailyTargetType === 'pomodoros' ? 
                `${dailyTarget} tomatoes` : 
                `${dailyTarget} min`;
            
            modalTitle.textContent = 'Stats';
            modalContent.innerHTML = `
                <div class="stats">
                    <h3 style="color: #667eea; margin-bottom: 15px;">Today</h3>
                    <div class="stat-item">
                        <span>Current Things:</span>
                        <span>${currentEvent ? currentEvent.name : 'Empty'}</span>
                    </div>
                    <div class="stat-item">
                        <span>Today's Completed:</span>
                        <span>${completedPomodoros}</span>
                    </div>
                    <div class="stat-item">
                        <span>Time:</span>
                        <span>${todayFocusTime}min</span>
                    </div>
                    <div class="stat-item">
                        <span>Today's Goals:</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span>${targetText}</span>
                            <button class="btn btn-small" onclick="setMobileDailyTarget()">Set</button>
                    </div>
                </div>
                    <div class="stat-item">
                        <span>Hit Rate (Target)：</span>
                        <span>${targetRate}%</span>
                    </div>

                    <h3 style="color: #667eea; margin: 20px 0 15px;">Total</h3>
                    <div class="stat-item">
                        <span>Total Pomos:</span>
                        <span>${totalPomodoros}</span>
                    </div>
                    <div class="stat-item">
                        <span>Total Completion:</span>
                        <span>${totalRate}%</span>
                    </div>
                    <div class="stat-item">
                        <span>Total Time:</span>
                        <span>${totalFocusTimeAll}min</span>
                    </div>
                </div>

                <div class="data-management" style="margin-top: 20px;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">Data</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn secondary" onclick="exportData()" style="width: 100%;">
                            📥 Export Data
                        </button>
                        <div style="position: relative;">
                            <input type="file" id="mobileImportFile" accept=".json" style="display: none;" onchange="importData(event)">
                            <button class="btn secondary" onclick="document.getElementById('mobileImportFile').click()" style="width: 100%;">
                                📤 Import Data/File
                            </button>
                        </div>
                    </div>
                </div>
            `;
            modal.classList.add('show');
            break;
    }
}

function closeMobileModal() {
    document.getElementById('mobileModal').classList.remove('show');
    // 重置导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-btn').classList.add('active');
}

function addMobileEvent() {
    const name = document.getElementById('mobileEventName').value.trim();
    let duration;
    
    if (document.getElementById('mobileEventDuration').value === 'custom') {
        duration = parseInt(document.getElementById('mobileCustomDuration').value);
        if (!duration || duration < 1 || duration > 180) {
            alert('请输入1-180min之间的时长');
            return;
        }
    } else {
        duration = parseInt(document.getElementById('mobileEventDuration').value);
    }
    
    if (!name) {
        alert('Please enter the event name');
        return;
    }

    const event = {
        id: Date.now(),
        name: name,
        duration: duration,
        completedTime: 0,
        isActive: false,
        createdAt: new Date()
    };

    events.push(event);
    document.getElementById('mobileEventName').value = '';
    document.getElementById('mobileCustomDuration').value = '';
    document.getElementById('mobileEventDuration').value = '25';
    document.getElementById('mobileCustomDuration').style.display = 'none';
    saveData();
    renderMobileEvents();
}

function renderMobileEvents() {
    const eventList = document.getElementById('mobileEventList');
    if (!eventList) return;
    
    eventList.innerHTML = '';

    events.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${event.isActive ? 'active' : ''}`;
        eventItem.innerHTML = `
            <div>
                <div class="event-name">${event.name}</div>
                <div class="event-time">
                    Goal: ${event.duration}min | Completed: ${event.completedTime}min
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-small secondary" onclick="selectEvent(${event.id})">
                    ${event.isActive ? 'Cancel Select' : 'Select'}
                </button>
                <button class="btn btn-small" onclick="deleteEvent(${event.id})" 
                        style="background: #e74c3c;">Delet</button>
            </div>
        `;
        eventList.appendChild(eventItem);
    });
}

// 音效提示
function playNotificationSound() {
    if (!settings.soundEnabled) return;
    
    try {
        // 创建简单的提示音
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Audio not supported:', error);
    }
}

// 发送专注消息到所有相关窗口
function sendFocusMessage(type, data) {
    try {
        // 发送到主窗口
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type, data }, '*');
        }
        
        // 发送到父窗口
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type, data }, '*');
        }
        
        // 广播到所有同源窗口
        window.postMessage({ type, data }, '*');
        
        console.log(`发送专注消息: ${type}`, data);
    } catch (error) {
        console.error('发送专注消息失败:', error);
    }
}

// 通知系统
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => notification.classList.add('show'), 100);

    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Export Data功能
function exportData() {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        events: events,
        sessionHistory: sessionHistory,
        dailyStats: dailyStats,
        totalStats: {
            completedPomodoros: completedPomodoros,
            totalFocusTime: totalFocusTime,
            totalPomodoros: totalPomodoros
        },
        settings: {
            ...settings,
            dailyTarget: dailyTarget,
            dailyTargetType: dailyTargetType
        },
        currentEvent: currentEvent ? {
            id: currentEvent.id,
            timeLeft: timeLeft,
            isRunning: isRunning
        } : null
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const filename = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
    if (typeof downloadFile === 'function') {
        downloadFile(url, filename);
    } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    }
    showNotification('Success', 'success');
}

// Import Data/File功能
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            // 验证数据格式
            if (!importedData.version || !importedData.events) {
                throw new Error('Empty效的数据格式');
            }
            // 询问用户合并还是覆盖
            const keepOld = confirm('是否保留原有Content？\nSelect“确定”将合并数据，Select“取消”将覆盖原有数规划（电脑版）据。');
            if (keepOld) {
                // 合并数据
                // 合并 events（按 id 去重）
                const eventMap = {};
                (events || []).forEach(ev => { eventMap[ev.id] = ev; });
                (importedData.events || []).forEach(ev => { eventMap[ev.id] = ev; });
                events = Object.values(eventMap);
                // 合并 sessionHistory（按time戳去重）
                const sessionMap = {};
                (sessionHistory || []).forEach(s => { sessionMap[s.timestamp] = s; });
                (importedData.sessionHistory || []).forEach(s => { sessionMap[s.timestamp] = s; });
                sessionHistory = Object.values(sessionMap);
                // 合并 dailyStats（以新数据为主）
                dailyStats = { ...dailyStats, ...(importedData.dailyStats || {}) };
                // 合并 totalStats
                completedPomodoros = Math.max(completedPomodoros || 0, importedData.totalStats?.completedPomodoros || 0);
                totalPomodoros = Math.max(totalPomodoros || 0, importedData.totalStats?.totalPomodoros || 0);
                // 合并Set（以新数据为主）
                dailyTarget = importedData.settings?.dailyTarget || dailyTarget;
                dailyTargetType = importedData.settings?.dailyTargetType || dailyTargetType;
                settings = { ...settings, ...(importedData.settings || {}) };
                // 当前Things不合并，保持原有
            } else {
                // 覆盖数据
                events = importedData.events || [];
                sessionHistory = importedData.sessionHistory || [];
                dailyStats = importedData.dailyStats || {};
                completedPomodoros = importedData.totalStats?.completedPomodoros || 0;
                totalPomodoros = importedData.totalStats?.totalPomodoros || 0;
                dailyTarget = importedData.settings?.dailyTarget || 0;
                dailyTargetType = importedData.settings?.dailyTargetType || 'pomodoros';
                settings = { ...settings, ...importedData.settings };
                // 恢复当前Things状态
                if (importedData.currentEvent) {
                    currentEvent = events.find(e => e.id === importedData.currentEvent.id);
                    if (currentEvent) {
                        if (importedData.currentEvent.isRunning && importedData.currentEvent.startTime) {
                            const elapsedSeconds = Math.floor((new Date().getTime() - importedData.currentEvent.startTime) / 1000);
                            timeLeft = Math.max(0, currentEvent.duration * 60 - elapsedSeconds);
                            if (timeLeft > 0) {
                                document.getElementById('currentEvent').style.display = 'block';
                                document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                                startTimer();
                            } else {
                                completePomodoro();
                            }
                        } else {
                            timeLeft = importedData.currentEvent.timeLeft || currentEvent.duration * 60;
                            document.getElementById('currentEvent').style.display = 'block';
                            document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                        }
                    }
                }
            }
            // 注意：不直接加载totalFocusTime，而是通过updateStats计算
            totalFocusTime = 0; // 重置为0，让updateStats重新计算
            // 更新界面
            renderEvents();
            updateDisplay();
            updateStats(); // 这会重新计算总Time
            updateProgressRing();
            saveData();
            showNotification('数据导入成功！', 'success');
        } catch (error) {
            console.error('导入失败:', error);
            showNotification('导入失败：' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    // 清空文件输入
    event.target.value = '';
}

// 清空所有Content
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

// 数据持久化 - 使用localStorage存储
function saveData() {
    const data = {
        version: '1.0',
        lastSaved: new Date().toISOString(),
        events: events,
        sessionHistory: sessionHistory,
        dailyStats: dailyStats,
        totalStats: {
            completedPomodoros: completedPomodoros,
            totalPomodoros: totalPomodoros
        },
        settings: {
            ...settings,
            dailyTarget: dailyTarget,
            dailyTargetType: dailyTargetType
        },
        currentEvent: currentEvent ? {
            id: currentEvent.id,
            timeLeft: timeLeft,
            isRunning: isRunning,
            startTime: isRunning ? new Date().getTime() - ((currentEvent.duration * 60 - timeLeft) * 1000) : null
        } : null
    };
    
    try {
        localStorage.setItem('pomodoroAppData', JSON.stringify(data));
        console.log('数据已保存到localStorage');
    } catch (error) {
        console.error('保存数据失败:', error);
        showNotification('保存数据失败', 'error');
    }
}

function loadData() {
    try {
        const savedData = localStorage.getItem('pomodoroAppData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // 加载基本数据
            events = data.events || [];
            sessionHistory = data.sessionHistory || [];
            dailyStats = data.dailyStats || {};
            completedPomodoros = data.totalStats?.completedPomodoros || 0;
            totalPomodoros = data.totalStats?.totalPomodoros || 0;
            dailyTarget = data.settings?.dailyTarget || 0;
            dailyTargetType = data.settings?.dailyTargetType || 'pomodoros';
            settings = { ...settings, ...data.settings };
            
            // 从今日的dailyStatsmedium加载今日Time
            const today = new Date().toISOString().split('T')[0];
            if (dailyStats[today]) {
                totalFocusTime = dailyStats[today].focusTime || 0;
            } else {
                totalFocusTime = 0;
            }
            
            // 恢复当前Things状态
            if (data.currentEvent) {
                currentEvent = events.find(e => e.id === data.currentEvent.id);
                if (currentEvent) {
                    if (data.currentEvent.isRunning && data.currentEvent.startTime) {
                        // 计算经过的time
                        const elapsedSeconds = Math.floor((new Date().getTime() - data.currentEvent.startTime) / 1000);
                        timeLeft = Math.max(0, currentEvent.duration * 60 - elapsedSeconds);
                        
                        // 如果time还没用完，自动开始计时
                        if (timeLeft > 0) {
                            document.getElementById('currentEvent').style.display = 'block';
                            document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                            startTimer();
                        } else {
                            // 如果time已用完，Completed番茄钟
                            completePomodoro();
                        }
                    } else {
                        timeLeft = data.currentEvent.timeLeft || currentEvent.duration * 60;
                        document.getElementById('currentEvent').style.display = 'block';
                        document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                    }
                }
            }
            
            renderEvents();
            updateDisplay();
            updateStats(); // 这会重新计算总Time
            updateProgressRing();
            console.log('数据加载成功');
        }
    } catch (error) {
        console.error('数据加载失败:', error);
        showNotification('数据加载失败，使用默认Set', 'warning');
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem('pomodoroAppData');
        console.log('localStorage已清空');
    } catch (error) {
        console.error('清空localStorage失败:', error);
        showNotification('清空数据失败', 'error');
    }
}

// 自动保存功能
function enableAutoSave() {
    // 每10秒自动保存一times
    setInterval(() => {
        if (events.length > 0 || completedPomodoros > 0) {
            saveData();
        }
    }, 10000);
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
});

// Set每日目标
function setDailyTarget() {
    // 创建目标类型Select对话框
    const targetType = prompt(
        '请Select目标类型：\n1. 番茄数 (输入数字)\n2. min数 (输入数字+min，如：120min)\n\n当前目标：' + 
        (dailyTargetType === 'pomodoros' ? `${dailyTarget} tomatoes` : `${dailyTarget} min`),
        dailyTargetType === 'pomodoros' ? dailyTarget.toString() : dailyTarget + 'min'
    );
    
    if (targetType === null) return; // 用户取消输入
    
    let newTarget = 0;
    let newTargetType = 'pomodoros';
    
    // 检查输入格式
    if (targetType.includes('min')) {
        // min数模式
        const minutesMatch = targetType.match(/(\d+)/);
        if (minutesMatch) {
            newTarget = parseInt(minutesMatch[1]);
            newTargetType = 'minutes';
        } else {
            alert('请输入有效的min数！例如：120min');
            return;
        }
    } else {
        // 番茄数模式
        newTarget = parseInt(targetType);
        if (isNaN(newTarget) || newTarget < 0) {
            alert('请输入有效的数字！');
            return;
        }
        newTargetType = 'pomodoros';
    }
    
    dailyTarget = newTarget;
    dailyTargetType = newTargetType;
    
    // 更新Todaymedium的目标
    const today = new Date().toISOString().split('T')[0];
    if (!dailyStats[today]) {
        dailyStats[today] = {
            completed: 0,
            target: dailyTarget,
            targetType: dailyTargetType,
            focusTime: 0
        };
    } else {
        dailyStats[today].target = dailyTarget;
        dailyStats[today].targetType = dailyTargetType;
    }
    
    // 保存数据并更新显示
    saveData();
    updateStats();
    
    // 刷新所有相关显示
    refreshAllDisplays();
    
    // 检查是否在移动端统计页面，如果是则刷新显示
    const mobileModal = document.getElementById('mobileModal');
    if (mobileModal && mobileModal.classList.contains('show')) {
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle && modalTitle.textContent === 'Stats') {
            // 重新渲染移动端统计页面
            showMobileSection('stats');
        }
    }
    
    // 显示Set成功提示
    const targetText = dailyTargetType === 'pomodoros' ? `${dailyTarget} tomatoes` : `${dailyTarget} min`;
    showNotification(`每日目标已Set为 ${targetText}`);
}

// 刷新所有相关显示
function refreshAllDisplays() {
    // 更新桌面端显示
    updateStats();
    
    // 更新Things列表
    renderEvents();
    renderMobileEvents();
    
    // 更新进度环
    updateProgressRing();
    
    // 更新显示
    updateDisplay();
}

// 移动端Set每日目标
function setMobileDailyTarget() {
    // 调用主Set函数
    setDailyTarget();
}

// 检查是否需要每日重置
function checkDailyReset() {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // 使用ISO格式的日期
    const lastReset = localStorage.getItem('lastDailyReset');
    
    if (lastReset !== today) {
        // 保存昨天的统计数据
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // 如果昨天有数规划（电脑版）据且还没有保存到dailyStatsmedium
        if (completedPomodoros > 0 || totalFocusTime > 0) {
            if (!dailyStats[yesterdayStr]) {
                dailyStats[yesterdayStr] = {
                    target: dailyTarget,
                    targetType: dailyTargetType,
                    completed: completedPomodoros,
                    focusTime: totalFocusTime
                };
            } else {
                // 如果已经有数规划（电脑版）据，累加而不是覆盖
                dailyStats[yesterdayStr].completed += completedPomodoros;
                dailyStats[yesterdayStr].focusTime += totalFocusTime;
            }
        }
        
        // 重置今日数据（只重置每日统计，不影响Total）
        completedPomodoros = 0;
        totalFocusTime = 0; // 只重置今日Time，总Time通过updateStats计算
        dailyTarget = 0;
        dailyTargetType = 'pomodoros'; // 重置目标类型
        
        // 更新最后重置time
        localStorage.setItem('lastDailyReset', today);
        
        // 更新显示
        updateStats();
        saveData();
        
        showNotification('New day starts!', 'success');
    }
} 