const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const submit = document.getElementById('register');
const messageDiv = document.getElementById('register-message');

function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    } else {
        alert(text);
    }
}

submit.onclick = async function registering() {
    // Проверка заполненности полей
    const usernameVal = username.value.trim();
    const emailVal = email.value.trim();
    const passwordVal = password.value.trim();

    if (!usernameVal || !emailVal || !passwordVal) {
        showMessage('Заполните все поля', 'error');
        return;
    }

    const requestBody = {
        username: usernameVal,
        email: emailVal,
        password: passwordVal,
    };

    try {
        const response = await fetch('https://habittracker-zqo0.onrender.com/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            // Регистрация успешна — сразу перенаправляем на дашборд
            showMessage('Регистрация успешна! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = '/html/dashboard.html';
            }, 1500);
        } else {
            let errorMsg = 'Ошибка регистрации';
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        showMessage('Ошибка сети: ' + error.message, 'error');
    }
};