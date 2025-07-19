// 渲染章节列表
function renderChapters() {
    const grid = document.getElementById('chapters-grid');
    grid.innerHTML = '';
    
    // 绑定搜索事件
    document.getElementById('chapters-search').oninput = debounce(() => {
        searchChapters();
    }, 300);
    
    // 获取收藏章节
    let favoriteChapters = JSON.parse(localStorage.getItem('favoriteChapters') || '[]');
    
    // 章节排序：收藏的在前，未收藏的在后
    const sortedChapterNames = Object.keys(chapters).sort((a, b) => {
        const aFav = favoriteChapters.includes(a) ? 1 : 0;
        const bFav = favoriteChapters.includes(b) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return a.localeCompare(b, 'zh-CN'); // 中文顺序
    });
    // 只看收藏筛选
    const filteredChapterNames = showOnlyFavorite ? sortedChapterNames.filter(name => favoriteChapters.includes(name)) : sortedChapterNames;
    filteredChapterNames.forEach(chapterName => {
        const chapterQuestions = chapters[chapterName];
        const completedCount = getCompletedCount(chapterName);
        const totalCount = getChapterTotalQuestions(chapterName);
        const progress = (completedCount / totalCount) * 100;
        const chapterTags = getTags(chapterName);
        const isFavorite = favoriteChapters.includes(chapterName);
        
        const card = document.createElement('div');
        card.className = 'chapter-card';
        
        // 生成标签HTML
        const tagsHtml = chapterTags.map(tag => `
            <span class="chapter-tag">
                ${tag}
                <i class="fas fa-times" onclick="removeTag('${chapterName}', '${tag}', event)"></i>
            </span>
        `).join('');
        
        card.innerHTML = `
            <div class="chapter-content" onclick="startChapterPractice('${chapterName}')">
                <div class="chapter-title">${chapterName}
                    <span class="favorite-btn" onclick="toggleFavoriteChapter(event, '${chapterName}')" style="margin-left:8px; cursor:pointer;">
                        <i class="fas fa-star" style="color:${isFavorite ? '#ffd700' : '#ccc'};"></i>
                    </span>
                    <span class="rename-btn" onclick="renameChapter(event, '${chapterName}')" style="margin-left:8px; cursor:pointer;">
                        <i class="fas fa-edit" style="color:#667eea;"></i>
                    </span>
                </div>
                <div class="chapter-info">共 ${totalCount} 题 • 已学会完成 ${completedCount} 题</div>
                <div class="chapter-progress">
                    <div class="chapter-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div style="color: #667eea; font-size: 14px; margin-top: 5px;">学会程度: ${Math.round(progress)}%</div>
                <div class="chapter-tags">${tagsHtml}</div>
            </div>
            <div class="chapter-actions">
                <button class="share-chapter-btn" onclick="exportChapter('${chapterName}', event)" title="分享题目">
                    <i class="fas fa-share-alt"></i>
                    <span>分享</span>
                </button>
                <button class="tag-chapter-btn" onclick="addChapterTag('${chapterName}', event)" title="添加标签">
                    <i class="fas fa-tag"></i>
                    <span>标签</span>
                </button>
                <button class="edit-chapter-btn" onclick="editChapterTags('${chapterName}', event)" title="修改标签">
                    <i class="fas fa-edit"></i>
                    <span>编辑标签</span>
                </button>
                <button class="delete-chapter-btn" onclick="deleteChapter('${chapterName}', event)" title="删除章节">
                    <i class="fas fa-trash"></i>
                    <span>删除</span>
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// 删除章节
function deleteChapter(chapterName, event) {
    event.stopPropagation(); // 阻止事件冒泡
    
    if (confirm(`确定要删除章节"${chapterName}"吗？此操作不可恢复。`)) {
        // 删除章节
        delete chapters[chapterName];
        
        // 删除相关的练习记录
        practiceRecords = practiceRecords.filter(record => record.chapter !== chapterName);
        
        // 删除相关的错题记录
        wrongQuestions = wrongQuestions.filter(question => question.chapter !== chapterName);
        
        // 保存数据
        saveData();
        
        // 重新渲染章节列表
        renderChapters();
        updateStats();
    }
}

// 返回章节选择
function returnToChapters() {
    if (confirm('确定要返回章节选择吗？')) {
        // 保存当前题目的高亮和笔记
        saveCurrentReadingHighlights();
        
        stopTimer();
        
        // 保存当前学会程度
        if (currentQuestionIndex >= 0) {
            // 计算当前已完成的题目数和正确数
            let completedCount = 0;
            let correctCount = 0;
            const results = [];
            
            for (let i = 0; i <= currentQuestionIndex; i++) {
                if (userAnswers[i] !== undefined) {
                    completedCount++;
                    const isCorrect = userAnswers[i] === currentQuestions[i].answer;
                    if (isCorrect) {
                        correctCount++;
                    }
                    
                    // 记录每道题的结果
                    results.push({
                        question: currentQuestions[i],
                        userAnswer: userAnswers[i],
                        isCorrect: isCorrect
                    });
                    
                    // 如果答错了，添加到错题本
                    if (!isCorrect) {
                        const existingWrongQuestion = wrongQuestions.find(q => q.question === currentQuestions[i].question);
                        if (existingWrongQuestion) {
                            existingWrongQuestion.errorCount = (existingWrongQuestion.errorCount || 1) + 1;
                            existingWrongQuestion.lastErrorTime = Date.now();
                            existingWrongQuestion.userAnswer = userAnswers[i];
                        } else {
                            wrongQuestions.push({
                                ...currentQuestions[i],
                                userAnswer: userAnswers[i],
                                timestamp: Date.now(),
                                lastErrorTime: Date.now(),
                                errorCount: 1,
                                chapter: currentChapter
                            });
                        }
                    }
                }
            }
            
            // 只有当至少完成一道题时才记录练习记录
            if (completedCount > 0) {
                // 更新练习记录
                const record = {
                    chapter: currentChapter,
                    totalQuestions: completedCount,
                    completedCount: completedCount,
                    correctCount: correctCount,
                    accuracy: Math.round((correctCount / completedCount) * 100) || 0,
                    timestamp: Date.now(),
                    duration: Date.now() - startTime,
                    results: results
                };
                
                // 添加到练习记录
                practiceRecords.unshift(record);
                
                // 保存数据
                saveData();
            }
        }
        
        // 显示导航栏
        if (window.innerWidth > 768) {
            document.querySelector('.desktop-header').style.display = 'block';
        } else {
            document.querySelector('.mobile-bottom-nav').style.display = 'block';
        }
        
        showPage('chapters');
        renderChapters();
        updateStats();
    }
}

// 检查题目是否已学会
function isQuestionLearned(question) {
    // 检查是否在练习记录中答对过
    for (const record of practiceRecords) {
        for (const result of record.results) {
            if (result.question.question === question.question && result.isCorrect) {
                return true;
            }
        }
    }
    
    return false;
}

// 显示跳过的题目详情
function showSkippedQuestionsDetails(learnedQuestions) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    
    // 添加标题
    const title = document.createElement('h2');
    title.textContent = '已跳过的题目';
    title.style.color = '#667eea';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);

    // 如果跳过的题目数等于总题目数，显示特殊提示
    if (learnedQuestions.length === chapters[currentChapter].length) {
        const specialMessage = document.createElement('div');
        specialMessage.style.textAlign = 'center';
        specialMessage.style.padding = '20px';
        specialMessage.style.marginBottom = '20px';
        specialMessage.style.backgroundColor = '#e6f3ff';
        specialMessage.style.borderRadius = '8px';
        specialMessage.innerHTML = `
            <h3 style="color: #667eea; margin-bottom: 10px;">🎉 太棒了！</h3>
            <p style="color: #4a5568; font-size: 16px;">本章节所有题目您都已经掌握，无需反复练习！</p>
        `;
        modalContent.appendChild(specialMessage);
    }
    
    // 添加每个跳过的题目
    learnedQuestions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.style.marginBottom = '30px';
        questionDiv.style.padding = '20px';
        questionDiv.style.backgroundColor = '#f8f9fa';
        questionDiv.style.borderRadius = '8px';
        
        // 题目序号和内容
        questionDiv.innerHTML = `
            <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #667eea;">第 ${index + 1} 题：</span>
                <span>${question.question}</span>
            </div>
            <div style="margin-bottom: 15px;">
                ${question.options.map((option, i) => `
                    <div style="margin: 5px 0; padding: 8px; background: ${i === question.answer ? '#e6f3ff' : '#fff'}; border-radius: 4px;">
                        ${String.fromCharCode(65 + i)}. ${option}
                        ${i === question.answer ? ' ✓' : ''}
                    </div>
                `).join('')}
            </div>
            ${question.explanation ? `
                <div style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 4px;">
                    <strong>解析：</strong>${question.explanation}
                </div>
            ` : ''}
        `;
        
        modalContent.appendChild(questionDiv);
    });
    
    // 添加继续做题按钮
    const continueButton = document.createElement('button');
    continueButton.className = 'btn btn-primary';
    continueButton.textContent = learnedQuestions.length === chapters[currentChapter].length ? '返回章节列表' : '继续做题';
    continueButton.style.marginTop = '20px';
    continueButton.onclick = () => {
        document.body.removeChild(modal);
        if (learnedQuestions.length === chapters[currentChapter].length) {
            // 如果所有题目都已掌握，直接返回章节列表
            showPage('chapters');
            renderChapters();
        } else {
            // 打乱题目顺序
            currentQuestions.sort(() => Math.random() - 0.5);
            // 隐藏导航栏
            if (window.innerWidth > 768) {
                document.querySelector('.desktop-header').style.display = 'none';
            } else {
                document.querySelector('.mobile-bottom-nav').style.display = 'none';
            }
            showPage('quiz');
            startTimer();
            renderQuestion();
        }
    };
    modalContent.appendChild(continueButton);
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.body.removeChild(modal);
        if (learnedQuestions.length === chapters[currentChapter].length) {
            // 如果所有题目都已掌握，直接返回章节列表
            showPage('chapters');
            renderChapters();
        } else {
            // 打乱题目顺序
            currentQuestions.sort(() => Math.random() - 0.5);
            // 隐藏导航栏
            if (window.innerWidth > 768) {
                document.querySelector('.desktop-header').style.display = 'none';
            } else {
                document.querySelector('.mobile-bottom-nav').style.display = 'none';
            }
            showPage('quiz');
            startTimer();
            renderQuestion();
        }
    };
    modalContent.appendChild(closeButton);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// 开始练习章节
function startChapterPractice(chapterName) {
    currentChapter = chapterName;
    // 展开阅读题（type: 'reading'）下的 questions
    currentQuestions = [];
    let readingBlocks = [];
    let normalQuestions = [];
    chapters[chapterName].forEach(item => {
        if (item.type === 'reading' && Array.isArray(item.questions)) {
            // 记录阅读题块的起止索引
            const startIdx = currentQuestions.length;
            item.questions.forEach(q => {
                currentQuestions.push({
                    ...q,
                    reading: item.reading,
                    readingType: true // 标记为阅读题子题
                });
            });
            const endIdx = currentQuestions.length - 1;
            readingBlocks.push([startIdx, endIdx]);
        } else {
            normalQuestions.push(item);
        }
    });
    // 只对普通题乱序，阅读题块保持原顺序和连续性
    if (normalQuestions.length > 1) {
        normalQuestions.sort(() => Math.random() - 0.5);
    }
    // 合并普通题和阅读题块，保证阅读题块顺序不变
    let mergedQuestions = [];
    let normalIdx = 0;
    let readingIdx = 0;
    for (let i = 0; i < chapters[chapterName].length; i++) {
        const item = chapters[chapterName][i];
        if (item.type === 'reading' && Array.isArray(item.questions)) {
            // 按原顺序插入阅读题块
            const block = currentQuestions.slice(readingBlocks[readingIdx][0], readingBlocks[readingIdx][1] + 1);
            mergedQuestions = mergedQuestions.concat(block);
            readingIdx++;
        } else {
            mergedQuestions.push(normalQuestions[normalIdx]);
            normalIdx++;
        }
    }
    currentQuestions = mergedQuestions;
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(undefined);
    startTime = Date.now();
    // 检查是否有已学会的题目，且跳过功能已开启
    const learnedQuestions = currentQuestions.filter(q => isQuestionLearned(q));
    if (learnedQuestions.length > 0 && isSkipEnabled()) {
        if (confirm(`该章节有 ${learnedQuestions.length} 道已学会的题目，是否跳过这些题目？`)) {
            // 过滤掉已学会的题目
            currentQuestions = currentQuestions.filter(q => !isQuestionLearned(q));
            userAnswers = new Array(currentQuestions.length).fill(undefined);
            // 显示跳过的题目详情
            showSkippedQuestionsDetails(learnedQuestions);
            return; // 等待用户点击继续做题按钮
        }
    }
    // 只对普通题乱序，阅读题块已处理
    // 隐藏导航栏
    if (window.innerWidth > 768) {
        document.querySelector('.desktop-header').style.display = 'none';
    } else {
        document.querySelector('.mobile-bottom-nav').style.display = 'none';
    }
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 练习所有错题
function practiceAllWrongQuestions() {
    if (wrongQuestions.length === 0) {
        alert('暂无错题记录！');
        return;
    }
    
    currentChapter = '错题练习';
    currentQuestions = [...wrongQuestions];
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(undefined);
    startTime = Date.now();
    
    // 打乱题目顺序
    currentQuestions.sort(() => Math.random() - 0.5);
    
    // 隐藏导航栏
    if (window.innerWidth > 768) {
        document.querySelector('.desktop-header').style.display = 'none';
    } else {
        document.querySelector('.mobile-bottom-nav').style.display = 'none';
    }
    
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 练习高频错题
function practiceFrequentWrongQuestions() {
    if (wrongQuestions.length === 0) {
        alert('暂无错题记录！');
        return;
    }
    
    // 按错误次数排序
    const sortedQuestions = [...wrongQuestions].sort((a, b) => {
        const countA = a.errorCount || 1;
        const countB = b.errorCount || 1;
        return countB - countA;
    });
    
    // 取错误次数最多的前20题
    const frequentQuestions = sortedQuestions.slice(0, 20);
    
    currentChapter = '高频错题练习';
    currentQuestions = frequentQuestions;
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(undefined);
    startTime = Date.now();
    
    // 打乱题目顺序
    currentQuestions.sort(() => Math.random() - 0.5);
    
    // 隐藏导航栏
    if (window.innerWidth > 768) {
        document.querySelector('.desktop-header').style.display = 'none';
    } else {
        document.querySelector('.mobile-bottom-nav').style.display = 'none';
    }
    
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 渲染当前题目
function renderQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    // 判断是否多选题
    const isMultiple = Array.isArray(question.answer) || question.type === 'multiple';
    const isBlank = question.type === 'blank';
    // 判断是否为阅读题子题
    const readingMaterial = question.reading;
    // 更新学会程度
    document.getElementById('quiz-progress').textContent = 
        `第 ${currentQuestionIndex + 1} 题 / 共 ${currentQuestions.length} 题`;
    // 更新题目内容
    let html = '';
    if (readingMaterial) {
        let highlightHtml = getReadingHighlights(currentChapter, readingMaterial);
        const isDarkMode = document.body.classList.contains('theme-dark');
        const bgColor = isDarkMode ? '#2d3748' : '#f8f9fa';
        const textColor = isDarkMode ? '#e2e8f0' : '#444';
        html += `<div class='reading-material' id='reading-material' style='background:${bgColor};padding:16px 18px 12px 18px;border-radius:8px;margin-bottom:18px;white-space:pre-line;color:${textColor};position:relative;'>${highlightHtml || readingMaterial}</div>`;
    }
    if (isBlank) {
        // 填空题，将___替换为input
        let blankValue = userAnswers[currentQuestionIndex] || '';
        let replaced = false;
        html += question.question.replace(/_{3,}/g, function() {
            replaced = true;
            return `<input type='text' class='blank-input' style='display:inline-block;width:100px;padding:2px 6px;margin:0 4px;border:1px solid #ccc;border-radius:4px;font-size:1em;' value="${blankValue}" oninput="window.setBlankAnswer && window.setBlankAnswer(this.value)">`;
        });
        // 若题干未出现___，则在末尾补一个输入框
        if (!replaced) {
            html += `<input type='text' class='blank-input' style='display:inline-block;width:100px;padding:2px 6px;margin:0 4px;border:1px solid #ccc;border-radius:4px;font-size:1em;' value="${blankValue}" oninput="window.setBlankAnswer && window.setBlankAnswer(this.value)">`;
        }
        // 兼容移动端输入法
        window.setBlankAnswer = function(val) {
            userAnswers[currentQuestionIndex] = val;
            updateQuizButtons();
        };
    } else {
        html += question.question + (isMultiple ? '（多选）' : '');
    }
    document.getElementById('question-text').innerHTML = html;
    // 渲染选项
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    if (!isBlank) {
        const fragment = document.createDocumentFragment();
        question.options.forEach((option, index) => {
            const li = document.createElement('li');
            li.className = 'option-item';
            if (isMultiple) {
                // 多选题
                const selectedArr = userAnswers[currentQuestionIndex] || [];
                if (selectedArr.includes(index)) {
                    li.classList.add('selected');
                }
                li.onclick = () => selectOption(index, true);
            } else {
                // 单选题
                if (userAnswers[currentQuestionIndex] === index) {
                    li.classList.add('selected');
                }
                li.onclick = () => selectOption(index, false);
            }
            li.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            fragment.appendChild(li);
        });
        optionsList.appendChild(fragment);
    }
    updateQuizButtons();
    // 阅读材料高亮和笔记功能
    if (readingMaterial) {
        const readingDiv = document.getElementById('reading-material');
        if (readingDiv) {
            readingDiv.onmouseup = function(e) {
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText.length > 0) {
                    showHighlightMenu(e, selectedText, readingDiv);
                }
            };
            
            // 重新绑定笔记span点击事件
            Array.from(readingDiv.querySelectorAll('span[title]')).forEach(span => {
                span.onclick = function(e) {
                    e.stopPropagation();
                    alert('笔记：' + (span.title || ''));
                };
            });
            
            // 监听高亮/笔记变化，实时保存
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        saveReadingHighlights(currentChapter, readingMaterial, readingDiv.innerHTML);
                    }
                });
            });
            
            observer.observe(readingDiv, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'title']
            });
            
            // 更新高亮的主题适配
            updateHighlightTheme();
        }
    }
}

function selectOption(index, isMultiple) {
    if (isMultiple) {
        let selectedArr = userAnswers[currentQuestionIndex] || [];
        if (selectedArr.includes(index)) {
            selectedArr = selectedArr.filter(i => i !== index);
        } else {
            selectedArr = [...selectedArr, index];
        }
        userAnswers[currentQuestionIndex] = selectedArr;
        // 更新UI
        document.querySelectorAll('.option-item').forEach((item, idx) => {
            if (selectedArr.includes(idx)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    } else {
        // 单选
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.option-item')[index].classList.add('selected');
        userAnswers[currentQuestionIndex] = index;
    }
    updateQuizButtons();
}

function updateQuizButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const checkBtn = document.getElementById('check-btn');
    const submitBtn = document.getElementById('submit-btn');
    const skipBtn = document.getElementById('skip-btn');
    const question = currentQuestions[currentQuestionIndex];
    const isMultiple = Array.isArray(question.answer) || question.type === 'multiple';
    const isBlank = question.type === 'blank';
    // 上一题按钮
    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    // 跳过按钮 - 只在未答题时显示
    if (isBlank) {
        skipBtn.style.display = !userAnswers[currentQuestionIndex] ? 'block' : 'none';
    } else if (isMultiple) {
        skipBtn.style.display = (!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].length === 0) ? 'block' : 'none';
    } else {
        skipBtn.style.display = userAnswers[currentQuestionIndex] === undefined ? 'block' : 'none';
    }
    // 下一题按钮 - 只在已答题且不是最后一题时显示
    if (isBlank) {
        nextBtn.style.display = (userAnswers[currentQuestionIndex] && currentQuestionIndex < currentQuestions.length - 1) ? 'block' : 'none';
    } else if (isMultiple) {
        nextBtn.style.display = (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].length > 0 && currentQuestionIndex < currentQuestions.length - 1) ? 'block' : 'none';
    } else {
        nextBtn.style.display = (userAnswers[currentQuestionIndex] !== undefined && currentQuestionIndex < currentQuestions.length - 1) ? 'block' : 'none';
    }
    // 检查按钮
    if (isBlank) {
        checkBtn.style.display = userAnswers[currentQuestionIndex] ? 'block' : 'none';
    } else if (isMultiple) {
        checkBtn.style.display = (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].length > 0) ? 'block' : 'none';
    } else {
        checkBtn.style.display = userAnswers[currentQuestionIndex] !== undefined ? 'block' : 'none';
    }
    // 提交按钮 - 在最后一题且已答题时显示
    if (isBlank) {
        submitBtn.style.display = (currentQuestionIndex === currentQuestions.length - 1 && userAnswers[currentQuestionIndex]) ? 'block' : 'none';
    } else if (isMultiple) {
        submitBtn.style.display = (currentQuestionIndex === currentQuestions.length - 1 && userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].length > 0) ? 'block' : 'none';
    } else {
        submitBtn.style.display = (currentQuestionIndex === currentQuestions.length - 1 && userAnswers[currentQuestionIndex] !== undefined) ? 'block' : 'none';
    }
}

function checkAnswer() {
    // 保存当前题目的高亮和笔记
    saveCurrentReadingHighlights();
    
    const question = currentQuestions[currentQuestionIndex];
    const isMultiple = Array.isArray(question.answer) || question.type === 'multiple';
    const isBlank = question.type === 'blank';
    const userAnswer = userAnswers[currentQuestionIndex];
    const options = document.querySelectorAll('.option-item');
    const checkBtn = document.getElementById('check-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const prevBtn = document.getElementById('prev-btn');
    // 移除所有选项的样式
    if (!isBlank) {
        options.forEach(option => {
            option.classList.remove('correct', 'wrong');
        });
        // 标记正确答案
        if (isMultiple) {
            (question.answer || []).forEach(idx => {
                options[idx].classList.add('correct');
            });
        } else {
            options[question.answer].classList.add('correct');
        }
    }
    // 判断是否答错
    let isCorrect = false;
    if (isBlank) {
        // 填空题判分，去除前后空格，严格等于
        const stdAns = (question.answer || '').replace(/\s+/g, '');
        const userAns = (userAnswer || '').replace(/\s+/g, '');
        isCorrect = userAns.length > 0 && userAns === stdAns;
    } else if (isMultiple) {
        // 多选题：答案数组完全一致
        if (Array.isArray(userAnswer) && Array.isArray(question.answer)) {
            const sortedUser = [...userAnswer].sort();
            const sortedAns = [...question.answer].sort();
            isCorrect = sortedUser.length === sortedAns.length && sortedUser.every((v, i) => v === sortedAns[i]);
        }
    } else {
        isCorrect = userAnswer === question.answer;
    }
    if (!isCorrect && (
        (isBlank && userAnswer && userAnswer.length > 0) ||
        (isMultiple ? userAnswer.length > 0 : userAnswer !== -1)
    )) {
        if (isBlank) {
            // 填空题高亮输入框
            const input = document.querySelector('.blank-input');
            if (input) {
                input.style.borderColor = '#dc3545';
                input.style.background = '#ffeaea';
            }
        } else if (isMultiple) {
            (userAnswer || []).forEach(idx => {
                if (!(question.answer || []).includes(idx)) {
                    options[idx].classList.add('wrong');
                }
            });
        } else {
            options[userAnswer].classList.add('wrong');
        }
        // 添加到错题本
        const existingWrongQuestion = wrongQuestions.find(q => q.question === question.question);
        if (existingWrongQuestion) {
            existingWrongQuestion.errorCount = (existingWrongQuestion.errorCount || 1) + 1;
            existingWrongQuestion.lastErrorTime = Date.now();
            existingWrongQuestion.userAnswer = userAnswer;
        } else {
            wrongQuestions.push({
                ...question,
                userAnswer: userAnswer,
                timestamp: Date.now(),
                lastErrorTime: Date.now(),
                errorCount: 1,
                chapter: currentChapter
            });
        }
        saveData();
    }
    if (isBlank && isCorrect) {
        // 正确高亮
        const input = document.querySelector('.blank-input');
        if (input) {
            input.style.borderColor = '#28a745';
            input.style.background = '#e8f5e9';
        }
    }
    // 禁用所有选项
    if (!isBlank) {
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });
    } else {
        const input = document.querySelector('.blank-input');
        if (input) input.disabled = true;
    }
    // 禁用所有按钮
    checkBtn.disabled = true;
    checkBtn.style.opacity = '0.5';
    nextBtn.disabled = true;
    submitBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
    submitBtn.style.opacity = '0.5';
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.5';
    // 显示解析
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'explanation-box';
    explanationDiv.innerHTML = `
        <div class="explanation-title">解析：</div>
        <div class="explanation-content">${question.explanation || '暂无解析'}</div>
    `;
    // 插入到.question-card最后，兼容阅读题
    const qCard = document.querySelector('.question-card');
    if (qCard) qCard.appendChild(explanationDiv);
    // 倒计时
    let countdown = 5;
    const countdownInterval = setInterval(() => {
        countdown--;
        checkBtn.textContent = `检查答案 (${countdown}s)`;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            explanationDiv.remove();
            checkBtn.disabled = false;
            checkBtn.style.opacity = '1';
            checkBtn.textContent = '检查答案';
            nextBtn.disabled = false;
            submitBtn.disabled = false;
            nextBtn.style.opacity = '1';
            submitBtn.style.opacity = '1';
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            if (!isBlank) {
                options.forEach(option => {
                    option.style.pointerEvents = 'auto';
                });
                options.forEach(option => {
                    option.classList.remove('correct', 'wrong');
                });
                // 恢复选中状态
                if (isMultiple) {
                    (userAnswer || []).forEach(idx => {
                        options[idx].classList.add('selected');
                    });
                } else if (userAnswer !== undefined) {
                    options[userAnswer].classList.add('selected');
                }
            } else {
                const input = document.querySelector('.blank-input');
                if (input) {
                    input.disabled = false;
                    input.style.borderColor = '#ccc';
                    input.style.background = '';
                }
            }
        }
    }, 1000);
}

// 下一题
function nextQuestion() {
    if (userAnswers[currentQuestionIndex] === undefined) {
        alert('请选择一个答案');
        return;
    }
    
    // 保存当前题目的高亮和笔记
    saveCurrentReadingHighlights();
    
    currentQuestionIndex++;
    renderQuestion();
}

// 上一题
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        // 保存当前题目的高亮和笔记
        saveCurrentReadingHighlights();
        
        currentQuestionIndex--;
        renderQuestion();
        
        // 恢复之前的选择
        const selectedAnswer = userAnswers[currentQuestionIndex];
        if (selectedAnswer !== undefined) {
            const options = document.querySelectorAll('.option-item');
            options[selectedAnswer].classList.add('selected');
        }
    }
}

// 提交答案
function submitAnswer() {
    if (userAnswers[currentQuestionIndex] === undefined) {
        alert('请选择一个答案');
        return;
    }
    
    if (confirm('确定要提交答案吗？提交后将无法修改。')) {
        // 保存当前题目的高亮和笔记
        saveCurrentReadingHighlights();
        finishQuiz();
    }
}

// 完成测试
function finishQuiz() {
    stopTimer();
    
    // 计算成绩
    let correctCount = 0;
    let completedCount = 0;
    let skippedCount = 0;
    const results = [];
    
    // 使用 for 循环替代 forEach 以提高性能
    for (let i = 0; i < currentQuestions.length; i++) {
        const question = currentQuestions[i];
        const userAnswer = userAnswers[i];
        
        if (userAnswer === -1) { // 跳过的题目
            skippedCount++;
            results.push({
                question: question,
                userAnswer: -1,
                isCorrect: false,
                isSkipped: true
            });
        } else if (userAnswer !== undefined) { // 已答题目
            completedCount++;
            let isCorrect = false;
            if (Array.isArray(userAnswer) && Array.isArray(question.answer)) {
                const sortedUser = [...userAnswer].sort();
                const sortedAns = [...question.answer].sort();
                isCorrect = sortedUser.length === sortedAns.length && sortedUser.every((v, i) => v === sortedAns[i]);
            } else {
                isCorrect = userAnswer === question.answer;
            }
            
            if (isCorrect) {
                correctCount++;
            } else {
                // 添加到错题本
                const existingWrongQuestion = wrongQuestions.find(q => q.question === question.question);
                if (existingWrongQuestion) {
                    existingWrongQuestion.errorCount = (existingWrongQuestion.errorCount || 1) + 1;
                    existingWrongQuestion.lastErrorTime = Date.now();
                    existingWrongQuestion.userAnswer = userAnswer;
                } else {
                    wrongQuestions.push({
                        ...question,
                        userAnswer: userAnswer,
                        timestamp: Date.now(),
                        lastErrorTime: Date.now(),
                        errorCount: 1,
                        chapter: currentChapter
                    });
                }
            }
            
            results.push({
                question: question,
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                isSkipped: false
            });
        }
    }
    
    // 只有当至少完成一道题时才记录练习记录
    if (completedCount > 0 || skippedCount > 0) {
        const record = {
            chapter: currentChapter,
            totalQuestions: currentQuestions.length,
            completedCount: completedCount,
            correctCount: correctCount,
            skippedCount: skippedCount,
            accuracy: Math.round((correctCount / completedCount) * 100) || 0,
            duration: Date.now() - startTime,
            timestamp: Date.now(),
            results: results
        };
        
        practiceRecords.unshift(record);
        
        // 保存数据
        saveData();
        
        // 显示完成页面
        showChapterComplete(record);
    } else {
        showPage('chapters');
        renderChapters();
        updateStats();
    }
}

// 显示章节完成页面
function showChapterComplete(record) {
    // 隐藏导航栏
    if (window.innerWidth > 768) {
        document.querySelector('.desktop-header').style.display = 'none';
    } else {
        document.querySelector('.mobile-bottom-nav').style.display = 'none';
    }
    
    // 更新完成页面数据
    document.getElementById('complete-chapter-name').textContent = record.chapter;
    document.getElementById('complete-total').textContent = record.totalQuestions;
    document.getElementById('complete-correct').textContent = record.correctCount;
    document.getElementById('complete-accuracy').textContent = record.accuracy + '%';
    
    const duration = Math.floor(record.duration / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    document.getElementById('complete-time').textContent = `${minutes}分${seconds}秒`;
    
    // 根据正确率显示不同的鼓励信息
    let message = '';
    if (record.accuracy >= 90) {
        message = '🎉 太棒了！你的表现非常出色！继续保持这样的学习热情！';
    } else if (record.accuracy >= 80) {
        message = '👍 做得很好！再努力一点就能达到优秀水平！';
    } else if (record.accuracy >= 60) {
        message = '📚 及格了！继续加油，相信你下次会做得更好！';
    } else {
        message = '💪 不要灰心，学习是一个渐进的过程。多复习，下次一定会进步！';
    }
    document.getElementById('complete-message').textContent = message;
    
    // 显示完成页面
    showPage('chapter-complete');
    
    // 倒计时
    let countdown = 3;
    const countdownElement = document.querySelector('.complete-countdown');
    countdownElement.textContent = `${countdown}秒后返回${record.chapter === '错题练习' || record.chapter === '高频错题练习' ? '错题本' : '章节选择'}...`;
    
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = `${countdown}秒后返回${record.chapter === '错题练习' || record.chapter === '高频错题练习' ? '错题本' : '章节选择'}...`;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            // 显示导航栏
            if (window.innerWidth > 768) {
                document.querySelector('.desktop-header').style.display = 'block';
            } else {
                document.querySelector('.mobile-bottom-nav').style.display = 'block';
            }
            
            // 根据练习类型决定返回的页面
            if (record.chapter === '错题练习' || record.chapter === '高频错题练习') {
                showPage('wrong-questions');
                renderWrongQuestions();
            } else {
                showPage('chapters');
                renderChapters();
            }
            updateStats();
        }
    }, 1000);
}

// 计时器相关
function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    document.getElementById('quiz-timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 获取章节完成题目数
function getCompletedCount(chapterName) {
    const chapterRecords = practiceRecords.filter(record => record.chapter === chapterName);
    const completedQuestions = new Set();
    chapterRecords.forEach(record => {
        record.results.forEach((result, index) => {
            if (result.isCorrect) {
                // 对于阅读题，题干唯一性可用"阅读材料+题干"
                if (result.question.reading) {
                    completedQuestions.add(result.question.reading + '||' + result.question.question);
                } else {
                    completedQuestions.add(result.question.question);
                }
            }
        });
    });
    return completedQuestions.size;
}

// 章节总题数统计（用于renderChapters等）
function getChapterTotalQuestions(chapterName) {
    let total = 0;
    chapters[chapterName].forEach(item => {
        if (item.type === 'reading' && Array.isArray(item.questions)) {
            total += item.questions.length;
        } else {
            total += 1;
        }
    });
    return total;
}

// 页面加载后初始化标签筛选
function initTagFilter() {
    const tagFilter = document.getElementById('tag-filter');
    if (!tagFilter) return;
    // 获取所有标签
    let allTags = [];
    Object.keys(tags).forEach(chapter => {
        allTags = allTags.concat(tags[chapter]);
    });
    allTags = Array.from(new Set(allTags));
    // 清空并添加选项
    tagFilter.innerHTML = '<option value="">全部标签</option>';
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

// 搜索章节以及相关标签和标签筛选
function searchChapters() {
    const searchText = document.getElementById('chapters-search').value.toLowerCase();
    const tagFilter = document.getElementById('tag-filter').value;
    const grid = document.getElementById('chapters-grid');
    const chapterCards = grid.getElementsByClassName('chapter-card');

    Array.from(chapterCards).forEach(card => {
        const chapterName = card.querySelector('.chapter-title').textContent.toLowerCase();
        // 获取标签内容
        const tagsDiv = card.querySelector('.chapter-tags');
        let tagText = '';
        let tagList = [];
        if (tagsDiv) {
            tagList = Array.from(tagsDiv.getElementsByClassName('chapter-tag')).map(tagEl => tagEl.textContent.trim());
            tagText = tagList.join(' ').toLowerCase();
        }
        // 搜索章节名或标签，并且标签筛选
        const matchSearch = chapterName.includes(searchText) || tagText.includes(searchText);
        const matchTag = !tagFilter || tagList.includes(tagFilter);
        if (matchSearch && matchTag) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// 重置章节筛选
function resetChapterFilters() {
    document.getElementById('chapters-search').value = '';
    document.getElementById('tag-filter').value = '';
    // 重置只看收藏
    showOnlyFavorite = false;
    const favBtn = document.getElementById('favorite-filter-btn');
    if (favBtn) {
        favBtn.classList.remove('active');
        favBtn.querySelector('i').style.color = '';
    }
    renderChapters();
}

// 修改renderChapters，渲染后刷新标签下拉框和绑定事件
const oldRenderChapters = renderChapters;
renderChapters = function() {
    oldRenderChapters();
    initTagFilter();
    document.getElementById('tag-filter').onchange = searchChapters;
};

// 页面初始化时也要初始化标签下拉框
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTagFilter();
        document.getElementById('tag-filter').onchange = searchChapters;
    });
} else {
    initTagFilter();
    document.getElementById('tag-filter').onchange = searchChapters;
}

// 章节筛选相关
let showOnlyFavorite = false;

// 只看收藏按钮事件
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const favBtn = document.getElementById('favorite-filter-btn');
        if (favBtn) {
            favBtn.onclick = function() {
                showOnlyFavorite = !showOnlyFavorite;
                favBtn.classList.toggle('active', showOnlyFavorite);
                favBtn.querySelector('i').style.color = showOnlyFavorite ? '#ffd700' : '';
                renderChapters();
            };
        }
    });
}

// 切换跳过功能
function toggleSkipFeature(checkbox) {
    localStorage.setItem('skipEnabled', checkbox.checked);
    saveData();
}

// 检查跳过功能是否启用
function isSkipEnabled() {
    return localStorage.getItem('skipEnabled') === 'true';
}

// 修改跳过题目函数
function skipQuestion() {
    if (!isSkipEnabled()) {
        alert('跳过功能未启用，请在设置中开启');
        return;
    }
    
    // 保存当前题目的高亮和笔记
    saveCurrentReadingHighlights();
    
    // 将当前题目的答案标记为已跳过
    userAnswers[currentQuestionIndex] = -1;
    
    // 更新按钮状态
    updateQuizButtons();
    
    // 如果是最后一题，询问是否提交
    if (currentQuestionIndex === currentQuestions.length - 1) {
        if (confirm('这是最后一道题，是否要提交答案？')) {
            submitAnswer();
        }
        return;
    }
    
    // 自动进入下一题
    currentQuestionIndex++;
    renderQuestion();
}

// 在页面加载时初始化跳过功能开关状态
document.addEventListener('DOMContentLoaded', function() {
    const skipToggle = document.getElementById('skip-toggle');
    if (skipToggle) {
        skipToggle.checked = isSkipEnabled();
    }
});

// 替换 exportChapter 为弹窗多方式分享
function exportChapter(chapterName, event) {
    event.stopPropagation();
    const chapterQuestions = chapters[chapterName];
    if (!chapterQuestions || chapterQuestions.length === 0) {
        alert('该章节没有题目！');
        return;
    }
    
    // 创建更美观的分享选择弹窗
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content share-modal" style="max-width:500px;padding:30px;">
            <div class="share-header">
                <h3 style="color:var(--text-color, #667eea);margin:0;font-size:20px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-share-alt" style="font-size:18px;color:#667eea;"></i>
                    选择分享方式
                </h3>
                <button class="modal-close" onclick="document.body.removeChild(this.parentNode.parentNode.parentNode)" style="background:none;border:none;font-size:24px;color:var(--text-secondary, #999);cursor:pointer;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all 0.3s ease;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="share-options" style="margin-top:25px;">
                <div class="share-option" id="share-txt" style="display:flex;align-items:center;gap:15px;padding:18px;border:2px solid #e8f0fe;border-radius:12px;cursor:pointer;transition:all 0.3s ease;margin-bottom:12px;">
                    <div class="share-icon" style="width:50px;height:50px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="share-info" style="flex:1;">
                        <div class="share-title" style="font-weight:bold;color:var(--text-primary, #333);margin-bottom:4px;">TXT文件分享</div>
                        <div class="share-desc" style="font-size:13px;color:var(--text-secondary, #666);">导出为文本文件，方便编辑和打印</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:var(--text-tertiary, #ccc);font-size:14px;"></i>
                </div>
                
                <div class="share-option" id="share-img" style="display:flex;align-items:center;gap:15px;padding:18px;border:2px solid #e8f0fe;border-radius:12px;cursor:pointer;transition:all 0.3s ease;margin-bottom:12px;">
                    <div class="share-icon" style="width:50px;height:50px;background:linear-gradient(135deg,#ff6b6b,#ee5a24);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">
                        <i class="fas fa-image"></i>
                    </div>
                    <div class="share-info" style="flex:1;">
                        <div class="share-title" style="font-weight:bold;color:var(--text-primary, #333);margin-bottom:4px;">图片分享</div>
                        <div class="share-desc" style="font-size:13px;color:var(--text-secondary, #666);">生成图片格式，适合社交媒体分享</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:var(--text-tertiary, #ccc);font-size:14px;"></i>
                </div>
                
                <div class="share-option" id="share-encrypt" style="display:flex;align-items:center;gap:15px;padding:18px;border:2px solid #e8f0fe;border-radius:12px;cursor:pointer;transition:all 0.3s ease;">
                    <div class="share-icon" style="width:50px;height:50px;background:linear-gradient(135deg,#20c997,#00b894);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div class="share-info" style="flex:1;">
                        <div class="share-title" style="font-weight:bold;color:var(--text-primary, #333);margin-bottom:4px;">加密文件分享</div>
                        <div class="share-desc" style="font-size:13px;color:var(--text-secondary, #666);">.roi格式，支持密码保护，安全可靠</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:var(--text-tertiary, #ccc);font-size:14px;"></i>
                </div>
            </div>
            
            <div class="share-footer" style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border-color, #eee);text-align:center;">
                <div style="font-size:13px;color:var(--text-secondary, #999);">共 ${chapterQuestions.length} 道题目</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 添加悬停效果
    const shareOptions = modal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('mouseenter', function() {
            this.style.borderColor = '#667eea';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(102,126,234,0.15)';
        });
        option.addEventListener('mouseleave', function() {
            this.style.borderColor = '#e8f0fe';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    // TXT分享
    modal.querySelector('#share-txt').onclick = function() {
        showShareLoading(modal, '正在生成TXT文件...');
        setTimeout(() => {
            let exportText = '';
            chapterQuestions.forEach((question, index) => {
                if (question.type === 'reading' && Array.isArray(question.questions)) {
                    exportText += `章节：${chapterName}\n`;
                    exportText += `题目：阅读下面文章，完成后面问题。\n`;
                    exportText += `阅读：${question.reading}\n`;
                    question.questions.forEach((q, idx) => {
                        exportText += `题目：${q.question}\n`;
                        if (q.options && q.options.length > 0) {
                            q.options.forEach((option, optIndex) => {
                                exportText += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
                            });
                        }
                        if (Array.isArray(q.answer)) {
                            exportText += `答案：${q.answer.map(idx => String.fromCharCode(65 + idx)).join('')}\n`;
                        } else {
                            exportText += `答案：${q.answer}\n`;
                        }
                        if (q.explanation) {
                            exportText += `解析：${q.explanation}\n`;
                        }
                        if (q.tags) {
                            exportText += `标签：${q.tags.join(',')}\n`;
                        }
                    });
                } else {
                    exportText += `章节：${chapterName}\n`;
                    exportText += `题目：${question.question}\n`;
                    if (question.options && question.options.length > 0) {
                        question.options.forEach((option, optIndex) => {
                            exportText += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
                        });
                    }
                    if (Array.isArray(question.answer)) {
                        exportText += `答案：${question.answer.map(idx => String.fromCharCode(65 + idx)).join('')}\n`;
                    } else {
                        exportText += `答案：${question.answer}\n`;
                    }
                    if (question.explanation) {
                        exportText += `解析：${question.explanation}\n`;
                    }
                    if (question.tags) {
                        exportText += `标签：${question.tags.join(',')}\n`;
                    }
                    exportText += '\n';
                }
            });
            const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${chapterName}_题目.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showShareSuccess(modal, 'TXT文件已生成并下载！');
        }, 800);
    };
    
    // 图片分享
    modal.querySelector('#share-img').onclick = function() {
        showShareLoading(modal, '正在生成图片...');
        setTimeout(() => {
            let exportText = '';
            chapterQuestions.forEach((question, index) => {
                if (question.type === 'reading' && Array.isArray(question.questions)) {
                    exportText += `章节：${chapterName}\n`;
                    exportText += `题目：阅读下面文章，完成后面问题。\n`;
                    exportText += `阅读：\n${question.reading}\n`;
                    question.questions.forEach((q, idx) => {
                        exportText += `题目：${q.question}\n`;
                        if (q.options && q.options.length > 0) {
                            q.options.forEach((option, optIndex) => {
                                exportText += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
                            });
                        }
                        if (Array.isArray(q.answer)) {
                            exportText += `答案：${q.answer.map(idx => String.fromCharCode(65 + idx)).join('')}\n`;
                        } else {
                            exportText += `答案：${q.answer}\n`;
                        }
                        if (q.explanation) {
                            exportText += `解析：${q.explanation}\n`;
                        }
                        if (q.tags) {
                            exportText += `标签：${q.tags.join(',')}\n`;
                        }
                    });
                } else {
                    exportText += `章节：${chapterName}\n`;
                    exportText += `题目：${question.question}\n`;
                    if (question.options && question.options.length > 0) {
                        question.options.forEach((option, optIndex) => {
                            exportText += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
                        });
                    }
                    if (Array.isArray(question.answer)) {
                        exportText += `答案：${question.answer.map(idx => String.fromCharCode(65 + idx)).join('')}\n`;
                    } else {
                        exportText += `答案：${question.answer}\n`;
                    }
                    if (question.explanation) {
                        exportText += `解析：${question.explanation}\n`;
                    }
                    if (question.tags) {
                        exportText += `标签：${question.tags.join(',')}\n`;
                    }
                    exportText += '\n';
                }
            });
            // 创建图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const lines = exportText.split('\n');
            ctx.font = '16px sans-serif';
            const lineHeight = 28;
            const width = 800;
            canvas.width = width;
            canvas.height = lineHeight * (lines.length + 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#222';
            lines.forEach((line, i) => {
                ctx.fillText(line, 24, 36 + i * lineHeight);
            });
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${chapterName}_题目.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showShareSuccess(modal, '图片已生成并下载！');
            });
        }, 1000);
    };
    
    // 加密.roi文件分享
    modal.querySelector('#share-encrypt').onclick = function() {
        const pwd = prompt('请输入分享文件的密码（可自定义，建议8-20位）：');
        if (!pwd || pwd.length < 3) { 
            alert('密码太短！'); 
            return; 
        }
        showShareLoading(modal, '正在生成加密文件...');
        setTimeout(() => {
            let exportObj = { chapter: chapterName, questions: chapterQuestions, time: Date.now(), encrypted: true };
            let dataStr = JSON.stringify(exportObj);
            // 简单加密（异或）
            let enc = '';
            for (let i = 0; i < dataStr.length; i++) {
                enc += String.fromCharCode(dataStr.charCodeAt(i) ^ pwd.charCodeAt(i % pwd.length));
            }
            const blob = new Blob([enc], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${chapterName}_题目.roi`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showShareSuccess(modal, '加密文件已生成并下载！');
        }, 600);
    };
}

// 显示分享加载状态
function showShareLoading(modal, message) {
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
        <div style="text-align:center;padding:40px;">
            <div class="loading-spinner" style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
            <div style="color:var(--text-color, #667eea);font-size:16px;font-weight:bold;">${message}</div>
            <div style="color:var(--text-secondary, #999);font-size:14px;margin-top:8px;">请稍候...</div>
        </div>
    `;
}

// 显示分享成功状态
function showShareSuccess(modal, message) {
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
        <div style="text-align:center;padding:40px;">
            <div style="width:60px;height:60px;background:#20c997;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:white;font-size:24px;">
                <i class="fas fa-check"></i>
            </div>
            <div style="color:#20c997;font-size:16px;font-weight:bold;">${message}</div>
            <button class="btn btn-primary" onclick="document.body.removeChild(this.parentNode.parentNode.parentNode)" style="margin-top:20px;">确定</button>
        </div>
    `;
}

function practiceWrongQuestion(questionText) {
    const wrongQ = wrongQuestions.find(q => q.question === questionText);
    if (wrongQ) {
        currentChapter = '错题练习';
        currentQuestions = [wrongQ];
        currentQuestionIndex = 0;
        userAnswers = [];
        startTime = Date.now();
        
        // 隐藏导航栏
        if (window.innerWidth > 768) {
            document.querySelector('.desktop-header').style.display = 'none';
        } else {
            document.querySelector('.mobile-bottom-nav').style.display = 'none';
        }
        
        showPage('quiz');
        startTimer();
        renderQuestion();
    }
}

function practiceChapterWrongQuestions(chapterName) {
    const chapterQuestions = wrongQuestions.filter(q => q.chapter === chapterName);
    
    if (chapterQuestions.length === 0) {
        alert('该章节暂无错题记录');
        return;
    }
    
    currentChapter = chapterName;
    currentQuestions = [...chapterQuestions];
    currentQuestionIndex = 0;
    userAnswers = [];
    startTime = Date.now();
    
    // 打乱题目顺序
    currentQuestions.sort(() => Math.random() - 0.5);
    
    // 隐藏导航栏
    if (window.innerWidth > 768) {
        document.querySelector('.desktop-header').style.display = 'none';
    } else {
        document.querySelector('.mobile-bottom-nav').style.display = 'none';
    }
    
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 添加章节标签
function addChapterTag(chapterName, event) {
    event.stopPropagation();
    const tagName = prompt('请输入标签名称（不超过20个字符）：');
    if (tagName && tagName.trim()) {
        const trimmedTag = tagName.trim();
        
        // 检查标签长度
        if (trimmedTag.length > 20) {
            alert('标签长度不能超过20个字符');
            return;
        }
        
        // 检查是否重复
        const currentTags = getTags(chapterName);
        if (currentTags.includes(trimmedTag)) {
            alert('该标签已存在');
            return;
        }
        
        addTag(chapterName, trimmedTag);
        renderChapters();
    }
}

// 编辑章节标签
function editChapterTags(chapterName, event) {
    event.stopPropagation();
    const currentTags = getTags(chapterName);
    const tagNames = currentTags.join('，');  // 使用中文逗号显示
    const newTags = prompt('请输入标签（用逗号、顿号或空格分隔）：', tagNames);
    
    if (newTags !== null) {
        try {
            // 删除所有现有标签
            currentTags.forEach(tag => removeTag(chapterName, tag));
            
            // 预处理：替换所有可能的分隔符为统一的分隔符
            let processedTags = newTags
                .replace(/[,，、\s]+/g, ',')  // 将中文逗号、顿号、空格都替换为英文逗号
                .replace(/^,|,$/g, '')        // 去除首尾的逗号
                .replace(/,+/g, ',');         // 将多个连续的逗号替换为单个逗号
            
            // 添加新标签
            const tags = processedTags.split(',');
            let addedCount = 0;
            let duplicateCount = 0;
            let emptyCount = 0;
            
            tags.forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag) {
                    // 检查标签长度
                    if (trimmedTag.length > 20) {
                        throw new Error(`标签"${trimmedTag}"长度超过20个字符`);
                    }
                    
                    // 检查是否重复
                    if (currentTags.includes(trimmedTag)) {
                        duplicateCount++;
                    } else {
                        addTag(chapterName, trimmedTag);
                        addedCount++;
                    }
                } else {
                    emptyCount++;
                }
            });
            
            // 显示处理结果
            let message = `成功添加 ${addedCount} 个标签`;
            if (duplicateCount > 0) {
                message += `\n跳过 ${duplicateCount} 个重复标签`;
            }
            if (emptyCount > 0) {
                message += `\n忽略 ${emptyCount} 个空标签`;
            }
            alert(message);
            
            renderChapters();
        } catch (error) {
            alert('错误：' + error.message);
            // 恢复原有标签
            currentTags.forEach(tag => addTag(chapterName, tag));
        }
    }
} 

// 收藏/取消收藏章节
function toggleFavoriteChapter(event, chapterName) {
    event.stopPropagation();
    let favoriteChapters = JSON.parse(localStorage.getItem('favoriteChapters') || '[]');
    if (favoriteChapters.includes(chapterName)) {
        favoriteChapters = favoriteChapters.filter(c => c !== chapterName);
    } else {
        favoriteChapters.push(chapterName);
    }
    localStorage.setItem('favoriteChapters', JSON.stringify(favoriteChapters));
    renderChapters();
}

// 重命名章节
function renameChapter(event, chapterName) {
    event.stopPropagation();
    
    const newName = prompt('请输入新的章节名称：', chapterName);
    if (newName && newName.trim() && newName.trim() !== chapterName) {
        const trimmedNewName = newName.trim();
        
        // 检查新名称是否已存在
        if (chapters[trimmedNewName]) {
            alert('章节名称已存在，请使用其他名称！');
            return;
        }
        
        // 更新章节名称
        const chapterQuestions = chapters[chapterName];
        delete chapters[chapterName];
        chapters[trimmedNewName] = chapterQuestions;
        
        // 更新所有题目中的章节名称
        chapterQuestions.forEach(question => {
            question.chapter = trimmedNewName;
        });
        
        // 更新练习记录中的章节名称
        practiceRecords.forEach(record => {
            if (record.chapter === chapterName) {
                record.chapter = trimmedNewName;
            }
        });
        
        // 更新错题记录中的章节名称
        wrongQuestions.forEach(question => {
            if (question.chapter === chapterName) {
                question.chapter = trimmedNewName;
            }
        });
        
        // 更新收藏章节
        let favoriteChapters = JSON.parse(localStorage.getItem('favoriteChapters') || '[]');
        if (favoriteChapters.includes(chapterName)) {
            favoriteChapters = favoriteChapters.filter(c => c !== chapterName);
            favoriteChapters.push(trimmedNewName);
            localStorage.setItem('favoriteChapters', JSON.stringify(favoriteChapters));
        }
        
        // 保存数据
        saveData();
        
        // 重新渲染章节列表
        renderChapters();
        updateStats();
        
        alert('章节重命名成功！');
    }
} 

function showHighlightMenu(e, selectedText, readingDiv) {
    // 移除已有菜单
    const oldMenu = document.getElementById('highlight-menu');
    if (oldMenu) oldMenu.remove();
    
    // 检测当前主题
    const isDarkMode = document.body.classList.contains('theme-dark');
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.id = 'highlight-menu';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.background = isDarkMode ? '#2d3748' : '#fff';
    menu.style.border = isDarkMode ? '1px solid #4a5568' : '1px solid #667eea';
    menu.style.borderRadius = '6px';
    menu.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(102,126,234,0.12)';
    menu.style.padding = '8px 12px';
    menu.style.zIndex = 99999;
    menu.style.fontSize = '14px';
    menu.style.color = isDarkMode ? '#e2e8f0' : '#333';
    
    // 按钮样式
    const highlightBtnStyle = `margin-right:8px;color:#1a1a1a;background:${isDarkMode ? '#ffeb3b' : '#ffd700'};border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-weight:500;transition:all 0.2s ease;`;
    const noteBtnStyle = `color:#fff;background:${isDarkMode ? '#667eea' : '#667eea'};border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-weight:500;transition:all 0.2s ease;`;
    
    menu.innerHTML = `<button id='highlight-btn' style='${highlightBtnStyle}'>高亮</button><button id='note-btn' style='${noteBtnStyle}'>笔记</button>`;
    document.body.appendChild(menu);
    
    // 添加按钮悬停效果
    const highlightBtn = document.getElementById('highlight-btn');
    const noteBtn = document.getElementById('note-btn');
    
    highlightBtn.onmouseenter = function() {
        this.style.background = isDarkMode ? '#fff59d' : '#ffeb3b';
        this.style.transform = 'scale(1.05)';
    };
    highlightBtn.onmouseleave = function() {
        this.style.background = isDarkMode ? '#ffeb3b' : '#ffd700';
        this.style.transform = 'scale(1)';
    };
    
    noteBtn.onmouseenter = function() {
        this.style.background = isDarkMode ? '#7c8db8' : '#5a6fd8';
        this.style.transform = 'scale(1.05)';
    };
    noteBtn.onmouseleave = function() {
        this.style.background = isDarkMode ? '#667eea' : '#667eea';
        this.style.transform = 'scale(1)';
    };
    
    // 高亮
    highlightBtn.onclick = function() {
        highlightSelectedText(readingDiv);
        menu.remove();
        window.getSelection().removeAllRanges();
    };
    // 笔记
    noteBtn.onclick = function() {
        const note = prompt('请输入笔记内容：');
        if (note) {
            highlightSelectedText(readingDiv, note);
        }
        menu.remove();
        window.getSelection().removeAllRanges();
    };
    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('mousedown', function hideMenu(ev) {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('mousedown', hideMenu);
            }
        });
    }, 10);
}

function highlightSelectedText(container, note) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;
    const span = document.createElement('span');
    
    // 检测当前主题并设置相应的颜色
    const isDarkMode = document.body.classList.contains('theme-dark');
    
    if (note) {
        // 笔记高亮 - 深色模式下使用更亮的黄色
        span.style.background = isDarkMode ? '#ffd54f' : '#ffe082';
        span.style.color = isDarkMode ? '#1a1a1a' : '#333';
    } else {
        // 普通高亮 - 深色模式下使用更亮的黄色
        span.style.background = isDarkMode ? '#ffeb3b' : '#ffd700';
        span.style.color = isDarkMode ? '#1a1a1a' : '#333';
    }
    
    span.style.borderRadius = '3px';
    span.style.padding = '0 2px';
    span.style.cursor = note ? 'pointer' : 'default';
    span.style.fontWeight = '500';
    span.style.transition = 'all 0.2s ease';
    
    if (note) {
        span.title = note;
        span.onclick = function(e) {
            e.stopPropagation();
            alert('笔记：' + note);
        };
        
        // 添加悬停效果
        span.onmouseenter = function() {
            this.style.background = isDarkMode ? '#fff176' : '#ffecb3';
            this.style.transform = 'scale(1.02)';
        };
        span.onmouseleave = function() {
            this.style.background = isDarkMode ? '#ffd54f' : '#ffe082';
            this.style.transform = 'scale(1)';
        };
    } else {
        // 普通高亮的悬停效果
        span.onmouseenter = function() {
            this.style.background = isDarkMode ? '#fff59d' : '#ffeb3b';
            this.style.transform = 'scale(1.02)';
        };
        span.onmouseleave = function() {
            this.style.background = isDarkMode ? '#ffeb3b' : '#ffd700';
            this.style.transform = 'scale(1)';
        };
    }
    
    span.textContent = selection.toString();
    range.deleteContents();
    range.insertNode(span);
    
    // 立即保存高亮和笔记
    const currentQuestion = currentQuestions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.reading) {
        saveReadingHighlights(currentChapter, currentQuestion.reading, container.innerHTML);
    }
} 

// 支持导入 .roi 文件
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (file.name.endsWith('.roi')) {
        // 加密文件，需输入密码
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let enc = e.target.result;
                let pwd = prompt('请输入该文件的密码：');
                if (!pwd) { 
                    alert('未输入密码'); 
                    event.target.value = '';
                    return; 
                }
                
                // 解密
                let dec = '';
                for (let i = 0; i < enc.length; i++) {
                    dec += String.fromCharCode(enc.charCodeAt(i) ^ pwd.charCodeAt(i % pwd.length));
                }
                
                const obj = JSON.parse(dec);
                if (!obj.encrypted || !obj.questions) {
                    throw new Error('文件格式错误或密码不正确');
                }
                
                // 检查是否有重复章节
                let duplicateCount = 0;
                if (chapters[obj.chapter]) {
                    obj.questions.forEach(q => {
                        if (chapters[obj.chapter].some(existing => existing.question === q.question)) {
                            duplicateCount++;
                        }
                    });
                }
                
                // 直接导入题目到章节
                if (!chapters[obj.chapter]) chapters[obj.chapter] = [];
                obj.questions.forEach(q => chapters[obj.chapter].push(q));
                
                saveData();
                renderChapters();
                updateStats();
                
                let message = `加密题目导入成功！共导入 ${obj.questions.length} 道题目`;
                if (duplicateCount > 0) {
                    message += `\n发现 ${duplicateCount} 道重复题目，已自动跳过`;
                }
                alert(message);
                
                // 清理文件输入框
                event.target.value = '';
                
            } catch (err) {
                alert('解密失败，密码错误或文件损坏！\n\n错误信息：' + err.message);
                // 清理文件输入框
                event.target.value = '';
            }
        };
        
        reader.onerror = function() {
            alert('文件读取失败，请重试');
            // 清理文件输入框
            event.target.value = '';
        };
        
        reader.readAsText(file, 'UTF-8');
        
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        readTextFile(file);
    } else {
        alert('请选择 .txt 或 .roi 格式的文件');
        event.target.value = '';
    }
} 

// 1. 保存高亮和笔记到 localStorage
function saveReadingHighlights(chapter, reading, html) {
    if (!chapter || !reading) return;
    let all = JSON.parse(localStorage.getItem('readingHighlights') || '{}');
    if (!all[chapter]) all[chapter] = {};
    all[chapter][reading] = html;
    localStorage.setItem('readingHighlights', JSON.stringify(all));
}
function getReadingHighlights(chapter, reading) {
    let all = JSON.parse(localStorage.getItem('readingHighlights') || '{}');
    return all[chapter] && all[chapter][reading] ? all[chapter][reading] : null;
}
function removeReadingHighlights(chapter, reading) {
    let all = JSON.parse(localStorage.getItem('readingHighlights') || '{}');
    if (all[chapter] && all[chapter][reading]) {
        delete all[chapter][reading];
        localStorage.setItem('readingHighlights', JSON.stringify(all));
    }
}
// 2. 在 renderQuestion 渲染阅读材料时恢复高亮
// 3. 返回章节和提交时保存高亮
function saveAllReadingHighlights() {
    // 遍历当前章节所有阅读题，保存高亮
    if (!chapters[currentChapter]) return;
    chapters[currentChapter].forEach(item => {
        if (item.type === 'reading' && item.reading) {
            // 查找当前页面是否有该阅读材料的div
            const div = document.querySelector('.reading-material');
            if (div && div.textContent.replace(/\s/g, '') === item.reading.replace(/\s/g, '')) {
                saveReadingHighlights(currentChapter, item.reading, div.innerHTML);
            }
        }
    });
}
// 在 returnToChapters 和 finishQuiz 前调用
const oldReturnToChapters = returnToChapters;
returnToChapters = function() {
    saveAllReadingHighlights();
    oldReturnToChapters();
};
const oldFinishQuiz = finishQuiz;
finishQuiz = function() {
    saveAllReadingHighlights();
    oldFinishQuiz();
};
// 4. 提交后清除高亮并保存到练习记录
const oldShowChapterComplete = showChapterComplete;
showChapterComplete = function(record) {
    // 清除本地高亮并保存到 record
    if (record && chapters[record.chapter]) {
        chapters[record.chapter].forEach(item => {
            if (item.type === 'reading' && item.reading) {
                let html = getReadingHighlights(record.chapter, item.reading);
                if (html) {
                    if (!record.readingHighlights) record.readingHighlights = {};
                    record.readingHighlights[item.reading] = html;
                    removeReadingHighlights(record.chapter, item.reading);
                }
            }
        });
    }
    oldShowChapterComplete(record);
};
// 5. 练习详情中显示高亮和笔记
// 在 reviewRecord 中，渲染阅读材料时优先显示 record.readingHighlights
// 在 renderQuestion 中，渲染阅读材料时优先显示 getReadingHighlights(currentChapter, readingMaterial) 

// 保存当前题目的高亮和笔记
function saveCurrentReadingHighlights() {
    const currentQuestion = currentQuestions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.reading) {
        const readingDiv = document.getElementById('reading-material');
        if (readingDiv) {
            saveReadingHighlights(currentChapter, currentQuestion.reading, readingDiv.innerHTML);
        }
    }
}

// 更新现有高亮的主题适配
function updateHighlightTheme() {
    const readingDiv = document.getElementById('reading-material');
    if (!readingDiv) return;
    
    const isDarkMode = document.body.classList.contains('theme-dark');
    const highlightSpans = readingDiv.querySelectorAll('span[style*="background"]');
    
    highlightSpans.forEach(span => {
        const hasNote = span.title && span.title.length > 0;
        
        if (hasNote) {
            // 笔记高亮
            span.style.background = isDarkMode ? '#ffd54f' : '#ffe082';
            span.style.color = isDarkMode ? '#1a1a1a' : '#333';
        } else {
            // 普通高亮
            span.style.background = isDarkMode ? '#ffeb3b' : '#ffd700';
            span.style.color = isDarkMode ? '#1a1a1a' : '#333';
        }
        
        // 重新绑定悬停事件
        if (hasNote) {
            span.onmouseenter = function() {
                this.style.background = isDarkMode ? '#fff176' : '#ffecb3';
                this.style.transform = 'scale(1.02)';
            };
            span.onmouseleave = function() {
                this.style.background = isDarkMode ? '#ffd54f' : '#ffe082';
                this.style.transform = 'scale(1)';
            };
        } else {
            span.onmouseenter = function() {
                this.style.background = isDarkMode ? '#fff59d' : '#ffeb3b';
                this.style.transform = 'scale(1.02)';
            };
            span.onmouseleave = function() {
                this.style.background = isDarkMode ? '#ffeb3b' : '#ffd700';
                this.style.transform = 'scale(1)';
            };
        }
    });
}

// 监听主题切换，更新高亮样式
document.addEventListener('DOMContentLoaded', function() {
    // 监听主题切换按钮
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle-btn');
    
    function handleThemeChange() {
        // 延迟执行，确保主题切换完成
        setTimeout(() => {
            updateHighlightTheme();
        }, 100);
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', handleThemeChange);
    }
    if (mobileThemeToggleBtn) {
        mobileThemeToggleBtn.addEventListener('click', handleThemeChange);
    }
    
    // 监听主题变化事件（如果有的话）
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (mutation.target.classList.contains('theme-dark') !== mutation.oldValue?.includes('theme-dark')) {
                    handleThemeChange();
                }
            }
        });
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['class']
    });
});