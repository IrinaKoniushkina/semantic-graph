if (localStorage.getItem("auth") !== "true") {
    window.location.href = "login.html";
}

document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("auth");
    window.location.href = "login.html";
};

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

const MAX_IMAGES = 5;
let existingImages = [];
let newImages = [];

const imagesInput = document.getElementById("images-input")
const preview = document.getElementById("image-preview")
const uploadBox = document.querySelector(".upload-box");

const relationSearch = document.getElementById("relation-search")
const relationDropdown = document.getElementById("relation-dropdown")
const selectedRelationsDiv = document.getElementById("selected-relations")

const form = document.getElementById("form")

const btnAdd = document.getElementById("mode-add")
const btnEdit = document.getElementById("mode-edit")
const title = document.getElementById("title")

const deleteBtn = document.getElementById("delete-btn")

const modal = document.getElementById("deleteModal")
const deleteYes = document.getElementById("deleteYes")
const deleteNo = document.getElementById("deleteNo")
const modalClose = document.getElementById("modalClose")

const toast = document.getElementById("toast")

const imageModal = document.getElementById("imageModal");
const uploadFromDevice = document.getElementById("uploadFromDevice");
const closeImageModal = document.getElementById("closeImageModal");
const addUrlBtn = document.getElementById("addUrlBtn");
const imageUrlInput = document.getElementById("imageUrlInput");

const tagTooltip = document.createElement("div");
tagTooltip.className = "tag-tooltip";
document.body.appendChild(tagTooltip);

// ЗАГРУЗКА ДАННЫХ
async function loadNodes() {
    const res = await fetch("http://localhost:5000/places")
    const data = await res.json()
    allNodes = data.nodes
    allEdges = data.edges
}
loadNodes()

function getSelectedRelationType() {
    const selected = document.querySelector('input[name="type-relations"]:checked');
    return selected?.value === "history-relation" ? "history" : "geo";
}

const limits = {
    name: { min: 3, max: 30 },
    desc: { min: 250, max: 500 },
    keywords: { min: 10, max: 150 },
    history: { min: 1000, max: 1500 },
    modern: { min: 1000, max: 1500 }
};

function updateCounter(input, counter, max) {
    const length = getTextLength(input);

    counter.textContent = `${length}/${max}`;
    counter.style.color = length > max ? "red" : "#888";
}

function getTextLength(input) {
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

function validate() {
    if (nameInput.value.length < 3) {
        alert("Название слишком короткое");
        return false;
    }

    if (getTextLength(descInput) < 250) {
        alert("Слишком короткий текст");
        return false;
    }

    if (getTextLength(historyInput) < 1000) {
        alert("Слишком короткий текст");
        return false;
    }

    if (getTextLength(modernInput) < 1000) {
        alert("Слишком короткий текст");
        return false;
    }

    return true;
}



// ЗАГРУЗКА ИЗОБРАЖЕНИЙ
async function uploadImages() {
    if (newImages.length === 0) return [];

    const formData = new FormData();

    for (let item of newImages) {
        formData.append("images", item.file);
    }

    const res = await fetch("http://localhost:5000/upload-images", {
        method: "POST",
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
    svg.onclick = () => {
        selectedIcon = svg.dataset.icon;

        iconPicker.querySelectorAll("svg")
            .forEach(i => i.classList.remove("active"));

        svg.classList.add("active");
    };
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
btnEdit.onclick = () => {
    clearForm()
    mode = "edit"
    deleteBtn.style.display = "inline-block"
    btnAdd.style.display = "inline-block"
    btnEdit.style.display = "none"
    btnEdit.classList.add("active")
    btnAdd.classList.remove("active")
    title.textContent = "Редактировать вершину"
    document.getElementById("save-btn").textContent = "Сохранить изменения"
}

btnAdd.onclick = () => {
    clearForm()
    mode = "add"
    deleteBtn.style.display = "none"
    btnEdit.style.display = "inline-block"
    btnAdd.style.display = "none"
    btnAdd.classList.add("active")
    btnEdit.classList.remove("active")
    title.textContent = "Добавить вершину"
    document.getElementById("save-btn").textContent = "Добавить вершину в граф"
}

//УДАЛЕНИЕ ВЕРШИНЫ
deleteBtn.onclick = () => {
    if (!editingNode) return
    modal.style.display = "flex"
}

deleteNo.onclick = () => modal.style.display = "none"
modalClose.onclick = () => modal.style.display = "none"

deleteYes.onclick = async () => {
    await fetch("http://localhost:5000/places/" + editingNode.id, {
        method: "DELETE"
    })
    modal.style.display = "none"
    showToast("Вершина удалена")
    clearForm()
    editingNode = null
    await reloadGraph()
}

nameInput.addEventListener("focus", () => {
    showNameDropdown("");
});
nameInput.addEventListener("click", () => {
    showNameDropdown("");
});
nameInput.addEventListener("input", () => {
    showNameDropdown(nameInput.value);
});

//АВТОЗАПОЛНЕНИЕ
function showNameDropdown(filter = "") {
    if (mode !== "edit") return;
    nameDropdown.innerHTML = "";
    const results = allNodes.filter(n =>
        n.name.toLowerCase().includes(filter.toLowerCase())
    );
    results.forEach(n => {
        const div = document.createElement("div");
        div.textContent = n.name;
        div.onclick = () => selectNode(n);
        nameDropdown.appendChild(div);
    });
    if (results.length === 0) {
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
        tag.textContent = cat + " ✕";

        tag.onclick = () => {
            selectedRelations =
                selectedRelations.filter(r =>
                    !(r.id === node.id && r.type === type)
                );
            tag.remove();
        };

        selectedCategoriesDiv.appendChild(tag);
    });
    descInput.innerHTML = node.content?.description?.text || "";
    historyInput.innerHTML = node.content?.history || "";
    modernInput.innerHTML = node.content?.modern || "";

    existingImages = node.content?.description?.images || []
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
        const relatedId =
            edge.source === node.id ? edge.target : edge.source

        const relatedNode = allNodes.find(n => n.id === relatedId)

        if (relatedNode) {
            addRelation(relatedNode, edge.type)
        }
    })
    nameDropdown.style.display = "none"
}

document.querySelectorAll(".editor-toolbar button").forEach(btn => {
    btn.onclick = () => {
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
    };
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
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = cat + " ✕";
    tag.onclick = () => {
        selectedCategories = selectedCategories.filter(c => c !== cat);
        tag.remove();
    };
    selectedCategoriesDiv.appendChild(tag);
    categorySearch.value = "";
    categoryDropdown.style.display = "none";
}

// DROPDOWN СВЯЗИ
relationSearch.addEventListener("focus", showAllRelation);
relationSearch.addEventListener("click", showAllRelation);
relationSearch.addEventListener("input", showAllRelation);

function showAllRelation() {
    const q = relationSearch.value.toLowerCase()
    relationDropdown.innerHTML = ""
    const results = allNodes.filter(n =>
        n.name.toLowerCase().includes(q) &&
        !selectedRelations.some(r => r.id === n.id)
    )
    results.forEach(n => {
        const div = document.createElement("div")
        div.textContent = n.name
        div.onclick = () => addRelation(n)
        relationDropdown.appendChild(div)
    })
    relationDropdown.style.display = "block"
};

function addRelation(node, forcedType = null) {
    const type = forcedType || getSelectedRelationType();
    if (selectedRelations.some(r => r.id === node.id && r.type === type)) return;
    selectedRelations.push({
        id: node.id,
        type: type
    });
    const tag = document.createElement("span");
    const color = type === "geo" ? "#1C9284" : "#BC461B";
    tag.style.background = color;
    tag.style.color = "#ccc";
    tag.className = "tag";
    tag.textContent = node.name + " ✕";

    // tooltip
    tag.onmouseenter = (e) => {
        tagTooltip.textContent = node.name;
        tagTooltip.style.opacity = "1";
    };

    tag.onmousemove = (e) => {
        tagTooltip.style.left = e.pageX + 10 + "px";
        tagTooltip.style.top = e.pageY + 10 + "px";
    };

    tag.onmouseleave = () => {
        tagTooltip.style.opacity = "0";
    };

    // удаление
    tag.onclick = () => {
        selectedRelations =
            selectedRelations.filter(r => r.id !== node.id);
        tag.remove();
    };

    selectedRelationsDiv.appendChild(tag);
    relationSearch.value = ""
    relationDropdown.style.display = "none"
}

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

const labelsForImg = document.getElementById("labelsForImg");
function renderPreview() {
    preview.innerHTML = "";
    labelsForImg.innerHTML = "";

    const all = [
        ...existingImages.map(obj => ({
            type: "old",
            ...obj
        })),
        ...newImages.map(item => ({
            type: "new",
            ...item
        }))
    ];

    all.forEach((item, index) => {

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";

        const img = document.createElement("img");
        img.style.width = "100%";
        img.style.borderRadius = "6px";

        if (item.type === "new") {
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            reader.readAsDataURL(item.file);
        }
        else if (item.type === "url") {
            img.src = item.src;
        }
        else {
            img.src = item.src;
        }

        // ПОДПИСЬ
        const captionInput = document.createElement("input");
        captionInput.placeholder = "Подпись";
        captionInput.value = item.caption || "";
        captionInput.style.width = "80%";
        captionInput.style.fontSize = "14px";
        captionInput.style.padding = "5px";

        captionInput.oninput = () => {
            if (item.type === "new") {
                const target = newImages.find(f => f.file === item.file);
                if (target) target.caption = captionInput.value;
            } else {
                const target = existingImages.find(i => i.src === item.src);
                if (target) target.caption = captionInput.value;
            }
        };

        // УДАЛЕНИЕ
        const removeBtn = document.createElement("div");
        removeBtn.textContent = "✕";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "-5px";
        removeBtn.style.right = "-5px";
        removeBtn.style.background = "#ffffff";
        removeBtn.style.color = "#5D474E";
        removeBtn.style.fontWeight = "bold";
        removeBtn.style.fontSize = "12px";
        removeBtn.style.width = "18px";
        removeBtn.style.height = "18px";
        removeBtn.style.display = "flex";
        removeBtn.style.alignItems = "center";
        removeBtn.style.justifyContent = "center";
        removeBtn.style.borderRadius = "50%";
        removeBtn.style.cursor = "pointer";


        removeBtn.onclick = () => {
            if (item.type === "new") {
                newImages = newImages.filter(f => f.file !== item.file);
            } else {
                existingImages = existingImages.filter(i => i.src !== item.src);
            }
            renderPreview();
        };

        // НОМЕР
        const numberImg = document.createElement("div");
        numberImg.textContent = index + 1;
        numberImg.style.position = "absolute";
        numberImg.style.bottom = "0px";
        numberImg.style.right = "-5px";
        numberImg.style.background = "#ffffff";
        numberImg.style.color = "#5D474E";
        numberImg.style.fontWeight = "bold";
        numberImg.style.fontSize = "12px";
        numberImg.style.width = "18px";
        numberImg.style.height = "18px";
        numberImg.style.display = "flex";
        numberImg.style.alignItems = "center";
        numberImg.style.justifyContent = "center";
        numberImg.style.borderRadius = "50%";

        const labelWrapper = document.createElement("div");
        labelWrapper.style.display = "flex";
        labelWrapper.style.width = "100%";
        labelWrapper.style.alignItems = "center";
        labelWrapper.style.gap = "15px";
        labelWrapper.style.marginBottom = "6px";

        // номер слева
        const labelNumber = document.createElement("div");
        labelNumber.textContent = index + 1;
        labelNumber.style.fontSize = "20px";

        // добавляем
        labelWrapper.appendChild(labelNumber);
        labelWrapper.appendChild(captionInput);
        labelsForImg.appendChild(labelWrapper);

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        wrapper.appendChild(numberImg);
        preview.appendChild(wrapper);
    });
    updateUploadVisibility();
}

function updateUploadVisibility() {
    const total = existingImages.length + newImages.length;

    if (total >= MAX_IMAGES) {
        uploadBox.style.display = "none";
    } else {
        uploadBox.style.display = "flex";
    }
}
uploadBox.onclick = () => {
    imageModal.style.display = "flex";
};

uploadFromDevice.onclick = () => {
    imageModal.style.display = "none";
    imagesInput.click(); // вручную открываем выбор файла
};

addUrlBtn.onclick = () => {
    const url = imageUrlInput.value.trim();

    if (!url) return;

    const total = existingImages.length + newImages.length;

    if (total >= MAX_IMAGES) return;

    // проверка что это картинка (очень желательно)
    const img = new Image();
    img.onload = () => {

        existingImages.push({
            src: url,
            caption: "",
            type: "url"
        });

        imageUrlInput.value = "";
        imageModal.style.display = "none";

        renderPreview();
    };

    img.onerror = () => {
        showToast("Неверная ссылка на изображение");
    };

    img.src = url;
};

closeImageModal.onclick = () => {
    imageModal.style.display = "none";
};

//УВЕДОМЛЕНИЯ
function showToast(text) {
    toast.textContent = text
    toast.classList.add("show")
    setTimeout(() => {
        toast.classList.remove("show")
    }, 10000)
}

const nameError = document.getElementById("name-error");
const editLink = document.getElementById("edit-link");
let duplicateNode = null;
const nameCounter = document.getElementById("name-counter");

function checkDuplicateName() {
    const value = nameInput.value.trim().toLowerCase();

    duplicateNode = allNodes.find(n =>
        n.name.toLowerCase() === value &&
        (!editingNode || n.id !== editingNode.id)
    );

    if (mode === "add" && duplicateNode) {
        nameInput.classList.add("error");
        nameError.style.display = "block";
        nameCounter.style.bottom = "31px";
        return true;
    } else {
        nameInput.classList.remove("error");
        nameError.style.display = "none";
        nameCounter.style.bottom = "12px";
        duplicateNode = null;
        return false;
    }
}

editLink.onclick = () => {
    if (!duplicateNode) return;

    // переключаем режим
    mode = "edit";
    btnEdit.style.display = "none";
    btnAdd.style.display = "inline-block";
    deleteBtn.style.display = "inline-block";

    title.textContent = "Редактировать вершину";
    document.getElementById("save-btn").textContent = "Сохранить изменения";

    // загружаем вершину
    selectNode(duplicateNode);

    // скрываем ошибку
    nameError.style.display = "none";
    nameInput.classList.remove("error");
    nameCounter.style.removeProperty("bottom");
};

nameInput.addEventListener("input", checkDuplicateName);

//ОТПРАВКА ФОРМЫ
form.addEventListener("submit", async (e) => {
    e.preventDefault()
    if (checkDuplicateName()) {
        showToast("Исправьте ошибки перед сохранением");
        return;
    }

    // console.log(nodeData);
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
        caption: newImages[i]?.caption || ""
    }));

    const allImages = [
        ...existingImages,
        ...newImageObjects
    ];
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
        icon: selectedIcon
    };
    const body = {
        node: nodeData,
        related: selectedRelations.length ? selectedRelations : null,
        mode: editingNode ? "edit" : "add"
    }
    console.log("MODE:", editingNode ? "edit" : "add");
    const res = await fetch("http://localhost:5000/places", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    if (res.ok) {
        showToast(editingNode ? "Изменения сохранены" : "Вершина добавлена");
        await reloadGraph();
        clearForm();   // полностью сбрасываем ВСЁ
        editingNode = null;
    } else {
        showToast("Ошибка сохранения")
    }
})

//ОЧИСТКА ФОРМЫ
function clearForm() {

    // режим
    mode = "add";
    editingNode = null;

    // текст
    nameInput.value = "";
    keywordsInput.value = "";
    descInput.innerHTML = "";
    historyInput.innerHTML = "";
    modernInput.innerHTML = "";

    // категории
    selectedCategories = [];
    selectedCategoriesDiv.innerHTML = "";

    // связи
    selectedRelations = [];
    selectedRelationsDiv.innerHTML = "";

    // изображения
    existingImages = [];
    newImages = [];
    imagesInput.value = "";
    preview.innerHTML = "";
    labelsForImg.innerHTML = "";

    // UI
    nameDropdown.style.display = "none";
    categoryDropdown.style.display = "none";
    relationDropdown.style.display = "none";

    categorySearch.value = "";
    relationSearch.value = "";
    imageUrlInput.value = "";

    // иконка
    selectedIcon = "";
    iconPicker.querySelectorAll("svg")
        .forEach(svg => svg.classList.remove("active"));

    // кнопки режима
    btnAdd.style.display = "none";
    btnEdit.style.display = "inline-block";
    deleteBtn.style.display = "none";

    title.textContent = "Добавить вершину";
    document.getElementById("save-btn").textContent = "Добавить вершину в граф";

    updateUploadVisibility();
}

//ОБНОВЛЕНИЕ ДАННЫХ
async function reloadGraph() {
    const res = await fetch("http://localhost:5000/places")
    const data = await res.json()
    if (!res.ok) {
        const text = await res.text();
        console.error(text);
        throw new Error("Upload failed");
    }
    allNodes = data.nodes
    allEdges = data.edges
}

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
    tab.onclick = () => {

        const wrapper = tab.closest(".block2");

        wrapper.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        wrapper.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

        tab.classList.add("active");
        wrapper.querySelector("#" + tab.dataset.tab).classList.add("active");
    };
});