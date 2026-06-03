// Панель администратора: пользователи и история
async function initAdminInterface() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user.role === "admin") {
        document.getElementById("tab-users").style.display = "inline-flex";
        document.getElementById("tab-history").style.display = "inline-flex";
    }
}

async function loadUsersPanel() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/users", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const users = await res.json();
    const container = document.getElementById("users-list");
    container.innerHTML = "";
    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
            <div class="user-info">
                <div class="user-name">${user.login}</div>
                <div class="user-role">${user.role}</div>
            </div>
            <div class="user-actions">
                <button class="admin-small-btn edit" onclick="changeUserRole('${user.id}', '${user.role}')">Сменить роль</button>
                <button class="admin-small-btn delete" onclick="deleteUser('${user.id}')">Удалить</button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadHistoryPanel() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/history", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const history = await res.json();
    const container = document.getElementById("history-list");
    container.innerHTML = "";
    history.reverse().forEach(item => {
        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
            <div class="history-info">
                <div class="history-action">${item.user}</div>
                <div class="history-date">${item.action}</div>
                <div class="history-date">${new Date(item.date).toLocaleString()}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function changeUserRole(id, currentRole) {
    const newRole = currentRole === "admin" ? "editor" : "admin";
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
        loadUsersPanel();
        showToast("Роль изменена");
    }
}

async function deleteUser(id) {
    if (!confirm("Удалить пользователя?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
        loadUsersPanel();
        showToast("Пользователь удалён");
    }
}