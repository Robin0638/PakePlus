// 更新统计信息
function updateStats() {
    // 统计所有普通题和阅读题下的子题
    let total = 0;
    if (typeof chapters === 'object' && chapters) {
        Object.values(chapters).forEach(arr => {
            arr.forEach(item => {
                if (item.type === 'reading' && Array.isArray(item.questions)) {
                    total += item.questions.length;
                } else {
                    total += 1;
                }
            });
        });
    } else {
        total = questions.length;
    }
    document.getElementById('total-questions').textContent = total;
    
    const completedSet = new Set();
    practiceRecords.forEach(record => {
        record.results.forEach(result => {
            if (result.isCorrect) {
                completedSet.add(result.question.question);
            }
        });
    });
    document.getElementById('completed-questions').textContent = completedSet.size;
    
    const totalAnswered = practiceRecords.reduce((sum, record) => sum + record.completedCount, 0);
    const totalCorrect = practiceRecords.reduce((sum, record) => sum + record.correctCount, 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    document.getElementById('accuracy-rate').textContent = accuracy + '%';
    
    const studyDates = new Set();
    practiceRecords.forEach(record => {
        const date = new Date(record.timestamp).toDateString();
        studyDates.add(date);
    });
    document.getElementById('study-days').textContent = studyDates.size;
}

// 渲染错题本
function renderWrongQuestions() {
    const container = document.getElementById('wrong-questions-list');
    const chapterFilter = document.getElementById('chapter-filter');
    const searchInput = document.getElementById('wrong-questions-search');
    
    // 更新章节筛选选项
    if (chapterFilter.options.length <= 1) {
        const chapters = [...new Set(wrongQuestions.map(q => q.chapter))];
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            chapterFilter.appendChild(option);
        });
    }
    
    // 更新统计信息
    document.getElementById('total-wrong-count').textContent = wrongQuestions.length;
    
    if (wrongQuestions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无错题记录</p>';
        return;
    }
    
    // 绑定搜索和筛选事件
    searchInput.oninput = debounce(() => {
        filterWrongQuestions();
    }, 300);
    
    chapterFilter.onchange = () => {
        filterWrongQuestions();
    };
    
    document.getElementById('time-filter').onchange = () => {
        filterWrongQuestions();
    };
    
    // 应用筛选
    filterWrongQuestions();
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 搜索错题
function searchWrongQuestions() {
    filterWrongQuestions();
}

// 筛选错题
function filterWrongQuestions() {
    const tagFilter = document.getElementById('wrong-tag-filter').value;
    const container = document.getElementById('wrong-questions-list');
    const searchText = document.getElementById('wrong-questions-search').value.toLowerCase();
    const chapterFilter = document.getElementById('chapter-filter').value;
    const timeFilter = document.getElementById('time-filter').value;
    
    // 获取当前时间范围
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 筛选错题
    let filteredQuestions = wrongQuestions.filter(q => {
        // 搜索文本筛选
        if (searchText && !q.question.toLowerCase().includes(searchText)) {
            return false;
        }
        
        // 章节筛选
        if (chapterFilter && q.chapter !== chapterFilter) {
            return false;
        }
        
        // 标签筛选
        if (tagFilter) {
            const tagsArr = typeof getTags === 'function' ? getTags(q.chapter) : [];
            if (!tagsArr.includes(tagFilter)) {
                return false;
            }
        }
        
        // 时间筛选
        if (timeFilter) {
            const questionDate = new Date(q.lastErrorTime || q.timestamp);
            switch (timeFilter) {
                case 'today':
                    if (questionDate < today) return false;
                    break;
                case 'week':
                    if (questionDate < weekStart) return false;
                    break;
                case 'month':
                    if (questionDate < monthStart) return false;
                    break;
            }
        }
        
        return true;
    });
    
    // 更新筛选后的数量
    document.getElementById('filtered-count').textContent = filteredQuestions.length;
    
    // 清空容器
    container.innerHTML = '';
    
    // 按章节分组
    const wrongByChapter = {};
    filteredQuestions.forEach(q => {
        if (!wrongByChapter[q.chapter]) {
            wrongByChapter[q.chapter] = [];
        }
        wrongByChapter[q.chapter].push(q);
    });
    
    // 渲染筛选后的错题
    Object.keys(wrongByChapter).forEach(chapterName => {
        const chapterDiv = document.createElement('div');
        chapterDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0 15px 0;">
                <h3 style="color: #667eea; margin: 0;">${chapterName}</h3>
                <button class="btn btn-primary" onclick="practiceChapterWrongQuestions('${chapterName}')" style="font-size: 14px; padding: 8px 16px;">
                    <i class="fas fa-redo"></i> 练习本章错题
                </button>
            </div>
        `;
        container.appendChild(chapterDiv);
        
        wrongByChapter[chapterName].forEach(wrongQ => {
            const wrongItem = document.createElement('div');
            wrongItem.className = 'record-item';
            wrongItem.style.borderLeftColor = '#dc3545';
            let optionsHtml = '';
            if (Array.isArray(wrongQ.answer) || wrongQ.type === 'multiple') {
                // 多选题
                optionsHtml = wrongQ.options.map((option, index) => {
                    let className = '';
                    if (Array.isArray(wrongQ.answer) && wrongQ.answer.includes(index)) className = 'correct';
                    if (Array.isArray(wrongQ.userAnswer) && wrongQ.userAnswer.includes(index) && (!Array.isArray(wrongQ.answer) || !wrongQ.answer.includes(index))) className = 'wrong';
                    return `<li class="option-item ${className}" style="margin: 5px 0; cursor: default;">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </li>`;
                }).join('');
            } else if (wrongQ.type === 'blank') {
                // 填空题
                optionsHtml = `<div style="margin: 8px 0;">
                    <span style="color:#667eea;font-weight:bold;">正确答案：</span> ${wrongQ.answer || ''}<br>
                    <span style="color:#dc3545;font-weight:bold;">你的答案：</span> ${wrongQ.userAnswer || ''}
                </div>`;
            } else {
                // 单选题
                optionsHtml = wrongQ.options.map((option, index) => {
                    let className = '';
                    if (index === wrongQ.answer) className = 'correct';
                    else if (index === wrongQ.userAnswer) className = 'wrong';
                    return `<li class="option-item ${className}" style="margin: 5px 0; cursor: default;">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </li>`;
                }).join('');
            }
            const errorCount = wrongQ.errorCount || 1;
            const lastErrorTime = new Date(wrongQ.lastErrorTime || wrongQ.timestamp).toLocaleDateString();
            wrongItem.innerHTML = `
                <div class="record-header">
                    <div class="record-title">${wrongQ.question}</div>
                    <div class="record-date">
                        <span style="color: #dc3545; margin-right: 10px;">错误次数：${errorCount}</span>
                        最近错误：${lastErrorTime}
                    </div>
                </div>
                <ul class="options-list" style="margin: 15px 0;">${optionsHtml}</ul>
                ${wrongQ.explanation ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>解析：</strong>${wrongQ.explanation}
                </div>` : ''}
                <div style="margin-top: 10px;">
                    <button class="btn btn-primary" onclick="practiceWrongQuestion('${wrongQ.question}')" style="font-size: 14px; padding: 8px 16px;">重新练习</button>
                    <button class="btn btn-danger" onclick="removeWrongQuestion('${wrongQ.question}')" style="font-size: 14px; padding: 8px 16px; margin-left: 10px;">移除</button>
                </div>
            `;
            container.appendChild(wrongItem);
        });
    });
}

// 重置筛选
function resetFilters() {
    document.getElementById('wrong-questions-search').value = '';
    document.getElementById('chapter-filter').value = '';
    document.getElementById('wrong-tag-filter').value = '';
    document.getElementById('time-filter').value = '';
    filterWrongQuestions();
}

// 渲染练习记录
function renderRecords() {
    const container = document.getElementById('records-list');
    
    // 更新统计信息
    document.getElementById('filtered-records-count').textContent = practiceRecords.length;
    document.getElementById('total-records-count').textContent = practiceRecords.length;
    
    if (practiceRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无练习记录</p>';
        return;
    }
    
    container.innerHTML = '';
    
    practiceRecords.forEach((record, index) => {
        const duration = Math.floor(record.duration / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        let statusColor = '#28a745';
        if (record.accuracy < 60) statusColor = '#dc3545';
        else if (record.accuracy < 80) statusColor = '#ffc107';
        
        recordItem.style.borderLeftColor = statusColor;
        
        recordItem.innerHTML = `
            <div class="record-header">
                <div class="record-title">${record.chapter}</div>
                <div class="record-date">${new Date(record.timestamp).toLocaleString()}</div>
            </div>
            <div class="record-stats">
                <span class="record-stat">题目数：${record.totalQuestions}</span>
                <span class="record-stat">正确：${record.correctCount}</span>
                <span class="record-stat" style="color: #ffc107">跳过：${record.skippedCount || 0}</span>
                <span class="record-stat" style="color: ${statusColor}">正确率：${record.accuracy}%</span>
                <span class="record-stat">用时：${minutes}分${seconds}秒</span>
            </div>
        `;
        
        recordItem.onclick = () => reviewRecord(index);
        container.appendChild(recordItem);
    });
}

// 练习错题
function practiceWrongQuestion(questionText) {
    // 找到错题并开始单题练习
    const wrongQ = wrongQuestions.find(q => q.question === questionText);
    if (wrongQ) {
        currentChapter = wrongQ.chapter;
        currentQuestions = [wrongQ];
        currentQuestionIndex = 0;
        userAnswers = [];
        startTime = Date.now();
        
        showPage('quiz');
        startTimer();
        renderQuestion();
    }
}

// 移除错题
function removeWrongQuestion(questionText) {
    if (confirm('确定要移除这道错题吗？')) {
        wrongQuestions = wrongQuestions.filter(q => q.question !== questionText);
        saveData();
        renderWrongQuestions();
    }
}

// 查看记录详情
function reviewRecord(index) {
    const record = practiceRecords[index];
    
    // 更新详情页面的基本信息
    document.querySelector('.record-detail-title').textContent = record.chapter;
    document.getElementById('detail-total-questions').textContent = record.totalQuestions;
    document.getElementById('detail-correct-count').textContent = record.correctCount;
    document.getElementById('detail-accuracy').textContent = record.accuracy + '%';
    
    const duration = Math.floor(record.duration / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    document.getElementById('detail-duration').textContent = `${minutes}分${seconds}秒`;
    
    // 渲染题目详情
    const container = document.getElementById('record-detail-questions');
    container.innerHTML = '';

    // 新增：分组渲染阅读题
    let i = 0;
    while (i < record.results.length) {
        const result = record.results[i];
        if (result.question.reading) {
            // 找到同一阅读材料的所有题目
            const readingText = result.question.reading;
            const group = [];
            let j = i;
            while (j < record.results.length && record.results[j].question.reading === readingText) {
                group.push(record.results[j]);
                j++;
            }
            // 插入阅读材料块
            const readingDiv = document.createElement('div');
            readingDiv.className = 'reading-material';
            readingDiv.style.cssText = 'background:#f8f9fa;padding:14px 16px 10px 16px;border-radius:8px;margin-bottom:12px;white-space:pre-line;color:#444;';
            let highlightHtml = record.readingHighlights && record.readingHighlights[readingText] ? record.readingHighlights[readingText] : readingText;
            readingDiv.innerHTML = highlightHtml;
            // 重新绑定笔记span点击事件
            Array.from(readingDiv.querySelectorAll('span[title]')).forEach(span => {
                span.onclick = function(e) {
                    e.stopPropagation();
                    alert('笔记：' + (span.title || ''));
                };
            });
            container.appendChild(readingDiv);
            // 插入该材料下所有题目
            group.forEach((gResult, k) => {
                const questionDiv = document.createElement('div');
                let statusText, statusClass;
                if (gResult.isSkipped) {
                    statusText = '已跳过';
                    statusClass = 'skipped';
                } else {
                    statusText = gResult.isCorrect ? '正确' : '错误';
                    statusClass = gResult.isCorrect ? 'correct' : 'wrong';
                }
                questionDiv.className = `question-detail-item ${statusClass}`;
                let optionsHtml = '';
                if (Array.isArray(gResult.question.answer) || gResult.question.type === 'multiple') {
                    // 多选题
                    optionsHtml = gResult.question.options.map((option, index) => {
                        let className = 'question-detail-option';
                        if (Array.isArray(gResult.userAnswer) && gResult.userAnswer.includes(index) && (!Array.isArray(gResult.question.answer) || !gResult.question.answer.includes(index))) className += ' wrong';
                        if (Array.isArray(gResult.question.answer) && gResult.question.answer.includes(index)) className += ' correct';
                        if (Array.isArray(gResult.userAnswer) && gResult.userAnswer.includes(index)) className += ' selected';
                        return `<div class="${className}">${String.fromCharCode(65 + index)}. ${option}</div>`;
                    }).join('');
                } else if (gResult.question.type === 'blank') {
                    // 填空题
                    optionsHtml = `<div style="margin: 8px 0;">
                        <span style="color:#667eea;font-weight:bold;">正确答案：</span> ${gResult.question.answer || ''}<br>
                        <span style="color:#dc3545;font-weight:bold;">你的答案：</span> ${gResult.userAnswer || ''}
                    </div>`;
                } else {
                    // 单选题
                    optionsHtml = gResult.question.options.map((option, index) => {
                        let className = 'question-detail-option';
                        if (index === gResult.userAnswer && !gResult.isCorrect && !gResult.isSkipped) className += ' wrong';
                        if (index === gResult.question.answer) className += ' correct';
                        if (index === gResult.userAnswer) className += ' selected';
                        return `<div class="${className}">${String.fromCharCode(65 + index)}. ${option}</div>`;
                    }).join('');
                }
                questionDiv.innerHTML = `
                    <div class="question-detail-header">
                        <div class="question-detail-number">第 ${i + k + 1} 题</div>
                        <div class="question-detail-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="question-detail-question">${gResult.question.question}</div>
                    <div class="question-detail-options">${optionsHtml}</div>
                    ${gResult.question.explanation ? `
                        <div class="question-detail-explanation">
                            <strong>解析：</strong>${gResult.question.explanation}
                        </div>
                    ` : ''}
                `;
                container.appendChild(questionDiv);
            });
            i = i + group.length;
        } else {
            // 普通题
            const questionDiv = document.createElement('div');
            let statusText, statusClass;
            if (result.isSkipped) {
                statusText = '已跳过';
                statusClass = 'skipped';
            } else {
                statusText = result.isCorrect ? '正确' : '错误';
                statusClass = result.isCorrect ? 'correct' : 'wrong';
            }
            questionDiv.className = `question-detail-item ${statusClass}`;
            let optionsHtml = '';
            if (Array.isArray(result.question.answer) || result.question.type === 'multiple') {
                // 多选题
                optionsHtml = result.question.options.map((option, index) => {
                    let className = 'question-detail-option';
                    if (Array.isArray(result.userAnswer) && result.userAnswer.includes(index) && (!Array.isArray(result.question.answer) || !result.question.answer.includes(index))) className += ' wrong';
                    if (Array.isArray(result.question.answer) && result.question.answer.includes(index)) className += ' correct';
                    if (Array.isArray(result.userAnswer) && result.userAnswer.includes(index)) className += ' selected';
                    return `<div class="${className}">${String.fromCharCode(65 + index)}. ${option}</div>`;
                }).join('');
            } else if (result.question.type === 'blank') {
                // 填空题
                optionsHtml = `<div style="margin: 8px 0;">
                    <span style="color:#667eea;font-weight:bold;">正确答案：</span> ${result.question.answer || ''}<br>
                    <span style="color:#dc3545;font-weight:bold;">你的答案：</span> ${result.userAnswer || ''}
                </div>`;
            } else {
                // 单选题
                optionsHtml = result.question.options.map((option, index) => {
                    let className = 'question-detail-option';
                    if (index === result.userAnswer && !result.isCorrect && !result.isSkipped) className += ' wrong';
                    if (index === result.question.answer) className += ' correct';
                    if (index === result.userAnswer) className += ' selected';
                    return `<div class="${className}">${String.fromCharCode(65 + index)}. ${option}</div>`;
                }).join('');
            }
            questionDiv.innerHTML = `
                <div class="question-detail-header">
                    <div class="question-detail-number">第 ${i + 1} 题</div>
                    <div class="question-detail-status ${statusClass}">${statusText}</div>
                </div>
                <div class="question-detail-question">${result.question.question}</div>
                <div class="question-detail-options">${optionsHtml}</div>
                ${result.question.explanation ? `
                    <div class="question-detail-explanation">
                        <strong>解析：</strong>${result.question.explanation}
                    </div>
                ` : ''}
            `;
            container.appendChild(questionDiv);
            i++;
        }
    }
    
    // 显示详情页面
    showPage('record-detail');
}

// 显示统计信息
function showStats() {
    const totalTime = practiceRecords.reduce((sum, record) => sum + record.duration, 0);
    const avgTime = practiceRecords.length > 0 ? Math.round(totalTime / practiceRecords.length / 1000) : 0;
    const avgAccuracy = practiceRecords.length > 0 ? 
        Math.round(practiceRecords.reduce((sum, record) => sum + record.accuracy, 0) / practiceRecords.length) : 0;
    
    const stats = `
学习统计报告
═══════════════
总题库数量：${questions.length} 题
练习次数：${practiceRecords.length} 次
错题数量：${wrongQuestions.length} 题
学习天数：${document.getElementById('study-days').textContent} 天
平均用时：${Math.floor(avgTime / 60)}分${avgTime % 60}秒
平均正确率：${avgAccuracy}%

继续努力，坚持学习！ 💪
    `;
    
    alert(stats);
}

// 练习所有错题
function practiceAllWrongQuestions() {
    if (wrongQuestions.length === 0) {
        alert('暂无错题记录');
        return;
    }
    
    currentChapter = '错题练习';
    currentQuestions = [...wrongQuestions];
    currentQuestionIndex = 0;
    userAnswers = [];
    startTime = Date.now();
    
    // 打乱题目顺序
    currentQuestions.sort(() => Math.random() - 0.5);
    
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 练习高频错题
function practiceFrequentWrongQuestions() {
    if (wrongQuestions.length === 0) {
        alert('暂无错题记录');
        return;
    }
    
    // 按错误次数排序，获取错误次数最多的题目
    const frequentQuestions = [...wrongQuestions]
        .sort((a, b) => (b.errorCount || 1) - (a.errorCount || 1))
        .slice(0, 20); // 取错误次数最多的20道题
    
    if (frequentQuestions.length === 0) {
        alert('暂无高频错题');
        return;
    }
    
    currentChapter = '高频错题练习';
    currentQuestions = frequentQuestions;
    currentQuestionIndex = 0;
    userAnswers = [];
    startTime = Date.now();
    
    // 打乱题目顺序
    currentQuestions.sort(() => Math.random() - 0.5);
    
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 练习章节错题
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
    
    showPage('quiz');
    startTimer();
    renderQuestion();
}

// 渲染题目列表
function renderQuestions() {
    const container = document.getElementById('questions-list');
    const chapterFilter = document.getElementById('questions-chapter-filter');
    
    // 更新章节筛选选项
    if (chapterFilter.options.length <= 1) {
        const chapters = [...new Set(questions.map(q => q.chapter))];
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            chapterFilter.appendChild(option);
        });
    }
    
    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无题目</p>';
        return;
    }
    
    // 绑定搜索和筛选事件
    document.getElementById('questions-search').oninput = debounce(() => {
        filterQuestions();
    }, 300);
    
    // 应用筛选
    filterQuestions();
}

// 搜索题目
function searchQuestions() {
    filterQuestions();
}

// 筛选题目
function filterQuestions() {
    const container = document.getElementById('questions-list');
    const searchText = document.getElementById('questions-search').value.toLowerCase();
    const chapterFilter = document.getElementById('questions-chapter-filter').value;
    
    // 筛选题目
    let filteredQuestions = questions.filter(q => {
        // 搜索文本筛选
        if (searchText && !q.question.toLowerCase().includes(searchText)) {
            return false;
        }
        
        // 章节筛选
        if (chapterFilter && q.chapter !== chapterFilter) {
            return false;
        }
        
        return true;
    });
    
    // 清空容器
    container.innerHTML = '';
    
    // 按章节分组
    const questionsByChapter = {};
    filteredQuestions.forEach(q => {
        if (!questionsByChapter[q.chapter]) {
            questionsByChapter[q.chapter] = [];
        }
        questionsByChapter[q.chapter].push(q);
    });
    
    // 渲染筛选后的题目
    Object.keys(questionsByChapter).forEach(chapterName => {
        const chapterDiv = document.createElement('div');
        chapterDiv.innerHTML = `
            <div style="margin: 20px 0 15px 0;">
                <h3 style="color: #667eea; margin: 0;">${chapterName}</h3>
            </div>
        `;
        container.appendChild(chapterDiv);
        
        questionsByChapter[chapterName].forEach((q, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'record-item';
            
            const optionsHtml = q.options.map((option, i) => {
                let className = '';
                if (i === q.answer) className = 'correct';
                
                return `<li class="option-item ${className}" style="margin: 5px 0; cursor: default;">
                    ${String.fromCharCode(65 + i)}. ${option}
                </li>`;
            }).join('');
            
            questionItem.innerHTML = `
                <div class="record-header">
                    <div class="record-title">${q.question}</div>
                </div>
                <ul class="options-list" style="margin: 15px 0;">${optionsHtml}</ul>
                ${q.explanation ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>解析：</strong>${q.explanation}
                </div>` : ''}
                <div style="margin-top: 10px;">
                    <button class="btn btn-danger" onclick="deleteQuestion('${q.question}')" style="font-size: 14px; padding: 8px 16px;">删除题目</button>
                </div>
            `;
            
            container.appendChild(questionItem);
        });
    });
}

// 重置题目筛选
function resetQuestionFilters() {
    document.getElementById('questions-search').value = '';
    document.getElementById('questions-chapter-filter').value = '';
    filterQuestions();
}

// 删除题目
function deleteQuestion(questionText) {
    if (confirm('确定要删除这道题目吗？此操作不可恢复！')) {
        questions = questions.filter(q => q.question !== questionText);
        saveData();
        organizeChapters();
        renderQuestions();
        updateStats();
        alert('题目已删除');
    }
}

// 渲染错题本标签筛选下拉框
function initWrongTagFilter() {
    const tagFilter = document.getElementById('wrong-tag-filter');
    if (!tagFilter) return;
    // 获取所有错题标签
    let allTags = [];
    if (typeof getTags === 'function') {
        wrongQuestions.forEach(q => {
            const tagsArr = getTags(q.chapter);
            if (tagsArr && tagsArr.length > 0) {
                allTags = allTags.concat(tagsArr);
            }
        });
    }
    allTags = Array.from(new Set(allTags));
    tagFilter.innerHTML = '<option value="">全部标签</option>';
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

// 渲染后和页面初始化时刷新标签下拉框和绑定事件
const oldRenderWrongQuestions = renderWrongQuestions;
renderWrongQuestions = function() {
    oldRenderWrongQuestions();
    initWrongTagFilter();
    document.getElementById('wrong-tag-filter').onchange = filterWrongQuestions;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initWrongTagFilter();
        document.getElementById('wrong-tag-filter').onchange = filterWrongQuestions;
    });
} else {
    initWrongTagFilter();
    document.getElementById('wrong-tag-filter').onchange = filterWrongQuestions;
}

// 筛选练习记录
function filterRecords() {
    const searchText = document.getElementById('records-search').value.toLowerCase();
    const timeFilter = document.getElementById('records-time-filter').value;
    
    let filteredRecords = practiceRecords;
    
    // 应用搜索筛选
    if (searchText) {
        filteredRecords = filteredRecords.filter(record => 
            record.chapter.toLowerCase().includes(searchText)
        );
    }
    
    // 应用时间筛选
    if (timeFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.timestamp);
            switch (timeFilter) {
                case 'today':
                    return recordDate >= today;
                case 'week':
                    return recordDate >= weekStart;
                case 'month':
                    return recordDate >= monthStart;
                default:
                    return true;
            }
        });
    }
    
    // 更新统计信息
    document.getElementById('filtered-records-count').textContent = filteredRecords.length;
    document.getElementById('total-records-count').textContent = practiceRecords.length;
    
    // 渲染筛选后的记录
    const container = document.getElementById('records-list');
    
    if (filteredRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无练习记录</p>';
        return;
    }
    
    container.innerHTML = '';
    
    filteredRecords.forEach((record, index) => {
        const duration = Math.floor(record.duration / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        let statusColor = '#28a745';
        if (record.accuracy < 60) statusColor = '#dc3545';
        else if (record.accuracy < 80) statusColor = '#ffc107';
        
        recordItem.style.borderLeftColor = statusColor;
        
        recordItem.innerHTML = `
            <div class="record-header">
                <div class="record-title">${record.chapter}</div>
                <div class="record-date">${new Date(record.timestamp).toLocaleString()}</div>
            </div>
            <div class="record-stats">
                <span class="record-stat">题目数：${record.totalQuestions}</span>
                <span class="record-stat">正确：${record.correctCount}</span>
                <span class="record-stat" style="color: #ffc107">跳过：${record.skippedCount || 0}</span>
                <span class="record-stat" style="color: ${statusColor}">正确率：${record.accuracy}%</span>
                <span class="record-stat">用时：${minutes}分${seconds}秒</span>
            </div>
        `;
        
        recordItem.onclick = () => reviewRecord(index);
        container.appendChild(recordItem);
    });
}

// 重置练习记录筛选
function resetRecordsFilters() {
    document.getElementById('records-search').value = '';
    document.getElementById('records-time-filter').value = '';
    filterRecords();
} 