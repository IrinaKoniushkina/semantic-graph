// login.js
const form = document.getElementById("login-form");
const passwordInput = document.getElementById("password-input");
const passwordControl = document.getElementById("password-control");
const errorDiv = document.getElementById("login-error");

passwordControl.addEventListener("click", (e) => {
    e.preventDefault();
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordControl.classList.add("view");
    } else {
        passwordInput.type = "password";
        passwordControl.classList.remove("view");
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById("login").value.trim();
    const password = document.getElementById("password-input").value.trim();

    if (!loginInput || !password) {
        errorDiv.textContent = "Введите логин и пароль";
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ login: loginInput, password })
        });

        const result = await res.json();

        if (res.ok && result.token) {
            errorDiv.textContent = "";
            
            localStorage.setItem("auth", "true");
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));

            // Переход на редактор
            window.location.href = "editor.html";
        } else {
            errorDiv.textContent = result.error || "Неверный логин или пароль";
            document.getElementById("login").value = "";
            document.getElementById("password-input").value = "";
            document.getElementById("login").focus();
        }
    } catch (err) {
        console.error(err);
        errorDiv.textContent = "Ошибка соединения с сервером";
    }
});