// Основной файл: инициализация событий и запуск
document.addEventListener("DOMContentLoaded", () => {
    // Привязка счётчиков
    bindCounter(nameInput, document.querySelector("#name-counter"), limits.name);
    bindCounter(keywordsInput, document.querySelector("#keywords-counter"), limits.keywords);
    bindCounter(descInput, document.querySelector("#desc-counter"), limits.desc);
    bindCounter(historyInput, document.querySelector("#history-counter"), limits.history);
    bindCounter(modernInput, document.querySelector("#modern-counter"), limits.modern);

    // Валидация шага 1
    validateStep1();
    nameInput.addEventListener("input", validateStep1);

    // Режимы добавления/редактирования
    btnEdit.addEventListener("click", () => {
        clearForm();
        mode = "edit";
        deleteBtn.style.display = "inline-flex";
        btnAdd.style.display = "inline-block";
        btnEdit.style.display = "none";
        btnEdit.classList.add("active");
        btnAdd.classList.remove("active");
        title.textContent = "Редактировать вершину";
        document.getElementById("save-btn").textContent = "Сохранить";
    });
    btnAdd.addEventListener("click", () => {
        clearForm();
        mode = "add";
        deleteBtn.style.display = "none";
        btnEdit.style.display = "inline-block";
        btnAdd.style.display = "none";
        btnAdd.classList.add("active");
        btnEdit.classList.remove("active");
        title.textContent = "Добавить вершину";
        document.getElementById("save-btn").textContent = "Добавить вершину в граф";
    });
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("auth");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    });


    // Удаление вершины
    deleteBtn.addEventListener("click", () => { if (editingNode) modal.style.display = "flex"; });
    deleteNo.onclick = () => modal.style.display = "none";
    modalClose.onclick = () => modal.style.display = "none";
    deleteYes.onclick = async () => {
        const token = localStorage.getItem("token");
        await fetch("http://localhost:5000/places/" + editingNode.id, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        modal.style.display = "none";
        showToast("Вершина удалена");
        clearForm();
        editingNode = null;
        await fetchGraphData();
    };

    // Автозаполнение имени
    nameInput.addEventListener("focus", () => { if (mode === "edit") showNameDropdown(""); });
    nameInput.addEventListener("click", () => { if (mode === "edit") showNameDropdown(""); });
    nameInput.addEventListener("input", () => showNameDropdown(nameInput.value));

    // Категории
    categorySearch.addEventListener("input", () => {
        const q = categorySearch.value.toLowerCase();
        categoryDropdown.innerHTML = "";
        const results = allCategories.filter(c => c.toLowerCase().includes(q) && !selectedCategories.includes(c));
        results.forEach(c => {
            const div = document.createElement("div");
            div.textContent = c;
            div.onclick = () => addCategory(c);
            categoryDropdown.appendChild(div);
        });
        categoryDropdown.style.display = "block";
    });
    categorySearch.addEventListener("focus", showAllCategories);
    categorySearch.addEventListener("click", showAllCategories);

    // Связи
    relationSearch.addEventListener("focus", showAllRelation);
    relationSearch.addEventListener("click", showAllRelation);
    relationSearch.addEventListener("input", showAllRelation);

    // Редактор причины связи
    relationReasonInput.addEventListener("input", () => {
        relationReasonCounter.textContent = `${relationReasonInput.value.length}/150`;
    });
    saveRelationReasonBtn.addEventListener("click", () => {
        const text = relationReasonInput.value.trim();
        if (text.length < 3) {
            showToast("Укажите причину взаимосвязи");
            return;
        }
        currentRelationEditing.reason = text;
        closeRelationReasonEditor();
    });
    cancelRelationReasonBtn.addEventListener("click", () => {
        if (isNewRelation && currentRelationEditing) {
            selectedRelations = selectedRelations.filter(r => r !== currentRelationEditing);
            if (currentRelationTag) currentRelationTag.remove();
        }
        closeRelationReasonEditor();
    });

    // Модалка удаления связи
    relationDeleteNo.addEventListener("click", () => deleteRelationModal.style.display = "none");
    relationModalClose.addEventListener("click", () => deleteRelationModal.style.display = "none");
    relationDeleteYes.addEventListener("click", () => {
        if (pendingRelationDelete) removeRelation(pendingRelationDelete.relation, pendingRelationDelete.tag);
        pendingRelationDelete = null;
        deleteRelationModal.style.display = "none";
    });

    // Изображения
    imagesInput.addEventListener("change", () => {
        const files = Array.from(imagesInput.files);
        const total = existingImages.length + newImages.length;
        if (total >= MAX_IMAGES) {
            imagesInput.value = "";
            updateUploadVisibility();
            return;
        }
        const availableSlots = MAX_IMAGES - total;
        if (files.length > availableSlots) showToast(`Можно добавить только ${availableSlots} изображений`);
        const filesToAdd = files.slice(0, availableSlots).map(file => ({ file, caption: "" }));
        newImages = [...newImages, ...filesToAdd];
        imagesInput.value = "";
        renderPreview();
    });
    uploadBox.addEventListener("click", () => openImageEditor());
    uploadFromDevice.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const file = input.files[0];
            if (!file) return;
            pendingFile = file;
            const reader = new FileReader();
            reader.onload = e => showModalPreview(e.target.result);
            reader.readAsDataURL(file);
        };
        input.click();
    });
    removeModalPreview.addEventListener("click", hideModalPreview);
    addUrlBtn.addEventListener("click", () => {
        const caption = imageCaptionInput.value.trim();
        const license = imageLicenseInput.value.trim();
        if (caption.length < MIN_IMAGE_CAPTION) {
            showToast("Добавьте подпись к изображению");
            return;
        }
        const url = imageUrlInput.value.trim();
        let credits = null;
        if (imageCreditsToggle.checked) {
            credits = {
                author: imageAuthorInput.value.trim(),
                source: imageSourceInput.value.trim(),
                license: imageLicenseInput.value.trim()
            };
            Object.keys(credits).forEach(key => { if (!credits[key]) delete credits[key]; });
            if (Object.keys(credits).length === 0) credits = null;
        }
        if (currentEditingImage) {
            currentEditingImage.caption = caption;
            if (credits) currentEditingImage.credits = credits;
            else delete currentEditingImage.credits;
            if (pendingFile) {
                currentEditingImage.file = pendingFile;
                delete currentEditingImage.src;
                currentEditingImage.type = "new";
            } else if (url) {
                currentEditingImage.src = url;
                delete currentEditingImage.file;
                currentEditingImage.type = "url";
            }
            imageModal.style.display = "none";
            renderPreview();
            return;
        }
        if (pendingFile) {
            newImages.push({ file: pendingFile, caption, credits, type: "new" });
            imageModal.style.display = "none";
            renderPreview();
            return;
        }
        if (!url) {
            showToast("Добавьте изображение");
            return;
        }
        existingImages.push({ src: url, caption, credits, type: "url" });
        imageModal.style.display = "none";
        renderPreview();
    });
    closeImageModal.addEventListener("click", () => {
        const confirmClose = confirm("Сбросить изменения?");
        if (!confirmClose) return;
        imageModal.style.display = "none";
        pendingFile = null;
        if (tempImageData && currentEditingImage) {
            Object.keys(currentEditingImage).forEach(key => delete currentEditingImage[key]);
            Object.assign(currentEditingImage, tempImageData);
        }
        hideModalPreview();
    });
    imageCaptionInput.addEventListener("input", validateImageModal);
    imageCreditsToggle.addEventListener("change", () => {
        imageCreditsFields.style.display = imageCreditsToggle.checked ? "flex" : "none";
    });

    // Отправка формы
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!nameInput.value.trim()) {
            showToast("Введите название");
            return;
        }
        const totalImages = existingImages.length + newImages.length;
        if (totalImages > MAX_IMAGES) {
            showToast("Максимум 5 изображений");
            return;
        }
        const uploaded = await uploadImages();
        const newImageObjects = uploaded.map((src, i) => ({
            src, caption: newImages[i]?.caption ?? "", credits: newImages[i]?.credits ?? null
        }));
        const normalizedExisting = existingImages.map(i => ({
            src: i.src, caption: i.caption ?? "", credits: i.credits ?? null
        }));
        const allImages = [...normalizedExisting, ...newImageObjects];
        const invalidHistoryRelation = selectedRelations.find(r => r.type === "history" && (!r.reason || r.reason.trim().length < 3));
        if (invalidHistoryRelation) {
            showToast("Для культурно-исторических связей нужно указать причину");
            return;
        }
        const nodeData = {
            id: editingNode?.id || Date.now().toString(),
            name: nameInput.value.trim(),
            keywords: keywordsInput.value.trim(),
            category: selectedCategories,
            content: {
                description: { text: descInput.innerHTML, images: allImages },
                history: historyInput.innerHTML,
                modern: modernInput.innerHTML
            },
            icon: selectedIcon,
            geo: geoInput.value.trim()
        };
        const body = {
            node: nodeData,
            related: selectedRelations.length ? selectedRelations : null,
            mode: editingNode ? "edit" : "add"
        };
        const token = localStorage.getItem("token");
        if (!token) window.location.href = "login.html";
        const res = await fetch("http://localhost:5000/places", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            showToast(editingNode ? "Изменения сохранены" : "Вершина добавлена");
            await fetchGraphData();
            clearForm();
            editingNode = null;
        } else {
            showToast("Ошибка сохранения");
        }
    });

    // Кнопки сброса шага
    document.querySelectorAll(".reset-step").forEach(btn => {
        btn.addEventListener("click", () => resetModal.style.display = "flex");
    });
    resetNo.addEventListener("click", () => resetModal.style.display = "none");
    resetModalClose.addEventListener("click", () => resetModal.style.display = "none");
    resetYes.addEventListener("click", () => {
        resetModal.style.display = "none";
        clearForm();
        showToast("Изменения сброшены");
    });

    // Панель инструментов редактора
    document.querySelectorAll(".editor-toolbar button").forEach(btn => {
        btn.addEventListener("click", () => {
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
        });
    });

    // Кнопки навигации по шагам
    document.querySelectorAll(".next-step").forEach(btn => {
        btn.addEventListener("click", () => { if (currentStep < 3) { currentStep++; updateStepsUI(); } });
    });
    document.querySelectorAll(".prev-step").forEach(btn => {
        btn.addEventListener("click", () => { if (currentStep > 1) { currentStep--; updateStepsUI(); } });
    });

    // Вкладки редактора/пользователей/истории
    document.getElementById("tab-editor").addEventListener("click", () => switchTab("editor"));
    document.getElementById("tab-users").addEventListener("click", () => switchTab("users"));
    document.getElementById("tab-history").addEventListener("click", () => switchTab("history"));

    // Создание пользователя (модалка)
    const createUserModal = document.getElementById("createUserModal");
    document.getElementById("open-create-user").addEventListener("click", () => {
        resetCreateUserForm();
        createUserModal.style.display = "flex";
        btnEdit.style.display = "none";
    });
    document
        .getElementById("closeCreateUserModal").addEventListener("click", () => {
            resetCreateUserForm();
            createUserModal.style.display = "none";
        });
    document.getElementById("create-user-btn").addEventListener("click", async () => {
        const login = document.getElementById("new-user-login").value.trim();
        const password = document.getElementById("new-user-password").value.trim();
        const role = document.getElementById("new-user-role").value;
        if (!login || !password) {
            showToast("Заполните все поля");
            return;
        }
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/users", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ login, password, role })
        });
        if (res.ok) {
            resetCreateUserForm();
            createUserModal.style.display = "none";
            loadUsersPanel();
            showToast("Пользователь создан");
        } else {
            showToast("Ошибка создания");
        }
    });

    function resetCreateUserForm() {
        document.getElementById("new-user-login").value = "";
        document.getElementById("new-user-password").value = "";
        document.getElementById("new-user-role").value = "editor";
    }

    // Обновление валидации при изменении полей
    [nameInput, geoInput, keywordsInput, relationReasonInput].forEach(el => {
        el.addEventListener("input", updateWizardButtons);
    });
    [descInput, historyInput, modernInput].forEach(el => {
        el.addEventListener("input", updateWizardButtons);
    });

    // Загрузка начальных данных и инициализация админ-панели
    fetchGraphData();
    initAdminInterface();
    updateStepsUI();

    // Параметр URL для вкладки
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'users') switchTab('users');
});