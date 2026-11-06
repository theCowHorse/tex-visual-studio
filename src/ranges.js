'use strict';
// Offset-based selection helpers, kept separate from VS Code for regression tests.
function unescaped(text, i) {
  let n = 0; while (i > 0 && text[--i] === '\\') n++;
  return n % 2 === 0;
}
function mathRanges(text) {
  const ranges = [];
  const re = /\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}(?:\[[^\]]*\])?|\\\[|\\\(|\$\$|\$/g;
  let m;
  while ((m = re.exec(text))) {
    if (!unescaped(text, m.index)) continue;
    // Ignore commented opening delimiters.
    const line = text.lastIndexOf('\n', m.index - 1) + 1;
    let commented = false;
    for (let i = line; i < m.index; i++) if (text[i] === '%' && unescaped(text, i)) commented = true;
    if (commented) continue;
    const open = m[0];
    const close = m[1] ? `\\end{${m[1]}}` : ({'\\[':'\\]', '\\(':'\\)', '$$':'$$', '$':'$'})[open];
    let end = re.lastIndex;
    for (;;) {
      end = text.indexOf(close, end);
      if (end < 0) break;
      if (unescaped(text, end)) break;
      end += close.length;
    }
    if (end < 0 || (open === '$' && text.slice(re.lastIndex, end).includes('\n'))) continue;
    ranges.push({start:m.index, end:end+close.length, bodyStart:re.lastIndex, bodyEnd:end, open, close});
    re.lastIndex = end + close.length;
  }
  return ranges;
}
function formulaTarget(text, start, end) {
  const all = mathRanges(text);
  if (start === end) {
    const r = all.find(r => r.start <= start && start < r.end);
    if (r) return {...r, body:text.slice(r.bodyStart,r.bodyEnd)};
    return {start,end,open:'\\[',close:'\\]',body:''};
  }
  const selected = text.slice(start,end);
  const r = mathRanges(selected).find(r => r.start === 0 && r.end === selected.length);
  if (r) return {...r,start,end,body:selected.slice(r.bodyStart,r.bodyEnd)};
  return {start,end,open:'',close:'',body:selected};
}
function moveRange(range, changes) {
  let shift = 0;
  for (const c of changes) {
    const a=c.rangeOffset, b=a+c.rangeLength;
    if (b <= range.start && !(a === range.start && c.rangeLength === 0)) shift += c.text.length-c.rangeLength;
    else if (a < range.end || (range.start === range.end && a === range.start)) return null;
  }
  return {...range,start:range.start+shift,end:range.end+shift};
}
module.exports={mathRanges,formulaTarget,moveRange};
