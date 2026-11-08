import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const survey = readFileSync('js/survey.js', 'utf8');
const evaluator = readFileSync('js/evaluator.js', 'utf8');
const backend = readFileSync('netlify/functions/evaluator.mjs', 'utf8');
test('welcome offers direct evaluator entry and URL supports part=2', () => {
  assert.match(survey, /id="direct-evaluator"/);
  assert.match(survey, /url\.get\("part"\) === "2"/);
});
test('evaluator-only identities are separate from Producer identities', () => {
  assert.match(evaluator, /"evonly_" \+ uid\(\)/);
  assert.match(backend, /\^evonly_/);
});
