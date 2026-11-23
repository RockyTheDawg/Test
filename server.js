import http from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed = {'/favicon.png':'favicon.png','/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/store.js':'store.js'};
http.createServer(async(req,res)=>{const file=allowed[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);return res.end('Not found');}try{res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(new URL(file,import.meta.url)));}catch{res.writeHead(500);res.end('Unable to load page');}}).listen(3000,'127.0.0.1',()=>console.log('Charge demo: http://localhost:3000'));
