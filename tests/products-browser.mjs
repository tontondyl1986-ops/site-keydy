import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.KEYDY_SITE_TEST_URL || 'http://127.0.0.1:18745');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));

const output = process.env.KEYDY_SITE_SCREENSHOTS || 'site-smoke-output';
await mkdir(output, { recursive: true });
const channel = process.env.KEYDY_BROWSER_CHANNEL;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const checks = [];
const errors = [];
const monthlyPrices = ['3,99 €', '4,99 €', '8,99 €'];
const annualPrices = ['3,99 €', '49,90 €', '89,90 €'];
const localCheckout = 'https://wallet.keydy.be/wallet/?offre=local';
const cloudOffers = [
  ['personal', 'personnel', 'monthly', 'mensuel', '4,99 €'],
  ['personal', 'personnel', 'annual', 'annuel', '49,90 €'],
  ['family', 'famille', 'monthly', 'mensuel', '8,99 €'],
  ['family', 'famille', 'annual', 'annuel', '89,90 €']
];
const cloudCheckout = (offer, cycle) => `https://wallet.keydy.be/wallet/?offre=${offer}&cycle=${cycle}`;
const checkoutLinks = new Set([localCheckout, ...cloudOffers.map(([, offer,, cycle]) => cloudCheckout(offer, cycle))]);

async function checkLocalLinks(page) {
  const hrefs = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  const destinations = new Set();
  for (const href of hrefs) {
    if (href === 'https://keydy.be/login' || checkoutLinks.has(href)) continue;
    if (href.startsWith('mailto:')) {
      assert.match(href, /^mailto:info@keydy\.be(?:\?subject=|$)/);
      continue;
    }
    const url = new URL(href, page.url());
    assert.equal(url.origin, base.origin, href);
    if (href.startsWith('#')) {
      assert.equal(await page.locator(href).count(), 1, href);
      continue;
    }
    url.hash = '';
    destinations.add(url.href);
  }
  for (const destination of destinations) {
    const response = await page.request.get(destination);
    assert.ok(response.ok(), destination);
  }
}

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 920 },
    tablet: { width: 820, height: 1180 },
    mobile: { width: 375, height: 800 }
  })) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      const origin = new URL(route.request().url()).origin;
      return origin === base.origin ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(new URL('/keydy-wallet.html', base).href);
    assert.equal(await page.locator('[data-site-header] [aria-current="page"]').textContent(), 'Keydy Wallet');
    assert.deepEqual(await page.locator('.product-plan h3').allTextContents(), ['Local', 'Personnel Cloud', 'Famille Cloud']);
    const pricingColumns = await page.locator('.product-pricing-grid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    assert.equal(pricingColumns, name === 'mobile' ? 1 : 3);
    const visiblePrices = page.locator('.product-price:visible strong');
    assert.deepEqual(await visiblePrices.allTextContents(), monthlyPrices);
    await page.getByRole('radio', { name: 'Mensuel' }).focus();
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await visiblePrices.allTextContents(), annualPrices);
    assert.match(await page.locator('[data-wallet-sales-status]').innerText(), /disponible à l’achat.*abonnements Cloud disponibles/);
    assert.equal(await page.getByRole('link', { name: 'Acheter Wallet Local' }).getAttribute('href'), localCheckout);
    assert.equal(await page.locator('.product-plan-purchase:visible').count(), 3);
    assert.match(await page.getByText('Achat unique à 3,99 € TTC sur keydy.be.', { exact: false }).innerText(), /hors connexion/);
    const previews = page.locator('.product-preview img');
    assert.equal(await previews.count(), 2);
    for (const preview of await previews.all()) {
      await preview.scrollIntoViewIfNeeded();
      await preview.evaluate(image => image.decode());
      assert.ok((await preview.getAttribute('alt')).length > 0);
    }
    assert.equal(await page.locator('.product-preview figcaption').filter({ hasText: /démonstration|fictif/ }).count(), 2);
    await checkLocalLinks(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => {
      document.activeElement.blur();
      scrollTo(0, 0);
    });
    await page.screenshot({ path: path.join(output, 'wallet-' + name + '.png'), fullPage: true });
    if (name === 'mobile') {
      await page.evaluate(() => scrollTo(0, 0));
      const menu = page.getByRole('button', { name: 'Menu principal' });
      await menu.focus();
      await page.keyboard.press('Enter');
      assert.equal(await menu.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      assert.equal(await menu.evaluate(button => button === document.activeElement), true);
    }
    const question = page.locator('main summary').first();
    await question.focus();
    await page.keyboard.press('Enter');
    assert.equal(await question.evaluate(summary => summary.parentElement.open), true);

    await page.goto(new URL('/keydy-time.html', base).href);
    assert.equal(await page.locator('[data-site-header] [aria-current="page"]').textContent(), 'Keydy Time');
    assert.match(await page.locator('.product-status').innerText(), /distribution publique et tarifs en préparation/i);
    assert.ok(await page.locator('.product-device img').evaluate(image => image.complete && image.naturalWidth > 0));
    await checkLocalLinks(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: path.join(output, 'time-' + name + '.png'), fullPage: true });
    await context.close();
    checks.push(name + ': offres, navigation, achat Wallet Local et rendu des deux produits');
  }

  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  await staticPage.goto(new URL('/keydy-wallet.html', base).href);
  assert.deepEqual(await staticPage.locator('.product-price:visible strong').allTextContents(), ['3,99 €', '4,99 €', '49,90 €', '8,99 €', '89,90 €']);
  assert.equal(await staticPage.locator('[data-billing-control]').isVisible(), false);
  assert.equal(await staticPage.locator('.product-plan-purchase:visible').count(), 0);
  await noScript.close();
  checks.push('Tarifs disponibles sans JavaScript');

  const directContext = await browser.newContext({ viewport: { width: 375, height: 800 } });
  await directContext.route('**/*', route => {
    const origin = new URL(route.request().url()).origin;
    return origin === base.origin ? route.continue() : route.abort();
  });
  const direct = await directContext.newPage();
  direct.on('pageerror', error => errors.push(error.message));
  for (const query of ['offre=local', 'offre=personnel&cycle=annuel', 'offre=famille&cycle=mensuel']) {
    await direct.goto(new URL('/keydy-wallet.html?' + query, base).href);
    assert.equal(await direct.locator('.product-plan-purchase:visible').count(), 3, query);
    assert.equal(await direct.getByRole('link', { name: 'Acheter Wallet Local' }).getAttribute('href'), localCheckout);
  }
  for (const [edition, offer, period, cycle, amount] of cloudOffers) {
    await direct.locator(`[data-billing-control] input[value="${period}"]`).check();
    const purchase = direct.locator(`[data-wallet-cloud-purchase="${edition}"]`);
    const link = purchase.locator('a');
    await link.waitFor({ state: 'visible' });
    assert.equal(await link.getAttribute('href'), cloudCheckout(offer, cycle));
    assert.equal(await purchase.locator('..').locator('.product-price:visible strong').innerText(), amount);
  }
  await directContext.close();
  checks.push('Achat Wallet Local ouvert, liens et montants Cloud vérifiés pour chaque période');

  const homeContext = await browser.newContext({ viewport: { width: 1181, height: 800 } });
  await homeContext.route('**/*', route => {
    const origin = new URL(route.request().url()).origin;
    return origin === base.origin ? route.continue() : route.abort();
  });
  const home = await homeContext.newPage();
  await home.goto(base.href);
  assert.ok(await home.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.equal(await home.locator('main #applications-independantes a[href="keydy-wallet.html"]').count(), 1);
  assert.equal(await home.locator('main #applications-independantes a[href="keydy-time.html"]').count(), 1);
  const sitemap = await home.request.get(new URL('/sitemap.xml', base).href);
  const xml = await sitemap.text();
  for (const slug of ['keydy-wallet.html', 'keydy-time.html']) {
    assert.ok(xml.includes('<loc>https://www.keydy.be/' + slug + '</loc>'));
  }
  await home.goto(new URL('/produits.html', base).href);
  const walletSummary = await home.locator('.products-wallet dl').innerText();
  assert.match(walletSummary, /Abonnements Personnel ou Famille/);
  assert.doesNotMatch(walletSummary, /Découverte/);
  await homeContext.close();
  checks.push('Accueil, liens vers les deux produits et sitemap');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'products-browser.json'), JSON.stringify({ passed: true, checks }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }));
} finally {
  await browser.close();
}
