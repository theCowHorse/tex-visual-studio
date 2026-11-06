const {test}=require('node:test');
const assert=require('node:assert/strict');
const {formulaTarget,moveRange,mathRanges}=require('../src/ranges');
test('cursor inside inline, display and equation preserves delimiters',()=>{
 for(const [a,b] of [['$','$'],['$$','$$'],['\\[','\\]'],['\\(','\\)'],['\\begin{equation}','\\end{equation}']]){
  const text='前文 '+a+'x^2'+b+' 后文',t=formulaTarget(text,3+a.length+1,3+a.length+1);
  assert.equal(t.body,'x^2');assert.equal(t.open,a);assert.equal(t.close,b);
 }
});
test('escaped currency and comments do not become formulas',()=>{
 assert.equal(mathRanges('price \\$5; $x$')[0].open,'$');
 assert.equal(mathRanges('% $comment$\n$x$').length,1);
});
test('selected bare latex stays bare',()=>assert.equal(formulaTarget('a \\frac{x}{y} b',2,13).open,''));
test('selected delimited formula and empty insertion',()=>{
 assert.equal(formulaTarget('$x$',0,3).body,'x');
 assert.equal(formulaTarget('abc',3,3).open,'\\[');
});
test('prefix changes move target; overlap and cursor insertions conflict',()=>{
 assert.deepEqual(moveRange({start:5,end:10},[{rangeOffset:0,rangeLength:2,text:'abc'}]),{start:6,end:11});
 assert.equal(moveRange({start:5,end:10},[{rangeOffset:7,rangeLength:1,text:'z'}]),null);
 assert.equal(moveRange({start:5,end:5},[{rangeOffset:5,rangeLength:0,text:'z'}]),null);
 assert.deepEqual(moveRange({start:5,end:10},[{rangeOffset:12,rangeLength:0,text:'z'}]),{start:5,end:10});
});
