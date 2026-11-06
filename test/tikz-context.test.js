const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {readContext,unwrapSource}=require('../src/tikz-context');
test('parent colors are preview-only; ambiguous parents and modified prefixes cannot corrupt source',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tex-context-'));
 try{
  const file=path.join(dir,'diagrams.tex'),source='\\begin{tikzpicture}\n\\node at(0,0) {};\n\\end{tikzpicture}';
  const root='\\documentclass{article}\n\\definecolor{navy}{HTML}{213B52}\n\\input{diagrams}\n\\begin{document}';
  fs.writeFileSync(path.join(dir,'report.tex'),root);
  const c=readContext(file,source);
  assert.match(c.prefix,/213B52/);
  assert.equal(unwrapSource(c.prefix+source,c.prefix),source);
  assert.throws(()=>unwrapSource(c.prefix.replace('213B52','000000')+source,c.prefix));
  fs.writeFileSync(path.join(dir,'other.tex'),root);
  assert.equal(readContext(file,source).prefix,'');
  assert.match(readContext(file,'% !TEX root = report.tex\n'+source).prefix,/213B52/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
