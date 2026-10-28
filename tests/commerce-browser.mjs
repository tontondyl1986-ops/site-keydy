import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KEYDY_PLAYWRIGHT_MODULE||'playwright');
const base=new URL(process.env.KEYDY_SITE_TEST_URL||'http://127.0.0.1:18745');
assert.ok(['127.0.0.1','localhost'].includes(base.hostname),'Only a local static test server is allowed');
const out=process.env.KEYDY_SITE_SCREENSHOTS||'site-smoke-output';await mkdir(out,{recursive:true});
const catalog={revision:1,subscriptionsOpen:true,vatPercent:21,configuration:{prices:{SOCLE_1:100,USERS:20,STOCK:30,FOURNISSEURS:15},annualDiscount:20,includedUsers:0,moduleRules:{}},
  modules:[{key:'STOCK',label:'Stock & articles',required:[]},{key:'FOURNISSEURS',label:'Achats & fournisseurs',required:['STOCK']}]};
const browser=await chromium.launch({headless:true,...(process.env.KEYDY_BROWSER_CHANNEL?{channel:process.env.KEYDY_BROWSER_CHANNEL}:{})});
const results=[];
async function intercept(context,mode={}){
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===base.origin)return route.continue();
    if(url.origin==='https://keydy.be' && url.pathname==='/api/keydy/catalog'){
      const data={...catalog};if(mode.closed)data.subscriptionsOpen=false;if(mode.legacy)delete data.subscriptionsOpen;
      return route.fulfill({status:mode.offline?503:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
    }
    if(url.origin==='https://keydy.be' && url.pathname==='/api/keydy/preview'){
      const users=Number(url.searchParams.get('users')),annual=url.searchParams.get('annual')==='true';
      if(mode.error&&users===4)return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},body:'unavailable'});
      const modules=(url.searchParams.get('modules')||'').split(',').filter(Boolean);
      const lines=[{code:'SOCLE',label:'Socle Keydy',quantity:1,unitPrice:100},{code:'USERS',label:'Utilisateurs',quantity:users,unitPrice:20},...modules.map(key=>({code:key,label:catalog.modules.find(m=>m.key===key).label,quantity:1,unitPrice:catalog.configuration.prices[key]}))];
      const monthlyHt=lines.reduce((s,c)=>s+c.quantity*c.unitPrice,0),recurringHt=Math.round(monthlyHt*(annual?12*.8:1)*100)/100;
      const recurringVat=Math.round(recurringHt*.21*100)/100;
      if(mode.race&&users===4)await new Promise(r=>setTimeout(r,700));
      return route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({revision:1,monthlyHt,lines,recurringHt,recurringVat,recurringTtc:Math.round((recurringHt+recurringVat)*100)/100,setupHt:500,setupVat:105,setupTtc:605})});
    }
    if(url.origin==='https://keydy.be' && url.pathname==='/souscription-keydy')
      return route.fulfill({contentType:'text/html',body:'<html lang="fr"><title>Reprise fictive</title><h1>Choix transmis au serveur fictif</h1></html>'});
    // All real external services, including Keydy production, are blocked.
    return route.abort();
  });
}
async function localPage(mode={},width=390){const context=await browser.newContext({viewport:{width,height:900}});await intercept(context,mode);const page=await context.newPage();await page.goto(new URL('tarifs.html',base).href);return {context,page};}
try{
  for(const [label,width,height] of [['mobile',390,844],['tablet',800,1024],['desktop',1280,900]]){
    const context=await browser.newContext({viewport:{width,height}});await intercept(context);
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(new URL('tarifs.html',base).href);await page.locator('#continue:enabled').waitFor();
    await page.locator('input[value="FOURNISSEURS"]').check();await page.locator('#continue:enabled').waitFor();
    assert.equal(await page.locator('input[value="STOCK"]').isChecked(),true);
    await page.locator('input[value="STOCK"]').click();assert.equal(await page.locator('input[value="STOCK"]').isChecked(),true);
    await page.locator('#annual').check();await page.locator('#continue:enabled').waitFor();
    const text=await page.locator('#price-summary').innerText();assert.ok(text.includes('Socle Keydy'));assert.ok(text.includes('Utilisateurs'));assert.ok(text.includes('HTVA'));assert.ok(text.includes('TTC'));
    await page.reload();await page.locator('#continue:enabled').waitFor();assert.equal(await page.locator('input[value="FOURNISSEURS"]').isChecked(),true);assert.equal(await page.locator('#annual').isChecked(),true);
    await page.locator('#module-search').fill('impossible');assert.equal(await page.locator('.module-choice:visible').count(),0);assert.match(await page.locator('#search-result').innerText(),/Aucun module/);
    await page.locator('#module-search').fill('');assert.equal(await page.locator('.module-choice:visible').count(),2);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,label+' must not overflow horizontally');
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,'saas-site-'+label+'.png'),fullPage:true});
    await page.locator('#continue').click();await page.waitForURL('https://keydy.be/souscription-keydy?**');
    const target=new URL(page.url());assert.equal(target.searchParams.get('users'),'3');assert.equal(target.searchParams.get('annual'),'true');assert.equal(target.searchParams.has('amount'),false);assert.deepEqual(errors,[]);
    results.push({label,width,height,dependencies:true,restore:true,search:true,itemizedPrices:true,handoff:true,horizontalOverflow:false});
    await page.goto(new URL('index.html',base).href);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'home '+label+' overflow');
    await page.screenshot({path:path.join(out,'home-'+label+'.png'),fullPage:true});
    if(width===390){await page.locator('.nav-toggle').click();assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');}
    await context.close();
  }
  for(const mode of [{closed:true},{legacy:true}]){const {context,page}=await localPage(mode);await page.locator('.summary-total').waitFor();assert.equal(await page.locator('#continue').isDisabled(),true);assert.match(await page.locator('#sales-availability').innerText(),/Ouverture commerciale/);await page.locator('#users').fill('5');await page.locator('.summary-total').waitFor();assert.equal(await page.locator('#continue').isDisabled(),true);results.push({label:mode.closed?'closed-commerce':'legacy-catalog',previewAvailable:true,blocksSubmission:true});await context.close();}
  {const {context,page}=await localPage({offline:true});await page.locator('#catalog-status.error').waitFor();assert.equal(await page.locator('#subscription-builder').isVisible(),false);results.push({label:'unavailable-catalog',blocksSubmission:true});await context.close();}
  {const {context,page}=await localPage({error:true});await page.locator('#continue:enabled').waitFor();await page.locator('#users').fill('4');await page.locator('#catalog-status.error').waitFor();assert.equal(await page.locator('.summary-total').count(),0);assert.equal(await page.locator('#continue').isDisabled(),true);await page.locator('#users').fill('3');await page.locator('#retry-price').click();await page.locator('#continue:enabled').waitFor();await page.locator('#users').fill('0');await page.locator('#catalog-status.error').waitFor();assert.equal(await page.locator('.summary-total').count(),0);results.push({label:'invalid-and-failed-preview',clearsStalePrice:true,recovery:true});await context.close();}
  {const {context,page}=await localPage({race:true});await page.locator('#continue:enabled').waitFor();await page.locator('#users').fill('4');await page.locator('#users').fill('5');await page.locator('#continue:enabled').waitFor();await page.waitForTimeout(900);assert.match(await page.locator('#price-summary').innerText(),/242/);assert.equal(new URL(page.url()).searchParams.get('users'),'5');results.push({label:'out-of-order-previews',latestSelectionWins:true});await context.close();}
  await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
