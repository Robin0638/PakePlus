// Calorie Counter
(function() {
  // BMI Standards
  const bmiLevels = [
    { max: 18.4, label: 'Underweight', advice: 'Recommended to increase nutritional intake' },
    { max: 23.9, label: 'Normal', advice: 'Maintain good eating habits' },
    { max: 27.9, label: 'Overweight', advice: 'Recommended to control diet appropriately' },
    { max: Infinity, label: 'Obese', advice: 'Recommended to reduce high-calorie food intake' }
  ];
  // Recommended intake (approximate values, unit: kcal)
  const calorieTable = {
    male:   [2500, 2300, 2000, 1800], // Corresponding to bmiLevels
    female: [2000, 1800, 1600, 1400]
  };
  // Seasonal fruits and vegetables recommendations
  const seasonalAdvice = {
    'spring': ['Spinach', 'Asparagus', 'Strawberry', 'Cherry', 'Peas'],
    'summer': ['Tomato', 'Cucumber', 'Peach', 'Watermelon', 'Bitter gourd'],
    'autumn': ['Pumpkin', 'Grape', 'Apple', 'Carrot', 'Persimmon'],
    'winter': ['Cabbage', 'Orange', 'Radish', 'Kiwi', 'Chinese yam']
  };
  function getSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  // Recommended calorie cache
  let currentRecommended = 0;
  // Local storage key
  const STORAGE_KEY = 'dietCalorieData';
  // Save data to localStorage
  function saveDietData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  // Load data
  function loadDietData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch(e) { return {}; }
  }
  // Fold state key
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
      <h3>Calorie Counter</h3>
      <form class="diet-calorie-form">
        <label>Height (cm)<input type="number" id="diet-height" min="80" max="250" required></label>
        <label>Weight (kg)<input type="number" id="diet-weight" min="20" max="200" required></label>
        <label>Gender：
          <select id="diet-gender">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <button type="button" class="diet-calc-btn" id="diet-calc-btn">Calculate BMI & Recommended Intake</button>
      </form>
      <div class="diet-bmi-result" id="diet-bmi-result"></div>
      <div class="diet-calorie-advice" id="diet-calorie-advice"></div>
      <div class="diet-meal-section">
        <div class="fold-header"><button class="fold-btn" id="fold-breakfast-btn">${foldState.breakfast===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">Breakfast</h4></div>
        <div class="diet-meal-List" id="diet-breakfast-List" style="display:${foldState.breakfast===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="add-breakfast-btn" style="display:${foldState.breakfast===false?'inline-block':'none'}">Add Breakfast Food</button>
        <div class="fold-header"><button class="fold-btn" id="fold-lunch-btn">${foldState.lunch===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">Lunch</h4></div>
        <div class="diet-meal-List" id="diet-lunch-List" style="display:${foldState.lunch===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="add-lunch-btn" style="display:${foldState.lunch===false?'inline-block':'none'}">Add Lunch Food</button>
        <div class="fold-header"><button class="fold-btn" id="fold-dinner-btn">${foldState.dinner===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">Dinner</h4></div>
        <div class="diet-meal-List" id="diet-dinner-List" style="display:${foldState.dinner===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="add-dinner-btn" style="display:${foldState.dinner===false?'inline-block':'none'}">Add Dinner Food</button>
        <div class="fold-header"><button class="fold-btn" id="fold-custom-btn">${foldState.custom===false?'<span>▼</span>':'<span>▶</span>'}</button><h4 style="display:inline;">Custom Meal</h4></div>
        <div class="diet-meal-List" id="diet-meal-List" style="display:${foldState.custom===false?'block':'none'}"></div>
        <button class="diet-add-meal-btn" id="diet-add-meal-btn" style="display:${foldState.custom===false?'inline-block':'none'}">Add Custom Meal</button>
        <div class="diet-total-calorie" id="diet-total-calorie">Today's Total Calories: 0 kcal / Recommended: 0 kcal</div>
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
    function toggleFold(section, ListId, btnId, addBtnId) {
      const List = document.getElementById(ListId);
      const btn = document.getElementById(btnId);
      const addBtn = addBtnId ? document.getElementById(addBtnId) : null;
      const folded = List.style.display === 'none';
      List.style.display = folded ? 'block' : 'none';
      if (addBtn) addBtn.style.display = folded ? 'inline-block' : 'none';
      btn.innerHTML = folded ? '<span>▼</span>' : '<span>▶</span>';
      setFold(section, !folded);
    }
    document.getElementById('fold-breakfast-btn').onclick = function(e){e.preventDefault();toggleFold('breakfast','diet-breakfast-List','fold-breakfast-btn','add-breakfast-btn');};
    document.getElementById('fold-lunch-btn').onclick = function(e){e.preventDefault();toggleFold('lunch','diet-lunch-List','fold-lunch-btn','add-lunch-btn');};
    document.getElementById('fold-dinner-btn').onclick = function(e){e.preventDefault();toggleFold('dinner','diet-dinner-List','fold-dinner-btn','add-dinner-btn');};
    document.getElementById('fold-custom-btn').onclick = function(e){e.preventDefault();toggleFold('custom','diet-meal-List','fold-custom-btn','diet-add-meal-btn');};
    // Read local data
    const saved = loadDietData();
    // Restore input items
    if(saved.height) document.getElementById('diet-height').value = saved.height;
    if(saved.weight) document.getElementById('diet-weight').value = saved.weight;
    if(saved.gender) document.getElementById('diet-gender').value = saved.gender;
    // Restore three meals
    function restoreMealList(ListId, savedArr) {
      const List = document.getElementById(ListId);
      List.innerHTML = '';
      if(Array.isArray(savedArr) && savedArr.length > 0) {
        savedArr.forEach(meal => {
          const row = document.createElement('div');
          row.className = 'meal-row ' + ListId.replace('diet-','meal-row-').replace('-List','');
          row.innerHTML = `<input type="text" placeholder="Food Name" value="${meal.name||''}" /><input type="number" placeholder="Calories(kcal)" min="0" value="${meal.kcal||''}" /><button class="remove-meal-btn">Delete</button>`;
          row.querySelector('.remove-meal-btn').onclick = function() {
            row.remove();
            updateTotalCalorie();
            saveAll();
          };
          List.appendChild(row);
        });
      } else {
        // At least one row
        const row = document.createElement('div');
        row.className = 'meal-row ' + ListId.replace('diet-','meal-row-').replace('-List','');
        row.innerHTML = `<input type="text" placeholder="Food Name" value="" /><input type="number" placeholder="Calories(kcal)" min="0" value="" /><button class="remove-meal-btn">Delete</button>`;
        row.querySelector('.remove-meal-btn').onclick = function() {
          row.remove();
          updateTotalCalorie();
          saveAll();
        };
        List.appendChild(row);
      }
    }
    restoreMealList('diet-breakfast-List', saved.breakfast);
    restoreMealList('diet-lunch-List', saved.lunch);
    restoreMealList('diet-dinner-List', saved.dinner);
    // Restore custom meals
    const mealList = document.getElementById('diet-meal-List');
    if(Array.isArray(saved.meals) && saved.meals.length > 0) {
      mealList.innerHTML = '';
      saved.meals.forEach(meal => {
        const row = document.createElement('div');
        row.className = 'meal-row';
        row.innerHTML = `<input type="text" placeholder="Meal Name" value="${meal.name||''}"><input type="number" placeholder="Calories(kcal)" min="0" value="${meal.kcal||''}"><button class="remove-meal-btn">Delete</button>`;
        row.querySelector('.remove-meal-btn').onclick = function() {
          row.remove();
          updateTotalCalorie();
          saveAll();
        };
        mealList.appendChild(row);
      });
    }
    // Things绑定
    document.getElementById('diet-calc-btn').onclick = function() {
      const h = parseFloat(document.getElementById('diet-height').value);
      const w = parseFloat(document.getElementById('diet-weight').value);
      const g = document.getElementById('diet-gender').value;
      if (!h || !w) {
        document.getElementById('diet-bmi-result').textContent = 'Please enter height and weight';
        return;
      }
      const bmi = w / Math.pow(h/100, 2);
      let levelIdx = bmiLevels.findIndex(l => bmi <= l.max);
      if (levelIdx === -1) levelIdx = bmiLevels.length - 1;
      const level = bmiLevels[levelIdx];
      const cal = calorieTable[g][levelIdx];
      currentRecommended = cal;
      document.getElementById('diet-bmi-result').textContent = `BMI: ${bmi.toFixed(1)} (${level.label})`;
      document.getElementById('diet-calorie-advice').textContent = `Advice: ${level.advice}, daily recommended intake about ${cal} kcal.`;
      updateTotalCalorie(); // 重新显示推荐热量
      saveAll();
    };
    // 保存所有Content
    function saveAll() {
      const height = document.getElementById('diet-height').value;
      const weight = document.getElementById('diet-weight').value;
      const gender = document.getElementById('diet-gender').value;
      function getMeals(ListId) {
        return Array.from(document.querySelectorAll(`#${ListId} .meal-row`)).map(row => ({
          name: row.children[0].value,
          kcal: row.children[1].value
        }));
      }
      const breakfast = getMeals('diet-breakfast-List');
      const lunch = getMeals('diet-lunch-List');
      const dinner = getMeals('diet-dinner-List');
      const meals = getMeals('diet-meal-List');
      saveDietData({height, weight, gender, breakfast, lunch, dinner, meals});
    }
    // 餐食热量统计
    function updateTotalCalorie() {
      function sum(ListId) {
        return Array.from(document.querySelectorAll(`#${ListId} .meal-row`)).reduce((t,row)=>{
          return t + (parseFloat(row.children[1].value)||0);
        },0);
      }
      const total = sum('diet-breakfast-List') + sum('diet-lunch-List') + sum('diet-dinner-List') + sum('diet-meal-List');
      document.getElementById('diet-total-calorie').textContent = `Today's Total Calories: ${total} kcal / Recommended: ${currentRecommended || 0} kcal`;
    }
    // 监听三餐和自定义餐食输入
    ['diet-breakfast-List','diet-lunch-List','diet-dinner-List','diet-meal-List'].forEach(ListId=>{
      document.getElementById(ListId).addEventListener('input', function(){
        updateTotalCalorie();
        saveAll();
      });
    });
    // 添加三餐食物
    document.getElementById('add-breakfast-btn').onclick = function() {
      const List = document.getElementById('diet-breakfast-List');
      const row = document.createElement('div');
      row.className = 'meal-row meal-row-breakfast';
      row.innerHTML = `<input type="text" placeholder="Food Name" value="" /><input type="number" placeholder="Calories(kcal)" min="0" value="" /><button class="remove-meal-btn">Delete</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      List.appendChild(row);
      saveAll();
    };
    document.getElementById('add-lunch-btn').onclick = function() {
      const List = document.getElementById('diet-lunch-List');
      const row = document.createElement('div');
      row.className = 'meal-row meal-row-lunch';
      row.innerHTML = `<input type="text" placeholder="Food Name" value="" /><input type="number" placeholder="Calories(kcal)" min="0" value="" /><button class="remove-meal-btn">Delete</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      List.appendChild(row);
      saveAll();
    };
    document.getElementById('add-dinner-btn').onclick = function() {
      const List = document.getElementById('diet-dinner-List');
      const row = document.createElement('div');
      row.className = 'meal-row meal-row-dinner';
      row.innerHTML = `<input type="text" placeholder="Food Name" value="" /><input type="number" placeholder="Calories(kcal)" min="0" value="" /><button class="remove-meal-btn">Delete</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      List.appendChild(row);
      saveAll();
    };
    // Add custom meal
    document.getElementById('diet-add-meal-btn').onclick = function() {
      const row = document.createElement('div');
      row.className = 'meal-row';
      row.innerHTML = `<input type="text" placeholder="餐食名"><input type="number" placeholder="热量(kcal)" min="0"><button class="remove-meal-btn">Delet</button>`;
      row.querySelector('.remove-meal-btn').onclick = function() {
        row.remove();
        updateTotalCalorie();
        saveAll();
      };
      document.getElementById('diet-meal-List').appendChild(row);
      saveAll();
    };
    // 输入项保存
    document.getElementById('diet-height').addEventListener('input', saveAll);
    document.getElementById('diet-weight').addEventListener('input', saveAll);
    document.getElementById('diet-gender').addEventListener('change', saveAll);
    // Seasonal recommendations
    const season = getSeason();
    document.getElementById('diet-seasonal-advice').textContent = `Seasonal recommended fruits and vegetables: ${seasonalAdvice[season].join(', ')}`;
    // Automatically calculate once after first render
    updateTotalCalorie();
  }
  // Display in health and all groups
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
  // Listen for group switching
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