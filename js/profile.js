const username = document.getElementById('name');
const email = document.querySelector('.profile-email');
const profileAvatar = document.querySelector('.profile-avatar');
const logout = document.querySelector('#logout');
const messageDiv = document.getElementById('profile-message'); // добавить в HTML

function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    } else {
        alert(text);
    }
}

async function getData() {
    try {
        const response = await fetch('https://habittracker-production-api.up.railway.app:8080/api/v1/users/me', {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/html/auth/index.html';
            return;
        }

        if (!response.ok) {
            let errorMsg = 'Ошибка загрузки данных профиля';
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            showMessage(errorMsg, 'error');
            return;
        }

        const data = await response.json();
        username.innerHTML = data.username;
        email.innerHTML = data.email;
        profileAvatar.innerHTML = data.username[0];
    } catch (error) {
        showMessage('Ошибка сети: ' + error.message, 'error');
    }
}

await getData();

logout.onclick = async function logout() {
    try {
        const response = await fetch('https://habittracker-production-api.up.railway.app:8080/api/v1/auth/logout', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.ok) {
            localStorage.removeItem('access_token');
            window.location.href = '/html/auth/index.html';
        } else {
            let errorMsg = 'Ошибка при выходе';
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