import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {products} from '../assets/js/saas-catalog.mjs';
const base=new URL(process.env.KEYDY_SITE_TEST_URL||'http://127.0.0.1:18745');
assert.ok(['127.0.0.1','localhost'].includes(base.hostname));
const out=process.env.KEYDY_SITE_SCREENSHOTS||'site-smoke-output';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.KEYDY_BROWSER_CHANNEL?{channel:process.env.KEYDY_BROWSER_CHANNEL}:{})});
const results=[];
try{
  for(const width of [390,800,1280]){
    const context=await browser.newContext({viewport:{width,height:900}});const external=[];
    await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===base.origin)return route.continue();
      // The optional anonymous audience configuration is separate from ERP commerce.
      if(u.origin==='https://keydy.be'&&u.pathname==='/public/site-statistics/config')return route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({schema:1,enabled:false,retentionDays:30})});
      external.push(u.href);return route.abort();});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const name of ['index.html','logiciels.html','modules.html',...products.map(p=>p.page)]){
      const response=await page.goto(new URL(name,base).href);assert.equal(response.status(),200);
      await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
      const geometry=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.tagName+'.'+e.className)}));
      assert.equal(await page.locator('h1').count(),1,name);assert.ok(geometry.width<=geometry.viewport+1,name+' overflow '+JSON.stringify(geometry));
      assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true,name+' logo');
      if(['index.html','modules.html','logiciel-etudes-architecture.html'].includes(name))await page.screenshot({path:`${out}/family-${name.replace('.html','')}-${width}.png`,fullPage:true});
    }
    for(const p of products.filter(p=>p.key!=='techniques-speciales')){
      await page.goto(new URL(p.page,base).href);await page.locator('.product-actions a').first().click();
      await page.waitForURL('**/contact.html?**');
      await page.waitForFunction(key=>document.querySelector('[name=saas]')?.value===key,p.key);
      assert.equal(await page.locator('[name=saas]').inputValue(),p.key);assert.equal(await page.locator('[name=configuration]').inputValue(),'');assert.equal(await page.locator('#contact-configuration-summary').isVisible(),false);assert.match(await page.locator('[data-contact-title]').innerText(),new RegExp(p.name));
    }
    await page.goto(new URL('contact.html?saas=etudes&configuration=true&modules=STOCK',base).href);
    assert.equal(await page.locator('[name=configuration]').inputValue(),'');assert.equal(await page.locator('[type=submit]').isEnabled(),true);
    await page.locator('[name=saas]').selectOption('promotion');assert.match(await page.locator('[data-contact-title]').innerText(),/Promotion/);
    await page.locator('[name=saas]').selectOption('techniques-speciales');assert.match(await page.locator('[data-contact-title]').innerText(),/Techniques spéciales/);
    await page.goto(new URL('contact.html?saas=%3Cscript%3Ealert(1)%3C/script%3E',base).href);assert.equal(await page.locator('[name=saas]').inputValue(),'');
    assert.ok(!external.some(u=>new URL(u).hostname==='keydy.be'),'New pilots must not request ERP commerce');assert.deepEqual(errors,[]);
    results.push({width,pages:7,logos:true,overflow:false,contactOrientation:true,noErpRequest:true,noMailSent:true});await context.close();
  }
  {
    let release;const gate=new Promise(r=>release=r);let catalogs=0;
    const context=await browser.newContext();await context.route('**/*',async route=>{
      const u=new URL(route.request().url());if(u.origin===base.origin)return route.continue();
      if(u.origin==='https://keydy.be'&&u.pathname==='/api/keydy/catalog'){
        catalogs++;await gate;return route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({modules:[{key:'STOCK',label:'Stock',required:[]}]})});
      }return route.abort();
    });
    const page=await context.newPage();await page.goto(new URL('contact.html?configuration=true&modules=STOCK',base).href);
    await page.locator('[name=saas]').selectOption('promotion');release();
    await page.locator('[type=submit]:enabled').waitFor();assert.equal(catalogs,1);
    assert.equal(await page.locator('[name=configuration]').inputValue(),'');assert.equal(await page.locator('#contact-configuration-summary').isVisible(),false);assert.match(await page.locator('[data-contact-title]').innerText(),/Promotion/);
    results.push({label:'late-technical-catalog-after-product-change',keepsNewSaas:true,noTechnicalSelection:true});await context.close();
  }
  await writeFile(`${out}/family-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
