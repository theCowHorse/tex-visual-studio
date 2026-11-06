const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function host(content,selection=0,fileName='C:/test/demo.tex'){
 const handlers=[],closes=[],commands={},panels=[];
 let text=content;
 const uri={fsPath:fileName,toString(){return this.fsPath;}};
 const doc={uri,fileName:uri.fsPath,version:1,isClosed:false,isUntitled:false,getText:()=>text,offsetAt:p=>p.offset,positionAt:offset=>({offset})};
 const ext=path.resolve(__dirname,'..');
 const vscode={
  Uri:{joinPath:(u,...p)=>({fsPath:path.join(u.fsPath,...p)}),file:p=>({fsPath:p}),parse:u=>({scheme:u.split(':')[0]})},
  ViewColumn:{Beside:2},Range:class{constructor(start,end){this.start=start;this.end=end;}},
  WorkspaceEdit:class{replace(uri,range,value){this.range=range;this.value=value;}},
  commands:{registerCommand:(n,f)=>(commands[n]=f,{dispose(){}})},
  window:{activeTextEditor:{document:doc,selection:{start:{offset:selection},end:{offset:selection}}},createOutputChannel:()=>({appendLine(){},dispose(){}}),
   createWebviewPanel:()=>{const p={messages:[],webview:{cspSource:'http://127.0.0.1:43129',asWebviewUri:u=>'http://127.0.0.1:43129/'+path.relative(ext,u.fsPath).replaceAll('\\','/'),postMessage:m=>{p.messages.push(m);return Promise.resolve(true);},onDidReceiveMessage:f=>{p.receive=f;}},onDidDispose:f=>{p.dispose=f;}};panels.push(p);return p;},
   showInformationMessage:async()=>{},showSaveDialog:async()=>undefined},
  workspace:{onDidChangeTextDocument:f=>(handlers.push(f),{dispose(){}}),onDidCloseTextDocument:f=>(closes.push(f),{dispose(){}}),
   fs:{readFile:u=>fs.promises.readFile(u.fsPath)},applyEdit:async e=>{const a=e.range.start.offset,b=e.range.end.offset;text=text.slice(0,a)+e.value+text.slice(b);doc.version++;handlers.forEach(f=>f({document:doc,contentChanges:[{rangeOffset:a,rangeLength:b-a,text:e.value}]}));return true;}},
  env:{clipboard:{writeText:async()=>{},readText:async()=>''}}
 };
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(ext,'src/extension.js'),'utf8'),{require:n=>n==='vscode'?vscode:n.startsWith('./')?require('../src/'+n.slice(2)):require(n),module,Buffer,console});
 module.exports.activate({extensionUri:{fsPath:ext},subscriptions:[]});
 return {commands,panels,doc,text:()=>text,external(a,b,value){text=text.slice(0,a)+value+text.slice(b);doc.version++;handlers.forEach(f=>f({document:doc,contentChanges:[{rangeOffset:a,rangeLength:b-a,text:value}]}));}};
}
module.exports={host};
