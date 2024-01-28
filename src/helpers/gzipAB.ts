export const gzipAB = async (input: ArrayBuffer, compress = false) => {
	const cs = compress ? new CompressionStream('gzip') : new DecompressionStream('gzip');
	const writer = cs.writable.getWriter();
	const reader = cs.readable.getReader();
	const output = [];
	let totalSize = 0;

	void writer.write(input);
	void writer.close();

	for (let item; (item = await reader.read()) && !item.done;) {
		output.push(item.value);
		totalSize += item.value.byteLength;
	}

	const concatenated = new Uint8Array(totalSize);
	let offset = 0;

	for (const array of output) {
		concatenated.set(array, offset);
		offset += array.byteLength;
	}

	return concatenated;
};
