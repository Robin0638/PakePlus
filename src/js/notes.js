/**
 * Notes管理器
 * 负责Notes的增删改查、Search、批量操作等功能
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
     * 初始化Notes管理器
     */
    init() {
        console.log('初始化Notes管理器...');
        
        try {
            this.initElements();
            this.bindEvents();
            this.loadNotes();
            
            console.log('Notes管理器初始化Completed');
        } catch (error) {
            console.error('Notes管理器初始化失败:', error);
        }
    },

    /**
     * 初始化DOM元素
     */
    initElements() {
        this.elements.notesList = document.getElementById('notes-List');
        this.elements.emptyMessage = document.getElementById('empty-notes-message');
        this.elements.searchInput = document.getElementById('notes-search-input');
        this.elements.addBtn = document.getElementById('add-note-btn');
        this.elements.batchToggleBtn = document.getElementById('toggle-notes-batch-mode-btn');
        this.elements.batchDeleteBtn = document.getElementById('notes-batch-delete-btn');
        this.elements.importBtn = document.getElementById('import-notes-text-btn');
        this.elements.editBtn = document.getElementById('edit-notes-text-btn');

        if (!this.elements.notesList || !this.elements.emptyMessage) {
            throw new Error('找不到Notes列表容器');
        }
    },

    /**
     * 绑定Things
     */
    bindEvents() {
        // NewNotes
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.showModal());
        }

        // 批量模式切换
        if (this.elements.batchToggleBtn) {
            this.elements.batchToggleBtn.addEventListener('click', () => this.toggleBatchMode());
        }

        // 批量Delet
        if (this.elements.batchDeleteBtn) {
            this.elements.batchDeleteBtn.addEventListener('click', () => this.batchDelete());
        }

        // Search
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

        // 文本Edit
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
     * 加载所有Notes
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
        
        // 收藏优先，time倒序
        notes.sort((a, b) => {
            if ((b.starred ? 1 : 0) !== (a.starred ? 1 : 0)) {
                return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            }
            return new Date(b.createTime) - new Date(a.createTime);
        });
        
        // 添加Notes卡片
        notes.forEach(note => {
            const card = this.createNoteCard(note);
            this.elements.notesList.appendChild(card);
        });
        
        // 如果是批量模式，更新Select all按钮状态
        if (this.batchMode) {
            this.updateSelectAllButton();
        }
    },

    /**
     * 创建Notes卡片
     */
    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-note-id', note.id);
        
        // 格式化日期
        const createDate = new Date(note.createTime);
        const updateDate = note.updateTime ? new Date(note.updateTime) : createDate;
        const dateText = updateDate.toLocaleDateString('en-US');
        
        // Content预览（去除HTMLLabel）
        const contentPreview = note.content.replace(/<[^>]*>/g, '').substring(0, 150);
        
        // LabelHTML
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
                <button class="note-action-btn edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="note-action-btn share" title="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="note-action-btn delete" title="Delet">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // 绑定卡片Things
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
            // 批量模式下的Select功能
            const checkbox = card.querySelector('.note-checkbox');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNoteSelection(note.id, checkbox);
            });
        }
        
        // 收藏按钮Things
        const starBtn = card.querySelector('.note-star');
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStar(note.id);
        });
        
        return card;
    },

    /**
     * 显示NotesEdit模态框
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
                    <h3>${isEdit ? 'Edit notes' : 'NewNotes'}</h3>
                    <button class="note-modal-close" id="note-modal-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label for="note-title">Title</label>
                        <input type="text" id="note-title" class="note-form-input" 
                               placeholder="Please enter Notes Title" value="${note ? this.escapeHtml(note.title) : ''}">
                    </div>
                    <div class="note-form-group">
                        <label for="note-content">Content <span style="font-size: 12px; color: var(--text-secondary-color, #666666);">(Support Markdown format)</span></label>
                        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                            <button type="button" id="note-edit-mode" class="note-mode-btn active" style="padding: 6px 12px; border: 1px solid var(--border-color, #e0e0e0); background: var(--primary-color, #4285f4); color: white; border-radius: 4px; font-size: 12px; cursor: pointer;">Edit</button>
                            <button type="button" id="note-preview-mode" class="note-mode-btn" style="padding: 6px 12px; border: 1px solid var(--border-color, #e0e0e0); background: var(--card-bg-color, #f8f9fa); color: var(--text-color, #333333); border-radius: 4px; font-size: 12px; cursor: pointer;">Preview</button>
                        </div>
                        <textarea id="note-content" class="note-form-textarea" 
                                  placeholder="Please enter Notes content, support Markdown format">${note ? this.escapeHtml(note.content) : ''}</textarea>
                        <div id="note-preview-content" style="display: none; min-height: 200px; padding: 12px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; background-color: var(--bg-color, #ffffff); color: var(--text-color, #333333); overflow-y: auto;"></div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-tags">Label</label>
                        <input type="text" id="note-tags" class="note-form-input" 
                               placeholder="Please enter Label, separated by a comma" 
                               value="${note && note.tags ? note.tags.join(', ') : ''}">
                    </div>
                </div>
                <div class="note-modal-actions">
                    ${isEdit ? '<button class="note-modal-btn danger" id="note-delete-btn">Delet</button>' : ''}
                    <button class="note-modal-btn secondary" id="note-cancel-btn">Cancel</button>
                    <button class="note-modal-btn primary" id="note-save-btn">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定模态框Things
        this.bindModalEvents(modal);
        
        // 聚焦到Title输入框
        setTimeout(() => {
            document.getElementById('note-title').focus();
        }, 100);
    },

    /**
     * 绑定模态框Things
     */
    bindModalEvents(modal) {
        const closeBtn = modal.querySelector('#note-modal-close');
        const cancelBtn = modal.querySelector('#note-cancel-btn');
        const saveBtn = modal.querySelector('#note-save-btn');
        const deleteBtn = modal.querySelector('#note-delete-btn');
        
        // Close模态框
        const closeModal = () => {
            modal.remove();
            this.currentNote = null;
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 点击背景Close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // 保存Notes
        saveBtn.addEventListener('click', () => {
            this.saveNote(modal);
        });
        
        // DeletNotes
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.currentNote) {
                    this.deleteNote(this.currentNote.id);
                    closeModal();
                }
            });
        }
        
        // Edit/预览模式切换
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
     * 保存Notes
     */
    saveNote(modal) {
        const titleInput = modal.querySelector('#note-title');
        const contentInput = modal.querySelector('#note-content');
        const tagsInput = modal.querySelector('#note-tags');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!title) {
            UIManager.showNotification('请输入NotesTitle', 'warning');
            titleInput.focus();
            return;
        }
        
        if (!content) {
            UIManager.showNotification('请输入NotesContent', 'warning');
            contentInput.focus();
            return;
        }
        
        const data = StorageManager.getData();
        if (!data.notes) {
            data.notes = [];
        }
        
        const now = new Date().toISOString();
        
        if (this.currentNote) {
            // Edit现有Notes
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
            // NewNotes
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
            this.currentNote ? 'Notes更新成功' : 'Notes创建成功', 
            'success'
        );
    },

    /**
     * DeletNotes
     */
    deleteNote(noteId) {
        if (!confirm('确定要Delet这个Notes吗？')) {
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
        
        UIManager.showNotification('NotesDelet成功', 'success');
    },

    /**
     * ShareNotes
     */
    shareNote(note) {
        // 整理数据结构，兼容图片Share
        const noteData = {
            title: note.title,
            content: note.content,
            tags: note.tags
        };
        if (window.showShareNoteImageModal) {
            window.showShareNoteImageModal(noteData);
        } else {
            // 兼容未加载图片Share脚本时的降级
            let shareText = `📝【Notes】${note.title}\n`;
            shareText += `-----------------------------\n`;
            shareText += `${note.content}\n`;
            if (note.tags && note.tags.length > 0) {
                shareText += `\nLabel：${note.tags.join(', ')}\n`;
            }
            shareText += `-----------------------------\n`;
            shareText += `🎉 来自有数规划（电脑版）`;
            if (navigator.share) {
                navigator.share({
                    title: note.title,
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText).then(() => {
                    UIManager.showNotification('NotesContent已Copy到剪贴板', 'success');
                });
            }
        }
    },

    /**
     * SearchNotes
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
        
        const List = this.elements.notesList;
        const toggleBtn = this.elements.batchToggleBtn;
        const deleteBtn = this.elements.batchDeleteBtn;
        
        if (this.batchMode) {
            List.classList.add('batch-mode');
            toggleBtn.innerHTML = '<i class="fas fa-times"></i>Exit the batch';
            deleteBtn.style.display = 'inline-flex';
        } else {
            List.classList.remove('batch-mode');
            toggleBtn.innerHTML = '<i class="fas fa-check-square"></i>Batch Select';
            deleteBtn.style.display = 'none';
        }
        
        this.loadNotes();
    },

    /**
     * 切换NotesSelect状态
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
     * 更新批量Delet按钮状态
     */
    updateBatchDeleteButton() {
        const deleteBtn = this.elements.batchDeleteBtn;
        if (this.selectedNotes.size > 0) {
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i>Delet选medium (${this.selectedNotes.size})`;
            deleteBtn.disabled = false;
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>批量Delet';
            deleteBtn.disabled = true;
        }
    },

    /**
     * 批量Delet
     */
    batchDelete() {
        if (this.selectedNotes.size === 0) {
            return;
        }
        
        if (!confirm(`确定要Delet选medium的 ${this.selectedNotes.size} 个Notes吗？`)) {
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
        
        UIManager.showNotification(`成功Delet ${this.selectedNotes.size} 个Notes`, 'success');
    },

    /**
     * 显示Notes详情
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
                        <input id="note-detail-search-input" type="text" placeholder="Search booknotes content" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #ccc;outline:none;" />
                        <button id="note-detail-search-btn" style="padding:6px 14px;border-radius:6px;border:none;background:#4285f4;color:#fff;cursor:pointer;">Search</button>
                        <button id="note-detail-clear-btn" style="padding:6px 10px;border-radius:6px;border:none;background:#aaa;color:#fff;cursor:pointer;">Purge</button>
                    </div>
                    <div class="note-form-group" style="display:flex;align-items:center;justify-content:space-between;">
                        <label>Content</label>
                        <div>
                            <button id="note-detail-copy-btn" title="CopyContent" style="margin-right:6px;padding:4px 10px;border-radius:6px;border:none;background:#4caf50;color:#fff;cursor:pointer;font-size:13px;">Copy</button>
                            <button id="note-detail-share-btn" title="ShareContent" style="padding:4px 10px;border-radius:6px;border:none;background:#2196f3;color:#fff;cursor:pointer;font-size:13px;">Share</button>
                        </div>
                    </div>
                    <div class="note-form-group">
                        <div id="note-detail-content" style="padding: 12px; background-color: var(--card-bg-color, #f8f9fa); border-radius: 8px; border: 1px solid var(--border-color, #e0e0e0); min-height: 100px; max-height: 400px; overflow-y: auto;">
                            ${this.renderNoteContent(note.content)}
                        </div>
                    </div>
                    ${note.tags && note.tags.length > 0 ? `
                    <div class="note-form-group">
                        <label>Label</label>
                        <div class="note-form-tags">
                            ${note.tags.map(tag => `<span class="note-tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    <div class="note-form-group">
                        <label>Create time</label>
                        <div style="color: var(--text-secondary-color, #666666);">
                            ${new Date(note.createTime).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    ${note.updateTime && note.updateTime !== note.createTime ? `
                    <div class="note-form-group">
                        <label>Update time</label>
                        <div style="color: var(--text-secondary-color, #666666);">
                            ${new Date(note.updateTime).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-detail-close-btn">Close</button>
                    <button class="note-modal-btn primary" id="note-detail-edit-btn">Edit</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定Things
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
        // Search功能
        function highlightKeyword(keyword, html) {
            if (!keyword) return html;
            // 只high亮文本节点
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
                contentDiv.innerHTML = '<div style="color:#d32f2f;padding:24px 0;text-align:center;">未找到相关Content</div>';
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
        // Copy按钮Things绑定修复
        setTimeout(() => {
            const copyBtn = modal.querySelector('#note-detail-copy-btn');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    // 组装带emoji的完整Notes信息
                    let text = '';
                    text += `📒 Title：${note.title}\n`;
                    text += `📝 Content：${note.content}\n`;
                    if (note.tags && note.tags.length > 0) {
                        text += `🏷️ Label：${note.tags.join(', ')}\n`;
                    }
                    text += `⏰ Create time：${new Date(note.createTime).toLocaleString('zh-CN')}\n`;
                    if (note.updateTime && note.updateTime !== note.createTime) {
                        text += `🔄 Update time：${new Date(note.updateTime).toLocaleString('zh-CN')}\n`;
                    }
                    text += `✨有数规划（电脑版）日程，祝你生活愉快！`;
                    const setCopied = () => {
                        const oldText = copyBtn.textContent;
                        copyBtn.textContent = '已Copy✓';
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
                                UIManager.showNotification('Content已Copy', 'success');
                            } else {
                                alert('Content已Copy');
                            }
                        }).catch(() => {
                            alert('Copy失败，请手动Copy');
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
                                UIManager.showNotification('Content已Copy', 'success');
                            } else {
                                alert('Content已Copy');
                            }
                        } catch (e) {
                            alert('Copy失败，请手动Copy');
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
                UIManager && UIManager.showNotification ? UIManager.showNotification('当前浏览器不支持系统Share', 'warning') : alert('当前浏览器不支持系统Share');
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
                    <h3>Text import into Notes</h3>
                    <button class="note-modal-close" id="note-import-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>Import format description:</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            Title | Contents | Label1,Label2<br>
                            For example:<br>
                            Proceedings | Item progress was discussed today... | Work,meetings <br>
                            Learn Notes | Learned JavaScript... | Learn, code
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-import-text">Import content：</label>
                        <textarea id="note-import-text" class="note-form-textarea" 
                                  placeholder="Please enter Notes content in the above format, one Notes per line"></textarea>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-import-cancel">Cancel</button>
                    <button class="note-modal-btn primary" id="note-import-confirm">Import</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定Things
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
     * 导入Notes
     */
    importNotes(modal) {
        const textarea = modal.querySelector('#note-import-text');
        const content = textarea.value.trim();
        
        if (!content) {
            UIManager.showNotification('请输入要导入的Content', 'warning');
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
        UIManager.showNotification(`成功导入 ${successCount} 个Notes`, 'success');
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
                    <h3>Import files into Notes</h3>
                    <button class="note-modal-close" id="note-file-import-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>Supported file formats:</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            • Markdown (.md) - Supports formatting and linking<br>
                            • Word Documents (.docx, .doc) - Automatically extract text content<br>
                            • Plain text (.txt) - Import text content directly<br>
                            • Multiple files can be imported at the same time
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-file-input">Select:</label>
                        <input type="file" id="note-file-input" class="note-form-input" 
                               accept=".md,.docx,.doc,.txt" multiple>
                        <p class="input-hint">Supported file formats:.md, .docx, .doc, .txt</p>
                    </div>
                    <div class="note-form-group">
                        <label>Import Preview:</label>
                        <div id="file-import-preview" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 12px; background-color: var(--card-bg-color, #f8f9fa);">
                            <p style="color: var(--text-secondary-color, #999999); text-align: center;">A preview will appear after selecting the file</p>
                        </div>
                    </div>
                </div>
                <div class="note-modal-actions">
                    <button class="note-modal-btn secondary" id="note-file-import-cancel">Cancel</button>
                    <button class="note-modal-btn primary" id="note-file-import-confirm" disabled>Import</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // 绑定Things
        const closeBtn = modal.querySelector('#note-file-import-close');
        const cancelBtn = modal.querySelector('#note-file-import-cancel');
        const confirmBtn = modal.querySelector('#note-file-import-confirm');
        const fileInput = modal.querySelector('#note-file-input');
        const preview = modal.querySelector('#file-import-preview');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // 文件SelectThings
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
     * 处理文件Select
     */
    async handleFileSelection(files, preview, confirmBtn) {
        if (!files || files.length === 0) {
            preview.innerHTML = '<p style="color: var(--text-secondary-color, #999999); text-align: center;">A preview will appear after selecting the file</p>';
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
     * 解析文件Content
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
                throw new Error(`Unsupported file formats: ${extension}`);
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
                    // 提取Title（第一个#开头的行）
                    const titleMatch = content.match(/^#\s+(.+)$/m);
                    const title = titleMatch ? titleMatch[1].trim() : file.name.replace('.md', '');
                    
                    // 提取Label（从文件名或Contentmedium）
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
            reader.onerror = () => reject(new Error('Error reading file'));
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
            throw new Error(`DOCX file parsing failed: ${error.message}`);
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
                    reject(new Error(`DOC file parsing failed: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read the file'));
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
            reader.onerror = () => reject(new Error('Failed to read the file'));
            reader.readAsText(file);
        });
    },

    /**
     * 从Contentmedium提取Title
     */
    extractTitleFromContent(content) {
        // 查找第一行非空Content作为Title
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // 如果第一行太长，截取前50个字符
            return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        }
        return null;
    },

    /**
     * 从Contentmedium提取Label
     */
    extractTagsFromContent(content) {
        const tags = [];
        
        // 查找#Label
        const hashTags = content.match(/#(\w+)/g);
        if (hashTags) {
            tags.push(...hashTags.map(tag => tag.substring(1)));
        }
        
        // 查找[Label]格式
        const bracketTags = content.match(/\[([^\]]+)\]/g);
        if (bracketTags) {
            tags.push(...bracketTags.map(tag => tag.substring(1, tag.length - 1)));
        }
        
        return tags.slice(0, 5); // 最多5个Label
    },

    /**
     * 从二进制数据medium提取文本（用于DOC文件）
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
                        <strong>Title:</strong> ${this.escapeHtml(fileInfo.content.title)}
                    </div>
                    <div style="color: var(--text-secondary-color, #666666); margin-bottom: 5px;">
                        <strong>Label:</strong> ${fileInfo.content.tags.length > 0 ? fileInfo.content.tags.map(tag => `<span style="background-color: var(--primary-color-light, rgba(66, 133, 244, 0.1)); color: var(--primary-color, #4285f4); padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px;">${this.escapeHtml(tag)}</span>`).join('') : 'Empty'}
                    </div>
                    <div style="color: var(--text-secondary-color, #666666);">
                        <strong>Content:</strong> ${this.escapeHtml(fileInfo.content.content.substring(0, 100))}${fileInfo.content.content.length > 100 ? '...' : ''}
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
            UIManager.showNotification('Select the files you want to import', 'warning');
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
            UIManager.showNotification(`${successCount} Notes`, 'success');
            
        } catch (error) {
            console.error('Import Notes Error: ', error);
            UIManager.showNotification(`Import Notes Error: ${error.message}`, 'error');
        }
    },

    /**
     * 显示文本Edit模态框
     */
    showEditModal() {
        const data = StorageManager.getData();
        const notes = data.notes || [];
        
        if (notes.length === 0) {
            UIManager.showNotification('No Notes to Edit', 'warning');
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
                    <h3>文本EditNotes</h3>
                    <button class="note-modal-close" id="note-edit-close">&times;</button>
                </div>
                <div class="note-modal-body">
                    <div class="note-form-group">
                        <label>Edit format description：</label>
                        <div style="background-color: var(--card-bg-color, #f8f9fa); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-secondary-color, #666666);">
                            Title | Content | Label1,Label2<br>
                            One Note per line, click Save to update after editing
                        </div>
                    </div>
                    <div class="note-form-group">
                        <label for="note-edit-text">EditContent：</label>
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
        
        // 绑定Things
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
     * Edit notes
     */
    editNotes(modal) {
        const textarea = modal.querySelector('#note-edit-text');
        const content = textarea.value.trim();
        
        if (!content) {
            UIManager.showNotification('Please enter the Notes content', 'warning');
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
        UIManager.showNotification(`Edit ${successCount} Notes`, 'success');
    },

    /**
     * 切换到Edit模式
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
     * 渲染NotesContent（支持Markdown）
     */
    renderNoteContent(content) {
        if (!content || !content.trim()) {
            return '<p style="color: var(--text-secondary-color, #999999); font-style: italic;">暂EmptyContent</p>';
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

// 页面加载Completed后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他管理器初始化Completed
    setTimeout(() => {
        NotesManager.init();
    }, 500);
});

// 导出到全局作用域
window.NotesManager = NotesManager; 