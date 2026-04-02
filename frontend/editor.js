if (localStorage.getItem("auth") !== "true") {
  window.location.href = "login.html";
}

document.getElementById("logout-btn").onclick = () => {
  localStorage.removeItem("auth");
  window.location.href = "login.html";
};

let mode = "add"

let allNodes = []
let allEdges = []

let selectedRelations = []
let editingNode = null

const nameInput = document.getElementById("name-input")
const nameDropdown = document.getElementById("name-dropdown")

const categorySearch = document.getElementById("category-input");
const categoryDropdown = document.getElementById("category-dropdown");
const selectedCategoriesDiv = document.getElementById("selected-categories");

const allCategories = ["культура", "молодежь", "туризм"];

let selectedCategories = [];
const categoryInput = document.getElementById("category-input")
const descInput = document.getElementById("desc-input")

let selectedIcon = "icons/default.png";
const iconPicker = document.getElementById("icon-picker");

const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

const iconDescriptions = {
  "icons/parthenon.png": "Музеи, театры, библиотеки и др.",
  "icons/church.png": "Церкви, храмы, соборы и др.",
  "icons/nature.png": "Природные зоны, Листвянка, Байкал и др.",
  "icons/monument.png": "Памятники, монументы и др.",
  "icons/buildings.png": "Инфрастукутура города, мосты, улицы и др.",
  "icons/user.png": "Исторические личности, писатели и др."
};

let existingImages = [];
let newImages = [];   

const imagesInput = document.getElementById("images-input")
const preview = document.getElementById("image-preview")

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

// ЗАГРУЗКА ДАННЫХ
async function loadNodes() {
    const res = await fetch("http://localhost:5000/places")
    const data = await res.json()
    allNodes = data.nodes
    allEdges = data.edges
}
loadNodes()


// ЗАГРУЗКА ИЗОБРАЖЕНИЙ
async function uploadImages() {
    if (newImages.length === 0) return [];
    const formData = new FormData();
    for (let file of newImages) {
        formData.append("images", file);
    }
    const res = await fetch("http://localhost:5000/upload-images", {
        method: "POST",
        body: formData
    });
    const data = await res.json();
    return data.images;
}
// ИКОНКИ
iconPicker.querySelectorAll("img").forEach(img => {
    img.onclick = () => {
        selectedIcon = img.dataset.icon;

        iconPicker.querySelectorAll("img")
            .forEach(i => i.classList.remove("active"));

        img.classList.add("active");
    };
// ТУЛТИПЫ
    img.onmouseenter = (e) => {
        const text = iconDescriptions[img.dataset.icon] || "";

        tooltip.textContent = text;
        tooltip.style.opacity = "1";
    };
    img.onmousemove = (e) => {
        tooltip.style.left = e.clientX + 15 + "px";
        tooltip.style.top = e.clientY + 15 + "px";
    };
    img.onmouseleave = () => {
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

    selectedCategories.forEach(cat => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = cat + " ✕";

        tag.onclick = () => {
            selectedCategories = selectedCategories.filter(c => c !== cat);
            tag.remove();
        };

        selectedCategoriesDiv.appendChild(tag);
    });
    descInput.value = node.description || ""
    existingImages = node.images || [];
    newImages = [];

    renderPreview();
    selectedIcon = node.icon || "icons/parthenon.png";
    iconPicker.querySelectorAll("img").forEach(img => {
        img.classList.toggle("active", img.dataset.icon === selectedIcon)
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
        if (relatedNode) addRelation(relatedNode)
    })
    nameDropdown.style.display = "none"
}

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
        !selectedRelations.includes(n.id)
    )
    results.forEach(n => {
        const div = document.createElement("div")
        div.textContent = n.name
        div.onclick = () => addRelation(n)
        relationDropdown.appendChild(div)
    })
    relationDropdown.style.display = "block"
};

function addRelation(node) {
    selectedRelations.push(node.id)
    const tag = document.createElement("span")
    tag.className = "tag"
    tag.textContent = node.name + "    ✕"
    tag.onclick = () => {
        selectedRelations =
            selectedRelations.filter(id => id !== node.id)
        tag.remove()
    }
    selectedRelationsDiv.appendChild(tag)
    relationSearch.value = ""
    relationDropdown.style.display = "none"
}

// ПРЕДПРОСМОТР КАРТИНОК
imagesInput.addEventListener("change", () => {
    const files = Array.from(imagesInput.files);
    newImages = [...files, ...newImages];
    renderPreview();
});

function renderPreview() {
    preview.innerHTML = "";

    const all = [
        ...newImages.map(f => ({ type: "new", file: f })),
        ...existingImages.map(url => ({ type: "old", url }))
    ];

    all.forEach(item => {

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";

        const img = document.createElement("img");

        if (item.type === "new") {
            const reader = new FileReader();

            reader.onload = function (e) {
                img.src = e.target.result;
            };

            reader.readAsDataURL(item.file);
        } else {
            img.src = item.url;
        }

        const removeBtn = document.createElement("div");
        removeBtn.textContent = "✕";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "2px";
        removeBtn.style.right = "2px";
        removeBtn.style.background = "rgba(0,0,0,0.6)";
        removeBtn.style.color = "white";
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
                newImages = newImages.filter(f => f !== item.file);
            } else {
                existingImages = existingImages.filter(u => u !== item.url);
            }

            renderPreview();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        preview.appendChild(wrapper);
    });
}

//УВЕДОМЛЕНИЯ
function showToast(text) {
    toast.textContent = text
    toast.classList.add("show")
    setTimeout(() => {
        toast.classList.remove("show")
    }, 10000)
}

//ОТПРАВКА ФОРМЫ
form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const uploadedImages = await uploadImages();

    const allImages = [...existingImages, ...uploadedImages];
    const nodeData = {
        id: editingNode?.id || Date.now().toString(),
        name: nameInput.value,
        category: selectedCategories,
        description: descInput.value,
        images: allImages,
        icon: selectedIcon
    };
    const body = {
        node: nodeData,
        relatedIds: selectedRelations,
        mode: editingNode ? "edit" : "add"
    }
    const res = await fetch("http://localhost:5000/places", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    if (res.ok) {
        showToast("Изменения сохранены")
        await reloadGraph()
        if (mode === "add") {
            clearForm()
        }
    } else {
        showToast("Ошибка сохранения")
    }
})

//ОЧИСТКА ФОРМЫ
function clearForm() {

    editingNode = null

    nameInput.value = ""
    descInput.value = ""
    categorySearch.value = ""
    relationSearch.value = ""

    imagesInput.value = ""
    preview.innerHTML = ""
    existingImages = []
    newImages = []

    selectedCategories = []
    selectedCategoriesDiv.innerHTML = ""

    selectedRelations = []
    selectedRelationsDiv.innerHTML = ""

    nameDropdown.style.display = "none"
    categoryDropdown.style.display = "none"
    relationDropdown.style.display = "none"

    document.activeElement.blur()

    selectedIcon = "icons/parthenon.png";
    iconPicker.querySelectorAll("img").forEach(img => {
        img.classList.remove("active");
    })
}

//ОБНОВЛЕНИЕ ДАННЫХ
async function reloadGraph() {
    const res = await fetch("http://localhost:5000/places")
    const data = await res.json()
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
