const habitsList = document.getElementById('habits-list');
const messageDiv = document.getElementById('dashboard-message');

function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    } else {
        alert(text);
    }
}

let habits = [];
let stats = [];

// Загружаем данные при старте
(async () => {
    try {
        habits = await getHabits();
        stats = await getStats();
        render();
    } catch (error) {
        showMessage('Не удалось загрузить данные. ' + error.message, 'error');
    }
})();

async function getHabits() {
    try {
        const response = await fetch('https://habittracker-production-api.up.railway.app/api/v1/habits', {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/html/auth/index.html';
            return [];
        }
        if (!response.ok) {
            let errorMsg = 'Ошибка загрузки привычек';
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        return await response.json();
    } catch (error) {
        throw new Error('Сетевая ошибка при загрузке привычек: ' + error.message);
    }
}

async function getStats() {
    const habitStats = [];
    for (let i = 0; i < habits.length; i++) {
        try {
            const response = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/stats/${habits[i].id}`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/html/auth/index.html';
                return [];
            }
            if (!response.ok) {
                let errorMsg = 'Ошибка загрузки статистики';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errorMsg = errorData.detail;
                } catch (e) {}
                showMessage(`Привычка "${habits[i].title}": ${errorMsg}`, 'error');
                // Продолжаем с пустой статистикой
                habitStats.push({
                    streak: 0,
                    max_streak: 0,
                    total_completions: 0,
                    dates: []
                });
                continue;
            }
            const stats = await response.json();
            const today = new Date().toISOString().split('T')[0];
            habits[i].completed = stats.dates.includes(today);
            const storedId = localStorage.getItem(`completion_${habits[i].id}`);
            habits[i].completionId = storedId || null;
            habitStats.push(stats);
        } catch (error) {
            showMessage(`Ошибка при загрузке статистики для "${habits[i].title}": ${error.message}`, 'error');
            habitStats.push({
                streak: 0,
                max_streak: 0,
                total_completions: 0,
                dates: []
            });
        }
    }
    return habitStats;
}

function render() {
    habitsList.innerHTML = '';
    for (let i = 0; i < habits.length; i++) {
        habitsList.insertAdjacentHTML('beforeend', getHabitTemplate(habits[i], i, stats[i]));
    }
    if (!habits.length) {
        habitsList.innerHTML = '<h1 style="color: white">Привычки ещё не созданы</h1>';
    }
}

async function loadHabits() {
    try {
        const responseHabits = await fetch('https://habittracker-production-api.up.railway.app/api/v1/habits', {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        if (!responseHabits.ok) {
            if (responseHabits.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/html/auth/index.html';
                return;
            }
            let errorMsg = 'Ошибка загрузки привычек';
            try {
                const errorData = await responseHabits.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch (e) {}
            showMessage(errorMsg, 'error');
            return;
        }
        habits = await responseHabits.json();

        const newStats = [];
        for (let i = 0; i < habits.length; i++) {
            try {
                const response = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/stats/${habits[i].id}`, {
                    headers: {
                        'accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                if (!response.ok) {
                    let errorMsg = 'Ошибка загрузки статистики';
                    try {
                        const errorData = await response.json();
                        if (errorData.detail) errorMsg = errorData.detail;
                    } catch (e) {}
                    showMessage(`Привычка "${habits[i].title}": ${errorMsg}`, 'error');
                    newStats.push({
                        streak: 0,
                        max_streak: 0,
                        total_completions: 0,
                        dates: []
                    });
                    continue;
                }
                const data = await response.json();
                newStats.push(data);
                const today = new Date().toISOString().split('T')[0];
                habits[i].completed = data.dates.includes(today);
                const storedId = localStorage.getItem(`completion_${habits[i].id}`);
                habits[i].completionId = storedId || null;
            } catch (error) {
                showMessage(`Ошибка сети при загрузке статистики для "${habits[i].title}": ${error.message}`, 'error');
                newStats.push({
                    streak: 0,
                    max_streak: 0,
                    total_completions: 0,
                    dates: []
                });
            }
        }
        stats = newStats;
        render();
    } catch (error) {
        showMessage('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

habitsList.onclick = async function (event) {
    if (event.target.dataset.index) {
        const index = event.target.dataset.index;
        const type = event.target.dataset.type;

        if (type === 'submit') {
            const habit = habits[index];
            try {
                if (!habit.completed) {
                    const response = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/completions/${habit.id}`, {
                        method: 'POST',
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
                        let errorMsg = 'Ошибка при создании отметки';
                        try {
                            const errorData = await response.json();
                            if (errorData.detail) errorMsg = errorData.detail;
                        } catch (e) {}
                        showMessage(errorMsg, 'error');
                        return;
                    }
                    const data = await response.json();
                    habit.completionId = data.id;
                    localStorage.setItem(`completion_${habit.id}`, data.id);

                    const statsResponse = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/stats/${habit.id}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    if (statsResponse.ok) {
                        const newStats = await statsResponse.json();
                        stats[index] = newStats;
                        habit.completed = true;
                    } else {
                        showMessage('Не удалось обновить статистику', 'error');
                    }
                } else {
                    const response = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/completions/${habit.completionId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    if (response.status === 401) {
                        localStorage.removeItem('access_token');
                        window.location.href = '/html/auth/index.html';
                        return;
                    }
                    if (!response.ok) {
                        let errorMsg = 'Ошибка при удалении отметки';
                        try {
                            const errorData = await response.json();
                            if (errorData.detail) errorMsg = errorData.detail;
                        } catch (e) {}
                        showMessage(errorMsg, 'error');
                        return;
                    }
                    const statsResponse = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/stats/${habit.id}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    if (statsResponse.ok) {
                        const newStats = await statsResponse.json();
                        stats[index] = newStats;
                        habit.completed = false;
                        localStorage.removeItem(`completion_${habit.id}`);
                        habit.completionId = null;
                    } else {
                        showMessage('Не удалось обновить статистику', 'error');
                    }
                }
                render();
            } catch (error) {
                showMessage('Ошибка сети: ' + error.message, 'error');
            }
            return;
        } else if (type === 'remove') {
            try {
                const response = await fetch(`https://habittracker-production-api.up.railway.app/api/v1/habits/${habits[index].id}`, {
                    method: 'DELETE',
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
                    let errorMsg = 'Ошибка при удалении привычки';
                    try {
                        const errorData = await response.json();
                        if (errorData.detail) errorMsg = errorData.detail;
                    } catch (e) {}
                    showMessage(errorMsg, 'error');
                    return;
                }
                await loadHabits();
            } catch (error) {
                showMessage('Ошибка сети при удалении: ' + error.message, 'error');
            }
        } else if (type === 'stats-toggle') {
            const button = event.target;
            const card = button.closest('.habit-card');
            const wrapper = button.closest('.stats-dropdown-wrapper');
            const dropdown = wrapper.querySelector('.stats-dropdown');

            document.querySelectorAll('.stats-dropdown').forEach(menu => {
                if (menu !== dropdown) {
                    menu.classList.remove('active');
                    menu.closest('.habit-card')?.classList.remove('active-card');
                }
            });

            dropdown.classList.toggle('active');
            card.classList.toggle('active-card');

        } else if (event.target.closest('.stats-option')) {
            const option = event.target.closest('.stats-option');
            const period = option.dataset.period;
            const index = option.closest('[data-index]')?.dataset.index ||
                option.closest('.habit-card')?.querySelector('[data-index]')?.dataset.index;

            if (index === undefined) {
                showMessage('Не удалось определить привычку', 'error');
                return;
            }

            const dropdown = option.closest('.stats-dropdown');
            dropdown.classList.remove('active');

            dropdown.querySelectorAll('.stats-option').forEach(btn => btn.classList.remove('selected'));
            option.classList.add('selected');

            try {
                const response = await fetch(
                    `https://habittracker-production-api.up.railway.app/api/v1/habits/stats/${habits[index].id}?limit=${period}`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    }
                );
                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    window.location.href = '/html/auth/index.html';
                    return;
                }
                if (!response.ok) {
                    let errorMsg = 'Ошибка загрузки статистики за период';
                    try {
                        const errorData = await response.json();
                        if (errorData.detail) errorMsg = errorData.detail;
                    } catch (e) {}
                    showMessage(errorMsg, 'error');
                    return;
                }
                const periodStats = await response.json();
                stats[index] = periodStats;
                render();
            } catch (error) {
                showMessage('Ошибка сети: ' + error.message, 'error');
            }
        }
    }
};

document.addEventListener('click', function(e) {
    if (!e.target.closest('.stats-dropdown-wrapper')) {
        document.querySelectorAll('.stats-dropdown').forEach(menu => menu.classList.remove('active'));
    }
});

function getHabitTemplate(habit, index, stats) {
    const isCompletedStyle = habit.completed ? 'style="text-decoration: line-through;"' : '';

    let streakSpelling;
    if (stats.streak >= 5) {
        streakSpelling = 'дней подряд';
    } else if (stats.streak === 1) {
        streakSpelling = 'день подряд';
    } else {
        streakSpelling = 'дня подряд';
    }

    return `
        <div class="habit-card">
            <div class="habit-top">
                <div class="habit-info">
                    <h3 ${isCompletedStyle}>${habit.title}</h3>
                    <p class="habit-description">${habit.description || 'Без описания'}</p>
                    ${stats.streak > 0 ? `<p class="streak">🔥 ${stats.streak} ${streakSpelling}</p>` : ''}
                </div>
                <div class="habit-actions">
                    <button class="btn-success" data-index=${index} data-type="submit" ${isCompletedStyle ? 'style="background-color: orange"' : ''}>✔</button>
                    <button class="btn-danger" data-index=${index} data-type="remove">🗑</button>
                    <div class="stats-dropdown-wrapper">
                        <button class="btn-secondary" data-index=${index} data-type="stats-toggle">Статистика ↓</button>
                        <div class="stats-dropdown">
                            <div class="stats-option" data-period="1" data-index=${index}>За 1 день</div>
                            <div class="stats-option" data-period="3" data-index=${index}>За 3 дня</div>
                            <div class="stats-option" data-period="7" data-index=${index}>За 7 дней</div>
                            <div class="stats-option" data-period="15" data-index=${index}>За 15 дней</div>
                            <div class="stats-option" data-period="30" data-index=${index}>За 30 дней</div>
                            <div class="stats-option" data-period="60" data-index=${index}>За 60 дней</div>
                            <div class="stats-option" data-period="-1" data-index=${index}>За всё время</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="habit-stats">
                <div class="stat-item"><span>Текущий стрик</span><strong>${stats.streak}</strong></div>
                <div class="stat-item"><span>Максимальный стрик</span><strong>${stats.max_streak}</strong></div>
                <div class="stat-item"><span>Всего выполнений</span><strong>${stats.total_completions}</strong></div>
            </div>
        </div>
    `;
}