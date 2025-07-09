/**
 * 轻松一刻管理模块
 * 负责管理勋章、积分和幸运转盘功能
 */

const RelaxManager = {
    // 幸运转盘实例
    wheel: null,
    // 转盘是否正在旋转
    isSpinning: false,
    
    /**
     * 初始化
     */
    init() {
        // 检查是否处于专注模式计时状态
        const isTimerActive = window.FocusManager && 
            FocusManager.status === 'active' && 
            FocusManager.startTime !== null;
        
        if (isTimerActive) {
            console.log('专注计时中，不初始化轻松一刻');
            
            // 强制隐藏轻松一刻视图
            const relaxView = document.getElementById('relax');
            if (relaxView) {
                relaxView.classList.remove('active');
                relaxView.style.display = 'none';
            }
            
            return;
        }
        
        // 在非计时状态下，确保轻松一刻视图可见
        const relaxView = document.getElementById('relax');
        if (relaxView) {
            relaxView.style.display = '';
            relaxView.classList.add('active');
        }

        console.log('初始化轻松一刻功能');
        this.loadMedals();
        this.updatePoints();
        this.initWheel();
        this.bindEvents();
        this.checkMedals();
        
        // 初始化喝水提醒功能
        if (window.WaterReminderManager) {
            WaterReminderManager.reinit();
        }
    },
    
    /**
     * 加载勋章墙
     */
    loadMedals() {
        const medals = StorageManager.getMedals();
        const container = document.getElementById('medals-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 只显示已解锁的勋章
        const unlockedMedals = medals.filter(medal => medal.unlocked);
        
        if (unlockedMedals.length === 0) {
            // 如果没有解锁的勋章，显示提示信息
            container.innerHTML = `
                <div class="no-medals-message">
                    <i class="fas fa-medal" style="font-size: 2rem; color: var(--text-secondary-color);"></i>
                    <p>还没有获得任何勋章，继续努力吧！</p>
                </div>
            `;
            return;
        }
        
        unlockedMedals.forEach(medal => {
            const medalElement = document.createElement('div');
            medalElement.className = 'medal-item';
            medalElement.dataset.medalId = medal.id;
            medalElement.innerHTML = `
                <div class="medal-icon">${medal.icon}</div>
                <div class="medal-info">
                    <h4>${medal.name}</h4>
                    <p>${medal.description}</p>
                </div>
            `;
            
            container.appendChild(medalElement);
        });
    },
    
    /**
     * 更新积分显示
     */
    updatePoints() {
        const points = StorageManager.getPoints();
        
        // 更新轻松一刻页面的积分显示
        const pointsElement = document.getElementById('user-points');
        if (pointsElement) {
            pointsElement.textContent = points;
        }
        
        // 更新顶部栏积分显示
        const headerPoints = document.getElementById('header-points');
        if (headerPoints) {
            headerPoints.textContent = points;
            
            // 根据积分数量添加不同的样式
            headerPoints.className = '';
            if (points >= 1000) {
                headerPoints.classList.add('points-master');
            } else if (points >= 500) {
                headerPoints.classList.add('points-expert');
            } else if (points >= 100) {
                headerPoints.classList.add('points-advanced');
            } else {
                headerPoints.classList.add('points-beginner');
            }
            
            // 添加积分变化动画
            headerPoints.classList.add('points-updated');
            setTimeout(() => {
                headerPoints.classList.remove('points-updated');
            }, 500);
        }
    },
    
    /**
     * 初始化幸运转盘
     */
    initWheel() {
        const canvas = document.getElementById('wheel-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const items = StorageManager.getData().wheelItems;
        
        // 设置画布大小
        canvas.width = 300;
        canvas.height = 300;
        
        this.wheel = {
            items,
            angle: 0,
            spinTime: 0,
            spinTimeTotal: 0,
            ctx,
            spinVelocity: 0
        };
        
        this.drawWheel();
    },
    
    /**
     * 绘制转盘
     */
    drawWheel() {
        if (!this.wheel) return;
        
        const { ctx, items, angle } = this.wheel;
        const canvas = ctx.canvas;
        const radius = canvas.width / 2;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制转盘
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle);
        
        const arc = Math.PI * 2 / items.length;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // 绘制扇形
            ctx.beginPath();
            ctx.fillStyle = item.color;
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius - 20, i * arc, (i + 1) * arc);
            ctx.lineTo(0, 0);
            ctx.fill();
            
            // 绘制文字
            ctx.save();
            ctx.rotate(i * arc + arc / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.text, radius / 2, 0);
            ctx.restore();
        }
        
        ctx.restore();
        
        // 绘制中心点
        ctx.beginPath();
        ctx.arc(radius, radius, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
    },
    
    /**
     * 转动转盘
     */
    spinWheel() {
        if (this.isSpinning) return;
        
        const points = StorageManager.getPoints();
        if (points < 50) {
            UIManager.showNotification('积分不足，需要50积分');
            return;
        }
        
        // 扣除积分
        StorageManager.addPoints(-50);
        this.updatePoints();
        
        this.isSpinning = true;
        const spinBtn = document.getElementById('spin-wheel');
        if (spinBtn) {
            spinBtn.disabled = true;
        }
        
        // 随机选择结果
        const items = this.wheel.items;
        const selectedIndex = Math.floor(Math.random() * items.length);
        
        // 计算需要旋转的角度
        const targetAngle = 2 * Math.PI * 5 + // 多转5圈
            (2 * Math.PI / items.length) * (items.length - selectedIndex);
        
        this.wheel.spinTime = 0;
        this.wheel.spinTimeTotal = 3000; // 3秒
        this.wheel.targetAngle = targetAngle;
        this.wheel.startAngle = this.wheel.angle;
        
        this.rotateWheel();
    },
    
    /**
     * 旋转动画
     */
    rotateWheel() {
        if (!this.wheel) return;
        
        this.wheel.spinTime += 30;
        
        if (this.wheel.spinTime >= this.wheel.spinTimeTotal) {
            this.stopRotateWheel();
            return;
        }
        
        const spinPercent = this.wheel.spinTime / this.wheel.spinTimeTotal;
        const easeOut = (t) => t * (2 - t); // 缓出效果
        
        const angleOffset = this.wheel.targetAngle * easeOut(spinPercent);
        this.wheel.angle = this.wheel.startAngle + angleOffset;
        
        this.drawWheel();
        requestAnimationFrame(() => this.rotateWheel());
    },
    
    /**
     * 停止旋转
     */
    stopRotateWheel() {
        this.isSpinning = false;
        const spinBtn = document.getElementById('spin-wheel');
        if (spinBtn) {
            spinBtn.disabled = false;
        }
        
        // 计算结果
        const items = this.wheel.items;
        const degrees = (this.wheel.angle * 180 / Math.PI) % 360;
        const itemAngle = 360 / items.length;
        const selectedIndex = Math.floor(((360 - degrees) % 360) / itemAngle);
        const result = items[selectedIndex];
        
        // 显示结果
        UIManager.showNotification(`恭喜获得：${result.text}！`);
    },
    
    /**
     * 绑定事件
     */
    bindEvents() {
        const spinBtn = document.getElementById('spin-wheel');
        if (spinBtn) {
            spinBtn.addEventListener('click', () => {
                this.spinWheel();
            });
        }
    },
    
    /**
     * 检查并更新勋章状态
     */
    checkMedals() {
        const data = StorageManager.getData();
        const today = new Date().toISOString().split('T')[0];
        
        // 如果今天已经登录，直接返回
        if (data.lastLogin === today) return;
        
        // 更新登录记录
        data.lastLogin = today;
        data.loginDates = data.loginDates || [];
        data.loginDates.push(today);
        
        // 计算连续登录天数
        let consecutiveDays = 1;
        for (let i = data.loginDates.length - 2; i >= 0; i--) {
            const prevDate = new Date(data.loginDates[i]);
            const currDate = new Date(data.loginDates[i + 1]);
            const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                consecutiveDays++;
            } else {
                break;
            }
        }

        // 检查积分相关勋章
        const points = data.points || 0;
        if (points >= 1000 && !this.isMedalUnlocked('points-1000')) {
            this.unlockMedal('points-1000');
        } else if (points >= 500 && !this.isMedalUnlocked('points-500')) {
            this.unlockMedal('points-500');
        } else if (points >= 100 && !this.isMedalUnlocked('points-100')) {
            this.unlockMedal('points-100');
        }

        // 检查时间相关勋章
        const totalFocusTime = (data.focusTime?.total || 0) / 60; // 转换为小时
        if (totalFocusTime >= 24 && !this.isMedalUnlocked('time-24h')) {
            this.unlockMedal('time-24h');
        } else if (totalFocusTime >= 5 && !this.isMedalUnlocked('time-5h')) {
            this.unlockMedal('time-5h');
        } else if (totalFocusTime >= 1 && !this.isMedalUnlocked('time-1h')) {
            this.unlockMedal('time-1h');
        }

        // 检查连续使用勋章
        if (consecutiveDays >= 30 && !this.isMedalUnlocked('streak-30')) {
            this.unlockMedal('streak-30');
        } else if (consecutiveDays >= 7 && !this.isMedalUnlocked('streak-7')) {
            this.unlockMedal('streak-7');
        } else if (consecutiveDays >= 3 && !this.isMedalUnlocked('streak-3')) {
            this.unlockMedal('streak-3');
        }
        
        // 每日登录奖励
        data.points = (data.points || 0) + 10;
        UIManager.showNotification('每日登录 +10积分');
        
        StorageManager.saveData(data);
        
        // 刷新显示
        this.loadMedals();
        this.updatePoints();
    },

    /**
     * 检查勋章是否已解锁
     */
    isMedalUnlocked(medalId) {
        const medals = StorageManager.getMedals();
        const medal = medals.find(m => m.id === medalId);
        return medal ? medal.unlocked : false;
    },

    /**
     * 解锁勋章
     */
    unlockMedal(medalId) {
        const data = StorageManager.getData();
        const medal = data.medals.find(m => m.id === medalId);
        
        if (medal && !medal.unlocked) {
            medal.unlocked = true;
            medal.unlockTime = new Date().toISOString();
            StorageManager.saveData(data);
            
            // 显示勋章解锁通知和弹窗
            UIManager.showNotification(`恭喜解锁【${medal.name}】勋章！`);
            this.showMedalUnlockModal(medal);
            
            // 解锁勋章奖励积分
            StorageManager.addPoints(50);
            
            return true;
        }
        
        return false;
    },

    /**
     * 显示勋章解锁弹窗
     */
    showMedalUnlockModal(medal) {
        const modal = document.getElementById('medal-unlock-modal');
        if (!modal) return;
        
        // 更新弹窗内容
        const icon = modal.querySelector('#unlocked-medal-icon');
        const name = modal.querySelector('#unlocked-medal-name');
        const description = modal.querySelector('#unlocked-medal-description');
        
        if (icon) icon.textContent = medal.icon;
        if (name) name.textContent = medal.name;
        if (description) description.textContent = medal.description;
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 绑定确认按钮事件
        const confirmBtn = modal.querySelector('#confirm-medal-unlock');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // 绑定关闭按钮事件
        const closeBtn = modal.querySelector('#close-medal-unlock');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
    },
};

// 导出
window.RelaxManager = RelaxManager;

function showRelaxCardsByPoints() {
    // 获取积分
    let points = 0;
    const pointsEl = document.getElementById('user-points') || document.getElementById('header-points');
    if (pointsEl) {
        points = parseInt(pointsEl.textContent, 10) || 0;
    }
    // 当前分组
    const group = window.currentRelaxGroup || 'all';
    // 需要控制显示的卡片
    const hotCard = document.querySelector('.hot-section');
    const historyCard = document.querySelector('.history-section');
    // 只在全部卡片或见闻卡片分组，且积分大于50时显示
    const shouldShow = (group === 'all' || group === 'news') && points > 50;
    [hotCard, historyCard].forEach(card => {
        if (!card) return;
        card.style.display = shouldShow ? '' : 'none';
    });
}
// 页面加载和积分变化时调用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showRelaxCardsByPoints);
} else {
    showRelaxCardsByPoints();
}
// 监听积分变化（假设有事件或可轮询）
setInterval(showRelaxCardsByPoints, 2000);
// 导出到window供分组切换调用
window.showRelaxCardsByPoints = showRelaxCardsByPoints; 