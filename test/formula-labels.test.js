const {test}=require('node:test'),assert=require('node:assert/strict');
const {extract,restore}=require('../media/formula-labels');
test('equation labels survive no-op and repeated visual edits',()=>{
 const source=String.raw`x^2\label{eq:square}`;const state=extract(source);
 assert.equal(state.visual,'x^2');assert.equal(restore(state.visual,state),source);
 assert.equal(restore('y^2',state),String.raw`y^2\label{eq:square}`);
 assert.equal(restore('z^2',state),String.raw`z^2\label{eq:square}`);
});
test('labels stay on their own align rows; changing row count is refused',()=>{
 const state=extract(String.raw`a&=b\label{eq:a}\\c&=d\label{eq:b}`);
 assert.equal(restore(String.raw`a&=1\\c&=2`,state),String.raw`a&=1\label{eq:a}\\c&=2\label{eq:b}`);
 assert.throws(()=>restore('x',state));
});
test('matrix row separators and commented labels do not misplace equation labels',()=>{
 const source=String.raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}\label{eq:m}`;
 const state=extract(source);assert.equal(state.rowCount,1);
 assert.equal(restore(state.visual.replace('a','x'),state).match(/\\label/g).length,1);
 assert.equal(extract('% \\label{comment}\nx').labels.length,0);
});
