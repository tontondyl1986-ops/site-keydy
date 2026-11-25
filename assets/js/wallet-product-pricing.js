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
