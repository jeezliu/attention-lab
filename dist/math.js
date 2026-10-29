import katex from './vendor/katex/katex.mjs';
import renderMathInElement from './vendor/katex/contrib/auto-render.mjs';

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const mathOptions={throwOnError:false,strict:'warn',trust:false,output:'htmlAndMathml',maxExpand:1000};
export function math(tex,display=false){return katex.renderToString(tex,{...mathOptions,displayMode:display});}
export function mathBlock(tex){return `<div class="formula">${math(tex,true)}</div>`;}

// Explicit legacy notation mapping; author new content with \(...\) and \[...\].
// This formatter is only used for editorial text. Never apply it to source code or user input.
const symbols=[
 ['exp(s) / (exp(s)+exp(s)) = 0.5',String.raw`\frac{e^s}{e^s+e^s}=0.5`],
 ['1000×64',String.raw`1000\times64`],['√64=8',String.raw`\sqrt{64}=8`],['96÷6=16',String.raw`96/6=16`],
 ['−ln(1)=0',String.raw`-\ln1=0`],['exp(−∞)=0',String.raw`e^{-\infty}=0`],['exp(0)=1',String.raw`e^0=1`],
 ['exp(100)',String.raw`e^{100}`],['exp(0)>0',String.raw`e^0>0`],['sin(0)=0',String.raw`\sin0=0`],['cos(0)=1',String.raw`\cos0=1`],
 ['d_head=d_model/h',String.raw`d_{\mathrm{head}}=d_{\mathrm{model}}/h`],
 ['x + Sublayer(LN(x))',String.raw`x+\operatorname{Sublayer}(\operatorname{LN}(x))`],
 ['LN(x + Sublayer(x))',String.raw`\operatorname{LN}(x+\operatorname{Sublayer}(x))`],
 ['LN(x) + x',String.raw`\operatorname{LN}(x)+x`],
 ['√d_model',String.raw`\sqrt{d_{\mathrm{model}}}`],['√d_k',String.raw`\sqrt{d_k}`],['√dₖ',String.raw`\sqrt{d_k}`],
 ['QKᵀ',String.raw`QK^{\mathsf T}`],['Kᵀ',String.raw`K^{\mathsf T}`],
 ['d_model',String.raw`d_{\mathrm{model}}`],['d_head',String.raw`d_{\mathrm{head}}`],['d_ff',String.raw`d_{\mathrm{ff}}`],['d_k',String.raw`d_k`],['d_v',String.raw`d_v`],
 ['W_Q',String.raw`W_Q`],['W_K',String.raw`W_K`],['W_V',String.raw`W_V`],['W_O',String.raw`W_O`],
 ['h×d_v',String.raw`h\times d_v`],['T×T',String.raw`T\times T`],['(2T)×(2T)',String.raw`(2T)\times(2T)`],['T²',String.raw`T^2`],
 ['−∞',String.raw`-\infty`],['T>0',String.raw`\tau>0`]
].sort((a,b)=>b[0].length-a[0].length);
const pattern=new RegExp(symbols.map(([s])=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+'|\\b\\d+×\\d+\\b|\\([A-Za-z0-9_, .]+\\)|\\[[A-Za-z0-9., -]+\\]','g');
export function formatMathSource(text){
 const protectedParts=String(text??'').split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g);
 return protectedParts.map((part,i)=>i%2?part:part.replace(pattern,match=>{
   const mapped=symbols.find(([s])=>s===match)?.[1];
   const tex=mapped||match.replaceAll('×',String.raw`\times`).replace(/d_model/g,String.raw`d_{\mathrm{model}}`).replaceAll('_', '_');
   // Do not typeset function calls that happen to contain a parenthesized identifier.
   if(!mapped && match.startsWith('(') && !match.includes(','))return match;
   return `\\(${tex}\\)`;
 })).join('');
}
export const mathText=text=>escapeHTML(formatMathSource(text));
export function typeset(root){
 if(!root)return;
 renderMathInElement(root,{...mathOptions,delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],ignoredTags:['script','noscript','style','textarea','pre','code','option','select','svg'],ignoredClasses:['katex','no-math'],errorCallback:(message,error)=>console.error('Formula rendering error:',message,error)});
 root.querySelectorAll('.katex-display').forEach(el=>{
   if(el.scrollWidth>el.clientWidth+2){el.setAttribute('tabindex','0');el.setAttribute('role','region');el.setAttribute('aria-label','数学公式，可横向滚动查看');}
 });
}
