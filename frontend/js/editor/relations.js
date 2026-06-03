// Работа со связями
function showAllRelation() {
    const q = relationSearch.value.toLowerCase();
    relationDropdown.innerHTML = "";
    const currentType = getSelectedRelationType();
    const results = allNodes.filter(n => {
        if (n.id === editingNode?.id) return false;
        const alreadyHasThisType = selectedRelations.some(r => r.id === n.id && r.type === currentType);
        return !alreadyHasThisType && n.name.toLowerCase().includes(q);
    });
    results.forEach(n => {
        const div = document.createElement("div");
        div.textContent = n.name;
        div.onclick = () => addRelation(n);
        relationDropdown.appendChild(div);
    });
    relationDropdown.style.display = "block";
}

function addRelation(node, forcedType = null, forcedReason = "") {
    const type = forcedType || getSelectedRelationType();
    if (node.id === editingNode?.id) {
        showToast("Нельзя добавить связь объекта с самим собой");
        return;
    }
    const alreadyExists = selectedRelations.some(r => r.id === node.id && r.type === type);
    if (alreadyExists) return;
    const relation = { id: node.id, type, reason: forcedReason || "" };
    selectedRelations.push(relation);
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
        if (type === "history") openRelationReasonEditor(relation, tag, false);
    });
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        askDeleteRelation(relation, tag);
    };
    selectedRelationsDiv.appendChild(tag);
    relationSearch.value = "";
    relationDropdown.style.display = "none";
    if (type === "history") openRelationReasonEditor(relation, tag, true);
    updateWizardButtons();
}

function openRelationReasonEditor(relation, tag, newRelation = false) {
    currentRelationEditing = relation;
    currentRelationTag = tag;
    isNewRelation = newRelation;
    relationReasonEditor.classList.remove("hidden");
    relationReasonInput.value = relation.reason || "";
    relationReasonCounter.textContent = `${relationReasonInput.value.length}/150`;
    document.querySelectorAll(".tag").forEach(t => t.classList.remove("editing"));
    tag.classList.add("editing");
}

function closeRelationReasonEditor() {
    relationReasonEditor.classList.add("hidden");
    relationReasonInput.value = "";
    currentRelationEditing = null;
    if (currentRelationTag) currentRelationTag.classList.remove("editing");
    currentRelationTag = null;
    isNewRelation = false;
}

function askDeleteRelation(relation, tag) {
    pendingRelationDelete = { relation, tag };
    deleteRelationModal.style.display = "flex";
}

function removeRelation(relation, tag) {
    selectedRelations = selectedRelations.filter(r => r !== relation);
    if (tag) tag.remove();
    if (currentRelationEditing === relation) closeRelationReasonEditor();
    updateWizardButtons();
}