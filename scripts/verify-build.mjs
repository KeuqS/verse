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
const assets = readdirSync(join(outputDir, 'assets'));
if (!assets.some(name => name.endsWith('.js'))) {
  throw new Error('Missing JavaScript application bundle');
}
if (html.includes('lovable.dev') || html.includes('lovable.app') || html.includes('supabase.co')) {
  throw new Error('Stale hosted-platform URL in built HTML');
}

console.log(`Built website validated for base ${base}`);
