const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { siteMetadata, dateSitemap } = require('./site-metadata');

function assemble({ app, admin, meta, assets, staticDir, output }) {
    fs.rmSync(output, { recursive: true, force: true });
    fs.mkdirSync(output, { recursive: true });
    fs.cpSync(admin, output, { recursive: true });
    fs.cpSync(staticDir, output, { recursive: true });
    function collect(directory, relative = '') {
        return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
            if (!relative && ['index.html', '.trunk-lock', 'tg', 'timelapse'].includes(entry.name)) return [];
            const name = path.join(relative, entry.name);
            if (entry.isDirectory()) return collect(path.join(directory, entry.name), name);
            return entry.isFile() ? [name] : [];
        });
    }
    const names = collect(app).sort();
    const hash = createHash('sha256');
    for (const name of names) {
        hash.update(name);
        hash.update(fs.readFileSync(path.join(app, name)));
    }
    const version = hash.digest('hex').slice(0, 16);
    const assetPath = `/app/${version}`;
    for (const base of [output, path.join(output, 'tg')]) {
        const directory = path.join(base, assetPath);
        fs.mkdirSync(directory, { recursive: true });
        for (const name of names) {
            const target = path.join(directory, name);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.copyFileSync(path.join(app, name), target);
        }
    }
    let appHtml = fs.readFileSync(path.join(app, 'index.html'), 'utf8');
    appHtml = appHtml.replace(/<base\s+href=["'][^"']*["']\s*\/?\s*>/i, `<base href="${assetPath}/">`);
    appHtml = appHtml.replace(/<meta\s+name=["']site-base["']\s+content=["'][^"']*["']\s*\/?\s*>/i, '<meta name="site-base" content="/">');
    for (const name of names) appHtml = appHtml.replaceAll(`/${name}`, `${assetPath}/${name}`);
    for (const route of ['', 'tg', 'timelapse']) {
        const source = siteMetadata(fs.readFileSync(path.join(meta, route, 'index.html'), 'utf8'));
        const tags = source.match(/<meta\b[^>]*>|<link\b[^>]*>|<title>[\s\S]*?<\/title>|<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi) || [];
        const retained = tags.filter(tag => !/^<meta\s+(?:charset\b|name="viewport")/i.test(tag) && !/^<link\b[^>]*\srel=["']?stylesheet\b/i.test(tag));
        const metadata = retained.join('\n    ').replace(/href="(?:\.\.\/)+assets\/([\w.-]+)"/g, (_, filename) => {
            fs.copyFileSync(path.join(assets, filename), path.join(output, filename));
            return `href="/${filename}"`;
        });
        const html = appHtml.replace('<title>Пиксель Батл · Slint</title>', metadata);
        const directory = path.join(output, route);
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, 'index.html'), html);
    }
    const sitemap = path.join(output, 'sitemap.xml');
    if (fs.existsSync(sitemap)) fs.writeFileSync(sitemap, dateSitemap(fs.readFileSync(sitemap, 'utf8')));
}

if (require.main === module) {
    const root = path.resolve(__dirname, '..');
    assemble({ app: path.join(root, 'apps/app/dist'), admin: path.join(root, 'apps/admin/dist'),
        meta: path.join(root, 'apps/app/metadata'), assets: path.join(root, 'assets'),
        staticDir: path.join(root, 'static'), output: path.join(root, 'dist-release') });
}
module.exports = { assemble };
