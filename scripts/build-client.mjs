import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const corePath = new URL('update-core.js', root);
let core = await readFile(corePath, 'utf8');
core = core.replace(/export const CURRENT_VERSION = '[^']+';/, `export const CURRENT_VERSION = '${manifest.version}';`);
await writeFile(corePath, core);
const code = core.replace(/^export /gm, '');
const clientPath = new URL('client.js', root);
let client = await readFile(clientPath, 'utf8');
const block = '// UPDATE_CORE_START\n' + code + '\n// UPDATE_CORE_END';
if (client.includes('// UPDATE_CORE_START')) {
  client = client.replace(/\/\/ UPDATE_CORE_START[\s\S]*?\/\/ UPDATE_CORE_END/, () => block);
} else {
  client = client.replace('    const T = {', () => block + '\n    const T = {');
}
await writeFile(clientPath, client);
console.log('Bundled update checker v' + manifest.version);
