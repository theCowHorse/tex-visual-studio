(function(root){
 'use strict';
 // Keep source trivia (including CRLF, indentation, comments and labels) while
 // replacing only mathematical tokens. MathLive serializes the whole expression.
 function tokenize(source){
  const tokens=[];let gap='',i=0;
  while(i<source.length){
   const tail=source.slice(i);
   const trivia=/^(?:\s+|%[^\r\n]*(?:\r?\n|$)|\\label\s*\{[^{}]*\})/.exec(tail);
   if(trivia){gap+=trivia[0];i+=trivia[0].length;continue;}
   const token=/^(?:\\[a-zA-Z@]+|\\[^a-zA-Z@]|[^\s])/u.exec(tail)[0];
   tokens.push({value:token,gap});gap='';i+=token.length;
  }
  return {tokens,tail:gap};
 }
 function merge(source,visual){
  const a=tokenize(source),b=tokenize(visual),n=a.tokens.length,m=b.tokens.length;
  if(n*m>4000000)throw Error('公式较长，请在 LaTeX 代码框中修改，以保留原有排版。');
  const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a.tokens[i].value===b.tokens[j].value?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  let out='',i=0,j=0;
  const add=(gap,value)=>{
   // Separate a control word from the next letter, even if MathLive omitted
   // whitespace that was previously represented by a brace group.
   if(!gap&&/\\[A-Za-z@]+$/.test(out)&&/^[A-Za-z@]/.test(value))gap=' ';
   out+=gap+value;
  };
  while(i<n||j<m){
   if(i<n&&j<m&&a.tokens[i].value===b.tokens[j].value){add(a.tokens[i].gap,a.tokens[i].value);i++;j++;}
   else if(i<n&&(j===m||dp[i+1][j]>=dp[i][j+1])){out+=a.tokens[i].gap;i++;}
   else {add(b.tokens[j].gap,b.tokens[j].value);j++;}
  }
  return out+a.tail;
 }
 const api={merge};if(typeof module!=='undefined')module.exports=api;else root.FormulaFormat=api;
})(globalThis);
