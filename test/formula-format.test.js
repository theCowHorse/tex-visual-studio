const {test}=require('node:test'),assert=require('node:assert/strict');
const {merge}=require('../media/formula-format');
const {extract,restore}=require('../media/formula-labels');
test('visual substitutions preserve CRLF, indentation, comments and label position',()=>{
 const source='\r\n  x +\r\n    y % explanation\r\n  \\label{eq:a}\r\n';
 assert.equal(merge(source,'x+z'),'\r\n  x +\r\n    z % explanation\r\n  \\label{eq:a}\r\n');
});
test('multiline source and align row labels survive repeated changes',()=>{
 let source='\n  a &= b\\label{eq:a}\\\\\n  c &= d\\label{eq:b}\n';
 source=restore(String.raw`a&=1\\c&=2`,extract(source));
 assert.equal(source,'\n  a &= 1\\label{eq:a}\\\\\n  c &= 2\\label{eq:b}\n');
 assert.equal(restore(String.raw`a&=3\\c&=4`,extract(source)),'\n  a &= 3\\label{eq:a}\\\\\n  c &= 4\\label{eq:b}\n');
});
test('normalization retains source line breaks inside fractions',()=>{
 const source='\n  \\frac{\n    x^2\n  }{\n    y\n  }\n';
 const result=merge(source,String.raw`\frac{x^{2}}{z}`);
 assert.equal((result.match(/\n/g)||[]).length,(source.match(/\n/g)||[]).length);
 assert.match(result,/\n    z\n/);
});
test('escaped percent is a math token, control words cannot join following letters',()=>{
 assert.equal(merge(String.raw`x\%+1`,String.raw`y\%+1`),String.raw`y\%+1`);
 assert.equal(merge(String.raw`\alpha{}x`,String.raw`\alpha y`),String.raw`\alpha y`);
});
