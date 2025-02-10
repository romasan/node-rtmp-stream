// TODO image paste
document.addEventListener('paste', function (e) {
	const clipboardData = e.clipboardData || window.clipboardData;
	const items = clipboardData.items;

	for (let i = 0; i < items.length; i++) {
		if (items[i].type.indexOf('image') !== -1) {
			const blob = items[i].getAsFile();
			const reader = new FileReader();

			reader.onload = function (event) {
				const img = new Image();

				(img as any).src = event.target && event.target.result as string;
				img.onload = function () {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');

					canvas.width = img.width;
					canvas.height = img.height;
					(ctx as any).drawImage(img, 0, 0);
					document.body.appendChild(canvas);
				};
			};

			reader.readAsDataURL(blob);
		}
	}
});
