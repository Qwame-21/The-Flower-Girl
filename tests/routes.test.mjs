import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, pageForPath } from '../src/site/routes.js';
test('public routes round-trip and unknown paths do not render the homepage',()=>{
 for(const [key,[path]] of Object.entries(pages)){assert.equal(pageForPath(path),key);assert.equal(pageForPath(path==='/'?'/':path+'/'),key);}
 assert.equal(pageForPath('/missing-page'),'not-found');
 assert.equal(new Set(Object.values(pages).map(p=>p[1])).size,Object.keys(pages).length);
});
