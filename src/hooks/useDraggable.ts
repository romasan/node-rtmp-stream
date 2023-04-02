import { useEffect, useRef } from 'react';

interface Props {
	x: number;
	y: number;
}

export const useDraggable = ({ x, y }: Props): { anchorRef: React.RefObject<HTMLDivElement>, draggableRef: React.RefObject<HTMLDivElement> } => {
	const pos = useRef({ x, y });
	const cur = useRef([-1, -1]);
	const anchorRef = useRef<HTMLDivElement>(null);
	const draggableRef = useRef<HTMLDivElement>(null);

	const mouseDownCallback = ({ clientX, clientY, target }: MouseEvent) => {
		if (anchorRef.current?.contains(target as Node)) {
			cur.current = [clientX, clientY];
		}
	};

	const mouseMoveCallback = ({ clientX, clientY }: MouseEvent) => {
		if (cur.current.every((e) => e >= 0)) {
			const moveX = clientX - cur.current[0];
			const moveY = clientY - cur.current[1];

			pos.current = { x: pos.current.x + moveX, y: pos.current.y + moveY };
			cur.current = [clientX, clientY];

			if (draggableRef.current) {
				draggableRef.current.style.top = `${pos.current.y}px`;
				draggableRef.current.style.left = `${pos.current.x}px`;
			}
		}
	};

	const mouseUpCallback = () => {
		cur.current = [-1, -1];
	}

	const dragCallback = (event: DragEvent) => {
		event.preventDefault();
	}

	useEffect(() => {
		if (anchorRef.current && draggableRef.current) {
			draggableRef.current.style.top = `${pos.current.y}px`;
			draggableRef.current.style.left = `${pos.current.x}px`;

			document.addEventListener('mousedown', mouseDownCallback);
			document.addEventListener('mousemove', mouseMoveCallback);
			document.addEventListener('mouseup', mouseUpCallback);
			document.addEventListener('drag', dragCallback);

			return () => {
				document.removeEventListener('mousedown', mouseDownCallback);
				document.removeEventListener('mousemove', mouseMoveCallback);
				document.removeEventListener('mouseup', mouseUpCallback);
				document.removeEventListener('drag', dragCallback);
			};
		}

		return undefined;
	}, [anchorRef.current, draggableRef.current]);

	return {
		anchorRef,
		draggableRef,
	};
};
