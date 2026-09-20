/* =============================================================
   order.js — constrained randomisation.

   Cases and cards are shuffled, except where one card only makes sense
   after another. A card declares a dependency with `after:["otherKey"]`
   in cases.js; cases declare theirs in CASE_AFTER.

   Why not a plain shuffle: a card that says "that agent" or "the drop"
   is unreadable if the card that introduces the agent or the drop has
   not been read yet. Why not a fixed order: fixing what does not need
   fixing buys a position effect for nothing.

   The shuffle is uniform over the orders that satisfy the constraints.
   Rejection sampling gives that exactly; the topological fallback only
   runs if rejection sampling is unlucky, and never runs on a graph this
   small in practice.
   ============================================================= */

const shuffle = a => { a = [...a];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a; };

function orderHolds(arr, edges){
  return edges.every(([a,b]) => arr.indexOf(a) > -1 && arr.indexOf(b) > -1
                                 && arr.indexOf(a) < arr.indexOf(b));
}

/* random topological order: Kahn, picking at random among what is free */
function topoOrder(keys, edges){
  const indeg = {}, next = {};
  keys.forEach(k => { indeg[k] = 0; next[k] = []; });
  edges.forEach(([a,b]) => { if(indeg[b] != null && next[a]){ indeg[b]++; next[a].push(b); } });
  const free = keys.filter(k => !indeg[k]), out = [];
  while(free.length){
    const i = Math.floor(Math.random()*free.length);
    const k = free.splice(i,1)[0];
    out.push(k);
    next[k].forEach(m => { if(--indeg[m] === 0) free.push(m); });
  }
  return out.length === keys.length ? out : keys.slice();   // cyclic: give up, checkOrderRules reports it
}

function constrainedShuffle(keys, edges, tries){
  if(!edges || !edges.length) return shuffle(keys);
  for(let t = 0; t < (tries || 500); t++){
    const a = shuffle(keys);
    if(orderHolds(a, edges)) return a;
  }
  return topoOrder(keys, edges);
}

/* declared dependencies, as [before, after] pairs ------------------------- */
function cardEdges(c){
  const out = [];
  c.issues.forEach(i => (i.after || []).forEach(b => out.push([b, i.k])));
  return out;
}
function caseEdges(){
  const out = [], A = (typeof CASE_AFTER !== "undefined" && CASE_AFTER) || {};
  Object.keys(A).forEach(id => (A[id] || []).forEach(b => out.push([+b, +id])));
  return out;
}

/* validation: the app should break in development, not in the field ------- */
function hasCycle(keys, edges){
  const seen = {}, stack = {}, next = {};
  keys.forEach(k => next[k] = []);
  edges.forEach(([a,b]) => { if(next[a]) next[a].push(b); });
  const walk = k => {
    if(stack[k]) return true;
    if(seen[k]) return false;
    seen[k] = stack[k] = true;
    const bad = (next[k] || []).some(walk);
    stack[k] = false;
    return bad;
  };
  return keys.some(walk);
}

function checkOrderRules(){
  const problems = [];
  CASES.forEach(c => {
    const keys = c.issues.map(i => i.k);
    c.issues.forEach(i => (i.after || []).forEach(b => {
      if(b === i.k) problems.push(`case ${c.id}: "${i.k}" declares itself as a prerequisite`);
      else if(!keys.includes(b)) problems.push(`case ${c.id}: "${i.k}" must follow "${b}", which is not an issue in this case`);
    }));
    const edges = cardEdges(c);
    if(hasCycle(keys, edges)) problems.push(`case ${c.id}: the card order constraints form a loop, so no order can satisfy them`);
    if(edges.length && !orderHolds(constrainedShuffle(keys, edges), edges))
      problems.push(`case ${c.id}: constrained shuffle produced an order that breaks its own constraints`);
  });
  const ids = CASES.map(c => c.id);
  caseEdges().forEach(([a,b]) => {
    if(!ids.includes(a)) problems.push(`CASE_AFTER: case ${b} must follow case ${a}, which does not exist`);
    if(!ids.includes(b)) problems.push(`CASE_AFTER: case ${b} does not exist`);
  });
  if(hasCycle(ids, caseEdges())) problems.push("CASE_AFTER: the case order constraints form a loop");
  return problems;
}
