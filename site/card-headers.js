const root=document.querySelector('#cards');
const style=document.createElement('style');
style.textContent=`.stock-heading{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px}.stock-heading h2{font-size:1.45rem;margin:0;letter-spacing:.04em}.stock-quote{display:flex;flex-direction:column;gap:2px;margin-left:auto}.stock-value{font-size:1.45rem;font-weight:650;color:#f5f8ff;font-variant-numeric:tabular-nums}.stock-caption{font-size:.7rem;color:#b5c4da;letter-spacing:.04em}.stock-target{padding:7px 10px;border:1px solid #78633d;border-radius:9px;background:#352d21;color:#ffcf7b;font-variant-numeric:tabular-nums;white-space:nowrap;display:flex;flex-direction:column;gap:2px}.stock-target small{color:#e0bc7e;font-size:.65rem;letter-spacing:.06em}.stock-proximity{display:inline-block;font-size:.8rem;border-radius:20px;padding:5px 10px;background:#26374c;color:#c8d6e8;margin:0 0 8px}.stock-proximity.near{background:#43371e;color:#ffcf7b}.stock-proximity.reached{background:#153e36;color:#8ae9cc}.stock-update-error{font-size:.8rem;color:#ffca9b;margin:0 0 8px}@media(max-width:420px){.stock-heading{gap:9px}.stock-heading h2,.stock-value{font-size:1.2rem}.stock-target{padding:6px 8px}}`;
document.head.append(style);
function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function readableDate(timestamp,daily){
 if(!timestamp)return '';
 const date=new Date(timestamp);if(!Number.isFinite(date.getTime()))return '';
 if(daily){const tradingDate=new Date(timestamp.slice(0,10)+'T12:00:00Z');const oldYear=tradingDate.getUTCFullYear()!==new Date().getUTCFullYear();return 'Close '+new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'short',...(oldYear?{year:'numeric'}:{}),timeZone:'UTC'}).format(tradingDate);}
 return 'Updated '+new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(date);
}
function enhance(){
 for(const card of root.querySelectorAll('article')){
  if(card.dataset.headerEnhanced)continue;
  const heading=card.querySelector('h2'),quote=card.querySelector('.price');
  if(!heading||!quote)continue;
  const headingText=heading.textContent,quoteText=quote.textContent;
  const symbol=headingText.split(' · ')[0];
  const targetMatch=headingText.match(/\$([\d,.]+)/),priceMatch=quoteText.match(/\$([\d,.]+)/);
  if(!targetMatch)continue;
  const target=Number(targetMatch[1].replaceAll(',','')),price=priceMatch?Number(priceMatch[1].replaceAll(',','')):null;
  const daily=quoteText.startsWith('Last available daily close');
  let timestamp='',failed=false;
  for(const p of [...card.children].filter(n=>n.tagName==='P')){
   const text=p.textContent;
   if(text.startsWith('Market-data timestamp ')){timestamp=text.slice('Market-data timestamp '.length).split(' · ')[0];p.remove();}
   else if(text.startsWith('Intraday monitor:')){failed=/failed|error/i.test(text);p.remove();}
   else if(text.startsWith('Historical/stale observation')||text==='No validated timestamp')p.remove();
  }
  const format=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const row=element('div','','stock-heading');heading.textContent=symbol;heading.replaceWith(row);row.append(heading);
  const current=element('div','','stock-quote');current.append(element('span',price!==null?format(price):'—','stock-value'),element('span',price===null?'AWAITING DATA':daily?'LAST CLOSE':'DELAYED','stock-caption'));row.append(current);
  const targetBadge=element('div','','stock-target');targetBadge.append(element('span','◎ '+format(target)),element('small','TARGET'));row.append(targetBadge);
  quote.remove();
  const parts=[];let proximityClass='stock-proximity';
  if(price!==null){const distance=(price/target-1)*100;parts.push(Math.abs(distance)<.05?'At target':Math.abs(distance).toFixed(1)+'% '+(distance<0?'below':'above')+' target');if(distance<=0)proximityClass+=' reached';else if(distance<=5)proximityClass+=' near';}
  else parts.push('Awaiting price');
  const dateLabel=readableDate(timestamp,daily);if(dateLabel)parts.push(dateLabel);
  const chip=element('p',parts.join(' · '),proximityClass);row.after(chip);
  if(failed)chip.after(element('p','Update failed','stock-update-error'));
  card.dataset.headerEnhanced='true';
 }
}
new MutationObserver(enhance).observe(root,{childList:true});enhance();
