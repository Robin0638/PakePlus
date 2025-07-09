// 用户信息模态框逻辑
(function() {
  const btn = document.getElementById('user-profile-btn');
  const modal = document.getElementById('user-info-modal');
  const closeBtn = document.getElementById('close-user-info-modal');
  // 数据填充
  function fillUserInfo() {
    // 头像和昵称
    const avatar = localStorage.getItem('userAvatar') || 'img/1.png';
    const nickname = localStorage.getItem('userNickname') || '未登录';
    document.getElementById('user-info-avatar').src = avatar;
    document.getElementById('user-info-nickname').textContent = nickname;
    // 用户更多信息
    let regDate = '', focusTotal = 0, points = 0, loginDays = 0;
    if (window.StorageManager) {
      // 注册时间
      const data = StorageManager.getData && StorageManager.getData();
      if (data && data.user && data.user.createTime) {
        regDate = new Date(data.user.createTime).toLocaleDateString();
      } else if (data && data.loginDates && data.loginDates.length > 0) {
        regDate = data.loginDates[0];
      }
      // 累计专注时长
      focusTotal = (data && data.focusTime && data.focusTime.total) ? data.focusTime.total : 0;
      // 积分
      points = (data && typeof data.points === 'number') ? data.points : 0;
      // 连续登录天数
      loginDays = (data && data.loginDates) ? data.loginDates.length : 0;
    }
    let moreInfoHtml = `<div class="user-more-info">
      <div><span class="user-more-label"><i class="fas fa-calendar-alt"></i> 注册时间：</span>${regDate || '—'}</div>
      <div><span class="user-more-label"><i class="fas fa-stopwatch"></i> 累计专注时长：</span>${focusTotal} 分钟</div>
      <div><span class="user-more-label"><i class="fas fa-star"></i> 累计积分：</span>${points}</div>
      <div><span class="user-more-label"><i class="fas fa-calendar-check"></i> 连续登录天数：</span>${loginDays}</div>
    </div>`;
    let moreInfoContainer = document.getElementById('user-more-info');
    if (!moreInfoContainer) {
      const avatarNickDiv = document.querySelector('.user-info-avatar-nick');
      moreInfoContainer = document.createElement('div');
      moreInfoContainer.id = 'user-more-info';
      avatarNickDiv && avatarNickDiv.parentNode.insertBefore(moreInfoContainer, avatarNickDiv.nextSibling);
    }
    moreInfoContainer.innerHTML = moreInfoHtml;
    // 项目量数据来自StorageManager
    let created = 0, completed = 0;
    if (window.StorageManager && typeof StorageManager.getProjects === 'function') {
      const projects = StorageManager.getProjects() || [];
      created = projects.length;
      completed = projects.filter(p => (p.totalTasks > 0 && p.completedTasks === p.totalTasks)).length;
    }
    document.getElementById('user-projects-created').textContent = created;
    document.getElementById('user-projects-completed').textContent = completed;
    // 1. 已创建清单
    let listListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const lists = data.lists || [];
      if (lists.length > 0) {
        listListHtml = '<ul class="user-list-list">' +
          lists.map(l => `<li><span class="list-name">${l.name || '(未命名清单)'}</span> <span class="list-tasks">(${l.items ? l.items.length : 0}项)</span></li>`).join('') +
          '</ul>';
      } else {
        listListHtml = '<div class="user-list-list-empty">暂无清单</div>';
      }
    }
    let listListContainer = document.getElementById('user-lists-list');
    if (!listListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      listListContainer = document.createElement('div');
      listListContainer.id = 'user-lists-list';
      statsDiv && statsDiv.parentNode.insertBefore(listListContainer, statsDiv.nextSibling);
    }
    listListContainer.innerHTML = `
      <div class="user-list-list-title">
        <button id="toggle-list-list" class="toggle-list-list-btn">${listListContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建清单
      </div>
      <div class="user-list-list-panel" style="display:${listListContainer.classList.contains('open') ? 'block' : 'none'};">${listListHtml}</div>
    `;
    const toggleListBtn = document.getElementById('toggle-list-list');
    if (toggleListBtn) {
      toggleListBtn.onclick = function() {
        listListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 2. 已创建倒数日
    let countdownListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const countdowns = data.countdowns || [];
      if (countdowns.length > 0) {
        countdownListHtml = '<ul class="user-countdown-list">' +
          countdowns.map(c => `<li><span class="countdown-name">${c.name || '(未命名倒数日)'}</span> <span class="countdown-date">(${c.date || ''})</span></li>`).join('') +
          '</ul>';
      } else {
        countdownListHtml = '<div class="user-countdown-list-empty">暂无倒数日</div>';
      }
    }
    let countdownListContainer = document.getElementById('user-countdowns-list');
    if (!countdownListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      countdownListContainer = document.createElement('div');
      countdownListContainer.id = 'user-countdowns-list';
      statsDiv && statsDiv.parentNode.insertBefore(countdownListContainer, statsDiv.nextSibling);
    }
    countdownListContainer.innerHTML = `
      <div class="user-countdown-list-title">
        <button id="toggle-countdown-list" class="toggle-countdown-list-btn">${countdownListContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建倒数日
      </div>
      <div class="user-countdown-list-panel" style="display:${countdownListContainer.classList.contains('open') ? 'block' : 'none'};">${countdownListHtml}</div>
    `;
    const toggleCountdownBtn = document.getElementById('toggle-countdown-list');
    if (toggleCountdownBtn) {
      toggleCountdownBtn.onclick = function() {
        countdownListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 3. 已创建和已完成的专注时钟
    let focusListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const focusHistory = (data.focusTime && data.focusTime.history) ? data.focusTime.history : [];
      if (focusHistory.length > 0) {
        focusListHtml = '<ul class="user-focus-list">' +
          focusHistory.map(f => `<li><span class="focus-date">${f.date}</span> <span class="focus-minutes">(${f.minutes}分钟)</span></li>`).join('') +
          '</ul>';
      } else {
        focusListHtml = '<div class="user-focus-list-empty">暂无专注记录</div>';
      }
    }
    let focusListContainer = document.getElementById('user-focus-list');
    if (!focusListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      focusListContainer = document.createElement('div');
      focusListContainer.id = 'user-focus-list';
      statsDiv && statsDiv.parentNode.insertBefore(focusListContainer, statsDiv.nextSibling);
    }
    focusListContainer.innerHTML = `
      <div class="user-focus-list-title">
        <button id="toggle-focus-list" class="toggle-focus-list-btn">${focusListContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建/完成专注时钟
      </div>
      <div class="user-focus-list-panel" style="display:${focusListContainer.classList.contains('open') ? 'block' : 'none'};">${focusListHtml}</div>
    `;
    const toggleFocusBtn = document.getElementById('toggle-focus-list');
    if (toggleFocusBtn) {
      toggleFocusBtn.onclick = function() {
        focusListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 折叠模块化项目列表
    let projectListHtml = '';
    if (window.StorageManager && typeof StorageManager.getProjects === 'function') {
      const projects = StorageManager.getProjects() || [];
      if (projects.length > 0) {
        projectListHtml = '<ul class="user-project-list">' +
          projects.map(p => `<li><span class="project-name">${p.name || '(未命名项目)'}</span> <span class="project-tasks">(${p.completedTasks||0}/${p.totalTasks||0})</span></li>`).join('') +
          '</ul>';
      } else {
        projectListHtml = '<div class="user-project-list-empty">暂无项目</div>';
      }
    }
    let listContainer = document.getElementById('user-projects-list');
    if (!listContainer) {
      // 动态插入容器
      const statsDiv = document.querySelector('.user-info-stats');
      listContainer = document.createElement('div');
      listContainer.id = 'user-projects-list';
      statsDiv && statsDiv.parentNode.insertBefore(listContainer, statsDiv.nextSibling);
    }
    listContainer.innerHTML = `
      <div class="user-project-list-title">
        <button id="toggle-project-list" class="toggle-project-list-btn">${listContainer.classList.contains('open') ? '收起' : '展开'}</button>
        已创建项目
      </div>
      <div class="user-project-list-panel" style="display:${listContainer.classList.contains('open') ? 'block' : 'none'};">${projectListHtml}</div>
    `;
    // 绑定折叠按钮事件
    const toggleBtn = document.getElementById('toggle-project-list');
    if (toggleBtn) {
      toggleBtn.onclick = function() {
        listContainer.classList.toggle('open');
        fillUserInfo(); // 重新渲染
      };
    }
  }
  if(btn && modal && closeBtn) {
    btn.addEventListener('click', function() {
      fillUserInfo();
      modal.classList.add('open');
    });
    closeBtn.addEventListener('click', function() {
      modal.classList.remove('open');
    });
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
      if(e.target === modal) modal.classList.remove('open');
    });
  }
})(); 