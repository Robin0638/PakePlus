// 积分详情模态框逻辑
(function() {
  const pointsBtn = document.querySelector('.points-info');
  const modal = document.getElementById('points-info-modal');
  const closeBtn = document.getElementById('close-points-info-modal');
  // 积分赚取/消费方式（静态+动态）
  const earnWays = [
    '完成任务：+20分',
    '专注计时：每5分钟+1分',
    '解锁勋章：+100分',
    '连续登录奖励',
    '其他活动奖励'
  ];
  const spendWays = [
    '兑换小工具：-20分/次',
    '解锁特殊功能',
    '其他积分消耗'
  ];
  function fillPointsInfo() {
    // 总积分
    let total = 0;
    let earnDetail = [];
    if (window.StorageManager && typeof StorageManager.getPoints === 'function') {
      total = StorageManager.getPoints();
      // 优先读取积分明细
      const data = StorageManager.getData && StorageManager.getData();
      if (data && Array.isArray(data.pointsHistory) && data.pointsHistory.length > 0) {
        // 按时间倒序
        earnDetail = data.pointsHistory.slice().sort((a, b) => new Date(b.time) - new Date(a.time)).map(item => {
          const dateStr = new Date(item.time).toLocaleString();
          const sign = item.points > 0 ? '+' : '';
          return `${item.type}：${item.desc} <span style='color:${item.points>0?'#4caf50':'#f44336'};'>${sign}${item.points}分</span>（${dateStr}）`;
        });
      } else if (data) {
        // 兼容老逻辑
        // 任务完成
        if (data.events && Array.isArray(data.events)) {
          data.events.forEach(e => {
            if (e.completed && e.completedTime) {
              earnDetail.push(`完成任务「${e.name || '未命名'}」：+20分（${new Date(e.completedTime).toLocaleDateString()}）`);
            }
          });
        }
        // 专注时长
        if (data.focusTime && data.focusTime.history) {
          data.focusTime.history.forEach(h => {
            if (h.minutes > 0) {
              earnDetail.push(`专注${h.minutes}分钟：+${Math.floor(h.minutes/5)}分（${h.date}）`);
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
    // 赚取明细
    const earnDetailList = document.getElementById('points-earn-detail-list');
    if (earnDetail.length > 0) {
      earnDetailList.innerHTML = earnDetail.map(item => `<li>${item}</li>`).join('');
    } else {
      earnDetailList.innerHTML = '<li>暂无积分赚取记录</li>';
    }
    // 赚取方式
    const earnList = document.getElementById('points-earn-list');
    earnList.innerHTML = earnWays.map(item => `<li>${item}</li>`).join('');
    // 消费方式
    const spendList = document.getElementById('points-spend-list');
    spendList.innerHTML = spendWays.map(item => `<li>${item}</li>`).join('');

    // 折叠按钮逻辑
    function setToggle(btnId, panelId) {
      const btn = document.getElementById(btnId);
      const panel = document.getElementById(panelId);
      if (btn && panel) {
        btn.onclick = function() {
          const isOpen = panel.style.display !== 'none';
          panel.style.display = isOpen ? 'none' : 'block';
          btn.textContent = isOpen ? '展开' : '收起';
        };
        // 初始化按钮文案
        btn.textContent = panel.style.display !== 'none' ? '收起' : '展开';
      }
    }
    setToggle('toggle-earn-detail', 'earn-detail-panel');
    setToggle('toggle-earn-way', 'earn-way-panel');
    setToggle('toggle-spend-way', 'spend-way-panel');
  }
  if(pointsBtn && modal && closeBtn) {
    pointsBtn.addEventListener('click', function() {
      fillPointsInfo();
      // 打开时全部收起
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