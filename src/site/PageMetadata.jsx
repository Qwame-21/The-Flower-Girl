import { useEffect } from 'react';
import { pages, brand } from './routes';
export default function PageMetadata({ page, admin }) {
 useEffect(() => {
  const entry = admin ? ['/admin','Staff workspace','Sign in to your staff workspace.'] : pages[page] || ['/404','Page not found','The requested page could not be found.'];
  const title = `${entry[1]} | ${brand}`;
  document.title=title;
  const meta=(key,value,property=false)=>{let node=document.head.querySelector(`meta[${property?'property':'name'}="${key}"]`);if(!node){node=document.createElement('meta');node.setAttribute(property?'property':'name',key);document.head.append(node);}node.content=value;};
  meta('description',entry[2]);meta('robots',admin || page==='not-found' || page==='track'?'noindex, nofollow':'index, follow');
  meta('og:title',title,true);meta('og:description',entry[2],true);meta('twitter:card','summary_large_image');
  const origin=import.meta.env.VITE_SITE_URL;
  if(origin){const url=new URL(entry[0],origin).href;let link=document.head.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link);}link.href=url;meta('og:url',url,true);meta('og:image',new URL('/assets/hamper-editorial-v2.png',origin).href,true);}
 },[page,admin]);
 return null;
}
