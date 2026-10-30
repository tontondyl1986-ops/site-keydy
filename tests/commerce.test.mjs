import test from 'node:test';import assert from 'node:assert/strict';
import {normalize,dependents,configurationUrl,restoreSelection,contactConfigurationUrl,validateCycleComparison} from '../assets/js/commerce.mjs';
import {configurationRequest} from '../assets/js/contact-commerce.mjs';
const catalog=[{key:'STOCK',required:[]},{key:'ACHATS',required:['STOCK']},{key:'MOBILE',required:['PLANNING']},{key:'PLANNING',required:[]}];
test('dependencies selected, unknown modules ignored',()=>assert.deepEqual([...normalize(new Set(['ACHATS','UNKNOWN']),catalog)],['ACHATS','STOCK']));
test('prerequisite removal blocked',()=>assert.deepEqual(dependents(new Set(['ACHATS','STOCK']),'STOCK',catalog),['ACHATS']));
test('dependency cycles terminate',()=>assert.equal(normalize(new Set(['A']),[{key:'A',required:['B']},{key:'B',required:['A']}]).size,2));
test('handoff contains choices, no client amount',()=>{const u=new URL(configurationUrl('https://keydy.invalid',{modules:['STOCK','ACHATS'],users:3,annual:true,revision:2}));assert.equal(u.pathname,'/souscription-keydy');assert.equal(u.searchParams.get('users'),'3');assert.equal(u.searchParams.get('modules'),'STOCK,ACHATS');assert.equal(u.searchParams.has('amount'),false);});
test('handoff drops amounts, identity and arbitrary URL parameters',()=>{const u=new URL(configurationUrl('https://keydy.invalid',{users:4,email:'private@example.invalid',amount:1,returnUrl:'https://other.invalid',revision:3}));assert.deepEqual([...u.searchParams.keys()],['users','revision']);});
test('reload restores valid choices and their prerequisites',()=>{assert.deepEqual(restoreSelection(new URLSearchParams('modules=ACHATS,UNKNOWN&users=12&annual=true&vehicles=4'),catalog),{modules:['ACHATS','STOCK'],users:12,annual:true,assistedImport:false,vehicles:4,scanners:0});});
test('invalid and out of range URL quantities use defaults',()=>{assert.deepEqual(restoreSelection(new URLSearchParams('users=999&vehicles=-1&scanners=1.5&annual=yes'),catalog),{modules:[],users:3,annual:false,assistedImport:false,vehicles:0,scanners:0});});
test('modules under development are never restored or selected',()=>{assert.deepEqual([...normalize(['PREVIEW'],[{key:'PREVIEW',inDevelopment:true}])],[]);});

test('contact carries only intended choices, without amounts, personal details or a contractual revision',()=>{
  const url=new URL(contactConfigurationUrl('https://site.invalid/keydy/tarifs.html',{modules:['STOCK'],users:5,annual:true,vehicles:2,scanners:1,revision:42,email:'private@invalid.test',amount:1}));
  assert.equal(url.pathname,'/keydy/contact.html');assert.equal(url.searchParams.get('configuration'),'true');
  assert.deepEqual([...url.searchParams.keys()],['configuration','modules','users','annual','vehicles','scanners']);
});
const quote=(annual=false)=>({revision:3,monthlyHt:100,recurringHt:annual?1080:100,recurringVat:annual?226.8:21,recurringTtc:annual?1306.8:121,
  setupHt:500,setupVat:105,setupTtc:605,lines:[{code:'SOCLE',label:'Socle accepté pour la simulation',quantity:1,unitPrice:100}]});
test('cycle comparison retains the two server totals and confirms their common revision',()=>{
  const pair=validateCycleComparison(quote(),quote(true),3);assert.equal(pair.monthly.recurringTtc,121);assert.equal(pair.annual.recurringTtc,1306.8);
});
test('a partial, invalid or differently revised comparison never becomes a quote',()=>{
  assert.throws(()=>validateCycleComparison(quote(),{...quote(true),revision:4},3),/CATALOG_CHANGED/);
  assert.throws(()=>validateCycleComparison(quote(),quote(true),2),/CATALOG_CHANGED/);
  assert.throws(()=>validateCycleComparison(quote(),{...quote(true),recurringTtc:NaN},3),/INVALID_PREVIEW/);
  assert.throws(()=>validateCycleComparison(quote(),{...quote(true),monthlyHt:50},3),/INCONSISTENT/);
  assert.throws(()=>validateCycleComparison(quote(),{...quote(true),lines:[]},3),/INVALID_PREVIEW/);
});
test('contact text uses known catalogue labels and asks for confirmation rather than promising a sale',()=>{
  const selection=restoreSelection(new URLSearchParams('modules=ACHATS,UNKNOWN&users=5&annual=true'),catalog);
  const text=configurationRequest(selection,catalog.map(m=>({...m,label:m.key==='STOCK'?'Stock':'Achats'})));
  assert.match(text,/Utilisateurs : 5/);assert.match(text,/Cycle souhaité : annuel/);assert.match(text,/Achats, Stock/);
  assert.match(text,/aucun contrat ni paiement créé/);assert.doesNotMatch(text,/UNKNOWN|EUR|TTC/);
});

test('assistance remains an explicit option across reload, contact and subscription handoff',()=>{
  const selection=restoreSelection(new URLSearchParams('assistedImport=true&users=4'),catalog);assert.equal(selection.assistedImport,true);
  assert.equal(new URL(configurationUrl('https://keydy.invalid',selection)).searchParams.get('assistedImport'),'true');
  assert.equal(new URL(contactConfigurationUrl('https://site.invalid/tarifs.html',selection)).searchParams.get('assistedImport'),'true');
  assert.match(configurationRequest(selection,catalog),/option demandée/);
  assert.equal(restoreSelection(new URLSearchParams('assistedImport=yes'),catalog).assistedImport,false);
});
