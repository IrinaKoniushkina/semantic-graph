// Тултипы, дропдауны, иконки, панель инструментов редактора
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

const tagTooltip = document.createElement("div");
tagTooltip.className = "tag-tooltip";
document.body.appendChild(tagTooltip);

// Инициализация иконок и тултипов
iconPicker.querySelectorAll("svg").forEach(svg => {
    svg.addEventListener("click", () => {
        selectedIcon = svg.dataset.icon;
        iconPicker.querySelectorAll("svg").forEach(i => i.classList.remove("active"));
        svg.classList.add("active");
        updateWizardButtons();
    });
    svg.onmouseenter = (e) => {
        const text = iconDescriptions[svg.dataset.icon] || "";
        tooltip.textContent = text;
        tooltip.style.opacity = "1";
    };
    svg.onmousemove = (e) => {
        tooltip.style.left = e.clientX + 15 + "px";
        tooltip.style.top = e.clientY + 15 + "px";
    };
    svg.onmouseleave = () => { tooltip.style.opacity = "0"; };
});

// Редактор текста (обработка вставки)
document.querySelectorAll('.editor').forEach(editor => {
    editor.addEventListener('paste', function (e) {
        e.preventDefault();
        let text = (e.clipboardData || window.clipboardData).getData('text');
        text = text.replace(/\r/g, '').replace(/\n{2,}/g, '\n').trim();
        const paragraphs = text.split('\n').map(line => `<p>${line.trim()}</p>`).join('');
        document.execCommand('insertHTML', false, paragraphs);
    });
});

// Клик вне дропдаунов
document.addEventListener("click", (e) => {
    const isClickInside = nameInput.contains(e.target) || nameDropdown.contains(e.target) ||
        categorySearch.contains(e.target) || categoryDropdown.contains(e.target) ||
        relationSearch.contains(e.target) || relationDropdown.contains(e.target);
    if (!isClickInside) {
        nameDropdown.style.display = "none";
        categoryDropdown.style.display = "none";
        relationDropdown.style.display = "none";
    }
});

// Табы внутри редактора описания
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