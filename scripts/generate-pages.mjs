import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { pages, brand } from '../src/site/routes.js';
const env=loadEnv('production',process.cwd(),'VITE_');
const origin=env.VITE_SITE_URL?.replace(/\/$/,'');
if(origin && new URL(origin).protocol!=='https:') throw Error('VITE_SITE_URL must be the production HTTPS origin.');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const base=await readFile('dist/index.html','utf8');
for(const [key,[path,title,description]] of Object.entries({...pages,admin:['/admin','Staff workspace','Sign in to your staff workspace.'],'404':['/404','Page not found','The requested page could not be found.']})){
 const privatePage=['admin','404','track'].includes(key);
 let html=base.replace(/<title>.*?<\/title>/,`<title>${escape(title+' | '+brand)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(description)}" />`);
 let tags=`<meta name="robots" content="${privatePage?'noindex, nofollow':'index, follow'}"><meta property="og:title" content="${escape(title+' | '+brand)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">`;
 if(origin){tags+=`<link rel="canonical" href="${escape(origin+path)}"><meta property="og:url" content="${escape(origin+path)}"><meta property="og:image" content="${escape(origin)}/assets/hamper-editorial-v2.png">`;
 if(key==='home')tags+=`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Store',name:brand,url:origin,image:origin+'/assets/hamper-editorial-v2.png',telephone:'+233202417072',address:{'@type':'PostalAddress',streetAddress:'ACP Estate Junction, Kwabenya',addressLocality:'Accra',addressCountry:'GH'}}).replaceAll('<','\\u003c')}</script>`;}
 html=html.replace('</head>',tags+'</head>');
 if(key==='home')await writeFile('dist/index.html',html);else if(key==='404')await writeFile('dist/404.html',html);else {await mkdir(`dist${path}`,{recursive:true});await writeFile(`dist${path}/index.html`,html);}
}
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /track\n${origin?'Sitemap: '+origin+'/sitemap.xml\n':''}`);
if(origin)await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.entries(pages).filter(([key])=>key!=='track').map(([,entry])=>`<url><loc>${escape(origin+entry[0])}</loc></url>`).join('')}</urlset>`);
else console.warn('Production domain not configured: set VITE_SITE_URL to generate canonical URLs and sitemap.xml.');
await writeFile('dist/llms.txt',`# ${brand}\n\n> Flowers, personalized gifts and gift presentation in Accra, Ghana.\n\n## Public pages\n${Object.entries(pages).filter(([key])=>key!=='track').map(([,entry])=>`- [${entry[1]}](${origin||''}${entry[0]}): ${entry[2]}`).join('\n')}\n`);
