import test from 'node:test';import assert from 'node:assert/strict';
import {normalize,dependents,configurationUrl} from '../assets/js/commerce.mjs';
const catalog=[{key:'STOCK',required:[]},{key:'ACHATS',required:['STOCK']},{key:'MOBILE',required:['PLANNING']},{key:'PLANNING',required:[]}];
test('dependencies selected, unknown modules ignored',()=>assert.deepEqual([...normalize(new Set(['ACHATS','UNKNOWN']),catalog)],['ACHATS','STOCK']));
test('prerequisite removal blocked',()=>assert.deepEqual(dependents(new Set(['ACHATS','STOCK']),'STOCK',catalog),['ACHATS']));
test('dependency cycles terminate',()=>assert.equal(normalize(new Set(['A']),[{key:'A',required:['B']},{key:'B',required:['A']}]).size,2));
test('handoff contains choices, no client amount',()=>{const u=new URL(configurationUrl('https://keydy.invalid',{modules:['STOCK','ACHATS'],users:3,annual:true,revision:2}));assert.equal(u.pathname,'/souscription-keydy');assert.equal(u.searchParams.get('users'),'3');assert.equal(u.searchParams.get('modules'),'STOCK,ACHATS');assert.equal(u.searchParams.has('amount'),false);});
