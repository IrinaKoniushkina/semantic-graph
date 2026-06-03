function isNodeActive(node, query) {
    const keywords = Array.isArray(node.keywords) ? node.keywords.join(" ").toLowerCase() : (node.keywords || "").toLowerCase();
    const matchText = node.name.toLowerCase().includes(query) || keywords.includes(query);
    const matchCategory = selectedCategories.has("all") || node.category.some(cat => selectedCategories.has(cat));
    return matchCategory && matchText;
}

function isMatchedByKeyword(node, query) {
    if (!query) return false;
    const nameMatch = node.name.toLowerCase().includes(query);
    const keywordMatch = (node.keywords || "").toLowerCase().includes(query);
    return keywordMatch && !nameMatch;
}

function updateFilters() {
    const query = searchInput.property("value").toLowerCase();
    if (activeNode) {
        highlightConnections(activeNode);
        return;
    }
    const labels = nodeGroup.selectAll("text");
    const edges = linkGroup.selectAll("line");
    const nodes = nodeGroup.selectAll("g");
    labels.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);
    edges.style("opacity", d => isNodeActive(d.source, query) && isNodeActive(d.target, query) ? 1 : 0.05);
    nodes.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);
    labels.style("opacity", d => isNodeActive(d, query) ? 1 : 0.1);
}

function updateFilterLabel() {
    const container = filterToggle;
    if (selectedCategories.has("all")) {
        container.innerHTML = `Все <span class="category-circle" style="background: ${CATEGORY_COLORS.all};"></span>`;
        return;
    }
    const map = { культура: "Культура", молодежь: "Молодежь", туризм: "Туризм" };
    const names = Array.from(selectedCategories).map(cat => `${map[cat]} <span class="category-circle" style="background: ${CATEGORY_COLORS[cat]};"></span>`);
    container.innerHTML = names.join("");
}

function updateBackground() {
    let bg = categoryBackgrounds["all"];
    if (!selectedCategories.has("all")) {
        bg = categoryBackgrounds[lastSelectedCategory] || bg;
    }
    hiddenBg.style.backgroundImage = bg;
    hiddenBg.classList.add("active");
    activeBg.classList.remove("active");
    [activeBg, hiddenBg] = [hiddenBg, activeBg];
}

function initFilters(edges, labels, nodes, data) {
    searchInput = d3.select("#search");
    clearBtn = d3.select("#clear-search");
    filterToggle = document.getElementById("filter-toggle");
    filterMenu = document.getElementById("filter-menu");
    filterCheckboxes = filterMenu.querySelectorAll("input");

    searchInput.on("input", function () {
        clearBtn.style("display", this.value ? "block" : "none");
        updateFilters();
    });
    clearBtn.on("click", function () {
        searchInput.property("value", "");
        clearBtn.style("display", "none");
        updateFilters();
    });

    filterToggle.onclick = () => {
        filterMenu.style.display = filterMenu.style.display === "block" ? "none" : "block";
    };
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".filter-dropdown")) {
            filterMenu.style.display = "none";
        }
    });
    filterCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const value = cb.value;
            if (value === "all") {
                selectedCategories = new Set(["all"]);
                lastSelectedCategory = "all";
                filterCheckboxes.forEach(c => { c.checked = c.value === "all"; });
            } else {
                selectedCategories.delete("all");
                filterCheckboxes[0].checked = false;
                if (cb.checked) selectedCategories.add(value);
                else selectedCategories.delete(value);
                const realCategories = ["культура", "молодежь", "туризм"];
                const allSelected = realCategories.every(cat => selectedCategories.has(cat));
                if (allSelected) {
                    selectedCategories = new Set(["all"]);
                    filterCheckboxes.forEach(c => { c.checked = c.value === "all"; });
                }
                if (selectedCategories.size === 0) {
                    selectedCategories = new Set(["all"]);
                    filterCheckboxes[0].checked = true;
                }
            }
            if (cb.checked && cb.value !== "all") lastSelectedCategory = cb.value;
            if (!cb.checked && cb.value === lastSelectedCategory) {
                const remaining = Array.from(selectedCategories);
                lastSelectedCategory = remaining.length ? remaining[remaining.length - 1] : "all";
            }
            updateFilterLabel();
            updateFilters();
            updateBackground();
            filterMenu.style.display = "none";
        });
    });
    updateFilterLabel();
    updateBackground();
}