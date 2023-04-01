const log = ({x, y, color, nickname}) => {
	const line = [Date.now(), nickname, x, y, color].join(';');
	console.log('LOG:', line);
}

module.exports = log;
