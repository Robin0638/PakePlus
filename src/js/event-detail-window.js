/**
 * 事件详细窗口管理器
 */
class EventDetailWindow {
    constructor() {
        this.window = null;
        this.currentEvent = null;
        this.isOpen = false;
        this.init();
    }

    /**
     * 初始化详细窗口
     */
    init() {
        this.createWindow();
        this.bindEvents();
        this.applyTheme();
    }

    /**
     * 创建详细窗口DOM结构
     */
    createWindow() {
        // 创建窗口容器
        this.window = document.createElement('div');
        this.window.className = 'event-detail-window';
        this.window.id = 'event-detail-window';
        
        // 创建窗口HTML结构
        this.window.innerHTML = `
            <div class="event-detail-header">
                <div class="event-status"></div>
                <div class="event-color-indicator" id="event-color-indicator"></div>
                <button class="share-event-btn" id="share-event-btn" title="分享日程">
                    <i class="fas fa-share-alt"></i>
                </button>
                <h2 id="detail-event-title">事件详情</h2>
                <div class="header-actions">
                    <button class="close-detail-btn" id="close-detail-window">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="event-detail-content" id="detail-content">
                <div class="loading-spinner" style="display: none;"></div>
                
                <!-- 项目信息 -->
                <div class="detail-section" id="project-section">
                    <div class="detail-section-title">
                        <i class="fas fa-project-diagram"></i>
                        项目
                    </div>
                    <div class="detail-section-content" id="detail-project">
                        <span class="empty">未设置项目</span>
                    </div>
                </div>
                
                <!-- 时间信息 -->
                <div class="detail-section" id="time-section">
                    <div class="detail-section-title">
                        <i class="fas fa-clock"></i>
                        时间
                    </div>
                    <div class="detail-section-content time-display" id="detail-time">
                        <span class="empty">未设置时间</span>
                    </div>
                </div>
                
                <!-- 地点信息 -->
                <div class="detail-section" id="location-section">
                    <div class="detail-section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        地点
                    </div>
                    <div class="detail-section-content" id="detail-location">
                        <span class="empty">未设置地点</span>
                    </div>
                </div>
                
                <!-- 参与人员 -->
                <div class="detail-section" id="participants-section">
                    <div class="detail-section-title">
                        <i class="fas fa-users"></i>
                        参与人员
                    </div>
                    <div class="detail-section-content" id="detail-participants">
                        <span class="empty">未设置参与人员</span>
                    </div>
                </div>
                
                <!-- 标签 -->
                <div class="detail-section" id="tags-section">
                    <div class="detail-section-title">
                        <i class="fas fa-tags"></i>
                        标签
                    </div>
                    <div class="detail-section-content" id="detail-tags">
                        <span class="empty">未设置标签</span>
                    </div>
                </div>
                
                <!-- 备注 -->
                <div class="detail-section" id="notes-section">
                    <div class="detail-section-title">
                        <i class="fas fa-sticky-note"></i>
                        备注
                    </div>
                    <div class="detail-section-content" id="detail-notes">
                        <span class="empty">暂无备注</span>
                    </div>
                </div>
            </div>
            
            <div class="event-detail-actions">
                <button class="action-btn edit-event-btn" id="detail-edit-btn">
                    <i class="fas fa-edit"></i>
                    编辑
                </button>
                <button class="action-btn delete-event-btn" id="detail-delete-btn">
                    <i class="fas fa-trash"></i>
                    删除
                </button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(this.window);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 关闭按钮
        const closeBtn = this.window.querySelector('#close-detail-window');
        closeBtn.addEventListener('click', () => {
            this.close();
        });

        // 分享按钮
        const shareBtn = this.window.querySelector('#share-event-btn');
        shareBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.shareEvent(this.currentEvent);
            }
        });

        // 编辑按钮
        const editBtn = this.window.querySelector('#detail-edit-btn');
        editBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.editEvent(this.currentEvent.id);
            }
        });

        // 删除按钮
        const deleteBtn = this.window.querySelector('#detail-delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.deleteEvent(this.currentEvent.id);
            }
        });

        // 点击窗口外部关闭
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.window.contains(e.target)) {
                this.close();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // 监听主题变化
        this.observeThemeChanges();
    }

    /**
     * 监听主题变化
     */
    observeThemeChanges() {
        const observer = new MutationObserver(() => {
            this.applyTheme();
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * 应用主题样式
     */
    applyTheme() {
        if (document.body.classList.contains('dark-theme')) {
            this.window.classList.add('dark-theme');
        } else {
            this.window.classList.remove('dark-theme');
        }
    }

    /**
     * 显示事件详情
     * @param {Object} event 事件对象
     */
    show(event) {
        if (!event) return;

        this.currentEvent = event;
        this.showLoading(true);
        
        // 延迟显示内容，让加载动画有时间显示
        setTimeout(() => {
            this.updateContent(event);
            this.showLoading(false);
            this.open();
        }, 100);
    }

    /**
     * 更新窗口内容
     * @param {Object} event 事件对象
     */
    updateContent(event) {
        // 更新标题
        const titleElement = this.window.querySelector('#detail-event-title');
        titleElement.textContent = event.name;

        // 更新标记色
        this.updateColorIndicator(event);

        // 更新状态指示器
        this.updateStatusIndicator(event);

        // 更新项目信息
        this.updateProjectInfo(event);

        // 更新时间信息
        this.updateTimeInfo(event);

        // 更新地点信息
        this.updateLocationInfo(event);

        // 更新参与人员
        this.updateParticipantsInfo(event);

        // 更新标签
        this.updateTagsInfo(event);

        // 更新备注
        this.updateNotesInfo(event);

        // 更新重复信息
        this.updateRepeatInfo(event);
    }

    /**
     * 更新标记色指示器
     */
    updateColorIndicator(event) {
        const colorIndicator = this.window.querySelector('#event-color-indicator');
        if (colorIndicator) {
            const color = event.color || '#4285f4';
            colorIndicator.style.backgroundColor = color;
        }
    }

    /**
     * 更新状态指示器
     */
    updateStatusIndicator(event) {
        const statusElement = this.window.querySelector('.event-status');
        const now = new Date();
        const startTime = event.startTime ? new Date(event.startTime) : null;
        const endTime = event.endTime ? new Date(event.endTime) : null;

        // 重置状态类
        statusElement.className = 'event-status';

        // 如果没有时间信息，不显示状态
        if (!startTime && !endTime) {
            statusElement.style.display = 'none';
            return;
        }

        // 显示状态指示器
        statusElement.style.display = 'block';

        // 获取今天的开始和结束时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 判断事件状态
        if (startTime) {
            const eventDate = new Date(startTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === today.getTime()) {
                // 今天的事件 - 绿色
                statusElement.classList.add('today');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else if (eventDate < today) {
                // 过去的事件 - 红色
                statusElement.classList.add('past');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else {
                // 未来事件 - 蓝色
                statusElement.classList.add('future');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            }
        } else if (endTime) {
            // 如果没有开始时间，使用结束时间判断
            const eventDate = new Date(endTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === today.getTime()) {
                // 今天的事件 - 绿色
                statusElement.classList.add('today');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else if (eventDate < today) {
                // 过去的事件 - 红色
                statusElement.classList.add('past');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else {
                // 未来事件 - 蓝色
                statusElement.classList.add('future');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            }
        }
    }

    /**
     * 更新项目信息
     */
    updateProjectInfo(event) {
        const projectElement = this.window.querySelector('#detail-project');
        
        if (event.projectId) {
            const projects = window.StorageManager ? window.StorageManager.getProjects() : [];
            const project = projects.find(p => p.id === event.projectId);
            
            if (project) {
                projectElement.innerHTML = `
                    <i class="fas fa-project-diagram" style="margin-right: 8px; color: ${project.color || '#4285f4'}"></i>
                    <span>${project.name}</span>
                `;
                projectElement.classList.remove('empty');
            } else {
                projectElement.innerHTML = '<span class="empty">项目不存在</span>';
                projectElement.classList.add('empty');
            }
        } else {
            projectElement.innerHTML = '<span class="empty">未设置项目</span>';
            projectElement.classList.add('empty');
        }
    }

    /**
     * 更新时间信息
     */
    updateTimeInfo(event) {
        const timeElement = this.window.querySelector('#detail-time');
        
        if (event.startTime) {
            const startTime = new Date(event.startTime);
            const endTime = event.endTime ? new Date(event.endTime) : null;
            
            const dateOptions = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
            };
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            };
            
            const dateStr = startTime.toLocaleDateString('zh-CN', dateOptions);
            const timeStr = startTime.toLocaleTimeString('zh-CN', timeOptions);
            
            let timeHTML = `
                <div class="time-main">${dateStr}</div>
                <div class="time-secondary">${timeStr}`;
            
            if (endTime) {
                if (startTime.toDateString() === endTime.toDateString()) {
                    // 同一天
                    timeHTML += ` - ${endTime.toLocaleTimeString('zh-CN', timeOptions)}`;
                } else {
                    // 跨天
                    const endDateStr = endTime.toLocaleDateString('zh-CN', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    timeHTML += `</div><div class="time-secondary">至 ${endDateStr} ${endTimeStr}`;
                }
            }
            
            timeHTML += '</div>';
            timeElement.innerHTML = timeHTML;
            timeElement.classList.remove('empty');
        } else {
            timeElement.innerHTML = '<span class="empty">未设置时间</span>';
            timeElement.classList.add('empty');
        }
    }

    /**
     * 更新地点信息
     */
    updateLocationInfo(event) {
        const locationElement = this.window.querySelector('#detail-location');
        
        if (event.location && event.location.trim()) {
            locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #e74c3c"></i>
                <span>${event.location}</span>
            `;
            locationElement.classList.remove('empty');
        } else {
            locationElement.innerHTML = '<span class="empty">未设置地点</span>';
            locationElement.classList.add('empty');
        }
    }

    /**
     * 更新参与人员信息
     */
    updateParticipantsInfo(event) {
        const participantsElement = this.window.querySelector('#detail-participants');
        
        if (event.participants && event.participants.length > 0) {
            const participants = Array.isArray(event.participants) ? event.participants : [event.participants];
            
            participantsElement.innerHTML = `
                <div class="participants-list">
                    ${participants.map(participant => `
                        <div class="participant-item">
                            <i class="fas fa-user" style="margin-right: 4px;"></i>
                            ${participant}
                        </div>
                    `).join('')}
                </div>
            `;
            participantsElement.classList.remove('empty');
        } else {
            participantsElement.innerHTML = '<span class="empty">未设置参与人员</span>';
            participantsElement.classList.add('empty');
        }
    }

    /**
     * 更新标签信息
     */
    updateTagsInfo(event) {
        const tagsElement = this.window.querySelector('#detail-tags');
        
        if (event.tags && event.tags.length > 0) {
            tagsElement.innerHTML = `
                <div class="detail-tags">
                    ${event.tags.map(tag => `
                        <div class="detail-tag">
                            <i class="fas fa-tag"></i>
                            ${tag}
                        </div>
                    `).join('')}
                </div>
            `;
            tagsElement.classList.remove('empty');
        } else {
            tagsElement.innerHTML = '<span class="empty">未设置标签</span>';
            tagsElement.classList.add('empty');
        }
    }

    /**
     * 更新备注信息
     */
    updateNotesInfo(event) {
        const notesElement = this.window.querySelector('#detail-notes');
        
        if (event.notes && event.notes.trim()) {
            notesElement.innerHTML = `
                <div class="notes-content">${event.notes}</div>
                <button class="copy-notes-btn" id="copy-notes-btn" title="复制备注">
                    <i class="fas fa-copy"></i>
                    复制
                </button>
            `;
            notesElement.classList.remove('empty');
            
            // 绑定复制按钮事件
            const copyBtn = notesElement.querySelector('#copy-notes-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyNotesToClipboard(event.notes);
                });
            }
        } else {
            notesElement.innerHTML = '<span class="empty">暂无备注</span>';
            notesElement.classList.add('empty');
        }
    }

    /**
     * 复制备注到剪贴板
     */
    async copyNotesToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            
            // 显示复制成功状态
            const copyBtn = this.window.querySelector('#copy-notes-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>已复制';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('备注已复制到剪贴板');
            }
        } catch (err) {
            console.error('复制失败:', err);
            
            // 降级方案：使用传统的复制方法
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * 降级复制方案
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            
            // 显示复制成功状态
            const copyBtn = this.window.querySelector('#copy-notes-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>已复制';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('备注已复制到剪贴板');
            }
        } catch (err) {
            console.error('降级复制也失败了:', err);
            alert('复制失败，请手动复制备注内容');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * 更新重复信息
     */
    updateRepeatInfo(event) {
        const timeElement = this.window.querySelector('#detail-time');
        
        // 清除之前的重复信息
        const existingRepeatInfo = timeElement.querySelector('.repeat-info');
        if (existingRepeatInfo) {
            existingRepeatInfo.remove();
        }
        
        // 检查是否为重复事件
        if (event.repeat && event.repeat.type && event.repeat.type !== 'none') {
            const repeatInfo = this.getRepeatInfoText(event.repeat);
            const repeatElement = document.createElement('div');
            repeatElement.className = 'repeat-info';
            repeatElement.innerHTML = `
                <i class="fas fa-redo"></i>
                <span>${repeatInfo}</span>
            `;
            timeElement.appendChild(repeatElement);
        }
    }

    /**
     * 获取重复信息文本
     */
    getRepeatInfoText(repeat) {
        const repeatMap = {
            'daily': '每日重复',
            'weekly': '每周重复',
            'monthly': '每月重复',
            'yearly': '每年重复'
        };
        
        let repeatText = repeatMap[repeat.type] || '重复事件';
        
        // 添加重复次数信息
        if (repeat.count && repeat.count > 0) {
            repeatText += ` (${repeat.count}次)`;
        }
        
        // 添加结束日期信息
        if (repeat.endDate) {
            const endDate = new Date(repeat.endDate);
            const endDateStr = endDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            repeatText += ` - 至${endDateStr}`;
        }
        
        return repeatText;
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        const content = this.window.querySelector('#detail-content');
        const spinner = this.window.querySelector('.loading-spinner');
        
        if (show) {
            this.window.classList.add('loading');
            spinner.style.display = 'block';
        } else {
            this.window.classList.remove('loading');
            spinner.style.display = 'none';
        }
    }

    /**
     * 打开窗口
     */
    open() {
        this.window.classList.add('active');
        this.isOpen = true;
        
        // 添加body滚动锁定
        document.body.style.overflow = 'hidden';
        
        // 触发打开事件
        this.window.dispatchEvent(new CustomEvent('detailWindowOpen', {
            detail: { event: this.currentEvent }
        }));
    }

    /**
     * 关闭窗口
     */
    close() {
        this.window.classList.remove('active');
        this.isOpen = false;
        this.currentEvent = null;
        
        // 恢复body滚动
        document.body.style.overflow = '';
        
        // 触发关闭事件
        this.window.dispatchEvent(new CustomEvent('detailWindowClose'));
    }

    /**
     * 编辑事件
     */
    editEvent(eventId) {
        this.close();
        
        // 延迟执行，确保窗口关闭动画完成
        setTimeout(() => {
            // 跳转到新建菜单
            if (window.UIManager && window.UIManager.switchView) {
                window.UIManager.switchView('create');
            }
            
            // 切换到传统新建标签
            setTimeout(() => {
                if (window.UIManager && window.UIManager.switchCreateTab) {
                    window.UIManager.switchCreateTab('traditional');
                }
                
                // 加载事件数据到表单
                if (window.TaskManager && window.TaskManager.editEvent) {
                    window.TaskManager.editEvent(eventId);
                }
            }, 100);
        }, 400);
    }

    /**
     * 删除事件
     */
    deleteEvent(eventId) {
        if (confirm('确定要删除这个事件吗？此操作不可撤销。')) {
            this.close();
            
            // 延迟执行，确保窗口关闭动画完成
            setTimeout(() => {
                if (window.TaskManager && window.TaskManager.deleteEvent) {
                    window.TaskManager.deleteEvent(eventId);
                }
            }, 400);
        }
    }

    /**
     * 检查窗口是否打开
     */
    isWindowOpen() {
        return this.isOpen;
    }

    /**
     * 获取当前显示的事件
     */
    getCurrentEvent() {
        return this.currentEvent;
    }

    /**
     * 销毁窗口
     */
    destroy() {
        if (this.window && this.window.parentNode) {
            this.window.parentNode.removeChild(this.window);
        }
        this.window = null;
        this.currentEvent = null;
        this.isOpen = false;
    }

    /**
     * 分享事件
     */
    async shareEvent(event) {
        const shareText = this.formatEventForSharing(event);
        
        try {
            await navigator.clipboard.writeText(shareText);
            
            // 显示分享成功状态
            const shareBtn = this.window.querySelector('#share-event-btn');
            if (shareBtn) {
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<i class="fas fa-check"></i>';
                shareBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('日程已复制到剪贴板');
            }
        } catch (err) {
            console.error('分享失败:', err);
            
            // 降级方案
            this.fallbackShareToClipboard(shareText);
        }
    }

    /**
     * 格式化事件信息用于分享
     */
    formatEventForSharing(event) {
        let shareText = `📅 ${event.name}\n\n`;
        
        // 时间信息
        if (event.startTime) {
            const startTime = new Date(event.startTime);
            const endTime = event.endTime ? new Date(event.endTime) : null;
            
            const dateOptions = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
            };
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            };
            
            const dateStr = startTime.toLocaleDateString('zh-CN', dateOptions);
            const timeStr = startTime.toLocaleTimeString('zh-CN', timeOptions);
            
            shareText += `🕐 时间：${dateStr} ${timeStr}`;
            
            if (endTime) {
                if (startTime.toDateString() === endTime.toDateString()) {
                    // 同一天
                    shareText += ` - ${endTime.toLocaleTimeString('zh-CN', timeOptions)}`;
                } else {
                    // 跨天
                    const endDateStr = endTime.toLocaleDateString('zh-CN', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    shareText += ` 至 ${endDateStr} ${endTimeStr}`;
                }
            }
            shareText += '\n';
        }
        
        // 项目信息
        if (event.projectId) {
            const projects = window.StorageManager ? window.StorageManager.getProjects() : [];
            const project = projects.find(p => p.id === event.projectId);
            if (project) {
                shareText += `📋 项目：${project.name}\n`;
            }
        }
        
        // 地点信息
        if (event.location && event.location.trim()) {
            shareText += `📍 地点：${event.location}\n`;
        }
        
        // 参与人员
        if (event.participants && event.participants.length > 0) {
            const participants = Array.isArray(event.participants) ? event.participants : [event.participants];
            shareText += `👥 参与人员：${participants.join('、')}\n`;
        }
        
        // 标签
        if (event.tags && event.tags.length > 0) {
            shareText += `🏷️ 标签：${event.tags.join('、')}\n`;
        }
        
        // 重复信息
        if (event.repeat && event.repeat.type && event.repeat.type !== 'none') {
            const repeatMap = {
                'daily': '每日重复',
                'weekly': '每周重复',
                'monthly': '每月重复',
                'yearly': '每年重复'
            };
            
            let repeatText = repeatMap[event.repeat.type] || '重复事件';
            
            // 添加重复次数信息
            if (event.repeat.count && event.repeat.count > 0) {
                repeatText += ` (${event.repeat.count}次)`;
            }
            
            // 添加结束日期信息
            if (event.repeat.endDate) {
                const endDate = new Date(event.repeat.endDate);
                const endDateStr = endDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                repeatText += ` - 至${endDateStr}`;
            }
            
            shareText += `🔄 重复：${repeatText}\n`;
        }
        
        // 状态
        const now = new Date();
        const startTime = event.startTime ? new Date(event.startTime) : null;
        const endTime = event.endTime ? new Date(event.endTime) : null;
        
        if (event.completed) {
            shareText += `\n✅ 已完成`;
        } else {
            // 获取今天的开始时间
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let eventDate = null;
            if (startTime) {
                eventDate = new Date(startTime);
                eventDate.setHours(0, 0, 0, 0);
            } else if (endTime) {
                eventDate = new Date(endTime);
                eventDate.setHours(0, 0, 0, 0);
            }
            
            if (eventDate) {
                if (eventDate.getTime() === today.getTime()) {
                    shareText += `\n🟢 今天`;
                } else if (eventDate < today) {
                    shareText += `\n🔴 已过期`;
                } else {
                    shareText += `\n🔵 未来`;
                }
            } else {
                shareText += `\n⏳ 进行中`;
            }
        }
        
        // 备注
        if (event.notes && event.notes.trim()) {
            shareText += `\n📝 备注：\n${event.notes}\n`;
        }
        
        return shareText;
    }

    /**
     * 降级分享方案
     */
    fallbackShareToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            
            // 显示分享成功状态
            const shareBtn = this.window.querySelector('#share-event-btn');
            if (shareBtn) {
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<i class="fas fa-check"></i>';
                shareBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('日程已复制到剪贴板');
            }
        } catch (err) {
            console.error('降级分享也失败了:', err);
            alert('分享失败，请手动复制日程内容');
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// 创建全局实例
window.EventDetailWindow = new EventDetailWindow();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventDetailWindow;
} 