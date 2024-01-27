export interface IExpand {
	canvas: {
		width: number;
		height: number;
	},
	index: {
		from: number;
		to: number;
	},
	part: {
		from: number;
		to: number;
	}
}

export interface ITimelapse {
	colors?: Record<string, string>;
	expands?: IExpand[];
	episode?: string;
}
