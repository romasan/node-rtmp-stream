const fs = require('node:fs');
const path = require('node:path');
const { siteMetadata, dateSitemap } = require('./site-metadata');

const root = path.resolve(__dirname, '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const release = process.argv[3] === '--release';
const routes = ['', 'tg', 'timelapse'];

if (release) {
    for (const filename of ['404.html', 'login/index.html', 'logout/index.html', 'qq/index.html']) {
        fs.accessSync(path.join(dist, filename), fs.constants.R_OK);
    }
}

const prepared = routes.map(route => {
    const live = path.join(dist, route, 'index.html');
    const backup = path.join(dist, 'react', route, 'index.html');
    const previewFile = path.join(dist, 'slint', route, 'index.html');
    const preview = fs.readFileSync(previewFile, 'utf8');
    const current = fs.readFileSync(release ? path.join(root, 'pages', route, 'index.html') : live, 'utf8');
    const original = release ? siteMetadata(current)
        : current.includes('data-client=') ? fs.readFileSync(backup, 'utf8') : current;
    const prefix = route === 'timelapse' ? '../' : './';
    const assets = preview.replace(/(['"])(?:\.\.\/|\.\/)pkg\//g, `$1${prefix}slint/pkg/`);
    const fallback = route ? `/react/${route}/` : '/react/';
    const metadata = original.match(/<meta\b[^>]*>|<link\b[^>]*>|<title>[\s\S]*?<\/title>|<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi) || [];
    const retained = metadata.filter(tag =>
        !/^<meta\s+(?:charset\b|name="viewport")/i.test(tag)
        && !/^<link\b[^>]*\srel=["']?stylesheet\b/i.test(tag));
    const html = assets.replace('<title>Пиксель Батл · Slint</title>', retained.join('\n    '));
    if (release) {
        const migrated = html
            .replace(/href="(?:\.\.\/)+assets\/([\w.-]+)"/g, (_, filename) => {
                fs.copyFileSync(path.join(root, 'assets', filename), path.join(dist, filename));
                return `href="/${filename}"`;
            })
            .replace(/<a href="[^"]*">Открыть React-версию<\/a>/, '<button type="button" onclick="location.reload()">Повторить</button>');
        return { route, live, migrated, previewFile };
    }
    // Use the original route as the base so Parcel assets keep their original URLs.
    const reactBase = route ? `/${route}/` : '/';
    const legacy = /<base\b/i.test(original) ? original : original.replace(/<head>/i, `<head><base href="${reactBase}">`);
    const migrated = html.replace(`href="/${route ? route + '/' : ''}"`, `href="${fallback}"`);
    return { route, live, backup, migrated, legacy };
});

// The Telegram page can also be served at the root of its own host.
const telegram = prepared.find(({ route }) => route === 'tg');
const telegramPackage = telegram.migrated.match(/\.\/slint\/pkg\/([a-f0-9]{16})\//)?.[1];
if (!telegramPackage) throw new Error('Cannot find the Telegram Slint package');
fs.cpSync(path.join(dist, 'slint', 'pkg', telegramPackage),
    path.join(dist, 'tg', 'slint', 'pkg', telegramPackage), { recursive: true });

if (release) {
    for (const filename of fs.readdirSync(path.join(root, 'static'))) {
        if (!filename.startsWith('.')) {
            fs.copyFileSync(path.join(root, 'static', filename), path.join(dist, filename));
        }
    }
    const sitemap = path.join(dist, 'sitemap.xml');
    fs.writeFileSync(sitemap, dateSitemap(fs.readFileSync(sitemap, 'utf8')));
}

for (const { live, backup, migrated, legacy, previewFile } of prepared) {
    fs.mkdirSync(path.dirname(live), { recursive: true });
    if (release) {
        fs.unlinkSync(previewFile);
    } else {
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.writeFileSync(backup, legacy);
    }
    fs.writeFileSync(live, migrated);
}
