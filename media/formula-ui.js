'use strict';
const vscode=acquireVsCodeApi();
const mf=document.querySelector('#math'),code=document.querySelector('#code'),status=document.querySelector('#status');
MathfieldElement.fontsDirectory=document.body.dataset.fonts;
MathfieldElement.soundsDirectory=null;
const keyboard=MathLive.initVirtualKeyboardInCurrentBrowsingContext();
keyboard.container=document.body;
keyboard.layouts=['numeric','symbols','alphabetic','greek'];
mf.mathVirtualKeyboardPolicy='sandboxed';
mf.smartFence=true;
let timer,blocked=false,labels=FormulaLabels.extract(''),visualSnapshot='',sourceBody='',lineEnding='\n';
const groups=[
 ['基础',[['分数','\\frac{#0}{#?}'],['上标','{#0}^{#?}'],['下标','{#0}_{#?}'],['根号','\\sqrt{#0}'],['n 次根','\\sqrt[#?]{#0}'],['括号','\\left(#0\\right)'],['绝对值','\\left|#0\\right|'],['向量','\\vec{#0}'],['短横线 bar','\\bar{#0}'],['长横线 overline','\\overline{#0}'],['帽子 hat','\\hat{#0}'],['波浪线 tilde','\\tilde{#0}']]],
 ['微积分',[['一阶导数','\\frac{\\operatorname{d}#0}{\\operatorname{d}\\mathit{#?}}'],['二阶导数','\\frac{\\operatorname{d}^{2}#0}{\\operatorname{d}\\mathit{#?}^{2}}'],['求导算子','\\frac{\\operatorname{d}}{\\operatorname{d}\\mathit{#?}}\\left(#0\\right)'],['二阶求导算子','\\frac{\\operatorname{d}^{2}}{\\operatorname{d}\\mathit{#?}^{2}}\\left(#0\\right)'],['偏导数','\\frac{\\partial #0}{\\partial \\mathit{#?}}'],['二阶偏导','\\frac{\\partial^{2}#0}{\\partial \\mathit{#?}^{2}}'],['偏导算子','\\frac{\\partial}{\\partial \\mathit{#?}}\\left(#0\\right)'],['点导数','\\dot{#0}'],['二阶点导数','\\ddot{#0}'],['不定积分','\\int #0\\,\\mathrm{d}x'],['定积分','\\int_{#?}^{#?}#0\\,\\mathrm{d}x'],['二重积分','\\iint_{#?}#0\\,\\mathrm{d}x\\,\\mathrm{d}y'],['三重积分','\\iiint_{#?}#0\\,\\mathrm{d}V'],['闭路积分','\\oint_{#?}#0\\,\\mathrm{d}l'],['极限','\\lim_{x\\to #?}#0'],['求和','\\sum_{#?}^{#?}#0'],['连乘','\\prod_{#?}^{#?}#0']]],
 ['矩阵与函数',[['矩阵','\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}'],['方括号矩阵','\\begin{bmatrix}#?&#?\\\\#?&#?\\end{bmatrix}'],['分段函数','\\begin{cases}#?&#?\\\\#?&#?\\end{cases}'],['正弦','\\sin #0'],['余弦','\\cos #0'],['自然对数','\\ln #0'],['对数','\\log_{#?}#0'],['指数','e^{#0}']]],
 ['关系与运算',[['±','\\pm'],['×','\\times'],['·','\\cdot'],['≤','\\leq'],['≥','\\geq'],['≠','\\neq'],['≈','\\approx'],['∼','\\sim'],['≃','\\simeq'],['∝','\\propto'],['≡','\\equiv'],['→','\\to'],['⇒','\\Rightarrow'],['↔','\\leftrightarrow'],['∞','\\infty'],['∈','\\in'],['∅','\\emptyset'],['∇','\\nabla']]],
 ['希腊字母',[]]
];
const greekNames='alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega'.split(' ');
const greekSmall=[...'αβγδεζηθικλμνξοπρστυφχψω'];
const greekBig=[...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'];
const upperCommands=new Set('Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega'.split(' '));
const latinUpper='ABΓΔEZHΘIKΛMNΞOΠPΣTΥΦXΨΩ';
greekNames.forEach((name,i)=>groups[4][1].push([greekSmall[i],name==='omicron'?'o':'\\'+name,name]));
greekNames.forEach((name,i)=>{const n=name[0].toUpperCase()+name.slice(1);groups[4][1].push([greekBig[i],upperCommands.has(n)?'\\'+n:[...latinUpper][i],n]);});
for(const [symbol,name] of [['ϵ','varepsilon'],['ϑ','vartheta'],['ϰ','varkappa'],['ϖ','varpi'],['ϱ','varrho'],['ς','varsigma'],['ϕ','varphi']])groups[4][1].push([symbol,'\\'+name,name]);
for(const [title,templates] of groups){
 const group=document.createElement('details');group.open=title==='基础'||title==='微积分';
 const heading=document.createElement('summary');heading.textContent=title;group.append(heading);
 const buttons=document.createElement('div');buttons.className='toolbar';
 for(const [name,latex,alias] of templates){
  const b=document.createElement('button');b.textContent=name;b.title=(alias||name)+'：'+latex;
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.addEventListener('click',()=>{mf.focus();mf.executeCommand(['insert',latex]);changed();});buttons.append(b);
 }
 group.append(buttons);document.querySelector('#templates').append(group);
}
const labelInfo=document.createElement('p');labelInfo.className='hint';mf.after(labelInfo);
function loadCode(value){sourceBody=value;if(value.includes('\n'))lineEnding=value.includes('\r\n')?'\r\n':'\n';labels=FormulaLabels.extract(value);mf.setValue(labels.visual,{silenceNotifications:true});visualSnapshot=mf.value;labelInfo.textContent=labels.labels.length?'保留标签：'+labels.labels.map(l=>l.raw).join('、')+'（可在下方代码中修改）':'';}
function changed(){
 try{if(mf.value===visualSnapshot)return;sourceBody=FormulaLabels.restore(mf.value,labels);code.value=sourceBody;labels=FormulaLabels.extract(sourceBody);visualSnapshot=mf.value;schedule();}
 catch(e){mf.setValue(FormulaLabels.extract(sourceBody).visual,{silenceNotifications:true});visualSnapshot=mf.value;status.textContent=e.message;}
}
function schedule(){status.textContent='已更新公式，待写入文档。';clearTimeout(timer);if(document.querySelector('#auto').checked&&!blocked)timer=setTimeout(apply,450);}
function apply(){clearTimeout(timer);if(blocked)return;vscode.postMessage({type:'apply',body:sourceBody,mode:document.querySelector('#mode').value});}
mf.addEventListener('input',changed);
code.addEventListener('input',()=>{loadCode(code.value.replace(/\r?\n/g,lineEnding));schedule();});
document.querySelector('#apply').onclick=apply;
document.querySelector('#auto').onchange=()=>{if(document.querySelector('#auto').checked)apply();};
document.querySelector('#copy').onclick=()=>{vscode.postMessage({type:'copy',text:sourceBody});status.textContent='已复制 LaTeX 代码。';};
document.querySelector('#keyboard').onclick=()=>{const visible=keyboard.visible;mf.focus();visible?keyboard.hide():keyboard.show();};
keyboard.addEventListener('geometrychange',()=>{document.body.style.paddingBottom=(keyboard.boundingRect.height+30)+'px';document.querySelector('#keyboard').setAttribute('aria-expanded',String(keyboard.visible));});
window.addEventListener('message',({data:m})=>{
 if(m.type==='load'){loadCode(m.body);code.value=m.body;status.textContent='已加载。修改后点击“写入文档”，或勾选自动写入。';}
 if(m.type==='applied')status.textContent='已写入 VS Code，Ctrl+S 保存。';
 if(m.type==='conflict'){blocked=true;clearTimeout(timer);status.textContent=m.message;status.className='error';document.querySelector('#apply').disabled=true;document.querySelector('#auto').checked=false;}
});
vscode.postMessage({type:'ready'});
