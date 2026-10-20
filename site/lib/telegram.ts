type TelegramResult = { sent: boolean; code: string };
export async function sendTelegram(tokenValue: string, chatValue: string, text: string): Promise<TelegramResult> {
 const token = tokenValue.trim();
 const chat = chatValue.trim();
 if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) return {sent:false,code:'TG-TOKEN-FORMAT'};
 if (!/^-?\d+$/.test(chat)) return {sent:false,code:'TG-CHAT-FORMAT'};
 try {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
   method:'POST', headers:{'Content-Type':'application/json'},
   body:JSON.stringify({chat_id:chat,text:text.slice(0,4000)}), signal:AbortSignal.timeout(8000)
  });
  const result = await response.json();
  if(response.ok && result.ok === true) return {sent:true,code:'TG-SENT'};
  const description=typeof result.description==='string'?result.description.toLowerCase():'';
  if(response.status===401 || result.error_code===401) return {sent:false,code:'TG-TOKEN-INVALID'};
  if(description.includes('chat not found')) return {sent:false,code:'TG-CHAT-NOT-FOUND'};
  if(description.includes('blocked')) return {sent:false,code:'TG-BOT-BLOCKED'};
  if(response.status===403 || result.error_code===403) return {sent:false,code:'TG-FORBIDDEN'};
  if(response.status===404 || result.error_code===404) return {sent:false,code:'TG-TOKEN-INVALID'};
  if(response.status===429 || result.error_code===429) return {sent:false,code:'TG-RATE-LIMIT'};
  return {sent:false,code:'TG-API-ERROR'};
 } catch { return {sent:false,code:'TG-NETWORK'}; }
}
