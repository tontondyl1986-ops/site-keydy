import assert from 'node:assert/strict';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.KEYDY_SITE_TEST_URL || 'http://127.0.0.1:18745');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const output = process.env.KEYDY_SITE_SCREENSHOTS || 'site-smoke-output';
const channel = process.env.KEYDY_BROWSER_CHANNEL;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const root = new URL('../', import.meta.url);
const pages = (await readdir(root)).filter(file => file.endsWith('.html'));
await mkdir(output, { recursive: true });

function navigation(page) {
  return page.getByRole('navigation', { name: 'Navigation principale' });
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 950 }, reducedMotion: 'reduce' });
  const page = await desktop.newPage();
  await desktop.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const file of pages) {
    assert.ok((await page.goto(new URL(file, base).href)).ok(), file);
    const nav = navigation(page);
    assert.equal(await nav.getByRole('link', { name: 'Accueil', exact: true }).getAttribute('href'), 'index.html');
    assert.equal(await nav.getByRole('link', { name: 'À propos', exact: true }).getAttribute('href'), 'a-propos.html');
    assert.equal(await nav.getByRole('link', { name: 'Démo Keydy Suite', exact: true }).getAttribute('href'), 'contact.html');
    assert.equal(await nav.getByRole('link', { name: 'Connexion', exact: true }).getAttribute('href'), 'https://keydy.be/login');
    await nav.locator('summary').click();
    for (const name of ['Tous les produits', 'Keydy Suite', 'Keydy Time', 'Keydy Wallet']) {
      assert.ok(await nav.getByRole('link', { name, exact: true }).isVisible(), file + ' › ' + name);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), file);
  }
  for (const file of ['index.html', 'produits.html', 'a-propos.html', 'contact.html']) {
    await page.goto(new URL(file, base).href);
    await page.screenshot({ path: join(output, file.replace('.html', '-desktop.png')), fullPage: true });
  }
  for (const [product, destination] of [['wallet','keydy-wallet.html#offres'], ['time','keydy-time.html#offres']]) {
    await page.goto(new URL('contact.html?produit='+product, base).href);
    await page.waitForURL(new URL(destination, base).href);
    assert.equal(await page.locator('[data-demo-form]').count(),0);
    assert.equal(await page.locator('main a[href*="subject=Keydy%20"]').count(),0);
  }
  await page.goto(new URL('contact.html?produit=batiment', base).href);
  const product=page.locator('select[name=produit]');
  assert.equal(await product.inputValue(),'suite');
  assert.equal(await product.locator('option[value=time], option[value=wallet]').count(),0);
  for(const value of ['batiment','etudes-architecture','promotion']) {
    const future=product.locator('option[value="'+value+'"]');
    assert.equal(await future.evaluate(option => option.disabled),true);
    assert.match(await future.textContent(),/en développement/);
  }
  await page.locator('input[name=nom]').fill('Compte de recette');
  await page.locator('input[name=email]').fill('demo@example.invalid');
  await page.locator('textarea[name=besoin]').fill('Je souhaite voir le planning des techniciens.');
  await page.getByRole('button', { name: 'Préparer mon e-mail' }).click();
  assert.ok(await page.locator('[data-mail-copy]').isVisible());
  const prepared = await page.locator('#demande-a-copier').inputValue();
  assert.match(prepared, /Objet : Une démonstration · Keydy Suite/);
  assert.match(prepared, /Je souhaite voir le planning des techniciens/);
  await page.goto(new URL('contact.html?produit=suite&demande=devis', base).href);
  assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'Demander un devis');
  assert.equal(await page.locator('select[name=demande]').inputValue(), 'devis');
  assert.deepEqual(errors, []);
  await desktop.close();

  for (const width of [375, 820]) {
    const mobile = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const page = await mobile.newPage();
    for (const file of ['index.html','produits.html','a-propos.html','contact.html','keydy-suite.html','keydy-time.html','keydy-wallet.html']) {
      await page.goto(new URL(file, base).href);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), file + ' ' + width);
      if (file === 'index.html' && width === 375) {
        await page.screenshot({ path: join(output, 'home-mobile.png'), fullPage: true });
      }
    }
    if (width === 375) {
      const menu = page.getByRole('button', { name: 'Menu principal' });
      await menu.click();
      await navigation(page).locator('summary').click();
      await navigation(page).getByRole('link', { name: 'Keydy Time', exact: true }).click();
      assert.equal(new URL(page.url()).pathname, '/keydy-time.html');
      await menu.click();
      await navigation(page).locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.ok(await navigation(page).getByRole('link', { name: 'Keydy Wallet', exact: true }).isVisible());
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      assert.ok(await menu.evaluate(button => button === document.activeElement));
    }
    await mobile.close();
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });
  const staticPage = await noScript.newPage();
  await staticPage.goto(new URL('produits.html', base).href);
  await navigation(staticPage).locator('summary').click();
  await navigation(staticPage).getByRole('link', { name: 'Keydy Wallet', exact: true }).click();
  assert.equal(new URL(staticPage.url()).pathname, '/keydy-wallet.html');
  await noScript.close();
  console.log('Navigation validée sur ' + pages.length + ' pages, avec ordinateur, mobile, clavier et JavaScript désactivé. Démo et devis vérifiés localement.');
} finally {
  await browser.close();
}
