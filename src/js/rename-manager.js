// 闹钟重命名功能管理器

class RenameManager {
    constructor() {
        this.renamingAlarmId = null;
        this.originalName = '';
    }

    // 开始重命名
    startRename(alarmId) {
        // 如果正在重命名其他闹钟，先取消
        if (this.renamingAlarmId && this.renamingAlarmId !== alarmId) {
            this.cancelRename();
        }

        this.renamingAlarmId = alarmId;
        const alarm = alarms.find(a => a.id === alarmId);
        if (!alarm) return;

        this.originalName = alarm.name;
        this.showRenameInput(alarmId, alarm.name);
    }

    // 显示重命名输入框
    showRenameInput(alarmId, currentName) {
        const titleSection = document.querySelector(`[data-alarm-id="${alarmId}"] .alarm-title-section`);
        if (!titleSection) return;

        // 保存原始内容
        const originalContent = titleSection.innerHTML;

        // 创建重命名输入框
        const renameHtml = `
            <input type="text" 
                   value="${currentName}" 
                   placeholder="输入闹钟名称（按Enter保存，Esc取消）"
                   maxlength="20"
                   onkeydown="handleRenameKeydown(event, ${alarmId})"
                   onblur="handleRenameBlur(${alarmId})">
        `;

        // 替换内容
        titleSection.innerHTML = renameHtml;

        // 聚焦输入框并选中文本
        const input = titleSection.querySelector('input[type="text"]');
        if (input) {
            input.focus();
            input.select();
        }

        // 重新创建图标
        lucide.createIcons();


    }

    // 保存重命名
    saveRename(alarmId) {
        const input = document.querySelector(`[data-alarm-id="${alarmId}"] input[type="text"]`);
        if (!input) return;

        const newName = input.value.trim();
        
        // 验证名称
        if (!this.validateName(newName)) {
            this.showRenameError(alarmId, '闹钟名称不能为空且不能超过20个字符');
            return;
        }

        // 检查是否与其他闹钟重名
        const existingAlarm = alarms.find(a => a.id !== alarmId && a.name === newName);
        if (existingAlarm) {
            this.showRenameError(alarmId, '闹钟名称已存在，请使用其他名称');
            return;
        }

        // 更新闹钟名称
        const alarm = alarms.find(a => a.id === alarmId);
        if (alarm) {
            alarm.name = newName;
            alarmStorage.saveAlarms(alarms);
            
            // 重新应用过滤以更新显示
            applyAlarmFilters();
            
            // 显示成功反馈
            this.showRenameFeedback('闹钟重命名成功');
        }

        this.finishRename(alarmId);
    }

    // 取消重命名
    cancelRename(alarmId) {
        this.finishRename(alarmId);
    }

    // 完成重命名（保存或取消）
    finishRename(alarmId) {
        const titleSection = document.querySelector(`[data-alarm-id="${alarmId}"] .alarm-title-section`);
        if (!titleSection) return;

        // 恢复原始内容
        const alarm = alarms.find(a => a.id === alarmId);
        if (alarm) {
            titleSection.innerHTML = `
                <h3 class="card-title">${alarm.name}</h3>
                <button class="rename-button" onclick="startRename(${alarmId})" title="重命名闹钟">
                    <i data-lucide="edit-3"></i>
                    重命名
                </button>
            `;
        }



        // 清除错误状态
        this.clearRenameError(alarmId);

        // 重置状态
        this.renamingAlarmId = null;
        this.originalName = '';

        // 重新创建图标
        lucide.createIcons();
    }

    // 验证名称
    validateName(name) {
        return name.length > 0 && name.length <= 20;
    }

    // 显示重命名错误
    showRenameError(alarmId, message) {
        const input = document.querySelector(`[data-alarm-id="${alarmId}"] input[type="text"]`);
        if (!input) return;

        input.classList.add('error');
        
        // 移除现有错误信息
        this.clearRenameError(alarmId);
        
        // 添加错误信息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rename-error';
        errorDiv.innerHTML = `
            <i data-lucide="alert-circle"></i>
            <span>${message}</span>
        `;
        
        input.parentNode.appendChild(errorDiv);
        lucide.createIcons();
    }

    // 清除重命名错误
    clearRenameError(alarmId) {
        const input = document.querySelector(`[data-alarm-id="${alarmId}"] input[type="text"]`);
        if (input) {
            input.classList.remove('error');
        }
        
        const errorDiv = document.querySelector(`[data-alarm-id="${alarmId}"] .rename-error`);
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // 显示重命名反馈
    showRenameFeedback(message) {
        // 创建反馈元素
        const feedback = document.createElement('div');
        feedback.className = 'rename-feedback';
        feedback.textContent = message;
        
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

    // 处理键盘事件
    handleKeydown(event, alarmId) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.saveRename(alarmId);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.cancelRename(alarmId);
        }
    }

    // 处理失焦事件
    handleBlur(alarmId) {
        // 延迟处理，避免与按钮点击冲突
        setTimeout(() => {
            if (this.renamingAlarmId === alarmId) {
                const input = document.querySelector(`[data-alarm-id="${alarmId}"] .rename-input`);
                if (input && !input.value.trim()) {
                    // 如果输入框为空，取消重命名
                    this.cancelRename(alarmId);
                }
            }
        }, 100);
    }
}

// 创建全局重命名管理器实例
const renameManager = new RenameManager();

// 全局函数供HTML调用
function startRename(alarmId) {
    renameManager.startRename(alarmId);
}

function saveRename(alarmId) {
    renameManager.saveRename(alarmId);
}

function cancelRename(alarmId) {
    renameManager.cancelRename(alarmId);
}

function handleRenameKeydown(event, alarmId) {
    renameManager.handleKeydown(event, alarmId);
}

function handleRenameBlur(alarmId) {
    renameManager.handleBlur(alarmId);
}

// 更新闹钟渲染函数以支持重命名功能
function updateAlarmRenderingWithRename() {
    // 保存原始的 renderAlarms 函数
    const originalRenderAlarms = window.renderAlarms;
    
    // 重写 renderAlarms 函数以支持重命名功能
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
            const isRenaming = renameManager.renamingAlarmId === alarm.id;
            
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

            // 标题区域（支持重命名）
            const titleSection = isRenaming ? `
                <input type="text" 
                       value="${alarm.name}" 
                       placeholder="输入闹钟名称（按Enter保存，Esc取消）"
                       maxlength="20"
                       onkeydown="handleRenameKeydown(event, ${alarm.id})"
                       onblur="handleRenameBlur(${alarm.id})">
            ` : `
                <h3 class="card-title">${alarm.name}</h3>
                <button class="rename-button" onclick="startRename(${alarm.id})" title="重命名闹钟">
                    <i data-lucide="edit-3"></i>
                    重命名
                </button>
            `;

            return `
                <div class="card ${highlightClass} ${favoriteClass}" data-alarm-id="${alarm.id}">
                    ${isFavorited ? '<div class="favorite-indicator"></div>' : ''}
                    <div class="card-header">
                        <div class="alarm-title-section">
                            ${titleSection}
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
                    <button class="delete-button" onclick="showDeleteConfirm(${alarm.id}, '${alarm.name}')" title="删除闹钟">
                        <i data-lucide="trash-2"></i>
                        删除
                    </button>
                </div>
            `;
        }).join('');

        lucide.createIcons();
        
        // 如果有正在重命名的闹钟，聚焦输入框
        if (renameManager.renamingAlarmId) {
            const input = document.querySelector(`[data-alarm-id="${renameManager.renamingAlarmId}"] .rename-input`);
            if (input) {
                input.focus();
                input.select();
            }
        }
    };
}

// 初始化重命名功能
function initializeRenameFeature() {
    // 更新渲染函数以支持重命名
    updateAlarmRenderingWithRename();
    
    // 重新渲染闹钟以应用重命名功能
    renderAlarms();
    
    console.log('闹钟重命名功能已初始化');
}

// 导出函数供全局使用
window.startRename = startRename;
window.saveRename = saveRename;
window.cancelRename = cancelRename;
window.handleRenameKeydown = handleRenameKeydown;
window.handleRenameBlur = handleRenameBlur;
window.renameManager = renameManager;
window.initializeRenameFeature = initializeRenameFeature; 
 
 
 
 
 
 
 