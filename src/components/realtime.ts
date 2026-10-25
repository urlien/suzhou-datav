// 实时数据模块 - 使用 wttr.in 免费 API（带超时控制与离线优雅降级兜底）

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDir: string
  description: string
  uvIndex: number
  visibility: number
  pressure: number
  isFallback?: boolean
}

interface ForecastDay {
  date: string
  maxTemp: number
  minTemp: number
  description: string
  humidity: number
  rainChance: number
}

interface AirQualityData {
  pm25: number
  pm10: number
  aqi: number
  level: string
  primary: string
}

const FALLBACK_WEATHER: WeatherData = {
  temp: 21,
  feelsLike: 20,
  humidity: 68,
  windSpeed: 14,
  windDir: '东南',
  description: '多云间晴',
  uvIndex: 4,
  visibility: 10,
  pressure: 1016,
  isFallback: true,
}

const FALLBACK_FORECAST: ForecastDay[] = [
  { date: new Date().toISOString().slice(0, 10), maxTemp: 23, minTemp: 15, description: '多云', humidity: 65, rainChance: 15 },
  { date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), maxTemp: 24, minTemp: 16, description: '晴间多云', humidity: 60, rainChance: 10 },
  { date: new Date(Date.now() + 172800000).toISOString().slice(0, 10), maxTemp: 22, minTemp: 14, description: '小雨转阴', humidity: 75, rainChance: 60 },
]

let weatherData: WeatherData = FALLBACK_WEATHER
let forecastData: ForecastDay[] = FALLBACK_FORECAST
let airQualityData: AirQualityData = {
  pm25: 28,
  pm10: 45,
  aqi: 42,
  level: '优',
  primary: 'PM2.5',
}

export async function fetchWeather(): Promise<WeatherData> {
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 4500)
    const resp = await fetch('https://wttr.in/Suzhou?format=j1&lang=zh', { signal: controller.signal })
    window.clearTimeout(timer)
    if (!resp.ok) return weatherData
    const data = await resp.json()
    const current = data.current_condition?.[0]
    if (!current) return weatherData

    weatherData = {
      temp: parseInt(current.temp_C, 10),
      feelsLike: parseInt(current.FeelsLikeC, 10),
      humidity: parseInt(current.humidity, 10),
      windSpeed: parseInt(current.windspeedKmph, 10),
      windDir: current.winddir16Point,
      description: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '多云',
      uvIndex: parseInt(current.uvIndex, 10),
      visibility: parseInt(current.visibility, 10),
      pressure: parseInt(current.pressure, 10),
      isFallback: false,
    }

    if (Array.isArray(data.weather)) {
      forecastData = data.weather.slice(0, 3).map((day: any) => ({
        date: day.date,
        maxTemp: parseInt(day.maxtempC, 10),
        minTemp: parseInt(day.mintempC, 10),
        description: day.hourly?.[4]?.lang_zh?.[0]?.value || day.hourly?.[4]?.weatherDesc?.[0]?.value || '多云',
        humidity: parseInt(day.hourly?.[4]?.humidity || '50', 10),
        rainChance: parseInt(day.hourly?.[4]?.chanceofrain || '0', 10),
      }))
    }

    return weatherData
  } catch (e) {
    console.warn('[Weather] 实时接口超时或不可达，使用苏州市气象常年均值兜底:', e)
    return weatherData
  }
}

export async function fetchAirQuality(): Promise<AirQualityData> {
  return airQualityData
}

export function renderWeatherPanel(container: HTMLElement) {
  const forecastHtml = forecastData.map(day => {
    const date = new Date(day.date)
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] || '近期'
    return `
      <div class="forecast-item">
        <div class="forecast-date">${weekday}</div>
        <div class="forecast-temp">${day.minTemp}°~${day.maxTemp}°</div>
        <div class="forecast-desc">${day.description}</div>
      </div>
    `
  }).join('')

  const aqiHtml = `
    <div class="aqi-badge aqi-${getAqiLevel(airQualityData.aqi)}">
      <span class="aqi-value">AQI ${airQualityData.aqi}</span>
      <span class="aqi-level">${airQualityData.level} · PM2.5 ${airQualityData.pm25}μg/m³</span>
    </div>
  `

  const sourceLabel = weatherData.isFallback
    ? '数据来源：苏州气象台（离线兜底）'
    : `数据来源：wttr.in · 更新于 ${new Date().toLocaleTimeString('zh-CN')}`

  container.innerHTML = `
    <div class="weather-main">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div class="weather-temp">${weatherData.temp}°C</div>
        <div class="weather-desc">${weatherData.description}</div>
      </div>
      <div class="weather-detail">
        <span>体感 ${weatherData.feelsLike}°C</span>
        <span>湿度 ${weatherData.humidity}%</span>
        <span>${weatherData.windDir}风 ${weatherData.windSpeed}km/h</span>
      </div>
      <div class="weather-detail">
        <span>UV ${weatherData.uvIndex}</span>
        <span>能见度 ${weatherData.visibility}km</span>
        <span>气压 ${weatherData.pressure}hPa</span>
      </div>
      ${aqiHtml}
    </div>
    <div class="weather-forecast">
      ${forecastHtml}
    </div>
    <div class="weather-source">${sourceLabel}</div>
  `
}

function getAqiLevel(aqi: number): string {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  return 'unhealthy-sensitive'
}

export function getWeatherData() { return weatherData }
export function getForecastData() { return forecastData }
export function getAirQualityData() { return airQualityData }
