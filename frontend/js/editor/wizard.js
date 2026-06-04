// Шаги формы, валидация, переключение табов
function isStep1Valid() {
    return (
        nameInput.value.trim().length >= limits.name.min &&
        selectedCategories.length > 0 &&
        selectedIcon
    );
}

function isStep2Valid() {
    const hasRelations = selectedRelations.length > 0;
    const allImages = [...existingImages, ...newImages];
    const allCaptionsValid = allImages.every(img =>
        typeof img.caption === "string" &&
        img.caption.trim().length >= MIN_IMAGE_CAPTION
    );
    return hasRelations && allCaptionsValid;
}

function isStep3Valid() {
    return (
        keywordsInput.value.trim().length >= limits.keywords.min &&
        getTextLength(descInput) >= limits.desc.min &&
        getTextLength(historyInput) >= limits.history.min &&
        getTextLength(modernInput) >= limits.modern.min
    );
}

function updateWizardButtons() {
    const step1Next = document.getElementById("step1-next");
    const step2Next = document.getElementById("step2-next");
    const saveBtn = document.getElementById("save-btn");
    if (step1Next) step1Next.disabled = !isStep1Valid();
    if (step2Next) step2Next.disabled = !isStep2Valid();
    if (saveBtn) {
        saveBtn.disabled = !(isStep1Valid() && isStep2Valid() && isStep3Valid());
    }
}

function updateStepsUI() {
    const stepBlocks = document.querySelectorAll(".form-step");
    const stepIndicators = document.querySelectorAll(".step");
    stepBlocks.forEach(block => {
        block.classList.toggle("active", Number(block.dataset.step) === currentStep);
    });
    stepIndicators.forEach(step => {
        const stepNum = Number(step.dataset.step);
        step.classList.remove("active", "completed");
        if (stepNum === currentStep) step.classList.add("active");
        if (stepNum < currentStep) step.classList.add("completed");
    });
}

function switchTab(tab) {
    currentTab = tab;
    const formTitle = document.getElementById("title");
    const modeToggle = document.getElementById("mode-edit");

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.id === `tab-${tab}`);
    });
    const formEl = document.getElementById("form");
    const usersPanel = document.getElementById("users-panel");
    const historyPanel = document.getElementById("history-panel");
    formEl.style.display = tab === "editor" ? "block" : "none";
    usersPanel.style.display = tab === "users" ? "block" : "none";
    historyPanel.style.display = tab === "history" ? "block" : "none";
    if (tab === "editor") {
        if (formTitle) {
            formTitle.textContent = mode === "edit" ? "Редактирование вершины" : "Новая вершина";
        }
        if (modeToggle) {
            modeToggle.style.display = "";
        }

    } else if (tab === "users") {
        if (formTitle) {
            formTitle.textContent = "Пользователи";
        }
        if (modeToggle) {
            modeToggle.style.display = "none";
        }
    } else if (tab === "history") {
        if (formTitle) {
            formTitle.textContent = "История изменений";
        }
        if (modeToggle) {
            modeToggle.style.display = "none";
        }
    }

    if (tab === "users") loadUsersPanel();
    if (tab === "history") loadHistoryPanel();
}

// Валидация шага 1 и управление кнопками
function validateStep1() {
    let canShowButtons = false;
    if (mode === "add") {
        canShowButtons = nameInput.value.trim().length > 0;
    }
    if (mode === "edit") {
        canShowButtons = editingNode !== null;
    }
    step1Buttons.style.display = canShowButtons ? "flex" : "none";
    step1NextBtn.disabled = !isStep1Valid();
    updateDisabledStyles();
}