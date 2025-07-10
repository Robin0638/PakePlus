// 打卡管理器，风格参考笔记功能
const DakaManager = {
    elements: {
        dakaList: null,
        emptyMessage: null,
        searchInput: null,
        addBtn: null,
        batchToggleBtn: null,
        batchDeleteBtn: null,
        importBtn: null,
        editBtn: null
    },
    batchMode: false,
    selectedDakas: new Set(),
    currentDaka: null,

    init() {
        this.initElements();
        this.bindEvents();
        this.loadDakas();
    },
    initElements() {
        this.elements.dakaList = document.getElementById('daka-list');
        this.elements.emptyMessage = document.getElementById('empty-daka-message');
        this.elements.searchInput = document.getElementById('daka-search-input');
        this.elements.addBtn = document.getElementById('add-daka-btn');
        this.elements.batchToggleBtn = document.getElementById('toggle-daka-batch-mode-btn');
        this.elements.batchDeleteBtn = document.getElementById('daka-batch-delete-btn');
        this.elements.importBtn = document.getElementById('import-daka-text-btn');
        this.elements.editBtn = document.getElementById('edit-daka-text-btn');
    },
    bindEvents() {
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.showModal());
        }
        if (this.elements.batchToggleBtn) {
            this.elements.batchToggleBtn.addEventListener('click', () => this.toggleBatchMode());
        }
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.addEventListener('click', () => this.batchDelete());
        }
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.searchDakas(e.target.value));
        }
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => this.showImportModal());
        }
        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.showEditModal());
        }
        window.addEventListener('storage', (e) => {
            if (e.key === 'appData') {
                this.loadDakas();
            }
        });
    },
    loadDakas() {
        const data = StorageManager.getData();
        const dakas = data.dakas || [];
        if (dakas.length === 0) {
            this.elements.dakaList.style.display = 'none';
            this.elements.emptyMessage.style.display = 'block';
            return;
        }
        this.elements.dakaList.style.display = 'grid';
        this.elements.emptyMessage.style.display = 'none';
        this.elements.dakaList.innerHTML = '';
        dakas.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        dakas.forEach(daka => {
            const card = this.createDakaCard(daka);
            this.elements.dakaList.appendChild(card);
        });
        if (this.batchMode) {
            this.updateSelectAllButton();
        }
    },
    createDakaCard(daka) {
        const card = document.createElement('div');
        card.className = 'daka-card';
        card.setAttribute('data-daka-id', daka.id);
        const createDate = new Date(daka.createTime);
        const dateText = createDate.toLocaleDateString('zh-CN');
        const contentPreview = daka.content.replace(/<[^>]*>/g, '').substring(0, 150);
        const tagsHTML = daka.tags && daka.tags.length > 0
            ? daka.tags.map(tag => `<span class="daka-tag">${tag}</span>`).join('')
            : '';
        // 统计打卡
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        const totalCount = punchRecords.length;
        // 统计打卡天数（去重日期）
        const uniqueDays = new Set(punchRecords.map(r => r.date)).size;
        // 判断今日是否可打卡
        let hasToday = false;
        const today = new Date();
        if (daka.repeatType === 'yearly') {
            const ymd = today.toISOString().slice(5, 10); // MM-DD
            hasToday = punchRecords.some(r => (r.date||'').slice(5,10) === ymd);
        } else if (daka.repeatType === 'monthly') {
            const md = today.toISOString().slice(8, 10); // DD
            hasToday = punchRecords.some(r => (r.date||'').slice(8,10) === md && (r.date||'').slice(0,7) === today.toISOString().slice(0,7));
        } else {
            // 默认每天
            const todayStr = today.toISOString().slice(0, 10);
            hasToday = punchRecords.some(r => r.date === todayStr);
        }
        // 卡片内容
        card.innerHTML = `
            <div class="daka-checkbox"></div>
            <div class="daka-title">${this.escapeHtml(daka.title)}</div>
            <div class="daka-content-preview">${this.escapeHtml(contentPreview)}</div>
            <div class="daka-meta">
                <div class="daka-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${dateText}</span>
                </div>
                <div class="daka-tags">${tagsHTML}</div>
            </div>
            <div class="daka-stats">
                <span>累计打卡：<b>${totalCount}</b> 次</span>
                <span style="margin-left:16px;">总天数：<b>${uniqueDays}</b> 天</span>
            </div>
            <div class="daka-actions">
                <button class="daka-action-btn punch" ${hasToday ? 'disabled' : ''} title="${hasToday ? '今日已打卡' : '点击打卡'}">${hasToday ? '已打卡' : '今日打卡'}</button>
                <button class="daka-action-btn edit" title="编辑"><i class="fas fa-edit"></i></button>
                <button class="daka-action-btn share" title="分享"><i class="fas fa-share-alt"></i></button>
                <button class="daka-action-btn delete" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        `;
        if (!this.batchMode) {
            const punchBtn = card.querySelector('.punch');
            const editBtn = card.querySelector('.edit');
            const shareBtn = card.querySelector('.share');
            const deleteBtn = card.querySelector('.delete');
            if (punchBtn && !hasToday) {
                punchBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handlePunch(daka);
                });
            }
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModal(daka);
            });
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareDaka(daka);
            });
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteDaka(daka.id);
            });
            card.addEventListener('click', (e) => {
                // 避免点击按钮时也触发详情
                if (e.target.closest('.daka-action-btn')) return;
                this.showDetailModal(daka);
            });
        } else {
            // 批量选择模式，显示复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'daka-checkbox-input';
            checkbox.checked = this.selectedDakas.has(daka.id);
            checkbox.onclick = (e) => {
                e.stopPropagation();
                this.toggleDakaSelection(daka.id, checkbox.checked);
            };
            card.querySelector('.daka-checkbox').appendChild(checkbox);
            card.onclick = (e) => {
                if (e.target === checkbox) return;
                checkbox.checked = !checkbox.checked;
                this.toggleDakaSelection(daka.id, checkbox.checked);
            };
            if (this.selectedDakas.has(daka.id)) card.classList.add('selected');
        }
        // 批量选择逻辑可后续补充
        return card;
    },
    showModal(daka = null) {
        this.currentDaka = daka;
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.id = 'daka-modal';
        const isEdit = !!daka;
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>${isEdit ? '编辑打卡' : '新建打卡'}</h3>
                    <button class="daka-modal-close" id="daka-modal-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label for="daka-title">标题</label>
                        <input type="text" id="daka-title" class="daka-form-input" placeholder="请输入打卡标题" value="${daka ? this.escapeHtml(daka.title) : ''}">
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-repeat-type">打卡规则</label>
                        <select id="daka-repeat-type" class="daka-form-input">
                            <option value="daily" ${!daka||daka.repeatType==='daily'?'selected':''}>每天打卡</option>
                            <option value="monthly" ${daka&&daka.repeatType==='monthly'?'selected':''}>每月打卡</option>
                            <option value="yearly" ${daka&&daka.repeatType==='yearly'?'selected':''}>每年打卡</option>
                        </select>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-time-range">打卡预定时间范围</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="datetime-local" id="daka-start-time" class="daka-form-input" style="flex:1;" value="${daka && daka.startTime ? daka.startTime : ''}">
                            <span style="color:#888;">至</span>
                            <input type="datetime-local" id="daka-end-time" class="daka-form-input" style="flex:1;" value="${daka && daka.endTime ? daka.endTime : ''}">
                        </div>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-content">内容</label>
                        <textarea id="daka-content" class="daka-form-textarea" placeholder="请输入打卡内容">${daka ? this.escapeHtml(daka.content) : ''}</textarea>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-tags">标签</label>
                        <input type="text" id="daka-tags" class="daka-form-input" placeholder="请输入标签，用逗号分隔" value="${daka && daka.tags ? daka.tags.join(', ') : ''}">
                    </div>
                </div>
                <div class="daka-modal-actions" style="display:flex;gap:12px;justify-content:flex-end;">
                    ${isEdit ? '<button class="daka-modal-btn danger" id="daka-clear-btn">清除打卡记录</button>' : ''}
                    <button class="daka-modal-btn secondary" id="daka-cancel-btn">取消</button>
                    <button class="daka-modal-btn primary" id="daka-save-btn">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        this.bindModalEvents(modal);
        setTimeout(() => {
            document.getElementById('daka-title').focus();
        }, 100);
    },
    bindModalEvents(modal) {
        const closeBtn = modal.querySelector('#daka-modal-close');
        const cancelBtn = modal.querySelector('#daka-cancel-btn');
        const saveBtn = modal.querySelector('#daka-save-btn');
        const deleteBtn = modal.querySelector('#daka-delete-btn');
        const clearBtn = modal.querySelector('#daka-clear-btn');
        const repeatTypeInput = modal.querySelector('#daka-repeat-type');
        const closeModal = () => {
            modal.remove();
            this.currentDaka = null;
        };
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        saveBtn.addEventListener('click', () => {
            this.saveDaka(modal);
        });
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.currentDaka) {
                    this.deleteDaka(this.currentDaka.id);
                    closeModal();
                }
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (this.currentDaka) {
                    this.clearPunchRecords(this.currentDaka.id);
                    closeModal();
                }
            });
        }
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.saveDaka(modal);
            }
        });
    },
    saveDaka(modal) {
        const titleInput = modal.querySelector('#daka-title');
        const contentInput = modal.querySelector('#daka-content');
        const tagsInput = modal.querySelector('#daka-tags');
        const startTimeInput = modal.querySelector('#daka-start-time');
        const endTimeInput = modal.querySelector('#daka-end-time');
        const repeatTypeInput = modal.querySelector('#daka-repeat-type');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const repeatType = repeatTypeInput ? repeatTypeInput.value : 'daily';
        if (!title) {
            if (window.UIManager) UIManager.showNotification('请输入打卡标题', 'warning');
            titleInput.focus();
            return;
        }
        if (!content) {
            if (window.UIManager) UIManager.showNotification('请输入打卡内容', 'warning');
            contentInput.focus();
            return;
        }
        // 允许不填写时间范围
        // if (!startTime || !endTime) {
        //     if (window.UIManager) UIManager.showNotification('请选择打卡时间范围', 'warning');
        //     startTimeInput.focus();
        //     return;
        // }
        if (startTime && endTime && startTime > endTime) {
            if (window.UIManager) UIManager.showNotification('开始时间不能晚于结束时间', 'warning');
            startTimeInput.focus();
            return;
        }
        const data = StorageManager.getData();
        if (!data.dakas) data.dakas = [];
        const now = new Date().toISOString();
        if (this.currentDaka) {
            // 编辑
            const idx = data.dakas.findIndex(d => d.id === this.currentDaka.id);
            if (idx !== -1) {
                data.dakas[idx] = {
                    ...this.currentDaka,
                    title,
                    content,
                    tags,
                    startTime,
                    endTime,
                    repeatType,
                    updateTime: now
                };
            }
        } else {
            // 新建
            const newDaka = {
                id: this.generateId(),
                title,
                content,
                tags,
                startTime,
                endTime,
                repeatType,
                createTime: now,
                updateTime: now,
                punchRecords: []
            };
            data.dakas.push(newDaka);
        }
        StorageManager.saveData(data);
        this.loadDakas();
        if (window.QuickNavManager) QuickNavManager.updateCounts();
        modal.remove();
        this.currentDaka = null;
        if (window.UIManager) UIManager.showNotification('打卡保存成功', 'success');
    },
    deleteDaka(dakaId) {
        let data = StorageManager.getData();
        data.dakas = (data.dakas || []).filter(d => d.id !== dakaId);
        StorageManager.setData(data);
        this.loadDakas();
    },
    shareDaka(daka) {
        // 整理数据结构，兼容图片分享
        const dakaData = {
            title: daka.title,
            content: daka.content,
            tags: daka.tags,
            punchRecords: (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).map(r => ({
                date: r.date,
                text: r.text,
                files: (r.files||[]).map(f => ({
                    name: f.name,
                    type: f.type,
                    data: f.data // base64图片
                }))
            }))
        };
        if (window.showShareDakaImageModal) {
            window.showShareDakaImageModal(dakaData);
        } else {
            alert('图片分享功能未加载');
        }
    },
    searchDakas(keyword) {
        // TODO: 搜索功能
        this.loadDakas();
    },
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        if (!this.batchMode) this.selectedDakas.clear();
        this.updateBatchDeleteButton();
        this.loadDakas();
    },
    toggleDakaSelection(dakaId, checked) {
        if (checked) this.selectedDakas.add(dakaId);
        else this.selectedDakas.delete(dakaId);
        this.updateBatchDeleteButton();
        this.loadDakas();
    },
    updateBatchDeleteButton() {
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.style.display = this.batchMode && this.selectedDakas.size > 0 ? '' : 'none';
        }
    },
    batchDelete() {
        if (!this.batchMode || this.selectedDakas.size === 0) return;
        if (!confirm('确定要删除选中的打卡吗？')) return;
        const data = StorageManager.getData();
        data.dakas = (data.dakas || []).filter(d => !this.selectedDakas.has(d.id));
        StorageManager.saveData(data);
        this.selectedDakas.clear();
        this.batchMode = false;
        this.updateBatchDeleteButton();
        this.loadDakas();
        if (window.UIManager) UIManager.showNotification('批量删除成功', 'success');
    },
    showImportModal() {
        // 打卡文本导入弹窗
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>导入打卡</h3>
                    <button class="daka-modal-close" id="daka-import-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>每行格式：标题 | 内容 | 标签（逗号分隔） | 开始时间 | 结束时间</label>
                        <textarea id="daka-import-text" class="daka-form-textarea" rows="8" placeholder="例如：\n晨跑|每天早上跑步|健康,运动|2024-07-01T06:30|2024-07-01T07:00\n读书|晚上读书|学习|2024-07-01T20:00|2024-07-01T21:00"></textarea>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="daka-import-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="daka-import-confirm">导入</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        const closeModal = () => modal.remove();
        modal.querySelector('#daka-import-close').onclick = closeModal;
        modal.querySelector('#daka-import-cancel').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        modal.querySelector('#daka-import-confirm').onclick = () => {
            const text = modal.querySelector('#daka-import-text').value.trim();
            if (!text) return closeModal();
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            const now = new Date().toISOString();
            const newDakas = lines.map(line => {
                const parts = line.split('|').map(s => s.trim());
                return {
                    id: this.generateId(),
                    title: parts[0] || '',
                    content: parts[1] || '',
                    tags: parts[2] ? parts[2].split(',').map(t => t.trim()).filter(t => t) : [],
                    startTime: parts[3] || '',
                    endTime: parts[4] || '',
                    createTime: now,
                    updateTime: now,
                    punchRecords: []
                };
            }).filter(d => d.title);
            if (newDakas.length) {
                const data = StorageManager.getData();
                if (!data.dakas) data.dakas = [];
                data.dakas = data.dakas.concat(newDakas);
                StorageManager.saveData(data);
                this.loadDakas();
                if (window.UIManager) UIManager.showNotification('导入成功', 'success');
            }
            closeModal();
        };
    },
    showEditModal() {
        // 打卡文本编辑弹窗
        const data = StorageManager.getData();
        const dakas = Array.isArray(data.dakas) ? data.dakas : [];
        const lines = dakas.map(d => [d.title, d.content, (d.tags||[]).join(','), d.startTime||'', d.endTime||'', d.repeatType||'daily'].join(' | ')).join('\n');
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>批量编辑打卡</h3>
                    <button class="daka-modal-close" id="daka-edit-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>每行格式：标题 | 内容 | 标签（逗号分隔） | 开始时间 | 结束时间 | 打卡规则</label>
                        <textarea id="daka-edit-text" class="daka-form-textarea" rows="10">${lines}</textarea>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="daka-edit-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="daka-edit-confirm">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        const closeModal = () => modal.remove();
        modal.querySelector('#daka-edit-close').onclick = closeModal;
        modal.querySelector('#daka-edit-cancel').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        modal.querySelector('#daka-edit-confirm').onclick = () => {
            const text = modal.querySelector('#daka-edit-text').value.trim();
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            const now = new Date().toISOString();
            const newDakas = lines.map(line => {
                const parts = line.split('|').map(s => s.trim());
                return {
                    id: this.generateId(),
                    title: parts[0] || '',
                    content: parts[1] || '',
                    tags: parts[2] ? parts[2].split(',').map(t => t.trim()).filter(t => t) : [],
                    startTime: parts[3] || '',
                    endTime: parts[4] || '',
                    repeatType: parts[5] || 'daily',
                    createTime: now,
                    updateTime: now,
                    punchRecords: []
                };
            }).filter(d => d.title);
            if (Array.isArray(data.dakas)) data.dakas = newDakas;
            else data.dakas = newDakas;
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('保存成功', 'success');
            closeModal();
        };
    },
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, function (c) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
        });
    },
    generateId() {
        return 'daka_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    },
    handlePunch(daka) {
        // 判断是否允许打卡
        const today = new Date();
        let alreadyPunched = false;
        if (daka.repeatType === 'yearly') {
            const ymd = today.toISOString().slice(5, 10);
            alreadyPunched = (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).some(r => (r.date||'').slice(5,10) === ymd);
        } else if (daka.repeatType === 'monthly') {
            const md = today.toISOString().slice(8, 10);
            alreadyPunched = (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).some(r => (r.date||'').slice(8,10) === md && (r.date||'').slice(0,7) === today.toISOString().slice(0,7));
        } else {
            const todayStr = today.toISOString().slice(0, 10);
            alreadyPunched = (Array.isArray(daka.punchRecords) ? daka.punchRecords : []).some(r => r.date === todayStr);
        }
        if (alreadyPunched) {
            if (window.UIManager) UIManager.showNotification('本周期已打卡', 'warning');
            return;
        }
        // 弹窗：仅打卡 or 记录内容
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>今日打卡</h3>
                    <button class="daka-modal-close" id="daka-punch-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div style="margin-bottom:16px;">请选择打卡方式：</div>
                    <div style="display:flex;gap:12px;margin-bottom:18px;">
                        <button class="daka-modal-btn primary" id="daka-punch-simple">仅打卡</button>
                        <button class="daka-modal-btn secondary" id="daka-punch-detail">记录内容</button>
                    </div>
                    <div id="daka-punch-detail-area" style="display:none;">
                        <div class="daka-form-group">
                            <label>文字记录</label>
                            <textarea id="daka-punch-text" class="daka-form-textarea" placeholder="写点什么..." style="min-height:60px;"></textarea>
                        </div>
                        <div class="daka-form-group">
                            <label>上传图片/视频/文档</label>
                            <input type="file" id="daka-punch-file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt">
                            <div id="daka-punch-file-list" style="margin-top:8px;font-size:13px;color:#888;"></div>
                        </div>
                        <button class="daka-modal-btn primary" id="daka-punch-save">保存打卡</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        // 关闭
        const closeModal = () => modal.remove();
        modal.querySelector('#daka-punch-close').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        // 仅打卡
        modal.querySelector('#daka-punch-simple').onclick = () => {
            this.savePunchRecord(daka, { text: '', files: [] });
            closeModal();
        };
        // 记录内容
        modal.querySelector('#daka-punch-detail').onclick = () => {
            modal.querySelector('#daka-punch-detail-area').style.display = '';
        };
        // 文件选择预览
        const fileInput = modal.querySelector('#daka-punch-file');
        const fileListDiv = modal.querySelector('#daka-punch-file-list');
        fileInput.onchange = () => {
            const files = Array.from(fileInput.files);
            fileListDiv.innerHTML = files.map(f => `<div>${f.name}</div>`).join('');
        };
        // 保存打卡（带内容/附件）
        modal.querySelector('#daka-punch-save').onclick = async () => {
            const text = modal.querySelector('#daka-punch-text').value.trim();
            const files = Array.from(fileInput.files);
            // 只允许图片，转base64
            const fileInfos = await Promise.all(files.map(async f => {
                if (f.type.startsWith('image/')) {
                    return new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = e => resolve({ name: f.name, type: f.type, size: f.size, data: e.target.result });
                        reader.readAsDataURL(f);
                    });
                } else {
                    return null;
                }
            }));
            this.savePunchRecord(daka, { text, files: fileInfos.filter(Boolean) });
            closeModal();
        };
    },
    savePunchRecord(daka, { text, files }) {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        if (punchRecords.some(r => r.date === todayStr)) return;
        punchRecords.push({
            date: todayStr,
            startTime: daka.startTime || '',
            endTime: daka.endTime || '',
            text,
            files
        });
        // 保存
        const data = StorageManager.getData();
        const idx = data.dakas.findIndex(item => item.id === daka.id);
        if (idx !== -1) {
            data.dakas[idx].punchRecords = punchRecords;
            data.dakas[idx].updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('打卡成功', 'success');
        }
        StorageManager.addPoints(20, '打卡', '每日打卡成功');
    },
    clearPunchRecords(dakaId) {
        const data = StorageManager.getData();
        const idx = data.dakas.findIndex(d => d.id === dakaId);
        if (idx !== -1) {
            data.dakas[idx].punchRecords = [];
            data.dakas[idx].updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('打卡记录已清除', 'success');
        }
    },
    showDetailModal(daka) {
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        // 打卡记录内容
        let punchHtml = '';
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        if (punchRecords.length === 0) {
            punchHtml = '<div style="color:#888;">暂无打卡记录</div>';
        } else {
            punchHtml = `<ul class='daka-detail-punch-list'>` + punchRecords.map((r, i) => `
                <li class='daka-detail-punch-item'>
                    <div class='daka-detail-punch-date'><i class="fas fa-calendar-check"></i>${r.date}</div>
                    ${r.text ? `<div class='daka-detail-punch-text'>${this.escapeHtml(r.text)}</div>` : ''}
                    ${r.files && r.files.length ? `<div class='daka-detail-punch-attachments'>${r.files.map((f, idx) => f.type && f.type.startsWith('image/') && f.data ? `<img src='${f.data}' alt='${this.escapeHtml(f.name)}' class='daka-detail-punch-img' style='max-width:80px;max-height:80px;border-radius:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;margin-right:6px;' data-preview-idx='${i}_${idx}' />` : '').join('')}</div>` : ''}
                </li>
            `).join('') + `</ul>`;
        }
        // 预定时间显示逻辑
        let timeRangeHtml = '';
        if (daka.startTime || daka.endTime) {
            timeRangeHtml = `<div style="margin-bottom:8px;color:#888;font-size:13px;">预定时间：${daka.startTime ? daka.startTime.replace('T',' ') : '--'} 至 ${daka.endTime ? daka.endTime.replace('T',' ') : '--'}</div>`;
        }
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>打卡详情</h3>
                    <button class="daka-modal-close" id="daka-detail-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div style="font-size:18px;font-weight:600;margin-bottom:8px;">${this.escapeHtml(daka.title)}</div>
                    <div style="color:#666;font-size:14px;margin-bottom:8px;">${this.escapeHtml(daka.content)}</div>
                    <div style="margin-bottom:8px;">
                        <span style="color:#888;font-size:13px;">标签：</span>
                        ${(daka.tags||[]).map(tag=>`<span style=\"background:#e3f0ff;color:#4285f4;padding:2px 8px;border-radius:4px;margin-right:6px;font-size:12px;\">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    ${timeRangeHtml}
                    <div style="margin:12px 0 4px 0;font-weight:500;">打卡记录：</div>
                    <div style="max-height:220px;overflow-y:auto;">${punchHtml}</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        modal.querySelector('#daka-detail-close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        // 绑定图片点击预览
        modal.querySelectorAll('.daka-detail-punch-img').forEach(img => {
            img.onclick = (e) => {
                e.stopPropagation();
                this.previewImage(img.src);
            };
        });
    },
    getFileIconHtml(type) {
        if (!type) return '<i class="fas fa-file"></i>';
        if (type.startsWith('image/')) return '<i class="fas fa-file-image"></i>';
        if (type.startsWith('video/')) return '<i class="fas fa-file-video"></i>';
        if (type.includes('pdf')) return '<i class="fas fa-file-pdf"></i>';
        if (type.includes('word') || type.includes('doc')) return '<i class="fas fa-file-word"></i>';
        if (type.includes('excel') || type.includes('sheet')) return '<i class="fas fa-file-excel"></i>';
        if (type.includes('ppt')) return '<i class="fas fa-file-powerpoint"></i>';
        if (type.includes('text')) return '<i class="fas fa-file-alt"></i>';
        return '<i class="fas fa-file"></i>';
    },
    previewImage(src) {
        // 大图预览弹窗，带保存和复制图标按钮
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class='daka-modal-content' style='background:transparent;box-shadow:none;display:flex;align-items:center;justify-content:center;min-height:300px;position:relative;'>
                <img src='${src}' style='max-width:90vw;max-height:80vh;border-radius:14px;box-shadow:0 4px 24px #3338;' />
                <div class='daka-img-toolbar' style='position:absolute;top:18px;right:24px;display:flex;gap:12px;z-index:2;'>
                    <button class='daka-img-btn' id='daka-img-save-btn' title='保存图片' style='background:rgba(255,255,255,0.92);border:none;border-radius:8px;padding:7px 14px;font-size:20px;color:#4285f4;box-shadow:0 2px 8px #4285f422;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;'><i class='fas fa-download'></i></button>
                    <button class='daka-img-btn' id='daka-img-copy-btn' title='复制到剪贴板' style='background:rgba(255,255,255,0.92);border:none;border-radius:8px;padding:7px 14px;font-size:20px;color:#34a853;box-shadow:0 2px 8px #34a85322;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;'><i class='fas fa-copy'></i></button>
                    <button class='daka-modal-close' style='background:rgba(0,0,0,0.45);border:none;border-radius:8px;padding:7px 14px;font-size:22px;color:#fff;box-shadow:0 2px 8px #0002;cursor:pointer;margin-left:8px;display:flex;align-items:center;justify-content:center;'><i class='fas fa-times'></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        modal.onclick = () => modal.remove();
        modal.querySelector('.daka-modal-close').onclick = (e) => { e.stopPropagation(); modal.remove(); };
        // 保存图片
        modal.querySelector('#daka-img-save-btn').onclick = (e) => {
            e.stopPropagation();
            const a = document.createElement('a');
            a.href = src;
            a.download = 'daka-photo.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        // 复制图片到剪贴板
        modal.querySelector('#daka-img-copy-btn').onclick = async (e) => {
            e.stopPropagation();
            try {
                const data = await fetch(src).then(r => r.blob());
                await navigator.clipboard.write([
                    new window.ClipboardItem({ [data.type]: data })
                ]);
                if (window.UIManager) UIManager.showNotification('图片已复制到剪贴板', 'success');
            } catch {
                if (window.UIManager) UIManager.showNotification('复制失败，浏览器不支持或权限不足', 'warning');
            }
        };
    },
    openDocAttachment(f) {
        // 移除文档相关逻辑，不再支持文档预览
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('daka')) {
        DakaManager.init();
    }
}); 