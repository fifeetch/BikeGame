// A small tree double for renderer lifecycle/event tests. Browser QA covers SVG paint.
export class Element{
 constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attributes=new Map();this.listeners=new Map();this.style={};this.textContent='';this.value='';this.parentElement=null;this.writes=0;this.offsetLeft=18;this.offsetTop=18;}
 get className(){return this.getAttribute('class')||'';}set className(v){this.setAttribute('class',v);}
 set innerHTML(v){this.html=v;this.replaceChildren();}
 setAttribute(k,v){this.attributes.set(k,String(v));this.writes++;}getAttribute(k){return this.attributes.get(k)??null;}hasAttribute(k){return this.attributes.has(k);}removeAttribute(k){this.attributes.delete(k);this.writes++;}
 append(...nodes){for(const n of nodes){n.remove();n.parentElement=this;this.children.push(n);}}
 prepend(...nodes){for(const n of nodes.reverse()){n.remove();n.parentElement=this;this.children.unshift(n);}}
 remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.parentElement=null;}}
 replaceChildren(...nodes){for(const n of [...this.children])n.remove();this.append(...nodes);}
 contains(n){return n===this||this.children.some(c=>c.contains(n));}
 closest(selector){if(selector==='[data-board-key]'&&this.hasAttribute('data-board-key')||selector==='.map-wrap'&&this.className.split(' ').includes('map-wrap'))return this;return this.parentElement?.closest(selector)||null;}
 addEventListener(k,fn){const handlers=this.listeners.get(k)||new Set();handlers.add(fn);this.listeners.set(k,handlers);}removeEventListener(k,fn){this.listeners.get(k)?.delete(fn);}
 dispatch(k,event={}){event.target||=this;event.preventDefault||=()=>{event.prevented=true;};for(const fn of this.listeners.get(k)||[])fn(event);return event;}
 getScreenCTM(){return {inverse:()=>({a:1,d:1,e:0,f:0})};}
 createSVGPoint(){return {x:0,y:0,matrixTransform(m){return {x:this.x*m.a+m.e,y:this.y*m.d+m.f};}};}
 scrollTo(options){this.scroll=options;this.scrollLeft=options.left;this.scrollTop=options.top;}
}
export function makeBoardDOM(){
 const doc={createElementNS:(_,tag)=>new Element(tag,doc),createElement:tag=>new Element(tag,doc)},wrap=new Element('div',doc),viewport=new Element('div',doc),host=new Element('div',doc);
 wrap.className='map-wrap';viewport.clientWidth=640;viewport.clientHeight=400;viewport.scrollLeft=0;viewport.scrollTop=0;wrap.append(viewport);viewport.append(host);
 return {doc,wrap,viewport,host};
}
export const descendants=root=>[root,...root.children.flatMap(descendants)];
