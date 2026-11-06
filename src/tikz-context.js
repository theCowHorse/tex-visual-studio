'use strict';
const fs=require('node:fs');
const path=require('node:path');

// Read only a uniquely identified parent document. Never execute TeX here.
function readContext(file,source){
 const dir=path.dirname(file);
 const read=p=>{try{if(fs.statSync(p).size>2000000)return '';return fs.readFileSync(p,'utf8');}catch{return '';}};
 const directive=source.match(/^\s*%\s*!TEX\s+root\s*=\s*(.+)$/mi);
 let parents=[];
 if(directive){const p=path.resolve(dir,directive[1].trim());parents=[{file:p,text:read(p)}];}
 else {
  let names=[];try{names=fs.readdirSync(dir).filter(n=>n.endsWith('.tex')).slice(0,100);}catch{}
  for(const name of names){
   const p=path.join(dir,name);if(p===file)continue;
   const text=read(p);
   if(!/\\documentclass\b/.test(text))continue;
   const includes=[...text.matchAll(/\\(?:input|include)\s*\{([^}]+)\}/g)];
   if(includes.some(m=>path.resolve(dir,/\.tex$/i.test(m[1])?m[1]:m[1]+'.tex').toLowerCase()===file.toLowerCase()))parents.push({file:p,text});
  }
 }
 if(parents.length!==1)return {prefix:'',parent:null};
 const parent=parents[0];
 const preamble=parent.text.split(/\\begin\s*\{document\}/)[0].replace(/(?<!\\)%[^\r\n]*/g,'');
 const definitions=preamble.match(/\\(?:definecolor\s*\{[^{}]+\}\s*\{[^{}]+\}\s*\{[^{}]+\}|colorlet\s*\{[^{}]+\}\s*\{[^{}]+\})/g)||[];
 return {prefix:definitions.length?'% TeX Visual: read-only parent colors\n'+definitions.join('\n')+'\n% TeX Visual: original document follows\n':'',parent:parent.file};
}
function unwrapSource(text,prefix){
 if(!text.startsWith(prefix))throw Error('预览中的主文件颜色定义已被修改。请关闭面板后重新打开；原文件未写入。');
 return text.slice(prefix.length);
}
module.exports={readContext,unwrapSource};
