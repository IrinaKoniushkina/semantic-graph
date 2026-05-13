
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    localStorage.removeItem("user");

    window.location.href = "login.html";
});

let allNodes = []
let allEdges = []
let mode = "add";

let selectedRelations = []
let editingNode = null

const nameInput = document.getElementById("name-input")
const keywordsInput = document.getElementById("keywords-input")
const keywordsCounter = document.getElementById("keywords-counter");
const nameDropdown = document.getElementById("name-dropdown")

const categorySearch = document.getElementById("category-input");
const categoryDropdown = document.getElementById("category-dropdown");
const selectedCategoriesDiv = document.getElementById("selected-categories");

const historyInput = document.getElementById("history-input")
const modernInput = document.getElementById("modern-input")

const allCategories = ["культура", "молодежь", "туризм"];

let selectedCategories = [];
const descInput = document.getElementById("desc-input")

let selectedIcon = "";
const iconPicker = document.getElementById("icon-picker");

const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

const iconDescriptions = {
    "museum": "Музеи, театры, библиотеки и др.",
    "church": "Церкви, храмы, соборы и др.",
    "park": "Природные зоны, Листвянка, Байкал и др.",
    "monument": "Памятники, монументы и др.",
    "building": "Инфрастукутура города, мосты, улицы и др.",
    "user": "Исторические личности, писатели и др."
};

const CATEGORY_COLORS = {
    "молодежь": "#A32406",
    "культура": "#521C00",
    "туризм": "#496771"
}

const MAX_IMAGES = 5;
const MIN_IMAGE_CAPTION = 3;
let existingImages = [];
let newImages = [];
let currentEditingImage = null;
let currentEditingIndex = -1;
let currentEditingCollection = null;
let tempImageData = null;
let pendingFile = null;

const imagesInput = document.getElementById("images-input")
const preview = document.getElementById("image-preview")
const uploadBox = document.querySelector(".upload-box");

const relationSearch = document.getElementById("relation-search")
const relationDropdown = document.getElementById("relation-dropdown")
const selectedRelationsDiv = document.getElementById("selected-relations")

const relationReasonEditor = document.getElementById("relation-reason-editor");
const relationReasonInput = document.getElementById("relation-reason-input");
const relationReasonCounter = document.getElementById("relation-reason-counter");
const saveRelationReasonBtn = document.getElementById("save-relation-reason");
const cancelRelationReasonBtn = document.getElementById("cancel-relation-reason");

let currentRelationEditing = null;
let currentRelationTag = null;
let isNewRelation = false;

const form = document.getElementById("form")

const btnAdd = document.getElementById("mode-add")
const btnEdit = document.getElementById("mode-edit")
const title = document.getElementById("title")

const step1Buttons = document.querySelector(".step-buttons-first");

const step1NextBtn = document.getElementById("step1-next");

const limits = {
    name: { min: 3, max: 30 },
    desc: { min: 250, max: 500 },
    keywords: { min: 10, max: 150 },
    history: { min: 1000, max: 1500 },
    modern: { min: 1000, max: 1500 }
};

function validateStep1() {
    let canShowButtons = false;
    if (mode === "add") {
        canShowButtons =
            nameInput.value.trim().length > 0;
    }
    if (mode === "edit") {
        canShowButtons =
            editingNode !== null;
    }
    step1Buttons.style.display = canShowButtons ? "flex" : "none";
    step1NextBtn.disabled = !isStep1Valid();
    updateDisabledStyles();
}

nameInput.addEventListener("input", validateStep1);

// при загрузке
validateStep1();

const deleteBtn = document.getElementById("delete-btn")

const modal = document.getElementById("deleteModal")
const deleteYes = document.getElementById("deleteYes")
const deleteNo = document.getElementById("deleteNo")
const modalClose = document.getElementById("modalClose")

const deleteRelationModal = document.getElementById("deleteRelationModal");
const relationDeleteYes = document.getElementById("relationDeleteYes");
const relationDeleteNo = document.getElementById("relationDeleteNo");
const relationModalClose = document.getElementById("relationModalClose");
let pendingRelationDelete = null;

const toast = document.getElementById("toast")

const imageModal = document.getElementById("imageModal");
const uploadFromDevice = document.getElementById("uploadFromDevice");
const modalImageBox = document.getElementById("modalImageBox");
const modalPreviewImage = document.getElementById("modalPreviewImage");
const removeModalPreview = document.getElementById("removeModalPreview");

const closeImageModal = document.getElementById("closeImageModal");
const addUrlBtn = document.getElementById("addUrlBtn");
const imageCaptionInput = document.getElementById("imageCaptionInput");
const imageUrlInput = document.getElementById("imageUrlInput");
const imageCreditsToggle = document.getElementById("imageCreditsToggle");
const imageCreditsFields = document.getElementById("imageCreditsFields");
const imageAuthorInput = document.getElementById("imageAuthorInput");
const imageSourceInput = document.getElementById("imageSourceInput");
const imageLicenseInput = document.getElementById("imageLicenseInput");
const geoInput = document.getElementById("geo-input");

const tagTooltip = document.createElement("div");
tagTooltip.className = "tag-tooltip";
document.body.appendChild(tagTooltip);

const resetModal = document.getElementById("resetModal");
const resetYes = document.getElementById("resetYes");
const resetNo = document.getElementById("resetNo");
const resetModalClose = document.getElementById("resetModalClose");

// ЗАГРУЗКА ДАННЫХ
async function fetchGraphData() {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:5000/places", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Ошибка загрузки графа");
        }

        const data = await response.json();

        allNodes = data.nodes || [];
        allEdges = data.edges || [];

    } catch (error) {
        console.error(error);
        showToast("Ошибка загрузки данных");
    }
}

fetchGraphData()

function getSelectedRelationType() {
    const selected = document.querySelector('input[name="type-relations"]:checked');
    return selected?.value === "history-relation" ? "history" : "geo";
}

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
    const hasImages = allImages.length > 0;

    const allCaptionsValid = allImages.every(img =>
        typeof img.caption === "string" &&
        img.caption.trim().length >= MIN_IMAGE_CAPTION
    );

    return (
        hasRelations &&
        hasImages &&
        allCaptionsValid
    );
}

function isStep3Valid() {

    return (
        keywordsInput.value.trim().length >= limits.keywords.min &&
        getTextLength(descInput) >= limits.desc.min &&
        getTextLength(historyInput) >= limits.history.min &&
        getTextLength(modernInput) >= limits.modern.min
    );
}

function validateImageModal() {

    const hasCaption =
        imageCaptionInput.value.trim().length >= MIN_IMAGE_CAPTION;

    addUrlBtn.disabled = !hasCaption;

    addUrlBtn.classList.toggle(
        "disabled-btn",
        !hasCaption
    );
}

imageCaptionInput.addEventListener(
    "input",
    validateImageModal
);

function updateWizardButtons() {
    const step1Next = document.getElementById("step1-next");
    const step2Next = document.getElementById("step2-next");
    const saveBtn = document.getElementById("save-btn");
    if (step1Next) { step1Next.disabled = !isStep1Valid(); }
    if (step2Next) { step2Next.disabled = !isStep2Valid(); }
    if (saveBtn) {
        saveBtn.disabled = !(
            isStep1Valid() &&
            isStep2Valid() &&
            isStep3Valid()
        );
    }
}

const resetButtons = document.querySelectorAll(".reset-step");

resetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        resetModal.style.display = "flex";
    });
});

function updateDisabledStyles() {
    document.querySelectorAll(
        "#step1-next, #step2-next, #save-btn"
    ).forEach(btn => {

        if (btn.disabled) {
            btn.classList.add("disabled-btn");
        } else {
            btn.classList.remove("disabled-btn");
        }
    });
}

function updateCounter(input, counter, max) {
    const length = getTextLength(input);

    counter.textContent = `${length}/${max}`;
    counter.style.color = length > max ? "red" : "#888";
}

function getTextLength(input) {

    if (
        input.tagName === "INPUT" ||
        input.tagName === "TEXTAREA"
    ) {
        return input.value.length;
    }

    return input.innerText.length;
}
function bindCounter(input, counter, limit) {
    if (!input || !counter) return;

    const handler = () => {
        const length = getTextLength(input);

        // ограничение
        if (length > limit.max) {
            if (input.value !== undefined) {
                input.value = input.value.slice(0, limit.max);
            } else {
                input.innerText = input.innerText.slice(0, limit.max);
            }
        }

        updateCounter(input, counter, limit.max);
    };

    input.addEventListener("input", handler);

    handler();
}

document.addEventListener("DOMContentLoaded", () => {
    bindCounter(nameInput, document.querySelector("#name-counter"), limits.name);
    bindCounter(keywordsInput, document.querySelector("#keywords-counter"), limits.keywords);
    bindCounter(descInput, document.querySelector("#desc-counter"), limits.desc);
    bindCounter(historyInput, document.querySelector("#history-counter"), limits.history);
    bindCounter(modernInput, document.querySelector("#modern-counter"), limits.modern);
});
[
    nameInput,
    geoInput,
    keywordsInput,
    relationReasonInput
].forEach(el => {

    el.addEventListener("input", updateWizardButtons);
});

[descInput, historyInput, modernInput]
    .forEach(el => {

        el.addEventListener("input", updateWizardButtons);
    });

document.querySelectorAll('.editor').forEach(editor => {
    editor.addEventListener('paste', function (e) {
        e.preventDefault();

        let text = (e.clipboardData || window.clipboardData).getData('text');

        text = text
            .replace(/\r/g, '')
            .replace(/\n{2,}/g, '\n') // схлопнули лишние
            .trim();

        // превращаем строки в <p>
        const paragraphs = text.split('\n')
            .map(line => `<p>${line.trim()}</p>`)
            .join('');

        document.execCommand('insertHTML', false, paragraphs);
    });
});

imageCreditsToggle.addEventListener("change", () => {

    imageCreditsFields.style.display =
        imageCreditsToggle.checked
            ? "flex"
            : "none";
});

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ
async function uploadImages() {
    if (newImages.length === 0) return [];

    const formData = new FormData();

    for (let item of newImages) {
        formData.append("images", item.file);
    }

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/upload-images", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    const text = await res.text();

    try {
        const data = JSON.parse(text);
        return data.images || [];
    } catch {
        console.error("Ответ сервера:", text);
        showToast("Ошибка загрузки изображений");
        return [];
    }
}
// ИКОНКИ
iconPicker.querySelectorAll("svg").forEach(svg => {
    svg.addEventListener("click", () => {
        selectedIcon = svg.dataset.icon;

        iconPicker.querySelectorAll("svg")
            .forEach(i => i.classList.remove("active"));

        svg.classList.add("active");
        updateWizardButtons();
    });
    // ТУЛТИПЫ
    svg.onmouseenter = (e) => {
        const text = iconDescriptions[svg.dataset.icon] || "";

        tooltip.textContent = text;
        tooltip.style.opacity = "1";
    };
    svg.onmousemove = (e) => {
        tooltip.style.left = e.clientX + 15 + "px";
        tooltip.style.top = e.clientY + 15 + "px";
    };
    svg.onmouseleave = () => {
        tooltip.style.opacity = "0";
    };
});

//РЕЖИМЫ
btnEdit.addEventListener("click", () => {
    clearForm()
    mode = "edit"
    deleteBtn.style.display = "inline-flex"
    btnAdd.style.display = "inline-block"
    btnEdit.style.display = "none"
    btnEdit.classList.add("active")
    btnAdd.classList.remove("active")
    title.textContent = "Редактировать вершину"
    document.getElementById("save-btn").textContent = "Сохранить"
});

btnAdd.addEventListener("click", () => {
    clearForm()
    mode = "add"
    deleteBtn.style.display = "none"
    btnEdit.style.display = "inline-block"
    btnAdd.style.display = "none"
    btnAdd.classList.add("active")
    btnEdit.classList.remove("active")
    title.textContent = "Добавить вершину"
    document.getElementById("save-btn").textContent = "Добавить вершину в граф"
});

//УДАЛЕНИЕ ВЕРШИНЫ
deleteBtn.addEventListener("click", () => {
    if (!editingNode) return
    modal.style.display = "flex"
})

deleteNo.onclick = () => modal.style.display = "none"
modalClose.onclick = () => modal.style.display = "none"

deleteYes.onclick = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/places/" + editingNode.id, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    modal.style.display = "none"
    showToast("Вершина удалена")
    clearForm()
    editingNode = null
    await fetchGraphData()
}

nameInput.addEventListener("focus", () => {
    if (mode === "edit") {
        showNameDropdown("");
    }
});

nameInput.addEventListener("click", () => {
    if (mode === "edit") {
        showNameDropdown("");
    }
});

nameInput.addEventListener("input", () => {
    showNameDropdown(nameInput.value);
});

//АВТОЗАПОЛНЕНИЕ
function showNameDropdown(filter = "") {

    nameDropdown.innerHTML = "";

    // режим ADD → показываем ТОЛЬКО если есть ввод
    if (mode === "add" && !filter.trim()) {
        nameDropdown.style.display = "none";
        return;
    }

    const results = allNodes.filter(n =>
        n.name.toLowerCase().includes(filter.toLowerCase())
    );

    // если нет совпадений → скрываем (в add)
    if (mode === "add" && results.length === 0) {
        nameDropdown.style.display = "none";
        return;
    }

    results.forEach(n => {
        const div = document.createElement("div");
        div.textContent = n.name;

        div.addEventListener("click", () => {
            // 🔥 КЛЮЧЕВОЕ ПОВЕДЕНИЕ
            if (mode === "add") {
                // переключаемся в режим редактирования
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

    // если edit и пусто → "Ничего не найдено"
    if (mode === "edit" && results.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "Ничего не найдено";
        empty.style.color = "#999";
        nameDropdown.appendChild(empty);
    }

    nameDropdown.style.display = "block";
}

function selectNode(node) {
    editingNode = node
    nameInput.value = node.name
    selectedCategories = node.category || [];
    selectedCategoriesDiv.innerHTML = "";

    keywordsInput.value = node.keywords || "";
    keywordsCounter.textContent =
        `${keywordsInput.value.length} / ${limits.keywords.max}`

    selectedCategories.forEach(cat => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.style.background = CATEGORY_COLORS[cat] || "#777";
        tag.style.color = "white";
        tag.textContent = cat + " ✕";

        tag.addEventListener("click", () => {
            selectedRelations =
                selectedRelations.filter(r =>
                    !(r.id === node.id && r.type === type)
                );
            tag.remove();
        });

        selectedCategoriesDiv.appendChild(tag);
    });
    descInput.innerHTML = node.content?.description?.text || "";
    historyInput.innerHTML = node.content?.history || "";
    modernInput.innerHTML = node.content?.modern || "";
    geoInput.value = node.geo || "";

    existingImages = (node.content?.description?.images || []).map(img => ({
        ...img,
        caption: typeof img.caption === "string"
            ? img.caption
            : ""
    }));

    newImages = [];

    renderPreview();
    selectedIcon = node.icon || "icons/parthenon.png";
    iconPicker.querySelectorAll("svg").forEach(svg => {
        svg.classList.toggle("active", svg.dataset.icon === selectedIcon)
    })
    selectedRelations = []
    selectedRelationsDiv.innerHTML = ""
    const relEdges = allEdges.filter(e =>
        e.source === node.id || e.target === node.id
    )
    relEdges.forEach(edge => {
        const relatedId = edge.source === node.id ? edge.target : edge.source;

        const relatedNode = allNodes.find(n => n.id === relatedId);

        if (relatedNode) {
            // Добавляем через функцию, чтобы всё было единообразно
            if (edge.relations) {
                edge.relations.forEach(rel => {
                    addRelation(relatedNode, rel.type, rel.reason);
                });
            }
        }
    })
    nameDropdown.style.display = "none";
    validateStep1();
    updateWizardButtons();
    updateDisabledStyles();
}

document.querySelectorAll(".editor-toolbar button").forEach(btn => {
    btn.addEventListener("click", () => {
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
    });
});

categorySearch.addEventListener("input", () => {
    const q = categorySearch.value.toLowerCase();
    categoryDropdown.innerHTML = "";
    const results = allCategories.filter(c =>
        c.toLowerCase().includes(q) &&
        !selectedCategories.includes(c)
    );
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

function showAllCategories() {
    categoryDropdown.innerHTML = "";
    const results = allCategories.filter(c =>
        !selectedCategories.includes(c)
    );
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

// DROPDOWN СВЯЗИ
relationSearch.addEventListener("focus", showAllRelation);
relationSearch.addEventListener("click", showAllRelation);
relationSearch.addEventListener("input", showAllRelation);

function showAllRelation() {
    const q = relationSearch.value.toLowerCase();
    relationDropdown.innerHTML = "";

    const currentType = getSelectedRelationType();   // "geo" или "history"

    const results = allNodes.filter(n => {
        if (n.id === editingNode?.id) return false; // нельзя связать с собой

        // Проверяем, есть ли уже связь именно с текущим выбранным типом
        const alreadyHasThisType = selectedRelations.some(r =>
            r.id === n.id && r.type === currentType
        );

        return !alreadyHasThisType &&
            n.name.toLowerCase().includes(q);
    });

    results.forEach(n => {
        const div = document.createElement("div");
        div.textContent = n.name;
        div.onclick = () => addRelation(n);
        relationDropdown.appendChild(div);
    });

    relationDropdown.style.display = "block";
}

// ====================== ADD RELATION ======================
function addRelation(node, forcedType = null, forcedReason = "") {
    const type = forcedType || getSelectedRelationType();
    // Запрет самопетли
    if (node.id === editingNode?.id) {
        showToast("Нельзя добавить связь объекта с самим собой");
        return;
    }
    const alreadyExists = selectedRelations.some(r =>
        r.id === node.id &&
        r.type === type
    );
    if (alreadyExists) {
        return;
    }
    const relation = {
        id: node.id,
        type,
        reason: forcedReason || ""
    };

    selectedRelations.push(relation);

    // Визуальное отображение тега
    const tag = document.createElement("div");
    const color = type === "geo" ? "#1C9284" : "#BC461B";
    tag.className = "tag";
    tag.style.background = color;
    tag.style.color = "white";
    const text = document.createElement("span");
    text.className = "tag-text";
    text.textContent = node.name;
    const removeBtn = document.createElement("span");
    removeBtn.className = "tag-remove";
    removeBtn.innerHTML = "✕";
    tag.appendChild(text);
    tag.appendChild(removeBtn);
    text.addEventListener("click", () => {
        if (type === "history") {
            openRelationReasonEditor(
                relation,
                tag,
                false);
        }
    });
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        askDeleteRelation(
            relation,
            tag);
    };
    selectedRelationsDiv.appendChild(tag);
    relationSearch.value = "";
    relationDropdown.style.display = "none";
    if (type === "history") {
        openRelationReasonEditor(
            relation,
            tag,
            true
        );
    }
    updateWizardButtons();
}

function openRelationReasonEditor(relation, tag, newRelation = false) {

    currentRelationEditing = relation;
    currentRelationTag = tag;
    isNewRelation = newRelation;

    relationReasonEditor.classList.remove("hidden");

    relationReasonInput.value =
        relation.reason || "";

    relationReasonCounter.textContent =
        `${relationReasonInput.value.length}/150`;

    document.querySelectorAll(".tag")
        .forEach(t => t.classList.remove("editing"));

    tag.classList.add("editing");
}

function closeRelationReasonEditor() {

    relationReasonEditor.classList.add("hidden");

    relationReasonInput.value = "";

    currentRelationEditing = null;

    if (currentRelationTag) {
        currentRelationTag.classList.remove("editing");
    }

    currentRelationTag = null;
    isNewRelation = false;
}

function askDeleteRelation(relation, tag) {
    pendingRelationDelete = { relation, tag };
    deleteRelationModal.style.display = "flex";
}

function removeRelation(relation, tag) {
    selectedRelations = selectedRelations.filter(r => r !== relation);
    if (tag) { tag.remove(); }
    if (currentRelationEditing === relation) {
        closeRelationReasonEditor();
    }
    updateWizardButtons();
}

relationDeleteNo.addEventListener("click", () => {
    deleteRelationModal.style.display = "none";
});

relationModalClose.addEventListener("click", () => {
    deleteRelationModal.style.display = "none";
});

relationDeleteYes.addEventListener("click", () => {
    if (pendingRelationDelete) {
        removeRelation(
            pendingRelationDelete.relation,
            pendingRelationDelete.tag);
    }
    pendingRelationDelete = null;
    deleteRelationModal.style.display = "none";
});

relationReasonInput.addEventListener("input", () => {

    relationReasonCounter.textContent =
        `${relationReasonInput.value.length}/150`;
});

saveRelationReasonBtn.addEventListener("click", () => {

    const text =
        relationReasonInput.value.trim();

    if (text.length < 3) {

        showToast("Укажите причину взаимосвязи");

        return;
    }

    currentRelationEditing.reason = text;

    closeRelationReasonEditor();
});

cancelRelationReasonBtn.addEventListener("click", () => {
    // если новая связь → удаляем её
    if (isNewRelation && currentRelationEditing) {
        selectedRelations =
            selectedRelations.filter(r => r !== currentRelationEditing);
        if (currentRelationTag) {
            currentRelationTag.remove();
        }
    }
    closeRelationReasonEditor();
});

// ПРЕДПРОСМОТР КАРТИНОК
imagesInput.addEventListener("change", () => {
    const files = Array.from(imagesInput.files);

    const total = existingImages.length + newImages.length;

    if (total >= MAX_IMAGES) {
        imagesInput.value = "";
        updateUploadVisibility();
        return;
    }

    const availableSlots = MAX_IMAGES - total;

    if (files.length > availableSlots) {
        showToast(`Можно добавить только ${availableSlots} изображений`);
    }

    const filesToAdd = files.slice(0, availableSlots).map(file => ({
        file,
        caption: ""
    }));

    newImages = [...newImages, ...filesToAdd];

    imagesInput.value = "";
    renderPreview();
});

function createRemoveButton(handler) {
    const button = document.createElement("div");

    button.textContent = "✕";

    Object.assign(button.style, {
        position: "absolute",
        top: "-5px",
        right: "-5px",
        background: "#ffffff",
        color: "#5D474E",
        fontWeight: "bold",
        fontSize: "12px",
        width: "18px",
        height: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        cursor: "pointer"
    });

    button.onclick = handler;

    return button;
}

function renderPreview() {
    preview.innerHTML = "";

    const all = [
        ...existingImages,
        ...newImages
    ];

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

            reader.onload = e => {
                img.src = e.target.result;
            };

            reader.readAsDataURL(item.file);
        } else {
            if (item?.src) {
                img.src = item.src;
            } else {
                console.warn("Bad image item:", item);
                return;
            }
        }

        const caption = document.createElement("div");
        caption.className = "preview-caption";
        caption.textContent = item.caption || "";

        const removeBtn = createRemoveButton((e) => {
            e.stopPropagation();

            if (item.type === "new") {
                newImages =
                    newImages.filter(f => f.file !== item.file);
            } else {
                existingImages =
                    existingImages.filter(i => i.src !== item.src);
            }

            renderPreview();
        });

        wrapper.addEventListener("click", () => {
            openImageEditor(item);
        });

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(removeBtn);

        wrapper.appendChild(imageWrapper);
        wrapper.appendChild(caption);

        preview.appendChild(wrapper);
    });

    updateUploadVisibility();
    updateWizardButtons();
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

    const captionInput =
        document.getElementById("imageCaptionInput");

    if (item) {

        if (item.credits) {

            imageCreditsToggle.checked = true;
            imageCreditsFields.style.display = "flex";

            imageAuthorInput.value =
                item.credits.author || "";

            imageSourceInput.value =
                item.credits.source || "";

            imageLicenseInput.value =
                item.credits.license || "";

        } else {

            imageCreditsToggle.checked = false;
            imageCreditsFields.style.display = "none";

            imageAuthorInput.value = "";
            imageSourceInput.value = "";
            imageLicenseInput.value = "";
        }

        // ИЩЕМ ГДЕ ЛЕЖИТ ОБЪЕКТ
        currentEditingIndex =
            existingImages.indexOf(item);

        currentEditingCollection = existingImages;

        if (currentEditingIndex === -1) {

            currentEditingIndex =
                newImages.indexOf(item);

            currentEditingCollection = newImages;
        }

        tempImageData = structuredClone(item);

        addUrlBtn.textContent = "Изменить";

        captionInput.value = item.caption || "";
        imageLicenseInput.value = item.license || "";

        // FILE
        if (item.file) {

            const reader = new FileReader();

            reader.onload = e => {
                showModalPreview(e.target.result);
            };

            reader.readAsDataURL(item.file);
        }

        // URL
        else {

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

        captionInput.value = "";
        imageUrlInput.value = "";

        hideModalPreview();
    }
    validateImageModal();
}

function updateUploadVisibility() {
    const total = existingImages.length + newImages.length;

    if (total >= MAX_IMAGES) {
        uploadBox.style.display = "none";
    } else {
        uploadBox.style.display = "flex";
    }
}
uploadBox.addEventListener("click", () => {
    openImageEditor();
});

uploadFromDevice.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        pendingFile = file;
        const reader = new FileReader();
        reader.onload = e => {
            showModalPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };
    input.click();
});

removeModalPreview.addEventListener("click", () => {
    hideModalPreview();
});

addUrlBtn.addEventListener("click", () => {

    const caption = document.getElementById("imageCaptionInput")
        .value.trim();
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
        Object.keys(credits).forEach(key => {
            if (!credits[key]) {
                delete credits[key];
            }
        });
        if (Object.keys(credits).length === 0) {
            credits = null;
        }
    }

    // РЕДАКТИРОВАНИЕ
    if (currentEditingImage) {

        currentEditingImage.caption = caption;
        if (credits) {
            currentEditingImage.credits = credits;
        } else {
            delete currentEditingImage.credits;
        }

        // НОВЫЙ FILE
        if (pendingFile) {
            currentEditingImage.file = pendingFile;
            delete currentEditingImage.src;
            currentEditingImage.type = "new";
        }

        // НОВЫЙ URL
        else if (url) {
            currentEditingImage.src = url;
            delete currentEditingImage.file;
            currentEditingImage.type = "url";
        }
        imageModal.style.display = "none";
        renderPreview();
        return;
    }

    // СОЗДАНИЕ FILE
    if (pendingFile) {
        newImages.push({
            file: pendingFile,
            caption,
            credits,
            type: "new"
        });
        imageModal.style.display = "none";
        renderPreview();
        return;
    }
    if (!url) {
        showToast("Добавьте изображение");
        return;
    }

    existingImages.push({
        src: url,
        caption,
        credits,
        type: "url"
    });

    imageModal.style.display = "none";

    renderPreview();
});

closeImageModal.addEventListener("click", () => {
    const confirmClose = confirm("Сбросить изменения?");
    if (!confirmClose) return;
    imageModal.style.display = "none";
    pendingFile = null;
    if (tempImageData && currentEditingImage) {
        Object.keys(currentEditingImage)
            .forEach(key => delete currentEditingImage[key]);
        Object.assign(currentEditingImage, tempImageData);
    }
    hideModalPreview();
});

//УВЕДОМЛЕНИЯ
function showToast(text) {
    toast.textContent = text
    toast.classList.add("show")
    setTimeout(() => {
        toast.classList.remove("show")
    }, 10000)
}

const nameCounter = document.getElementById("name-counter");

//ОТПРАВКА ФОРМЫ
form.addEventListener("submit", async (e) => {
    e.preventDefault()

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
        src,
        caption: newImages[i]?.caption ?? "",
        credits: newImages[i]?.credits ?? null
    }));

    const normalizedExisting = existingImages.map(i => ({
        src: i.src,
        caption: i.caption ?? "",
        credits: i.credits ?? null
    }));

    const allImages = [...normalizedExisting, ...newImageObjects];

    const invalidHistoryRelation =
        selectedRelations.find(r => r.type === "history" &&
            (!r.reason || r.reason.trim().length < 3));
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
            description: {
                text: descInput.innerHTML,
                images: allImages
            },
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
    }

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
    }

    const res = await fetch("http://localhost:5000/places", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    })
    if (res.ok) {
        showToast(editingNode ? "Изменения сохранены" : "Вершина добавлена");
        await fetchGraphData();
        clearForm();   // полностью сбрасываем ВСЁ
        editingNode = null;
    } else {
        showToast("Ошибка сохранения")
    }
})

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

//ОЧИСТКА ФОРМЫ
function clearForm() {

    mode = "add";
    editingNode = null;

    clearTextFields();
    clearRelations();
    clearCategories();
    clearImages();

    selectedIcon = "";

    iconPicker
        .querySelectorAll("svg")
        .forEach(svg => svg.classList.remove("active"));

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

    document.getElementById("save-btn").textContent =
        "Добавить вершину";

    currentStep = 1;
    updateStepsUI();
    validateStep1();
    updateUploadVisibility();
    updateWizardButtons();
    updateDisabledStyles();
}

// ======================
// RESET FORM
resetNo.addEventListener("click", () => {
    resetModal.style.display = "none";
});

resetModalClose.addEventListener("click", () => {
    resetModal.style.display = "none";
});

resetYes.addEventListener("click", () => {

    resetModal.style.display = "none";

    clearForm();

    showToast("Изменения сброшены");
});

document.addEventListener("click", (e) => {

    const isClickInside =
        nameInput.contains(e.target) ||
        nameDropdown.contains(e.target) ||

        categorySearch.contains(e.target) ||
        categoryDropdown.contains(e.target) ||

        relationSearch.contains(e.target) ||
        relationDropdown.contains(e.target);

    if (!isClickInside) {
        nameDropdown.style.display = "none";
        categoryDropdown.style.display = "none";
        relationDropdown.style.display = "none";
    }
});

document.querySelectorAll(".editor-tabs .tab").forEach(tab => {

    tab.addEventListener("click", () => {
        const tabsContainer = tab.closest(".editor-tabs");
        const contentContainer = document.querySelector(".tab-content");
        tabsContainer.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        contentContainer.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");
    });
});

// =========================
// WIZARD STEPS
// =========================

let currentStep = 1;

const stepBlocks =
    document.querySelectorAll(".form-step");

const stepIndicators =
    document.querySelectorAll(".step");

function updateStepsUI() {

    stepBlocks.forEach(block => {

        block.classList.toggle(
            "active",
            Number(block.dataset.step) === currentStep
        );
    });

    stepIndicators.forEach(step => {

        const stepNum =
            Number(step.dataset.step);

        step.classList.remove(
            "active",
            "completed"
        );

        if (stepNum === currentStep) {
            step.classList.add("active");
        }

        if (stepNum < currentStep) {
            step.classList.add("completed");
        }
    });
}

document.querySelectorAll(".next-step")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            if (currentStep < 3) {
                currentStep++;
                updateStepsUI();
            }
        });
    });

document.querySelectorAll(".prev-step")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            if (currentStep > 1) {
                currentStep--;
                updateStepsUI();
            }
        });
    });

// ====================== АДМИН ВКЛАДКИ ======================

let currentTab = "editor";

async function initAdminInterface() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    if (user.role === "admin") {
        document.getElementById("tab-users").style.display = "inline-flex";
        document.getElementById("tab-history").style.display = "inline-flex";
    }
}

function switchTab(tab) {

    currentTab = tab;

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.id === `tab-${tab}`
        );
    });

    const form = document.getElementById("form");
    const usersPanel =
        document.getElementById("users-panel");
    const historyPanel =
        document.getElementById("history-panel");

    form.style.display =
        tab === "editor" ? "block" : "none";

    usersPanel.style.display =
        tab === "users" ? "block" : "none";

    historyPanel.style.display =
        tab === "history" ? "block" : "none";

    if (tab === "users") {
        loadUsersPanel();
    }

    if (tab === "history") {
        loadHistoryPanel();
    }
}

// Привязываем кнопки
document.getElementById("tab-editor").addEventListener("click", () => switchTab("editor"));
document.getElementById("tab-users").addEventListener("click", () => switchTab("users"));
document.getElementById("tab-history").addEventListener("click", () => switchTab("history"));

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", () => {
    initAdminInterface();
    // Если нужно открыть сразу определённую вкладку из URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'users') switchTab('users');
});

updateStepsUI();

// ======================
// USERS PANEL
// ======================

async function loadUsersPanel() {

    const token = localStorage.getItem("token");

    const res = await fetch(
        "http://localhost:5000/users",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!res.ok) return;

    const users = await res.json();

    const container =
        document.getElementById("users-list");

    container.innerHTML = "";

    users.forEach(user => {

        const card =
            document.createElement("div");

        card.className = "user-card";

        card.innerHTML = `
            <div class="user-info">
                <div class="user-name">
                    ${user.login}
                </div>

                <div class="user-role">
                    ${user.role}
                </div>
            </div>

            <div class="user-actions">
                <button
                    class="admin-small-btn edit"
                    onclick="changeUserRole('${user.id}', '${user.role}')"
                >
                    Сменить роль
                </button>

                <button
                    class="admin-small-btn delete"
                    onclick="deleteUser('${user.id}')"
                >
                    Удалить
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// ======================
// HISTORY PANEL
// ======================

async function loadHistoryPanel() {

    const token = localStorage.getItem("token");

    const res = await fetch(
        "http://localhost:5000/history",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!res.ok) return;

    const history = await res.json();

    const container =
        document.getElementById("history-list");

    container.innerHTML = "";

    history.reverse().forEach(item => {

        const card =
            document.createElement("div");

        card.className = "history-card";

        card.innerHTML = `
            <div class="history-info">

                <div class="history-action">
                    ${item.user}
                </div>

                <div class="history-date">
                    ${item.action}
                </div>

                <div class="history-date">
                    ${new Date(item.date)
                .toLocaleString()}
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}

// ======================
// CREATE USER
// ======================

const createUserModal =
    document.getElementById("createUserModal");

document
    .getElementById("open-create-user")
    .addEventListener("click", () => {

        createUserModal.style.display = "flex";
    });

document
    .getElementById("closeCreateUserModal")
    .addEventListener("click", () => {

        createUserModal.style.display = "none";
    });

document
    .getElementById("create-user-btn")
    .addEventListener("click", async () => {

        const login =
            document
                .getElementById("new-user-login")
                .value
                .trim();

        const password =
            document
                .getElementById("new-user-password")
                .value
                .trim();

        const role =
            document
                .getElementById("new-user-role")
                .value;

        if (!login || !password) {
            showToast("Заполните все поля");
            return;
        }

        const token =
            localStorage.getItem("token");

        const res = await fetch(
            "http://localhost:5000/users",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    login,
                    password,
                    role
                })
            }
        );

        if (res.ok) {

            createUserModal.style.display =
                "none";

            loadUsersPanel();

            showToast("Пользователь создан");

        } else {

            showToast("Ошибка создания");
        }
    });

// ======================
// CHANGE ROLE
// ======================

async function changeUserRole(id, currentRole) {

    const newRole =
        currentRole === "admin"
            ? "editor"
            : "admin";

    const token =
        localStorage.getItem("token");

    const res = await fetch(
        `http://localhost:5000/users/${id}/role`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
                role: newRole
            })
        }
    );

    if (res.ok) {

        loadUsersPanel();

        showToast("Роль изменена");
    }
}

// ======================
// DELETE USER
// ======================

async function deleteUser(id) {

    const confirmDelete =
        confirm("Удалить пользователя?");

    if (!confirmDelete) return;

    const token =
        localStorage.getItem("token");

    const res = await fetch(
        `http://localhost:5000/users/${id}`,
        {
            method: "DELETE",

            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (res.ok) {

        loadUsersPanel();

        showToast("Пользователь удалён");
    }
}

