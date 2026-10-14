const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),port=Number(process.env.BIKE_PREVIEW_PORT||8191);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/baseline/dist/')){
  let relative;try{relative=decodeURIComponent(url.pathname.slice('/baseline/'.length));}catch{res.writeHead(400);res.end();return;}
  if(relative.endsWith('/'))relative+='index.html';
  if(!/^dist\/[\w./-]+$/.test(relative)||relative.includes('..')){res.writeHead(403);res.end();return;}
  try{const data=execFileSync('git',['show',`203cf52:${relative}`],{cwd:root,maxBuffer:20_000_000,windowsHide:true});res.writeHead(200,{'Content-Type':types[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Introuvable dans la version de départ');}return;
 }
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Introuvable');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(port,'127.0.0.1',()=>console.log(`Aperçu : http://127.0.0.1:${port}/dist/\nContrôles : http://127.0.0.1:${port}/qa/board-step1.html`));
