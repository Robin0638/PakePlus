// User Info模态框逻辑
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
      // 注册time
      const data = StorageManager.getData && StorageManager.getData();
      if (data && data.user && data.user.createTime) {
        regDate = new Date(data.user.createTime).toLocaleDateString();
      } else if (data && data.loginDates && data.loginDates.length > 0) {
        regDate = data.loginDates[0];
      }
      // 累计Time
      focusTotal = (data && data.focusTime && data.focusTime.total) ? data.focusTime.total : 0;
      // 积分
      points = (data && typeof data.points === 'number') ? data.points : 0;
      // 连续登录天数
      loginDays = (data && data.loginDates) ? data.loginDates.length : 0;
    }
    let moreInfoHtml = `<div class="user-more-info">
      <div><span class="user-more-label"><i class="fas fa-calendar-alt"></i> Registration Date：</span>${regDate || '—'}</div>
      <div><span class="user-more-label"><i class="fas fa-stopwatch"></i> Total Time：</span>${focusTotal} min</div>
      <div><span class="user-more-label"><i class="fas fa-star"></i> Total Points：</span>${points}</div>
      <div><span class="user-more-label"><i class="fas fa-calendar-check"></i> Consecutive Login Days：</span>${loginDays}</div>
    </div>`;
    let moreInfoContainer = document.getElementById('user-more-info');
    if (!moreInfoContainer) {
      const avatarNickDiv = document.querySelector('.user-info-avatar-nick');
      moreInfoContainer = document.createElement('div');
      moreInfoContainer.id = 'user-more-info';
      avatarNickDiv && avatarNickDiv.parentNode.insertBefore(moreInfoContainer, avatarNickDiv.nextSibling);
    }
    moreInfoContainer.innerHTML = moreInfoHtml;
    // Item量数据来自StorageManager
    let created = 0, completed = 0;
    if (window.StorageManager && typeof StorageManager.getProjects === 'function') {
      const projects = StorageManager.getProjects() || [];
      created = projects.length;
      completed = projects.filter(p => (p.totalTasks > 0 && p.completedTasks === p.totalTasks)).length;
    }
    document.getElementById('user-projects-created').textContent = created;
    document.getElementById('user-projects-completed').textContent = completed;
    // 1. Created Lists
    let ListListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const Lists = data.Lists || [];
      if (Lists.length > 0) {
        ListListHtml = '<ul class="user-List-List">' +
          Lists.map(l => `<li><span class="List-name">${l.name || '(未命名List)'}</span> <span class="List-tasks">(${l.items ? l.items.length : 0}项)</span></li>`).join('') +
          '</ul>';
      } else {
        ListListHtml = '<div class="user-List-List-empty">No Lists Yet</div>';
      }
    }
    let ListListContainer = document.getElementById('user-Lists-List');
    if (!ListListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      ListListContainer = document.createElement('div');
      ListListContainer.id = 'user-Lists-List';
      statsDiv && statsDiv.parentNode.insertBefore(ListListContainer, statsDiv.nextSibling);
    }
    ListListContainer.innerHTML = `
      <div class="user-List-List-title">
        <button id="toggle-List-List" class="toggle-List-List-btn">${ListListContainer.classList.contains('open') ? 'Close' : 'Expand'}</button>
        Created Lists
      </div>
      <div class="user-List-List-panel" style="display:${ListListContainer.classList.contains('open') ? 'block' : 'none'};">${ListListHtml}</div>
    `;
    const toggleListBtn = document.getElementById('toggle-List-List');
    if (toggleListBtn) {
      toggleListBtn.onclick = function() {
        ListListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 2. Created Countdown Days
    let countdownListHtml = '';
    if (window.StorageManager && typeof StorageManager.getData === 'function') {
      const data = StorageManager.getData();
      const countdowns = data.countdowns || [];
      if (countdowns.length > 0) {
        countdownListHtml = '<ul class="user-countdown-List">' +
          countdowns.map(c => `<li><span class="countdown-name">${c.name || '(未命名 Countdown Day)'}</span> <span class="countdown-date">(${c.date || ''})</span></li>`).join('') +
          '</ul>';
      } else {
        countdownListHtml = '<div class="user-countdown-List-empty">No Countdown Days Yet</div>';
      }
    }
    let countdownListContainer = document.getElementById('user-countdowns-List');
    if (!countdownListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      countdownListContainer = document.createElement('div');
      countdownListContainer.id = 'user-countdowns-List';
      statsDiv && statsDiv.parentNode.insertBefore(countdownListContainer, statsDiv.nextSibling);
    }
    countdownListContainer.innerHTML = `
      <div class="user-countdown-List-title">
        <button id="toggle-countdown-List" class="toggle-countdown-List-btn">${countdownListContainer.classList.contains('open') ? 'Close' : 'Expand'}</button>
        Created Countdown Days
      </div>
      <div class="user-countdown-List-panel" style="display:${countdownListContainer.classList.contains('open') ? 'block' : 'none'};">${countdownListHtml}</div>
    `;
    const toggleCountdownBtn = document.getElementById('toggle-countdown-List');
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
        focusListHtml = '<ul class="user-focus-List">' +
          focusHistory.map(f => `<li><span class="focus-date">${f.date}</span> <span class="focus-minutes">(${f.minutes}min)</span></li>`).join('') +
          '</ul>';
      } else {
        focusListHtml = '<div class="user-focus-List-empty">No Focus Records Yet</div>';
      }
    }
    let focusListContainer = document.getElementById('user-focus-List');
    if (!focusListContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      focusListContainer = document.createElement('div');
      focusListContainer.id = 'user-focus-List';
      statsDiv && statsDiv.parentNode.insertBefore(focusListContainer, statsDiv.nextSibling);
    }
    focusListContainer.innerHTML = `
      <div class="user-focus-List-title">
        <button id="toggle-focus-List" class="toggle-focus-List-btn">${focusListContainer.classList.contains('open') ? 'Close' : 'Expand'}</button>
        Created/Completed Focus Sessions
      </div>
      <div class="user-focus-List-panel" style="display:${focusListContainer.classList.contains('open') ? 'block' : 'none'};">${focusListHtml}</div>
    `;
    const toggleFocusBtn = document.getElementById('toggle-focus-List');
    if (toggleFocusBtn) {
      toggleFocusBtn.onclick = function() {
        focusListContainer.classList.toggle('open');
        fillUserInfo();
      };
    }
    // 折叠模块化Item列表
    let projectListHtml = '';
    if (window.StorageManager && typeof StorageManager.getProjects === 'function') {
      const projects = StorageManager.getProjects() || [];
      if (projects.length > 0) {
        projectListHtml = '<ul class="user-project-List">' +
          projects.map(p => `<li><span class="project-name">${p.name || '(未命名Item)'}</span> <span class="project-tasks">(${p.completedTasks||0}/${p.totalTasks||0})</span></li>`).join('') +
          '</ul>';
      } else {
        projectListHtml = '<div class="user-project-List-empty">No Items Yet</div>';
      }
    }
    let ListContainer = document.getElementById('user-projects-List');
    if (!ListContainer) {
      // 动态插入容器
      const statsDiv = document.querySelector('.user-info-stats');
      ListContainer = document.createElement('div');
      ListContainer.id = 'user-projects-List';
      statsDiv && statsDiv.parentNode.insertBefore(ListContainer, statsDiv.nextSibling);
    }
    ListContainer.innerHTML = `
      <div class="user-project-List-title">
        <button id="toggle-project-List" class="toggle-project-List-btn">${ListContainer.classList.contains('open') ? 'Close' : 'Expand'}</button>
        Created Items
      </div>
      <div class="user-project-List-panel" style="display:${ListContainer.classList.contains('open') ? 'block' : 'none'};">${projectListHtml}</div>
    `;
    // 绑定折叠按钮Things
    const toggleBtn = document.getElementById('toggle-project-List');
    if (toggleBtn) {
      toggleBtn.onclick = function() {
        ListContainer.classList.toggle('open');
        fillUserInfo(); // 重新渲染
      };
    }
    // 展示获得的成就（勋章）
    let medalsHtml = '';
    if (window.StorageManager && typeof StorageManager.getMedals === 'function') {
      const medals = (StorageManager.getMedals() || []).filter(m => m.unlocked);
      if (medals.length > 0) {
        medalsHtml = '<ul class="user-medals-List">' +
          medals.map(m => `<li class="user-medal-item"><span class="user-medal-icon">${m.icon}</span> <span class="user-medal-name">${m.name}</span></li>`).join('') +
          '</ul>';
      } else {
        medalsHtml = '<div class="user-medals-List-empty">No Achievements Yet</div>';
      }
    }
    let medalsContainer = document.getElementById('user-medals-List');
    if (!medalsContainer) {
      const statsDiv = document.querySelector('.user-info-stats');
      medalsContainer = document.createElement('div');
      medalsContainer.id = 'user-medals-List';
      statsDiv && statsDiv.parentNode.insertBefore(medalsContainer, statsDiv.nextSibling);
    }
    medalsContainer.innerHTML = `
      <div class="user-medals-List-title">Achievements</div>
      <div class="user-medals-List-panel">${medalsHtml}</div>
    `;
  }
  // 用户Data
  const UserDataManager = {
    // 保存用户数据
    saveUserData(nickname) {
      if (!window.StorageManager) return;
      
      const data = StorageManager.getData();
      const userData = {
        nickname: nickname,
        avatar: localStorage.getItem('userAvatar') || 'img/1.png',
        projects: data.projects || [],
        tasks: data.tasks || [],
        Lists: data.Lists || [],
        countdowns: data.countdowns || [],
        focusTime: data.focusTime || {},
        points: data.points || 0,
        loginDates: data.loginDates || [],
        medals: data.medals || [],
        createTime: data.user ? data.user.createTime : new Date().toISOString(),
        lastLoginTime: new Date().toISOString()
      };
      
      // 保存到本地存储，使用昵称作为key
      localStorage.setItem(`userData_${nickname}`, JSON.stringify(userData));
      console.log(`用户数据已保存: ${nickname}`);
    },
    
    // 恢复用户数据
    restoreUserData(nickname) {
      if (!window.StorageManager) return false;
      
      const userDataStr = localStorage.getItem(`userData_${nickname}`);
      if (!userDataStr) return false;
      
      try {
        const userData = JSON.parse(userDataStr);
        
        // 恢复所有Content
        const data = StorageManager.getData();
        data.projects = userData.projects || [];
        data.tasks = userData.tasks || [];
        data.Lists = userData.Lists || [];
        data.countdowns = userData.countdowns || [];
        data.focusTime = userData.focusTime || {};
        data.points = userData.points || 0;
        data.medals = userData.medals || [];
        data.user = {
          createTime: userData.createTime,
          lastLoginTime: new Date().toISOString()
        };
        
        // 更新登录日期
        const today = new Date().toLocaleDateString();
        if (!data.loginDates) data.loginDates = [];
        if (!data.loginDates.includes(today)) {
          data.loginDates.push(today);
        }
        
        // 保存恢复的数据
        StorageManager.saveData(data);
        
        // 恢复用户头像和昵称
        localStorage.setItem('userAvatar', userData.avatar);
        localStorage.setItem('userNickname', nickname);
        
        console.log(`用户数据已恢复: ${nickname}`);
        return true;
      } catch (error) {
        console.error('恢复用户数据失败:', error);
        return false;
      }
    },
    
    // 获取所有已保存的用户
    getAllUsers() {
      const users = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userData_')) {
          const nickname = key.replace('userData_', '');
          users.push(nickname);
        }
      }
      return users;
    }
  };

  // 退出登录功能
  function logout() {
    const currentNickname = localStorage.getItem('userNickname');
    if (currentNickname) {
      // 保存当前用户数据
      UserDataManager.saveUserData(currentNickname);
      
      // Purge当前登录状态
      localStorage.removeItem('userNickname');
      localStorage.removeItem('userAvatar');
      
      // 触发登录状态变化Things
      window.dispatchEvent(new CustomEvent('userLoginStateChanged', { detail: { loggedIn: false, nickname: currentNickname } }));
      
      // Purge当前数据
      if (window.StorageManager) {
        const data = StorageManager.getData();
        data.projects = [];
        data.tasks = [];
        data.Lists = [];
        data.countdowns = [];
        data.focusTime = {};
        data.points = 0;
        data.medals = [];
        data.user = null;
        data.loginDates = [];
        StorageManager.saveData(data);
      }
      
      // Close模态框
      modal.classList.remove('open');
      
      // 显示登录界面
      if (window.UIManager) {
        UIManager.showLoginIfNeeded();
      }
      
      // 隐藏底部导航栏和侧边栏
      if (window.BottomNavNewManager) {
        BottomNavNewManager.destroy();
      }
      if (window.SidebarNavManager) {
        SidebarNavManager.destroy();
      }
      
      console.log('用户已退出登录');
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
    
    // 绑定退出登录按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
    
    // 点击模态框外部Close
    modal.addEventListener('click', function(e) {
      if(e.target === modal) modal.classList.remove('open');
    });
  }

  // 暴露UserDataManager到全局
  window.UserDataManager = UserDataManager;
})(); 