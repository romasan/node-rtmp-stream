import React, { FC, FormEvent, useCallback, useId, useRef, useState } from 'react';
import cn from 'classnames';

import { Block } from '../Block';
import { colorSchemes } from '../../../../../../server/constants/colorSchemes';
import { loadCanvas, loadPaused, saveCanvas, savePaused } from './api';
import { CanvasSettings, Corner, createResizePlan, dimensionError } from './model';
import * as s from './Expand.module.scss';

interface Draft { width: string; height: string; colorScheme: string; corner: Corner; }
const makeDraft = (settings: CanvasSettings): Draft => ({ width: String(settings.width), height: String(settings.height), colorScheme: settings.colorScheme, corner: 'LT' });
const number = new Intl.NumberFormat('ru-RU');
const plural = new Intl.PluralRules('ru');
const quantity = (count: number, one: string, few: string, many: string) => `${number.format(count)} ${{ one, few, many, other: many, zero: many, two: few }[plural.select(count)]}`;
const message = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
const paletteNames: Record<string, string> = {
	COLORS_1: '16 цветов', COLORS: '24 цвета', COLORS_32: '32 цвета',
	blackwhite: 'Чёрно-белая', black: 'Только чёрный', white: 'Только белый', truecolor: 'Произвольные цвета',
};
const paletteName = (key: string) => paletteNames[key] || key;
const corners: { value: Corner; title: string; icon: string }[] = [
	{ value: 'LT', title: 'Слева сверху', icon: '↖' }, { value: 'RT', title: 'Справа сверху', icon: '↗' },
	{ value: 'LB', title: 'Слева снизу', icon: '↙' }, { value: 'RB', title: 'Справа снизу', icon: '↘' },
];

const Preview = ({ current, plan }: { current: CanvasSettings; plan: ReturnType<typeof createResizePlan> }) => {
	const patternId = `expansion-${useId().replace(/:/g, '')}`;
	const scale = Math.min(276 / plan.next.width, 126 / plan.next.height);
	const width = plan.next.width * scale;
	const height = plan.next.height * scale;
	const x = (300 - width) / 2;
	const y = (150 - height) / 2;
	return <div className={s.preview}>
		<svg viewBox="0 0 300 150" role="img" aria-label={`Предпросмотр расширения: ${plan.next.width} на ${plan.next.height} пикселей`}>
			<defs><pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#203b4f" /><path d="M-2 2L2 -2M0 8L8 0M6 10L10 6" stroke="#426883" strokeWidth="1" /></pattern></defs>
			<rect x={x} y={y} width={width} height={height} fill={`url(#${patternId})`} stroke="#75baff" strokeWidth="1" />
			<rect x={x + plan.growth.left * scale} y={y + plan.growth.top * scale} width={current.width * scale} height={current.height * scale} fill="#36414a" stroke="#a2aeb8" strokeWidth="1" />
		</svg>
		<div className={s.legend}><span><i />Текущее полотно</span><span><i className={s.newArea} />Новая область</span></div>
	</div>;
};

export const Expand: FC = () => {
	const [settings, setSettings] = useState<CanvasSettings | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [paused, setPaused] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(false);
	const [canvasError, setCanvasError] = useState('');
	const [pauseError, setPauseError] = useState('');
	const [pending, setPending] = useState<'save' | 'pause' | null>(null);
	const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
	const feedbackRef = useCallback((element: HTMLDivElement | null) => {
		element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, []);
	const [edited, setEdited] = useState(false);
	const editedRef = useRef(false);
	const requestInProgress = useRef(false);

	const load = async () => {
		if (requestInProgress.current) return;
		requestInProgress.current = true;
		setLoading(true);
		setCanvasError('');
		setPauseError('');
		const [canvas, pause] = await Promise.allSettled([loadCanvas(), loadPaused()]);
		if (canvas.status === 'fulfilled') {
			setSettings(canvas.value);
			if (!editedRef.current) setDraft(makeDraft(canvas.value));
		} else setCanvasError(message(canvas.reason));
		if (pause.status === 'fulfilled') setPaused(pause.value);
		else setPauseError(message(pause.reason));
		requestInProgress.current = false;
		setLoading(false);
	};

	const edit = (value: Partial<Draft>) => {
		editedRef.current = true;
		setEdited(true);
		setDraft(previous => previous && ({ ...previous, ...value }));
		setFeedback(null);
	};
	const reset = () => {
		if (!settings || requestInProgress.current) return;
		setDraft(makeDraft(settings));
		setEdited(false);
		editedRef.current = false;
		setFeedback(null);
	};

	const widthError = settings && draft ? dimensionError(draft.width, settings.width) : '';
	const heightError = settings && draft ? dimensionError(draft.height, settings.height) : '';
	const plan = settings && draft && !widthError && !heightError
		? createResizePlan(settings, Number(draft.width), Number(draft.height), draft.corner, draft.colorScheme) : null;
	const areaError = plan && !Number.isSafeInteger(plan.next.width * plan.next.height) ? 'Слишком большой размер полотна.' : '';
	const busy = loading || Boolean(pending);
	const canSave = Boolean(plan?.changed && !areaError && !busy && !canvasError);

	const apply = async (event: FormEvent) => {
		event.preventDefault();
		if (!plan || !canSave || requestInProgress.current) return;
		requestInProgress.current = true;
		setPending('save');
		setFeedback(null);
		try {
			await saveCanvas(plan.next);
			setSettings(plan.next);
			setDraft(makeDraft(plan.next));
			setEdited(false);
			editedRef.current = false;
			setFeedback({ kind: 'success', text: 'Размер и палитра применены.' });
		} catch (error) {
			setFeedback({ kind: 'error', text: message(error) });
		} finally {
			requestInProgress.current = false;
			setPending(null);
		}
	};
	const togglePause = async () => {
		if (paused === null || busy || pauseError || requestInProgress.current) return;
		requestInProgress.current = true;
		setPending('pause');
		setFeedback(null);
		try {
			await savePaused(!paused);
			setPaused(!paused);
			setFeedback({ kind: 'success', text: paused ? 'Рисование возобновлено.' : 'Рисование приостановлено.' });
		} catch (error) {
			setFeedback({ kind: 'error', text: message(error) });
		} finally {
			requestInProgress.current = false;
			setPending(null);
		}
	};

	const palette = draft ? (colorSchemes as Record<string, Record<string, string>>)[draft.colorScheme] : null;
	const growth = plan ? [
		plan.growth.left && `${quantity(plan.growth.left, 'столбец', 'столбца', 'столбцов')} слева`,
		plan.growth.right && `${quantity(plan.growth.right, 'столбец', 'столбца', 'столбцов')} справа`,
		plan.growth.top && `${quantity(plan.growth.top, 'строка', 'строки', 'строк')} сверху`,
		plan.growth.bottom && `${quantity(plan.growth.bottom, 'строка', 'строки', 'строк')} снизу`,
	].filter(Boolean).join(' · ') : '';

	return <Block id="canvas-settings" title="🖼️ Полотно и палитра" onOpen={load}>
		<div className={s.root}>
			<div className={s.toolbar}><span>Настройки полотна</span><button type="button" disabled={busy} onClick={() => void load()}>{loading ? 'Загрузка…' : 'Обновить'}</button></div>
			<section className={s.section} aria-label="Состояние полотна">
				<div className={s.statusRow}>
					<span className={cn(s.status, { [s.paused]: paused, [s.unknown]: paused === null || Boolean(pauseError) })}><i />{pauseError || paused === null ? 'Статус недоступен' : paused ? 'Рисование приостановлено' : 'Рисование включено'}</span>
					<button type="button" disabled={busy || paused === null || Boolean(pauseError)} onClick={() => void togglePause()}>{pending === 'pause' ? 'Изменение…' : paused ? 'Возобновить' : 'Приостановить'}</button>
				</div>
				<p className={s.hint}>Пауза меняет доступ к рисованию сразу.</p>
				{pauseError && <p className={s.error} role="alert">{pauseError}</p>}
			</section>
			{feedback && <div key={`${feedback.kind}:${feedback.text}`} ref={feedbackRef} className={cn(s.feedback, { [s.errorFeedback]: feedback.kind === 'error' })} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}
			{canvasError && <div className={cn(s.feedback, s.errorFeedback)} role="alert">{canvasError}</div>}
			{!settings || !draft ? <div className={s.empty} role="status">{loading ? 'Загрузка настроек…' : 'Настройки не загружены. Нажмите «Обновить».'}</div>
				: <form onSubmit={apply} noValidate>
					<fieldset className={s.section} disabled={busy}>
						<legend>Размер и расширение</legend>
						<div className={s.current}>Текущий размер <strong>{number.format(settings.width)} × {number.format(settings.height)} px</strong></div>
						<div className={s.dimensions}>
							<label htmlFor="canvas-width">Ширина<input id="canvas-width" aria-label="Ширина" type="number" inputMode="numeric" step="1" min={settings.width} value={draft.width} aria-invalid={Boolean(widthError)} aria-describedby="canvas-width-error" onChange={event => edit({ width: event.target.value })} /><span id="canvas-width-error" className={s.error}>{widthError}</span></label>
							<label htmlFor="canvas-height">Высота<input id="canvas-height" aria-label="Высота" type="number" inputMode="numeric" step="1" min={settings.height} value={draft.height} aria-invalid={Boolean(heightError)} aria-describedby="canvas-height-error" onChange={event => edit({ height: event.target.value })} /><span id="canvas-height-error" className={s.error}>{heightError}</span></label>
						</div>
						<div className={s.anchorLabel}><span>Угол закрепления</span><strong>{corners.find(corner => corner.value === draft.corner)?.title}</strong></div>
						<div className={s.corners} role="group" aria-label="Угол закрепления полотна">
							{corners.map(corner => <button type="button" key={corner.value} className={cn(s.corner, { [s.selected]: draft.corner === corner.value })} aria-label={corner.title} title={corner.title} aria-pressed={draft.corner === corner.value} onClick={() => edit({ corner: corner.value })}><span aria-hidden="true">{corner.icon}</span></button>)}
						</div>
						{plan && !areaError ? <><Preview current={settings} plan={plan} /><div className={s.previewSize}>{number.format(plan.next.width)} × {number.format(plan.next.height)} px{plan.addedPixels > 0 && <span>+{number.format(plan.addedPixels)} пикселей</span>}</div></> : <div className={s.empty}>{areaError || 'Укажите корректные размеры для предпросмотра.'}</div>}
					</fieldset>
					<fieldset className={s.section} disabled={busy}>
						<legend>Палитра</legend>
						<label className={s.paletteLabel} htmlFor="canvas-palette">Набор цветов<select id="canvas-palette" value={draft.colorScheme} onChange={event => edit({ colorScheme: event.target.value })}>
							{!Object.prototype.hasOwnProperty.call(colorSchemes, draft.colorScheme) && <option value={draft.colorScheme}>Текущая: {draft.colorScheme}</option>}
							{Object.keys(colorSchemes).map(key => <option key={key} value={key}>{paletteName(key)}</option>)}
						</select></label>
						{draft.colorScheme === 'truecolor' && <p className={s.hint}>Свободный выбор цвета. Ниже — образцы стартовой палитры.</p>}
						{palette && <div className={s.swatches} aria-label="Образцы палитры">{Object.entries(palette).map(([name, color]) => <span key={name} className={s.swatch} style={{ backgroundColor: color }} title={`${name} · ${color}`} role="img" aria-label={`${name}: ${color}`} />)}</div>}
						<p className={s.hint}>Существующие пиксели сохранят свой цвет.</p>
					</fieldset>
					<div className={s.summary} aria-live="polite">
						<strong>{plan?.changed ? 'К применению' : plan ? 'Изменений нет' : 'Проверьте размеры'}</strong>
						{plan && !areaError && <>{growth && <p>{growth}</p>}{draft.colorScheme !== settings.colorScheme && <p>Палитра: {paletteName(settings.colorScheme)} → {paletteName(draft.colorScheme)}</p>}</>}
						{areaError && <p className={s.error}>{areaError}</p>}
					</div>
					<div className={s.actions}><button className={s.apply} type="submit" disabled={!canSave}>{pending === 'save' ? 'Применение…' : 'Применить'}</button><button type="button" onClick={reset} disabled={!edited || busy}>Сбросить</button></div>
				</form>}
		</div>
	</Block>;
};
