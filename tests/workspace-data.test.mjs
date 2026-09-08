import test from 'node:test';
import assert from 'node:assert/strict';
import { adminView, saveBrowserRecord, validateProductImage, localDateTime } from '../src/admin/utils/workspaceData.js';
test('admin view hides demo figures without mutating stored data or gallery',()=>{
 const data={orders:[{id:'order-gf-1052'},{id:'real'}],reviews:[{id:'RV-018'},{id:'actual'}],gallery:[{id:'keep'}]};
 const view=adminView(data);assert.deepEqual(view.orders,[{id:'real'}]);assert.deepEqual(view.reviews,[{id:'actual'}]);assert.equal(view.gallery,data.gallery);assert.equal(data.orders.length,2);
});
test('saving a browser record preserves other records, fields and gallery',()=>{
 const store=new Map();const events=[];globalThis.window={localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},dispatchEvent:event=>events.push(event)};
 const original={products:[{id:'one',name:'Original',stock:3,image:'/keep.png'},{id:'two',name:'Other'}],gallery:[{id:'gallery',src:'/gallery.jpg'}]};
 store.set('gifting-factory-admin-data-v2',JSON.stringify(original));
 saveBrowserRecord('products',{id:'one'},{name:'Updated'});
 const saved=JSON.parse(store.get('gifting-factory-admin-data-v2'));assert.equal(saved.products[0].name,'Updated');assert.equal(saved.products[0].stock,3);assert.deepEqual(saved.products[1],original.products[1]);assert.deepEqual(saved.gallery,original.gallery);assert.equal(events.length,1);delete globalThis.window;
});
test('product image validation rejects unsafe protocols',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','//unknown.test/image'])assert.throws(()=>validateProductImage(url));
 validateProductImage('https://example.com/image.png');validateProductImage('/assets/image.png');
});
test('delivery dates are formatted for native date inputs without invalid strings',()=>{
 assert.equal(localDateTime('bad'),'');assert.equal(localDateTime(null),'');assert.match(localDateTime('2026-09-08T12:30:00Z'),/^2026-09-08T\d{2}:30$/);
});

test('admin catalogue hides unchanged examples but preserves edited and shared records', async () => {
  const { readAdminData } = await import('../src/admin/api/adminStore.js');
  const oldWindow = global.window;
  try {
    global.window = { localStorage: { getItem: () => null } };
    const original = readAdminData();
    const example = original.products[0];
    const view = adminView(original);
    assert.equal(view.products.length, 0);
    assert.equal(view.collections.length, 0);
    assert.equal(view.promotions.length, 0);
    assert.equal(view.careers.length, 0);
    assert.deepEqual(view.gallery, original.gallery);
    const edited = { ...example, stock: 99 };
    const shared = { ...example, source: 'supabase' };
    assert.deepEqual(adminView({ products: [edited, shared] }).products, [edited, shared]);
    assert.equal(original.products.length, 4);
  } finally { global.window = oldWindow; }
});
