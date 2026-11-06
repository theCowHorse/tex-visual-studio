'use strict';
const vscode = require('vscode');
const crypto = require('node:crypto');
const path = require('node:path');
const {formulaTarget,moveRange}=require('./ranges');
const {readContext,unwrapSource}=require('./tikz-context');
const demo=String.raw`\begin{tikzpicture}
  \node[draw, rounded corners, fill=blue!10] (a) at (0,0) {Start};
  \node[draw, rounded corners, fill=green!10] (b) at (4,0) {Goal};
  \draw[->, thick] (a) -- (b);
\end{tikzpicture}
`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function activate(ctx) {
  const log=vscode.window.createOutputChannel('TeX Visual Studio');
  ctx.subscriptions.push(log,
    vscode.commands.registerCommand('texVisual.formula',()=>openFormula(ctx)),
    vscode.commands.registerCommand('texVisual.tikz',()=>openTikz(ctx,log)),
    vscode.commands.registerCommand('texVisual.newTikz',async()=>{
      const uri=await vscode.window.showSaveDialog({saveLabel:'新建 TikZ',filters:{TikZ:['tikz']}});
      if(!uri)return;
      await vscode.workspace.fs.writeFile(uri,Buffer.from(demo));
      const doc=await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc); await openTikz(ctx,log);
    }));
}
function media(ctx,panel,sub) {
  const uri=vscode.Uri.joinPath(ctx.extensionUri,'media',sub);
  return panel.webview.asWebviewUri(uri).toString();
}
async function openFormula(ctx) {
  const editor=vscode.window.activeTextEditor;
  if (!editor) return vscode.window.showInformationMessage('请先打开一个文本文件，并把光标放在公式或插入位置。');
  const doc=editor.document;
  let target=formulaTarget(doc.getText(),doc.offsetAt(editor.selection.start),doc.offsetAt(editor.selection.end));
  let original=doc.getText().slice(target.start,target.end), stale=false, own=false, queue=Promise.resolve();
  const panel=vscode.window.createWebviewPanel('texVisual.formula','公式 · TeX Visual',vscode.ViewColumn.Beside,
    {enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[vscode.Uri.joinPath(ctx.extensionUri,'media')]});
  const send=()=>panel.webview.postMessage({type:'load',body:target.body,open:target.open,close:target.close});
  const change=vscode.workspace.onDidChangeTextDocument(e=>{
    if(e.document!==doc || own) return;
    const moved=moveRange(target,e.contentChanges);
    if(moved) target=moved;
    else {stale=true;panel.webview.postMessage({type:'conflict',message:'原公式已在文本编辑器中改变。请关闭面板，在原公式处重新打开，以免覆盖修改。'});}
  });
  const closed=vscode.workspace.onDidCloseTextDocument(d=>{if(d===doc){stale=true;panel.webview.postMessage({type:'conflict',message:'目标文档已关闭，请重新打开文档。'});}});
  panel.onDidDispose(()=>{change.dispose();closed.dispose();});
  panel.webview.onDidReceiveMessage(msg=>{
    if(msg.type==='ready') return send();
    if(msg.type==='copy' && typeof msg.text==='string') return vscode.env.clipboard.writeText(msg.text);
    if(msg.type!=='apply' || typeof msg.body!=='string' || msg.body.length>100000) return;
    queue=queue.then(async()=>{
      if(stale || doc.isClosed || doc.getText().slice(target.start,target.end)!==original) throw Error('文档已变化，请重新打开公式面板。');
      const delimiters={'display':['\\[','\\]'],'inline':['$','$'],'bare':['',''],'preserve':[target.open,target.close]};
      const [left,right]=delimiters[msg.mode]||delimiters.preserve;
      const value=left+msg.body+right;
      if(value===original){panel.webview.postMessage({type:'applied'});return;}
      const edit=new vscode.WorkspaceEdit();
      edit.replace(doc.uri,new vscode.Range(doc.positionAt(target.start),doc.positionAt(target.end)),value);
      own=true;
      try {if(!await vscode.workspace.applyEdit(edit)) throw Error('VS Code 未能应用修改。');}
      finally {own=false;}
      target={...target,end:target.start+value.length,open:left,close:right,body:msg.body};original=value;
      panel.webview.postMessage({type:'applied'});
    }).catch(e=>panel.webview.postMessage({type:'conflict',message:e.message}));
  });
  const base=media(ctx,panel,'');const csp=panel.webview.cspSource;
  panel.webview.html=`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${csp}; style-src ${csp} 'unsafe-inline'; font-src ${csp} data:; img-src ${csp} data:; connect-src ${csp};">
  <link rel="stylesheet" href="${base}/formula.css"></head><body data-fonts="${base}/mathlive/fonts">
  <header><span class="eyebrow">TEX VISUAL STUDIO</span><h1>公式编辑器</h1><p>直接输入、点击模板或使用屏幕键盘，LaTeX 代码同步更新。</p></header>
  <div id="templates" class="toolbar" aria-label="公式模板"></div>
  <math-field id="math" aria-label="可视化公式编辑区"></math-field>
  <label for="code">LaTeX 代码</label><textarea id="code" spellcheck="false" aria-label="LaTeX 代码"></textarea>
  <div class="toolbar"><label for="mode">插入格式</label><select id="mode"><option value="preserve">保留原格式</option><option value="display">独立公式 \\[ … \\]</option><option value="inline">行内公式 $ … $</option><option value="bare">只插入代码</option></select></div>
  <div class="toolbar"><button id="apply" class="primary">写回文档</button><button id="copy">复制代码</button><button id="keyboard">公式键盘</button><label><input id="auto" type="checkbox">自动写回</label></div>
  <p id="status" role="status">正在加载离线公式引擎…</p><p class="hint">在原文档按 Ctrl+S 保存、Ctrl+Z 撤销。复杂自定义宏和 align 多行环境建议直接编辑代码。</p>
  <script src="${base}/mathlive/mathlive.min.js"></script><script src="${base}/formula-format.js"></script><script src="${base}/formula-labels.js"></script><script src="${base}/formula-ui.js"></script></body></html>`;
}
async function openTikz(ctx,log) {
  const editor=vscode.window.activeTextEditor;
  if(!editor) return vscode.window.showInformationMessage('请先打开 .tikz / .tex 文件，或运行“TeX Visual: 新建 TikZ 图形”。');
  const doc=editor.document;
  if(doc.isUntitled)return vscode.window.showInformationMessage('请先将文档保存为 .tikz 或 .tex 文件，再打开 TikZ 面板。');
  if(!doc.getText().includes('\\begin{tikzpicture}')) return vscode.window.showInformationMessage('当前文件没有 tikzpicture 环境。请先运行“TeX Visual: 新建 TikZ 图形”。');
  const panel=vscode.window.createWebviewPanel('texVisual.tikz','TikZ · TeX Visual',vscode.ViewColumn.Beside,
    {enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[vscode.Uri.joinPath(ctx.extensionUri,'media','tikz')]});
  const key=doc.isUntitled ? `untitled-${crypto.randomBytes(4).toString('hex')}.tikz` : doc.uri.fsPath;
  const {prefix,parent}=readContext(doc.uri.fsPath,doc.getText());
  if(parent)log.appendLine('TikZ parent colors: '+parent);
  const previewSource=()=>prefix+doc.getText();
  let readVersion=doc.version, own=false, queue=Promise.resolve();
  const change=vscode.workspace.onDidChangeTextDocument(e=>{
    if(e.document===doc && !own)panel.webview.postMessage({type:'linked-file-changed',path:key});
  });
  panel.onDidDispose(()=>change.dispose());
  async function rpc(method,p) {
    if(method==='linked.read') {if(p.path!==key||doc.isClosed)return {status:'missing'};readVersion=doc.version;return {status:'ok',source:previewSource()};}
    if(method==='linked.write') {
      if(p.path!==key||doc.isClosed||typeof p.text!=='string'||p.text.length>5000000)return {ok:false,reason:'目标文档不可用。'};
      if(doc.version!==readVersion)return {ok:false,reason:'文档刚刚发生变化，请重试，旧内容未写入。'};
      const value=unwrapSource(p.text,prefix);
      if(value===doc.getText())return {ok:true};
      const edit=new vscode.WorkspaceEdit();edit.replace(doc.uri,new vscode.Range(doc.positionAt(0),doc.positionAt(doc.getText().length)),value);
      own=true;let ok;try{ok=await vscode.workspace.applyEdit(edit);}finally{own=false;}
      readVersion=doc.version;return {ok};
    }
    if(method==='clipboard.readText')return vscode.env.clipboard.readText();
    if(method==='clipboard.writeText'){if(typeof p.text==='string')await vscode.env.clipboard.writeText(p.text);return;}
    if(method==='latex.check')return {available:false,details:'本版本使用离线可视化预览。精确排版请使用 LaTeX Workshop 编译原文档。'};
    if(method==='latex.compileSnippet')return (p.snippets||[]).map(s=>({...s,status:'unsupported',message:'请使用 LaTeX Workshop 编译此节点。'}));
    if(method==='latex.readLog')return '此扩展不调用本机 TeX 编译器；请使用 LaTeX Workshop。';
    if(method==='window.showMessage'){log.appendLine(String(p.message));return vscode.window.showInformationMessage(String(p.message));}
    if(method==='window.openExternal') {const u=vscode.Uri.parse(String(p.url));return /^https?$/.test(u.scheme)?vscode.env.openExternal(u):false;}
    if(method==='window.confirmUnsaved'){
      const c=await vscode.window.showWarningMessage(String(p.message),{modal:true},'Save','Discard');return c==='Save'?'save':c==='Discard'?'discard':'cancel';
    }
    if(method==='file.saveAs'){await vscode.window.showInformationMessage('请在 VS Code 原文档中另存为，再重新打开 TikZ 面板。');return {status:'cancelled'};}
    if(method==='file.export'){
      const suggested=path.join(path.dirname(doc.fileName),path.basename(String(p.fileName||'diagram.svg')));
      const u=await vscode.window.showSaveDialog({saveLabel:'导出图形',defaultUri:vscode.Uri.file(suggested)});
      if(!u)return method==='file.export'?false:{status:'cancelled'};
      await vscode.workspace.fs.writeFile(u,Buffer.from(String(method==='file.export'?p.base64:p.text),method==='file.export'?'base64':'utf8'));
      return method==='file.export'?true:{status:'saved',path:u.fsPath};
    }
    throw Error('请在 VS Code 中打开/保存文件；精确编译使用 LaTeX Workshop。');
  }
  panel.webview.onDidReceiveMessage(msg=>{
    if(msg.type==='notify') {
      if(msg.method==='ready')panel.webview.postMessage({type:'open-document',source:previewSource(),path:key});
      if(msg.method==='log')log.appendLine(String(msg.params?.message));
      return;
    }
    if(msg.type!=='rpc')return;
    queue=queue.then(async()=>{
      try{const value=await rpc(msg.method,msg.params||{});panel.webview.postMessage({type:'rpc-result',id:msg.id,ok:true,value});}
      catch(e){panel.webview.postMessage({type:'rpc-result',id:msg.id,ok:false,error:e.message});}
    });
  });
  const uri=vscode.Uri.joinPath(ctx.extensionUri,'media','tikz','index.html');
  let html=Buffer.from(await vscode.workspace.fs.readFile(uri)).toString();
  const c=panel.webview.cspSource,n=crypto.randomBytes(16).toString('hex');
  html=html.replace('<head>',`<head><base href="${esc(media(ctx,panel,'tikz'))}/"><meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src ${c} 'nonce-${n}';style-src ${c} 'unsafe-inline';font-src ${c} data:;img-src ${c} data: blob:;worker-src ${c} blob:;connect-src ${c} data: blob:;"><script nonce="${n}">window.__TIKZC_PERSISTENCE__={};</script>`);
  panel.webview.html=html;
}
module.exports={activate,deactivate(){}};
