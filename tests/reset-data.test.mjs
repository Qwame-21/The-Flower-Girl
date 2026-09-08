import test from 'node:test';
import assert from 'node:assert/strict';
import { clearedLocalData, clearLocalBusinessData, clearDatabaseBusinessData } from '../src/admin/utils/resetData.js';
test('reset clears business collections and preserves gallery and preferences', () => {
 const data={gallery:[{id:'keep'}],settings:{businessName:'Store'},orders:[{id:'remove'}],products:[{id:'remove'}],content:{announcement:'old'}};
 const result=clearedLocalData(data);
 assert.deepEqual(result.orders,[]); assert.deepEqual(result.products,[]);
 assert.deepEqual(result.content,{announcement:''});
 assert.strictEqual(result.gallery,data.gallery); assert.strictEqual(result.settings,data.settings);
 assert.equal(data.orders.length,1);
});
test('backup failure prevents local reset', () => {
 const previous=global.window;
 const writes=[];
 global.window={localStorage:{getItem:()=>null,setItem:key=>{writes.push(key);throw Error('Storage full');}}};
 try { assert.throws(clearLocalBusinessData,/Storage full/);assert.equal(writes.length,1);assert.match(writes[0],/reset-backup/); }
 finally {global.window=previous;}
});
test('database reset uses one RPC and reports missing migration without fallback deletes',async()=>{
 let calls=0;
 await assert.rejects(clearDatabaseBusinessData({rpc:async(name,args)=>{calls++;assert.equal(name,'reset_business_data');assert.equal(args.confirmation,'DELETE DATABASE DATA');return {error:{code:'PGRST202'}};}}),/not installed/);
 assert.equal(calls,1);
 await clearDatabaseBusinessData({rpc:async()=>({error:null})});
});
