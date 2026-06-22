const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const moduleInputs = Array.from(document.querySelectorAll(".selector-form input"));
const moduleCount = document.querySelector("#module-count");
const moduleList = document.querySelector("#module-list");
const demoLink = document.querySelector("#demo-link");
const screenshotMedias = Array.from(document.querySelectorAll(".screenshot-media"));

function updateModuleSelection() {
  const selected = moduleInputs
    .filter((input) => input.checked)
    .map((input) => input.value);

  const count = selected.length;
  moduleCount.textContent = count
    ? `${count} module${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}`
    : "Aucun module sélectionné";
  moduleList.textContent = selected.length ? selected.join(", ") : "Sélectionnez au moins un module";

  const subject = "Demande de démo Keydy";
  const body = selected.length
    ? `Bonjour,%0D%0A%0D%0AJe souhaite une démo Keydy pour les modules suivants: ${encodeURIComponent(selected.join(", "))}.%0D%0A%0D%0AMerci.`
    : "Bonjour,%0D%0A%0D%0AJe souhaite une démo Keydy.%0D%0A%0D%0AMerci.";

  if (demoLink) {
    demoLink.href = `mailto:contact@keydy.be?subject=${encodeURIComponent(subject)}&body=${body}`;
  }
}

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

moduleInputs.forEach((input) => {
  input.addEventListener("change", updateModuleSelection);
});

screenshotMedias.forEach((media) => {
  const image = media.querySelector("img");

  if (!image) {
    return;
  }

  const markLoaded = () => {
    media.classList.add("is-loaded");
  };

  const markMissing = () => {
    const altSource = image.dataset.altSrc;

    if (altSource && image.src !== new URL(altSource, window.location.href).href) {
      image.src = altSource;
      return;
    }

    media.classList.remove("is-loaded");
  };

  image.addEventListener("load", markLoaded);
  image.addEventListener("error", markMissing);

  if (image.complete && image.naturalWidth > 0) {
    markLoaded();
  }
});

updateModuleSelection();
