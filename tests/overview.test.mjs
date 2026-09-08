import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOverview } from '../src/admin/utils/overview.js';
const now = Date.parse('2026-09-09T12:00:00Z');
test('overview excludes demo rows and counts paid revenue within Ghana calendar boundaries', () => {
 const orders = [
 { id:'order-gf-1052', total:999, paymentStatus:'paid', createdAt:'2026-09-09T10:00:00Z' },
 { id:'real', total:120, paymentStatus:'paid', createdAt:'2026-09-08T23:59:00Z', paidAt:'2026-09-09T00:00:00Z' },
 { id:'unpaid', total:400, paymentStatus:'pending', createdAt:'2026-09-09T10:00:00Z' },
 { id:'future', total:200, paymentStatus:'paid', createdAt:'2026-09-10T00:00:00Z' }];
 const result = buildOverview({orders},'Today',now);
 assert.equal(result.revenue,120); assert.equal(result.paid.length,1);
 assert.equal(result.trend.reduce((sum, slot)=>sum+slot.value,0),120);
});
test('overdue excludes complete orders and gives date-only requests the full day',()=>{
 const orders=[{id:'a',status:'ready',estimatedDelivery:'2026-09-09T11:00:00Z'},{id:'b',status:'completed',estimatedDelivery:'2026-09-08T11:00:00Z'},{id:'c',status:'paid',requestedDeliveryDate:'2026-09-09'},{id:'d',status:'paid',requestedDeliveryDate:'2026-09-08'}];
 assert.deepEqual(buildOverview({orders},'Today',now).overdue.map(o=>o.id),['a','d']);
});
test('weekly period includes seven UTC calendar days and sorts activity',()=>{
 const orders=[{id:'a',total:30,paymentStatus:'paid',createdAt:'2026-09-03T00:00:00Z'},{id:'b',total:90,paymentStatus:'paid',createdAt:'2026-09-02T23:59:59Z'}];
 const result=buildOverview({orders},'This week',now); assert.equal(result.revenue,30); assert.equal(result.activities.length,1);
 assert.equal(buildOverview({orders},'Activity',now).activities.length,2);
});
