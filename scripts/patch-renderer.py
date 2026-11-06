"""Apply narrowly scoped compatibility fixes to TikZc 0.3.3 bundles.
Upstream MIT notices remain in licenses/. Safe to run repeatedly.
"""
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'media/tikz/assets'
helper = r'''
// TeX Visual compatibility: preserve offsets when terminating a standalone macro call.
function tvMacroBoundaries(source){
 const names=new Set([...source.matchAll(/\\(?:newcommand|renewcommand|providecommand)\s*\{\\([A-Za-z@]+)\}/g)].map(m=>m[1]));
 return source.replace(/^[ \t]*\\([A-Za-z@]+)([^\r\n]*)(\r?\n)/gm,(line,name,tail,end)=>{
  if(!names.has(name)||!tail.trim().startsWith('{'))return line;
  let depth=0,closed=false;
  for(let i=0;i<tail.length;i++){
   const c=tail[i];if(c==='\\'){i++;continue;}
   if(c==='{'){depth++;closed=false;}else if(c==='}'){if(--depth<0)return line;closed=depth===0;}
   else if(depth===0&&!/\s/.test(c))return line;
  }
  if(depth||!closed)return line;
  return line.slice(0,-end.length)+';'+end.slice(1);
 });
}
function tvLoopOptions(options){
 if(!options?.entries)return options;
 const entries=[];
 for(const entry of options.entries){
  const directions={'loop right':[-45,45],'loop left':[135,225],'loop above':[60,120],'loop below':[240,300],'loop':[60,120]};
  const angles=entry.kind==='flag'&&directions[entry.key];
  if(!angles){entries.push(entry);continue;}
  for(const [key,value] of [['out',angles[0]],['in',angles[1]],['looseness',8],['min distance','5mm']])
   entries.push({...entry,kind:'kv',key,valueRaw:String(value)});
 }
 return {...options,entries};
}
'''
for name, parser in [('compute-DkYgNiig.js','jk'),('compute.worker-BHGxw1el.js','jM')]:
    file=root/name
    text=file.read_text(encoding='utf8')
    isolated='RR' if parser=='jk' else 'vw'
    text=text.replace(f'function {isolated}(e,t,n){{const',f'function {isolated}(e,t,n){{e=tvMacroBoundaries(e);const')
    masked='FR' if parser=='jk' else 'Iw'
    text=text.replace(f'function {masked}(e,t){{if',f'function {masked}(e,t){{e=tvMacroBoundaries(e);if')
    allowed='QO' if parser=='jk' else 'qx'
    text=text.replace('/^loop(?: right|left|above|below)?$/','/^loop(?: (?:right|left|above|below))?$/')
    text=text.replace(f':{allowed}.has(e)?',f':({allowed}.has(e)||/^loop(?: (?:right|left|above|below))?$/.test(e))?')
    if 'function tvMacroBoundaries(' in text:
        file.write_text(text,encoding='utf8')
        continue
    old=f'return {parser}.parse(e)'
    assert text.count(old)==1
    text=text.replace(old,f'return {parser}.parse(tvMacroBoundaries(e))')
    # This loop belongs to the shared to/edge curve-option evaluator.
    token='for(const O of e.entries){if(O.kind==="flag"){O.key==="bend left"' if parser=='jk' else 'for(const R of e.entries){if(R.kind==="flag"){R.key==="bend left"'
    assert text.count(token)==1
    text=text.replace(token,'e=tvLoopOptions(e);'+token)
    file.write_text(text+'\n'+helper,encoding='utf8')
    print('Patched',name)
