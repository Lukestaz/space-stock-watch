const root=document.querySelector('#cards');
const style=document.createElement('style');
style.textContent=`.stock-heading{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px}.stock-heading h2{font-size:1.45rem;margin:0;letter-spacing:.04em}.stock-quote{display:flex;flex-direction:column;gap:2px;margin-left:auto}.stock-value{font-size:1.45rem;font-weight:650;color:#f5f8ff;font-variant-numeric:tabular-nums}.stock-caption{font-size:.7rem;color:#b5c4da;letter-spacing:.04em}.stock-target{padding:7px 10px;border:1px solid #78633d;border-radius:9px;background:#352d21;color:#ffcf7b;font-variant-numeric:tabular-nums;white-space:nowrap}.stock-target small{display:block;color:#e0bc7e;font-size:.65rem;letter-spacing:.06em}.stock-proximity{display:inline-block;font-size:.78rem;border-radius:20px;padding:4px 9px;background:#26374c;color:#c8d6e8;margin:0 0 6px}.stock-proximity.near{background:#43371e;color:#ffcf7b}.stock-proximity.reached{background:#153e36;color:#8ae9cc}.stock-meta{font-size:.8rem;color:#b5c4da;margin:4px 0 10px}@media(max-width:420px){.stock-heading{gap:9px}.stock-heading h2,.stock-value{font-size:1.2rem}.stock-target{padding:6px 8px}}`;
document.head.append(style);
function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function enhance(){
 for(const card of root.querySelectorAll('article')){
  if(card.dataset.headerEnhanced)continue;
  const heading=card.querySelector('h2'),quote=card.querySelector('.price');
  if(!heading||!quote)continue;
  const headingText=heading.textContent,quoteText=quote.textContent;
  const symbol=headingText.split(' · ')[0];
  const targetMatch=headingText.match(/\$([\d,.]+)/);
  const priceMatch=quoteText.match(/\$([\d,.]+)/);
  if(!targetMatch)continue;
  const target=Number(targetMatch[1].replaceAll(',',''));
  const price=priceMatch?Number(priceMatch[1].replaceAll(',','')):null;
  const daily=quoteText.startsWith('Last available daily close');
  const format=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const row=element('div','','stock-heading');
  heading.textContent=symbol;heading.replaceWith(row);row.append(heading);
  const current=element('div','','stock-quote');
  current.append(element('span',price!==null?format(price):'—','stock-value'),element('span',price===null?'AWAITING DATA':daily?'DAILY CLOSE':'DELAYED','stock-caption'));row.append(current);
  const targetBadge=element('div','','stock-target');targetBadge.append(element('small','◎ ENTRY TARGET'),element('span',format(target)));row.append(targetBadge);
  const caption=element('p',price===null?'Awaiting validated price':daily?'Last available daily closing price':'Latest stored delayed closing price','stock-meta');quote.replaceWith(caption);
  if(price!==null){const distance=(price/target-1)*100;const reached=distance<=0,near=!reached&&distance<=5;const label=(reached?'At/below target':near?'Near target':'Above target')+' · '+Math.abs(distance).toFixed(1)+'% '+(distance<0?'below':'above');const chip=element('p',label+(daily?' · daily close':' · stored quote'),'stock-proximity'+(reached?' reached':near?' near':''));row.after(chip);}
  card.dataset.headerEnhanced='true';
 }
}
new MutationObserver(enhance).observe(root,{childList:true});enhance();
