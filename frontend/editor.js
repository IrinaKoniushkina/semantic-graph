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

/* загрузка данных */
async function loadNodes() {
    const res = await fetch("http://localhost:5000/places")
    const data = await res.json()
    allNodes = data.nodes
    allEdges = data.edges
}
loadNodes()


/* загрузка изображений */
async function uploadImages() {
    const files = imagesInput.files
    if (files.length === 0) return []
    const formData = new FormData()
    for (let file of files) {
        formData.append("images", file)
    }
    const res = await fetch("http://localhost:5000/upload-images", {
        method: "POST",
        body: formData
    })
    const data = await res.json()
    return data.images
}
/*иконки*/
iconPicker.querySelectorAll("img").forEach(img => {
    img.onclick = () => {

        selectedIcon = img.dataset.icon;

        iconPicker.querySelectorAll("img")
            .forEach(i => i.classList.remove("active"));

        img.classList.add("active");
    };
});

/*    режимы    */
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

/* удаление */
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

/* автозаполнение названия */
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
    categoryInput.value = node.category || ""
    descInput.value = node.description || ""
    preview.innerHTML = ""
    if (node.images) {
        node.images.forEach(url => {
            const img = document.createElement("img")
            img.src = url
            img.style.margin = "5px"
            preview.appendChild(img)
        })
    }
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

/* связи */
relationSearch.addEventListener("focus", showAllRelation);
relationSearch.addEventListener("click", showAllRelation);

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

/*   - предпросмотр изображений   - */
imagesInput.addEventListener("change", () => {
    preview.innerHTML = ""
    const files = imagesInput.files
    for (let file of files) {
        const reader = new FileReader()
        reader.onload = function (e) {
            const img = document.createElement("img")
            img.src = e.target.result
            img.style.margin = "5px"
            preview.appendChild(img)
        }
        reader.readAsDataURL(file)
    }
})

/*    уведомление    */
function showToast(text) {
    toast.textContent = text
    toast.classList.add("show")
    setTimeout(() => {
        toast.classList.remove("show")
    }, 10000)
}

/* отправка формы */
form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const images = await uploadImages()
    const nodeData = {
        id: editingNode?.id || Date.now().toString(),
        name: nameInput.value,
        category: categoryInput.value.split(",").map(c => c.trim()).filter(Boolean),
        description: descInput.value,
        images: images,
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

/*   очистка формы   */
function clearForm() {

    // сброс состояния
    editingNode = null

    // текстовые поля
    nameInput.value = ""
    descInput.value = ""
    categorySearch.value = ""
    relationSearch.value = ""

    // изображения
    imagesInput.value = ""
    preview.innerHTML = ""

    // категории
    selectedCategories = []
    selectedCategoriesDiv.innerHTML = ""

    // связи
    selectedRelations = []
    selectedRelationsDiv.innerHTML = ""

    // dropdown'ы
    nameDropdown.style.display = "none"
    categoryDropdown.style.display = "none"
    relationDropdown.style.display = "none"

    // убираем фокус
    document.activeElement.blur()

    // убираем иконки
    selectedIcon = "icons/parthenon.png";
    iconPicker.querySelectorAll("img").forEach(img => {
        img.classList.remove("active");
    })
}

/* обновление данных */
async function reloadGraph() {
    const res = await fetch("http://localhost:5000/places")
    const data = await res.json()
    allNodes = data.nodes
    allEdges = data.edges
}
