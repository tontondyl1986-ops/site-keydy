'use strict';

const timeOffer = document.querySelector('[data-time-offer]');
const timeAmountCents = Number(timeOffer.dataset.amountCents);
if (timeOffer.dataset.salesOpen === 'true' && Number.isSafeInteger(timeAmountCents) && timeAmountCents > 0) {
  const currency = new Intl.NumberFormat('fr-BE', {style: 'currency', currency: 'EUR'});
  document.querySelector('[data-time-availability]').textContent = 'Keydy Time est disponible à l’achat en Belgique.';
  timeOffer.querySelector('[data-time-price]').textContent = currency.format(timeAmountCents / 100) + ' TTC';
  timeOffer.querySelector('[data-time-buy]').hidden = false;
}
