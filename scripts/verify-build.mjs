import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = 'dist';
const entrypoint = join(outputDir, 'index.html');
if (!existsSync(entrypoint)) throw new Error('Missing dist/index.html');

const html = readFileSync(entrypoint, 'utf8');
const base = process.env.GITHUB_PAGES === 'true' ? '/verse/' : '/';
if (!html.includes(`${base}assets/`)) {
  throw new Error(`Expected asset URLs beneath ${base}assets/`);
}
if (!html.includes(`${base}assets/verse-mark.jpg`)) {
  throw new Error('Brand icon URL does not respect Vite base path');
}
if (!existsSync(join(outputDir, 'assets', 'verse-mark.jpg'))) {
  throw new Error('Missing original Verse artwork');
}
const references = [...html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g)].map(match => match[1]);
if (!references.some(path => path.endsWith('.js')) || !references.some(path => path.endsWith('.css'))) {
  throw new Error('Expected linked JavaScript and stylesheet in index.html');
}
if (references.some(path => !path.startsWith(`${base}assets/`))) {
  throw new Error(`Compiled asset URL does not match deployment base: ${JSON.stringify(references)}`);
}
const assets = readdirSync(join(outputDir, 'assets'));
if (!assets.some(name => name.endsWith('.js'))) {
  throw new Error('Missing JavaScript application bundle');
}
if (html.includes('lovable.dev') || html.includes('lovable.app') || html.includes('supabase.co')) {
  throw new Error('Stale hosted-platform URL in built HTML');
}

if (/\u2014/.test(html)) throw new Error('Em dash in the rendered HTML document');
const bundleText = [html, ...assets.filter(name => /\.(css|js)$/.test(name)).map(name => readFileSync(join(outputDir, 'assets', name), 'utf8'))].join("\n");
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(bundleText)) {
  throw new Error('Google Fonts reference found in the output despite first-party font policy');
}
if (!assets.some(name => name.endsWith('.woff2'))) {
  throw new Error('Expected self-hosted WOFF2 font assets');
}
if (!existsSync(join(outputDir, 'fonts', 'crimson-text-OFL.txt')) ||
    !existsSync(join(outputDir, 'fonts', 'ibm-plex-mono-OFL.txt'))) {
  throw new Error('Missing redistributable font license notices');
}
if (!bundleText.includes('verse-mark.jpg')) {
  throw new Error('Application bundle does not reference the favicon as its brand mark');
}
console.log(`Built website validated for base ${base}, shared artwork, and self-hosted fonts`);
