// 饮食卡路里计算器
(function() {
  // BMI标准
  const bmiLevels = [
    { max: 18.4, label: '偏瘦', advice: '建议适当增加营养摄入' },
    { max: 23.9, label: '正常', advice: '保持良好饮食习惯' },
    { max: 27.9, label: '超重', advice: '建议适当控制饮食' },
    { max: Infinity, label: '肥胖', advice: '建议减少高热量食物摄入' }
  ];
  // 推荐摄入量（大致值，单位kcal）
  const calorieTable = {
    male:   [2500, 2300, 2000, 1800], // 对应bmiLevels
    female: [2000, 1800, 1600, 1400]
  };
  // 时令蔬果建议
  const seasonalAdvice = {
    'spring': ['菠菜', '芦笋', '草莓', '樱桃', '豌豆'],
    'summer': ['西红柿', '黄瓜', '桃子', '西瓜', '苦瓜'],
    'autumn': ['南瓜', '葡萄', '苹果', '胡萝卜', '柿子'],
    'winter': ['白菜', '橙子', '萝卜', '猕猴桃', '山药']
  };
  function getSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  // 推荐热量缓存
  let currentRecommended = 0;
  // 本地存储key
  const STORAGE_KEY = 'dietCalorieData';
  // 保存数据到localStorage
  function saveDietData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  // 读取数据
  function loadDietData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch(e) { return {}; }
  }
  // 折叠状态key
  const FOLD_KEY = 'dietCalorieFold';
  function saveFoldState(state) {
    localStorage.setItem(FOLD_KEY, JSON.stringify(state));
  }
  function loadFoldState() {
    try {
      return JSON.parse(localStorage.getItem(FOLD_KEY)) || {};
    } catch(e) { return {}; }
  }
  function renderDietCalorieCard() {
    if (document.getElementById('diet-calorie-card')) return;
    const foldState = loadFoldState();
    const card = document.createElement('div');
    card.className = 'diet-calorie-card';
    card.id = 'diet-calorie-card';
    card.innerHTML = `
      <h3>饮食卡路里计算器</h3>
      <form class="diet-calorie-form">
        <label>身高 (cm)：<input type="number" id="diet-height" min="80" max="250" required></label>
        <label>体重 (kg)：<input type="number" id="diet-weight" min="20" max="200" required></label>
        <label>性别：
          <select id="diet-gender">
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
        <button type="button" class="diet-calc-btn" id="diet-calc-btn">计算BMI与推荐摄入量</button>
      </form>
      <div class="diet-bmi-result" id="diet-bmi-result"></div>
      <div class="diet-calorie-advice" id="diet-calorie-advice"></div>
      <div class="diet-meal-section">
        <div class="fold-header"><button class="fold-btn" id="fold-breakfast-btn">${foldState.breakfast===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">早餐</h4></div>
        <div class="diet-meal-list" id="diet-breakfast-list" style="display:${foldState.breakfast===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="add-breakfast-btn" style="display:${foldState.breakfast===false?'inline-block':'none'}">添加早餐食物</button>
        <div class="fold-header"><button class="fold-btn" id="fold-lunch-btn">${foldState.lunch===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">午餐</h4></div>
        <div class="diet-meal-list" id="diet-lunch-list" style="display:${foldState.lunch===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="add-lunch-btn" style="display:${foldState.lunch===false?'inline-block':'none'}">添加午餐食物</button>
        <div class="fold-header"><button class="fold-btn" id="fold-dinner-btn">${foldState.dinner===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">晚餐</h4></div>
        <div class="diet-meal-list" id="diet-dinner-list" style="display:${foldState.dinner===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="add-dinner-btn" style="display:${foldState.dinner===false?'inline-block':'none'}">添加晚餐食物</button>
        <div class="fold-header"><button class="fold-btn" id="fold-custom-btn">${foldState.custom===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">自定义餐食</h4></div>
        <div class="diet-meal-list" id="diet-meal-list" style="display:${foldState.custom===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="diet-add-meal-btn" style="display:${foldState.custom===false?'inline-block':'none'}">添加自定义餐食</button>
        <div class="diet-total-calorie" id="diet-total-calorie">今日总热量：0 kcal / 推荐：0 kcal</div>
      </div>
      <div class="diet-seasonal-advice" id="diet-seasonal-advice"></div>
    `;
    // 插入到健康卡片区域
    const relaxMain = document.querySelector('.relax-main-content');
    if (relaxMain) {
      relaxMain.insertBefore(card, relaxMain.firstChild);
    } else {
      document.body.appendChild(card);
    }
    // 折叠按钮逻辑
    function setFold(section, fold) {
      const state = loadFoldState();
      state[section] = fold;
      saveFoldState(state);
    }
    function toggleFold(section, listId, btnId, addBtnId) {
      const list = document.getElementById(listId);
      const btn = document.getElementById(btnId);
      const addBtn = addBtnId ? document.getElementById(addBtnId) : null;
      const folded = list.style.display === 'none';
      list.style.display = folded ? 'block' : 'none';
      if (addBtn) addBtn.style.display = folded ? 'inline-block' : 'none';
      btn.innerHTML = folded ? '<span>▼</span>' : '<span>▶</span>';
      setFold(section, !folded);
    }
    document.getElementById('fold-breakfast-btn').onclick = function(e){e.preventDefault();toggleFold('breakfast','diet-breakfast-list','fold-breakfast-btn','add-breakfast-btn');};
    document.getElementById('fold-lunch-btn').onclick = function(e){e.preventDefault();toggleFold('lunch','diet-lunch-list','fold-lunch-btn','add-lunch-btn');};
    document.getElementById('fold-dinner-btn').onclick = function(e){e.preventDefault();toggleFold('dinner','diet-dinner-list','fold-dinner-btn','add-dinner-btn');};
    document.getElementById('fold-custom-btn').onclick = function(e){e.preventDefault();toggleFold('custom','diet-meal-list','fold-custom-btn','diet-add-meal-btn');};
    // 读取本地数据
    const saved = loadDietData();
    // 恢复输入项
    if(saved.height) document.getElementById('diet-height').value = saved.height;
    if(saved.weight) document.getElementById('diet-weight').value = saved.weight;
    if(saved.gender) document.getElementById('diet-gender').value = saved.gender;
    // 恢复三餐
    function restoreMealList(listId, savedArr) {
      const list = document.getElementById(listId);
      list.innerHTML = '';
      if(Array.isArray(savedArr) && savedArr.length > 0) {
        savedArr.forEach(meal => {
          const row = document.createElement('div');
          row.className = 'meal-row ' + listId.replace('diet-','meal-row-').replace('-list','');
          row.innerHTML = `<input type="text" placeholder="食物名" value="${meal.name||''}" /><input type="number" placeholder="热量(kcal)" min="0" value="${meal.kcal||''}" /><button class="remove-meal-btn">删除</button>`;
          row.querySelector('.remove-meal-btn').onclick = function() {
            row.remove();
            updateTotalCalorie();
            saveAll();
          };
          list.appendChild(row);
        });
      } else {
        // 至少有一行
        const row = document.createElement('div');
        row.className = 'meal-row ' + listId.replace('diet-','meal-row-').replace('-list','');
        row.innerHTML = `<input type="text" placeholder="食物名" value="" /><input type="number" placeholder="热量(kcal)" min="0" value="" /><button class="remove-meal-btn">删除</button>`;
        row.querySelector('.remove-meal-btn').onclick = function() {
          row.remove();
          updateTotalCalorie();
          saveAll();
        };
        list.appendChild(row);
      }
    }
    restoreMealList('diet-breakfast-list', saved.breakfast);
    restoreMealList('diet-lunch-list', saved.lunch);
    restoreMealList('diet-dinner-list', saved.dinner);
    // 恢复自定义餐食
    const mealList = document.getElementById('diet-meal-list');
    if(Array.isArray(saved.meals) && saved.meals.length > 0) {
      mealList.innerHTML = '';
      saved.meals.forEach(meal => {
        const row = document.createElement('div');
        row.className = 'meal-row';
        row.innerHTML = `<input type="text" placeholder="餐食名" value="${meal.name||''}"><input type="number" placeholder="热量(kcal)" min="0" value="${meal.kcal||''}"><button class="remove-meal-btn">删除</button>`;
        row.querySelector('.remove-meal-btn').onclick = function() {
          row.remove();
          updateTotalCalorie();
          saveAll();
        };
        mealList.appendChild(row);
      });
    }
    // 事件绑定
    document.getElementById('diet-calc-btn').onclick = function() {
      const h = parseFloat(document.getElementById('diet-height').value);
      const w = parseFloat(document.getElementById('diet-weight').value);
      const g = document.getElementById('diet-gender').value;
      if (!h || !w) {
        document.getElementById('diet-bmi-result').textContent = '请输入身高和体重';
        return;
      }
      const bmi = w / Math.pow(h/100, 2);
      let levelIdx = bmiLevels.findIndex(l => bmi <= l.max);
      if (levelIdx === -1) levelIdx = bmiLevels.length - 1;
      const level = bmiLevels[levelIdx];
      const cal = calorieTable[g][levelIdx];
      currentRecommended = cal;
      document.getElementById('diet-bmi-result').textContent = `BMI：${bmi.toFixed(1)}（${level.label}）`;
      document.getElementById('diet-calorie-advice').textContent = `建议：${level.advice}，每日推荐摄入量约${cal}千卡。`;
      updateTotalCalorie(); // 重新显示推荐热量
      saveAll();
    };
    // 保存所有数据
    function saveAll() {
      const height = document.getElementById('diet-height').value;
      const weight = document.getElementById('diet-weight').value;
      const gender = document.getElementById('diet-gender').value;
      function getMeals(listId) {
        return Array.from(document.querySelectorAll(`#${listId} .meal-row`)).map(row => ({
          name: row.children[0].value,
          kcal: row.children[1].value
        }));
      }
      const breakfast = getMeals('diet-breakfast-list');
      const lunch = getMeals('diet-lunch-list');
      const dinner = getMeals('diet-dinner-list');
      const meals = getMeals('diet-meal-list');
      saveDietData({height, weight, gender, breakfast, lunch, dinner, meals});
    }
    // 餐食热量统计
    function updateTotalCalorie() {
      function sum(listId) {
        return Array.from(document.querySelectorAll(`#${listId} .meal-row`)).reduce((t,row)=>{
          return t + (parseFloat(row.children[1].value)||0);
        },0);
      }
      const total = sum('diet-breakfast-list') + sum('diet-lunch-list') + sum('diet-dinner-list') + sum('diet-meal-list');
      document.getElementById('diet-total-calorie').textContent = `今日总热量：${total} kcal / 推荐：${currentRecommended || 0} kcal`;
    }
    // 监听三餐和自定义餐食输入
    ['diet-breakfast-list','diet-lunch-list','diet-dinner-list','diet-meal-list'].forEach(listId=>{
      document.getElementById(listId).addEventListener('input', function(){
        updateTotalCalorie();
        saveAll();
      });
    });
    // 添加三餐食物
    document.getElementById('add-breakfast-btn').onclick = function() {
      const list = document.getElementById('diet-breakfast-list');
      const row = document.createElement('div');
      row.className = 'meal-row meal-row-breakfast';
      row.innerHTML = `<input type="text" placeholder="食物名" value="" /><input type="number" placeholder="热量(kcal)" min="0" value="" /><button class="remove-meal-btn">删除</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      list.appendChild(row);
      saveAll();
    };
    document.getElementById('add-lunch-btn').onclick = function() {
      const list = document.getElementById('diet-lunch-list');
      const row = document.createElement('div');
      row.className = 'meal-row meal-row-lunch';
      row.innerHTML = `<input type="text" placeholder="食物名" value="" /><input type="number" placeholder="热量(kcal)" min="0" value="" /><button class="remove-meal-btn">删除</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      list.appendChild(row);
      saveAll();
    };
    document.getElementById('add-dinner-btn').onclick = function() {
      const list = document.getElementById('diet-dinner-list');
      const row = document.createElement('div');
      row.className = 'meal-row meal-row-dinner';
      row.innerHTML = `<input type="text" placeholder="食物名" value="" /><input type="number" placeholder="热量(kcal)" min="0" value="" /><button class="remove-meal-btn">删除</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      list.appendChild(row);
      saveAll();
    };
    // 添加自定义餐食
    document.getElementById('diet-add-meal-btn').onclick = function() {
      const row = document.createElement('div');
      row.className = 'meal-row';
      row.innerHTML = `<input type="text" placeholder="餐食名"><input type="number" placeholder="热量(kcal)" min="0"><button class="remove-meal-btn">删除</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      document.getElementById('diet-meal-list').appendChild(row);
      saveAll();
    };
    // 输入项保存
    document.getElementById('diet-height').addEventListener('input', saveAll);
    document.getElementById('diet-weight').addEventListener('input', saveAll);
    document.getElementById('diet-gender').addEventListener('change', saveAll);
    // 时令建议
    const season = getSeason();
    document.getElementById('diet-seasonal-advice').textContent = `本季推荐蔬菜水果：${seasonalAdvice[season].join('、')}`;
    // 首次渲染后自动计算一次
    updateTotalCalorie();
  }
  // 在health和all分组显示
  function isHealthOrAllTabActive() {
    const activeTab = document.querySelector('.relax-group-tab.active');
    return activeTab && (activeTab.dataset.group === 'health' || activeTab.dataset.group === 'all');
  }
  function tryShowOrRemoveCard() {
    if (isHealthOrAllTabActive()) {
      renderDietCalorieCard();
    } else {
      const card = document.getElementById('diet-calorie-card');
      if (card) card.remove();
    }
  }
  // 监听分组切换
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(tryShowOrRemoveCard, 300);
    // 监听分组tab点击
    document.querySelectorAll('.relax-group-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        setTimeout(tryShowOrRemoveCard, 300);
      });
    });
  });
})(); 