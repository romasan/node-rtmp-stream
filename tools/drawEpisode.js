/**
 * каждые N пикселей сохраняет кадр в файл
 *
 * Рендер распараллелен между процессами (child_process.fork): главный процесс
 * один раз проигрывает лог пикселей до границ чанков и на каждой границе снимает
 * «снимок» полотна (PNG) вместе с состоянием рендера, а дочерние процессы
 * параллельно рисуют, кодируют и сохраняют кадры своих чанков.
 *
 * Важно: именно процессы, а не worker_threads. Нативный аддон `canvas` не
 * context-aware и не может быть загружен в двух потоках одного процесса
 * («Module did not self-register»), поэтому параллелизм делается через fork.
 *
 * Количество процессов = os.cpus().length; переопределяется 4-м аргументом
 * команды или переменной окружения DRAW_EPISODE_WORKERS.
 *
 * Детерминизм: чтобы результат не зависел от разбиения на чанки, кадровое полотно
 * перед каждым кадром очищается (ctx.clearRect), а фон выбирается от номера кадра,
 * а не от счётчика. Для полнокадровых непрозрачных фонов (jpg-кадры из ffmpeg, NOBG)
 * результат побайтово совпадает с последовательным рендером; для фонов меньше кадра
 * или с прозрачностью старая версия показывала сквозь них остатки предыдущих кадров,
 * теперь такие области прозрачны.
 */

const fs = require('fs');
const os = require('os');
const readline = require('readline');
const { fork } = require('child_process');
const Progress = require('cli-progress');
const { createCanvas, Image, registerFont } = require('canvas');
const { colorSchemes } = require('./loadColorSchemes');
// const { drawBGCanvas } = require('../server/utils/canvas');
// const { getFileLinesCount } = require('../server/helpers');

const getFileLinesCount = (file) => new Promise((resolve) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	let count = 0;

	rl.on('line', () => {
		count++;
	});

	rl.on('close', () => {
		resolve(count);
	});
});

// registerFont(__dirname + '/../assets/fonts/CustomFont.ttf', { family: 'Custom Font' });

const PPF = 108; // 300;
const FPS = 60; // 25;
const PPS = PPF * FPS;

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;

const textX = 1500;
const textY = 1000;
const textLineHeight = 70;

const videoWidth = 1920; // 1080 | 1920;
const videoHeight = 1080; // 720 | 1080;

const breakLine = Infinity;

const debugInfo = false;

// как часто дочерний процесс сообщает в главный о прогрессе (в пикселях)
const REPORT_EVERY_PIXELS = PPF * 10;

// ffmpeg -i bg.mp4 -vf "fps=60" tmp/%08d.jpg
// npm run tools drawEpisode CURRENT ./tmp ./assets/s3e1.png
// npm run tools drawEpisode CURRENT ./tmp NOIMAGE
// ffmpeg -i "concat:bg1.mp3|bg2.mp3|bg3.mp3" -c copy bg.mp3
// ffmpeg -stream_loop -1 -i bg1.mp3 -r 60 -i frames/%08d.png -vf "scale=1920:1080" -c:v libx264 -c:a aac -shortest -map_metadata -1 -metadata title="Pixel Battle 2026 S4E2" -metadata artist="pixelbattles.ru" output.mp4
// ffmpeg -i video.mp4 -i audio.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -af apad -shortest output.mp4

// const scale = 2;

// const drawDayBG = (ctx, day) => {
// 	const bg = drawBGCanvas(videoWidth, videoHeight);
// 	ctx.drawImage(bg, 0, 0);

// 	const text = `Day #${day}`;
// 	ctx.fillStyle = '#000';
// 	ctx.fillText(text, textX - 1, textY + textLineHeight - 1);
// 	ctx.fillText(text, textX + 1, textY + textLineHeight + 1);
// 	ctx.fillText(text, textX - 1, textY + textLineHeight + 1);
// 	ctx.fillText(text, textX + 1, textY + textLineHeight - 1);
// 	ctx.fillStyle = '#fff';
// 	ctx.fillText(text, textX, textY + textLineHeight);
// };

const backupCanvas = (canvas) => {
	const backupCanvas = createCanvas(canvas.width, canvas.height);
	const backupCtx = backupCanvas.getContext('2d');

	backupCtx.drawImage(canvas, 0, 0);

	return backupCanvas;
};

const gradientAnimation = (ctx, width, height) => {
	const circlesNum = 40;
	const minRadius  = 400;
	const maxRadius  = 400;
	const speed      = .02;

	const circles = [];
	for (let i = 0 ; i < circlesNum ; ++i) {
		circles.push(circle(width, height, minRadius, maxRadius));
	}

	return () => {
		ctx.clearRect(0, 0, width, height);
		circles.forEach(circle => circle(ctx, speed));
	};
};

const circle = (w, h, minR, maxR) => {
	let x = Math.random() * w;
	let y = Math.random() * h;
	let angle  = Math.random() * Math.PI * 2;
	const radius = Math.random() * (maxR - minR) + minR;
	const firstColor  = `hsla(${Math.random() * 360}, 100%, 50%, 1)`;
	const secondColor = `hsla(${Math.random() * 360}, 100%, 50%, 0)`;
	return (ctx, speed) => {
		angle += speed;
		const _x = x + Math.cos(angle) * 200;
		const _y = y + Math.sin(angle) * 200;
		const gradient = ctx.createRadialGradient(_x, _y, 0, _x, _y, radius);
					gradient.addColorStop(0, firstColor);
					gradient.addColorStop(1, secondColor);

		ctx.globalCompositeOperation = `overlay`;
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(_x, _y, radius, 0, Math.PI * 2);
		ctx.fill(); 
	};
};

// const skipFrom = 0;
// const skipTo = 1000;

const drawDebugInfo = (ctx, frameNumber, pixels, part, width, height, shiftX, shiftY) => {
	ctx.save();
	ctx.globalCompositeOperation = 'source-over';
	ctx.font = '36px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';

	const lines = [
		`Frame: ${frameNumber}`,
		`Pixels: ${pixels}`,
		`Expansion: ${part}`,
		`Canvas: ${width}x${height}`,
		`Shift: ${shiftX},${shiftY}`,
	];

	const padding = 12;
	const lineHeight = 44;
	const textWidth = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);

	ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
	ctx.fillRect(0, 0, textWidth + padding * 2, lines.length * lineHeight + padding * 2);

	ctx.fillStyle = '#00ff00';
	lines.forEach((line, index) => {
		ctx.fillText(line, padding, padding + index * lineHeight);
	});

	ctx.restore();
};

const readExpands = (expandsFile) => fs.readFileSync(expandsFile)
	.toString()
	.split('\n')
	.filter((line) => line.trim() !== '')
	.map((line) => line.split(';'));

const readBgFiles = (bg) => {
	if (!fs.existsSync(bg)) {
		return undefined;
	}

	return fs.readdirSync(bg)
		.filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
		.filter((file) => fs.statSync(`${bg}/${file}`).isFile())
		.sort();
};

// Начальное состояние рендера: полотно первого расширения и параметры его отображения
const createRenderState = (expands) => {
	const part = 0;
	const width = Number(expands[part][2]);
	const height = Number(expands[part][3]);
	const scale = Math.min(
		Math.floor(videoWidth / width),
		Math.floor(videoHeight / height),
	);
	const mcanvas = createCanvas(width, height);
	const mctx = mcanvas.getContext('2d');

	mctx.fillStyle = '#fff';
	mctx.fillRect(0, 0, width, height);

	return {
		mcanvas,
		mctx,
		part,
		nextPartStartTime: expands[part + 1] ? Number(expands[part + 1][0]) : Infinity,
		width,
		height,
		shiftX: Number(expands[part][4]),
		shiftY: Number(expands[part][5]),
		colorScheme: expands[part][6],
		currentColors: colorSchemes[expands[part][6]] || colorSchemes.COLORS_1,
		isTruecolor: expands[part][6] === 'truecolor' || expands[part][6] === 'COLORS_32',
		scale,
		pixelsFrameX: videoWidth / 2 - width * scale / 2,
		pixelsFrameY: videoHeight / 2 - height * scale / 2,
	};
};

const drawFirstFrame = (state, firstFrame) => {
	if (!firstFrame || firstFrame === 'NOIMAGE') {
		return;
	}

	const imgBuf = fs.readFileSync(firstFrame);
	const image = new Image;

	image.src = imgBuf;
	state.mctx.drawImage(image, 0, 0);
};

// Состояние без canvas: canvas в воркер передать нельзя, его заменяет снимок полотна
const serializeState = (state) => ({
	part: state.part,
	nextPartStartTime: state.nextPartStartTime,
	width: state.width,
	height: state.height,
	shiftX: state.shiftX,
	shiftY: state.shiftY,
	colorScheme: state.colorScheme,
	currentColors: state.currentColors,
	isTruecolor: state.isTruecolor,
	scale: state.scale,
	pixelsFrameX: state.pixelsFrameX,
	pixelsFrameY: state.pixelsFrameY,
});

// Расширение полотна: сохраняем картинку, меняем размер и восстанавливаем её
// на дельту сдвига (как в live expandCanvas)
const applyExpansion = (state, expands, part) => {
	const backupImage = backupCanvas(state.mcanvas);

	state.part = part;
	state.nextPartStartTime = expands[part + 1] ? Number(expands[part + 1][0]) : Infinity;
	state.width = Number(expands[part][2] || state.width);
	state.height = Number(expands[part][3] || state.height);
	const newShiftX = Number(expands[part][4] || 0);
	const newShiftY = Number(expands[part][5] || 0);
	const deltaShiftX = newShiftX - state.shiftX;
	const deltaShiftY = newShiftY - state.shiftY;
	state.shiftX = newShiftX;
	state.shiftY = newShiftY;
	state.colorScheme = expands[part][6];
	state.currentColors = colorSchemes[state.colorScheme] || colorSchemes.COLORS_1;
	state.isTruecolor = state.colorScheme === 'truecolor' || state.colorScheme === 'COLORS_32';
	state.scale = Math.min(
		Number((videoWidth / state.width).toFixed(1)),
		Number((videoHeight / state.height).toFixed(1)),
	);
	state.pixelsFrameX = videoWidth / 2 - state.width * state.scale / 2;
	state.pixelsFrameY = videoHeight / 2 - state.height * state.scale / 2;

	state.mcanvas.width = state.width;
	state.mcanvas.height = state.height;
	state.mctx.fillStyle = '#fff';
	state.mctx.fillRect(0, 0, state.width, state.height);

	state.mctx.drawImage(backupImage, deltaShiftX, deltaShiftY);
};

// Одна строка лога пикселей: расширение полотна (если пришло время) + сам пиксель
const drawPixelLine = (state, expands, line) => {
	const [time, , x, y, color] = line.split(';');

	if (Number(time) >= state.nextPartStartTime) {
		applyExpansion(state, expands, state.part + 1);
	}

	state.mctx.fillStyle = color;
	state.mctx.fillRect(Number(x) + state.shiftX, Number(y) + state.shiftY, 1, 1);
};

// Дочерний процесс: рендерит и сохраняет кадры своего чанка строк лога.
// Чанк начинается с кадра (номер строки кратен PPF), поэтому номер кадра считается от номера строки.
const renderChunk = (job) => {
	const {
		pixelsFile, framesDir, bg, bgFiles, expands,
		startLine, endLine, startByte, isLastChunk,
		snapshot, state, firstFrame,
	} = job;

	const canvas = createCanvas(videoWidth, videoHeight);
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	let renderState;

	if (snapshot) {
		const mcanvas = createCanvas(state.width, state.height);
		const mctx = mcanvas.getContext('2d');
		const image = new Image;

		image.src = Buffer.isBuffer(snapshot) ? snapshot : Buffer.from(snapshot);
		mctx.drawImage(image, 0, 0);

		renderState = { ...state, mcanvas, mctx };
	} else {
		renderState = createRenderState(expands);
		drawFirstFrame(renderState, firstFrame);
	}

	// Номер кадра детерминирован, поэтому фон выбирается от номера, а не по счётчику
	const drawFrameBg = (frameNumber) => {
		if (bgFiles && bgFiles.length > 0) {
			const frame = `${bg}/${bgFiles[(frameNumber - 1) % bgFiles.length]}`;
			const imgBuf = fs.readFileSync(frame);
			const image = new Image;

			image.src = imgBuf;
			ctx.drawImage(image, 0, 0);
		} else if (bg === 'NOBG') {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, videoWidth, videoHeight);
		} else if (bg === 'GA') {
			gradientAnimation(ctx, videoWidth, videoHeight);
		}
	};

	let i = startLine - 1;
	let frame = startLine / PPF; // число кадров, уже сохранённых предыдущими чанками
	let report = 0;
	let stopped = false;

	const drawFrame = () => {
		frame++;

		// Кадровое полотно обязано начинаться с чистого листа: иначе в кадр попадали бы
		// остатки предыдущего кадра, и результат зависел бы от числа процессов-воркеров
		ctx.clearRect(0, 0, videoWidth, videoHeight);
		drawFrameBg(frame);
		ctx.globalCompositeOperation = 'source-over';
		ctx.drawImage(renderState.mcanvas, 0, 0, renderState.width, renderState.height, renderState.pixelsFrameX, renderState.pixelsFrameY, renderState.width * renderState.scale, renderState.height * renderState.scale);

		if (debugInfo) {
			drawDebugInfo(ctx, frame, i, renderState.part, renderState.width, renderState.height, renderState.shiftX, renderState.shiftY);
		}

		const output = framesDir + '/' + String(frame).padStart(8, '0') + '.png';

		fs.writeFileSync(output, canvas.toBuffer());
	};

	const rl = readline.createInterface({
		input: fs.createReadStream(pixelsFile, { start: startByte }),
		crlfDelay: Infinity,
	});

	rl.on('line', (line) => {
		if (stopped) {
			return;
		}

		i++;

		if (i >= endLine) {
			stopped = true;
			rl.close();
			return;
		}

		drawPixelLine(renderState, expands, line);

		if (i % PPF === 0) {
			drawFrame();
		}

		report++;

		if (report >= REPORT_EVERY_PIXELS) {
			process.send({ type: 'progress', count: report });
			report = 0;
		}
	});

	rl.on('close', () => {
		if (report > 0) {
			process.send({ type: 'progress', count: report });
			report = 0;
		}

		// финальный кадр рисует только последний чанк
		if (isLastChunk) {
			drawFrame();
		}

		process.send({ type: 'done' }, () => process.exit(0));
	});
};

// Проигрывает лог пикселей до границ чанков: на каждой границе снимает снимок полотна
// (PNG) и состояние рендера, после чего сразу запускает воркер этого чанка.
// Дальше этой границы идти не нужно — остальные строки обработают воркеры.
const snapshotChunks = async ({ pixelsFile, expands, firstFrame, jobs, chunksCount, runJob, jobPromises }) => {
	if (chunksCount <= 1) {
		return;
	}

	const state = createRenderState(expands);
	drawFirstFrame(state, firstFrame);

	await new Promise((resolve, reject) => {
		const stream = fs.createReadStream(pixelsFile);

		let pending = Buffer.alloc(0);
		let offset = 0; // абсолютное смещение первого байта pending в файле
		let lineIndex = 0;
		let nextChunk = 1;
		let finished = false;

		const finish = () => {
			if (finished) {
				return;
			}

			finished = true;
			stream.destroy();
			resolve();
		};

		const handleLine = (line, lineByteOffset) => {
			if (lineIndex === jobs[nextChunk].startLine) {
				const job = jobs[nextChunk];

				job.startByte = lineByteOffset;
				job.snapshot = state.mcanvas.toBuffer();
				job.state = serializeState(state);

				jobPromises.push(runJob(job));

				nextChunk++;

				if (nextChunk >= chunksCount) {
					finish();
					return;
				}
			}

			drawPixelLine(state, expands, line);
			lineIndex++;
		};

		stream.on('data', (chunk) => {
			if (finished) {
				return;
			}

			pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;

			let index;

			while (!finished && (index = pending.indexOf(0x0A)) !== -1) {
				const lineByteOffset = offset;

				offset += index + 1;

				const line = pending.subarray(0, index).toString('utf8');

				pending = pending.subarray(index + 1);

				handleLine(line, lineByteOffset);
			}
		});

		stream.on('end', () => {
			if (finished) {
				return;
			}

			if (pending.length) {
				handleLine(pending.toString('utf8'), offset);
			}

			finish();
		});

		stream.on('error', reject);
	});
};

const drawEpisode = async (ep, bg, firstFrame, workersArg) => {
	console.log('Start draw episode', ep);

	const pixelsFile = `${__dirname}/../db/${ep !== 'CURRENT' ? `archive/${ep}/` : ''}pixels.log`;
	const expandsFile = `${__dirname}/../db/${ep !== 'CURRENT' ? `archive/${ep}/` : ''}expands.log`;
	const expands = readExpands(expandsFile);
	const length = breakLine < Infinity ? breakLine : await getFileLinesCount(pixelsFile);

	const _sec = Math.floor(length / PPS);
	console.log(`Start renderind for: ${String(Math.floor(_sec / 60)).padStart(2, '0')}:${String(_sec % 60).padStart(2, '0')} duration, ${length / PPF} frames, ${length} pixels`);

	const framesDir = `${__dirname}/../frames`;
	fs.mkdirSync(framesDir, { recursive: true });

	const bgFiles = readBgFiles(bg);

	const bar = new Progress.Bar();

	// чанки режем по кадрам: процесс-воркер всегда начинает с начала кадра (номер строки кратен PPF)
	const framePoints = length > 0 ? Math.floor((length - 1) / PPF) + 1 : 0;
	const workers = Math.max(1, Number(process.env.DRAW_EPISODE_WORKERS) || Number(workersArg) || os.cpus().length);
	const framePointsPerChunk = Math.max(1, Math.ceil(framePoints / workers));
	const chunkStarts = [];

	for (let framePoint = 0; framePoint < framePoints; framePoint += framePointsPerChunk) {
		chunkStarts.push(framePoint);
	}

	// пустой лог — один чанк только для финального кадра
	if (chunkStarts.length === 0) {
		chunkStarts.push(0);
	}

	const chunksCount = chunkStarts.length;
	const totalFrames = framePoints + 1; // + финальный кадр после последней строки

	console.log(`Rendering ${chunksCount} chunk(s) on ${workers} worker(s)`);

	bar.start(length, 0);

	const startTime = Date.now();
	const jobs = chunkStarts.map((framePoint, index) => ({
		index,
		startLine: framePoint * PPF,
		endLine: index + 1 < chunksCount ? chunkStarts[index + 1] * PPF : Infinity,
		startByte: 0,
		isLastChunk: index + 1 === chunksCount,
		snapshot: null,
		state: null,
		firstFrame: index === 0 ? firstFrame : null,
	}));

	const children = [];
	const jobPromises = [];
	let processedPixels = 0;

	const runJob = (job) => new Promise((resolve, reject) => {
		const child = fork(__filename, [], {
			env: { ...process.env, DRAW_EPISODE_WORKER: '1' },
			serialization: 'advanced',
		});

		children.push(child);

		// задание отправляем только после готовности: снимок полотна — это буфер на мегабайты
		child.on('message', (message) => {
			if (message.type === 'ready') {
				try {
					child.send({ type: 'job', job: { pixelsFile, framesDir, bg, bgFiles, expands, ...job } });
				} catch (error) {
					reject(error);
				}
			} else if (message.type === 'progress') {
				processedPixels += message.count;
				bar.update(Math.min(processedPixels, length));
			} else if (message.type === 'error') {
				reject(new Error(`Worker #${job.index} failed: ${message.message}`));
			}
		});
		child.on('error', reject);
		child.on('exit', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Worker #${job.index} stopped with exit code ${code}`));
			}
		});
	});

	// первый чанк стартует сразу; остальные — по мере снятия снимков полотна
	jobPromises.push(runJob(jobs[0]));

	try {
		await snapshotChunks({ pixelsFile, expands, firstFrame, jobs, chunksCount, runJob, jobPromises });

		await Promise.all(jobPromises);
	} catch (error) {
		children.forEach((child) => child.kill());
		bar.stop();

		throw error;
	}

	bar.stop();

	const sec = Math.floor(totalFrames / FPS);
	const finalInTime = Math.floor((Date.now() - startTime) / 1000);

	console.log(`Done in ${Math.floor(finalInTime / 60)}:${(finalInTime % 60)}`)
	console.log(`Total duration: ${Math.floor(sec / 60)}:${(sec % 60)}, ${totalFrames} frames, ${Math.max(length - 1, 0)} pixels`);
};

// Дочерний процесс: получает от главного задание и рендерит свой чанк
if (process.env.DRAW_EPISODE_WORKER === '1') {
	// сбои внутри колбэков readline ловим здесь: try/catch вокруг renderChunk их не видит
	process.on('uncaughtException', (error) => {
		console.error(`Ошибка в процессе-воркере: ${error.stack}`);

		try {
			process.send({ type: 'error', message: error.message });
		} catch (sendError) {
			// канал уже закрыт — главный процесс узнает о сбое по коду выхода
		}

		process.exit(1);
	});

	process.on('message', (message) => {
		if (!message || message.type !== 'job') {
			return;
		}

		try {
			renderChunk(message.job);
		} catch (error) {
			process.send({ type: 'error', message: error.message });
			process.exit(1);
		}
	});

	// главный процесс отдаёт задание только после этого сообщения
	process.send({ type: 'ready' });
}

module.exports = {
	drawEpisode,
};
