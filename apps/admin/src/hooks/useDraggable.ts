import { useEffect, useRef } from 'react';

interface Props {
	x: number;
	y: number;
	ready?: boolean;
	hoisting?: boolean;
}

export const useDraggable = ({
	x,
	y,
	ready = true,
	hoisting = true,
}: Props): { anchorRef: React.RefObject<HTMLDivElement>, draggableRef: React.RefObject<HTMLDivElement> } => {
	const pos = useRef({ x, y });
	const cur = useRef([-1, -1, false]);
	const anchorRef = useRef<HTMLDivElement>(null);
	const draggableRef = useRef<HTMLDivElement>(null);

	const mouseDownCallback = (event: MouseEvent) => {
		event.stopPropagation();

		const { clientX, clientY, target } = event;

		if (
			ready &&
			anchorRef.current &&
			anchorRef.current.contains(target as Node) &&
			draggableRef.current
		) {
			cur.current = [clientX, clientY, draggableRef.current.contains(target as Node)];
		}
	};

	const mouseMoveCallback = (event: MouseEvent) => {
		event.stopPropagation();

		const { clientX, clientY } = event;

		if (ready && (Number(cur.current[0]) >= 0 || Number(cur.current[1]) >= 0)) {
			const moveX = clientX - Number(cur.current[0] || 0);
			const moveY = clientY - Number(cur.current[1] || 0);

			pos.current = { x: pos.current.x + moveX, y: pos.current.y + moveY };
			cur.current = [clientX, clientY];

			if (draggableRef.current) {
				draggableRef.current.style.top = `${pos.current.y}px`;
				draggableRef.current.style.left = `${pos.current.x}px`;
			}
		}
	};

	const mouseUpCallback = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if (hoisting && cur.current[2]) {
			[...document.querySelectorAll('.draggable-window') as any].forEach((el) => {
				if (el && (el as any).style) {
					(el as any).style.zIndex = '100';
				}
			});
			
			if (draggableRef.current) {
				draggableRef.current.style.zIndex = '101';
			}
		}

		cur.current = [-1, -1, false];
	};

	const dragCallback = (event: DragEvent) => {
		event.preventDefault();
	};

	useEffect(() => {
		if (ready && anchorRef.current && draggableRef.current) {
			draggableRef.current.style.top = `${pos.current.y}px`;
			draggableRef.current.style.left = `${pos.current.x}px`;
			draggableRef.current.style.zIndex = '100';
			draggableRef.current.classList.add('draggable-window');

			document.addEventListener('mousedown', mouseDownCallback);
			document.addEventListener('mousemove', mouseMoveCallback);
			document.addEventListener('mouseup', mouseUpCallback);
			document.addEventListener('drag', dragCallback);

			return () => {
				if (draggableRef.current) {
					draggableRef.current.classList.remove('draggable-window');
				}

				document.removeEventListener('mousedown', mouseDownCallback);
				document.removeEventListener('mousemove', mouseMoveCallback);
				document.removeEventListener('mouseup', mouseUpCallback);
				document.removeEventListener('drag', dragCallback);
			};
		}

		return undefined;
	}, [ready, anchorRef.current, draggableRef.current]);

	return {
		anchorRef,
		draggableRef,
	};
};
