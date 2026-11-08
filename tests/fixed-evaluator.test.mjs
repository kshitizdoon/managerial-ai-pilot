import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseAssignment,clientView} from '../netlify/lib/eval-core.mjs';
import {KEY} from '../netlify/lib/instrument-data.mjs';

test('three conditions with independent fixed high/low profiles and correct visibility', () => {
  for(let i=0;i<120;i++) {
    const a=chooseAssignment([],[],`test${i}`,{}).assignment;
    assert.equal(a.source,'researcher_fixed_profiles');
    assert.deepEqual(a.slots.map(s=>s.condition).sort(),['A','B','C']);
    assert.equal(clientView(a).items.length,3);
    for(const s of a.slots) {
      assert.ok(['high','low'].includes(s.stratum));
      for(const d of s.display.decisions) {
        assert.equal(d.ai !== undefined,s.condition !== 'C');
        assert.equal(d.first !== undefined,s.condition === 'B');
        const scores=Object.values(KEY[a.caseId][d.k]);
        assert.equal(KEY[a.caseId][d.k][d.final],s.stratum==='high'?Math.max(...scores):Math.min(...scores));
      }
    }
  }
});

test('each condition independently flips ability at 50% across assignments', () => {
  const counts={A:0,B:0,C:0};
  for(let i=0;i<1000;i++) for(const s of chooseAssignment([],[],`p${i}`,{}).assignment.slots) if(s.stratum==='high') counts[s.condition]++;
  for(const count of Object.values(counts)) assert.ok(count>400&&count<600,`count ${count}`);
});
