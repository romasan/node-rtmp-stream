const fs = require('fs');
const { siteMetadata, dateSitemap } = require('./site-metadata');

const replaceInFile = (file, callback) => {
	const source = fs.readFileSync(file).toString();

	fs.writeFileSync(file, callback(source));
};

replaceInFile(
	__dirname + '/../dist/sitemap.xml',
	dateSitemap,
);

replaceInFile(
	__dirname + '/../dist/index.html',
	siteMetadata,
);

replaceInFile(
	__dirname + '/../dist/tg/index.html',
	(source) => source.replace(/(\b(?:href|src)=["']?)\/tg\//ig, '$1./'),
);
