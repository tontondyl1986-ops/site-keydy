(() => {
  const header = document.querySelector('[data-site-header], [data-keydy-site-header]');
  const toggle = header?.querySelector('[data-site-menu-toggle]');
  const navigation = header?.querySelector('.nav-links');
  const products = header?.querySelector('[data-site-products]');
  if (!toggle || !navigation || !products) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  function setMenuOpen(open) {
    navigation.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) products.open = false;
  }

  toggle.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  mobile.addEventListener('change', () => setMenuOpen(false));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (!products.contains(event.relatedTarget)) products.open = false;
    if (!header.contains(event.relatedTarget)) setMenuOpen(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!products.contains(event.target)) products.open = false;
    if (!header.contains(event.target)) setMenuOpen(false);
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (products.open && products.contains(event.target)) {
      products.open = false;
      products.querySelector('summary').focus();
    } else if (mobile.matches && navigation.classList.contains('open')) {
      setMenuOpen(false);
      toggle.focus();
    } else {
      return;
    }
    event.preventDefault();
  });

  header.classList.add('site-navigation-enhanced');
  toggle.hidden = false;
})();
