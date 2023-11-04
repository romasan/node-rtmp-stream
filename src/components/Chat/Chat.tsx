import React, { FC, useRef, useState, useMemo, useCallback, useEffect } from 'react';

import cn from 'classnames';

import { useDraggable } from '../../hooks/useDraggable';

import { getChatMessages, sendChatMessage } from '../../lib/api';
import ee from '../../lib/ee';

import * as s from './Chat.module.scss';

interface Props {
	isAuthorized: boolean;
	nickname?: string;
	onClose: Function;
}

interface MessageProps {
	message: {
		name: string;
		text: string;
	};
	isAuthorized: boolean;
	nickname?: string;
	handleMention(name: string): void;
};

interface IMessage {
	id: string;
	time: number;
	text: string;
	name: string;
	avatar: string;
}

const renderText = (raw: string, nickname?: string): string => {
	return raw
		.replace(nickname ? new RegExp(`@(${nickname})`, "ig") : '\n', '<b>$1</b>')
		.replace(/(https\:\/\/www\.youtube\.com\/watch\?v\=[A-Za-z0-9_]+)/ig, '<a href="$1" target="_blank">$1</a>')
		.replace(/(https\:\/\/youtu\.be\/[A-Za-z0-9_\-]+)/ig, '<a href="$1" target="_blank">$1</a>')
};

export const Message: FC<MessageProps> = ({
	message,
	nickname,
	isAuthorized,
	handleMention,
}) => {
	const html = useMemo(() => renderText(message.text, nickname), []);

	return (
		<div>
			<div
				className={cn({ [s.clickable]: isAuthorized && message.name !== nickname })}
				onClick={() => handleMention(message.name)}
			>
				{message.name || '[EMPTY NICKNAME]'}:
			</div>
			<div className={s.text} dangerouslySetInnerHTML={{ __html: html }} />
		</div>
	);
};

export const Chat: FC<Props> = ({
	isAuthorized,
	nickname,
	onClose,
	...props,
}) => {
	const [list, setList] = useState<IMessage[]>([]);
	const [input, setInput] = useState('');
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 330, y: 60});
	const inputRef = useRef<HTMLInputElement>(null)l
	const contentRef = useRef<HTMLDivElement>(null);
	
	const goToBottom = () => {
		contentRef.current?.scrollTo(0, contentRef.current.scrollHeight);
	};

	const handleChatMessage = (message: IMessage) => {
		setList((value) => [...value, message]);
		setTimeout(() => {
			goToBottom();
		}, 0);
	};

	useEffect(() => {
		getChatMessages().then((messages) => {
			setList(messages);
			setTimeout(() => {
				goToBottom();
			}, 0);
			ee.on('ws:chatMessage', handleChatMessage);
		}).catch(() => {});

		return () => {
			ee.off('ws:chatMessage', handleChatMessage);
		}
	}, []);

	const onChange = (event: any) => {
		setInput(event?.target?.value || '');
	};

	const sendMessage = () => {
		if (input) {
			sendChatMessage(input);
			setInput('');
		}
	};

	const onKeyUp = (event: any) => {
		if (event?.code === 'Enter') {
			sendMessage();
		}
	};

	const handleMention = useCallback((name: string) => {
		if (isAuthorized && name && name !== nickname) {
			setInput((value) => `${value}${value ? ' ' : ''}@${name} `);
			inputRef.current?.focus();
		}
	}, [isAuthorized, nickname]);

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}>
				<button className={s.close} onClick={onClose}>&times;</button>
			</div>
			<div className={s.content} ref={contentRef} {...props}>
				{list.map((message) => (
					<Message
						key={message.id}
						message={message}
						isAuthorized={isAuthorized}
						nickname={nickname}
						handleMention={handleMention}
					/>
				))}
				{list.length === 0 && (
					<div>пока никто не писал</div>
				)}
			</div>
			<div className={s.publisher} {...props}>
				<input
					ref={inputRef}
					className={s.input}
					value={input}
					onChange={onChange}
					onKeyUp={onKeyUp}
					disabled={!isAuthorized}
					placeholder={isAuthorized ? 'Enter message' : 'Login for enter message'}
					title={'Press Enter for send message'}
				/>
				<button className={s.button} onClick={sendMessage} disabled={!isAuthorized} />
			</div>
		</div>
	);
}
