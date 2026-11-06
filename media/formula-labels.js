(function(root){
 'use strict';
 function rows(source){
  const result=[];let start=0,depth=0,env=0;
  for(let i=0;i<source.length;i++){
   if(source[i]==='%'){const end=source.indexOf('\n',i);i=end<0?source.length:end;continue;}
   if(source[i]==='\\'){
    const environment=/^\\(begin|end)\{[^}]+\}/.exec(source.slice(i));
    if(environment){env+=environment[1]==='begin'?1:-1;i+=environment[0].length-1;continue;}
    if(source[i+1]==='\\'&&depth===0&&env===0){result.push(source.slice(start,i));start=i+2;}
    i++;continue;
   }
   if(source[i]==='{')depth++;
   if(source[i]==='}')depth--;
  }
  result.push(source.slice(start));return result;
 }
 function extract(source){
  const labels=[];
  const parts=rows(source).map((row,index)=>row.replace(/\\\\|\\%|%[^\r\n]*|\\label\s*\{[^{}]*\}/g,raw=>{
   if(!raw.startsWith('\\label'))return raw;
   labels.push({row:index,raw});return '';
  }));
  return {source,visual:parts.join('\\\\'),labels,rowCount:parts.length};
 }
 function restore(visual,state){
  if(visual===state.visual)return state.source;
  const format=typeof module!=='undefined'?require('./formula-format'):root.FormulaFormat;
  if(!state.labels.length)return format.merge(state.source,visual);
  const parts=rows(visual);
  if(parts.length!==state.rowCount)throw Error('含标签公式的行数发生变化，请在下方 LaTeX 代码中调整，确保标签对应正确。');
  const original=rows(state.source);
  return parts.map((row,index)=>format.merge(original[index],row)).join('\\\\');
 }
 const api={extract,restore};
 if(typeof module!=='undefined')module.exports=api;else root.FormulaLabels=api;
})(globalThis);
