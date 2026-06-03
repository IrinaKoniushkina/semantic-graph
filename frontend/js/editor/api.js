// Функции работы с сервером
async function fetchGraphData() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/places", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Ошибка загрузки графа");
        const data = await response.json();
        allNodes = data.nodes || [];
        allEdges = data.edges || [];
    } catch (error) {
        console.error(error);
        showToast("Ошибка загрузки данных");
    }
}

async function uploadImages() {
    if (newImages.length === 0) return [];
    const formData = new FormData();
    for (let item of newImages) {
        formData.append("images", item.file);
    }
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/upload-images", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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