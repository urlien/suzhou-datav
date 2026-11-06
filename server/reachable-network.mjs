export function reachableNetwork(elements, origin, minutes, speed=80) {
 const nodes=new Map(elements.filter(e=>e.type==='node').map(n=>[n.id,[n.lon,n.lat]])); const graph=new Map(); const edges=[];
 const distance=(a,b)=>Math.hypot((a[0]-b[0])*111320*Math.cos((a[1]+b[1])*Math.PI/360),(a[1]-b[1])*111320);
 const add=(a,b)=>{const pa=nodes.get(a),pb=nodes.get(b);if(!pa||!pb)return;const length=distance(pa,pb);if(!length)return;const edge={a,b,pa,pb,length,cost:length/speed};edges.push(edge);if(!graph.has(a))graph.set(a,[]);graph.get(a).push(edge)};
 for(const w of elements.filter(e=>e.type==='way')){const t=w.tags||{};if(!t.highway||t.area==='yes')continue;if(t.foot==='no'||t.foot==='private'||(['no','private'].includes(t.access)&&!['yes','designated','permissive'].includes(t.foot)))continue;if(['motorway','motorway_link','trunk','trunk_link','construction','proposed'].includes(t.highway))continue;for(let i=1;i<w.nodes.length;i++){if(t['oneway:foot']!=='-1')add(w.nodes[i-1],w.nodes[i]);if(t['oneway:foot']!=='yes')add(w.nodes[i],w.nodes[i-1])}}
 let start=null,snap=Infinity;for(const id of graph.keys()){const d=distance(origin,nodes.get(id));if(d<snap){snap=d;start=id}}
 if(start===null||snap>250)throw Error('起点250米内没有可用步行路网，请调整坐标');
 const times=new Map([[start,snap/speed]]),heap=[[snap/speed,start]];
 const push=(item)=>{heap.push(item);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=item[0])break;heap[i]=heap[p];i=p}heap[i]=item};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c}heap[i]=last}return first};
 while(heap.length){const [time,id]=pop();if(time!==times.get(id)||time>minutes)continue;for(const e of graph.get(id)||[]){const next=time+e.cost;if(next<=minutes&&next<(times.get(e.b)??Infinity)){times.set(e.b,next);push([next,e.b])}}}
 const segments=[];for(const e of edges){const t=times.get(e.a);if(t===undefined||t>=minutes)continue;const fraction=Math.min(1,(minutes-t)/e.cost);segments.push({coordinates:[e.pa,[e.pa[0]+(e.pb[0]-e.pa[0])*fraction,e.pa[1]+(e.pb[1]-e.pa[1])*fraction]],startMinutes:t,endMinutes:Math.min(minutes,t+e.cost)})}
 return {segments,snapMeters:Math.round(snap),nodeCount:nodes.size,edgeCount:edges.length,reachedNodes:times.size,origin,snappedOrigin:nodes.get(start),minutes,speedKmh:speed*60/1000};
}
