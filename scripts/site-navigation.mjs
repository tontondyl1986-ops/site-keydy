const products = [
  ['produits.html', 'Tous les produits'],
  ['keydy-suite.html', 'Keydy Suite'],
  ['keydy-time.html', 'Keydy Time'],
  ['keydy-wallet.html', 'Keydy Wallet']
];

const login = 'https://keydy.be/login';

function pagePaths(page) {
  const parts = page.replaceAll('\\', '/').split('/').filter(Boolean);
  const prefix = '../'.repeat(Math.max(0, parts.length - 1));
  const current = parts.join('/') || 'index.html';
  const href = target => target.startsWith('https://') || target.startsWith('mailto:') ? target : prefix + target;
  return {current, href};
}

export function renderSiteHeader(page = 'index.html') {
  const {current, href} = pagePaths(page);
  const link = (target, label, buttonClass) => {
    const active = target === current;
    const classes = [buttonClass, active && 'active'].filter(Boolean).join(' ');
    return `<a href="${href(target)}"${classes ? ` class="${classes}"` : ''}${active ? ' aria-current="page"' : ''}>${label}</a>`;
  };
  const productLinks = [...products, ['tarifs.html', 'Tarifs Keydy Suite'], ['aide.html', 'Centre d’aide']];
  const productsActive = productLinks.some(([target]) => target === current);
  return `<header class="site-header" data-site-header>
  <div class="container nav">
    <a class="brand" href="${href('index.html')}" aria-label="Keydy, accueil"><img src="${href('assets/img/keydy-logo.png')}" alt="Keydy"></a>
    <button class="nav-toggle" data-site-menu-toggle type="button" aria-label="Menu principal" aria-controls="navigation-principale" aria-expanded="false" hidden>Menu <span aria-hidden="true">☰</span></button>
    <nav class="nav-links" id="navigation-principale" aria-label="Navigation principale">
      ${link('index.html', 'Accueil')}
      <details class="site-products-menu" data-site-products>
        <summary${productsActive ? ' class="active"' : ''}>Produits</summary>
        <ul class="site-products-links">
          ${productLinks.map(([target, label]) => `<li>${link(target, label)}</li>`).join('\n          ')}
        </ul>
      </details>
      ${link('a-propos.html', 'À propos')}
      ${link('contact.html', 'Démonstration')}
      ${link(login, 'Connexion', 'btn btn-secondary btn-sm')}
    </nav>
  </div>
</header>`;
}

export function renderSiteFooter(page = 'index.html') {
  const {href} = pagePaths(page);
  const groups = [
    ['Produits', products],
    ['Ressources', [
      ['tarifs.html', 'Tarifs Keydy Suite'],
      ['essai-gratuit.html', 'Essai gratuit Keydy Suite'],
      ['aide.html', 'Centre d’aide'],
      ['demonstration.html', 'Vidéo de démonstration'],
      ['logiciel-chauffagiste.html', 'Logiciel chauffagiste'],
      ['facturation-electronique-peppol.html', 'Facturation Peppol']
    ]],
    ['Keydy', [
      ['a-propos.html', 'À propos'],
      ['contact.html', 'Démonstration et contact'],
      [login, 'Connexion'],
      ['confidentialite.html', 'Confidentialité'],
      ['conditions-generales.html', 'Conditions générales']
    ]]
  ];
  return `<footer class="footer" data-site-footer>
  <div class="container">
    <nav class="footer-grid" aria-label="Navigation de pied de page">
      <div><a href="${href('index.html')}" aria-label="Keydy, accueil"><img src="${href('assets/img/keydy-logo-white.png')}" alt="Keydy"></a></div>
      ${groups.map(([title, links]) => `<div>
        <h2>${title}</h2>
        <ul class="footer-links">${links.map(([target, label]) => `<li><a href="${href(target)}">${label}</a></li>`).join('')}</ul>
      </div>`).join('\n      ')}
    </nav>
    <div class="footer-bottom">© 2026 Keydy · Belgique · <a href="mailto:info@keydy.be">info@keydy.be</a></div>
  </div>
</footer>`;
}
