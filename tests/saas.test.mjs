import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {products,comparison,productFor,contactUrl} from '../assets/js/saas-catalog.mjs';
import {initContactConfiguration} from '../assets/js/contact-commerce.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
test('four distinct offers have pages, existing logo variants and a safe contact destination',()=>{
  assert.equal(products.length,4);assert.equal(new Set(products.map(p=>p.key)).size,4);
  for(const p of products){assert.ok(existsSync(resolve(root,p.page)));assert.ok(existsSync(resolve(root,p.logo)));assert.equal(new URL(contactUrl(p.key),'https://example.invalid').searchParams.get('saas'),p.key);assert.ok(p.available.length&&p.planned.length);}
  for(const key of ['__proto__','<script>','https://evil.invalid','']){assert.equal(productFor(key),null);assert.throws(()=>contactUrl(key));}
});
test('new prices are explicitly unapproved, with no new checkout or fictional numerical prices',()=>{
  for(const p of products.filter(p=>p.key!=='techniques-speciales')){assert.equal(p.pricing,'Sur demande');assert.equal(p.stage,'Pilote sur demande');const html=read(p.page);assert.ok(html.includes('Sur demande'));assert.ok(!/souscription-keydy|\/api\/keydy\/checkout/.test(html));assert.ok(!/\b\d+[,.]?\d*\s*(?:€|EUR)/.test(html));}
  assert.ok(read('tarifs.html').includes('id="techniques-speciales"'));assert.ok(read('tarifs.html').includes('id="subscription-builder"'));
});
test('comparison covers all four products and marks stability and sales as future',()=>{
  comparison.forEach(r=>assert.equal(r.length,5));assert.match(comparison.find(r=>r[0]==='Calculs de stabilité')[1],/développer/);assert.equal(comparison.find(r=>r[0].startsWith('Biens'))[3],'En préparation');
});
test('all static local references resolve and sitemap names existing public pages',()=>{
  for(const page of readdirSync(root).filter(p=>p.endsWith('.html'))){
    const html=read(page);assert.ok(html.includes('lang="fr"'),page);
    for(const match of html.matchAll(/(?:href|src)="([^"?#]+)(?:[?#][^"]*)?"/g)){
      const target=match[1];if(/^(?:https?:|mailto:|tel:|data:|\/\/)/.test(target))continue;
      const file=resolve(root,decodeURIComponent(target.replace(/^\//,'')));
      assert.ok(existsSync(file),page+' -> '+target);
    }
  }
  const locations=[...read('sitemap.xml').matchAll(/<loc>https:\/\/(?:www\.)?keydy\.be\/([^<]*)<\/loc>/g)];
  assert.ok(locations.length>=products.length+3,'Public sitemap must contain the offer pages');
  assert.equal(new Set(locations.map(loc=>loc[1])).size,locations.length,'No duplicate sitemap URL');
  for(const loc of locations)assert.ok(existsSync(resolve(root,loc[1]||'index.html')));
});
test('a new SaaS contact never requests or imports a technical configuration',async()=>{
  let fetched=false;
  const document={defaultView:{location:{href:'https://example.invalid/contact.html?saas=etudes&configuration=true&modules=STOCK'}},querySelector:()=>({})};
  await initContactConfiguration(document,()=>{fetched=true;throw Error('must not fetch');});assert.equal(fetched,false);
});
