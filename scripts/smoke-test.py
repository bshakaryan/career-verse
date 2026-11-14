"""Exercise a real running server without any AI requests. python3 scripts/smoke-test.py"""
import json, urllib.request, urllib.error, http.cookiejar, os
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
def client():
 return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(op, action=None, **kw):
 req=urllib.request.Request(base+'/api/session', data=json.dumps({'action':action,**kw}).encode() if action else None, headers={'Content-Type':'application/json','Origin':base})
 try:
  with op.open(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
a,b=client(),client()
status,data=call(a,'start');assert status==200,data
s=data['session'];assert not data['capabilities']['ai'],'Run without an AI key'
assert call(b)[1]['session'] is None,'Guest isolation failed'
plan={'decision':'Ship core Friday subject to a go/no-go checkpoint.','priorities':'Defer analytics. Get approval for a daily export.','actions':'Sam: core Wednesday. Jamie: export Wednesday. Taylor: critical tests Thursday.','risks':'Critical defects block release. Morgan confirms clinic training changes if delayed.','clientMessage':'Please approve this limited pilot. Next status update is Thursday noon.'}
status,data=call(a,'save',revision=s['revision'],plan=plan);assert status==200,data
s=data['session']
assert call(a,'save',revision=0,plan=plan)[0]==409,'Stale writes must fail'
assert call(a,'submit',revision=s['revision'],plan=plan)[0]==400,'Cannot skip the event'
status,data=call(a,'reference',revision=s['revision'],colleague='alex',note=1);assert status==200,data
s=data['session'];assert s['messages'][-1]['source']=='reference'
status,data=call(a,'reveal',revision=s['revision'],plan=plan);assert status==200,data
s=data['session'];assert s['initialPlan']==plan and s['stage']=='adapt'
assert call(a,'reveal',revision=s['revision'],plan=plan)[0]==400,'Event only once'
status,data=call(a,'submit',revision=s['revision'],plan=plan);assert status==200,data
s=data['session'];assert s['stage']=='review' and s['attempts'][0]['feedback'] is None
assert s['attempts'][0]['mode']=='practice','No fabricated AI assessment'
status,data=call(a,'selfcheck',revision=s['revision'],checks={'priorities':True,'execution':False,'risk':True,'communication':False});assert status==200,data
s=data['session'];assert call(a)[1]['session']['attempts'][0]['selfCheck']['priorities']
status,data=call(a,'revise',revision=s['revision']);assert status==200,data
s=data['session'];plan2={**plan,'decision':'Delay until full regression passes; ask Morgan to agree a new date.'}
status,data=call(a,'submit',revision=s['revision'],plan=plan2);assert status==200,data
s=data['session'];assert len(s['attempts'])==2 and s['attempts'][0]['plan']==plan and s['attempts'][1]['plan']==plan2
assert call(a,'reset')[0]==200
assert call(a)[1]['session'] is None
print('PASS: guest isolation, revision conflicts, notes, event gating, honest practice mode, persistence, immutable attempts, reset')
