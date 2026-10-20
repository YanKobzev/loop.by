import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sendTelegram} from '../lib/telegram.ts';
const token='123456:abcdefghijklmnopqrstuvwxyz';
test('invalid token and chat do not send requests',async()=>{
 assert.equal((await sendTelegram('https://example.com','123','test')).code,'TG-TOKEN-FORMAT');
 assert.equal((await sendTelegram(token,'@username','test')).code,'TG-CHAT-FORMAT');
});
test('API failure diagnostics, success and whitespace normalization',async()=>{
 const original=globalThis.fetch;
 try {
  for(const [status,body,expected] of [[200,{ok:true},'TG-SENT'],[200,{ok:false},'TG-API-ERROR'],[401,{ok:false,error_code:401},'TG-TOKEN-INVALID'],[400,{ok:false,description:'Bad Request: chat not found'},'TG-CHAT-NOT-FOUND'],[403,{ok:false,description:'Forbidden: bot was blocked by the user'},'TG-BOT-BLOCKED'],[429,{ok:false,error_code:429},'TG-RATE-LIMIT']]) {
   globalThis.fetch=async(url,options)=>{assert.equal(url,`https://api.telegram.org/bot${token}/sendMessage`);assert.equal(JSON.parse(options.body).chat_id,'123');return Response.json(body,{status});};
   const result=await sendTelegram(` ${token}\n`,' 123 ','Тест');assert.equal(result.code,expected);assert.equal(result.sent,expected==='TG-SENT');
  }
  globalThis.fetch=async()=>{throw Error(`Never log secret ${token}`)};
  assert.deepEqual(await sendTelegram(token,'123','Тест'),{sent:false,code:'TG-NETWORK'});
 } finally {globalThis.fetch=original;}
});
