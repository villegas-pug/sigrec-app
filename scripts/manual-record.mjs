// Regraba los guiones locales con resaltados ligados al elemento, sin subtítulos quemados.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
const root=process.cwd().replaceAll('\\','/')
const old=`${root}/scripts/manual/scenarios`
const clean=`${root}/artifacts/manual-usuario/clean`
fs.mkdirSync(clean,{recursive:true})
const order=['01','02','03','03b','04','05','05b','06','07','08','08b','09','09b','10','10b','11','12','13','16','13b','14']
const helper=fs.readFileSync(`${old}/helper.txt`,'utf8')
function cli(args){const r=spawnSync('playwright-cli.cmd',['-s=manual-clean',...args],{encoding:'utf8',maxBuffer:20e6,shell:true});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout}
cli(['open','http://localhost:9000'])
cli(['resize','1920','1080'])
cli(['screenshot',`--filename=${clean}/example.png`])
const manifest=[]
for(const id of order){
 let body=fs.readFileSync(`${old}/${id}.txt`,'utf8')
 body=body.replaceAll('C:/work-space/uspnna-app',root)
 const mobile=id==='14'?`const context=await page.context().browser().newContext({viewport:{width:960,height:540},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/145.0.0.0 Mobile Safari/537.36'});page=await context.newPage();await page.goto('http://localhost:9000');`:''
 const code=`async page=>{${mobile}await page.screencast.start({path:'${clean}/${id}.webm',size:{width:1920,height:1080}});${helper}let failure=null;try{${body}}catch(e){failure=String(e)}const duration=(Date.now()-started)/1000;await page.screencast.stop();${id==='14'?'await context.close();':''}return {id:'${id}',duration,cues,failure};}`
 fs.writeFileSync(`${clean}/${id}.js`,code)
 const log=cli(['run-code',`--filename=${clean}/${id}.js`]);fs.writeFileSync(`${clean}/${id}.log`,log)
 const line=log.split(/\r?\n/).find(x=>x.startsWith('{"id":'));if(!line)throw Error(`Sin resultado: ${id}`)
 const data=JSON.parse(line);manifest.push(data);fs.writeFileSync(`${clean}/manifest.json`,JSON.stringify(manifest,null,2));console.log(`${id}: ${data.duration}s ${data.failure||'grabado'}`)
 if(data.failure)throw Error(data.failure)
}
cli(['close'])
