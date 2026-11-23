import React, { FC, FormEvent, useCallback, useRef, useState } from 'react';
import { Block } from '../Block';
import { ChatMessage, filterMessages } from './model';
import { CHAT_LIMITS, deleteAuthorMessages, deleteMessage, editMessage, loadMessages, muteAuthor, sendMessage } from './api';
import * as s from './Chat.module.scss';

interface Editor { id: string; text: string; original: string; }
type Pending = { kind: 'load' | 'send' | 'edit' | 'mute' | 'purge' } | { kind: 'delete'; id: string };
const platformName = (area: string) => ({ steam: 'Steam', twitch: 'Twitch', discord: 'Discord', telegram: 'Telegram', system: 'Система' }[area] || area || 'Неизвестно');
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
const timeLabel = (time: number | null) => time === null ? 'Время неизвестно' : new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const Chat: FC = () => {
	const [messages, setMessages] = useState<ChatMessage[] | null>(null);
	const [count, setCount] = useState(100);
	const [query, setQuery] = useState('');
	const [author, setAuthor] = useState<string | null>(null);
	const [confirmNick, setConfirmNick] = useState<string | null>(null);
	const [editor, setEditor] = useState<Editor | null>(null);
	const [composer, setComposer] = useState('');
	const [pending, setPending] = useState<Pending | null>(null);
	const [loadError, setLoadError] = useState('');
	const [authorError, setAuthorError] = useState('');
	const [editorError, setEditorError] = useState('');
	const [composerError, setComposerError] = useState('');
	const [rowError, setRowError] = useState<{ id: string; text: string } | null>(null);
	const [notice, setNotice] = useState('');
	const inFlight = useRef(false);
	const noticeRef = useCallback((element: HTMLDivElement | null) => {
		element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, []);
	const busy = pending !== null;
	const unavailable = busy || !messages || Boolean(loadError);
	const nick = author || '';
	const visible = filterMessages(messages || [], query).reverse();
	const authorCount = (messages || []).filter(message => message.name === nick).length;

	const run = async (action: Pending, operation: () => Promise<void>, onError: (text: string) => void) => {
		if (inFlight.current) return;
		inFlight.current = true;
		setPending(action);
		setNotice('');
		onError('');
		try {
			await operation();
		} catch (error) {
			onError(errorMessage(error));
		} finally {
			inFlight.current = false;
			setPending(null);
		}
	};
	const reload = (limit = count) => run({ kind: 'load' }, async () => {
		setMessages(await loadMessages(limit));
	}, setLoadError);
	const chooseAuthor = (name: string) => {
		setAuthor(name);
		setConfirmNick(null);
		setAuthorError('');
	};
	const mute = () => {
		if (!nick.trim() || unavailable || editor) return;
		void run({ kind: 'mute' }, async () => {
			await muteAuthor(nick);
			setNotice(`Мьют для «${nick}» добавлен.`);
		}, setAuthorError);
	};
	const purge = () => {
		if (!confirmNick || unavailable || editor) return;
		const target = confirmNick;
		void run({ kind: 'purge' }, async () => {
			await deleteAuthorMessages(target);
			setMessages(previous => previous && previous.filter(message => message.name !== target));
			setConfirmNick(null);
			setNotice(`История сообщений «${target}» удалена.`);
		}, setAuthorError);
	};
	const remove = (id: string) => {
		if (unavailable || editor || confirmNick) return;
		void run({ kind: 'delete', id }, async () => {
			await deleteMessage(id);
			setMessages(previous => previous && previous.filter(message => message.id !== id));
			setNotice('Сообщение удалено.');
		}, text => setRowError(text ? { id, text } : null));
	};
	const startEdit = (message: ChatMessage) => {
		setEditor({ id: message.id, text: message.text, original: message.text });
		setEditorError('');
		setRowError(null);
	};
	const saveEdit = (event: FormEvent) => {
		event.preventDefault();
		if (!editor || !editor.text.trim() || editor.text === editor.original || unavailable) return;
		const change = editor;
		void run({ kind: 'edit' }, async () => {
			await editMessage(change.id, change.text);
			setMessages(previous => previous && previous.map(message => message.id === change.id ? { ...message, text: change.text } : message));
			setEditor(null);
			setNotice('Сообщение изменено.');
		}, setEditorError);
	};
	const publish = (event: FormEvent) => {
		event.preventDefault();
		if (!composer.trim() || unavailable || editor || confirmNick) return;
		const text = composer.trim();
		void run({ kind: 'send' }, async () => {
			await sendMessage(text);
			setComposer('');
			setNotice('Сообщение администратора отправлено.');
			// Publishing succeeded even if the subsequent refresh fails. Do not offer to resend it.
			try {
				setMessages(await loadMessages(count));
				setLoadError('');
			} catch (error) {
				setLoadError(`Сообщение отправлено, но лента не обновилась. ${errorMessage(error)}`);
			}
		}, setComposerError);
	};

	return <Block id="chat-moderation" title="🔏 Модерация чата" onOpen={() => void reload()}>
		<div className={s.root}>
			<div className={s.toolbar}>
				<label htmlFor="chat-count">Последние сообщения<select id="chat-count" aria-label="Количество сообщений" value={count} disabled={busy || Boolean(editor) || Boolean(confirmNick)} onChange={event => {
					if (inFlight.current) return;
					const next = Number(event.target.value);
					setCount(next);
					void reload(next);
				}}>{CHAT_LIMITS.map(limit => <option key={limit} value={limit}>{limit}</option>)}</select></label>
				<button type="button" onClick={() => void reload()} disabled={busy || Boolean(editor) || Boolean(confirmNick)}>{pending?.kind === 'load' ? 'Загрузка…' : 'Обновить'}</button>
			</div>
			{loadError && <div className={s.error} role="alert">{loadError}</div>}
			{notice && <div key={notice} ref={noticeRef} className={s.notice} role="status">{notice}</div>}
			<label className={s.search} htmlFor="chat-search">Поиск в загруженной ленте<input id="chat-search" type="search" aria-label="Поиск в загруженной ленте" placeholder="Текст или никнейм…" value={query} disabled={!messages || Boolean(editor)} onChange={event => setQuery(event.target.value)} /></label>
			{author === null ? <div className={s.authorHint}><span>Нажмите на ник для действий с автором.</span><button type="button" disabled={unavailable || Boolean(editor)} onClick={() => chooseAuthor('')}>Указать ник</button></div>
				: <section className={s.authorPanel} aria-label="Действия с автором">
					<div className={s.panelTitle}><strong>Действия с автором</strong><button type="button" disabled={busy} onClick={() => { setAuthor(null); setConfirmNick(null); setAuthorError(''); }}>Закрыть</button></div>
					<label htmlFor="chat-author">Никнейм<input id="chat-author" aria-label="Автор для модерации" autoComplete="off" spellCheck={false} value={author} disabled={busy || Boolean(editor)} onChange={event => chooseAuthor(event.target.value)} /></label>
					<p className={s.hint}>В загруженном списке: {authorCount}. Мьют по нику, без срока.</p>
					<div className={s.actions}><button type="button" disabled={!nick.trim() || unavailable || Boolean(editor) || Boolean(confirmNick)} onClick={mute}>{pending?.kind === 'mute' ? 'Мьют…' : 'Замьютить'}</button><button type="button" className={s.danger} disabled={!nick.trim() || unavailable || Boolean(editor) || Boolean(confirmNick)} onClick={() => { setConfirmNick(nick); setAuthorError(''); }}>Удалить историю автора</button></div>
					{confirmNick && <div className={s.confirmation} role="group" aria-label="Подтверждение удаления истории">
						<strong>Удалить всю историю «{confirmNick}»?</strong>
						<p>Будут удалены все сообщения с этим точным ником на всех площадках, включая сообщения вне загруженного списка. Отменить удаление нельзя.</p>
						<div className={s.actions}><button type="button" className={s.danger} disabled={busy} onClick={purge}>{pending?.kind === 'purge' ? 'Удаление…' : 'Удалить всю историю'}</button><button type="button" disabled={busy} onClick={() => { setConfirmNick(null); setAuthorError(''); }}>Отмена</button></div>
					</div>}
					{authorError && <div className={s.error} role="alert">{authorError}</div>}
				</section>}
			<div className={s.listHeading}><span>{messages ? `${visible.length} из ${messages.length} загруженных` : 'Лента не загружена'}</span><span>Сначала новые</span></div>
			<div className={s.list} aria-label="Лента сообщений" aria-busy={pending?.kind === 'load'}>
				{!messages ? <div className={s.empty} role="status">{pending?.kind === 'load' ? 'Загрузка сообщений…' : 'Нажмите «Обновить», чтобы загрузить сообщения.'}</div>
					: !visible.length ? <div className={s.empty}>{query.trim() ? 'Ничего не найдено. Измените поисковый запрос.' : 'Сообщений пока нет.'}</div>
						: visible.map(message => <article key={message.id} className={s.message} aria-label={`Сообщение ${message.name || 'без имени'}`}>
							<header className={s.messageHeader}>
								{message.name ? <button type="button" className={s.authorName} aria-label={`Выбрать автора ${message.name}`} disabled={busy || Boolean(editor)} onClick={() => chooseAuthor(message.name)}>{message.name}</button> : <strong>Без имени</strong>}
								<span className={s.platform} title={platformName(message.area)}>{platformName(message.area)}</span>
								<time title={message.time === null ? undefined : new Date(message.time).toLocaleString('ru-RU')} dateTime={message.time === null ? undefined : new Date(message.time).toISOString()}>{timeLabel(message.time)}</time>
							</header>
							{editor?.id === message.id ? <form className={s.editor} onSubmit={saveEdit}>
								<label htmlFor="chat-edit-text">Текст сообщения</label>
								<textarea id="chat-edit-text" aria-label="Текст редактируемого сообщения" rows={4} value={editor.text} disabled={busy} onChange={event => { const text = event.target.value; setEditor(previous => previous && ({ ...previous, text })); }} />
								{editorError && <div className={s.error} role="alert">{editorError}</div>}
								<div className={s.actions}><button type="submit" className={s.primary} disabled={unavailable || !editor.text.trim() || editor.text === editor.original}>{pending?.kind === 'edit' ? 'Сохранение…' : 'Сохранить'}</button><button type="button" disabled={busy} onClick={() => { setEditor(null); setEditorError(''); }}>Отмена</button></div>
							</form> : <>
								<p className={s.text}>{message.text}</p>
								<div className={s.controls}><button type="button" disabled={unavailable || Boolean(editor) || Boolean(confirmNick)} onClick={() => startEdit(message)}>Изменить</button><button type="button" className={s.danger} disabled={unavailable || Boolean(editor) || Boolean(confirmNick)} onClick={() => remove(message.id)}>{pending?.kind === 'delete' && pending.id === message.id ? 'Удаление…' : 'Удалить'}</button></div>
								{rowError?.id === message.id && <div className={s.error} role="alert">{rowError.text}</div>}
							</>}
						</article>)}
			</div>
			<form className={s.composer} onSubmit={publish}>
				<label htmlFor="chat-admin-text">Сообщение администратора</label>
				<textarea id="chat-admin-text" aria-label="Сообщение администратора" placeholder="Сообщение от Admin для всех участников…" rows={3} value={composer} disabled={pending?.kind === 'send'} onChange={event => setComposer(event.target.value)} />
				{composerError && <div className={s.error} role="alert">{composerError}</div>}
				<div className={s.composerFooter}><span>{composer.length} симв.</span><button type="submit" className={s.primary} disabled={!composer.trim() || unavailable || Boolean(editor) || Boolean(confirmNick)}>{pending?.kind === 'send' ? 'Отправка…' : 'Отправить'}</button></div>
			</form>
		</div>
	</Block>;
};
