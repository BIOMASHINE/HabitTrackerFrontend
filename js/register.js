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
        const response = await fetch('https://habittracker-production-api.up.railway.app/api/v1/auth/register/', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            // Регистрация успешна, отправляем запрос на верификацию
            const requestEmailBody = { email: emailVal };
            try {
                await fetch('https://habittracker-production-api.up.railway.app/api/v1/auth/request-verify-token/', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestEmailBody)
                });
            } catch (verifyError) {
                showMessage('Ошибка при отправке кода подтверждения, но регистрация прошла. Попробуйте запросить код позже.', 'error');
                // Всё равно перенаправляем на страницу подтверждения
            }
            // Перенаправление на страницу подтверждения
            window.location.href = '/html/auth/email-confirm.html';
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