import json,os,urllib.request
from datetime import datetime,timezone
from pathlib import Path
key=os.getenv('ALPACA_KEY');secret=os.getenv('ALPACA_SECRET')
if not key or not secret:
    print('Catalogue skipped: Alpaca credentials missing.')
    raise SystemExit(0)
request=urllib.request.Request('https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity',headers={'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret})
with urllib.request.urlopen(request,timeout=60) as response:
    assets=json.load(response)
if not isinstance(assets,list):raise ValueError('Unexpected assets response')
clean=sorted([{'symbol':a['symbol'],'name':a.get('name',''),'exchange':a.get('exchange','')} for a in assets if a.get('symbol') and a.get('status')=='active'],key=lambda a:a['symbol'])
if not clean:raise ValueError('Empty catalogue; preserving previous file')
Path('site/catalog.json').write_text(json.dumps({'updated':datetime.now(timezone.utc).isoformat(),'assets':clean},separators=(',',':')))
print('Published catalogue entries:',len(clean))
