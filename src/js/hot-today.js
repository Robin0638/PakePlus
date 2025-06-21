// 今日热搜与历史上的今天模块
(function() {
  const HOT_API = 'https://uapis.cn/api/hotlist?type=douyin';
  const HISTORY_API = 'https://uapis.cn/api/hotlist?type=history';

  function fetchHotList() {
    const hotListEl = document.getElementById('hot-list');
    if (hotListEl) hotListEl.innerHTML = '<li>加载中...</li>';
    fetch(HOT_API)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          renderHotList(data.data);
        } else {
          hotListEl.innerHTML = '<li>获取失败</li>';
        }
      })
      .catch(() => {
        if (hotListEl) hotListEl.innerHTML = '<li>获取失败</li>';
      });
  }

  function renderHotList(list) {
    const hotListEl = document.getElementById('hot-list');
    if (!hotListEl) return;
    hotListEl.innerHTML = '';
    list.slice(0, 6).forEach((item, idx) => {
      let topClass = '';
      if (idx < 5) topClass = `top5 top${idx+1}`;
      const li = document.createElement('li');
      li.className = topClass;
      li.innerHTML = `<span class=\"hot-rank\">${idx+1}</span><span class=\"hot-title\">${item.title}</span>` +
        (item.url ? `<a class=\"hot-link\" href=\"${item.url}\" target=\"_blank\">🔗</a>` : '');
      hotListEl.appendChild(li);
    });
    renderHotSource();
  }

  function renderHotSource() {
    let src = document.getElementById('hot-source');
    if (!src) {
      src = document.createElement('div');
      src.className = 'data-source';
      src.id = 'hot-source';
      hotListEl = document.getElementById('hot-list');
      if (hotListEl && hotListEl.parentNode) {
        hotListEl.parentNode.appendChild(src);
      }
    }
    src.innerHTML = '数据来源：<a href="https://uapis.cn/hot/douyin" target="_blank">uapis.cn 抖音热榜</a>';
  }

  function fetchHistory() {
    const historyListEl = document.getElementById('history-list');
    if (historyListEl) historyListEl.innerHTML = '<li>加载中...</li>';
    fetch(HISTORY_API)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          renderHistoryList(data.data);
        } else {
          historyListEl.innerHTML = '<li>获取失败</li>';
        }
      })
      .catch(() => {
        if (historyListEl) historyListEl.innerHTML = '<li>获取失败</li>';
      });
  }

  function renderHistoryList(list) {
    const historyListEl = document.getElementById('history-list');
    if (!historyListEl) return;
    historyListEl.innerHTML = '';
    list.slice(0, 10).forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span class=\"hot-title\">${item.title}</span>`;
      historyListEl.appendChild(li);
    });
    renderHistorySource();
  }

  function renderHistorySource() {
    let src = document.getElementById('history-source');
    if (!src) {
      src = document.createElement('div');
      src.className = 'data-source';
      src.id = 'history-source';
      historyListEl = document.getElementById('history-list');
      if (historyListEl && historyListEl.parentNode) {
        historyListEl.parentNode.appendChild(src);
      }
    }
    src.innerHTML = '数据来源：<a href="https://uapis.cn/hot/history" target="_blank">uapis.cn 历史上的今天</a>';
  }

  // 刷新按钮事件
  function bindRefresh() {
    const hotBtn = document.getElementById('refresh-hot-btn');
    if (hotBtn) hotBtn.onclick = fetchHotList;
    const historyBtn = document.getElementById('refresh-history-btn');
    if (historyBtn) historyBtn.onclick = fetchHistory;
  }

  // 初始化
  function initHotToday() {
    fetchHotList();
    fetchHistory();
    bindRefresh();
  }

  // 页面加载后自动初始化
  document.addEventListener('DOMContentLoaded', initHotToday);

  // 提供全局刷新方法
  window.refreshHotToday = function() {
    fetchHotList();
    fetchHistory();
  };
})(); 