import test from 'node:test';
import assert from 'node:assert/strict';
import {PAGES,pageKey,clickTarget} from '../assets/js/site-statistics.mjs';
test('public pages have a closed catalogue; private routes and query text are excluded',()=>{
  assert.equal(pageKey('/tarifs.html'),'PRICING');assert.equal(pageKey('/client/42'),null);assert.equal(pageKey('/tarifs.html?email=private'),null);assert.equal(pageKey('/suivi-souscription/secret'),null);assert.equal(Object.keys(PAGES).length,17);
});
test('click destinations discard query strings and never accept external/private URLs',()=>{
  const base='https://www.keydy.be/index.html';
  assert.equal(clickTarget('tarifs.html?email=MUST_NOT_LEAVE',base),'PRICING');assert.equal(clickTarget('https://keydy.be/souscription-keydy?modules=STOCK',base),'SUBSCRIBE');assert.equal(clickTarget('https://keydy.be/suivi-souscription/secret',base),null);assert.equal(clickTarget('https://external.invalid/',base),null);assert.equal(clickTarget('mailto:private@example.invalid?body=SECRET',base),'EMAIL');assert.equal(clickTarget('javascript:bad()',base),null);
});
