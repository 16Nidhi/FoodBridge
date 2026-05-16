import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, '../src/components/common/Dashboard.css');
const text = fs.readFileSync(cssPath, 'utf8');
const lines = text.split(/\r?\n/);
let end = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('db-step-line { display: none')) {
    end = i + 1;
    break;
  }
}
if (!end) end = 843;
const clean = lines.slice(0, end).join('\n') + '\n';

const append = fs.readFileSync(path.join(__dirname, 'dashboard-append.txt'), 'utf8');
fs.writeFileSync(cssPath, clean + append, 'utf8');
console.log('Fixed', cssPath, 'kept', end, 'lines');
