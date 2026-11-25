import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require(process.env.KEYDY_PLAYWRIGHT_MODULE||'playwright');
const base=new URL(process.env.KEYDY_SITE_TEST_URL||'http://127.0.0.1:18745');assert.ok(['127.0.0.1','localhost'].includes(base.hostname));
const out=process.env.KEYDY_SITE_SCREENSHOTS||'site-smoke-output';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.KEYDY_BROWSER_CHANNEL?{channel:process.env.KEYDY_BROWSER_CHANNEL}:{})});
const checks=[],errors=[];
const catalog={revision:1,subscriptionsOpen:true,freeTrialDays:30,freeTrialAvailable:true,freeTrialUrl:'/essai-gratuit',recurringPaymentRequired:true,subscriptionFlow:'SELF_SERVICE_V1',selfImportIncluded:true,assistedImportHt:1500,vatPercent:21,
 configuration:{prices:{SOCLE_1:100,USERS:20,STOCK:30,FOURNISSEURS:15},annualDiscount:20,includedUsers:0,moduleRules:{}},modules:[{key:'STOCK',label:'Stock & articles',required:[]},{key:'FOURNISSEURS',label:'Achats & fournisseurs',required:['STOCK']}]};
async function context(mode={}) {
 const c=await browser.newContext({viewport:mode.mobile?{width:390,height:844}:{width:1440,height:1000}});
 await c.route('**/*',async r=>{
  const u=new URL(r.request().url());if(u.origin===base.origin)return r.continue();
  if(u.origin==='https://keydy.be'&&u.pathname==='/api/keydy/catalog'){
   const data={...catalog};if(mode.old)delete data.freeTrialDays;if(mode.closed)data.subscriptionsOpen=false;
   return r.fulfill({status:mode.offline?503:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
  }
  if(u.origin==='https://keydy.be'&&u.pathname==='/api/keydy/preview'){
   const users=Number(u.searchParams.get('users')),annual=u.searchParams.get('annual')==='true',selected=(u.searchParams.get('modules')||'').split(',').filter(Boolean);
   const lines=[{code:'SOCLE',label:'Socle',quantity:1,unitPrice:100},{code:'USERS',label:'Utilisateurs',quantity:users,unitPrice:20},...selected.map(key=>({code:key,label:key,quantity:1,unitPrice:catalog.configuration.prices[key]}))];
   const monthlyHt=lines.reduce((sum,c)=>sum+c.quantity*c.unitPrice,0),recurringHt=monthlyHt*(annual?9.6:1),recurringVat=recurringHt*.21,setupHt=u.searchParams.get('assistedImport')==='true'?1500:0;
   return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({revision:1,lines,monthlyHt,recurringHt,recurringVat,recurringTtc:recurringHt+recurringVat,setupHt,setupVat:setupHt*.21,setupTtc:setupHt*1.21})});
  }
  return r.abort();
 });
 const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));return {c,page};
}
try {
 for(const mobile of [false,true]){
  const {c,page}=await context({mobile});await page.goto(new URL('/essai-gratuit.html?modules=FOURNISSEURS,CAD,UNKNOWN',base).href);
  await page.locator('[data-start-trial][href]').waitFor();
  const link=new URL(await page.locator('[data-start-trial]').getAttribute('href'));assert.equal(link.pathname,'/essai-gratuit');assert.equal(link.searchParams.get('modules'),'FOURNISSEURS,STOCK');
  assert.match(await page.locator('#fin-essai').innerText(),/sans délai supplémentaire/);assert.match(await page.locator('#fin-essai').innerText(),/facultatif/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,mobile?'trial-mobile.png':'trial-desktop.png'),fullPage:true});checks.push(mobile?'Mobile offer and no overflow':'Desktop offer, module handoff and exact expiry disclosure');await c.close();
 }
 for(const mode of [{old:true},{closed:true},{offline:true}]){
  const {c,page}=await context(mode);await page.goto(new URL('/essai-gratuit.html',base).href);await page.waitForFunction(()=>!document.querySelector('[data-trial-status]').textContent.startsWith('Vérification'));
  assert.equal(await page.locator('[data-start-trial]').getAttribute('href'),null);assert.equal(await page.locator('[data-start-trial]').getAttribute('aria-disabled'),'true');checks.push('Unavailable handoff blocked: '+JSON.stringify(mode));await c.close();
 }
 {const {c,page}=await context();await page.goto(new URL('/tarifs.html?modules=FOURNISSEURS&users=20&annual=true',base).href);await page.locator('#continue:enabled').waitFor();await page.locator('[data-start-trial][href]').waitFor();const link=new URL(await page.locator('[data-start-trial]').getAttribute('href'));assert.deepEqual(link.searchParams.get('modules').split(',').sort(),['FOURNISSEURS','STOCK']);assert.deepEqual([...link.searchParams.keys()],['modules']);checks.push('Configurator trial carries modules without paid quantities or payment consent');await c.close();}
 {const {c,page}=await context();await page.goto(base.href);assert.equal(await page.locator('footer a[href="essai-gratuit.html"]').count(),1);assert.equal(await page.locator('main a[href="essai-gratuit.html"]').count(),0);checks.push('Trial help remains discoverable through the shared footer');await c.close();}
 assert.deepEqual(errors,[]);checks.push('No browser JavaScript errors');
 await writeFile(path.join(out,'free-trial-browser.json'),JSON.stringify({passed:true,syntheticOnly:true,checks},null,2));console.log(JSON.stringify({passed:true,checks}));
}finally{await browser.close();}
