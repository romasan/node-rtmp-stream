export interface IExpand {
	canvas: {
		width: number;
		height: number;
	};
	index: {
		from: number;
		to: number;
	};
	part: {
		from: number;
		to: number;
	};
	shift: {
		x: number;
		y: number;
	};
	colorScheme: string;
	isTruecolor: boolean;
	colors: string[];
}

export interface ITimelapse {
	version?: string;
	colors?: Record<string, string>;
	colorSchemes?: Record<string, Record<string, string>>;
	expands?: IExpand[];
	episode?: string;
	total?: number;
	totalParts?: number;
	partSize?: number;
}

export enum ECursorType {
	PIXEL = 'PIXEL',
	TIME = 'TIME',
}