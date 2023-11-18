const fs = require('fs');

const file = __dirname + '/../dist/index.html';

const source = fs.readFileSync(file).toString();

fs.writeFileSync(file, source.replace(/http:\/\/localhost:[\d]+/ig, ''));
