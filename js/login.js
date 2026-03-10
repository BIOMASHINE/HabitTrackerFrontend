const email = document.getElementById('email');
const password = document.getElementById('password');
const submit = document.getElementById('login');
const messageDiv = document.getElementById('login-message');

function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    } else {
        alert(text);
    }
}

submit.onclick = async function logging() {
    // Проверка заполненности полей
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();

    if (!emailValue || !passwordValue) {
        showMessage('Заполните email и пароль', 'error');
        return;
    }

    const body = new URLSearchParams({
        username: emailValue,
        password: passwordValue
    });

    try {
        const response = await fetch('https://habittracker-production-api.up.railway.app/api/v1/auth/login/', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            showMessage('Успешный вход! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = '/html/dashboard.html';
            }, 1500);
        } else {
            let errorMsg = 'Ошибка входа. Проверьте email и пароль.';
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        showMessage('Ошибка сети или сервера. Попробуйте позже.', 'error');
    }
};