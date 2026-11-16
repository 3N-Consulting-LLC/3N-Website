import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site/page-navigation.js',import.meta.url),'utf8');
function setup(connection={}) {
 const events=new Map(),hints=[];
 vm.runInNewContext(source,{navigator:{connection},location:{href:'https://3nconsultinggroup.com/'},URL,Set,
  document:{createElement:()=>({}),head:{append:hint=>hints.push(hint)},addEventListener:(type,fn)=>events.set(type,fn)}});
 function hover(href,{target='',download=false,type='pointerover'}={}) {
  const link={href,target,hasAttribute:()=>download};
  events.get(type)?.({target:{closest:()=>link}});
 }
 return {events,hints,hover};
}
let t=setup();
assert(!t.events.has('click'),'normal navigation must never be intercepted');
t.hover('/cloud-based-future/');t.hover('/cloud-based-future/#outcomes');
assert.equal(t.hints.length,1,'repeated intent must not duplicate requests');
assert.equal(t.hints[0].href,'https://3nconsultinggroup.com/cloud-based-future/');
for(const href of ['#services','https://other.example/','/assets/paper.pdf','mailto:info@example.com','/team/?filter=all'])t.hover(href);
t.hover('/team/',{target:'_blank'});t.hover('/team/',{download:true});
assert.equal(t.hints.length,1,'anchors, external destinations, downloads and separate tabs remain untouched');
t.hover('/team/',{type:'focusin'});t.hover('/contact/',{type:'touchstart'});
assert.equal(t.hints.length,3,'keyboard and mobile intent also warm destinations');
for(let i=0;i<10;i++)t.hover(`/example-${i}/`);
assert.equal(t.hints.length,6,'speculative work stays bounded');
for(const connection of [{saveData:true},{effectiveType:'2g'},{effectiveType:'slow-2g'}])assert.equal(setup(connection).events.size,0);
const css=readFileSync(new URL('../site/styles.css',import.meta.url),'utf8');
assert(css.includes('animation: page-copy-arrive 500ms'));
assert(css.includes('animation: page-media-arrive 600ms'));
assert(css.includes('@view-transition { navigation: none; }'));
console.log('Navigation checks passed: normal links, duplicate/capped prefetch, anchors, external links, keyboard/touch, data saver and reduced motion.');
