import { sendTelegram } from '@/lib/telegram';
import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
export async function POST(request:Request){
 if(Number(request.headers.get('content-length'))>16000)return NextResponse.json({error:'Слишком большой запрос'},{status:413});
 const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==request.headers.get('host'))return NextResponse.json({error:'Недопустимый источник запроса'},{status:403});
 let d;try{const text=await request.text();if(text.length>16000)return NextResponse.json({error:'Слишком большой запрос'},{status:413});d=JSON.parse(text);}catch{return NextResponse.json({error:'Некорректный запрос'},{status:400});}
 if(!d||typeof d!=='object'||Array.isArray(d))return NextResponse.json({error:'Некорректный запрос'},{status:400});
 if(d.website)return NextResponse.json({error:'Не удалось отправить запрос'},{status:400});
 if(typeof d.model!=='string'||!d.model.trim()||typeof d.contact!=='string'||d.consent!==true||!(/^(\+?[\d\s()-]{7,25}|@[a-zA-Z][a-zA-Z0-9_]{4,31})$/.test(d.contact.trim())))return NextResponse.json({error:'Проверьте модель, телефон или @username и согласие на обработку данных'},{status:400});
 const keys=['category','model','spec','power','screen','body','faults','repairs','battery','account','contact','city','comment'];
 const payload:Record<string,string>={};for(const key of keys){if(d[key]!==undefined&&typeof d[key]!=='string')return NextResponse.json({error:'Проверьте поля анкеты'},{status:400});payload[key]=(d[key]||'').trim();if(payload[key].length>(key==='comment'?2000:200))return NextResponse.json({error:'Слишком длинное значение поля'},{status:400});}
 const rawUrl=process.env.SUPABASE_URL?.trim(),key=process.env.SUPABASE_SECRET_KEY?.trim();
 let url:string|undefined;
 try { if(rawUrl){const parsed=new URL(rawUrl);if(parsed.protocol==='https:'&&parsed.hostname.endsWith('.supabase.co')&&!parsed.username&&!parsed.password)url=parsed.origin;} } catch {}
 if(!url||!key||!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return NextResponse.json({error:'Отправка пока не подключена. Ваши ответы остаются в форме — попробуйте позже.'},{status:503});
 const dbHeaders:Record<string,string>={apikey:key,'Content-Type':'application/json'};
 if(!key.startsWith('sb_secret_'))dbHeaders.Authorization=`Bearer ${key}`;
 try{const reference=randomBytes(12).toString('hex');const r=await fetch(`${url}/rest/v1/buyback_leads`,{method:'POST',headers:dbHeaders,body:JSON.stringify({reference,payload,consent:true,notification_status:'pending'}),signal:AbortSignal.timeout(10000)});if(!r.ok){
 let code='UNKNOWN';try{const e=await r.json();if(typeof e.code==='string'&&/^[A-Z0-9_]{1,24}$/.test(e.code))code=e.code;}catch{}
 console.error('buyback_storage_failed',{status:r.status,code});
 return NextResponse.json({error:`Не удалось сохранить заявку (DB-${r.status}-${code}). Ответы остаются в форме.`},{status:502});
 }
 const lines=['Новая заявка loop.by',`Номер: ${reference}`,...Object.entries(payload).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`)];
 const delivery=await sendTelegram(process.env.TELEGRAM_BOT_TOKEN!,process.env.TELEGRAM_CHAT_ID!,lines.join('\n'));
 const sent=delivery.sent;
 if(!sent)console.error('buyback_telegram_failed',{code:delivery.code});
 if(sent)await fetch(`${url}/rest/v1/buyback_leads?reference=eq.${reference}`,{method:'PATCH',headers:dbHeaders,body:JSON.stringify({notification_status:'sent'}),signal:AbortSignal.timeout(5000)}).catch(()=>{});
 return NextResponse.json({reference,notification:delivery.code});
 }catch{console.error('buyback_storage_network_failed');return NextResponse.json({error:'Не удалось связаться с базой (DB-NETWORK). Ответы остаются в форме. Попробуйте ещё раз.'},{status:502});}
}
