/**
 * 笔记管理器
 * 负责笔记的增删改查、搜索、批量操作等功能
 */
const NotesManager = {
    // DOM元素
    elements: {
        notesList: null,
        emptyMessage: null,
        searchInput: null,
        addBtn: null,
        batchToggleBtn: null,
        batchDeleteBtn: null,
        importBtn: null,
        editBtn: null
    },

    // 状态
    batchMode: false,
    selectedNotes: new Set(),
    currentNote: null,

    /**
     * 初始化笔记管理器
     */
    init() {
        console.log('初始化笔记管理器...');
        
        try {
            this.initElements();
            this.bindEvents();
            this.loadNotes();
            
            console.log('笔记管理器初始化完成');
        } catch (error) {
            console.error('笔记管理器初始化失败:', error);
        }
    },

    /**
     * 初始化DOM元素
     */
    initElements() {
        this.elements.notesList = document.getElementById('notes-list');
        this.elements.emptyMessage = document.getElementById('empty-notes-message');
        this.elements.searchInput = document.getElementById('notes-search-input');
        this.elements.addBtn = document.getElementById('add-note-btn');
        this.elements.batchToggleBtn = document.getElementById('toggle-notes-batch-mode-btn');
        this.elements.batchDeleteBtn = document.getElementById('notes-batch-delete-btn');
        this.elements.importBtn = document.getElementById('import-notes-text-btn');
        this.elements.editBtn = document.getElementById('edit-notes-text-btn');

        if (!this.elements.notesList || !this.elements.emptyMessage) {
            throw new Error('找不到笔记列表容器');
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 新建笔记
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.showModal());
        }

        // 批量模式切换
        if (this.elements.batchToggleBtn) {
            this.elements.batchToggleBtn.addEventListener('click', () => this.toggleBatchMode());
        }

        // 批量删除
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.addEventListener('click', () => this.batchDelete());
        }

        // 搜索
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        }

        // 文本导入
        if (this.elements.importBtn) {
            this.elements.importBtn.addEventListener('click', () => this.showImportModal());
        }

        // 文件导入
        const fileImportBtn = document.getElementById('import-notes-file-btn');
        if (fileImportBtn) {
            fileImportBtn.addEventListener('click', () => this.showFileImportModal());
        }

        // 文本编辑
        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.showEditModal());
        }

        // 监听数据变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'appData') {
                this.loadNotes();
            }
        });
    },

    /**
     * 加载所有笔记
     */
    loadNotes() {
        const data = StorageManager.getData();
        const notes = data.notes || [];
        
        if (notes.length === 0) {
            this.elements.notesList.style.display = 'none';
            this.elements.emptyMessage.style.display = 'block';
            return;
        }
        
        this.elements.notesList.style.display = 'grid';
        this.elements.emptyMessage.style.display = 'none';
        
        // 清空列表
        this.elements.notesList.innerHTML = '';
        
        // 收藏优先，时间倒序
        notes.sort((a, b) => {
            if ((b.starred ? 1 : 0) !== (a.starred ? 1 : 0)) {
                return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            }
            return new Date(b.createTime) - new Date(a.createTime);
        });
        
        // 添加笔记卡片
        notes.forEach(note => {
            const card = this.createNoteCard(note);
            this.elements.notesList.appendChild(card);
        });
        
        // 如果是批量模式，更新全选按钮状态
        if (this.batchMode) {
            this.updateSelectAllButton();
        }
    },

    /**
     * 创建笔记卡片
     */
    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-note-id', note.id);
        
        // 格式化日期
        const createDate = new Date(note.createTime);
        const updateDate = note.updateTime ? new Date(note.updateTime) : createDate;
        const dateText = updateDate.toLocaleDateString('zh-CN');
        
        // 内容预览（去除HTML标签）
        const contentPreview = note.content.replace(/<[^>]*>/g, '').substring(0, 150);
        
        // 标签HTML
        const tagsHTML = note.tags && note.tags.length > 0 
            ? note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')
            : '';
        
        card.innerHTML = `
            <div class="note-checkbox"></div>
            <button class="note-star${note.starred ? ' active' : ''}" title="${note.starred ? '取消收藏' : '收藏'}"><i class="fas fa-star"></i></button>
            <div class="note-title">${this.escapeHtml(note.title)}</div>
            <div class="note-content-preview">${this.escapeHtml(contentPreview)}</div>
            <div class="note-meta">
                <div class="note-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${dateText}</span>
                </div>
                <div class="note-tags">${tagsHTML}</div>
            </div>
            <div class="note-actions">
                <button class="note-action-btn edit" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="note-action-btn share" title="分享">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="note-action-btn delete" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // 绑定卡片事件
        if (!this.batchMode) {
            const editBtn = card.querySelector('.edit');
            const shareBtn = card.querySelector('.share');
            const deleteBtn = card.querySelector('.delete');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModal(note);
            });
            
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareNote(note);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(note.id);
            });
            
            // 点击卡片查看详情
            card.addEventListener('click', () => {
                this.showNoteDetail(note);
            });
        } else {
            // 批量模式下的选择功能
            const checkbox = card.querySelector('.note-checkbox');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNoteSelection(note.id, checkbox);
            });
        }
        
        // 收藏按钮事件
        const starBtn = card.querySelector('.note-star');
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStar(note.id);
        });
        
        return card;
    },

    /**
     * 显示笔记编辑模态框
     */
    showModal(note = null) {
        this.currentNote = note;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-modal';
        
        const isEdit = !!note;
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>${isEdit ? '编辑笔记' : '新建笔记'}</h3>
                    <button class="note-modal-close" id="note-modal-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label for="note-title">标题</label>
                        <input type="text" id="note-title" class="note-form-input" 
                               placeholder="请输入笔记标题" value="${note ? this.escapeHtml(note.title) : ''}">
                    </div>
                    <div class="note-form-group">
                        <label for="note-content">内容 <span style="font-size: 12px; color: var(--text-secondary-color, #666666);">(支持Markdown格式)</span></label>
                        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                            <button type="button" id="note-edit-mode" class="note-mode-btn active" style="padding: 6px 12px; border: 1px solid var(--border-color, #e0e0e0); background: var(--primary-color, #4285f4); color: white; border-radius: 4px; font-size: 12px; cursor: pointer;">编辑</button>
                            <button type="button" id="note-preview-mode" class="note-mode-btn" style="padding: 6px 12px; border: 1px solid var(--border-color, #e0e0e0); background: var(--card-bg-color, #f8f9fa); color: var(--text-color, #333333); border-radius: 4px; font-size: 12px; cursor: pointer;">预览</button>
                        </div>
                        <textarea id="note-content" class="note-form-textarea" 
                                  placeholder="请输入笔记内容，支持Markdown格式">${note ? this.escapeHtml(note.content) : ''}</textarea>
                        <div id="note-preview-content" style="display: none; min-height: 200px; padding: 12px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; background-color: var(--bg-color, #ffffff); color: var(--text-color, #333333); overflow-y: auto;"></div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-tags">标签</label>
                        <input type="text" id="note-tags" class="note-form-input" 
                               placeholder="请输入标签，用逗号分隔" 
                               value="${note && note.tags ? note.tags.join(', ') : ''}">
                    </div>
                </div>
                <div class="note-modal-actions">
                    ${isEdit ? '<button class="note-modal-btn danger" id="note-delete-btn">删除</button>' : ''}
                    <button class="note-modal-btn secondary" id="note-cancel-btn">取消</button>
                    <button class="note-modal-btn primary" id="note-save-btn">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定模态框事件
        this.bindModalEvents(modal);
        
        // 聚焦到标题输入框
        setTimeout(() => {
            document.getElementById('note-title').focus();
        }, 100);
    },

    /**
     * 绑定模态框事件
     */
    bindModalEvents(modal) {
        const closeBtn = modal.querySelector('#note-modal-close');
        const cancelBtn = modal.querySelector('#note-cancel-btn');
        const saveBtn = modal.querySelector('#note-save-btn');
        const deleteBtn = modal.querySelector('#note-delete-btn');
        
        // 关闭模态框
        const closeModal = () => {
            modal.remove();
            this.currentNote = null;
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // 保存笔记
        saveBtn.addEventListener('click', () => {
            this.saveNote(modal);
        });
        
        // 删除笔记
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.currentNote) {
                    this.deleteNote(this.currentNote.id);
                    closeModal();
                }
            });
        }
        
        // 编辑/预览模式切换
        const editModeBtn = modal.querySelector('#note-edit-mode');
        const previewModeBtn = modal.querySelector('#note-preview-mode');
        const contentTextarea = modal.querySelector('#note-content');
        const previewContent = modal.querySelector('#note-preview-content');
        
        editModeBtn.addEventListener('click', () => {
            this.switchToEditMode(editModeBtn, previewModeBtn, contentTextarea, previewContent);
        });
        
        previewModeBtn.addEventListener('click', () => {
            this.switchToPreviewMode(editModeBtn, previewModeBtn, contentTextarea, previewContent);
        });
        
        // 回车保存
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.saveNote(modal);
            }
        });
    },

    /**
     * 保存笔记
     */
    saveNote(modal) {
        const titleInput = modal.querySelector('#note-title');
        const contentInput = modal.querySelector('#note-content');
        const tagsInput = modal.querySelector('#note-tags');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!title) {
            UIManager.showNotification('请输入笔记标题', 'warning');
            titleInput.focus();
            return;
        }
        
        if (!content) {
            UIManager.showNotification('请输入笔记内容', 'warning');
            contentInput.focus();
            return;
        }
        
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        const now = new Date().toISOString();
        
        if (this.currentNote) {
            // 编辑现有笔记
            const noteIndex = data.notes.findIndex(n => n.id === this.currentNote.id);
            if (noteIndex !== -1) {
                data.notes[noteIndex] = {
                    ...this.currentNote,
                    title,
                    content,
                    tags,
                    updateTime: now
                };
            }
        } else {
            // 新建笔记
            const newNote = {
                id: this.generateId(),
                title,
                content,
                tags,
                createTime: now,
                updateTime: now,
                starred: false
            };
            data.notes.push(newNote);
        }
        
        StorageManager.saveData(data);
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        modal.remove();
        this.currentNote = null;
        
        UIManager.showNotification(
            this.currentNote ? '笔记更新成功' : '笔记创建成功', 
            'success'
        );
    },

    /**
     * 删除笔记
     */
    deleteNote(noteId) {
        if (!confirm('确定要删除这个笔记吗？')) {
            return;
        }
        
        const data = StorageManager.getData();
        data.notes = data.notes.filter(note => note.id !== noteId);
        StorageManager.saveData(data);
        
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        UIManager.showNotification('笔记删除成功', 'success');
    },

    /**
     * 分享笔记
     */
    shareNote(note) {
        // 整理数据结构，兼容图片分享
        const noteData = {
            title: note.title,
            content: note.content,
            tags: note.tags
        };
        if (window.showShareNoteImageModal) {
            window.showShareNoteImageModal(noteData);
        } else {
            // 兼容未加载图片分享脚本时的降级
            let shareText = `📝【笔记】${note.title}\n`;
            shareText += `-----------------------------\n`;
            shareText += `${note.content}\n`;
            if (note.tags && note.tags.length > 0) {
                shareText += `\n标签：${note.tags.join(', ')}\n`;
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 来自有数`;
            if (navigator.share) {
                navigator.share({
                    title: note.title,
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText).then(() => {
                    UIManager.showNotification('笔记内容已复制到剪贴板', 'success');
                });
            }
        }
    },

    /**
     * 搜索笔记
     */
    searchNotes(keyword) {
        const cards = this.elements.notesList.querySelectorAll('.note-card');
        const lowerKeyword = keyword.toLowerCase();
        
        cards.forEach(card => {
            const title = card.querySelector('.note-title').textContent.toLowerCase();
            const content = card.querySelector('.note-content-preview').textContent.toLowerCase();
            const tags = Array.from(card.querySelectorAll('.note-tag'))
                .map(tag => tag.textContent.toLowerCase());
            
            const matches = title.includes(lowerKeyword) || 
                           content.includes(lowerKeyword) ||
                           tags.some(tag => tag.includes(lowerKeyword));
            
            card.style.display = matches ? 'block' : 'none';
        });
    },

    /**
     * 切换批量模式
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        this.selectedNotes.clear();
        
        const list = this.elements.notesList;
        const toggleBtn = this.elements.batchToggleBtn;
        const deleteBtn = this.elements.batchDeleteBtn;
        
        if (this.batchMode) {
            list.classList.add('batch-mode');
            toggleBtn.innerHTML = '<i class="fas fa-times"></i>退出批量';
            deleteBtn.style.display = 'inline-flex';
        } else {
            list.classList.remove('batch-mode');
            toggleBtn.innerHTML = '<i class="fas fa-check-square"></i>批量选择';
            deleteBtn.style.display = 'none';
        }
        
        this.loadNotes();
    },

    /**
     * 切换笔记选择状态
     */
    toggleNoteSelection(noteId, checkbox) {
        if (this.selectedNotes.has(noteId)) {
            this.selectedNotes.delete(noteId);
            checkbox.classList.remove('checked');
        } else {
            this.selectedNotes.add(noteId);
            checkbox.classList.add('checked');
        }
        
        this.updateBatchDeleteButton();
    },

    /**
     * 更新批量删除按钮状态
     */
    updateBatchDeleteButton() {
        const deleteBtn = this.elements.batchDeleteBtn;
        if (this.selectedNotes.size > 0) {
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i>删除选中 (${this.selectedNotes.size})`;
            deleteBtn.disabled = false;
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>批量删除';
            deleteBtn.disabled = true;
        }
    },

    /**
     * 批量删除
     */
    batchDelete() {
        if (this.selectedNotes.size === 0) {
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedNotes.size} 个笔记吗？`)) {
            return;
        }
        
        const data = StorageManager.getData();
        data.notes = data.notes.filter(note => !this.selectedNotes.has(note.id));
        StorageManager.saveData(data);
        
        this.selectedNotes.clear();
        this.toggleBatchMode();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        UIManager.showNotification(`成功删除 ${this.selectedNotes.size} 个笔记`, 'success');
    },

    /**
     * 显示笔记详情
     */
    showNoteDetail(note) {
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-detail-modal';
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3 style="display:inline-block;vertical-align:middle;">${this.escapeHtml(note.title)}</h3>
                    <button class="note-star${note.starred ? ' active' : ''}" id="note-detail-star-btn" title="${note.starred ? '取消收藏' : '收藏'}" style="margin-left:8px;"><i class="fas fa-star"></i></button>
                    <button class="note-modal-close" id="note-detail-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <input id="note-detail-search-input" type="text" placeholder="搜索本笔记内容" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #ccc;outline:none;" />
                        <button id="note-detail-search-btn" style="padding:6px 14px;border-radius:6px;border:none;background:#4285f4;color:#fff;cursor:pointer;">搜索</button>
                        <button id="note-detail-clear-btn" style="padding:6px 10px;border-radius:6px;border:none;background:#aaa;color:#fff;cursor:pointer;">清除</button>
                    </div>
                    <div class="note-form-group" style="display:flex;align-items:center;justify-content:space-between;">
                        <label>内容</label>
                        <div>
                            <button id="note-detail-copy-btn" title="复制内容" style="margin-right:6px;padding:4px 10px;border-radius:6px;border:none;background:#4caf50;color:#fff;cursor:pointer;font-size:13px;">复制</button>
                            <button id="note-detail-share-btn" title="分享内容" style="padding:4px 10px;border-radius:6px;border:none;background:#2196f3;color:#fff;cursor:pointer;font-size:13px;">分享</button>
                        </div>
                    </div>
                    <div class="note-form-group">
                        <div id="note-detail-content" style="padding: 12px; background-color: var(--card-bg-color, #f8f9fa); border-radius: 8px; border: 1px solid var(--border-color, #e0e0e0); min-height: 100px; max-height: 400px; overflow-y: auto;">
                            ${this.renderNoteContent(note.content)}
                        </div>
                    </div>
                    ${note.tags && note.tags.length > 0 ? `
                    <div class="note-form-group">
                        <label>标签</label>
                        <div class="note-form-tags">
                            ${note.tags.map(tag => `<span class="note-tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    <div class="note-form-group">
                        <label>创建时间</label>
                        <div style="color: var(--text-secondary-color, #666666);">
                            ${new Date(note.createTime).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    ${note.updateTime && note.updateTime !== note.createTime ? `
                    <div class="note-form-group">
                        <label>更新时间</label>
                        <div style="color: var(--text-secondary-color, #666666);">
                            ${new Date(note.updateTime).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-detail-close-btn">关闭</button>
                    <button class="note-modal-btn primary" id="note-detail-edit-btn">编辑</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-detail-close');
        const closeBtn2 = modal.querySelector('#note-detail-close-btn');
        const editBtn = modal.querySelector('#note-detail-edit-btn');
        const starBtn = modal.querySelector('#note-detail-star-btn');
        const searchBtn = modal.querySelector('#note-detail-search-btn');
        const clearBtn = modal.querySelector('#note-detail-clear-btn');
        const searchInput = modal.querySelector('#note-detail-search-input');
        const contentDiv = modal.querySelector('#note-detail-content');
        const copyBtn = modal.querySelector('#note-detail-copy-btn');
        const shareBtn = modal.querySelector('#note-detail-share-btn');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        closeBtn2.addEventListener('click', closeModal);
        editBtn.addEventListener('click', () => {
            closeModal();
            this.showModal(note);
        });
        starBtn.addEventListener('click', () => {
            this.toggleStar(note.id);
            closeModal();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        // 搜索功能
        function highlightKeyword(keyword, html) {
            if (!keyword) return html;
            // 只高亮文本节点
            let matched = false;
            const replaced = html.replace(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), function(match) {
                matched = true;
                return '<span style="background:yellow;color:#d32f2f;">' + match + '</span>';
            });
            return { html: replaced, matched };
        }
        searchBtn.addEventListener('click', () => {
            const kw = searchInput.value.trim();
            const result = highlightKeyword(kw, `${this.renderNoteContent(note.content)}`);
            if (kw && !result.matched) {
                contentDiv.innerHTML = '<div style="color:#d32f2f;padding:24px 0;text-align:center;">未找到相关内容</div>';
            } else {
                contentDiv.innerHTML = result.html;
            }
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            contentDiv.innerHTML = this.renderNoteContent(note.content);
        });
        // 复制按钮事件绑定修复
        setTimeout(() => {
            const copyBtn = modal.querySelector('#note-detail-copy-btn');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    // 组装带emoji的完整笔记信息
                    let text = '';
                    text += `📒 标题：${note.title}\n`;
                    text += `📝 内容：${note.content}\n`;
                    if (note.tags && note.tags.length > 0) {
                        text += `🏷️ 标签：${note.tags.join(', ')}\n`;
                    }
                    text += `⏰ 创建时间：${new Date(note.createTime).toLocaleString('zh-CN')}\n`;
                    if (note.updateTime && note.updateTime !== note.createTime) {
                        text += `🔄 更新时间：${new Date(note.updateTime).toLocaleString('zh-CN')}\n`;
                    }
                    text += `✨有数日程，祝你生活愉快！`;
                    const setCopied = () => {
                        const oldText = copyBtn.textContent;
                        copyBtn.textContent = '已复制✓';
                        copyBtn.disabled = true;
                        setTimeout(() => {
                            copyBtn.textContent = oldText;
                            copyBtn.disabled = false;
                        }, 2000);
                    };
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(text).then(() => {
                            setCopied();
                            if (window.UIManager && typeof UIManager.showNotification === 'function') {
                                UIManager.showNotification('内容已复制', 'success');
                            } else {
                                alert('内容已复制');
                            }
                        }).catch(() => {
                            alert('复制失败，请手动复制');
                        });
                    } else {
                        // 兼容旧浏览器
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                            document.execCommand('copy');
                            setCopied();
                            if (window.UIManager && typeof UIManager.showNotification === 'function') {
                                UIManager.showNotification('内容已复制', 'success');
                            } else {
                                alert('内容已复制');
                            }
                        } catch (e) {
                            alert('复制失败，请手动复制');
                        }
                        document.body.removeChild(textarea);
                    }
                };
            }
        }, 0);
        shareBtn.addEventListener('click', () => {
            const text = note.content || '';
            if (navigator.share) {
                navigator.share({ title: note.title, text }).catch(() => {});
            } else {
                UIManager && UIManager.showNotification ? UIManager.showNotification('当前浏览器不支持系统分享', 'warning') : alert('当前浏览器不支持系统分享');
            }
        });
    },

    /**
     * 显示文本导入模态框
     */
    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-import-modal';
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>文本导入笔记</h3>
                    <button class="note-modal-close" id="note-import-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>导入格式说明：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            标题 | 内容 | 标签1,标签2<br>
                            例如：<br>
                            会议记录 | 今天讨论了项目进度... | 工作,会议<br>
                            学习笔记 | 学习了JavaScript的... | 学习,编程
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-import-text">导入内容：</label>
                        <textarea id="note-import-text" class="note-form-textarea" 
                                  placeholder="请按照上述格式输入笔记内容，每行一个笔记"></textarea>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-import-cancel">取消</button>
                    <button class="note-modal-btn primary" id="note-import-confirm">导入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-import-close');
        const cancelBtn = modal.querySelector('#note-import-cancel');
        const confirmBtn = modal.querySelector('#note-import-confirm');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            this.importNotes(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    /**
     * 导入笔记
     */
    importNotes(modal) {
        const textarea = modal.querySelector('#note-import-text');
        const content = textarea.value.trim();
        
        if (!content) {
            UIManager.showNotification('请输入要导入的内容', 'warning');
            return;
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        let successCount = 0;
        const now = new Date().toISOString();
        
        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 2) {
                const title = parts[0];
                const content = parts[1];
                const tags = parts[2] ? parts[2].split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                
                if (title && content) {
                    const newNote = {
                        id: this.generateId(),
                        title,
                        content,
                        tags,
                        createTime: now,
                        updateTime: now,
                        starred: false
                    };
                    data.notes.push(newNote);
                    successCount++;
                }
            }
        });
        
        StorageManager.saveData(data);
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        modal.remove();
        UIManager.showNotification(`成功导入 ${successCount} 个笔记`, 'success');
    },

    /**
     * 显示文件导入模态框
     */
    showFileImportModal() {
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-file-import-modal';
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>文件导入笔记</h3>
                    <button class="note-modal-close" id="note-file-import-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>支持的文件格式：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            • Markdown (.md) - 支持格式化和链接<br>
                            • Word文档 (.docx, .doc) - 自动提取文本内容<br>
                            • 纯文本 (.txt) - 直接导入文本内容<br>
                            • 多个文件可同时选择导入
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-file-input">选择文件：</label>
                        <input type="file" id="note-file-input" class="note-form-input" 
                               accept=".md,.docx,.doc,.txt" multiple>
                        <p class="input-hint">支持的文件格式：.md, .docx, .doc, .txt</p>
                    </div>
                    <div class="note-form-group">
                        <label>导入预览：</label>
                        <div id="file-import-preview" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 12px; background-color: var(--card-bg-color, #f8f9fa);">
                            <p style="color: var(--text-secondary-color, #999999); text-align: center;">选择文件后将显示预览</p>
                        </div>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-file-import-cancel">取消</button>
                    <button class="note-modal-btn primary" id="note-file-import-confirm" disabled>导入</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-file-import-close');
        const cancelBtn = modal.querySelector('#note-file-import-cancel');
        const confirmBtn = modal.querySelector('#note-file-import-confirm');
        const fileInput = modal.querySelector('#note-file-input');
        const preview = modal.querySelector('#file-import-preview');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, preview, confirmBtn);
        });
        
        // 确认导入
        confirmBtn.addEventListener('click', () => {
            this.importFiles(fileInput.files, modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    /**
     * 处理文件选择
     */
    async handleFileSelection(files, preview, confirmBtn) {
        if (!files || files.length === 0) {
            preview.innerHTML = '<p style="color: var(--text-secondary-color, #999999); text-align: center;">选择文件后将显示预览</p>';
            confirmBtn.disabled = true;
            return;
        }
        
        confirmBtn.disabled = true;
        preview.innerHTML = '<p style="color: var(--text-secondary-color, #666666); text-align: center;">正在解析文件...</p>';
        
        try {
            const fileInfos = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const content = await this.parseFile(file);
                fileInfos.push({
                    name: file.name,
                    content: content,
                    size: file.size
                });
            }
            
            // 显示预览
            this.showFilePreview(fileInfos, preview);
            confirmBtn.disabled = false;
            
        } catch (error) {
            console.error('文件解析失败:', error);
            preview.innerHTML = `<p style="color: var(--danger-color, #ea4335); text-align: center;">文件解析失败: ${error.message}</p>`;
            confirmBtn.disabled = true;
        }
    },

    /**
     * 解析文件内容
     */
    async parseFile(file) {
        const extension = file.name.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'md':
                return await this.parseMarkdownFile(file);
            case 'docx':
                return await this.parseDocxFile(file);
            case 'doc':
                return await this.parseDocFile(file);
            case 'txt':
                return await this.parseTxtFile(file);
            default:
                throw new Error(`不支持的文件格式: ${extension}`);
        }
    },

    /**
     * 解析Markdown文件
     */
    async parseMarkdownFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // 提取标题（第一个#开头的行）
                    const titleMatch = content.match(/^#\s+(.+)$/m);
                    const title = titleMatch ? titleMatch[1].trim() : file.name.replace('.md', '');
                    
                    // 提取标签（从文件名或内容中）
                    const tags = this.extractTagsFromContent(content);
                    
                    resolve({
                        title: title,
                        content: content,
                        tags: tags
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    },

    /**
     * 解析DOCX文件
     */
    async parseDocxFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            
            const content = result.value;
            const title = this.extractTitleFromContent(content) || file.name.replace('.docx', '');
            const tags = this.extractTagsFromContent(content);
            
            return {
                title: title,
                content: content,
                tags: tags
            };
        } catch (error) {
            throw new Error(`DOCX文件解析失败: ${error.message}`);
        }
    },

    /**
     * 解析DOC文件（降级为二进制处理）
     */
    async parseDocFile(file) {
        // DOC文件比较复杂，这里提供一个基本的文本提取
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // 简单的文本提取（可能不完整）
                    const content = this.extractTextFromBinary(e.target.result);
                    const title = this.extractTitleFromContent(content) || file.name.replace('.doc', '');
                    const tags = this.extractTagsFromContent(content);
                    
                    resolve({
                        title: title,
                        content: content,
                        tags: tags
                    });
                } catch (error) {
                    reject(new Error(`DOC文件解析失败: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * 解析TXT文件
     */
    async parseTxtFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const title = this.extractTitleFromContent(content) || file.name.replace('.txt', '');
                    const tags = this.extractTagsFromContent(content);
                    
                    resolve({
                        title: title,
                        content: content,
                        tags: tags
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    },

    /**
     * 从内容中提取标题
     */
    extractTitleFromContent(content) {
        // 查找第一行非空内容作为标题
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // 如果第一行太长，截取前50个字符
            return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        }
        return null;
    },

    /**
     * 从内容中提取标签
     */
    extractTagsFromContent(content) {
        const tags = [];
        
        // 查找#标签
        const hashTags = content.match(/#(\w+)/g);
        if (hashTags) {
            tags.push(...hashTags.map(tag => tag.substring(1)));
        }
        
        // 查找[标签]格式
        const bracketTags = content.match(/\[([^\]]+)\]/g);
        if (bracketTags) {
            tags.push(...bracketTags.map(tag => tag.substring(1, tag.length - 1)));
        }
        
        return tags.slice(0, 5); // 最多5个标签
    },

    /**
     * 从二进制数据中提取文本（用于DOC文件）
     */
    extractTextFromBinary(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        let text = '';
        
        // 简单的文本提取（查找可打印字符）
        for (let i = 0; i < uint8Array.length; i++) {
            const byte = uint8Array[i];
            if (byte >= 32 && byte <= 126) { // 可打印ASCII字符
                text += String.fromCharCode(byte);
            } else if (byte === 10 || byte === 13) { // 换行符
                text += '\n';
            }
        }
        
        return text;
    },

    /**
     * 显示文件预览
     */
    showFilePreview(fileInfos, preview) {
        let previewHTML = '<div style="font-size: 12px;">';
        
        fileInfos.forEach((fileInfo, index) => {
            previewHTML += `
                <div style="margin-bottom: 15px; padding: 10px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; background-color: var(--bg-color, #ffffff);">
                    <div style="font-weight: bold; color: var(--text-color, #333333); margin-bottom: 5px;">
                        📄 ${fileInfo.name} (${this.formatFileSize(fileInfo.size)})
                    </div>
                    <div style="color: var(--text-secondary-color, #666666); margin-bottom: 5px;">
                        <strong>标题:</strong> ${this.escapeHtml(fileInfo.content.title)}
                    </div>
                    <div style="color: var(--text-secondary-color, #666666); margin-bottom: 5px;">
                        <strong>标签:</strong> ${fileInfo.content.tags.length > 0 ? fileInfo.content.tags.map(tag => `<span style="background-color: var(--primary-color-light, rgba(66, 133, 244, 0.1)); color: var(--primary-color, #4285f4); padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px;">${this.escapeHtml(tag)}</span>`).join('') : '无'}
                    </div>
                    <div style="color: var(--text-secondary-color, #666666);">
                        <strong>内容预览:</strong> ${this.escapeHtml(fileInfo.content.content.substring(0, 100))}${fileInfo.content.content.length > 100 ? '...' : ''}
                    </div>
                </div>
            `;
        });
        
        previewHTML += '</div>';
        preview.innerHTML = previewHTML;
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 导入文件
     */
    async importFiles(files, modal) {
        if (!files || files.length === 0) {
            UIManager.showNotification('请选择要导入的文件', 'warning');
            return;
        }
        
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        let successCount = 0;
        const now = new Date().toISOString();
        
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileContent = await this.parseFile(file);
                
                const newNote = {
                    id: this.generateId(),
                    title: fileContent.title,
                    content: fileContent.content,
                    tags: fileContent.tags,
                    createTime: now,
                    updateTime: now,
                    sourceFile: file.name,
                    starred: false
                };
                
                data.notes.push(newNote);
                successCount++;
            }
            
            StorageManager.saveData(data);
            this.loadNotes();
            
            // 更新快速导航计数
            if (window.QuickNavManager) {
                QuickNavManager.updateCounts();
            }
            
            modal.remove();
            UIManager.showNotification(`成功导入 ${successCount} 个笔记`, 'success');
            
        } catch (error) {
            console.error('文件导入失败:', error);
            UIManager.showNotification(`文件导入失败: ${error.message}`, 'error');
        }
    },

    /**
     * 显示文本编辑模态框
     */
    showEditModal() {
        const data = StorageManager.getData();
        const notes = data.notes || [];
        
        if (notes.length === 0) {
            UIManager.showNotification('没有笔记可以编辑', 'warning');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.id = 'note-edit-modal';
        
        const notesText = notes.map(note => {
            const tags = note.tags && note.tags.length > 0 ? note.tags.join(',') : '';
            return `${note.title} | ${note.content} | ${tags}`;
        }).join('\n');
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>文本编辑笔记</h3>
                    <button class="note-modal-close" id="note-edit-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>编辑格式说明：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            标题 | 内容 | 标签1,标签2<br>
                            每行一个笔记，修改后点击保存即可更新
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-edit-text">编辑内容：</label>
                        <textarea id="note-edit-text" class="note-form-textarea">${notesText}</textarea>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-edit-cancel">取消</button>
                    <button class="note-modal-btn primary" id="note-edit-confirm">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定事件
        const closeBtn = modal.querySelector('#note-edit-close');
        const cancelBtn = modal.querySelector('#note-edit-cancel');
        const confirmBtn = modal.querySelector('#note-edit-confirm');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            this.editNotes(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    /**
     * 编辑笔记
     */
    editNotes(modal) {
        const textarea = modal.querySelector('#note-edit-text');
        const content = textarea.value.trim();
        
        if (!content) {
            UIManager.showNotification('请输入笔记内容', 'warning');
            return;
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        const data = StorageManager.getData();
        data.notes = [];
        
        let successCount = 0;
        const now = new Date().toISOString();
        
        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 2) {
                const title = parts[0];
                const content = parts[1];
                const tags = parts[2] ? parts[2].split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                
                if (title && content) {
                    const newNote = {
                        id: this.generateId(),
                        title,
                        content,
                        tags,
                        createTime: now,
                        updateTime: now
                    };
                    data.notes.push(newNote);
                    successCount++;
                }
            }
        });
        
        StorageManager.saveData(data);
        this.loadNotes();
        
        // 更新快速导航计数
        if (window.QuickNavManager) {
            QuickNavManager.updateCounts();
        }
        
        modal.remove();
        UIManager.showNotification(`成功更新 ${successCount} 个笔记`, 'success');
    },

    /**
     * 切换到编辑模式
     */
    switchToEditMode(editBtn, previewBtn, textarea, previewDiv) {
        editBtn.style.background = 'var(--primary-color, #4285f4)';
        editBtn.style.color = 'white';
        previewBtn.style.background = 'var(--card-bg-color, #f8f9fa)';
        previewBtn.style.color = 'var(--text-color, #333333)';
        
        textarea.style.display = 'block';
        previewDiv.style.display = 'none';
        textarea.focus();
    },

    /**
     * 切换到预览模式
     */
    switchToPreviewMode(editBtn, previewBtn, textarea, previewDiv) {
        editBtn.style.background = 'var(--card-bg-color, #f8f9fa)';
        editBtn.style.color = 'var(--text-color, #333333)';
        previewBtn.style.background = 'var(--primary-color, #4285f4)';
        previewBtn.style.color = 'white';
        
        textarea.style.display = 'none';
        previewDiv.style.display = 'block';
        
        // 渲染Markdown预览
        const content = textarea.value;
        previewDiv.innerHTML = this.renderNoteContent(content);
    },

    /**
     * 渲染笔记内容（支持Markdown）
     */
    renderNoteContent(content) {
        if (!content || !content.trim()) {
            return '<p style="color: var(--text-secondary-color, #999999); font-style: italic;">暂无内容</p>';
        }
        
        try {
            // 尝试渲染Markdown
            const htmlContent = marked.parse(content);
            
            // 添加Markdown样式
            const styledContent = `
                <div style="line-height: 1.6; font-size: 14px;">
                    ${htmlContent}
                </div>
            `;
            
            return styledContent;
        } catch (error) {
            // 如果Markdown解析失败，显示原始文本
            return `<div style="white-space: pre-wrap;">${this.escapeHtml(content)}</div>`;
        }
    },

    /**
     * 转义HTML字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 收藏/取消收藏
     */
    toggleStar(noteId) {
        const data = StorageManager.getData();
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            note.starred = !note.starred;
            note.updateTime = new Date().toISOString();
            StorageManager.saveData(data);
            this.loadNotes();
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他管理器初始化完成
    setTimeout(() => {
        NotesManager.init();
    }, 500);
});

// 导出到全局作用域
window.NotesManager = NotesManager; 