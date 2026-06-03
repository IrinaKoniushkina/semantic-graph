// Работа с изображениями: превью, модальное окно, загрузка
function renderPreview() {
    preview.innerHTML = "";
    const all = [...existingImages, ...newImages];
    all.forEach((item) => {
        const wrapper = document.createElement("div");
        wrapper.className = "preview-item";
        const imageWrapper = document.createElement("div");
        imageWrapper.style.position = "relative";
        const img = document.createElement("img");
        img.style.width = "60px";
        img.style.height = "60px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        if (item.type === "new") {
            const reader = new FileReader();
            reader.onload = e => { img.src = e.target.result; };
            reader.readAsDataURL(item.file);
        } else {
            if (item?.src) img.src = item.src;
            else return;
        }
        const caption = document.createElement("div");
        caption.className = "preview-caption";
        caption.textContent = item.caption || "";
        const removeBtn = createRemoveButton((e) => {
            e.stopPropagation();
            if (item.type === "new") newImages = newImages.filter(f => f.file !== item.file);
            else existingImages = existingImages.filter(i => i.src !== item.src);
            renderPreview();
        });
        wrapper.addEventListener("click", () => openImageEditor(item));
        imageWrapper.appendChild(img);
        imageWrapper.appendChild(removeBtn);
        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(caption);
        preview.appendChild(wrapper);
    });
    updateUploadVisibility();
    updateWizardButtons();
}

function createRemoveButton(handler) {
    const button = document.createElement("div");
    button.textContent = "✕";
    Object.assign(button.style, {
        position: "absolute", top: "-5px", right: "-5px",
        background: "#ffffff", color: "#5D474E", fontWeight: "bold",
        fontSize: "12px", width: "18px", height: "18px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "50%", cursor: "pointer"
    });
    button.onclick = handler;
    return button;
}

function updateUploadVisibility() {
    const total = existingImages.length + newImages.length;
    uploadBox.style.display = total >= MAX_IMAGES ? "none" : "flex";
}

function showModalPreview(src) {
    modalPreviewImage.src = src;
    modalImageBox.style.display = "block";
    uploadFromDevice.style.display = "none";
}

function hideModalPreview() {
    modalPreviewImage.src = "";
    modalImageBox.style.display = "none";
    uploadFromDevice.style.display = "flex";
    pendingFile = null;
    imageUrlInput.value = "";
}

function openImageEditor(item = null) {
    currentEditingImage = item;
    pendingFile = null;
    imageModal.style.display = "flex";
    if (item) {
        if (item.credits) {
            imageCreditsToggle.checked = true;
            imageCreditsFields.style.display = "flex";
            imageAuthorInput.value = item.credits.author || "";
            imageSourceInput.value = item.credits.source || "";
            imageLicenseInput.value = item.credits.license || "";
        } else {
            imageCreditsToggle.checked = false;
            imageCreditsFields.style.display = "none";
            imageAuthorInput.value = "";
            imageSourceInput.value = "";
            imageLicenseInput.value = "";
        }
        currentEditingIndex = existingImages.indexOf(item);
        currentEditingCollection = existingImages;
        if (currentEditingIndex === -1) {
            currentEditingIndex = newImages.indexOf(item);
            currentEditingCollection = newImages;
        }
        tempImageData = structuredClone(item);
        addUrlBtn.textContent = "Изменить";
        imageCaptionInput.value = item.caption || "";
        imageLicenseInput.value = item.license || "";
        if (item.file) {
            const reader = new FileReader();
            reader.onload = e => showModalPreview(e.target.result);
            reader.readAsDataURL(item.file);
        } else {
            showModalPreview(item.src);
            imageUrlInput.value = item.src || "";
        }
    } else {
        currentEditingIndex = -1;
        currentEditingCollection = null;
        tempImageData = null;
        addUrlBtn.textContent = "Добавить";
        imageCreditsToggle.checked = false;
        imageCreditsFields.style.display = "none";
        imageAuthorInput.value = "";
        imageSourceInput.value = "";
        imageLicenseInput.value = "";
        imageCaptionInput.value = "";
        imageUrlInput.value = "";
        hideModalPreview();
    }
    validateImageModal();
}

function validateImageModal() {
    const hasCaption = imageCaptionInput.value.trim().length >= MIN_IMAGE_CAPTION;
    addUrlBtn.disabled = !hasCaption;
    addUrlBtn.classList.toggle("disabled-btn", !hasCaption);
}