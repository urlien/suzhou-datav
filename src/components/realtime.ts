// Only display observations returned by the provider; never substitute invented weather.
type Weather = { temp: string; feelsLike: string; humidity: string; wind: string; description: string; observedAt: string; fetchedAt: string }
let weather: Weather | null = null
let failed = false
export async function fetchWeather() {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch('https://wttr.in/Suzhou?format=j1&lang=zh', {signal:controller.signal})
    if (!response.ok) throw new Error('天气服务不可用')
    const data = await response.json(), current = data.current_condition?.[0]
    if (!current || !Number.isFinite(Number(current.temp_C))) throw new Error('天气数据无效')
    weather = {temp:current.temp_C,feelsLike:current.FeelsLikeC,humidity:current.humidity,wind:current.windspeedKmph,description:current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '',observedAt:current.localObsDateTime || current.observation_time || '服务未提供观测时间',fetchedAt:new Date().toLocaleString('zh-CN')}
  } catch { failed = true }
  finally { clearTimeout(timer) }
  return weather
}
export async function fetchAirQuality() { return null }
export function renderWeatherPanel(container: HTMLElement) {
  container.replaceChildren()
  const text = document.createElement('p')
  text.style.cssText = 'font-size:14px;line-height:1.7'
  text.textContent = weather ? `${weather.temp}°C · ${weather.description}；体感 ${weather.feelsLike}°C，湿度 ${weather.humidity}%，风速 ${weather.wind} km/h。` : failed ? '天气暂时无法获取；请稍后刷新。' : '正在读取天气观测…'
  container.append(text)
  const source = document.createElement('p'); source.className = 'weather-source'
  source.textContent = weather ? `来源：wttr.in · 观测时间：${weather.observedAt} · 获取时间：${weather.fetchedAt}` : '未显示离线替代数值。'
  container.append(source)
}
export function getWeatherData() { return weather }
export function getForecastData() { return [] }
export function getAirQualityData() { return null }
