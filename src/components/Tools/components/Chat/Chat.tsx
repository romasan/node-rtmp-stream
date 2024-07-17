import React, { FC, useState, useMemo } from 'react';

import { Block } from '../Block';

import { formatDate } from '/src/helpers';

import { useModal } from '/src/hooks';

import { get, post, put, patch, drop } from '../../helpers';

import * as s from './Chat.module.scss';

export const Chat: FC = () => {
	const [messages, setMessages] = useState<any[]>([]);
	const [count, setCount] = useState('100');
	const [id, setId] = useState<null | string>(null);
	const [newText, setNewText] = useState('');
	const [nick, setNick] = useState('');

	const selectedMessage = useMemo(() => {
		return messages.find((message) => message.id === id) || {};
	}, [id, messages]);

	const edit = () => {
		patch('chat', JSON.stringify({
			id,
			text: newText,
		}));
		setMessages((messages) => messages.map((message) => {
			if (message.id === id) {
				return {
					...message,
					text: newText,
				};
			}

			return message;
		}));
		editModal.close();
	};

	const onChangeNick = (event: any) => {
		setNick(event.target.value);
	};

	const muteByNick = () => {
		put('ban', JSON.stringify({ type: 'mute', value: nick }), false)
			.then(() => handleOpen())
			.catch(() => {/* */})
			.finally(() => setNick(''));
	};

	const deleteAllByNick = () => {
		drop('chat', JSON.stringify({ nick }));
		setMessages((messages) => messages.filter((message) => message.name !== nick));
		setNick('');
	};

	const editModal = useModal({
		content: (
			<div>
				<div>Edit</div>
				<div>From: {selectedMessage.name}</div>
				<div>
					<textarea rows={10} cols={60} onChange={({ target }) => setNewText(target.value)}>{selectedMessage.text}</textarea>
				</div>
				<div>
					<button disabled={!newText} onClick={edit}>save</button>
				</div>
			</div>
		),
		portal: true,
	});

	const handleOpen = () => {
		get('chat')
			.then(setMessages)
			.catch(() => {/* */});
	};

	const startEdit = (value: string) => {
		setId(value);
		setNewText('');
		editModal.open();
	};

	const dropMessage = (id: string) => {
		drop('chat', JSON.stringify({ id }));
		setMessages((messages) => messages.filter((message) => message.id !== id));
	};

	const addMessage = () => {
		post('chat', JSON.stringify({
			text: newText,
		}));
	};

	const reload = () => {
		get(`chat?count=${count}`)
			.then(setMessages)
			.catch(() => {/* */});
	};

	return (
		<Block title="🔏 Модерация чата" onOpen={handleOpen}>
			<div>
				<div>
					<input value={count} onChange={({ target: { value }}) => setCount(value)} size={7} placeholder="COUNT" />
					<button onClick={reload}>load</button>
					loaded: {messages.length}
				</div>
				<div>
					<input placeholder="NICKNAME" onChange={onChangeNick} />
					<button onClick={muteByNick}>mute</button>
					<button onClick={deleteAllByNick}>delete all</button>
					<button disabled>filter</button>
				</div>
			</div>
			<div className={s.list}>
				{messages.map((message) => (
					<div key={message.id} className={s.item}>
						<div>
							<b>{message.name}</b> ({formatDate(message.time)}):
						</div>
						<div>
							{message.text}
						</div>
						<div className={s.controls}>
							<button onClick={() => startEdit(message.id)}>&#9998;</button>
							<button onClick={() => dropMessage(message.id)}>&times;</button>
						</div>
					</div>
				))}
			</div>
			<div>
				Admin:
				<input size={25} placeholder="MESSAGE" onChange={({ target }) => setNewText(target.value)}/>
				<button onClick={addMessage}>add</button>
			</div>
			{editModal.render()}
		</Block>
	);
};
