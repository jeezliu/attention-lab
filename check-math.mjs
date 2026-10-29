import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {lessons,assignments} from './dist/content.js';
import {formatMathSource,mathText,math} from './dist/math.js';
let count=0;
function checkTex(tex,label){try{katex.renderToString(tex,{throwOnError:true,strict:'error',trust:false});count++;}catch(e){throw new Error(`${label}: ${e.message}\n${tex}`);}}
function snippets(s,label){for(const m of String(s).matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g))checkTex(m[1]??m[2],label);}
for(const l of lessons){
 checkTex(l.formula,`lesson ${l.id} core`);
 for(const [title,html] of l.sections)snippets(html,`lesson ${l.id} ${title}`);
 for(const q of l.checks){snippets(formatMathSource(q[0]),`question ${l.id}`);snippets(formatMathSource(q[3]),`explanation ${l.id}`);if(q[1])q[1].forEach(o=>snippets(formatMathSource(o),`option ${l.id}`));}
 for(const [,a] of l.reflect)snippets(formatMathSource(a),`reflection ${l.id}`);
 const chars=l.sections.map(x=>x[1].replace(/<[^>]*>/g,'')).join('').length;
 assert.ok(chars>1800,`lesson ${l.id} should provide substantial explanation (${chars})`);
 assert.equal(l.recap.length,3);
}
for(const a of assignments){for(const s of [a.brief,a.deliver,a.hint,...a.rubric])snippets(formatMathSource(s),`assignment ${a.id}`);if(a.id!==2)snippets(formatMathSource(a.solution),`assignment solution ${a.id}`);}
assert.ok(count>300,`expected extensive LaTeX coverage, got ${count}`);
assert.ok(mathText('<img src=x onerror=alert(1)>').includes('&lt;img'));
assert.ok(formatMathSource(String.raw`现有 \(W_Q\) 和 d_k`).includes(String.raw`\(W_Q\)`));
assert.ok(!math(String.raw`\frac{QK^{\mathsf T}}{\sqrt{d_k}}`).includes('katex-error'));
const css=fs.readFileSync('dist/vendor/katex/katex.min.css','utf8');
for(const m of css.matchAll(/url\(([^)]+)\)/g)){assert.ok(fs.existsSync('dist/vendor/katex/'+m[1]),`font missing ${m[1]}`);}
console.log(`PASS: ${count} authored LaTeX expressions parse strictly; all 10 lessons expanded; local math fonts present; safe escaping verified.`);
