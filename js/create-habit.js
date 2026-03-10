const title = document.getElementById('title');
const description = document.getElementById('description');
const submit = document.getElementById('submit');
const messageDiv = document.getElementById('message');

function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    } else {
        alert(text);
    }
}

submit.onclick = async function createHabit() {
    // Проверка обязательного поля
    if (!title.value.trim()) {
        showMessage('Введите название привычки', 'error');
        return;
    }

    const bodyCreate = {
        title: title.value.trim(),
        description: description.value.trim() || null // если пусто, отправляем null
    };

    try {
        const response = await fetch('https://habittracker-production-api.up.railway.app/api/v1/habits/', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(bodyCreate)
        });

        if (response.ok) {
            showMessage('Привычка создана! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = '/html/dashboard.html';
            }, 1500);
        } else {
            let errorMsg = 'Ошибка при создании привычки';
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        showMessage('Ошибка сети или сервера. Проверьте подключение.', 'error');
    }
};