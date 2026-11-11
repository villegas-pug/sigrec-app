import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { mediaTool } from './manual-tools.mjs'
const root = process.cwd()
const production = path.join(root, 'artifacts/manual-usuario', process.argv[2] === 'clean' ? 'clean' : 'produccion')
const ffmpeg = mediaTool('ffmpeg')
const ffprobe = mediaTool('ffprobe')
const out = path.join(root,'public/manual/v1')
fs.mkdirSync(out,{recursive:true})
const definitions = [
 ['start','Inicio y navegación',['inicio'],'menú buscar avisos indicadores ayuda manual'],
 ['centers','Centros, módulos y ambientes',['centros'],'registrar agregar crear actualizar editar consultar centro módulo ambiente infraestructura jerarquía'],
 ['assets','Bienes y componentes',['centros'],'registrar agregar crear actualizar editar consultar bien componente verificar trasladar asociar inventario previo'],
 ['incidents','Incidentes, bajas y reposiciones',['incidencias'],'incidente daño baja reponer afectados'],
 ['infrastructure','Fotografías e infraestructura',['centros'],'fotos imagen fumigación extintor recarga mantenimiento intervención novedad'],
 ['budget','Necesidades y presupuesto',['necesidades'],'necesidad presupuesto precio catálogo tipo valorar simulador exportar'],
 ['inventory','Inventario para planificación',['inventario'],'inventario equipo condición mal estado exportar verificar'],
 ['services','Servicios básicos y pagos',['servicios'],'registrar informar editar actualizar consultar servicio pagar pago período interrupción restablecimiento proveedor'],
 ['vehicles','Vehículos',['vehiculos'],'vehículo placa chofer rendimiento mantenimiento operativo'],
 ['itineraries','Itinerarios',['itinerarios'],'itinerario recorrido ejecución mapa ruta puntos distancia'],
 ['fuel','Combustible',['combustible'],'combustible carga consumo litros comparación'],
 ['profiles','Perfiles y verificación física',[],'perfil permisos jornada chofer recorrido verificar escanear rótulo'],
 ['common','Acciones comunes y captura rápida',[],'anular eliminar borrar reactivar deshacer cancelar ayuda búsqueda registro rápido centro módulo ambiente bien componente fotografía novedad intervención mantenimiento tipo servicio vehículo itinerario combustible'],
 ['mobile','Vista móvil y dictado',[],'móvil dictado voz micrófono permisos cámara']
]
const manifest = JSON.parse(fs.readFileSync(path.join(production,'manifest.json'),'utf8'))
const groups=[]
for(const part of manifest){if(part.cues.some(c=>c.chapter))groups.push([]);groups.at(-1).push(part)}
if(groups.length!==definitions.length || manifest.some(part=>part.failure))throw Error('Se requieren los 14 capítulos completos y sin errores de grabación')
function run(exe,args){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:10e6});if(r.status!==0)throw Error(r.stderr);return r.stdout}
const stamp=s=>{const ms=Math.floor(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`}
const chapters=[]
const demonstrations=['# Demostraciones del manual','', 'Índice generado desde las tomas finales. Los tiempos corresponden al inicio de cada explicación dentro del capítulo; complementa la matriz de cobertura.','', '| Capítulo | Instante | Demostración |','| --- | --- | --- |']
for(let i=0;i<groups.length;i++){
 const [id,title,routes,keywords]=definitions[i];const parts=groups[i];let offset=0;let vtt='WEBVTT\n\n'
 for(const part of parts){part.cues.forEach((cue,j)=>{const end=Math.min(part.cues[j+1]?.t??part.duration,part.duration);const text=cue.chapter?cue.text.slice(cue.chapter.length).replace(/^\.\s*/,''):cue.text;if(end>cue.t){vtt+=`${stamp(offset+cue.t)} --> ${stamp(offset+end)}\n${String(i+1).padStart(2,'0')} · ${title}\n${text}\n\n`;demonstrations.push(`| ${String(i+1).padStart(2,'0')} · ${title} | ${stamp(offset+cue.t)} | ${text.replaceAll('|',' / ')} |`)}});offset+=part.duration}
 const list=path.join(production,`${id}-concat.txt`);fs.writeFileSync(list,parts.map(p=>`file '${p.id}.mp4'`).join('\n'))
 const subtitles=path.join(out,`${id}.vtt`);fs.writeFileSync(subtitles,vtt)
 const file=path.join(out,`${id}.mp4`)
 run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-i',subtitles,'-map','0:v:0','-map','0:a:0','-map','1:0','-map_chapters','-1','-c','copy','-bsf:v','h264_metadata=sample_aspect_ratio=1/1','-aspect','16:9','-c:s','mov_text','-metadata:s:s:0','language=spa','-movie_timescale','1000','-movflags','+faststart',file])
 const info=JSON.parse(run(ffprobe,['-v','error','-show_entries','format=duration:stream=width,height','-of','json',file]))
 if(fs.statSync(file).size>=100*1024*1024)throw Error(`Archivo demasiado grande: ${id}`)
 if(!info.streams.some(stream=>stream.width===1920&&stream.height===1080))throw Error(`Resolución incorrecta: ${id}`)
 run(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss','6','-i',file,'-frames:v','1','-update','1',path.join(out,`${id}.jpg`)])
 chapters.push({id,title,routes,topics:keywords.split(' '),duration:Number(info.format.duration),video:`manual/v1/${id}.mp4`,subtitles:`manual/v1/${id}.vtt`,poster:`manual/v1/${id}.jpg`})
 console.log(`${id}: ${chapters.at(-1).duration}s`)
}
fs.writeFileSync(path.join(root,'src/config/manual.js'),`// Catálogo generado desde los medios finales; duraciones medidas con ffprobe.\nexport const MANUAL_CHAPTERS = ${JSON.stringify(chapters,null,2)}\n`)
fs.writeFileSync(path.join(root,'docs/manual-demonstrations.md'),demonstrations.join('\n')+'\n')
