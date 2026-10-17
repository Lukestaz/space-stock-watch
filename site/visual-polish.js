const root=document.querySelector('#cards');
const ns='http://www.w3.org/2000/svg';
const style=document.createElement('style');
style.textContent=`body .stock-proximity{background:transparent;border-radius:0;padding:0;margin:0 0 4px;font-size:.8rem}body .stock-proximity.near{background:transparent;color:#ffcf7b}body .stock-proximity.reached{background:transparent;color:#8ae9cc}body .stock-price-time{color:#b5c4da;font-size:.75rem;line-height:1.45;margin:0 0 8px}body .local-alert-status{font-size:.75rem;line-height:1.4;margin:4px 0 8px;color:#b5c4da}body .readout{min-height:1.5em;margin:8px 0 4px}body .chart-summary{font-size:.75rem;margin:2px 0}body .chart-options{margin-top:2px}body .chart text{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-weight:400;font-variant-numeric:tabular-nums}`;
document.head.append(style);
function axis(svg){
 if(svg.querySelector('[data-axis-polished]'))return;
 const labels=[...svg.querySelectorAll('text[textLength]')];
 if(labels.length<2)return;
 const points=labels.map(n=>({value:Number(n.textContent.replace(/[$,]/g,'')),y:Number(n.getAttribute('y'))-8})).sort((a,b)=>a.value-b.value);
 const low=points[0],high=points.at(-1);
 if(!Number.isFinite(low.value)||!Number.isFinite(high.value)||high.value<=low.value)return;
 const raw=(high.value-low.value)/4,power=10**Math.floor(Math.log10(raw));
 const step=([1,2,2.5,5,10].find(n=>n*power>=raw)||10)*power;
 const decimals=Math.min(8,Math.max(0,-Math.floor(Math.log10(step)))+(Math.abs(step/10**Math.floor(Math.log10(step))-2.5)<1e-8?1:0));
 const group=document.createElementNS(ns,'g');group.setAttribute('data-axis-polished','true');
 function node(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;group.append(n);}
 for(let i=Math.ceil((low.value-step*1e-8)/step),count=0;i*step<=high.value+step*1e-8&&count<12;i++,count++){
  const value=i*step,y=low.y+(value-low.value)/(high.value-low.value)*(high.y-low.y);
  node('line',{x1:18,x2:720,y1:y,y2:y,stroke:'#30425a','stroke-opacity':.55});
  node('text',{x:738,y:y+8,fill:'#aebed2','font-size':25},value.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:decimals}));
 }
 for(const n of labels)n.remove();
 for(const n of [...svg.querySelectorAll('line')])if(n.getAttribute('stroke')==='#30425a')n.remove();
 const currency=[...svg.querySelectorAll('text')].find(n=>n.textContent==='USD');
 if(currency){currency.setAttribute('x','738');currency.setAttribute('y','24');currency.setAttribute('font-size','21');currency.setAttribute('fill','#aebed2');}
 svg.prepend(group);
}
function enhance(){
 for(const svg of root.querySelectorAll('svg.chart'))axis(svg);
 for(const card of root.querySelectorAll('article')){
  const chip=card.querySelector('.stock-proximity');
  if(chip&&!card.querySelector('.stock-price-time')){
   const parts=chip.textContent.split(' · '),index=parts.findIndex(t=>t.startsWith('Updated ')||t.startsWith('Close '));
   if(index>=0){const date=parts.splice(index,1)[0],p=document.createElement('p');p.className='stock-price-time';p.textContent=date.startsWith('Updated ')?date.replace(/^Updated /,'Price as of '):date+' · US trading date';chip.textContent=parts.join(' · ');chip.after(p);}
  }
  for(const note of card.querySelectorAll('.local-alert-status')){
   const match=note.textContent.match(/^Personal target · scheduled alerts still use (.+)$/);
   if(match)note.textContent='Scheduled alert target: '+match[1];
  }
 }
}
new MutationObserver(enhance).observe(root,{childList:true,subtree:true});enhance();
