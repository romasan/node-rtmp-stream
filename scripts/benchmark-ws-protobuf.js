const { decodeWsMessage, encodeWsMessage } = require('../lib/utils/wsProtocol');

const samples = [
	{ event: 'drawPix', payload: { x: 1234, y: 5678, color: '#aabbcc' } },
	{ event: 'countdown', payload: 12_345 },
	{ event: 'online', payload: 1_234 },
	{ event: 'init', payload: {
		id: 'test', name: 'test', avatar: '', area: 'local',
		countdown: 3000, isAuthorized: true,
		canvas: { width: 300, height: 300, shiftX: 100, shiftY: 200, colorScheme: 'COLORS_32' },
		finish: 'newer',
		finishText: 'Сезон окончен, таймлапс как это было скоро можно будет посмотреть',
		needAuthorize: true,
		paused: false,
	} },
	{ event: 'chatMessage', payload: {
		id: '6d422732-1342-4ae5-be42-4a0310466698',
		time: 1792884864843,
		text: '45t4t',
		name: 'test',
		area: 'local',
	} },
	{ event: 'pause', payload: true },
	{ event: 'expand', payload: {
		width: 320, height: 240, shiftX: 10, shiftY: -20, colorScheme: 'COLORS_32',
	} },
];
const iterations = Number(process.env.WS_BENCH_ITERATIONS || 100_000);

const measure = (fn) => {
	const start = process.hrtime.bigint();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	return Number(process.hrtime.bigint() - start) / 1e6;
};

for (const { event, payload } of samples) {
	const json = JSON.stringify({ event, payload });
	const binary = encodeWsMessage(event, payload);
	const jsonBytes = Buffer.byteLength(json);
	const binaryBytes = binary.byteLength;
	const jsonEncodeMs = measure(() => JSON.stringify({ event, payload }));
	const protobufEncodeMs = measure(() => encodeWsMessage(event, payload));
	const jsonDecodeMs = measure(() => JSON.parse(json));
	const protobufDecodeMs = measure(() => decodeWsMessage(binary));

	console.log(`${event}: ${jsonBytes} -> ${binaryBytes} bytes (${(100 - (binaryBytes / jsonBytes) * 100).toFixed(1)}% smaller)`);
	console.log(`  encode ${iterations.toLocaleString()}x: JSON ${jsonEncodeMs.toFixed(1)} ms, protobuf ${protobufEncodeMs.toFixed(1)} ms`);
	console.log(`  decode ${iterations.toLocaleString()}x: JSON ${jsonDecodeMs.toFixed(1)} ms, protobuf ${protobufDecodeMs.toFixed(1)} ms`);
}
