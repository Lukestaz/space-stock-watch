import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';
const endpoint=process.env.PRICE_ENDPOINT||'https://stock-watch-prices.lukestaz.workers.dev';
const origin='https://lukestaz.github.io';
assert.equal(endpoint,'https://stock-watch-prices.lukestaz.workers.dev','Unexpected production endpoint');
async function read(path){
 for(let attempt=1;attempt<=4;attempt++){
  try{
   const r=await fetch(endpoint+path,{headers:{Origin:origin},signal:AbortSignal.timeout(25000)});
   assert.equal(r.headers.get('access-control-allow-origin'),origin,'Allowed-origin response header missing');
   if(!r.ok){await r.body?.cancel();throw Error('Endpoint HTTP '+r.status);}
   return await r.json();
  }catch(error){if(attempt===4)throw error;console.warn('Endpoint check retry',attempt,error.message);await sleep(5000);}
 }
}
const health=await read('/health');assert.equal(health.ok,true,'Worker bindings/credentials not ready');
const d=await read('/v1/stock?symbol=AAPL');
assert.equal(d.symbol,'AAPL');assert.equal(d.alertsActive,false);
assert.ok(Array.isArray(d.history)&&d.history.length>0,'No daily history');
assert.ok(Number.isFinite(d.price)&&d.price>0,'Invalid price');
const fetched=Date.parse(d.fetchedAt),cutoff=Date.parse(d.dataCutoff),observed=Date.parse(d.time);
assert.ok([fetched,cutoff,observed].every(Number.isFinite),'Invalid timestamps');
assert.ok(fetched<=Date.now()+60000,'Future fetch timestamp');
assert.ok(cutoff<=fetched-16*60000,'Insufficient data delay');
assert.ok(observed<=cutoff,'Observation exceeds request cutoff');
let previous=-Infinity;
for(const b of d.history){
 const time=Date.parse(b.t);
 assert.ok(Number.isFinite(time)&&time<=cutoff&&time>=previous,'Invalid history timestamp/order');
 assert.ok(Number.isFinite(b.c)&&b.c>0&&Number.isFinite(b.l)&&b.l>0,'Invalid history price');
 previous=time;
}
console.log('Health and CORS passed; AAPL bars:',d.history.length,'Observation:',d.time,'Fetched:',d.fetchedAt);
