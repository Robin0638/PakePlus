// 数据存储相关
function saveData() {
    const data = {
        questions: questions,
        chapters: chapters,
        practiceRecords: practiceRecords,
        wrongQuestions: wrongQuestions,
        groups: groups,
        tags: tags,
        settings: {
            skipEnabled: localStorage.getItem('skipEnabled') === 'true'
        }
    };
    localStorage.setItem('quizData', JSON.stringify(data));
}

function loadData() {
    const data = localStorage.getItem('quizData');
    if (data) {
        const parsedData = JSON.parse(data);
        questions = parsedData.questions || [];
        chapters = parsedData.chapters || {};
        practiceRecords = parsedData.practiceRecords || [];
        wrongQuestions = parsedData.wrongQuestions || [];
        groups = parsedData.groups || [];
        tags = parsedData.tags || {};
        
        // 加载设置
        if (parsedData.settings) {
            localStorage.setItem('skipEnabled', parsedData.settings.skipEnabled);
        }
    }
}

// 文件处理相关
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    // 检查文件类型
    if (file.name.endsWith('.roi')) {
        // 加密文件，需输入密码
        const reader = new FileReader();
        reader.onload = function(e) {
            let enc = e.target.result;
            let pwd = prompt('请输入该文件的密码：');
            if (!pwd) { alert('未输入密码'); if (event && event.target) event.target.value = ''; return; }
            // 解密
            let dec = '';
            for (let i = 0; i < enc.length; i++) {
                dec += String.fromCharCode(enc.charCodeAt(i) ^ pwd.charCodeAt(i % pwd.length));
            }
            try {
                const obj = JSON.parse(dec);
                if (!obj.encrypted || !obj.questions) throw new Error('文件格式错误或密码不正确');
                // 直接导入题目到章节，加入查重
                if (!chapters[obj.chapter]) chapters[obj.chapter] = [];
                let duplicateCount = 0;
                let importCount = 0;
                obj.questions.forEach(q => {
                    if (chapters[obj.chapter].some(existing => existing.question === q.question)) {
                        duplicateCount++;
                    } else {
                        chapters[obj.chapter].push(q);
                        importCount++;
                    }
                });
                // 恢复章节标签
                if (obj.tags && typeof obj.tags === 'object') {
                    Object.keys(obj.tags).forEach(ch => {
                        if (!tags[ch]) tags[ch] = [];
                        obj.tags[ch].forEach(tag => {
                            if (!tags[ch].includes(tag)) tags[ch].push(tag);
                        });
                    });
                }
                saveData();
                renderChapters();
                updateStats();
                let msg = `加密题目导入成功！共导入 ${importCount} 道题目`;
                if (duplicateCount > 0) {
                    msg += `\n发现 ${duplicateCount} 道重复题目，已自动跳过`;
                }
                alert(msg);
                window.location.reload();
            } catch (err) {
                alert('解密失败，密码错误或文件损坏！');
                if (event && event.target) event.target.value = '';
            }
        };
        reader.readAsText(file, 'UTF-8');
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        readTextFile(file);
    } else {
        alert('请选择 .txt 或 .roi 格式的文件');
        if (event && event.target) event.target.value = '';
    }
}

function readTextFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            if (!text || text.trim() === '') {
                alert('文件内容为空，请检查文件');
                // 清理文件输入框，允许继续导入
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.value = '';
                return;
            }
            
            // 将文件内容填入文本框，但不直接调用handleTextInput
            document.getElementById('questions-text').value = text;
            
            // 询问用户是否要导入
            if (confirm('文件内容已加载到文本框，是否立即导入？\n\n点击"确定"立即导入\n点击"取消"可以编辑后再导入')) {
                handleTextInput();
            }
        } catch (error) {
            alert('文件读取失败：' + error.message);
            // 清理文件输入框，允许继续导入
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';
        }
    };
    
    reader.onerror = function() {
        alert('文件读取失败，请重试');
        // 清理文件输入框
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    };
    
    reader.readAsText(file, 'UTF-8');
}

// 解析题目文本
function parseQuestions(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const newQuestions = [];
    let currentQuestion = {};
    let currentOptions = [];
    let duplicateCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('章节：')) {
            if (currentQuestion.question) {
                // 保存之前的题目
                currentQuestion.options = [...currentOptions];
                // 检查是否重复
                if (!isDuplicateQuestion(currentQuestion)) {
                    newQuestions.push({...currentQuestion});
                } else {
                    duplicateCount++;
                }
            }
            currentQuestion = { chapter: line.substring(3) };
            currentOptions = [];
        } else if (line.startsWith('题目：')) {
            currentQuestion.question = line.substring(3);
        } else if (line.match(/^[A-D]\./)) {
            currentOptions.push(line.substring(2).trim());
        } else if (line.startsWith('答案：')) {
            const answerLetter = line.substring(3).trim();
            currentQuestion.answer = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        } else if (line.startsWith('解析：')) {
            currentQuestion.explanation = line.substring(3);
        }
    }
    
    // 保存最后一个题目
    if (currentQuestion.question) {
        currentQuestion.options = [...currentOptions];
        if (!isDuplicateQuestion(currentQuestion)) {
            newQuestions.push({...currentQuestion});
        } else {
            duplicateCount++;
        }
    }
    
    if (newQuestions.length > 0) {
        // 保存导入的题目到文件
        saveImportedQuestions(newQuestions);
        
        questions = questions.concat(newQuestions);
        organizeChapters();
        saveData();
        renderChapters();
        updateStats();
        
        let message = `成功导入 ${newQuestions.length} 道题目！`;
        if (duplicateCount > 0) {
            message += `\n发现 ${duplicateCount} 道重复题目，已自动跳过。`;
        }
        message += '\n题目已保存到 data 文件夹中。';
        alert(message);
    } else {
        if (duplicateCount > 0) {
            alert(`发现 ${duplicateCount} 道重复题目，没有新题目被导入。`);
        } else {
            alert('未能解析到有效题目，请检查文件格式');
        }
    }
}

// 检查题目是否重复
function isDuplicateQuestion(newQuestion) {
    return questions.some(q => 
        q.question === newQuestion.question && 
        q.chapter === newQuestion.chapter
    );
}

// 保存导入的题目到文件
function saveImportedQuestions(newQuestions) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `data/imported_questions_${timestamp}.json`;
    
    const data = {
        questions: newQuestions,
        importTime: new Date().toISOString(),
        totalQuestions: newQuestions.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

// 导出数据
function exportData() {
    const data = {
        questions: questions,
        wrongQuestions: wrongQuestions,
        practiceRecords: practiceRecords,
        exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_data_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 清除数据
function clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！\n包括：题目、错题、练习记录、分组、标签等所有数据。')) {
        questions = [];
        wrongQuestions = [];
        practiceRecords = [];
        chapters = {};
        groups = [];
        tags = {};  // 清除标签数据
        localStorage.removeItem('favoriteChapters'); // 清除收藏章节
        saveData();
        renderChapters();
        updateStats();
        alert('所有数据已清除');
        // 重新加载页面
        window.location.reload();
    }
}

// 分组数据结构
let groups = [];

// 创建分组
function createGroup(groupName) {
    if (!groupName.trim()) {
        alert('请输入分组名称');
        return;
    }
    
    if (groups.some(g => g.name === groupName)) {
        alert('分组名称已存在');
        return;
    }
    
    groups.push({
        id: Date.now().toString(),
        name: groupName,
        chapters: []
    });
    
    saveData();
    renderGroups();
}

// 删除分组
function deleteGroup(groupId) {
    if (confirm('确定要删除这个分组吗？')) {
        groups = groups.filter(g => g.id !== groupId);
        saveData();
        renderGroups();
    }
}

// 添加章节到分组
function addChapterToGroup(groupId, chapterName) {
    const group = groups.find(g => g.id === groupId);
    if (group && !group.chapters.includes(chapterName)) {
        group.chapters.push(chapterName);
        saveData();
        renderGroups();
    }
}

// 从分组中移除章节
function removeChapterFromGroup(groupId, chapterName) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.chapters = group.chapters.filter(c => c !== chapterName);
        saveData();
        renderGroups();
    }
}

// 备份数据
function backupData() {
    const data = {
        questions: questions,
        chapters: chapters, // 加入章节（含阅读题）
        wrongQuestions: wrongQuestions,
        practiceRecords: practiceRecords,
        groups: groups,
        tags: tags,
        lastUpdate: Date.now(),
        version: '1.0'
    };
    const jsonText = JSON.stringify(data, null, 2);
    // 直接下载json文件
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    showCopyTip('备份数据已下载为json文件！');
}

// 分享备份数据
function shareBackupData(jsonText) {
    const shareData = {
        title: '题答答备份数据',
        text: '我的题答答学习数据备份',
        url: window.location.href
    };
    
    // 优先使用Web Share API
    if (navigator.share) {
        navigator.share(shareData).then(() => {
            console.log('分享成功');
        }).catch((error) => {
            console.log('分享失败:', error);
            // 如果Web Share API失败，尝试其他方式
            fallbackShare(jsonText);
        });
    } else {
        // 降级处理
        fallbackShare(jsonText);
    }
}

// 降级分享方式
function fallbackShare(jsonText) {
    // 在移动端，尝试使用uni-app的分享API
    if (window.plus && plus.share) {
        plus.share.sendWithSystem({
            type: 'text',
            content: jsonText,
            title: '题答答备份数据',
            // 排除图片分享方式
            exclude: ['image', 'video', 'audio']
        }, function(result) {
            console.log('分享结果:', result);
        }, function(error) {
            console.log('分享失败:', error);
            showCopyTip('分享功能不可用，数据已复制到剪贴板。');
        });
    } else {
        // 最后的降级：显示分享提示
        showCopyTip('分享功能不可用，数据已复制到剪贴板。\n\n您可以手动粘贴分享。');
    }
}

// 导入备份数据
function importBackupData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 获取用户选择的导入模式
    let mode = 'merge';
    const modeInput = document.querySelector('input[name="import-mode"]:checked');
    if (modeInput) mode = modeInput.value;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // 验证数据格式
            if (!data.questions || !data.wrongQuestions || !data.practiceRecords) {
                throw new Error('无效的备份文件格式');
            }
            
            if (mode === 'overwrite') {
                // 覆盖模式：直接用新数据替换
            if (confirm('确定要导入备份数据吗？这将覆盖当前所有数据！')) {
                questions = data.questions || [];
                chapters = data.chapters || {};
                wrongQuestions = data.wrongQuestions || [];
                practiceRecords = data.practiceRecords || [];
                groups = data.groups || [];
                tags = data.tags || {};
                    saveData();
                    renderChapters();
                    updateStats();
                    event.target.value = '';
                    alert('数据导入成功！');
                    window.location.reload();
                }
            } else {
                // 合并模式：与现有数据合并
                // 合并 questions
                if (Array.isArray(data.questions)) {
                    const existQ = questions || [];
                    const mergedQ = existQ.concat(data.questions.filter(q => !existQ.some(eq => JSON.stringify(eq) === JSON.stringify(q))));
                    questions = mergedQ;
                }
                // 合并 chapters
                if (typeof data.chapters === 'object') {
                    chapters = chapters || {};
                    for (const ch in data.chapters) {
                        if (!chapters[ch]) {
                            chapters[ch] = data.chapters[ch];
                        } else {
                            // 合并章节下题目，避免重复
                            const existArr = chapters[ch];
                            const newArr = data.chapters[ch].filter(q => !existArr.some(eq => JSON.stringify(eq) === JSON.stringify(q)));
                            chapters[ch] = existArr.concat(newArr);
                        }
                    }
                }
                // 合并 wrongQuestions
                if (Array.isArray(data.wrongQuestions)) {
                    const existW = wrongQuestions || [];
                    const mergedW = existW.concat(data.wrongQuestions.filter(q => !existW.some(eq => JSON.stringify(eq) === JSON.stringify(q))));
                    wrongQuestions = mergedW;
                }
                // 合并 practiceRecords
                if (Array.isArray(data.practiceRecords)) {
                    const existR = practiceRecords || [];
                    const mergedR = existR.concat(data.practiceRecords.filter(r => !existR.some(er => JSON.stringify(er) === JSON.stringify(r))));
                    practiceRecords = mergedR;
                }
                // 合并 groups
                if (Array.isArray(data.groups)) {
                    const existG = groups || [];
                    const mergedG = existG.concat(data.groups.filter(g => !existG.some(eg => JSON.stringify(eg) === JSON.stringify(g))));
                    groups = mergedG;
                }
                // 合并 tags
                if (typeof data.tags === 'object') {
                    tags = tags || {};
                    for (const ch in data.tags) {
                        if (!tags[ch]) {
                            tags[ch] = data.tags[ch];
                        } else {
                            // 合并标签，去重
                            tags[ch] = Array.from(new Set([...(tags[ch] || []), ...(data.tags[ch] || [])]));
                        }
                    }
                }
                saveData();
                renderChapters();
                updateStats();
                event.target.value = '';
                alert('数据合并导入成功！');
                window.location.reload();
            }
        } catch (error) {
            alert('导入失败：' + error.message);
            event.target.value = '';
        }
    };
    reader.onerror = function() {
        alert('文件读取失败，请重试');
        event.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
}

// 处理文本框输入
function handleTextInput() {
    const text = document.getElementById('questions-text').value.trim();
    if (!text) {
        alert('请输入题目内容');
        return;
    }

    // 分割多个题目或阅读材料块
    const blocks = text.split(/\n{2,}/).filter(block => block.trim());
    let successCount = 0;
    let errorMessages = [];
    let hasErrors = false;

    // 创建临时数据副本，避免在出错时影响原有数据
    const tempChapters = JSON.parse(JSON.stringify(chapters));
    const tempTags = JSON.parse(JSON.stringify(tags));

    blocks.forEach((block, blockIndex) => {
        const lines = block.split('\n').map(line => line.trim());
        let i = 0;
        // 检查是否为阅读材料块
        if (lines[0].startsWith('章节：') && lines.some(l => l.startsWith('阅读：'))) {
            // 阅读理解材料
            let chapter = lines[0].substring(3).trim();
            let readingLines = [];
            let readingStart = lines.findIndex(l => l.startsWith('阅读：'));
            readingLines.push(lines[readingStart].substring(3).trim());
            let j = readingStart + 1;
            // 收集多行阅读材料
            while (j < lines.length && !lines[j].startsWith('题目：')) {
                // 允许空行，全部保留
                readingLines.push(lines[j]);
                j++;
            }
            // 解析后续所有题目
            let questionsArr = [];
            let curQ = null;
            let curOptions = [];
            for (; j < lines.length; j++) {
                const line = lines[j];
                if (line.startsWith('题目：')) {
                    if (curQ) {
                        curQ.options = [...curOptions];
                        // 填空题判定
                        if (curQ.options.length === 0 && typeof curQ.answer === 'string') {
                            curQ.type = 'blank';
                        }
                        questionsArr.push(curQ);
                    }
                    curQ = { question: line.substring(3).trim(), options: [], answer: -1, explanation: '' };
                    curOptions = [];
                } else if (line.match(/^[A-D]\./)) {
                    curOptions.push(line.substring(2).trim());
                } else if (line.startsWith('答案：')) {
                    const answer = line.substring(3).trim();
                    if (/^[A-D]+$/.test(answer.toUpperCase())) {
                        if (answer.length === 1) {
                            curQ.answer = answer.toUpperCase().charCodeAt(0) - 65;
                        } else {
                            curQ.answer = answer.toUpperCase().split('').map(ch => ch.charCodeAt(0) - 65);
                            curQ.type = 'multiple';
                        }
                    } else {
                        curQ.answer = answer;
                        curQ.type = 'blank';
                    }
                } else if (line.startsWith('解析：')) {
                    curQ.explanation = line.substring(3).trim();
                } else if (line.startsWith('标签：')) {
                    // 支持标签导入，多个标签用逗号分隔
                    const tagStr = line.substring(3).trim();
                    if (tagStr) {
                        const tagArr = tagStr.split(',').map(t => t.trim()).filter(Boolean);
                        if (tagArr.length > 0 && chapter) {
                            if (!tempTags[chapter]) tempTags[chapter] = [];
                            tagArr.forEach(tag => {
                                if (!tempTags[chapter].includes(tag)) {
                                    tempTags[chapter].push(tag);
                                }
                            });
                        }
                    }
                }
            }
            // 收尾最后一道题
            if (curQ) {
                curQ.options = [...curOptions];
                // 填空题判定
                if (curQ.options.length === 0 && typeof curQ.answer === 'string') {
                    curQ.type = 'blank';
                }
                questionsArr.push(curQ);
            }
            // 检查题目数量
            if (questionsArr.length === 0) {
                errorMessages.push(`第${blockIndex + 1}阅读材料下未检测到题目`);
                hasErrors = true;
            } else {
                // 检查重复（以材料+题干为唯一）
                let isDuplicate = false;
                if (tempChapters[chapter]) {
                    isDuplicate = tempChapters[chapter].some(q => q.reading === readingLines.join('\n'));
                }
                if (isDuplicate) {
                    errorMessages.push(`第${blockIndex + 1}阅读材料重复，未导入`);
                } else {
                    const readingObj = {
                        chapter,
                        reading: readingLines.join('\n'),
                        type: 'reading',
                        questions: questionsArr
                    };
                    if (!tempChapters[chapter]) tempChapters[chapter] = [];
                    tempChapters[chapter].push(readingObj);
                    successCount++;
                }
            }
        } else {
            // 普通题块，原有逻辑
            try {
                const question = {
                    chapter: '',
                    question: '',
                    options: [],
                    answer: -1,
                    explanation: ''
                };
                let readingLines = [];
                let inReading = false;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.startsWith('阅读：')) {
                        inReading = true;
                        readingLines.push(line.substring(3).trim());
                        continue;
                    }
                    if (inReading) {
                        if (line.startsWith('题目：') || line.startsWith('章节：') || line === '') {
                            inReading = false;
                        } else {
                            readingLines.push(line);
                            continue;
                        }
                    }
                    if (line.startsWith('章节：')) {
                        question.chapter = line.substring(3).trim();
                    } else if (line.startsWith('题目：')) {
                        question.question = line.substring(3).trim();
                    } else if (line.match(/^[A-D]\./)) {
                        question.options.push(line.substring(2).trim());
                    } else if (line.startsWith('答案：')) {
                        const answer = line.substring(3).trim();
                        if (/^[A-D]+$/.test(answer.toUpperCase())) {
                            if (answer.length === 1) {
                                question.answer = answer.toUpperCase().charCodeAt(0) - 65;
                            } else {
                                question.answer = answer.toUpperCase().split('').map(ch => ch.charCodeAt(0) - 65);
                                question.type = 'multiple';
                            }
                        } else {
                            question.answer = answer;
                            question.type = 'blank';
                        }
                    } else if (line.startsWith('解析：')) {
                        question.explanation = line.substring(3).trim();
                    } else if (line.startsWith('标签：')) {
                        const tagStr = line.substring(3).trim();
                        if (tagStr) {
                            const tagArr = tagStr.split(',').map(t => t.trim()).filter(Boolean);
                            if (tagArr.length > 0 && question.chapter) {
                                if (!tempTags[question.chapter]) tempTags[question.chapter] = [];
                                tagArr.forEach(tag => {
                                    if (!tempTags[question.chapter].includes(tag)) {
                                        tempTags[question.chapter].push(tag);
                                    }
                                });
                            }
                        }
                    }
                }
                if (readingLines.length > 0) {
                    question.reading = readingLines.join('\n');
                    question.type = 'reading';
                }
                if (!question.chapter) {
                    throw new Error(`第${blockIndex + 1}题：缺少章节信息`);
                }
                if (!question.question) {
                    throw new Error(`第${blockIndex + 1}题：缺少题目内容`);
                }
                if (question.options.length !== 4) {
                    // 填空题允许无选项
                    if (question.type !== 'blank') {
                        throw new Error(`第${blockIndex + 1}题：选项数量必须为4个`);
                    }
                }
                if (question.answer === -1) {
                    throw new Error(`第${blockIndex + 1}题：缺少答案`);
                }
                let isDuplicate = false;
                if (tempChapters[question.chapter]) {
                    isDuplicate = tempChapters[question.chapter].some(q => q.question === question.question);
                }
                if (isDuplicate) {
                    errorMessages.push(`第${blockIndex + 1}题：与本章节已有题目重复，未导入`);
                } else {
                    if (!tempChapters[question.chapter]) {
                        tempChapters[question.chapter] = [];
                    }
                    tempChapters[question.chapter].push(question);
                    successCount++;
                }
            } catch (error) {
                errorMessages.push(error.message);
                hasErrors = true;
            }
        }
    });

    // 只有在没有严重错误时才更新数据
    if (!hasErrors || successCount > 0) {
        // 更新实际数据
        chapters = tempChapters;
        tags = tempTags;
        
        // 保存数据
        saveData();
        
        // 更新统计信息
        updateStats();
        
        // 显示结果
        let message = `成功添加 ${successCount} 道题目`;
        if (errorMessages.length > 0) {
            message += `\n\n以下题目格式错误：\n${errorMessages.join('\n')}`;
        }
        alert(message);
        
        // 清空文本框
        document.getElementById('questions-text').value = '';
        
        // 添加成功后立即刷新页面
        if (successCount > 0) {
            window.location.reload();
        }
    } else {
        // 如果有严重错误，只显示错误信息，不更新数据
        alert(`导入失败！\n\n错误信息：\n${errorMessages.join('\n')}\n\n请检查题目格式后重试。`);
    }
}

// 标签数据结构
let tags = {};

// 标签相关函数
function addTag(chapterName, tagName) {
    if (!tags[chapterName]) {
        tags[chapterName] = [];
    }
    if (!tags[chapterName].includes(tagName)) {
        tags[chapterName].push(tagName);
        saveData();
    }
}

function removeTag(chapterName, tagName, event) {
    if (event) event.stopPropagation();
    if (tags[chapterName]) {
        tags[chapterName] = tags[chapterName].filter(tag => tag !== tagName);
        if (tags[chapterName].length === 0) {
            delete tags[chapterName];
        }
    }
    saveData();
    if (typeof renderChapters === 'function') renderChapters();
}

function getTags(chapterName) {
    return tags[chapterName] || [];
} 