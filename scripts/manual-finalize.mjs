// Ensambla las tomas limpias y reutiliza la narración por texto, nunca por posición de la toma.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { mediaTool } from './manual-tools.mjs'
import { MANUAL_CHAPTERS } from '../src/config/manual.js'
const root=process.cwd(), base=path.join(root,'artifacts/manual-usuario'), clean=path.join(base,'clean'), old=path.join(base,'produccion')
const run=(exe,args)=>{const r=spawnSync(mediaTool(exe),args,{encoding:'utf8',maxBuffer:20e6});if(r.status!==0)throw Error(r.stderr||String(r.error));return r.stdout}
const partial=process.argv.includes('--partial')
if(!partial&&process.argv[2]!=='prepare'&&fs.existsSync(path.join(clean,'prefix-manifest.json'))){
 const prefix=JSON.parse(fs.readFileSync(path.join(clean,'prefix-manifest.json'),'utf8'))
 const marker=path.join(clean,prefix.at(-1).id+'.cache.json')
 while(!fs.existsSync(marker))await new Promise(resolve=>setTimeout(resolve,3000))
}
const manifestFile=partial&&process.argv[2]!=='prepare'?'prefix-manifest.json':'manifest.json'
const data=JSON.parse(fs.readFileSync(path.join(clean,manifestFile),'utf8'))
if((!partial&&data.length!==21)||data.some(p=>p.failure))throw Error('La grabación limpia no está completa')
let chapterIndex=-1
for(const part of data) for(const cue of part.cues) if(cue.chapter){
 chapterIndex++
 const heading=`${String(chapterIndex+1).padStart(2,'0')} · ${MANUAL_CHAPTERS[chapterIndex].title}`
 cue.text=heading+'.'+cue.text.split('.').slice(1).join('.')
 cue.chapter=heading
}
fs.writeFileSync(path.join(clean,partial?'prefix-manifest.json':'manifest.json'),JSON.stringify(data,null,2))
const previous=fs.existsSync(path.join(old,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(old,'manifest.json'),'utf8')):[];const voices=new Map()
for(const p of previous) p.cues.forEach((c,i)=>voices.set(c.text,path.join(old,'voz',`${p.id}-${i}.wav`)))
fs.mkdirSync(path.join(clean,'voz'),{recursive:true})
const jobs=[]
for(const p of data) p.cues.forEach((c,i)=>jobs.push({text:c.text,path:path.join(clean,'voz',`${p.id}-${i}.wav`),reuse:voices.get(c.text)||null}))
fs.writeFileSync(path.join(clean,'voice-jobs.json'),JSON.stringify(jobs))
if(process.argv[2]==='prepare')process.exit(0)
function pcm(file){const b=fs.readFileSync(file);let p=12;while(p+8<b.length){const n=b.readUInt32LE(p+4);if(b.toString('ascii',p,p+4)==='data')return b.subarray(p+8,p+8+n);p+=8+n+(n%2)}throw Error('WAV inválido')}
function wav(file,b){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(b.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(22050,24);h.writeUInt32LE(44100,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(b.length,40);fs.writeFileSync(file,Buffer.concat([h,b]))}
let title=''
for(const p of data){
 p.duration=Number(JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration','-of','json',path.join(clean,p.id+'.webm')])).format.duration)
 title=p.cues.find(c=>c.chapter)?.chapter||title
 const audio=Buffer.alloc(Math.ceil(p.duration*22050)*2)
 p.cues.forEach((c,i)=>{const source=pcm(path.join(clean,'voz',`${p.id}-${i}.wav`)),start=Math.round(c.t*22050),next=p.cues[i+1]?.t??p.duration,length=Math.min(source.length/2,Math.floor(Math.max(.1,next-c.t-.1)*22050));for(let j=0;j<length&&start+j<audio.length/2;j++)audio.writeInt16LE(source.readInt16LE(Math.min(source.length/2-1,Math.floor(j*source.length/2/length))*2),(start+j)*2)})
 wav(path.join(clean,p.id+'.wav'),audio)
 fs.writeFileSync(path.join(clean,p.id+'-badge.txt'),title)
 const badge=`drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':textfile='artifacts/manual-usuario/clean/${p.id}-badge.txt':fontsize=22:fontcolor=white:x=20:y=12`
 // La identificación ocupa una franja exterior a la captura: no tapa ningún control del sistema.
 const filter=(p.id==='14'?'crop=960:540:0:0,':'')+'scale=1834:1032:flags=lanczos,pad=1920:1080:43:48:color=0x082f49,'+badge
 const signature=JSON.stringify({duration:p.duration,cues:p.cues,filter,source:fs.statSync(path.join(clean,p.id+'.webm')).mtimeMs})
 const cache=path.join(clean,p.id+'.cache.json')
 if(!fs.existsSync(cache)||fs.readFileSync(cache,'utf8')!==signature){
 run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(clean,p.id+'.webm'),'-i',path.join(clean,p.id+'.wav'),'-t',String(p.duration),'-vf',filter,'-r','25','-c:v','libx264','-threads','2','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ar','48000',path.join(clean,p.id+'.mp4')]);fs.writeFileSync(cache,signature);console.log('Codificado '+p.id)
 }else console.log('Reutilizado '+p.id)
}
fs.writeFileSync(path.join(clean,partial?'prefix-manifest.json':'manifest.json'),JSON.stringify(data,null,2))
