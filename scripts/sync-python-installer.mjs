import { readFileSync, writeFileSync } from 'node:fs';

const source = new URL('../INSTALL_PYTHON.bat', import.meta.url);
const target = new URL('../src/data/pythonInstaller.ts', import.meta.url);
const content = readFileSync(source, 'utf8').replace(/\r\n/g, '\n');
const generated = '// Generated from INSTALL_PYTHON.bat by scripts/sync-python-installer.mjs.\n'
  + `export default ${JSON.stringify(content)};\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== generated) {
    throw new Error('Installer copy is stale. Run npm run sync:installer.');
  }
} else {
  writeFileSync(target, generated);
}
