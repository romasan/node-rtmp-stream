const Log = (...args) => {
	const el = document.getElementById('log');
	const line = document.createElement('div');
	line.innerText = args.join(';');
	el.appendChild(line);

	console.log(...args);
};
Log('==== #0');

// Обработка авторизации от Twitch
window.Twitch.ext.onAuthorized(async (auth) => {
	Log('==== 2', auth);
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

		Log('==== 3', response);

		const data = await response.json();

		Log('==== 4', data);

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
		Log('==== 5', err);
		console.error('Auth failed:', err);
		loadingEl.classList.add('hidden');
		errorEl.classList.remove('hidden');
	}
});

Log('==== 6');

// Обработка ошибок расширения
window.Twitch.ext.onError((err) => {
	Log('==== 7', err);
	console.error('Twitch Extension error:', err);
	loadingEl.classList.add('hidden');
	errorEl.textContent = 'Ошибка расширения: ' + (err.message || 'неизвестно');
	errorEl.classList.remove('hidden');
});
