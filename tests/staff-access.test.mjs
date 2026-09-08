import test from 'node:test';
import assert from 'node:assert/strict';
import { getStaffIdentity } from '../src/admin/utils/staffAccess.js';
const session={user:{id:'staff-user',email:'staff@example.test'}};
function client(data,error=null){ const calls=[];const query={select:()=>query,eq:(...args)=>{calls.push(args);return query;},maybeSingle:async()=>({data,error})};return {from:()=>query,calls}; }
test('no session never queries staff data',async()=>{assert.equal(await getStaffIdentity({from:()=>{throw new Error('must not query');}},null),null);});
test('staff access requires matching active profile',async()=>{const db=client({user_id:'staff-user',display_name:'Staff',role:'staff',active:true});assert.equal((await getStaffIdentity(db,session)).profile.role,'staff');assert.deepEqual(db.calls,[['user_id','staff-user'],['active',true]]);});
test('missing, inactive and mismatched profiles fail closed',async()=>{for(const profile of [null,{user_id:'staff-user',active:false},{user_id:'other-user',active:true}])await assert.rejects(getStaffIdentity(client(profile),session),{code:'STAFF_ACCESS_REQUIRED'});});
test('backend errors never admit access',async()=>{await assert.rejects(getStaffIdentity(client(null,new Error('offline')),session),/offline/);});
