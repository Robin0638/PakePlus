// Points Info Modal Logic
(function() {
  const pointsBtn = document.querySelector('.points-info');
  const modal = document.getElementById('points-info-modal');
  const closeBtn = document.getElementById('close-points-info-modal');
  // Points Earning/Spending Methods (Static + Dynamic)
  const earnWays = [
    'Completed Task: +20 points',
    'Focus Timer: +1 point per 5min',
    'Unlock Medal: +100 points',
    'Consecutive Login Reward',
    'Other Activity Rewards'
  ];
  const spendWays = [
    'Redeem Tool: -20 points/time',
    'Unlock Special Feature',
    'Other Points Spending'
  ];
  function fillPointsInfo() {
    // Total Points
    let total = 0;
    let earnDetail = [];
    if (window.StorageManager && typeof StorageManager.getPoints === 'function') {
      total = StorageManager.getPoints();
      // 优先读取积分明细
      const data = StorageManager.getData && StorageManager.getData();
      if (data && Array.isArray(data.pointsHistory) && data.pointsHistory.length > 0) {
        // 按time倒序
        earnDetail = data.pointsHistory.slice().sort((a, b) => new Date(b.time) - new Date(a.time)).map(item => {
          const dateStr = new Date(item.time).toLocaleString();
          const sign = item.points > 0 ? '+' : '';
          const type = item.type || '番茄时钟Completed';
          const desc = item.desc || '';
          return `${type}：${desc} <span style='color:${item.points>0?'#4caf50':'#f44336'};'>${sign}${item.points}分</span>（${dateStr}）`;
        });
      } else if (data) {
        // 兼容老逻辑
        // 任务Completed
        if (data.events && Array.isArray(data.events)) {
          data.events.forEach(e => {
            if (e.completed && e.completedTime) {
              earnDetail.push(`Completed任务「${e.name || '未命名'}」：+20分（${new Date(e.completedTime).toLocaleDateString()}）`);
            }
          });
        }
        // Time
        if (data.focusTime && data.focusTime.history) {
          data.focusTime.history.forEach(h => {
            if (h.minutes > 0) {
              earnDetail.push(`专注${h.minutes}min：+${Math.floor(h.minutes/5)}分（${h.date}）`);
            }
          });
        }
        // 勋章
        if (data.medals && Array.isArray(data.medals)) {
          data.medals.forEach(m => {
            if (m.unlocked && m.unlockTime) {
              earnDetail.push(`解锁勋章「${m.name}」：+100分（${new Date(m.unlockTime).toLocaleDateString()}）`);
            }
          });
        }
      }
    }
    document.getElementById('points-info-total').textContent = total;
    // Earning Details
    const earnDetailList = document.getElementById('points-earn-detail-List');
    if (earnDetail.length > 0) {
      earnDetailList.innerHTML = earnDetail.map(item => `<li>${item}</li>`).join('');
    } else {
      earnDetailList.innerHTML = '<li>No Points Earning Records Yet</li>';
    }
    // Earning Methods
    const earnList = document.getElementById('points-earn-List');
    earnList.innerHTML = earnWays.map(item => `<li>${item}</li>`).join('');
    // Spending Methods
    const spendList = document.getElementById('points-spend-List');
    spendList.innerHTML = spendWays.map(item => `<li>${item}</li>`).join('');

    // 折叠按钮逻辑
    function setToggle(btnId, panelId) {
      const btn = document.getElementById(btnId);
      const panel = document.getElementById(panelId);
      if (btn && panel) {
        btn.onclick = function() {
          const isOpen = panel.style.display !== 'none';
          panel.style.display = isOpen ? 'none' : 'block';
          btn.textContent = isOpen ? 'Expand' : 'Close';
        };
        // 初始化按钮文案
        btn.textContent = panel.style.display !== 'none' ? 'Close' : 'Expand';
      }
    }
    setToggle('toggle-earn-detail', 'earn-detail-panel');
    setToggle('toggle-earn-way', 'earn-way-panel');
    setToggle('toggle-spend-way', 'spend-way-panel');
  }
  if(pointsBtn && modal && closeBtn) {
    pointsBtn.addEventListener('click', function() {
      fillPointsInfo();
      // 打开时全部Close
      document.getElementById('earn-detail-panel').style.display = 'none';
      document.getElementById('earn-way-panel').style.display = 'none';
      document.getElementById('spend-way-panel').style.display = 'none';
      modal.classList.add('open');
    });
    closeBtn.addEventListener('click', function() {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', function(e) {
      if(e.target === modal) modal.classList.remove('open');
    });
  }
})(); 