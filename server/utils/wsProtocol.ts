import * as protobuf from 'protobufjs';
import schema from '../../shared/ws-schema.json';

const messageType = protobuf.Root.fromJSON(schema as any).lookupType('rtmpstream.WsMessage');

const toColorNumber = (color: string) => parseInt(color.replace(/^#/, ''), 16);
const toColorString = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

export const encodeWsMessage = (event: string, payload: any): Uint8Array | null => {
	let message: any;

	switch (event) {
		case 'drawPix':
			message = { drawPix: { ...payload, color: toColorNumber(payload.color) } };
			break;
		case 'countdown':
			message = { cooldown: { milliseconds: payload } };
			break;
		case 'online':
			message = { online: { count: payload } };
			break;
		case 'init': {
			const canvas = payload?.canvas || {};
			const hasFinish = typeof payload?.finish === 'number';

			message = {
				init: {
					id: String(payload?.id || ''),
					name: String(payload?.name || ''),
					avatar: String(payload?.avatar || ''),
					area: String(payload?.area || ''),
					countdown: Number(payload?.countdown) || 0,
					isAuthorized: Boolean(payload?.isAuthorized),
					canvas: {
						width: Number(canvas.width) || 0,
						height: Number(canvas.height) || 0,
						shiftX: Number(canvas.shiftX) || 0,
						shiftY: Number(canvas.shiftY) || 0,
						colorScheme: String(canvas.colorScheme || ''),
					},
					hasFinish,
					finishMs: hasFinish ? Number(payload.finish) : 0,
					finishText: String(payload?.finishText || ''),
					needAuthorize: Boolean(payload?.needAuthorize),
					paused: Boolean(payload?.paused),
				},
			};
			break;
		}
		case 'chatMessage':
			message = {
				chatMessage: {
					id: String(payload?.id || ''),
					time: Number(payload?.time) || 0,
					text: String(payload?.text || ''),
					name: String(payload?.name || ''),
					area: String(payload?.area || ''),
				},
			};
			break;
		case 'pause':
			message = { pause: { paused: Boolean(payload) } };
			break;
		case 'expand':
			message = {
				expand: {
					width: Number(payload?.width) || 0,
					height: Number(payload?.height) || 0,
					shiftX: Number(payload?.shiftX) || 0,
					shiftY: Number(payload?.shiftY) || 0,
					colorScheme: String(payload?.colorScheme || ''),
				},
			};
			break;
		default:
			return null;
	}

	return messageType.encode(messageType.create(message)).finish();
};

export const decodeWsMessage = (data: Uint8Array) => {
	const message = messageType.toObject(messageType.decode(data), {
		defaults: true,
		oneofs: true,
		longs: Number,
	});

	if (message.body === 'drawPix') {
		return {
			event: 'drawPix',
			payload: { ...message.drawPix, color: toColorString(message.drawPix.color) },
		};
	}

	if (message.body === 'cooldown') {
		return { event: 'countdown', payload: message.cooldown.milliseconds };
	}

	if (message.body === 'online') {
		return { event: 'online', payload: message.online.count };
	}

	if (message.body === 'init') {
		const init = message.init || {};
		const canvas = init.canvas || {};

		return {
			event: 'init',
			payload: {
				id: init.id,
				name: init.name,
				avatar: init.avatar,
				area: init.area,
				countdown: init.countdown,
				isAuthorized: init.isAuthorized,
				canvas: {
					width: canvas.width,
					height: canvas.height,
					shiftX: canvas.shiftX,
					shiftY: canvas.shiftY,
					colorScheme: canvas.colorScheme,
				},
				finish: init.hasFinish ? init.finishMs : 'newer',
				finishText: init.finishText,
				needAuthorize: init.needAuthorize,
				paused: init.paused,
			},
		};
	}

	if (message.body === 'chatMessage') {
		const chatMessage = message.chatMessage || {};

		return {
			event: 'chatMessage',
			payload: {
				id: chatMessage.id,
				time: chatMessage.time,
				text: chatMessage.text,
				name: chatMessage.name,
				area: chatMessage.area,
			},
		};
	}

	if (message.body === 'pause') {
		return { event: 'pause', payload: message.pause.paused };
	}

	if (message.body === 'expand') {
		const expand = message.expand || {};

		return {
			event: 'expand',
			payload: {
				width: expand.width,
				height: expand.height,
				shiftX: expand.shiftX,
				shiftY: expand.shiftY,
				colorScheme: expand.colorScheme,
			},
		};
	}

	return null;
};
