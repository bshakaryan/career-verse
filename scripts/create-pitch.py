"""Generate the English hackathon deck. Requires reportlab and pypdf."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader

OUT=Path('output/pdf/careerverse-pitch.pdf'); OUT.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(OUT),pagesize=(960,540)); c.setTitle('CareerVerse | One crisis. Two careers.'); c.setAuthor('CareerVerse team')
P='#6749E8'; INK='#201B3C'; MUTED='#615B73'; PALE='#EEE9FF'; WHITE='#FFFFFF'
def text(t,x,y,w=840,size=22,color=INK,bold=False):
    st=ParagraphStyle('p',fontName='Helvetica-Bold' if bold else 'Helvetica',fontSize=size,leading=size*1.24,textColor=HexColor(color))
    p=Paragraph(t,st); aw,ah=p.wrap(w,460); p.drawOn(c,x,y-ah); return ah

def base(n,title,dark=False):
    bg=INK if dark else '#FAF9FE'; c.setFillColor(HexColor(bg));c.rect(0,0,960,540,fill=1,stroke=0)
    text('CareerVerse',48,510,size=13,color=WHITE if dark else P,bold=True)
    text(f'{n:02d} / 10',852,510,w=70,size=11,color='#BBB2D9' if dark else MUTED)
    if title:text(title,48,456,size=37,color=WHITE if dark else INK,bold=True)

def rule(y=352):
    c.setStrokeColor(HexColor('#DDD6EF'));c.setLineWidth(1);c.line(48,y,912,y)

def point(title,body,x,y,w=385):
    h=text(title,x,y,w,23,P,True);text(body,x,y-h-14,w,19,MUTED)

def end():c.showPage()

base(1,'',True)
text('One crisis.<br/>Two careers.',48,423,size=66,color=WHITE,bold=True)
text('Experience the work before choosing the path.',51,242,w=720,size=26,color='#D9D0FB')
text('Customer Support → QA Tester'.replace('→','to'),51,156,size=21,color='#B8A5FF',bold=True)
text('Business Cup 2.0  |  Skills  |  Browser-based B2C',51,76,size=15,color='#B8AFCB')
end()

base(2,'A job title is not a workday.')
text('Before investing in retraining, people need a way to try the responsibilities.',48,366,w=830,size=27)
rule(282)
point('Our initial user','An employed US adult, 25-45, in retail, support or operations, exploring a move into technology.',48,247)
point('The decision at stake','Which daily tasks do I enjoy, and what should I practice before committing to a learning path?',511,247)
text('Problem and willingness to pay are hypotheses to validate with career switchers.',48,62,size=13,color=MUTED)
end()

base(3,'Try one incident from two sides.')
text('ShopFlow has a checkout crisis before a release. Customers are being overcharged.',48,371,w=820,size=25)
for x,num,title,body in [(48,'01','Support','Read complaints. Inspect orders. Decide refunds and escalation.'),(351,'02','Perspective Shift','Carry your decisions and their consequences into the next role.'),(654,'03','QA','Test checkout. Isolate the defect. Write a reproducible report.')]:
    text(num,x,267,size=35,color=P,bold=True);text(title,x,210,w=255,size=22,bold=True);text(body,x,167,w=252,size=18,color=MUTED)
end()

base(4,'Your handoff changes the next job.')
text('Same incident. Shared state. Different professional responsibilities.',48,369,size=23,color=MUTED)
rule(310)
point('A useful Support handoff','Correct refunds resolve $32 in overcharges. Linked orders and a clear symptom become the QA ticket.',48,273)
point('A different decision','A $100 refund on SF-1042 creates $80 in excess refunds. Skipping escalation delays QA by 15 simulated minutes.',511,273)
text('Fresh Replay creates a clean, independent run. Previous decisions remain available for comparison.',48,87,size=19,color=P,bold=True)
end()

base(5,'The defect is real application logic.')
text('SAVE20 should reduce eligible carts by 20%. The intentionally buggy checkout excludes accessories.',48,367,size=24)
rows=[('INPUT','EXPECTED','ACTUAL'),('$100 mixed + SAVE20','$80','$100'),('$100 apparel + SAVE20','$80','$80'),('$40 mixed + SAVE20','$40','$40')]
for i,row in enumerate(rows):
    y=263-i*44
    if i==0:c.setFillColor(HexColor(PALE));c.rect(48,y-30,864,43,fill=1,stroke=0)
    for x,w,t in zip([60,551,752],[470,180,140],row):text(t,x,y,w,17 if i==0 else 21,P if i==0 else INK,i==0)
text('Users change the inputs, link failing evidence and revise their report. Code checks outcomes.',48,65,size=18,color=MUTED)
end()

base(6,'Evidence, not a career-fit score.')
text('Performance and personal interest answer different questions.',48,369,size=24,color=MUTED)
for i,(label,v) in enumerate([('Task correctness',40),('Investigation',25),('Communication / documentation',20),('Prioritization',15)]):
    y=291-i*49;text(label,48,y,w=390,size=18);c.setFillColor(HexColor(PALE));c.rect(460,y-23,320,18,fill=1,stroke=0);c.setFillColor(HexColor(P));c.rect(460,y-23,v*8,18,fill=1,stroke=0);text(str(v)+'%',806,y,w=90,size=20,bold=True)
text('Separate self-reported interest + decisions + consequences + a next practice step.',48,64,size=19,color=P,bold=True)
end()

base(7,'A reason to come back tomorrow.')
point('My Career Path','Resume unfinished work, revisit evidence and compare independent attempts. Progress survives a browser refresh.',48,361)
point('A playable next challenge','Investigate a different defect: free shipping should begin at $75, but checkout charges $81.99 at the boundary.',511,361)
rule(190)
text('North star',48,154,size=19,color=P,bold=True)
text('Share of visitors who finish both roles and their comparison.',48,116,size=26)
text('Next measures: follow-up completion, second-session rate and upgrade intent. No traction claimed yet.',48,49,size=13,color=MUTED)
end()

base(8,'Free discovery. Paid continued practice.')
point('Free / Career Explorer','Two connected roles. Full comparison. One real follow-up exercise. No account or payment required.',48,363)
text('$29 / month',511,363,w=390,size=37,color=P,bold=True)
text('Pro pricing hypothesis',511,310,w=390,size=19,bold=True)
text('Planned: new incidents, deeper role practice, historical coaching and job-description-aligned preparation.',511,267,w=385,size=20,color=MUTED)
rule(156)
text('The demo paywall works. Upgrade unlocks a preview brief; no money is charged. Advanced scenarios remain planned.',48,121,size=20)
end()

base(9,'Build evidence before scaling.')
for x,title,body in [(48,'First audience','Recruit career switchers through career-change communities and practical demo content.'),(351,'Validation','Observe complete sessions. Interview users about task realism, learning value and willingness to pay.'),(654,'Economics','Measure retention, acquisition cost and AI cost per completed run before expanding the library.')]:
    text(title,x,358,w=255,size=24,color=P,bold=True);text(body,x,304,w=254,size=22,color=MUTED)
text('Long-term illustration: 28,736 subscribers x $29 x 12 ≈ $10M annual revenue.'.replace('≈','~'),48,106,size=19,bold=True)
text('An arithmetic target, not a market-size estimate, forecast or validated subscriber count.',48,66,size=14,color=MUTED)
end()

base(10,'Try the connected workday.',True)
text('React + Headless UI / TypeScript / server-side state engine',48,366,size=23,color=WHITE)
text('Working: two roles, shared consequences, transparent assessment, saved progress, follow-up practice and demo upgrade.',48,309,w=850,size=23,color='#D9D0FB')
text('Live AI adapter is implemented but not connected in this release. Authored guidance is clearly labelled. Guest data stays on the device.',48,209,w=850,size=19,color='#C6BADD')
text('Open the product',48,121,size=21,color='#B8A5FF',bold=True)
c.linkURL('https://careerverse-pm-practice.filanteye.chatgpt.site',(48,80,450,122),relative=0)
text('careerverse-pm-practice.filanteye.chatgpt.site',48,87,w=530,size=14,color=WHITE)
text('Source code',645,121,w=260,size=21,color='#B8A5FF',bold=True)
c.linkURL('https://github.com/bshakaryan/career-verse',(645,65,912,122),relative=0)
text('github.com/bshakaryan/career-verse',645,87,w=265,size=14,color=WHITE)
end();c.save()
r=PdfReader(OUT);assert len(r.pages)==10
assert all(len(p.extract_text())>100 for p in r.pages)
print(f'Created {OUT}: {len(r.pages)} slides')
