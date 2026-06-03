// Выбор/редактирование вершин, очистка формы, режимы add/edit
function showNameDropdown(filter = "") {
    nameDropdown.innerHTML = "";
    if (mode === "add" && !filter.trim()) {
        nameDropdown.style.display = "none";
        return;
    }
    const results = allNodes.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()));
    if (mode === "add" && results.length === 0) {
        nameDropdown.style.display = "none";
        return;
    }
    results.forEach(n => {
        const div = document.createElement("div");
        div.textContent = n.name;
        div.addEventListener("click", () => {
            if (mode === "add") {
                mode = "edit";
                btnEdit.style.display = "none";
                btnAdd.style.display = "inline-block";
                deleteBtn.style.display = "inline-block";
                title.textContent = "Редактировать вершину";
                document.getElementById("save-btn").textContent = "Сохранить";
            }
            selectNode(n);
        });
        nameDropdown.appendChild(div);
    });
    if (mode === "edit" && results.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "Ничего не найдено";
        empty.style.color = "#999";
        nameDropdown.appendChild(empty);
    }
    nameDropdown.style.display = "block";
}

function selectNode(node) {
    editingNode = node;
    nameInput.value = node.name;
    selectedCategories = node.category || [];
    selectedCategoriesDiv.innerHTML = "";
    keywordsInput.value = node.keywords || "";
    keywordsCounter.textContent = `${keywordsInput.value.length} / ${limits.keywords.max}`;
    selectedCategories.forEach(cat => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.style.background = CATEGORY_COLORS[cat] || "#777";
        tag.style.color = "white";
        tag.textContent = cat + " ✕";
        tag.addEventListener("click", () => {
            selectedRelations = selectedRelations.filter(r => !(r.id === node.id && r.type === type));
            tag.remove();
        });
        selectedCategoriesDiv.appendChild(tag);
    });
    descInput.innerHTML = node.content?.description?.text || "";
    historyInput.innerHTML = node.content?.history || "";
    modernInput.innerHTML = node.content?.modern || "";
    geoInput.value = node.geo || "";
    existingImages = (node.content?.description?.images || []).map(img => ({ ...img, caption: typeof img.caption === "string" ? img.caption : "" }));
    newImages = [];
    renderPreview();
    selectedIcon = node.icon || "icons/parthenon.png";
    iconPicker.querySelectorAll("svg").forEach(svg => {
        svg.classList.toggle("active", svg.dataset.icon === selectedIcon);
    });
    selectedRelations = [];
    selectedRelationsDiv.innerHTML = "";
    const relEdges = allEdges.filter(e => e.source === node.id || e.target === node.id);
    relEdges.forEach(edge => {
        const relatedId = edge.source === node.id ? edge.target : edge.source;
        const relatedNode = allNodes.find(n => n.id === relatedId);
        if (relatedNode && edge.relations) {
            edge.relations.forEach(rel => {
                addRelation(relatedNode, rel.type, rel.reason);
            });
        }
    });
    nameDropdown.style.display = "none";
    validateStep1();
    updateWizardButtons();
    updateDisabledStyles();
}

function clearTextFields() {
    nameInput.value = "";
    keywordsInput.value = "";
    descInput.innerHTML = "";
    historyInput.innerHTML = "";
    modernInput.innerHTML = "";
    geoInput.value = "";
}

function clearRelations() {
    selectedRelations = [];
    selectedRelationsDiv.innerHTML = "";
}

function clearCategories() {
    selectedCategories = [];
    selectedCategoriesDiv.innerHTML = "";
}

function clearImages() {
    existingImages = [];
    newImages = [];
    imagesInput.value = "";
    preview.innerHTML = "";
}

function clearForm() {
    mode = "add";
    editingNode = null;
    clearTextFields();
    clearRelations();
    clearCategories();
    clearImages();
    selectedIcon = "";
    iconPicker.querySelectorAll("svg").forEach(svg => svg.classList.remove("active"));
    nameDropdown.style.display = "none";
    categoryDropdown.style.display = "none";
    relationDropdown.style.display = "none";
    categorySearch.value = "";
    relationSearch.value = "";
    imageUrlInput.value = "";
    btnAdd.style.display = "none";
    btnEdit.style.display = "inline-block";
    deleteBtn.style.display = "none";
    title.textContent = "Добавить вершину";
    document.getElementById("save-btn").textContent = "Добавить вершину";
    currentStep = 1;
    updateStepsUI();
    validateStep1();
    updateUploadVisibility();
    updateWizardButtons();
    updateDisabledStyles();
}

// Работа с категориями
function showAllCategories() {
    categoryDropdown.innerHTML = "";
    const results = allCategories.filter(c => !selectedCategories.includes(c));
    results.forEach(c => {
        const div = document.createElement("div");
        div.textContent = c;
        div.onclick = () => addCategory(c);
        categoryDropdown.appendChild(div);
    });
    categoryDropdown.style.display = "block";
}

function addCategory(cat) {
    selectedCategories.push(cat);
    updateWizardButtons();
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = cat + " ✕";
    tag.addEventListener("click", () => {
        selectedCategories = selectedCategories.filter(c => c !== cat);
        tag.remove();
        updateWizardButtons();
    });
    selectedCategoriesDiv.appendChild(tag);
    categorySearch.value = "";
    categoryDropdown.style.display = "none";
}