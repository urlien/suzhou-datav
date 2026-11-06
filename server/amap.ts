import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { loadEnv, type Plugin } from 'vite'
import { reachableNetwork } from './reachable-network.mjs'
export function amapPlugin(): Plugin {
  const configure = (server: any) => {
    const key = loadEnv(server.config.mode, server.config.root, '').AMAP_MAPS_API_KEY
    const cache = new Map<string, {time: number; data: unknown}>()
    let queue: Promise<unknown> = Promise.resolve()
    async function query(path: string, args: Record<string,string>) {
      const cacheKey = path + JSON.stringify(args)
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.time < 15 * 60 * 1000) return cached.data as any
      const task = queue.catch(() => {}).then(async () => {
        const existing = cache.get(cacheKey)
        if (existing && Date.now() - existing.time < 15 * 60 * 1000) return existing.data
        if (!key) throw new Error('尚未配置高德 Web 服务密钥')
        const url = new URL('https://restapi.amap.com/v3/' + path)
        url.search = new URLSearchParams({...args, key}).toString()
        const response = await fetch(url, {signal: AbortSignal.timeout(12000)})
        const data = await response.json()
        if (data.status !== '1') throw new Error('高德服务返回：' + data.info)
        if (cache.size > 250) cache.clear()
        cache.set(cacheKey, {time: Date.now(), data})
        await new Promise(resolve => setTimeout(resolve, 350))
        return data
      })
      queue = task
      return task as Promise<any>
    }
    const roadCache = new Map<string, {time:number;elements:any[]}>()
    server.middlewares.use('/api/isochrone', async (req:any,res:any) => {
      res.setHeader('Content-Type','application/json; charset=utf-8')
      try {
        const p=new URL(req.url||'/', 'http://localhost').searchParams
        const lon=Number(p.get('lon')),lat=Number(p.get('lat')),minutes=Number(p.get('minutes'))
        if(req.method!=='GET'||!Number.isFinite(lon)||!Number.isFinite(lat)||lon<119.8||lon>121.5||lat<30.7||lat>32.1||![5,10,15].includes(minutes))throw Error('请选择苏州市域坐标和5/10/15分钟阈值')
        const cacheKey=`${lon.toFixed(3)},${lat.toFixed(3)}`
        let cached=roadCache.get(cacheKey)
        if(!cached||Date.now()-cached.time>3600000){
          // The OSM map endpoint preserves shared node IDs and way access tags.
          const bbox=[lon-.017,lat-.015,lon+.017,lat+.015].map(n=>n.toFixed(6)).join(',')
          const url='https://api.openstreetmap.org/api/0.6/map.json?bbox='+bbox
          let data
          try {
            const response=await fetch(url,{signal:AbortSignal.timeout(10000)})
            if(!response.ok)throw Error('OSM request failed')
            data=await response.json()
          } catch {
            const {stdout}=await promisify(execFile)(process.platform==='win32'?'curl.exe':'curl',['-fsSL','--max-time','25',url],{timeout:27000,maxBuffer:24*1024*1024})
            data=JSON.parse(stdout)
          }
          if(!data.elements?.length)throw Error('OSM路网查询不完整，请稍后重试')
          cached={time:Date.now(),elements:data.elements};if(roadCache.size>8)roadCache.clear();roadCache.set(cacheKey,cached)
        }
        const result=reachableNetwork(cached.elements,[lon,lat],minutes)
        res.end(JSON.stringify({...result,fetchedAt:new Date(cached.time).toISOString(),source:'OpenStreetMap contributors / OSM API',minimumCoverageMeters:1500,model:'步行4.8km/h，遵守foot/access及oneway:foot；不含信号灯、坡度、临时封闭和过街等待'}))
      }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e instanceof Error?e.message:'路网计算失败'}))}
    })
    server.middlewares.use('/api/places', async (req, res) => {
      res.setHeader('Content-Type','application/json; charset=utf-8')
      try {
        const params = new URL(req.url || '/', 'http://localhost').searchParams
        const district = params.get('district') || ''
        const category = params.get('category') || ''
        const codes: Record<string,string> = {'医疗':'090100','教育':'141200','景区':'110000'}
        const districts = ['姑苏区','吴中区','相城区','虎丘区','吴江区','昆山市','常熟市','张家港市','太仓市','苏州工业园区']
        if (req.method !== 'GET' || !districts.includes(district) || !codes[category]) throw new Error('请选择区县和设施类别')
        const districtCodes: Record<string,string> = {'姑苏区':'320508','吴中区':'320506','相城区':'320507','虎丘区':'320505','吴江区':'320509','昆山市':'320583','常熟市':'320581','张家港市':'320582','太仓市':'320585'}
        const park = district === '苏州工业园区'
        const data = await query('place/text',{keywords:park?'苏州工业园区':'',city:districtCodes[district] || '320500',citylimit:'true',types:codes[category],offset:'25',page:'1',extensions:'all'})
        // 园区不是独立县级行政区编码；只作市域关键词检索，不伪装边界裁切。
        const scope = park ? '苏州市域内“苏州工业园区”关键词匹配，未按园区边界裁切' : district + '行政区代码 ' + districtCodes[district]
        const filtered = (data.pois || []).filter((p:any) => park || String(p.adcode) === districtCodes[district])
        const places = filtered.map((p:any) => ({name:p.name,address:p.address,location:p.location,district:p.adname,type:p.type}))
        res.end(JSON.stringify({places,total:Number(data.count),queriedAt:new Date().toISOString(),category,district,scope}))
      } catch(error) {res.statusCode=400;res.end(JSON.stringify({error:error instanceof Error?error.message:'查询失败'}))}
    })
    server.middlewares.use('/api/route' , async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      try {
        if (req.method !== 'GET') throw new Error('仅支持查询')
        if (!key) throw new Error('尚未配置高德 Web 服务密钥')
        const params = new URL(req.url || '/', 'http://localhost').searchParams
        const origin = params.get('origin') || '', destination = params.get('destination') || ''
        if (!origin || !destination || origin.length > 80 || destination.length > 80) throw new Error('请填写有效的苏州市内起终点')
        async function locate(address: string) {
          const data = await query('geocode/geo', {address, city:'苏州市'})
          const point = data.geocodes?.find((g: any) => String(g.adcode).startsWith('3205'))
          if (!point) throw new Error('未找到苏州市内地址，请补充区县与具体地名')
          return point
        }
        const a = await locate(origin), b = await locate(destination)
        const data = await query('direction/driving', {origin:a.location,destination:b.location,extensions:'all',strategy:'0'})
        const path = data.route?.paths?.[0]
        if (!path) throw new Error('暂无可用驾车路线')
        res.end(JSON.stringify({origin:a.formatted_address,destination:b.formatted_address,distance:path.distance,duration:path.duration,steps:path.steps.map((s:any)=>({instruction:s.instruction,polyline:s.polyline})),queriedAt:new Date().toISOString()}))
      } catch (error) { res.statusCode = 400; res.end(JSON.stringify({error:error instanceof Error ? error.message : '路线查询失败'})) }
    })
  }
  return { name: 'local-amap', configureServer: configure, configurePreviewServer: configure }
}
