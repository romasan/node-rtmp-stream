const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

const { HOST } = process.env;

const shuffle = (array) => {
	let currentIndex = array.length;

	while (currentIndex > 0) {
		const randomIndex = Math.floor(Math.random() * currentIndex);

		currentIndex--;

		[
			array[currentIndex],
			array[randomIndex]
		] = [
			array[randomIndex],
			array[currentIndex]
		];
	}

	return array;
}

const addPix = async (x, y, color) => {
	const formData = new FormData();

	formData.append('color', color);
	formData.append('x', x);
	formData.append('y', y);

	return fetch(`${HOST}setpixel`, {
		method: 'POST',
		body: formData,
	});
};

const getPixels = async () => {
	const resp = await fetch(`${HOST}get_map`);

	return await resp.json()
};

const main = async () => {
	const map = require('./temp.json');
	const json = await getPixels();

	let list = [];
	
	for (let y = 0; y < map.length; y++) {
		for (let x = 0; x < map[y].length; x++) {
			const fromColor = map[y][x];
			const toColor = json.map[y][x];

			if (fromColor !== toColor) {
				list.push({ x, y });
			}
		}
	}

	list = shuffle(list);

	for (const item of list) {
		const { x, y } = item;
		const fromColor = map[y][x];
		const toColor = json.map[y][x];

		console.log(`changed: x: ${x}, y: ${y}, color: ${fromColor} -> ${toColor}`);

		await addPix(x, y, fromColor);
	}

	console.log(`total: ${list.length}`);

	setTimeout(main, list.length > 0 ? 1000 : 10_000);

	// const newMap = json.map.slice(0, 128).map((line) => line.slice(0, 128));
}

main();
