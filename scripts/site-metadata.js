const { year, episode } = require('../src/constants.json');

function siteMetadata(source) {
    return source.replace('<noscript>WEBSITE SHEMA</noscript>', `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Pixel Battle",
        "alternateName": ["Пиксель Батл"],
        "url": "https://www.pixelbattles.ru/"
    }
    </script>`).replace(/%Y_S_E%/ig, `${year} ${episode}`);
}

const dateSitemap = source => source.replace(/DATETIME/ig, new Date().toISOString().split('T')[0]);

module.exports = { siteMetadata, dateSitemap };
