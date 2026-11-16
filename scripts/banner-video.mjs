import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const file=readFileSync(new URL('../site/navigation.js',import.meta.url),'utf8');
const code=file.slice(file.indexOf('const bannerVideos'));
function run(reduced=false,hidden=false) {
 const callbacks=new Map(),observed=[];
 const videos=[0,1].map(()=>({paused:true,plays:0,pauses:0,play(){this.plays++;return Promise.resolve()},pause(){this.pauses++},addEventListener(type,fn){this.ready=fn}}));
 const document={hidden,querySelectorAll:()=>videos,addEventListener:(name,fn)=>callbacks.set(name,fn)};
 vm.runInNewContext(code,{document,window:{matchMedia:()=>({matches:reduced}),addEventListener:(name,fn)=>callbacks.set(name,fn)},IntersectionObserver:class{observe(video){observed.push(video)}}});
 return {videos,callbacks,observed,document};
}
let r=run();assert.equal(r.videos[0].plays,1,'first banner starts immediately');assert.equal(r.videos[0].preload,'auto');assert.equal(r.videos[0].autoplay,true);
assert.equal(r.videos[0].muted,true);assert.equal(r.videos[0].playsInline,true);
assert.deepEqual(r.observed,[r.videos[1]],'only lower-page videos wait for intersection');
r.videos[0].ready();assert.equal(r.videos[0].plays,2,'retry once ready');
r.callbacks.get('pageshow')();assert.equal(r.videos[0].plays,3,'restore playback on return');
r=run(false,true);assert.equal(r.videos[0].plays,0);r.document.hidden=false;r.callbacks.get('visibilitychange')();assert.equal(r.videos[0].plays,1);
r=run(true);assert(r.videos.every(v=>v.plays===0&&v.pauses===1&&v.autoplay===false));
console.log('Banner video checks passed: immediate start, muted inline playback, readiness/return retry, hidden tabs, lazy secondary videos and reduced motion.');
