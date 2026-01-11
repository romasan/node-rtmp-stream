const loadingEl = document.getElementById('loading');
const userInfoEl = document.getElementById('user-info');
const errorEl = document.getElementById('error');
const displayNameEl = document.getElementById('display-name');
const userIdEl = document.getElementById('user-id');

// Обработка авторизации от Twitch
window.Twitch.ext.onAuthorized(async (auth) => {
	try {
		// Отправляем JWT на ваш сервер
		const response = await fetch('https://dev-api.pixelbattles.ru/auth/twitch-extension', {
			method: 'POST',
			credentials: 'include', // важно для кук
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ token: auth.token })
		});

		const data = await response.json();

		if (response.ok && data.success) {
			// Показываем данные пользователя
			displayNameEl.textContent = data.user.display_name || 'Аноним';
			userIdEl.textContent = data.user.id || '—';
			loadingEl.classList.add('hidden');
			userInfoEl.classList.remove('hidden');
		} else {
			throw new Error(data.error || 'Unknown error');
		}
	} catch (err) {
		console.error('Auth failed:', err);
		loadingEl.classList.add('hidden');
		errorEl.classList.remove('hidden');
	}
});

// Обработка ошибок расширения
window.Twitch.ext.onError((err) => {
	console.error('Twitch Extension error:', err);
	loadingEl.classList.add('hidden');
	errorEl.textContent = 'Ошибка расширения: ' + (err.message || 'неизвестно');
	errorEl.classList.remove('hidden');
});
