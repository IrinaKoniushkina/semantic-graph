// Утилиты: тосты, счётчики, валидация, стили
function showToast(text) {
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 10000);
}

function updateCounter(input, counter, max) {
    const length = getTextLength(input);
    counter.textContent = `${length}/${max}`;
    counter.style.color = length > max ? "red" : "#888";
}

function getTextLength(input) {
    if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
        return input.value.length;
    }
    return input.innerText.length;
}

function bindCounter(input, counter, limit) {
    if (!input || !counter) return;
    const handler = () => {
        let length = getTextLength(input);
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

function updateDisabledStyles() {
    document.querySelectorAll("#step1-next, #step2-next, #save-btn").forEach(btn => {
        if (btn.disabled) {
            btn.classList.add("disabled-btn");
        } else {
            btn.classList.remove("disabled-btn");
        }
    });
}

function getSelectedRelationType() {
    const selected = document.querySelector('input[name="type-relations"]:checked');
    return selected?.value === "history-relation" ? "history" : "geo";
}