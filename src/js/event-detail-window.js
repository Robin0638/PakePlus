/**
 * Things详细窗口管理器
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
                <button class="share-event-btn" id="share-event-btn" title="Share日程">
                    <i class="fas fa-share-alt"></i>
                </button>
                <h2 id="detail-event-title">Things详情</h2>
                <div class="header-actions">
                    <button class="close-detail-btn" id="close-detail-window">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="event-detail-content" id="detail-content">
                <div class="loading-spinner" style="display: none;"></div>
                
                <!-- Item信息 -->
                <div class="detail-section" id="project-section">
                    <div class="detail-section-title">
                        <i class="fas fa-project-diagram"></i>
                        Item
                    </div>
                    <div class="detail-section-content" id="detail-project">
                        <span class="empty">未SetItem</span>
                    </div>
                </div>
                
                <!-- time信息 -->
                <div class="detail-section" id="time-section">
                    <div class="detail-section-title">
                        <i class="fas fa-clock"></i>
                        time
                    </div>
                    <div class="detail-section-content time-display" id="detail-time">
                        <span class="empty">未Settime</span>
                    </div>
                </div>
                
                <!-- place信息 -->
                <div class="detail-section" id="location-section">
                    <div class="detail-section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        place
                    </div>
                    <div class="detail-section-content" id="detail-location">
                        <span class="empty">未Setplace</span>
                    </div>
                </div>
                
                <!-- Participants -->
                <div class="detail-section" id="participants-section">
                    <div class="detail-section-title">
                        <i class="fas fa-users"></i>
                        Participants
                    </div>
                    <div class="detail-section-content" id="detail-participants">
                        <span class="empty">未SetParticipants</span>
                    </div>
                </div>
                
                <!-- Label -->
                <div class="detail-section" id="tags-section">
                    <div class="detail-section-title">
                        <i class="fas fa-tags"></i>
                        Label
                    </div>
                    <div class="detail-section-content" id="detail-tags">
                        <span class="empty">未SetLabel</span>
                    </div>
                </div>
                
                <!-- Remark -->
                <div class="detail-section" id="notes-section">
                    <div class="detail-section-title">
                        <i class="fas fa-sticky-note"></i>
                        Remark
                    </div>
                    <div class="detail-section-content" id="detail-notes">
                        <span class="empty">Empty remark</span>
                    </div>
                </div>
            </div>
            
            <div class="event-detail-actions">
                <button class="action-btn edit-event-btn" id="detail-edit-btn">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="action-btn delete-event-btn" id="detail-delete-btn">
                    <i class="fas fa-trash"></i>
                    Delet
                </button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(this.window);
    }

    /**
     * 绑定Things监听器
     */
    bindEvents() {
        // Close按钮
        const closeBtn = this.window.querySelector('#close-detail-window');
        closeBtn.addEventListener('click', () => {
            // 如果正在Edit模式，恢复Edit按钮状态
            if (this.handleCancelEdit) {
                this.handleCancelEdit();
            }
            this.close();
        });

        // Share按钮
        const shareBtn = this.window.querySelector('#share-event-btn');
        shareBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.shareEvent(this.currentEvent);
            }
        });

        // Edit按钮
        const editBtn = this.window.querySelector('#detail-edit-btn');
        editBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.editEvent(this.currentEvent.id);
            }
        });

        // Delet按钮
        const deleteBtn = this.window.querySelector('#detail-delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (this.currentEvent) {
                this.deleteEvent(this.currentEvent.id);
            }
        });

        // 触控适配：下滑Close
        this.addTouchCloseHandler();

        // 点击窗口外部Close（仅桌面端）
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.window.contains(e.target) && !this.isTouchDevice()) {
                // 如果正在Edit模式，恢复Edit按钮状态
                if (this.handleCancelEdit) {
                    this.handleCancelEdit();
                }
                this.close();
            }
        });

        // ESC键Close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                // 如果正在Edit模式，恢复Edit按钮状态
                if (this.handleCancelEdit) {
                    this.handleCancelEdit();
                }
                this.close();
            }
        });

        // 监听主题变化
        this.observeThemeChanges();

        // 触控Content区滚动兼容
        this.enableTouchScrollOnContent();

    }

    /**
     * 判断是否为触控设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * 添加触控下滑CloseThings
     */
    addTouchCloseHandler() {
        if (!this.isTouchDevice()) return;
        let startY = 0;
        let currentY = 0;
        let dragging = false;
        const threshold = 80; // 下滑距离阈值
        const detailWindow = this.window;
        // 添加顶部滑块提示
        let slider = detailWindow.querySelector('.touch-slider-bar');
        if (!slider) {
            slider = document.createElement('div');
            slider.className = 'touch-slider-bar';
            detailWindow.querySelector('.event-detail-header').prepend(slider);
        }
        // 触摸Things
        detailWindow.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startY = e.touches[0].clientY;
                dragging = true;
                detailWindow.style.transition = 'none';
            }
        });
        detailWindow.addEventListener('touchmove', (e) => {
            if (!dragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            if (deltaY > 0) {
                detailWindow.style.transform = `translateY(${deltaY}px)`;
            }
        });
        detailWindow.addEventListener('touchend', (e) => {
            if (!dragging) return;
            dragging = false;
            const deltaY = currentY - startY;
            detailWindow.style.transition = '';
            if (deltaY > threshold) {
                detailWindow.style.transform = '';
                this.close();
            } else {
                detailWindow.style.transform = '';
            }
        });
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
     * 显示Things详情
     * @param {Object} event Things对象
     */
    show(event) {
        if (!event) return;

        this.currentEvent = event;
        this.showLoading(true);
        
        // 延迟显示Content，让加载动画有time显示
        setTimeout(() => {
            this.updateContent(event);
            this.showLoading(false);
            this.open();
        }, 100);
    }

    /**
     * 更新窗口Content
     * @param {Object} event Things对象
     */
    updateContent(event) {
        // 更新Title
        const titleElement = this.window.querySelector('#detail-event-title');
        titleElement.textContent = event.name;

        // 更新标记色
        this.updateColorIndicator(event);

        // 更新状态指示器
        this.updateStatusIndicator(event);

        // 更新Item信息
        this.updateProjectInfo(event);

        // Update time信息
        this.updateTimeInfo(event);

        // 更新place信息
        this.updateLocationInfo(event);

        // 更新Participants
        this.updateParticipantsInfo(event);

        // 更新Label
        this.updateTagsInfo(event);

        // 更新适宜Things推荐
        // this.updateSuitableEvents(event);

        // 更新Remark
        this.updateNotesInfo(event);

        // 更新Repeat信息
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

        // 如果没有time信息，不显示状态
        if (!startTime && !endTime) {
            statusElement.style.display = 'none';
            return;
        }

        // 显示状态指示器
        statusElement.style.display = 'block';

        // 获取今天的开始和结束time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 判断Things状态
        if (startTime) {
            const eventDate = new Date(startTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === today.getTime()) {
                // 今天的Things - 绿色
                statusElement.classList.add('today');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else if (eventDate < today) {
                // 过去的Things - 红色
                statusElement.classList.add('past');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else {
                // 未来Things - 蓝色
                statusElement.classList.add('future');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            }
        } else if (endTime) {
            // 如果没有开始time，使用结束time判断
            const eventDate = new Date(endTime);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate.getTime() === today.getTime()) {
                // 今天的Things - 绿色
                statusElement.classList.add('today');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else if (eventDate < today) {
                // 过去的Things - 红色
                statusElement.classList.add('past');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            } else {
                // 未来Things - 蓝色
                statusElement.classList.add('future');
                if (event.completed) {
                    statusElement.classList.add('completed');
                }
            }
        }
    }

    /**
     * 更新Item信息
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
                projectElement.innerHTML = '<span class="empty">Item不存在</span>';
                projectElement.classList.add('empty');
            }
        } else {
            projectElement.innerHTML = '<span class="empty">未SetItem</span>';
            projectElement.classList.add('empty');
        }
    }

    /**
     * Update time信息
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
            
            const dateStr = startTime.toLocaleDateString('en-US', dateOptions);
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
                    const endDateStr = endTime.toLocaleDateString('en-US', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    timeHTML += `</div><div class="time-secondary">- ${endDateStr} ${endTimeStr}`;
                }
            }
            timeHTML += '</div>';

            // 判断是否进行medium
            let now = new Date();
            if (event.startTime && event.endTime) {
                if (startTime <= now && now <= endTime) {
                    timeHTML += '<div class="event-ongoing-tip" style="margin-top:8px;color:#ff9800;font-weight:bold;"><i class="fas fa-bolt"></i> Things进行medium</div>';
                }
            }

            timeElement.innerHTML = timeHTML;
            timeElement.classList.remove('empty');
        } else {
            timeElement.innerHTML = '<span class="empty">未Settime</span>';
            timeElement.classList.add('empty');
        }
    }

    /**
     * 更新place信息
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
            locationElement.innerHTML = '<span class="empty">未Setplace</span>';
            locationElement.classList.add('empty');
        }
    }

    /**
     * 更新Participants信息
     */
    updateParticipantsInfo(event) {
        const participantsElement = this.window.querySelector('#detail-participants');
        
        if (event.participants && event.participants.length > 0) {
            const participants = Array.isArray(event.participants) ? event.participants : [event.participants];
            
            participantsElement.innerHTML = `
                <div class="participants-List">
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
            participantsElement.innerHTML = '<span class="empty">未SetParticipants</span>';
            participantsElement.classList.add('empty');
        }
    }

    /**
     * 更新Label信息
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
            tagsElement.innerHTML = '<span class="empty">未SetLabel</span>';
            tagsElement.classList.add('empty');
        }
    }

    /**
     * 更新适宜Things推荐
     */
    // updateSuitableEvents(event) {
    //     const suitableEventsContainer = this.window.querySelector('#detail-suitable-events');
    //     const suitableEventsScroll = this.window.querySelector('#suitable-events-scroll');

    //     if (event.suitableEvents && event.suitableEvents.length > 0) {
    //         suitableEventsScroll.innerHTML = ''; // 清空之前的推荐
    //         event.suitableEvents.forEach(suitableEvent => {
    //             const suitableEventItem = document.createElement('div');
    //             suitableEventItem.className = 'suitable-event-item';
    //             suitableEventItem.innerHTML = `
    //                 <i class="fas fa-calendar-check" style="margin-right: 8px; color: #2ecc71"></i>
    //                 <span>${suitableEvent.name}</span>
    //             `;
    //             suitableEventsScroll.appendChild(suitableEventItem);
    //         });
    //         suitableEventsContainer.classList.remove('empty');
    //     } else {
    //         // 生成示例适宜Things数据
    //         const sampleSuitableEvents = this.generateSampleSuitableEvents(event);
    //         suitableEventsScroll.innerHTML = ''; // 清空之前的推荐
            
    //         sampleSuitableEvents.forEach(suitableEvent => {
    //             const suitableEventItem = document.createElement('div');
    //             suitableEventItem.className = 'suitable-event-item';
    //             suitableEventItem.innerHTML = `
    //                 <i class="fas ${suitableEvent.icon}" style="margin-right: 8px; color: ${suitableEvent.color}"></i>
    //                 <span>${suitableEvent.name}</span>
    //             `;
                
    //             // 添加点击Things
    //             suitableEventItem.addEventListener('click', () => {
    //                 this.handleSuitableEventClick(suitableEvent);
    //             });
                
    //             suitableEventsScroll.appendChild(suitableEventItem);
    //         });
            
    //         suitableEventsContainer.classList.remove('empty');
    //     }
        
    //     // 检查是否需要显示滚动指示器
    //     this.updateScrollIndicator();
    // }

    /**
     * 生成示例适宜Things数据
     */
    // generateSampleSuitableEvents(event) {
    //     const baseEvents = [
    //         { name: '准备会议材料', icon: 'fa-file-alt', color: '#3498db' },
    //         { name: '联系相关人员', icon: 'fa-phone', color: '#e74c3c' },
    //         { name: '检查设备状态', icon: 'fa-laptop', color: '#f39c12' },
    //         { name: '整理工作环境', icon: 'fa-broom', color: '#9b59b6' },
    //         { name: '复习相关文档', icon: 'fa-book', color: '#1abc9c' },
    //         { name: '制定time计划', icon: 'fa-clock', color: '#34495e' },
    //         { name: '准备演示文稿', icon: 'fa-presentation', color: '#e67e22' },
    //         { name: '收集反馈意见', icon: 'fa-comments', color: '#16a085' },
    //         { name: '更新Item进度', icon: 'fa-chart-line', color: '#8e44ad' },
    //         { name: '安排后续会议', icon: 'fa-calendar-plus', color: '#27ae60' }
    //     ];
        
    //     // 根据Things类型和time调整推荐
    //     let selectedEvents = [...baseEvents];
        
    //     if (event.startTime) {
    //         const eventTime = new Date(event.startTime);
    //         const hour = eventTime.getHours();
            
    //         // 根据time调整推荐
    //         if (hour < 9) {
    //             selectedEvents = selectedEvents.filter(e => 
    //                 e.name.includes('准备') || e.name.includes('整理') || e.name.includes('复习')
    //             );
    //         } else if (hour > 18) {
    //             selectedEvents = selectedEvents.filter(e => 
    //                 e.name.includes('总结') || e.name.includes('更新') || e.name.includes('安排')
    //             );
    //         }
    //     }
        
    //     // 随机Select3-6个Things
    //     const count = Math.min(selectedEvents.length, Math.floor(Math.random() * 4) + 3);
    //     const shuffled = selectedEvents.sort(() => 0.5 - Math.random());
    //     return shuffled.slice(0, count);
    // }

    /**
     * 处理适宜Things点击
     */
    // handleSuitableEventClick(suitableEvent) {
    //     // 显示点击反馈
    //     const notification = document.createElement('div');
    //     notification.style.cssText = `
    //         position: fixed;
    //         top: 50%;
    //         left: 50%;
    //         transform: translate(-50%, -50%);
    //         background: rgba(0, 0, 0, 0.8);
    //         color: white;
    //         padding: 12px 20px;
    //         border-radius: 8px;
    //         font-size: 14px;
    //         z-index: 10001;
    //         pointer-events: none;
    //     `;
    //     notification.textContent = `已Select：${suitableEvent.name}`;
    //     document.body.appendChild(notification);
        
    //     // 2秒后移除通知
    //     setTimeout(() => {
    //         if (notification.parentNode) {
    //             notification.parentNode.removeChild(notification);
    //         }
    //     }, 2000);
    // }

    /**
     * 更新滚动指示器
     */
    // updateScrollIndicator() {
    //     const suitableEventsContainer = this.window.querySelector('#detail-suitable-events');
    //     const suitableEventsScroll = this.window.querySelector('#suitable-events-scroll');
        
    //     if (!suitableEventsContainer || !suitableEventsScroll) return;
        
    //     // 检查是否有更多Content需要滚动
    //     const hasMoreContent = suitableEventsScroll.scrollHeight > suitableEventsScroll.clientHeight;
        
    //     if (hasMoreContent) {
    //         suitableEventsContainer.classList.add('has-more-content');
    //     } else {
    //         suitableEventsContainer.classList.remove('has-more-content');
    //     }
    // }

    /**
     * 更新Remark信息
     */
    updateNotesInfo(event) {
        const notesElement = this.window.querySelector('#detail-notes');
        
        if (event.notes && event.notes.trim()) {
            notesElement.innerHTML = `
                <div class="notes-content">${event.notes}</div>
                <button class="copy-notes-btn" id="copy-notes-btn" title="CopyRemark">
                    <i class="fas fa-copy"></i>
                    Copy
                </button>
            `;
            notesElement.classList.remove('empty');
            
            // 绑定Copy按钮Things
            const copyBtn = notesElement.querySelector('#copy-notes-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyNotesToClipboard(event.notes);
                });
            }
        } else {
            notesElement.innerHTML = '<span class="empty">Empty remark</span>';
            notesElement.classList.add('empty');
        }
    }

    /**
     * CopyRemark到剪贴板
     */
    async copyNotesToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            
            // 显示Copy成功状态
            const copyBtn = this.window.querySelector('#copy-notes-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>已Copy';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('Remark已Copy到剪贴板');
            }
        } catch (err) {
            console.error('Copy失败:', err);
            
            // 降级方案：使用传统的Copy方法
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * 降级Copy方案
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
            
            // 显示Copy成功状态
            const copyBtn = this.window.querySelector('#copy-notes-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>已Copy';
                copyBtn.classList.add('copied');
                
                // 2秒后恢复原状态
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
            
            // 显示通知
            if (window.UIManager && window.UIManager.showNotification) {
                window.UIManager.showNotification('Remark已Copy到剪贴板');
            }
        } catch (err) {
            console.error('降级Copy也失败了:', err);
            alert('Copy失败，请手动CopyRemarkContent');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * 更新Repeat信息
     */
    updateRepeatInfo(event) {
        const timeElement = this.window.querySelector('#detail-time');
        
        // Purge之前的Repeat信息
        const existingRepeatInfo = timeElement.querySelector('.repeat-info');
        if (existingRepeatInfo) {
            existingRepeatInfo.remove();
        }
        
        // 检查是否为RepeatThings
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
     * 获取Repeat信息文本
     */
    getRepeatInfoText(repeat) {
        const repeatMap = {
            'daily': 'Repeat daily',
            'weekly': '每周Repeat',
            'monthly': 'EverymonthRepeat',
            'yearly': 'EveryyearRepeat'
        };
        
        let repeatText = repeatMap[repeat.type] || 'RepeatThings';
        
        // 添加Repeattimes数信息
        if (repeat.count && repeat.count > 0) {
            repeatText += ` (${repeat.count}times)`;
        }
        
        // 添加结束日期信息
        if (repeat.endDate) {
            const endDate = new Date(repeat.endDate);
            const endDateStr = endDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            repeatText += ` - -${endDateStr}`;
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
        
        // 触发打开Things
        this.window.dispatchEvent(new CustomEvent('detailWindowOpen', {
            detail: { event: this.currentEvent }
        }));
    }

    /**
     * Close窗口
     */
    close() {
        this.window.classList.remove('active');
        this.isOpen = false;
        this.currentEvent = null;
        
        // 清理取消处理函数
        if (this.handleCancelEdit) {
            delete this.handleCancelEdit;
        }
        
        // 恢复body滚动
        document.body.style.overflow = '';
        
        // 触发CloseThings
        this.window.dispatchEvent(new CustomEvent('detailWindowClose'));
    }

    /**
     * EditThings
     */
    editEvent(eventId) {
        // 不立即Close窗口，而是切换到Edit模式
        this.switchToEditMode(eventId);
    }

    /**
     * 切换到Edit模式
     */
    switchToEditMode(eventId) {
        // 显示Edit模式提示
        const editBtn = this.window.querySelector('#detail-edit-btn');
        const originalText = editBtn.innerHTML;
        
        editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 切换到Edit模式...';
        editBtn.disabled = true;
        
        // 延迟执行，给用户视觉反馈
        setTimeout(() => {
            // 恢复Edit按钮状态
            editBtn.innerHTML = originalText;
            editBtn.disabled = false;
            
            // 跳转到New菜单
            if (window.UIManager && window.UIManager.switchView) {
                window.UIManager.switchView('create');
            }
            
            // 切换到传统NewLabel
            setTimeout(() => {
                if (window.UIManager && window.UIManager.switchCreateTab) {
                    window.UIManager.switchCreateTab('traditional-create');
                }
                
                // 加载Things数据到表单
                if (window.TaskManager && window.TaskManager.editEvent) {
                    window.TaskManager.editEvent(eventId);
                }
                
                // 显示友好的提示信息
                if (window.UIManager && window.UIManager.showNotification) {
                    window.UIManager.showNotification('已切换到Edit模式，您可以修改Things信息');
                }
                
                // 最后Close详情窗口
                this.close();
            }, 100);
        }, 300);
        
        // 移除取消Edit的处理，因为按钮已经恢复状态
        delete this.handleCancelEdit;
    }

    /**
     * DeletThings
     */
    deleteEvent(eventId) {
        if (confirm('确定要Delet这个Things吗？此操作不可撤销。')) {
            this.close();
            
            // 延迟执行，确保窗口Close动画Completed
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
     * 获取当前显示的Things
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
     * ShareThings
     */
    async shareEvent(event) {
        const shareText = this.formatEventForSharing(event);
        
        try {
            await navigator.clipboard.writeText(shareText);
            
            // 显示Share成功状态
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
                window.UIManager.showNotification('Schedule has been copied to clipboard');
            }
        } catch (err) {
            console.error('Share失败:', err);
            
            // 降级方案
            this.fallbackShareToClipboard(shareText);
        }
    }

    /**
     * 格式化Things信息用于Share
     */
    formatEventForSharing(event) {
        let shareText = `📅 ${event.name}\n\n`;
        
        // time信息
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
            
            const dateStr = startTime.toLocaleDateString('en-US', dateOptions);
            const timeStr = startTime.toLocaleTimeString('zh-CN', timeOptions);
            
            shareText += `🕐 time：${dateStr} ${timeStr}`;
            
            if (endTime) {
                if (startTime.toDateString() === endTime.toDateString()) {
                    // 同一天
                    shareText += ` - ${endTime.toLocaleTimeString('zh-CN', timeOptions)}`;
                } else {
                    // 跨天
                    const endDateStr = endTime.toLocaleDateString('en-US', dateOptions);
                    const endTimeStr = endTime.toLocaleTimeString('zh-CN', timeOptions);
                    shareText += ` - ${endDateStr} ${endTimeStr}`;
                }
            }
            // 判断是否进行medium
            let now = new Date();
            if (event.startTime && event.endTime) {
                if (startTime <= now && now <= endTime) {
                    shareText += `\n⚡Things进行medium`;
                }
            }
            shareText += '\n';
        }
        
        // Item信息
        if (event.projectId) {
            const projects = window.StorageManager ? window.StorageManager.getProjects() : [];
            const project = projects.find(p => p.id === event.projectId);
            if (project) {
                shareText += `📋 Item：${project.name}\n`;
            }
        }
        
        // place信息
        if (event.location && event.location.trim()) {
            shareText += `📍 place：${event.location}\n`;
        }
        
        // Participants
        if (event.participants && event.participants.length > 0) {
            const participants = Array.isArray(event.participants) ? event.participants : [event.participants];
            shareText += `👥 Participants：${participants.join('、')}\n`;
        }
        
        // Label
        if (event.tags && event.tags.length > 0) {
            shareText += `🏷️ Label：${event.tags.join('、')}\n`;
        }

        // Repeat信息
        if (event.repeat && event.repeat.type && event.repeat.type !== 'none') {
            const repeatMap = {
                'daily': 'Repeat daily',
                'weekly': '每周Repeat',
                'monthly': 'EverymonthRepeat',
                'yearly': 'EveryyearRepeat'
            };
            
            let repeatText = repeatMap[event.repeat.type] || 'RepeatThings';
            
            // 添加Repeattimes数信息
            if (event.repeat.count && event.repeat.count > 0) {
                repeatText += ` (${event.repeat.count}times)`;
            }
            
            // 添加结束日期信息
            if (event.repeat.endDate) {
                const endDate = new Date(event.repeat.endDate);
                const endDateStr = endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                repeatText += ` - -${endDateStr}`;
            }
            
            shareText += `🔄 Repeat：${repeatText}\n`;
        }
        
        // 状态
        const now = new Date();
        const startTime = event.startTime ? new Date(event.startTime) : null;
        const endTime = event.endTime ? new Date(event.endTime) : null;
        
        if (event.completed) {
            shareText += `\n✅ Completed`;
        } else {
            // 获取今天的开始time
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
                shareText += `\n⏳ 进行medium`;
            }
        }
        
        // Remark
        if (event.notes && event.notes.trim()) {
            shareText += `\n📝 Remark：\n${event.notes}\n`;
        }
        
        return shareText;
    }

    /**
     * 降级Share方案
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
            
            // 显示Share成功状态
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
                window.UIManager.showNotification('Schedule has been copied to clipboard');
            }
        } catch (err) {
            console.error('降级Share也失败了:', err);
            alert('Share失败，请手动Copy日程Content');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 新增方法
    enableTouchScrollOnContent() {
        const content = this.window.querySelector('.event-detail-content');
        if (!content) return;

        let startY = 0;
        let canScroll = false;

        content.addEventListener('touchstart', function(e) {
            if (content.scrollHeight > content.clientHeight) {
                canScroll = true;
                startY = e.touches[0].clientY;
            } else {
                canScroll = false;
            }
        }, { passive: false });

        content.addEventListener('touchmove', function(e) {
            if (!canScroll) return;
            const y = e.touches[0].clientY;
            const up = y > startY;
            const down = y < startY;
            const atTop = content.scrollTop === 0;
            const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;

            if ((atTop && up) || (atBottom && down)) {
                // 阻止"橡皮筋"或穿透
                e.preventDefault();
            }
            // 阻止冒泡到body
            e.stopPropagation();
        }, { passive: false });
    }
}

// 创建全局实例
window.EventDetailWindow = new EventDetailWindow();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventDetailWindow;
}