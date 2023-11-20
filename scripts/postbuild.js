const fs = require('fs');

const file = __dirname + '/../dist/sitemap.xml';
const source = fs.readFileSync(file).toString();
const date = new Date().toISOString().split("T")[0];

fs.writeFileSync(file, source.replace(/DATETIME/ig, date));
