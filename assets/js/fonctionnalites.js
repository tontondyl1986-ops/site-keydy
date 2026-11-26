const featureDialog = document.querySelector(".feature-dialog");

if (featureDialog && typeof featureDialog.showModal === "function") {
  const title = featureDialog.querySelector("h2");
  const image = featureDialog.querySelector("img");
  const video = featureDialog.querySelector("video");
  let opener;

  for (const link of document.querySelectorAll("[data-feature-media]")) {
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      const module = link.closest(".feature-module");
      title.textContent = module.querySelector("h2").textContent;
      const showingVideo = link.dataset.featureMedia === "video";
      image.hidden = showingVideo;
      video.hidden = !showingVideo;
      if (showingVideo) {
        const preview = module.querySelector(".feature-capture img");
        video.poster = preview.currentSrc || preview.src;
        video.src = link.href;
      } else {
        image.alt = link.querySelector("img").alt;
        image.src = link.href;
      }
      featureDialog.showModal();
    });
  }

  featureDialog.addEventListener("close", () => {
    video.pause();
    video.removeAttribute("src");
    video.removeAttribute("poster");
    video.load();
    image.removeAttribute("src");
    opener.focus({ preventScroll: true });
  });
}
