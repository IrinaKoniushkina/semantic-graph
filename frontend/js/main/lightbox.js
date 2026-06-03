function openLightbox(images, index) {
    currentGallery = images;
    currentImageIndex = index;
    renderLightbox();
    const lightbox = document.getElementById("lightbox");
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    lightbox.classList.add("hidden");
    document.body.style.overflow = "";
}

function renderLightbox() {
    const item = currentGallery[currentImageIndex];
    if (!item || !item.src) return;
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxCredits = document.getElementById("lightbox-credits");
    lightboxImage.src = item.src;
    lightboxCaption.innerHTML = item.caption || "";
    const credits = item.credits;
    if (credits) {
        lightboxCredits.innerHTML = `
            ${credits.author ? `<div><b>Автор:</b> ${credits.author}</div>` : ""}
            ${credits.source ? `<div><b>Источник:</b> <a href="${credits.source}" target="_blank">${credits.source}</a></div>` : ""}
            ${credits.license ? `<div><b>Лицензия:</b> ${credits.license}</div>` : ""}
        `;
    } else {
        lightboxCredits.innerHTML = "";
    }
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentGallery.length;
    renderLightbox();
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + currentGallery.length) % currentGallery.length;
    renderLightbox();
}

function initLightboxEvents() {
    const lightbox = document.getElementById("lightbox");
    document.querySelector(".lightbox-close").onclick = closeLightbox;
    document.querySelector(".lightbox-backdrop").onclick = closeLightbox;
    document.querySelector(".lightbox-nav.next").onclick = nextImage;
    document.querySelector(".lightbox-nav.prev").onclick = prevImage;
    document.addEventListener("keydown", (e) => {
        if (lightbox.classList.contains("hidden")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "ArrowLeft") prevImage();
    });
}