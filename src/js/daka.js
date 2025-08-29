// Check in管理器，风格参考Notes功能
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
        this.elements.dakaList = document.getElementById('daka-List');
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
        const dateText = createDate.toLocaleDateString('en-US');
        const contentPreview = daka.content.replace(/<[^>]*>/g, '').substring(0, 150);
        const tagsHTML = daka.tags && daka.tags.length > 0
            ? daka.tags.map(tag => `<span class="daka-tag">${tag}</span>`).join('')
            : '';
        // 统计Check in
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        const totalCount = punchRecords.length;
        // 统计Check in天数（去重日期）
        const uniqueDays = new Set(punchRecords.map(r => r.date)).size;
        // 判断今日是否可Check in
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
        // 卡片Content
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
                <span>累计Check in：<b>${totalCount}</b> times</span>
                <span style="margin-left:16px;">总天数：<b>${uniqueDays}</b> 天</span>
            </div>
            <div class="daka-actions">
                <button class="daka-action-btn punch" ${hasToday ? 'disabled' : ''} title="${hasToday ? '今日已Check in' : '点击Check in'}">${hasToday ? '已Check in' : '今日Check in'}</button>
                <button class="daka-action-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="daka-action-btn share" title="Share"><i class="fas fa-share-alt"></i></button>
                <button class="daka-action-btn delete" title="Delet"><i class="fas fa-trash"></i></button>
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
                // 新增：弹出确认对话框
                if (confirm('确定要Delet本ItemCheck in吗？')) {
                    this.deleteDaka(daka.id);
                }
            });
            card.addEventListener('click', (e) => {
                // 避免点击按钮时也触发详情
                if (e.target.closest('.daka-action-btn')) return;
                this.showDetailModal(daka);
            });
        } else {
            // Batch Select模式，显示复选框
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
        // Batch Select逻辑可后续补充
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
                    <h3>${isEdit ? 'EditCheck in' : 'New Check in'}</h3>
                    <button class="daka-modal-close" id="daka-modal-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label for="daka-title">Title</label>
                        <input type="text" id="daka-title" class="daka-form-input" placeholder="Please enter the title" value="${daka ? this.escapeHtml(daka.title) : ''}">
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-repeat-type">Check in rules</label>
                        <select id="daka-repeat-type" class="daka-form-input">
                            <option value="daily" ${!daka||daka.repeatType==='daily'?'selected':''}>Everyday</option>
                            <option value="monthly" ${daka&&daka.repeatType==='monthly'?'selected':''}>Everymonth</option>
                            <option value="yearly" ${daka&&daka.repeatType==='yearly'?'selected':''}>Everyyear</option>
                        </select>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-time-range">Check in scheduled time range</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="datetime-local" id="daka-start-time" class="daka-form-input" style="flex:1;" value="${daka && daka.startTime ? daka.startTime : ''}">
                            <span style="color:#888;">-</span>
                            <input type="datetime-local" id="daka-end-time" class="daka-form-input" style="flex:1;" value="${daka && daka.endTime ? daka.endTime : ''}">
                        </div>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-content">Content</label>
                        <textarea id="daka-content" class="daka-form-textarea" placeholder="Please enter Check in content">${daka ? this.escapeHtml(daka.content) : ''}</textarea>
                    </div>
                    <div class="daka-form-group">
                        <label for="daka-tags">Label</label>
                        <input type="text" id="daka-tags" class="daka-form-input" placeholder="Please enter Label, separated by a comma" value="${daka && daka.tags ? daka.tags.join(', ') : ''}">
                    </div>
                </div>
                <div class="daka-modal-actions" style="display:flex;gap:12px;justify-content:flex-end;">
                    ${isEdit ? '<button class="daka-modal-btn danger" id="daka-clear-btn">Clear the Check in record</button>' : ''}
                    <button class="daka-modal-btn secondary" id="daka-cancel-btn">Cancel</button>
                    <button class="daka-modal-btn primary" id="daka-save-btn">Save</button>
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
                    // 修复：弹出确认对话框
                    if (confirm('Are you sure you want to Delet this ItemCheck in？')) {
                        this.deleteDaka(this.currentDaka.id);
                        closeModal();
                    }
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
            if (window.UIManager) UIManager.showNotification('请输入Check inTitle', 'warning');
            titleInput.focus();
            return;
        }
        if (!content) {
            if (window.UIManager) UIManager.showNotification('请输入Check inContent', 'warning');
            contentInput.focus();
            return;
        }
        // 允许不填写time范围
        // if (!startTime || !endTime) {
        //     if (window.UIManager) UIManager.showNotification('请SelectCheck intime范围', 'warning');
        //     startTimeInput.focus();
        //     return;
        // }
        if (startTime && endTime && startTime > endTime) {
            if (window.UIManager) UIManager.showNotification('开始time不能晚于结束time', 'warning');
            startTimeInput.focus();
            return;
        }
        const data = StorageManager.getData();
        if (!data.dakas) data.dakas = [];
        const now = new Date().toISOString();
        if (this.currentDaka) {
            // Edit
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
            // New
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
        if (window.UIManager) UIManager.showNotification('Check in保存成功', 'success');
    },
    deleteDaka(dakaId) {
        let data = StorageManager.getData();
        // 修复：真正Deletdaka
        data.dakas = (data.dakas || []).filter(d => d.id !== dakaId);
        StorageManager.saveData(data);
        this.loadDakas();
    },
    shareDaka(daka) {
        // 整理数据结构，兼容图片Share
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
            alert('图片Share功能未加载');
        }
    },
    searchDakas(keyword) {
        // TODO: Search功能
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
        if (!confirm('确定要Delet选medium的Check in吗？')) return;
        const data = StorageManager.getData();
        data.dakas = (data.dakas || []).filter(d => !this.selectedDakas.has(d.id));
        StorageManager.saveData(data);
        this.selectedDakas.clear();
        this.batchMode = false;
        this.updateBatchDeleteButton();
        this.loadDakas();
        if (window.UIManager) UIManager.showNotification('批量Delet成功', 'success');
    },
    showImportModal() {
        // Check in文本导入弹窗
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>Import Check in</h3>
                    <button class="daka-modal-close" id="daka-import-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>Format of each line: Title | Contents | Label (comma separated) | Start time | End time</label>
                        <textarea id="daka-import-text" class="daka-form-textarea" rows="8" placeholder="For example: \nMorning Run|Run Every Morning|Healthy, Exercise|2024-07-01T06:30|2024-07-01T07:00\nReading|Reading at Night|Study|2024-07-01T20:00|2024-07-01T21:00"></textarea>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="daka-import-cancel">Cancel</button>
                    <button class="daka-modal-btn primary" id="daka-import-confirm">Import</button>
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
                if (window.UIManager) UIManager.showNotification('Success', 'success');
            }
            closeModal();
        };
    },
    showEditModal() {
        // Check in文本Edit弹窗
        const data = StorageManager.getData();
        const dakas = Array.isArray(data.dakas) ? data.dakas : [];
        const lines = dakas.map(d => [d.title, d.content, (d.tags||[]).join(','), d.startTime||'', d.endTime||'', d.repeatType||'daily'].join(' | ')).join('\n');
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>Batch Edit Check in</h3>
                    <button class="daka-modal-close" id="daka-edit-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>Format of each line: Title | Contents | Label (comma separated) | Start time | End time | Check in rules</label>
                        <textarea id="daka-edit-text" class="daka-form-textarea" rows="10">${lines}</textarea>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn secondary" id="daka-edit-cancel">Cancel</button>
                    <button class="daka-modal-btn primary" id="daka-edit-confirm">Save</button>
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
        // 判断是否允许Check in
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
            if (window.UIManager) UIManager.showNotification('本周期已Check in', 'warning');
            return;
        }
        // 弹窗：仅Check in or 记录Content
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>今日Check in</h3>
                    <button class="daka-modal-close" id="daka-punch-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div style="margin-bottom:16px;">请SelectCheck in方式：</div>
                    <div style="display:flex;gap:12px;margin-bottom:18px;">
                        <button class="daka-modal-btn primary" id="daka-punch-simple">仅Check in</button>
                        <button class="daka-modal-btn secondary" id="daka-punch-detail">记录Content</button>
                    </div>
                    <div id="daka-punch-detail-area" style="display:none;">
                        <div class="daka-form-group">
                            <label>文字记录</label>
                            <textarea id="daka-punch-text" class="daka-form-textarea" placeholder="写点什么..." style="min-height:60px;"></textarea>
                        </div>
                        <div class="daka-form-group">
                            <label>上传图片/视频/文档</label>
                            <input type="file" id="daka-punch-file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt">
                            <div id="daka-punch-file-List" style="margin-top:8px;font-size:13px;color:#888;"></div>
                        </div>
                        <button class="daka-modal-btn primary" id="daka-punch-save">保存Check in</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        // Close
        const closeModal = () => modal.remove();
        modal.querySelector('#daka-punch-close').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        // 仅Check in
        modal.querySelector('#daka-punch-simple').onclick = () => {
            this.savePunchRecord(daka, { text: '', files: [] });
            closeModal();
        };
        // 记录Content
        modal.querySelector('#daka-punch-detail').onclick = () => {
            modal.querySelector('#daka-punch-detail-area').style.display = '';
        };
        // 文件SelectPreview
        const fileInput = modal.querySelector('#daka-punch-file');
        const fileListDiv = modal.querySelector('#daka-punch-file-List');
        // 新增：图片Preview和移除功能
        let selectedImages = [];
        function renderImagePreview() {
            fileListDiv.innerHTML = '';
            selectedImages.forEach((img, idx) => {
                const imgElem = document.createElement('img');
                imgElem.src = img.data;
                imgElem.style = 'width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;';
                imgElem.title = '点击移除';
                imgElem.onclick = () => {
                    selectedImages.splice(idx, 1);
                    renderImagePreview();
                };
                fileListDiv.appendChild(imgElem);
            });
        }
        fileInput.onchange = () => {
            const files = Array.from(fileInput.files);
            files.forEach(f => {
                if (f.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        selectedImages.push({ name: f.name, type: f.type, size: f.size, data: e.target.result });
                        renderImagePreview();
                    };
                    reader.readAsDataURL(f);
                }
            });
            // 清空input，允许RepeatSelect同一图片
            fileInput.value = '';
        };
        // 保存Check in（带Content/附件）
        modal.querySelector('#daka-punch-save').onclick = async () => {
            const text = modal.querySelector('#daka-punch-text').value.trim();
            // 只保存已选图片
            this.savePunchRecord(daka, { text, files: selectedImages });
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
            if (window.UIManager) UIManager.showNotification('Check in成功', 'success');
        }
        StorageManager.addPoints(20, 'Check in', '每日Check in成功');
    },
    clearPunchRecords(dakaId) {
        const data = StorageManager.getData();
        const idx = data.dakas.findIndex(d => d.id === dakaId);
        if (idx !== -1) {
            data.dakas[idx].punchRecords = [];
            data.dakas[idx].updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadDakas();
            if (window.UIManager) UIManager.showNotification('Check in记录已Purge', 'success');
        }
    },
    showDetailModal(daka) {
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        // Check in记录Content
        let punchHtml = '';
        const punchRecords = Array.isArray(daka.punchRecords) ? daka.punchRecords : [];
        if (punchRecords.length === 0) {
            punchHtml = '<div style="color:#888;">暂EmptyCheck in记录</div>';
        } else {
            punchHtml = `<ul class='daka-detail-punch-List'>` + punchRecords.map((r, i) => `
                <li class='daka-detail-punch-item'>
                    <div class='daka-detail-punch-date'><i class="fas fa-calendar-check"></i>${r.date}</div>
                    ${r.text ? `<div class='daka-detail-punch-text'>${this.escapeHtml(r.text)}</div>` : ''}
                    ${r.files && r.files.length ? `<div class='daka-detail-punch-attachments'>${r.files.map((f, idx) => f.type && f.type.startsWith('image/') && f.data ? `<img src='${f.data}' alt='${this.escapeHtml(f.name)}' class='daka-detail-punch-img' style='max-width:80px;max-height:80px;border-radius:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;margin-right:6px;' data-preview-idx='${i}_${idx}' />` : '').join('')}</div>` : ''}
                    <button class='daka-punch-edit-btn' data-punch-idx='${i}' style='margin-top:6px;font-size:12px;padding:2px 10px;border-radius:6px;background:#e3f0ff;color:#4285f4;border:none;cursor:pointer;'>Edit</button>
                </li>
            `).join('') + `</ul>`;
        }
        // 预定time显示逻辑
        let timeRangeHtml = '';
        if (daka.startTime || daka.endTime) {
            timeRangeHtml = `<div style="margin-bottom:8px;color:#888;font-size:13px;">预定time：${daka.startTime ? daka.startTime.replace('T',' ') : '--'} - ${daka.endTime ? daka.endTime.replace('T',' ') : '--'}</div>`;
        }
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>Check in详情</h3>
                    <button class="daka-modal-close" id="daka-detail-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div style="font-size:18px;font-weight:600;margin-bottom:8px;">${this.escapeHtml(daka.title)}</div>
                    <div style="color:#666;font-size:14px;margin-bottom:8px;">${this.escapeHtml(daka.content)}</div>
                    <div style="margin-bottom:8px;">
                        <span style="color:#888;font-size:13px;">Label：</span>
                        ${(daka.tags||[]).map(tag=>`<span style=\"background:#e3f0ff;color:#4285f4;padding:2px 8px;border-radius:4px;margin-right:6px;font-size:12px;\">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    ${timeRangeHtml}
                    <div style="margin:12px 0 4px 0;font-weight:500;">Check in记录：</div>
                    <div style="max-height:220px;overflow-y:auto;">${punchHtml}</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        modal.querySelector('#daka-detail-close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        // 绑定图片点击Preview
        modal.querySelectorAll('.daka-detail-punch-img').forEach(img => {
            img.onclick = (e) => {
                e.stopPropagation();
                this.previewImage(img.src);
            };
        });
        // 绑定每条Check in记录的Edit按钮
        modal.querySelectorAll('.daka-punch-edit-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-punch-idx'));
                this.showEditPunchModal(daka, idx, modal);
            };
        });
    },
    // 新增：Edit单条Check in记录（文字+多图）
    showEditPunchModal(daka, punchIdx, parentModal) {
        const punch = (Array.isArray(daka.punchRecords) ? daka.punchRecords : [])[punchIdx];
        if (!punch) return;
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        // Copy图片数据
        let selectedImages = Array.isArray(punch.files) ? punch.files.map(f => ({...f})) : [];
        modal.innerHTML = `
            <div class="daka-modal-content">
                <div class="daka-modal-header">
                    <h3>EditCheck in记录</h3>
                    <button class="daka-modal-close" id="daka-edit-punch-close">&times;</button>
                </div>
                <div class="daka-modal-body">
                    <div class="daka-form-group">
                        <label>文字记录</label>
                        <textarea id="daka-edit-punch-text" class="daka-form-textarea" style="min-height:60px;">${this.escapeHtml(punch.text||'')}</textarea>
                    </div>
                    <div class="daka-form-group">
                        <label>上传照片</label>
                        <input type="file" id="daka-edit-punch-file" multiple accept="image/*">
                        <div id="daka-edit-punch-file-List" style="margin-top:8px;font-size:13px;color:#888;display:flex;gap:8px;flex-wrap:wrap;"></div>
                    </div>
                </div>
                <div class="daka-modal-actions">
                    <button class="daka-modal-btn danger" id="daka-edit-punch-delete">Delet</button>
                    <button class="daka-modal-btn secondary" id="daka-edit-punch-cancel">取消</button>
                    <button class="daka-modal-btn primary" id="daka-edit-punch-save">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        // Close
        const closeModal = () => modal.remove();
        modal.querySelector('#daka-edit-punch-close').onclick = closeModal;
        modal.querySelector('#daka-edit-punch-cancel').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        // 图片Preview和移除
        const fileInput = modal.querySelector('#daka-edit-punch-file');
        const fileListDiv = modal.querySelector('#daka-edit-punch-file-List');
        function renderImagePreview() {
            fileListDiv.innerHTML = '';
            selectedImages.forEach((img, idx) => {
                const imgElem = document.createElement('img');
                imgElem.src = img.data;
                imgElem.style = 'width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:6px;box-shadow:0 1px 4px #ccc;cursor:pointer;';
                imgElem.title = '点击移除';
                imgElem.onclick = () => {
                    selectedImages.splice(idx, 1);
                    renderImagePreview();
                };
                fileListDiv.appendChild(imgElem);
            });
        }
        renderImagePreview();
        fileInput.onchange = () => {
            const files = Array.from(fileInput.files);
            files.forEach(f => {
                if (f.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        selectedImages.push({ name: f.name, type: f.type, size: f.size, data: e.target.result });
                        renderImagePreview();
                    };
                    reader.readAsDataURL(f);
                }
            });
            fileInput.value = '';
        };
        // 保存
        modal.querySelector('#daka-edit-punch-save').onclick = () => {
            const text = modal.querySelector('#daka-edit-punch-text').value.trim();
            // 更新数据
            const data = StorageManager.getData();
            const dakaIdx = data.dakas.findIndex(item => item.id === daka.id);
            if (dakaIdx !== -1 && Array.isArray(data.dakas[dakaIdx].punchRecords)) {
                data.dakas[dakaIdx].punchRecords[punchIdx].text = text;
                data.dakas[dakaIdx].punchRecords[punchIdx].files = selectedImages;
                data.dakas[dakaIdx].updateTime = new Date().toISOString();
                StorageManager.saveData(data);
                this.loadDakas();
                if (window.UIManager) UIManager.showNotification('Check in记录已更新', 'success');
            }
            closeModal();
            if (parentModal) parentModal.remove(); // Close详情，刷新
        };
        // Delet
        modal.querySelector('#daka-edit-punch-delete').onclick = () => {
            if (!confirm('确定要Delet本条Check in记录吗？此操作不可恢复。')) return;
            const data = StorageManager.getData();
            const dakaIdx = data.dakas.findIndex(item => item.id === daka.id);
            if (dakaIdx !== -1 && Array.isArray(data.dakas[dakaIdx].punchRecords)) {
                data.dakas[dakaIdx].punchRecords.splice(punchIdx, 1);
                data.dakas[dakaIdx].updateTime = new Date().toISOString();
                StorageManager.saveData(data);
                this.loadDakas();
                if (window.UIManager) UIManager.showNotification('Check in记录已Delet', 'success');
            }
            closeModal();
            if (parentModal) parentModal.remove(); // Close详情，刷新
        };
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
        // 大图Preview弹窗，带保存和Copy图标按钮
        const modal = document.createElement('div');
        modal.className = 'daka-modal';
        modal.innerHTML = `
            <div class='daka-modal-content' style='background:transparent;box-shadow:none;display:flex;align-items:center;justify-content:center;min-height:300px;position:relative;'>
                <img src='${src}' style='max-width:90vw;max-height:80vh;border-radius:14px;box-shadow:0 4px 24px #3338;' />
                <div class='daka-img-toolbar' style='position:absolute;top:18px;right:24px;display:flex;gap:12px;z-index:2;'>
                    <button class='daka-img-btn' id='daka-img-save-btn' title='保存图片' style='background:rgba(255,255,255,0.92);border:none;border-radius:8px;padding:7px 14px;font-size:20px;color:#4285f4;box-shadow:0 2px 8px #4285f422;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;'><i class='fas fa-download'></i></button>
                    <button class='daka-img-btn' id='daka-img-copy-btn' title='Copy到剪贴板' style='background:rgba(255,255,255,0.92);border:none;border-radius:8px;padding:7px 14px;font-size:20px;color:#34a853;box-shadow:0 2px 8px #34a85322;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;'><i class='fas fa-copy'></i></button>
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
        // Copy图片到剪贴板
        modal.querySelector('#daka-img-copy-btn').onclick = async (e) => {
            e.stopPropagation();
            try {
                const data = await fetch(src).then(r => r.blob());
                await navigator.clipboard.write([
                    new window.ClipboardItem({ [data.type]: data })
                ]);
                if (window.UIManager) UIManager.showNotification('图片已Copy到剪贴板', 'success');
            } catch {
                if (window.UIManager) UIManager.showNotification('Copy失败，浏览器不支持或权限不足', 'warning');
            }
        };
    },
    openDocAttachment(f) {
        // 移除文档相关逻辑，不再支持文档Preview
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('daka')) {
        DakaManager.init();
    }
}); 