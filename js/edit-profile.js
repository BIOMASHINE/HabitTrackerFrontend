const email = document.getElementById('email');
const username = document.getElementById('username');
const submit = document.getElementById('submit');
const messageDiv = document.getElementById('edit-message');

function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    } else {
        alert(text);
    }
}

submit.onclick = async function updateUserData() {
    // Проверяем, что хотя бы одно поле заполнено
    const emailValue = email.value.trim();
    const usernameValue = username.value.trim();

    if (!emailValue && !usernameValue) {
        showMessage('Заполните хотя бы одно поле', 'error');
        return;
    }

    // Формируем тело запроса в зависимости от того, какие поля заполнены
    const body = {};
    if (emailValue) body.email = emailValue;
    if (usernameValue) body.username = usernameValue;

    try {
        // Отправляем PATCH-запрос на обновление пользователя
        const response = await fetch('https://habittracker-production-api.up.railway.app:8080/api/v1/users/me', {
            method: 'PATCH',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(body)
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/html/auth/index.html';
            return;
        }

        if (!response.ok) {
            let errorMsg = 'Ошибка при обновлении данных';
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            showMessage(errorMsg, 'error');
            return;
        }

        // Если обновили email, отправляем запрос на верификацию
        if (emailValue) {
            const requestVerifyBody = { email: emailValue };
            const verifyResponse = await fetch(
                'https://habittracker-production-api.up.railway.app:8080/api/v1/auth/request-verify-token',
                {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestVerifyBody)
                }
            );

            if (!verifyResponse.ok) {
                let errorMsg = 'Ошибка при отправке кода подтверждения';
                try {
                    const errorData = await verifyResponse.json();
                    if (errorData.detail) errorMsg = errorData.detail;
                } catch (e) {}
                showMessage(errorMsg, 'error');
                return;
            }

            // Сохраняем email в localStorage для страницы подтверждения
            localStorage.setItem('email', emailValue);
            showMessage('Данные обновлены. Перенаправление на подтверждение...', 'success');
            setTimeout(() => {
                window.location.href = '/html/auth/email-confirm.html';
            }, 1500);
        } else {
            // Обновили только username
            showMessage('Данные обновлены!', 'success');
            setTimeout(() => {
                window.location.href = '/html/profile.html';
            }, 1500);
        }
    } catch (error) {
        showMessage('Ошибка сети или сервера: ' + error.message, 'error');
    }
};