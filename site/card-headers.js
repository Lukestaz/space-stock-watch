const root=document.querySelector('#cards');
const listingNames=new Map();
const style=document.createElement('style');
style.textContent=`.stock-heading{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;column-gap:14px;row-gap:3px;margin-bottom:10px}.stock-heading h2{grid-column:1;grid-row:1 / span 2;min-width:0;overflow-wrap:anywhere;font-size:1.45rem;margin:0;letter-spacing:.04em}.stock-heading.has-listing-name h2{grid-row:1;align-self:end}.stock-listing-name{grid-column:1;grid-row:2;align-self:start;min-width:0;font-size:.72rem;line-height:1.35;color:#b5c4da;font-weight:400;letter-spacing:normal;overflow-wrap:anywhere;margin:0}.stock-quote{grid-column:2;grid-row:1 / span 2;display:flex;flex-direction:column;gap:2px;margin-left:0}.stock-value{font-size:1.45rem;font-weight:650;color:#f5f8ff;font-variant-numeric:tabular-nums}.stock-caption{font-size:.7rem;color:#b5c4da;letter-spacing:.04em}.stock-target{grid-column:3;grid-row:1 / span 2;padding:7px 10px;border:1px solid #78633d;border-radius:9px;background:#352d21;color:#ffcf7b;font-variant-numeric:tabular-nums;white-space:nowrap;display:flex;flex-direction:column;gap:2px}.stock-target small{color:#e0bc7e;font-size:.65rem;letter-spacing:.06em}.stock-proximity{display:inline-block;font-size:.8rem;border-radius:20px;padding:5px 10px;background:#26374c;color:#c8d6e8;margin:0 0 8px}.stock-proximity.near{background:#43371e;color:#ffcf7b}.stock-proximity.reached{background:#153e36;color:#8ae9cc}.stock-update-error{font-size:.8rem;color:#ffca9b;margin:0 0 8px}@media(max-width:420px){.stock-heading{column-gap:9px}.stock-heading h2,.stock-value{font-size:1.2rem}.stock-target{padding:6px 8px}.stock-listing-name{font-size:.68rem}}`;
document.head.append(style);
function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function addListingName(row,symbol){const name=listingNames.get(symbol);if(!name||row.querySelector('.stock-listing-name'))return;row.append(element('p',name,'stock-listing-name'));row.classList.add('has-listing-name');}
fetch('./catalog.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json();}).then(data=>{if(!Array.isArray(data.assets))return;for(const asset of data.assets){if(typeof asset.symbol!=='string'||typeof asset.name!=='string')continue;const symbol=asset.symbol.trim().toUpperCase(),name=asset.name.trim();if(name&&name!==symbol)listingNames.set(symbol,name);}for(const row of root.querySelectorAll('.stock-heading'))addListingName(row,row.querySelector('h2')?.textContent);}).catch(()=>{});
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
  const row=element('div','','stock-heading');heading.textContent=symbol;heading.replaceWith(row);row.append(heading);addListingName(row,symbol);
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
