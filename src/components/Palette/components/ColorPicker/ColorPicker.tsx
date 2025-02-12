import React, { useRef, useState } from 'react';

import cn from 'classnames';

import { useDraggable } from '../../../../hooks/useDraggable';
import { rgbToHex, hexToRgb, isHEX, blendColorWhiteBlack } from '../../../../helpers/color';

import mobile from 'is-mobile';

// import { useDraggable } from '../../hooks/useDraggable';

import * as s from './ColorPicker.module.scss';

const colors = [
    [255, 0, 0],    // red
    [255, 255, 0],  // yellow
    [0, 255, 0],    // green
    [0, 255, 255],  // cyan
    [0, 0, 255],    // blue
    [255, 0, 255],  // magenta
    [255, 0, 0]     // red (again)
];

const interpolateColor = (i: number, index: number, ratio: number) =>
    Math.round(colors[index][i] + (colors[index + 1][i] - colors[index][i]) * ratio);

const getColorInRainbow = (percent: number) => {
    let position = (percent / 100) * 6;
    let index = Math.floor(position);
    let ratio = position - index;

    return rgbToHex([
        interpolateColor(0, index, ratio),
        interpolateColor(1, index, ratio),
        interpolateColor(2, index, ratio),
    ]);
};

const getColorInPicker = (percent: number, percentX: number, percentY: number) => {
	const color = getColorInRainbow(percent);

	return blendColorWhiteBlack(color, (100 - percentX) / 100, percentY / 100);
};

const getPickerPosition = (targetColor: string) => {
    const targetRgb = hexToRgb(targetColor);

    let bestMatch = null;
    let bestDistance = Infinity;

    for (let percent = 0; percent <= 100; percent += 1) {
        for (let percentX = 0; percentX <= 100; percentX += 1) {
            for (let percentY = 0; percentY <= 100; percentY += 1) {
                const color = getColorInPicker(percent, percentX, percentY);
                const rgb = hexToRgb(color);

                const distance = Math.sqrt(
                    Math.pow(rgb[0] - targetRgb[0], 2) +
                    Math.pow(rgb[1] - targetRgb[1], 2) +
                    Math.pow(rgb[2] - targetRgb[2], 2)
                );

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = [percent, percentX, percentY];
                }

                if (bestDistance === 0) {
                    return bestMatch;
                }
            }
        }
    }

    return bestMatch;
};

interface Props {
    onChange: (value: string) => void;
    onClose: () => void;
}

export const ColorPicker: React.FC<Props> = ({ onChange, onClose }) => {
    const [baseColor, setBaseColor] = useState('#0000ff');
    const [pickerColor, setPickerColor] = useState('#0000ff');
    const [textColor, setTextColor] = useState('#0000ff');
    const refRainbow = useRef(null);
    const refPicker = useRef(null);

    const isMobile = mobile();

    const { anchorRef, draggableRef } = useDraggable({ x: 200, y: window.innerHeight - 400, ready: !isMobile });

    const handleClickRainbow = (event: any) => {
        const rect = (refRainbow.current as any).getBoundingClientRect();
        const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

        setBaseColor(getColorInRainbow(y))
    };

    const handleClickPicker = (event: any) => {
        const rect = (refPicker.current as any).getBoundingClientRect();
        const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
        const color = blendColorWhiteBlack(baseColor, (100 - x) / 100, y / 100);

        setPickerColor(color);
        setTextColor(color);
    };

    const handleChangeText = (event: any) => {
        setTextColor(event.target.value)
    };

    const handleBlurText = (event: any) => {
        if (isHEX(textColor)) {
            setPickerColor(textColor);
        } else {
            setTextColor(pickerColor);
        }
    };

    return (
        <div className={s.root} ref={draggableRef}>
            <div className={s.draggable} ref={anchorRef}>
                <button className={s.close} onClick={onClose}>&times;</button>
            </div>
            <div>
                <div className={s.wrapper}>
                    <div
                        ref={refPicker}
                        className={cn(s.picker, s.color)}
                        style={{ backgroundColor: baseColor }}
                        onClick={handleClickPicker}
                    >
                        <div className={cn(s.picker, s.gradientWhite)}>
                            <div className={cn(s.picker, s.gradientBlack)}></div>
                        </div>
                    </div>
                    <div className={s.rainbow} ref={refRainbow} onClick={handleClickRainbow}></div>
                </div>
                <div className={s.info}>
                    <div className={s.output} style={{ backgroundColor: pickerColor }}></div>
                    <div className={s.colorLabel}>Цвет:</div>
                    <input
                        value={textColor}
                        size={7}
                        className={s.input}
                        onChange={handleChangeText}
                        onBlur={handleBlurText}
                    />
                </div>
                <div className={s.footer}>
                    <button className={s.button}>OK</button>
                    <button className={s.button} onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    );
};
