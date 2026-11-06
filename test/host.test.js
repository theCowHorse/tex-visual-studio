const {test}=require('node:test');const assert=require('node:assert/strict');const {host}=require('./mock-host');
const settle=()=>new Promise(r=>setImmediate(r));
test('formula writes only selected formula, supports repeated writes and prefix edits',async()=>{
 const h=host('before $x$ after',9);await h.commands['texVisual.formula']();const p=h.panels[0];
 p.receive({type:'apply',body:'x^2',mode:'preserve'});await settle();assert.equal(h.text(),'before $x^2$ after');
 h.external(0,0,'prefix ');p.receive({type:'apply',body:'y',mode:'preserve'});await settle();assert.equal(h.text(),'prefix before $y$ after');
});
test('overlapping source edit blocks stale formula overwrite',async()=>{
 const h=host('$x$',1);await h.commands['texVisual.formula']();h.external(1,2,'y');
 h.panels[0].receive({type:'apply',body:'z',mode:'preserve'});await settle();assert.equal(h.text(),'$y$');
});
test('TikZ cannot write arbitrary files; read/write version guard protects edits',async()=>{
 const source='\\begin{tikzpicture}\n\\end{tikzpicture}';const h=host(source);await h.commands['texVisual.tikz']();const p=h.panels[0];
 p.receive({type:'rpc',id:1,method:'linked.write',params:{path:'C:/other.tex',text:'BAD'}});await settle();assert.equal(h.text(),source);
 p.receive({type:'rpc',id:2,method:'linked.read',params:{path:h.doc.uri.fsPath}});await settle();h.external(0,0,'% changed\n');
 p.receive({type:'rpc',id:3,method:'linked.write',params:{path:h.doc.uri.fsPath,text:'BAD'}});await settle();assert.ok(h.text().startsWith('% changed'));
 p.receive({type:'rpc',id:4,method:'linked.read',params:{path:h.doc.uri.fsPath}});await settle();
 p.receive({type:'rpc',id:5,method:'linked.write',params:{path:h.doc.uri.fsPath,text:source+'\n'}});await settle();assert.equal(h.text(),source+'\n');
});
