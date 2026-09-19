/* =============================================================
   stats.js — the arithmetic behind the results view.
   Z = 1.96 + 0.84, the constant for 80% power at a two-sided 5% test.
   ============================================================= */
const Z_POWER = 2.802;

const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : NaN;
const vr   = a => { const m = mean(a); return a.length<2 ? 0 : a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1); };
const sd   = a => Math.sqrt(vr(a));
const med  = a => { const b=[...a].sort((x,y)=>x-y), n=b.length;
                    return n ? (n%2 ? b[(n-1)/2] : (b[n/2-1]+b[n/2])/2) : NaN; };
function corr(a,b){
  const ma=mean(a), mb=mean(b); let n=0,da=0,db=0;
  for(let i=0;i<a.length;i++){ n+=(a[i]-ma)*(b[i]-mb); da+=(a[i]-ma)**2; db+=(b[i]-mb)**2; }
  return (da && db) ? n/Math.sqrt(da*db) : NaN;
}
/* rows: one array of item scores per person */
function alphaOf(rows){
  if(!rows.length || rows[0].length < 2) return NaN;
  const k = rows[0].length, items = [];
  for(let j=0;j<k;j++) items.push(rows.map(r=>r[j]));
  const sumVar = items.reduce((s,it)=>s+vr(it),0);
  const tot = vr(rows.map(r=>r.reduce((a,b)=>a+b,0)));
  return tot > 0 ? (k/(k-1))*(1-sumVar/tot) : NaN;
}
const spearmanBrown = (r1,k) => k*r1/(1+(k-1)*r1);
const singleItemRel = (alpha,k) => alpha/(k-alpha*(k-1));
const fmt = (x,d=1) => Number.isFinite(x) ? x.toFixed(d) : "—";
const pct = (x,d=0) => Number.isFinite(x) ? x.toFixed(d)+"%" : "—";

/* smallest effect you could detect, per SD of measured ability,
   from the observed spread of the good-minus-bad change */
function mdeInteraction(sdD, n, reliability){
  return Z_POWER * sdD / Math.sqrt(n * Math.max(reliability, 0.01));
}
function nNeeded(effect, sdD, reliability){
  return Math.ceil(Math.pow(Z_POWER*sdD/(effect*Math.sqrt(Math.max(reliability,0.01))), 2));
}
