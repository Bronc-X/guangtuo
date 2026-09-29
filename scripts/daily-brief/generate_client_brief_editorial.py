"""Render the client daily brief as a designed report with screenshot appendices."""
from pathlib import Path
import json
import argparse
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from PIL import Image
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--input',default='content/daily-brief/2026-09-22.json')
parser.add_argument('--output',default='output/pdf/广拓生物_独立站建设_每日简报_2026-09-22_v1.0.pdf')
args=parser.parse_args()
data=json.loads((ROOT/args.input).read_text(encoding='utf-8'))
out=ROOT/args.output
out.parent.mkdir(parents=True,exist_ok=True)
shots=ROOT/'output/showki-admin-guide'
art=ROOT/'output/pdf'
for name,file in [('CN','msyh.ttc'),('Bold','msyhbd.ttc'),('Light','msyhl.ttc'),('EN','arial.ttf'),('ENB','arialbd.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/file)))
W,H=A4
TOTAL=5+len(data['screenshots'])
BG,INK,MUTED,PINK,GREEN,LINE,WHITE=[HexColor(x) for x in ['#F6F3ED','#202B2A','#68726D','#AC3D71','#426252','#D8DCD3','#FFFFFF']]
c=canvas.Canvas(str(out),pagesize=A4,pageCompression=1)
c.setTitle('修齐生物独立站 | 每日工作简报 | 2026.09.22')
c.setAuthor('SHOWKI BIOTECH')
c.setSubject('今日总览、更新证据、验证与下一步、八项功能截图与操作指引')
c.setViewerPreference('DisplayDocTitle','true')

def rect(x,y,w,h,color):
    c.setFillColor(color); c.rect(x,y,w,h,fill=1,stroke=0)

def txt(x,y,s,size=10,font='CN',color=INK):
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,s)

def lines(s,width,size,font='CN'):
    result=[];line=''
    for ch in s:
        if ch=='\n': result.append(line);line='';continue
        if line and pdfmetrics.stringWidth(line+ch,font,size)>width:
            if ch in '，。；：！？、）》”' and len(line)>1:
                result.append(line[:-1]);line=line[-1]+ch
            else:
                result.append(line);line=ch
        else:line+=ch
    if line:result.append(line)
    return result

def para(x,y,s,width,size=10,leading=17,font='CN',color=INK):
    for line in lines(s,width,size,font):
        txt(x,y,line,size,font,color);y-=leading
    return y

def rule(x,y,w,color=LINE):
    c.setStrokeColor(color);c.setLineWidth(.55);c.line(x,y,x+w,y)

def image(path,box,x,y,w,h,contain=True):
    source=Image.open(path)
    # Embed only the selected UI area; cropped account footers are not retained
    # as hidden image data inside the client PDF.
    if box:
        source=source.crop(tuple(box))
    iw,ih=source.size
    l,t,r,b=(0,0,iw,ih)
    scale=(min if contain else max)(w/(r-l),h/(b-t))
    dw,dh=(r-l)*scale,(b-t)*scale
    px,py=x+(w-dw)/2,y+(h-dh)/2
    clip_x,clip_y=max(x,px),max(y,py)
    clip_w,clip_h=min(x+w,px+dw)-clip_x,min(y+h,py+dh)-clip_y
    c.saveState();p=c.beginPath();p.rect(clip_x,clip_y,clip_w,clip_h);c.clipPath(p,stroke=0,fill=0)
    c.drawImage(ImageReader(source),px,py,width=iw*scale,height=ih*scale,mask='auto')
    c.restoreState()

def screenshot(item,x,y,w,h,box=None):
    rect(x,y,w,h,WHITE)
    image(shots/item['file'],box or item.get('box'),x,y,w,h)
    c.setStrokeColor(LINE);c.setLineWidth(.5);c.rect(x,y,w,h,fill=0,stroke=1)

def badge(s,x,y):
    width=pdfmetrics.stringWidth(s,'CN',8)+18
    pending='待' in s
    rect(x,y-5,width,19,HexColor('#F4E9D6') if pending else HexColor('#E8EEE7'))
    txt(x+9,y+1,s,8,'CN',HexColor('#846029') if pending else GREEN)

def base(n,tag,section):
    rect(0,0,W,H,BG)
    txt(42,798,'SHOWKI BIOTECH',9,'ENB')
    txt(42,777,tag,7.5,'EN',PINK)
    txt(439,798,'2026.09.22',8,'EN',MUTED)
    rule(42,763,W-84)
    rule(42,37,W-84)
    txt(42,22,'GT-WEB-DB-20260922  /  '+data['meta']['version'],7,'EN',MUTED)
    txt(270,22,section,7,'CN',MUTED)
    txt(509,22,f'{n:02} / {TOTAL:02}',7,'EN',MUTED)

def note(label,body,y=65,h=64):
    rect(42,y,W-84,h,HexColor('#E7EDE5'))
    rect(42,y,3,h,GREEN)
    txt(55,y+h-19,label,9,'Bold',GREEN)
    end=para(55,y+h-37,body,W-110,9,14,color=GREEN)
    assert end+14>=y+8,(label,end,y)

# Cover.
image(art/'showki-cover-art.png',None,0,0,W,H,contain=False)
txt(42,786,'SHOWKI',22,'ENB')
txt(43,765,'B I O T E C H',8,'EN',MUTED)
rule(43,736,40,PINK)
txt(41,684,'独立站建设',32,'Light')
txt(41,636,'每日工作简报',35,'Bold')
txt(43,605,'CLIENT PROGRESS REPORT',9,'EN',MUTED)
txt(43,567,data.get('cover_subtitle','后台运营功能 · 本轮进展与操作指引'),12,'CN')
rect(30,31,W-60,83,Color(.965,.953,.929,alpha=.93))
txt(43,91,'2026.09.22',17,'EN')
txt(43,66,'阶段 / 后台功能扩展与上线复核',9,'CN',MUTED)
txt(43,48,'GT-WEB-DB-20260922  ·  '+data['meta']['version'],7,'EN',MUTED)
txt(375,67,'8 项功能 / 8 张真实截图',9,'CN')
txt(417,48,'封面：AI 视觉概念素材',6.5,'CN',MUTED)
c.showPage()

# Main report 1 / daily overview.
base(2,'01 / DAILY OVERVIEW','今日总览')
c.bookmarkPage('overview');c.addOutlineEntry('今日总览','overview',0)
txt(42,723,data.get('overview_title','后台升级，进入运营准备。'),25,'Bold')
para(42,689,data['summary'],W-84,11,19)
for i,m in enumerate(data['metrics']):
    x=42+i*130
    txt(x,596,m['value'],34,'EN',PINK if i==3 else INK)
    txt(x,575,m['label'],9,'CN',MUTED)
rule(42,557,W-84)
screenshot(data['screenshots'][0],42,240,W-84,298)
txt(42,222,'S01 / 正式后台 · 可视化文章编辑',8,'CN',MUTED)
badge('界面已复核',442,220)
txt(42,185,'交付说明' if 'delivery_note' in data else '本期重点',11,'Bold')
para(42,163,data.get('delivery_note','将内容创作、选题研究、媒体排期、客户及公司资料管理的操作入口整理清楚，形成可供客户使用的八项功能说明。'),W-84,10,17)
note('费用说明' if 'cost_note' in data else '复核口径',data.get('cost_note',data['scope_note']),y=58,h=62)
c.showPage()

# Main report 2 / update evidence, preserving four update groups.
base(3,'02 / UPDATE EVIDENCE','更新证据')
c.bookmarkPage('evidence');c.addOutlineEntry('更新证据','evidence',0)
txt(42,723,data.get('evidence_title','四组更新，一条运营流程。'),25,'Bold')
txt(42,694,'每组对应真实界面；完整截图与操作步骤见后续附录。',10,'CN',MUTED)
groups=[
 ('W01','内容创作与选题','图文编辑、任务恢复与公开内容研究已有入口，可查看历史任务和选题结果。',0,'S01-S03 / 附录 05-07 页','栏目内容 → 文章；聚合营销 → AI 图文创作'),
 ('W02','媒体发布计划','可在 Showki 创建图文、选择时间并保存排期。Buffer API 已连，实际发布待可用账号。',3,'S04 / 附录 08 页','聚合营销 → 媒体排期'),
 ('W03','商务与机会、方案与报价','按客户线索生成合作方案、报价单与合同草稿；正式数据录入后继续业务验收。',4,'S05 / 附录 09 页','商务与机会 → 方案与报价'),
 ('W04','资料库、导航与账号','公司资料集中管理，栏目导航按约定顺序排列，后台账号与 SSH 运维分工明确。',5,'S06-S08 / 附录 10-12 页','栏目内容 → 数据库；主导航；后台登录')
]
for row,(num,title,body,index,ref,path) in enumerate(groups):
    top=660-row*146
    item=data['screenshots'][index]
    box=(16,145,621,887) if index==3 else item.get('box')
    screenshot(item,42,top-114,156,104,box=box)
    txt(213,top-5,num,8,'ENB',PINK)
    txt(250,top-5,title,12,'Bold')
    para(213,top-29,body,338,9.5,16)
    txt(213,top-83,path,8,'CN',MUTED)
    txt(213,top-105,ref,8,'CN',PINK)
    c.linkRect('',f'item{index+1}',(213,top-113,550,top-91),relative=0,thickness=0)
    rule(42,top-130,W-84)
txt(42,58,data.get('evidence_footer','状态说明：界面复核不等于已完成所有真实业务或外部发送验收。'),8,'CN',MUTED)
c.showPage()

# Main report 3 / verification and next steps.
base(4,'03 / VALIDATION & NEXT','验证与下一步')
c.bookmarkPage('validation');c.addOutlineEntry('验证与下一步','validation',0)
txt(42,723,'已核对什么，还需要什么。',25,'Bold')
txt(42,686,'本次复核结果',12,'Bold')
for i,q in enumerate(data['qa']):
    y=657-i*37
    txt(42,y,q['label'],9,'Bold',GREEN)
    para(119,y,q['result'],432,9,15)
    rule(42,y-19,W-84)
txt(42,484,'重点关注 / Buffer 账号',12,'Bold')
screenshot(data['screenshots'][3],42,357,W-84,111,box=(16,880,621,1215))
txt(42,340,'S04 / API 已连接，但发布账号列表仍为空。',8,'CN',MUTED)
txt(42,305,'待客户配合',12,'Bold')
y=281
for i,s in enumerate(data['client_inputs'],1):
    txt(42,y,f'{i:02}',9,'ENB',PINK)
    y=para(66,y,s,487,9.5,16)-10
rule(42,207,W-84)
txt(42,181,'下一工作日计划',12,'Bold')
y=156
for i,s in enumerate(data['next_steps'],1):
    txt(42,y,f'{i:02}',9,'ENB',PINK)
    y=para(66,y,s,487,9,15)-8
assert y>39,y
c.showPage()

# Screenshot appendix: one feature per page, three simple operating steps.
for n,item in enumerate(data['screenshots'],1):
    base(n+4,f'APPENDIX / {item["id"]} / {item["tag"]}','功能截图与操作')
    c.bookmarkPage(f'item{n}')
    c.addOutlineEntry(f'{item["id"]}  {item["title"]}',f'item{n}',0)
    title_size=23 if n==5 else 26
    txt(42,723,item['title'],title_size,'Bold')
    txt(42,698,'入口 / '+item['entry'],9,'CN',MUTED)
    para(42,673,item['summary'],W-84,10.5,17)
    sx,sy,sw,sh=42,303,W-84,346
    if n==4:
        rect(sx,sy,sw,sh,WHITE)
        txt(sx+10,sy+sh-20,'创建内容',9,'Bold',GREEN)
        txt(sx+269,sy+sh-20,'发布账号与时间',9,'Bold',GREEN)
        image(shots/item['file'],(16,145,621,887),sx+8,sy+8,242,310)
        image(shots/item['file'],(16,885,621,1650),sx+266,sy+8,238,310)
    elif n==7:
        screenshot(item,sx,sy,247,sh)
        rect(sx+264,sy,247,sh,HexColor('#E9EDE5'))
        txt(sx+280,sy+316,'栏目内容',12,'Bold',GREEN)
        for k,t in enumerate(['网站首页','工作台','关于我们','联系我们','文章','图片与文件','数据库','发布记录']):
            y=sy+282-k*35
            txt(sx+280,y,f'{k+1:02}',8,'EN',MUTED)
            txt(sx+306,y,t,11)
            if k<7:rule(sx+280,y-12,208)
    else:
        box=(0,0,1186,690) if n==3 else item.get('box')
        screenshot(item,sx,sy,sw,sh,box=box)
    txt(42,285,item['id']+' / 正式后台 · '+('关键操作区域' if n!=8 else '登录界面'),8,'CN',MUTED)
    badge(item['status'],435,284)
    rule(42,266,W-84)
    for i,(title,body) in enumerate(item['steps']):
        x=42+i*176
        txt(x,240,f'{i+1:02}',9,'ENB',PINK)
        txt(x,217,title,12,'Bold')
        end=para(x,194,body,159,9.5,16)
        assert end>120,(n,i,end)
    note('使用说明',item['note'],y=59,h=61)
    c.showPage()

# Back cover, purpose-built companion visual.
image(art/'showki-back-cover-art.png',None,0,0,W,H,contain=False)
txt(42,785,'SHOWKI',22,'ENB',WHITE)
txt(43,764,'B I O T E C H',8,'EN',HexColor('#D4D8CF'))
rule(43,714,42,HexColor('#CF8EAC'))
txt(42,665,'让每一次更新，',28,'Light',WHITE)
txt(42,622,'都有清楚的交付。',28,'Bold',WHITE)
txt(43,581,'DAILY PROGRESS / VISIBLE RESULTS',8,'EN',HexColor('#CAD0C8'))
txt(43,531,'修齐生物独立站',11,'CN',WHITE)
txt(43,510,data.get('back_subtitle','客户每日工作简报 · 2026.09.22'),9,'CN',HexColor('#CBD2C9'))
rect(30,33,W-60,65,Color(.08,.12,.105,alpha=.76))
txt(43,77,'后台入口',8,'CN',HexColor('#CDD3CB'))
txt(43,55,'showkibiotech.com/admin/',11,'EN',WHITE)
c.linkURL('https://showkibiotech.com/admin/',(40,48,310,73),relative=0)
txt(415,57,'AI 视觉概念素材',7,'CN',HexColor('#CDD3CB'))
c.showPage();c.save()

reader=PdfReader(str(out))
assert len(reader.pages)==TOTAL
extracted=[p.extract_text() for p in reader.pages]
assert all(len(t)>90 for t in extracted)
assert '待客户配合' in extracted[3]
assert '媒体发布计划' in extracted[7]
print(json.dumps({'pages':len(reader.pages),'bytes':out.stat().st_size,'text_chars':[len(t) for t in extracted]},ensure_ascii=True))
