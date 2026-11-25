import { readdir, readFile, writeFile } from 'node:fs/promises';
import { renderSiteHeader, renderSiteFooter } from './site-navigation.mjs';

const root = new URL('../', import.meta.url);
const footer = /<footer\b(?=[^>]*(?:class=["'][^"']*\bfooter\b|data-(?:keydy-)?site-footer))[^>]*>[\s\S]*?<\/footer>/i;
const header = /<header\b(?=[^>]*(?:class=["'][^"']*\bsite-header\b|data-(?:keydy-)?site-header))[^>]*>[\s\S]*?<\/header>/i;
const checkOnly = process.argv.includes('--check');
const updates = [];

for (const file of (await readdir(root)).filter(name => name.endsWith('.html'))) {
  const url = new URL(file, root);
  const current = (await readFile(url, 'utf8')).replaceAll('\r\n', '\n');
  if (!header.test(current) || !footer.test(current)) {
    throw new Error(`Page du site sans navigation commune : ${file}`);
  }
  let next = current.replace(header, () => renderSiteHeader(file)).replace(footer, () => renderSiteFooter(file));
  if (!next.includes('assets/css/site-navigation.css')) {
    next = next.replace('</head>', '  <link rel="stylesheet" href="assets/css/site-navigation.css">\n</head>');
  }
  if (!next.includes('assets/js/site-navigation.js')) {
    next = next.replace('</body>', '  <script src="assets/js/site-navigation.js" defer></script>\n</body>');
  }
  if (next !== current) {
    updates.push(file);
    if (!checkOnly) await writeFile(url, next, 'utf8');
  }
}

if (checkOnly && updates.length) {
  console.error('Navigation à resynchroniser : ' + updates.join(', '));
  process.exitCode = 1;
} else {
  console.log(updates.length ? `Navigation mise à jour sur ${updates.length} pages.` : 'Navigation commune à jour.');
}
