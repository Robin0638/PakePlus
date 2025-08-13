// 闹钟收藏功能管理器

class FavoriteManager {
    constructor() {
        this.favorites = new Set();
        this.storageKey = 'alarmFavorites';
        this.loadFavorites();
    }

    // 加载收藏数据
    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const favoriteIds = JSON.parse(stored);
                this.favorites = new Set(favoriteIds);
            }
        } catch (error) {
            console.error('加载收藏数据失败:', error);
            this.favorites = new Set();
        }
    }

    // 保存收藏数据
    saveFavorites() {
        try {
            const favoriteIds = Array.from(this.favorites);
            localStorage.setItem(this.storageKey, JSON.stringify(favoriteIds));
        } catch (error) {
            console.error('保存收藏数据失败:', error);
        }
    }

    // 切换收藏状态
    toggleFavorite(alarmId) {
        const numericId = parseInt(alarmId, 10);
        if (this.favorites.has(numericId)) {
            this.favorites.delete(numericId);
        } else {
            this.favorites.add(numericId);
        }
        this.saveFavorites();
        return this.favorites.has(numericId);
    }

    // 检查是否已收藏
    isFavorite(alarmId) {
        const numericId = parseInt(alarmId, 10);
        return this.favorites.has(numericId);
    }

    // 获取收藏数量
    getFavoriteCount() {
        return this.favorites.size;
    }

    // 获取所有收藏的闹钟ID
    getFavoriteIds() {
        return Array.from(this.favorites);
    }

    // 清空所有收藏
    clearAllFavorites() {
        this.favorites.clear();
        this.saveFavorites();
    }

    // 获取收藏的闹钟列表
    getFavoriteAlarms(alarms) {
        return alarms.filter(alarm => this.favorites.has(alarm.id));
    }

    // 获取非收藏的闹钟列表
    getNonFavoriteAlarms(alarms) {
        return alarms.filter(alarm => !this.favorites.has(alarm.id));
    }

    // 按收藏状态排序闹钟（收藏的在前）
    sortAlarmsByFavorite(alarms) {
        return [...alarms].sort((a, b) => {
            const aFavorited = this.favorites.has(a.id);
            const bFavorited = this.favorites.has(b.id);
            
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            return 0;
        });
    }
}

// 创建全局收藏管理器实例
const favoriteManager = new FavoriteManager();

// 收藏闹钟函数
function toggleAlarmFavorite(alarmId) {
    const isFavorited = favoriteManager.toggleFavorite(alarmId);
    
    // 更新按钮状态
    const button = document.querySelector(`[data-alarm-id="${alarmId}"] .favorite-button`);
    if (button) {
        if (isFavorited) {
            button.classList.add('favorited');
            button.innerHTML = '<i data-lucide="star"></i>已收藏';
        } else {
            button.classList.remove('favorited');
            button.innerHTML = '<i data-lucide="star"></i>收藏';
        }
        lucide.createIcons();
    }
    
    // 更新卡片样式
    const card = document.querySelector(`[data-alarm-id="${alarmId}"]`);
    if (card) {
        if (isFavorited) {
            card.classList.add('favorited');
        } else {
            card.classList.remove('favorited');
        }
    }
    
    // 重新应用过滤和排序
    applyAlarmFilters();
    
    // 更新收藏统计
    updateFavoriteStats();
    
    // 显示反馈
    showFavoriteFeedback(isFavorited);
}

// 显示收藏反馈
function showFavoriteFeedback(isFavorited) {
    // 创建临时反馈元素
    const feedback = document.createElement('div');
    feedback.className = 'favorite-feedback';
    feedback.textContent = isFavorited ? '已添加到收藏' : '已取消收藏';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isFavorited ? 'var(--accent-yellow, #fbbf24)' : 'var(--text-secondary, #6b7280)'};
        color: ${isFavorited ? 'var(--accent-yellow-text, #92400e)' : 'white'};
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(feedback);
    
    // 3秒后移除
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 2000);
}

// 添加收藏过滤功能
function addFavoriteFilter() {
    // 在现有的过滤按钮后添加收藏过滤按钮
    const filterContainer = document.querySelector('#alarmPanel .search-filters');
    if (filterContainer && !document.querySelector('.favorite-filter-btn')) {
        const favoriteFilterBtn = document.createElement('button');
        favoriteFilterBtn.className = 'filter-btn favorite-filter-btn';
        favoriteFilterBtn.setAttribute('data-filter', 'favorite');
        favoriteFilterBtn.innerHTML = '<i data-lucide="star"></i>收藏';
        favoriteFilterBtn.onclick = () => filterAlarms('favorite');
        
        filterContainer.appendChild(favoriteFilterBtn);
        lucide.createIcons();
    }
}

// 更新收藏过滤逻辑
function updateAlarmFilterLogic() {
    // 保存原始的 applyAlarmFilters 函数
    const originalApplyAlarmFilters = window.applyAlarmFilters;
    
    // 重写 applyAlarmFilters 函数以支持收藏过滤
    window.applyAlarmFilters = function() {
        // 先按过滤类型筛选
        let filtered = alarms;
        
        switch (alarmFilterType) {
            case 'enabled':
                filtered = alarms.filter(alarm => alarm.isEnabled);
                break;
            case 'disabled':
                filtered = alarms.filter(alarm => !alarm.isEnabled);
                break;
            case 'repeating':
                filtered = alarms.filter(alarm => alarm.isRepeating);
                break;
            case 'once':
                filtered = alarms.filter(alarm => !alarm.isRepeating);
                break;
            case 'favorite':
                filtered = favoriteManager.getFavoriteAlarms(alarms);
                break;
            case 'all':
            default:
                filtered = alarms;
                break;
        }
        
        // 再按搜索关键词筛选
        if (alarmSearchQuery) {
            filtered = filtered.filter(alarm => {
                const searchText = `${alarm.name} ${alarm.time} ${getAlarmDaysText(alarm)}`.toLowerCase();
                return searchText.includes(alarmSearchQuery);
            });
        }
        
        // 按收藏状态排序（收藏的在前）
        filtered = favoriteManager.sortAlarmsByFavorite(filtered);
        
        filteredAlarms = filtered;
        renderAlarms();
    };
}

// 更新闹钟渲染函数以支持收藏功能
function updateAlarmRendering() {
    // 保存原始的 renderAlarms 函数
    const originalRenderAlarms = window.renderAlarms;
    
    // 重写 renderAlarms 函数以支持收藏功能（与重命名功能兼容）
    window.renderAlarms = function() {
        const container = document.getElementById('alarmsList');
        
        // 使用过滤后的闹钟列表，如果没有过滤则按收藏状态排序
        let alarmsToRender;
        if (alarmSearchQuery || alarmFilterType !== 'all') {
            alarmsToRender = filteredAlarms;
        } else {
            // 没有过滤时，按收藏状态排序显示
            alarmsToRender = favoriteManager.sortAlarmsByFavorite(alarms);
        }
        
        // 控制搜索栏显示/隐藏
        const searchSection = document.querySelector('#alarmPanel .search-section');
        if (searchSection) {
            searchSection.style.display = alarms.length <= 1 ? 'none' : 'block';
        }
        
        if (alarms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="alarm-clock" width="48" height="48"></i>
                    <p>暂无闹钟，点击上方按钮添加</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        // 如果有搜索或过滤，但结果为空
        if (alarms.length > 0 && alarmsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="search" width="48" height="48"></i>
                    <p>没有找到匹配的闹钟</p>
                    <p class="empty-state-subtitle">尝试调整搜索条件或过滤选项</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = alarmsToRender.map(alarm => {
            const daysText = getAlarmDaysText(alarm);
            const isFavorited = favoriteManager.isFavorite(alarm.id);
            
            // 检查是否应该高亮显示（搜索结果）
            const shouldHighlight = alarmSearchQuery && 
                `${alarm.name} ${alarm.time} ${daysText}`.toLowerCase().includes(alarmSearchQuery);
            const highlightClass = shouldHighlight ? 'alarm-card-highlight' : '';
            const favoriteClass = isFavorited ? 'alarm-card-favorite' : '';

            const dayButtons = [0, 1, 2, 3, 4, 5, 6].map(day => {
                const dayName = ['日', '一', '二', '三', '四', '五', '六'][day];
                const isActive = alarm.days.includes(day);
                return `
                    <button class="day-button ${isActive ? 'active' : ''}" 
                            onclick="toggleAlarmDay(${alarm.id}, ${day})">
                        ${dayName}
                    </button>
                `;
            }).join('');

            return `
                <div class="card ${highlightClass} ${favoriteClass}" data-alarm-id="${alarm.id}">
                    ${isFavorited ? '<div class="favorite-indicator"></div>' : ''}
                    <div class="card-header">
                        <div class="alarm-title-section">
                            <h3 class="card-title">${alarm.name}</h3>
                            <button class="rename-button" onclick="startRename(${alarm.id})" title="重命名闹钟">
                                <i data-lucide="edit-3"></i>
                                重命名
                            </button>
                        </div>
                        <div class="alarm-controls">
                            <label class="toggle-switch">
                                <input type="checkbox" ${alarm.isEnabled ? 'checked' : ''} 
                                       onchange="toggleAlarm(${alarm.id})">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="alarm-time-section">
                        <input type="time" value="${alarm.time}" 
                               onchange="updateAlarmTime(${alarm.id}, this.value)"
                               class="time-picker">
                        <div class="alarm-info">
                            <span class="repeat-text">${alarm.isRepeating ? '重复' : '仅一次'}</span>
                            <span class="days-text">${daysText}</span>
                            <div class="sound-selector">
                                <select onchange="changeAlarmSound(${alarm.id}, this.value)" class="sound-select" id="alarmSoundSelect_${alarm.id}">
                                    ${Object.entries(alarmSounds).map(([key, sound]) => 
                                        `<option value="${key}" ${alarm.sound === key ? 'selected' : ''}>${sound.name}</option>`
                                    ).join('')}
                                </select>
                                <button class="sound-preview-btn" title="试听铃声" onclick="previewAlarmSound('alarmSoundSelect_${alarm.id}')">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="days-selector">
                        ${dayButtons}
                    </div>
                    ${alarm._snoozeActive && alarm._snoozeTimeStr ? `<div class="snooze-tip" style="color:var(--accent-yellow,#ca8a04);font-size:13px;margin-top:4px;">推迟到 ${alarm._snoozeTimeStr} 提醒，仅限本次</div>` : ''}
                    
                    <div class="alarm-actions-container">
                        <button class="favorite-button ${isFavorited ? 'favorited' : ''}" 
                                onclick="toggleAlarmFavorite(${alarm.id})" 
                                title="${isFavorited ? '取消收藏' : '添加到收藏'}">
                            <i data-lucide="star"></i>
                            ${isFavorited ? '已收藏' : '收藏'}
                        </button>
                        <button class="share-button" onclick="shareAlarm(${alarm.id})" title="分享闹钟信息">
                            <i data-lucide="share-2"></i>
                            分享闹钟
                        </button>
                    </div>
                    ${(() => {
                        let nextTime = null;
                        if (alarm._snoozeActive && alarm._snoozeUntil) {
                            nextTime = new Date(alarm._snoozeUntil);
                        } else if (alarm.isEnabled) {
                            // 计算下次闹钟时间
                            const now = new Date();
                            let alarmHour = parseInt(alarm.time.split(':')[0], 10);
                            let alarmMinute = parseInt(alarm.time.split(':')[1], 10);
                            let next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), alarmHour, alarmMinute, 0, 0);
                            
                            if (alarm.isRepeating) {
                                // 重复闹钟逻辑
                                if (next <= now) {
                                    // 今天已过，找下一个有效天
                                    let addDays = 1;
                                    if (Array.isArray(alarm.days) && alarm.days.length > 0) {
                                        let cur = now.getDay();
                                        let minDelta = 8;
                                        for (let d of alarm.days) {
                                            let delta = (d - cur + 7) % 7;
                                            if (delta === 0 && next > now) delta = 7; // 今天但还没到点
                                            if (delta > 0 && delta < minDelta) minDelta = delta;
                                        }
                                        addDays = minDelta;
                                    }
                                    next.setDate(next.getDate() + addDays);
                                }
                            } else {
                                // 不重复闹钟逻辑
                                if (next <= now) {
                                    // 如果今天的时间已经过了，设置为明天
                                    next.setDate(next.getDate() + 1);
                                }
                            }
                            nextTime = next;
                        }
                        if (nextTime) {
                            const now = new Date();
                            let diff = Math.max(0, nextTime - now);
                            let h = Math.floor(diff / 3600000);
                            let m = Math.floor((diff % 3600000) / 60000);
                            if (h === 0 && m === 0) return '';
                            
                            // 根据是否选择了星期几来决定显示文本
                            const prefix = (alarm.isRepeating && alarm.days && alarm.days.length > 0) ? '距离下次提醒' : '距离第一次提醒';
                            return `<div class='next-alarm-tip' style='color:var(--accent-green,#16a34a);font-size:13px;margin-top:4px;'>${prefix}：${h ? h + '小时' : ''}${m ? m + '分钟' : ''}</div>`;
                        }
                        return '';
                    })()}
                </div>
            `;
        }).join('');

        lucide.createIcons();
    };
}

// 添加收藏统计显示
function addFavoriteStats() {
    const statsContainer = document.querySelector('#alarmPanel .search-section');
    if (statsContainer && !document.querySelector('.favorite-stats')) {
        // 计算当前显示的收藏数量
        let favoriteCount = 0;
        
        // 如果有过滤的闹钟，计算过滤结果中的收藏数量
        if (typeof filteredAlarms !== 'undefined' && filteredAlarms) {
            favoriteCount = filteredAlarms.filter(alarm => favoriteManager.isFavorite(alarm.id)).length;
        } else {
            // 否则计算所有闹钟中的收藏数量
            favoriteCount = favoriteManager.getFavoriteCount();
        }
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'favorite-stats';
        statsDiv.innerHTML = `
            <div class="favorite-count">
                <i data-lucide="star"></i>
                <span>${favoriteCount} 个收藏</span>
            </div>
            <div class="favorite-tip">
                (收藏的闹钟优先显示)
            </div>
        `;
        statsContainer.appendChild(statsDiv);
        lucide.createIcons();
    }
}

// 更新收藏统计
function updateFavoriteStats() {
    // 计算当前显示的收藏数量
    let favoriteCount = 0;
    
    // 如果有过滤的闹钟，计算过滤结果中的收藏数量
    if (typeof filteredAlarms !== 'undefined' && filteredAlarms) {
        favoriteCount = filteredAlarms.filter(alarm => favoriteManager.isFavorite(alarm.id)).length;
    } else {
        // 否则计算所有闹钟中的收藏数量
        favoriteCount = favoriteManager.getFavoriteCount();
    }
    
    const statsElement = document.querySelector('.favorite-stats .favorite-count span');
    if (statsElement) {
        statsElement.textContent = `${favoriteCount} 个收藏`;
    }
    
    // 如果没有收藏统计元素，重新添加
    if (!document.querySelector('.favorite-stats')) {
        addFavoriteStats();
    }
    
    // 确保收藏统计在过滤后仍然显示
    setTimeout(() => {
        if (!document.querySelector('.favorite-stats')) {
            addFavoriteStats();
        }
    }, 100);
}

// 初始化收藏功能
function initializeFavoriteFeature() {
    // 添加收藏过滤按钮
    addFavoriteFilter();
    
    // 更新过滤逻辑
    updateAlarmFilterLogic();
    
    // 更新渲染函数
    updateAlarmRendering();
    
    // 添加收藏统计
    addFavoriteStats();
    
    // 重新渲染闹钟以应用收藏状态
    renderAlarms();
    
    // 更新收藏统计
    updateFavoriteStats();
    
    // 确保收藏的闹钟优先显示
    console.log('闹钟收藏功能已初始化，收藏的闹钟将优先显示');
}

// 导出函数供全局使用
window.toggleAlarmFavorite = toggleAlarmFavorite;
window.favoriteManager = favoriteManager;
window.initializeFavoriteFeature = initializeFavoriteFeature;
window.updateFavoriteStats = updateFavoriteStats; 
 
 
 
 
 




