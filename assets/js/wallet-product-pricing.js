const LOCAL_DIRECT_SALES_ENABLED = false;

const pricing = document.querySelector('[data-wallet-pricing]');
const control = pricing.querySelector('[data-billing-control]');
const prices = pricing.querySelectorAll('[data-billing]');

function displayPeriod() {
  const selectedPeriod = control.querySelector('input:checked').value;
  prices.forEach(price => {
    price.hidden = price.dataset.billing !== selectedPeriod;
  });
}

control.addEventListener('change', displayPeriod);
displayPeriod();
control.hidden = false;

if (LOCAL_DIRECT_SALES_ENABLED) {
  const purchase = pricing.querySelector('[data-wallet-local-purchase]');
  purchase.querySelector('a').href = 'https://wallet.keydy.be/wallet/?offre=local';
  purchase.hidden = false;
  document.querySelector('[data-wallet-sales-status]').textContent =
    'Wallet Local est disponible à l’achat. Les offres Cloud sont en préparation.';
}
