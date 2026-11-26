const LOCAL_DIRECT_SALES_ENABLED = true;
const CLOUD_SALES_ENABLED = Object.freeze({
  wallet_personal_monthly: true,
  wallet_personal_annual: true,
  wallet_family_monthly: true,
  wallet_family_annual: true
});

const walletPortal = 'https://wallet.keydy.be/wallet/';
const pricing = document.querySelector('[data-wallet-pricing]');
const control = pricing.querySelector('[data-billing-control]');
const prices = pricing.querySelectorAll('[data-billing]');
const subscriptions = pricing.querySelectorAll('[data-wallet-cloud-purchase]');
const offerSlugs = { personal: 'personnel', family: 'famille' };
const cycleSlugs = { monthly: 'mensuel', annual: 'annuel' };

function displayPeriod() {
  const selectedPeriod = control.querySelector('input:checked').value;
  prices.forEach(price => {
    price.hidden = price.dataset.billing !== selectedPeriod;
  });
  subscriptions.forEach(purchase => {
    const edition = purchase.dataset.walletCloudPurchase;
    const enabled = CLOUD_SALES_ENABLED[`wallet_${edition}_${selectedPeriod}`] === true;
    const link = purchase.querySelector('a');
    if (enabled) {
      const url = new URL(walletPortal);
      url.searchParams.set('offre', offerSlugs[edition]);
      url.searchParams.set('cycle', cycleSlugs[selectedPeriod]);
      link.href = url.href;
    } else {
      link.removeAttribute('href');
    }
    purchase.hidden = !enabled;
  });
}

control.addEventListener('change', displayPeriod);
displayPeriod();
control.hidden = false;

if (LOCAL_DIRECT_SALES_ENABLED) {
  const purchase = pricing.querySelector('[data-wallet-local-purchase]');
  purchase.querySelector('a').href = walletPortal + '?offre=local';
  purchase.hidden = false;
}

const cloudOpen = Object.values(CLOUD_SALES_ENABLED).includes(true);
if (LOCAL_DIRECT_SALES_ENABLED || cloudOpen) {
  const localStatus = LOCAL_DIRECT_SALES_ENABLED
    ? 'Wallet Local est disponible à l’achat en Belgique.'
    : 'Wallet Local est en préparation.';
  const cloudStatus = cloudOpen
    ? 'Retrouvez les abonnements Cloud disponibles dans les offres ci-dessous.'
    : 'Les offres Cloud sont en préparation.';
  document.querySelector('[data-wallet-sales-status]').textContent = localStatus + ' ' + cloudStatus;
}
