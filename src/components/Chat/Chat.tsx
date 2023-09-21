import React, { FC, useRef, useState, useEffect } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import { getChatMessages, sendChatMessage } from '../../lib/api';
import ee from '../../lib/ee';

import * as s from './Chat.module.scss';

interface Props {
	isAuthorized: boolean;
}

interface IMessage {
	id: string;
	time: number;
	text: string;
	name: string;
	avatar: string;
}

export const Chat: FC<Props> = ({
	isAuthorized,
	...props,
}) => {
	const [list, setList] = useState<IMessage[]>([]);
	const [input, setInput] = useState('');
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 330, y: 60});
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
		});

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

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			<div className={s.content} ref={contentRef} {...props}>
				{list.map((message) => (
					<div key={message.id}>
						<div>{message.name}:</div>
						<div className={s.text}>{message.text}</div>
					</div>
				))}
			</div>
			<div className={s.publisher} {...props}>
				<input
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
