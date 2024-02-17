const fs = require('fs');

const replaceInFile = (file, callback) => {
	const source = fs.readFileSync(file).toString();

	fs.writeFileSync(file, callback(source));
};

const date = new Date().toISOString().split('T')[0];

replaceInFile(
	__dirname + '/../dist/sitemap.xml',
	(source) => source.replace(/DATETIME/ig, date),
);

replaceInFile(
	__dirname + '/../dist/index.html',
	(source) => source.replace('<noscript>WEBSITE SHEMA</noscript>', `\
<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "Pixel Battle",
		"alternateName": ["Пиксель Батл"],
		"url": "https://www.pixelbattles.ru/"
	}
</script>`),
);
