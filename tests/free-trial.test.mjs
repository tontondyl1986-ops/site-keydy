import test from 'node:test';import assert from 'node:assert/strict';
import {trialAvailable,trialConfigurationUrl} from '../assets/js/free-trial.mjs';
const catalog={freeTrialDays:30,freeTrialAvailable:true,freeTrialUrl:'/essai-gratuit',subscriptionsOpen:true,modules:[{key:'PLANNING',required:[]},{key:'MOBILE',required:['PLANNING']},{key:'CAD',inDevelopment:true}]};
test('an older backend never opens an unavailable trial link',()=>{assert.equal(trialAvailable({subscriptionsOpen:true,modules:[]}),false);assert.equal(trialAvailable(catalog),true);});
test('a closed sale also closes new free registrations',()=>assert.equal(trialAvailable({...catalog,subscriptionsOpen:false}),false));
test('a changed destination or duration is not advertised as the 30 day offer',()=>{assert.equal(trialAvailable({...catalog,freeTrialDays:7}),false);assert.equal(trialAvailable({...catalog,freeTrialUrl:'https://elsewhere.invalid'}),false);});
test('trial handoff keeps available modules and dependencies without payment parameters',()=>{const u=new URL(trialConfigurationUrl('https://keydy.invalid',['MOBILE','CAD','UNKNOWN'],catalog));assert.equal(u.pathname,'/essai-gratuit');assert.equal(u.searchParams.get('modules'),'MOBILE,PLANNING');assert.deepEqual([...u.searchParams.keys()],['modules']);});
test('script URLs cannot be used as a handoff base',()=>assert.throws(()=>trialConfigurationUrl('javascript:alert(1)',[],catalog)));
