// 天气与出行贴士管理
const WeatherManager = {
    // 当前天气数据
    weatherData: null,
    
    // 当前位置
    currentLocation: '无',
    
    // 初始化
    init() {
        console.log('初始化天气系统');
        
        // 尝试从本地存储获取上次的位置设置
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            this.currentLocation = savedLocation;
            // 获取天气数据
            this.fetchWeatherData();
        } else {
            // 本地无城市，先用IP定位
            fetch('https://uapis.cn/api/myip.php')
                .then(res => res.json())
                .then(data => {
                    console.log('IP定位API返回：', data);
                    // 兼容返回类型和字段
                    let city = '';
                    if (typeof data.city === 'string') {
                        city = data.city;
                    } else if (typeof data.city === 'number') {
                        city = String(data.city);
                    } else if (data.region && typeof data.region === 'string') {
                        city = data.region;
                    }
                    if (data.code === 200 && city) {
                        this.currentLocation = city;
                        localStorage.setItem('userLocation', city);
                    } else {
                        this.currentLocation = '天津市'; // 兜底
                    }
                })
                .catch((e) => {
                    console.error('IP定位API调用失败', e);
                    this.currentLocation = '天津市';
                })
                .finally(() => {
                    this.fetchWeatherData();
                });
        }
        
        // 每五分钟更新一次天气数据
        setInterval(() => this.fetchWeatherData(), 5 * 60 * 1000);
        
        // 添加城市设置按钮点击事件
        this.setupCityChangeEvent();

        // 添加刷新按钮点击事件
        const refreshBtn = document.getElementById('refresh-weather');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // 刷新时重新用IP定位
                fetch('https://uapis.cn/api/myip.php')
                    .then(res => res.json())
                    .then(data => {
                        console.log('IP定位API返回：', data);
                        let city = '';
                        if (typeof data.city === 'string') {
                            city = data.city;
                        } else if (typeof data.city === 'number') {
                            city = String(data.city);
                        } else if (data.region && typeof data.region === 'string') {
                            city = data.region;
                        }
                        if (data.code === 200 && city) {
                            this.currentLocation = city;
                            localStorage.setItem('userLocation', city);
                        } else {
                            this.currentLocation = '';
                        }
                    })
                    .catch((e) => {
                        console.error('IP定位API调用失败', e);
                        this.currentLocation = '';
                    })
                    .finally(() => {
                        this.fetchWeatherData();
                    });
            });
        }
    },
    
    // 设置城市修改事件
    setupCityChangeEvent() {
        const locationElem = document.getElementById('weather-location');
        
        // 添加城市设置按钮
        const cityChangeBtn = document.createElement('button');
        cityChangeBtn.className = 'city-change-btn';
        cityChangeBtn.innerHTML = '<i class="fas fa-edit"></i>';
        cityChangeBtn.title = '更改城市';
        
        // 将按钮插入到位置信息旁边
        locationElem.parentNode.appendChild(cityChangeBtn);
        
        // 点击按钮弹出修改框
        cityChangeBtn.addEventListener('click', () => {
            const newCity = prompt('请输入城市名称（如：北京市、上海市、广州市）:', this.currentLocation);
            if (newCity && newCity.trim() !== '') {
                this.setLocation(newCity.trim());
            }
        });
    },
    
    // 获取天气数据
    fetchWeatherData() {
        const weatherUrl = `https://uapis.cn/api/weather?name=${encodeURIComponent(this.currentLocation)}`;
        
        // 显示加载状态
        document.getElementById('weather-location').textContent = this.currentLocation;
        document.getElementById('weather-temp').textContent = '加载中...';
        document.getElementById('weather-condition').textContent = '加载中...';
        document.getElementById('travel-tips').textContent = '天气数据加载中...';
        
        fetch(weatherUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('天气数据获取失败，HTTP状态：' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.code === 200) {
                    // 成功获取数据
                    this.weatherData = data;
                    this.updateWeatherUI();
                } else if (data.code === 500) {
                    // 未找到城市
                    throw new Error(`城市"${this.currentLocation}"未找到，请检查城市名称`);
                } else if (data.code === 400) {
                    // 请求内容为空
                    throw new Error('请求内容不能为空');
                } else if (data.code === 0) {
                    // 非法请求
                    throw new Error('检测到非法请求，请稍后再试');
                } else {
                    // 其他错误
                    throw new Error('获取天气数据失败：' + (data.msg || '未知错误'));
                }
            })
            .catch(error => {
                console.error('获取天气信息出错:', error);
                document.getElementById('weather-location').textContent = this.currentLocation;
                document.getElementById('weather-temp').textContent = '--℃';
                document.getElementById('weather-condition').textContent = '--';
                document.getElementById('travel-tips').textContent = '天气信息获取失败：' + error.message;
                
                // 如果是城市未找到的错误，提示用户修改城市
                if (error.message.includes('未找到')) {
                    setTimeout(() => {
                        if (confirm('城市未找到，是否修改城市名称？')) {
                            const newCity = prompt('请输入城市名称（如：北京市、上海市、广州市）:', '北京市');
                            if (newCity && newCity.trim() !== '') {
                                this.setLocation(newCity.trim());
                            }
                        }
                    }, 100);
                }
            });
    },
    
    // 更新天气UI
    updateWeatherUI() {
        if (!this.weatherData) return;
        
        // 更新位置
        document.getElementById('weather-location').textContent = this.weatherData.city || this.currentLocation;
        
        // 更新温度
        document.getElementById('weather-temp').textContent = `${this.weatherData.temperature || this.weatherData.temp || '--'}℃`;
        
        // 更新天气状况
        document.getElementById('weather-condition').textContent = this.weatherData.weather || this.weatherData.wea || '--';
        
        // 更新出行贴士
        this.updateTravelTips();
    },
    
    // 更新出行贴士
    updateTravelTips() {
        let tipText = '';
        
        // 根据天气情况生成贴士
        if (!this.weatherData) {
            tipText = '天气数据加载中...';
        } else {
            // 对API返回的数据进行兼容处理
            const weather = this.weatherData.weather || this.weatherData.wea || '';
            const temp = this.weatherData.temperature || this.weatherData.temp || 0;
            const humidity = parseInt(this.weatherData.humidity || 0);
            const windDir = this.weatherData.wind_direction || '';
            const windPower = this.weatherData.wind_power || '';
            const reportTime = this.weatherData.reporttime || new Date().toLocaleString();
            
            // 添加更新时间
            tipText += `数据更新：${reportTime.split(' ')[1] || '---'} | `;
            
            // 根据天气类型给出建议
            if (weather.includes('雨')) {
                tipText += '记得携带雨伞，注意防滑。';
            } else if (weather.includes('雪')) {
                tipText += '外出注意保暖，道路可能湿滑。';
            } else if (weather.includes('晴') && parseInt(temp) > 30) {
                tipText += '天气炎热，注意防晒补水。';
            } else if (weather.includes('雾') || weather.includes('霾')) {
                tipText += '空气质量较差，建议戴口罩出行。';
            } else if (weather.includes('阴') && humidity > 80) {
                tipText += '湿度较大，外出注意保持干爽。';
            } else if (windPower.includes('≥5') || windPower.includes('大')) {
                tipText += `${windDir}风较大，外出注意安全。`;
            } else {
                tipText += `今日${weather}，湿度${humidity}%，${windDir}风${windPower}级，宜出行。`;
            }
            
            // 根据温度给出穿衣建议
            const temperatureNum = parseInt(temp);
            if (temperatureNum < 5) {
                tipText += ' 天气寒冷，注意保暖。';
            } else if (temperatureNum < 12) {
                tipText += ' 天气较凉，建议穿厚外套。';
            } else if (temperatureNum < 18) {
                tipText += ' 天气适宜，建议穿薄外套。';
            } else if (temperatureNum < 25) {
                tipText += ' 天气舒适，建议穿轻便衣物。';
            } else if (temperatureNum < 30) {
                tipText += ' 天气温暖，适宜短袖。';
            } else {
                tipText += ' 天气炎热，注意防暑降温。';
            }
        }
        
        document.getElementById('travel-tips').textContent = tipText;
    },
    
    // 设置位置
    setLocation(location) {
        this.currentLocation = location;
        localStorage.setItem('userLocation', location);
        this.fetchWeatherData();
    }
}; 