// 全局变量
let timer = null;
let timeLeft = 25 * 60; // 25分钟，以秒为单位
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
let settings = { // 用户设置
    defaultDuration: 25,
    autoBreak: false,
    soundEnabled: true,
    theme: 'default'
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从sessionStorage获取任务数据
    const focusTasks = JSON.parse(sessionStorage.getItem('focusTasks') || '[]');
    
    // 将任务转换为事件
    events = focusTasks.map(task => ({
        id: task.id,
        name: task.name,
        duration: 25, // 默认25分钟
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
    
    // 设置每日重置检查
    setInterval(checkDailyReset, 60000); // 每分钟检查一次
    
    // 保存初始状态到localStorage
    const focusStats = {
        isRunning: false,
        currentEvent: currentEvent ? currentEvent.name : '无',
        completedPomodoros: completedPomodoros,
        totalFocusTime: totalFocusTime,
        dailyTarget: dailyTarget,
        totalPomodoros: totalPomodoros
    };
    localStorage.setItem('focusStats', JSON.stringify(focusStats));
    
    // 页面卸载时保存数据
    window.addEventListener('beforeunload', saveData);
    
    // 监听页面可见性变化，在页面隐藏时保存数据
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            saveData();
        }
    });
});

// 监听时长选择变化
document.getElementById('eventDuration').addEventListener('change', function() {
    const customDurationInput = document.getElementById('customDuration');
    if (this.value === 'custom') {
        customDurationInput.style.display = 'block';
        customDurationInput.focus();
    } else {
        customDurationInput.style.display = 'none';
    }
});

// 修改添加事件函数
function addEvent() {
    const name = document.getElementById('eventName').value.trim();
    let duration;
    
    if (document.getElementById('eventDuration').value === 'custom') {
        duration = parseInt(document.getElementById('customDuration').value);
        if (!duration || duration < 1 || duration > 180) {
            alert('请输入1-180分钟之间的时长');
            return;
        }
    } else {
        duration = parseInt(document.getElementById('eventDuration').value);
    }
    
    if (!name) {
        alert('请输入事件名称');
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

// 渲染事件列表
function renderEvents() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';

    events.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${event.isActive ? 'active' : ''}`;
        eventItem.innerHTML = `
            <div>
                <div class="event-name">${event.name}</div>
                <div class="event-time">
                    目标: ${event.duration}分钟 | 已完成: ${event.completedTime}分钟
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-small secondary" onclick="selectEvent(${event.id})">
                    ${event.isActive ? '取消选择' : '选择'}
                </button>
                <button class="btn btn-small" onclick="deleteEvent(${event.id})" 
                        style="background: #e74c3c;">删除</button>
            </div>
        `;
        eventList.appendChild(eventItem);
    });
}

// 选择事件
function selectEvent(eventId) {
    // 取消所有事件的激活状态
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

    // 关闭移动端模态框
    const mobileModal = document.getElementById('mobileModal');
    if (mobileModal) {
        mobileModal.classList.remove('show');
    }
    
    // 重置导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-btn').classList.add('active');
}

// 删除事件
function deleteEvent(eventId) {
    if (confirm('确定删除这个事件吗？')) {
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

    // 保存到localStorage供主页检查
    const focusStats = {
        isRunning: isRunning,
        timeString: timeString,
        currentEvent: currentEvent ? currentEvent.name : '无',
        completedPomodoros: completedPomodoros,
        totalFocusTime: totalFocusTime,
        dailyTarget: dailyTarget,
        totalPomodoros: totalPomodoros
    };
    localStorage.setItem('focusStats', JSON.stringify(focusStats));
}

// 计时器控制
function startTimer() {
    if (!currentEvent) {
        alert('请先选择一个事件');
        return;
    }

    isRunning = true;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';
    document.getElementById('completeBtn').style.display = 'inline-block';
    document.getElementById('timerLabel').textContent = '专注中...';
    
    // 保存专注状态到localStorage
    const focusStats = {
        isRunning: true,
        currentEvent: currentEvent.name,
        duration: currentEvent.duration,
        completedPomodoros: completedPomodoros,
        totalFocusTime: totalFocusTime,
        dailyTarget: dailyTarget,
        totalPomodoros: totalPomodoros
    };
    localStorage.setItem('focusStats', JSON.stringify(focusStats));

    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();
        updateProgressRing();

        if (timeLeft <= 0) {
            clearInterval(timer); // 立即清除定时器
            completePomodoro();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timer);
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('timerLabel').textContent = '已暂停';
    
    // 保存暂停状态到localStorage
    const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
    focusStats.isRunning = false;
    localStorage.setItem('focusStats', JSON.stringify(focusStats));
}

function resetTimer() {
    isRunning = false;
    clearInterval(timer);
    timeLeft = currentEvent ? currentEvent.duration * 60 : 25 * 60;
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('completeBtn').style.display = 'none';
    document.getElementById('timerLabel').textContent = '准备开始专注';
    
    // 清除localStorage中的专注状态
    const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
    focusStats.isRunning = false;
    localStorage.setItem('focusStats', JSON.stringify(focusStats));
    
    updateDisplay();
    updateProgressRing();
}

function completePomodoro() {
    // 如果计时器正在运行，停止它
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
    }

    // 如果没有当前事件，直接返回
    if (!currentEvent) {
        console.log('没有当前事件，无法完成专注');
        return;
    }

    // 计算实际完成的时长（分钟）
    const actualCompletedTime = currentEvent.duration - Math.ceil(timeLeft / 60);
    const completedMinutes = Math.max(0, actualCompletedTime);

    // 更新统计数据
    completedPomodoros++;
    totalPomodoros++;
    
    // 更新当前事件的完成时间（累加实际完成的时长）
    if (currentEvent) {
        currentEvent.completedTime += completedMinutes;
    }
    
    // 更新今日统计
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

    // 添加积分奖励 - 完成番茄时钟获得15积分
    try {
        if (window.StorageManager) {
            StorageManager.addPoints(15);
            showNotification('专注完成！+15积分', 'success');
        } else {
            showNotification('专注完成！');
        }
    } catch (error) {
        console.error('添加积分失败:', error);
        showNotification('专注完成！');
    }

    // 更新显示
    updateDisplay();
    updateStats();
    updateProgressRing();
    
    // 播放完成音效
    playNotificationSound();
    
    // 清除localStorage中的专注状态
    const focusStats = JSON.parse(localStorage.getItem('focusStats') || '{}');
    focusStats.isRunning = false;
    localStorage.setItem('focusStats', JSON.stringify(focusStats));
    
    // 重置计时器
    resetTimer();

    // 保存数据
    saveData();
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

// 更新统计信息
function updateStats() {
    // 计算今日专注时长（从今日的dailyStats中获取）
    const today = new Date().toISOString().split('T')[0];
    const todayFocusTime = dailyStats[today] ? dailyStats[today].focusTime : 0;
    
    document.getElementById('completedPomodoros').textContent = completedPomodoros;
    document.getElementById('totalTime').textContent = todayFocusTime + '分钟';
    document.getElementById('currentEventName').textContent = 
        currentEvent ? currentEvent.name : '无';
    
    // 显示目标（根据类型显示不同格式）
    const targetText = dailyTargetType === 'pomodoros' ? 
        `${dailyTarget} 个番茄` : 
        `${dailyTarget} 分钟`;
    document.getElementById('dailyTarget').textContent = targetText;
    
    document.getElementById('totalPomodoros').textContent = totalPomodoros;
    
    // 计算今日目标达成率（根据目标类型）
    let targetRate = 0;
    if (dailyTarget > 0) {
        if (dailyTargetType === 'pomodoros') {
            // 番茄数目标：完成数/目标数
            targetRate = Math.round((completedPomodoros / dailyTarget) * 100);
        } else {
            // 分钟数目标：专注时长/目标时长
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
                // 分钟数目标
                totalTargetMinutes += day.target;
                daysWithMinuteTarget++;
                // 对于分钟数目标，完成数应该是专注时长
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
        // 只有分钟数目标
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

    // 计算总专注时长 - 基于所有历史数据
    let totalFocusTimeAll = 0;
    
    // 累加所有日期的专注时长
    Object.values(dailyStats).forEach(day => {
        if (day.focusTime !== undefined) {
            totalFocusTimeAll += day.focusTime;
        }
    });

    // 更新总专注时长显示
    const totalFocusTimeElement = document.getElementById('totalFocusTime');
    if (totalFocusTimeElement) {
        totalFocusTimeElement.textContent = totalFocusTimeAll + '分钟';
    }

    // 同步数据到主页面
    const stats = {
        completedPomodoros: completedPomodoros,
        totalFocusTime: totalFocusTimeAll, // 使用计算出的总专注时长
        currentEvent: currentEvent ? currentEvent.name : '无',
        dailyTarget: targetText, // 发送格式化的目标文本
        targetCompletionRate: targetRate,
        totalPomodoros: totalPomodoros,
        totalCompletionRate: totalRate
    };
    localStorage.setItem('focusStats', JSON.stringify(stats));
}

// 显示事件详细统计
function showEventStats() {
    if (events.length === 0) {
        showNotification('暂无事件数据', 'warning');
        return;
    }
    
    let statsText = '📊 事件统计详情\n\n';
    
    // 按完成进度排序
    const sortedEvents = [...events].sort((a, b) => {
        const progressA = a.duration > 0 ? (a.completedTime / a.duration) * 100 : 0;
        const progressB = b.duration > 0 ? (b.completedTime / b.duration) * 100 : 0;
        return progressB - progressA;
    });
    
    sortedEvents.forEach((event, index) => {
        const progress = event.duration > 0 ? Math.round((event.completedTime / event.duration) * 100) : 0;
        const status = progress >= 100 ? '✅ 已完成' : progress > 0 ? '🔄 进行中' : '⏳ 未开始';
        
        statsText += `${index + 1}. ${event.name}\n`;
        statsText += `   目标: ${event.duration}分钟 | 已完成: ${event.completedTime}分钟\n`;
        statsText += `   进度: ${progress}% | 状态: ${status}\n\n`;
    });
    
    // 计算总体统计
    const totalTarget = events.reduce((sum, event) => sum + event.duration, 0);
    const totalCompleted = events.reduce((sum, event) => sum + event.completedTime, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    
    // 显示当前目标设置
    const currentTargetText = dailyTargetType === 'pomodoros' ? 
        `${dailyTarget} 个番茄` : 
        `${dailyTarget} 分钟`;
    
    statsText += `📈 总体统计\n`;
    statsText += `总目标时长: ${totalTarget}分钟\n`;
    statsText += `总完成时长: ${totalCompleted}分钟\n`;
    statsText += `总体进度: ${overallProgress}%\n\n`;
    statsText += `🎯 今日目标设置\n`;
    statsText += `目标: ${currentTargetText}\n`;
    statsText += `达成率: ${(() => {
        if (dailyTarget > 0) {
            if (dailyTargetType === 'pomodoros') {
                return Math.round((completedPomodoros / dailyTarget) * 100);
            } else {
                // 从今日的dailyStats中获取专注时长
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
        showNotification('暂无每日统计数据', 'warning');
        return;
    }
    
    let statsText = '📅 每日统计详情\n\n';
    
    // 按日期排序（最新的在前）
    const sortedDays = Object.entries(dailyStats).sort((a, b) => {
        return new Date(b[0]) - new Date(a[0]);
    });
    
    sortedDays.forEach(([date, day]) => {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('zh-CN');
        
        // 根据目标类型计算达成率
        let targetRate = 0;
        if (day.target > 0) {
            if (day.targetType === 'minutes') {
                // 分钟数目标：专注时长/目标时长
                targetRate = Math.round((day.focusTime / day.target) * 100);
            } else {
                // 番茄数目标：完成数/目标数
                targetRate = Math.round((day.completed / day.target) * 100);
            }
        }
        
        // 显示目标（根据类型显示不同格式）
        const targetText = day.targetType === 'minutes' ? 
            `${day.target || 0} 分钟` : 
            `${day.target || 0} 个番茄`;
        
        statsText += `📅 ${dateStr}\n`;
        statsText += `   完成: ${day.completed || 0} 个番茄\n`;
        statsText += `   目标: ${targetText}\n`;
        statsText += `   专注时长: ${day.focusTime || 0} 分钟\n`;
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
                // 分钟数目标
                totalTargetMinutes += day.target;
                daysWithMinuteTarget++;
                // 对于分钟数目标，完成数应该是专注时长
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
        // 只有分钟数目标
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
    statsText += `总完成: ${totalCompletedPomodoros} 个番茄\n`;
    statsText += `总专注时长: ${totalFocusTime} 分钟\n`;
    statsText += `总体达成率: ${overallRate}%`;
    
    alert(statsText);
}

// 监听来自主页面的消息
window.addEventListener('message', function(event) {
    if (event.data.type === 'requestFocusStats') {
        updateStats(); // 更新并发送最新数据
    } else if (event.data.type === 'clearAllData') {
        // 当收到清除数据的消息时，执行清除操作
        clearAllData();
    }
});

// 页面关闭时保存数据
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
            modalTitle.textContent = '事件管理';
            modalContent.innerHTML = `
                <div class="event-form">
                    <div class="form-group">
                        <label>事件名称</label>
                        <input type="text" id="mobileEventName" placeholder="输入事件名称">
                    </div>
                    <div class="form-group">
                        <label>专注时长 (分钟)</label>
                        <div style="display: flex; gap: 10px;">
                            <select id="mobileEventDuration" style="flex: 1;">
                                <option value="25">25分钟</option>
                                <option value="30">30分钟</option>
                                <option value="45">45分钟</option>
                                <option value="60">60分钟</option>
                                <option value="custom">自定义时长</option>
                            </select>
                            <input type="number" id="mobileCustomDuration" placeholder="自定义分钟" style="display: none; width: 120px;" min="1" max="180">
                        </div>
                    </div>
                    <button class="btn" onclick="addMobileEvent()" style="width: 100%; margin-bottom: 20px;">添加事件</button>
                </div>
                <div id="mobileEventList"></div>
            `;
            
            // 添加移动端时长选择监听
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
            // 计算今日专注时长（从今日的dailyStats中获取）
            const today = new Date().toISOString().split('T')[0];
            const todayFocusTime = dailyStats[today] ? dailyStats[today].focusTime : 0;
            
            // 计算总专注时长 - 基于所有历史数据
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
                        // 分钟数目标
                        totalTargetMinutes += day.target;
                        daysWithMinuteTarget++;
                        // 对于分钟数目标，完成数应该是专注时长
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
                // 只有分钟数目标
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
                    // 番茄数目标：完成数/目标数
                    targetRate = Math.round((completedPomodoros / dailyTarget) * 100);
                } else {
                    // 分钟数目标：专注时长/目标时长
                    targetRate = Math.round((todayFocusTime / dailyTarget) * 100);
                }
            }
            
            // 显示目标（根据类型显示不同格式）
            const targetText = dailyTargetType === 'pomodoros' ? 
                `${dailyTarget} 个番茄` : 
                `${dailyTarget} 分钟`;
            
            modalTitle.textContent = '统计信息';
            modalContent.innerHTML = `
                <div class="stats">
                    <h3 style="color: #667eea; margin-bottom: 15px;">今日统计</h3>
                    <div class="stat-item">
                        <span>当前事件:</span>
                        <span>${currentEvent ? currentEvent.name : '无'}</span>
                    </div>
                    <div class="stat-item">
                        <span>今日完成:</span>
                        <span>${completedPomodoros}</span>
                    </div>
                    <div class="stat-item">
                        <span>专注时长:</span>
                        <span>${todayFocusTime}分钟</span>
                    </div>
                    <div class="stat-item">
                        <span>今日目标:</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span>${targetText}</span>
                            <button class="btn btn-small" onclick="setMobileDailyTarget()">设置</button>
                    </div>
                </div>
                    <div class="stat-item">
                        <span>目标达成率:</span>
                        <span>${targetRate}%</span>
                    </div>

                    <h3 style="color: #667eea; margin: 20px 0 15px;">总统计</h3>
                    <div class="stat-item">
                        <span>总番茄数:</span>
                        <span>${totalPomodoros}</span>
                    </div>
                    <div class="stat-item">
                        <span>总完成率:</span>
                        <span>${totalRate}%</span>
                    </div>
                    <div class="stat-item">
                        <span>总专注时长:</span>
                        <span>${totalFocusTimeAll}分钟</span>
                    </div>
                </div>

                <div class="data-management" style="margin-top: 20px;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">数据管理</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn secondary" onclick="exportData()" style="width: 100%;">
                            📥 导出数据
                        </button>
                        <div style="position: relative;">
                            <input type="file" id="mobileImportFile" accept=".json" style="display: none;" onchange="importData(event)">
                            <button class="btn secondary" onclick="document.getElementById('mobileImportFile').click()" style="width: 100%;">
                                📤 导入数据
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
            alert('请输入1-180分钟之间的时长');
            return;
        }
    } else {
        duration = parseInt(document.getElementById('mobileEventDuration').value);
    }
    
    if (!name) {
        alert('请输入事件名称');
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
                    目标: ${event.duration}分钟 | 已完成: ${event.completedTime}分钟
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-small secondary" onclick="selectEvent(${event.id})">
                    ${event.isActive ? '取消选择' : '选择'}
                </button>
                <button class="btn btn-small" onclick="deleteEvent(${event.id})" 
                        style="background: #e74c3c;">删除</button>
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

// 导出数据功能
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
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('数据导出成功！', 'success');
}

// 导入数据功能
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!importedData.version || !importedData.events) {
                throw new Error('无效的数据格式');
            }

            // 确认导入
            if (!confirm('导入数据将覆盖当前所有数据，确定继续吗？')) {
                return;
            }

            // 导入数据
            events = importedData.events || [];
            sessionHistory = importedData.sessionHistory || [];
            dailyStats = importedData.dailyStats || {};
            completedPomodoros = importedData.totalStats?.completedPomodoros || 0;
            totalPomodoros = importedData.totalStats?.totalPomodoros || 0;
            dailyTarget = importedData.settings?.dailyTarget || 0;
            dailyTargetType = importedData.settings?.dailyTargetType || 'pomodoros';
            settings = { ...settings, ...importedData.settings };

            // 注意：不直接加载totalFocusTime，而是通过updateStats计算
            // 这样可以确保总专注时长是基于所有历史数据计算的
            totalFocusTime = 0; // 重置为0，让updateStats重新计算
            
            // 恢复当前事件状态
            if (importedData.currentEvent) {
                currentEvent = events.find(e => e.id === importedData.currentEvent.id);
                if (currentEvent) {
                    if (importedData.currentEvent.isRunning && importedData.currentEvent.startTime) {
                        // 计算经过的时间
                        const elapsedSeconds = Math.floor((new Date().getTime() - importedData.currentEvent.startTime) / 1000);
                        timeLeft = Math.max(0, currentEvent.duration * 60 - elapsedSeconds);
                        
                        // 如果时间还没用完，自动开始计时
                        if (timeLeft > 0) {
                            document.getElementById('currentEvent').style.display = 'block';
                            document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                            startTimer();
                        } else {
                            // 如果时间已用完，完成番茄钟
                            completePomodoro();
                        }
                    } else {
                        timeLeft = importedData.currentEvent.timeLeft || currentEvent.duration * 60;
                        document.getElementById('currentEvent').style.display = 'block';
                        document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                    }
                }
            }

            // 更新界面
            renderEvents();
            updateDisplay();
            updateStats(); // 这会重新计算总专注时长
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

// 清空所有数据
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
            
            // 从今日的dailyStats中加载今日专注时长
            const today = new Date().toISOString().split('T')[0];
            if (dailyStats[today]) {
                totalFocusTime = dailyStats[today].focusTime || 0;
            } else {
                totalFocusTime = 0;
            }
            
            // 恢复当前事件状态
            if (data.currentEvent) {
                currentEvent = events.find(e => e.id === data.currentEvent.id);
                if (currentEvent) {
                    if (data.currentEvent.isRunning && data.currentEvent.startTime) {
                        // 计算经过的时间
                        const elapsedSeconds = Math.floor((new Date().getTime() - data.currentEvent.startTime) / 1000);
                        timeLeft = Math.max(0, currentEvent.duration * 60 - elapsedSeconds);
                        
                        // 如果时间还没用完，自动开始计时
                        if (timeLeft > 0) {
                            document.getElementById('currentEvent').style.display = 'block';
                            document.getElementById('currentEventDisplay').textContent = currentEvent.name;
                            startTimer();
                        } else {
                            // 如果时间已用完，完成番茄钟
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
            updateStats(); // 这会重新计算总专注时长
            updateProgressRing();
            console.log('数据加载成功');
        }
    } catch (error) {
        console.error('数据加载失败:', error);
        showNotification('数据加载失败，使用默认设置', 'warning');
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
    // 每10秒自动保存一次
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

// 设置每日目标
function setDailyTarget() {
    // 创建目标类型选择对话框
    const targetType = prompt(
        '请选择目标类型：\n1. 番茄数 (输入数字)\n2. 分钟数 (输入数字+分钟，如：120分钟)\n\n当前目标：' + 
        (dailyTargetType === 'pomodoros' ? `${dailyTarget} 个番茄` : `${dailyTarget} 分钟`),
        dailyTargetType === 'pomodoros' ? dailyTarget.toString() : dailyTarget + '分钟'
    );
    
    if (targetType === null) return; // 用户取消输入
    
    let newTarget = 0;
    let newTargetType = 'pomodoros';
    
    // 检查输入格式
    if (targetType.includes('分钟')) {
        // 分钟数模式
        const minutesMatch = targetType.match(/(\d+)/);
        if (minutesMatch) {
            newTarget = parseInt(minutesMatch[1]);
            newTargetType = 'minutes';
        } else {
            alert('请输入有效的分钟数！例如：120分钟');
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
    
    // 更新今日统计中的目标
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
        if (modalTitle && modalTitle.textContent === '统计信息') {
            // 重新渲染移动端统计页面
            showMobileSection('stats');
        }
    }
    
    // 显示设置成功提示
    const targetText = dailyTargetType === 'pomodoros' ? `${dailyTarget} 个番茄` : `${dailyTarget} 分钟`;
    showNotification(`每日目标已设置为 ${targetText}`);
}

// 刷新所有相关显示
function refreshAllDisplays() {
    // 更新桌面端显示
    updateStats();
    
    // 更新事件列表
    renderEvents();
    renderMobileEvents();
    
    // 更新进度环
    updateProgressRing();
    
    // 更新显示
    updateDisplay();
}

// 移动端设置每日目标
function setMobileDailyTarget() {
    // 调用主设置函数
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
        
        // 如果昨天有数据且还没有保存到dailyStats中
        if (completedPomodoros > 0 || totalFocusTime > 0) {
            if (!dailyStats[yesterdayStr]) {
                dailyStats[yesterdayStr] = {
                    target: dailyTarget,
                    targetType: dailyTargetType,
                    completed: completedPomodoros,
                    focusTime: totalFocusTime
                };
            } else {
                // 如果已经有数据，累加而不是覆盖
                dailyStats[yesterdayStr].completed += completedPomodoros;
                dailyStats[yesterdayStr].focusTime += totalFocusTime;
            }
        }
        
        // 重置今日数据（只重置每日统计，不影响总统计）
        completedPomodoros = 0;
        totalFocusTime = 0; // 只重置今日专注时长，总专注时长通过updateStats计算
        dailyTarget = 0;
        dailyTargetType = 'pomodoros'; // 重置目标类型
        
        // 更新最后重置时间
        localStorage.setItem('lastDailyReset', today);
        
        // 更新显示
        updateStats();
        saveData();
        
        showNotification('新的一天开始了！', 'success');
    }
} 