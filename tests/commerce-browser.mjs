import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KEYDY_PLAYWRIGHT_MODULE||'playwright');
const base=new URL(process.env.KEYDY_SITE_TEST_URL||'http://127.0.0.1:18745');
assert.ok(['127.0.0.1','localhost'].includes(base.hostname),'Only a local static test server is allowed');
const out=process.env.KEYDY_SITE_SCREENSHOTS||'site-smoke-output';await mkdir(out,{recursive:true});
const catalog={revision:1,vatPercent:21,configuration:{prices:{SOCLE_1:100,USERS:20,STOCK:30,FOURNISSEURS:15},annualDiscount:20,includedUsers:0,moduleRules:{}},
  modules:[{key:'STOCK',label:'Stock & articles',required:[]},{key:'FOURNISSEURS',label:'Achats & fournisseurs',required:['STOCK']}]};
const browser=await chromium.launch({headless:true,...(process.env.KEYDY_BROWSER_CHANNEL?{channel:process.env.KEYDY_BROWSER_CHANNEL}:{})});
const results=[];
async function intercept(context,offline=false){
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===base.origin)return route.continue();
    if(url.origin==='https://keydy.be' && url.pathname==='/api/keydy/catalog')
      return route.fulfill({status:offline?503:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(catalog)});
    if(url.origin==='https://keydy.be' && url.pathname==='/api/keydy/preview'){
      const users=Number(url.searchParams.get('users')),annual=url.searchParams.get('annual')==='true';
      const modules=(url.searchParams.get('modules')||'').split(',').filter(Boolean);
      const monthly=100+users*20+modules.reduce((sum,m)=>sum+catalog.configuration.prices[m],0);
      const recurringHt=Math.round(monthly*(annual?12*.8:1)*100)/100;
      const recurringVat=Math.round(recurringHt*.21*100)/100;
      return route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({revision:1,recurringHt,recurringVat,recurringTtc:Math.round((recurringHt+recurringVat)*100)/100,setupHt:500,setupVat:105,setupTtc:605})});
    }
    if(url.origin==='https://keydy.be' && url.pathname==='/souscription-keydy')
      return route.fulfill({contentType:'text/html',body:'<html lang="fr"><title>Reprise fictive</title><h1>Choix transmis au serveur fictif</h1></html>'});
    // No request reaches a real provider, analytics endpoint, font service or Keydy production.
    return route.abort();
  });
}
try{
  for(const [label,width,height] of [['mobile',390,844],['tablet',800,1024],['desktop',1280,900]]){
    const context=await browser.newContext({viewport:{width,height}});await intercept(context);
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(new URL('tarifs.html',base).href);
    await page.locator('#continue:enabled').waitFor();
    await page.locator('input[value="FOURNISSEURS"]').check();
    await page.locator('#continue:enabled').waitFor();
    assert.equal(await page.locator('input[value="STOCK"]').isChecked(),true);
    await page.locator('input[value="STOCK"]').click();
    assert.equal(await page.locator('input[value="STOCK"]').isChecked(),true);
    await page.locator('#annual').check();await page.locator('#continue:enabled').waitFor();
    const text=await page.locator('#price-summary').innerText();assert.ok(text.includes('HTVA'));assert.ok(text.includes('TTC'));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false,label+' must not overflow horizontally');
    await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'saas-site-'+label+'.png'),fullPage:true});
    await page.locator('#continue').click();await page.waitForURL('https://keydy.be/souscription-keydy?**');
    const target=new URL(page.url());assert.equal(target.searchParams.get('users'),'3');assert.equal(target.searchParams.get('annual'),'true');
    assert.equal(target.searchParams.has('amount'),false);assert.deepEqual(errors,[]);
    results.push({label,width,height,dependencies:true,handoff:true,horizontalOverflow:false});await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844}});await intercept(context,true);
  const page=await context.newPage();await page.goto(new URL('tarifs.html',base).href);await page.locator('#catalog-status.error').waitFor();
  assert.equal(await page.locator('#continue').isDisabled(),true);assert.equal(await page.locator('#subscription-builder').isVisible(),false);
  results.push({label:'unavailable-catalog',blocksSubmission:true});await context.close();
  await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
