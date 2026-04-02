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

    const login = document.getElementById("login").value;
    const password = document.getElementById("password-input").value;

    const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ login, password })
    });

    if (res.ok) {
        errorDiv.textContent = ""; // 👈 ВОТ СЮДА
        localStorage.setItem("auth", "true");
        window.location.href = "editor.html";
    } else {
        errorDiv.textContent = "Неверный логин или пароль";
        document.getElementById("login").value = "";
        document.getElementById("password-input").value = "";
        document.getElementById("login").focus();
    }
});