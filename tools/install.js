#!/usr/bin/env node
'use strict';

// Zero-dependency installer. Run directly with Node, with no package install.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

function install(target) {
  const base = path.resolve(target);
  if (!fs.existsSync(path.join(base, '_config.yml'))) throw new Error(`Not a Hexo site (missing _config.yml): ${base}`);
  const loader = path.join(base, 'scripts', 'kratos-latex.js');
  const marker = '// Installed by hexo-renderer-kratos-latex';
  if (fs.existsSync(loader) && !fs.readFileSync(loader, 'utf8').startsWith(marker)) throw new Error(`Refusing to overwrite an unrelated script: ${loader}`);
  const runtime = path.join(base, 'kratos-latex-runtime');
  fs.mkdirSync(path.join(runtime, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(base, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(root, 'lib', 'plugin.js'), path.join(runtime, 'lib', 'plugin.js'));
  fs.cpSync(path.join(root, 'vendor'), path.join(runtime, 'vendor'), { recursive: true });
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) fs.copyFileSync(path.join(root, name), path.join(runtime, name));
  const loaderText = `${marker}\n'use strict';\nrequire('../kratos-latex-runtime/lib/plugin')(hexo);\n`;
  fs.writeFileSync(loader, loaderText);
  return { base, runtime, loader };
}

module.exports = install;
if (require.main === module) {
  if (!process.argv[2]) {
    console.error('Usage: node tools/install.js <Hexo site directory>');
    process.exitCode = 1;
  } else {
    try { console.log(JSON.stringify(install(process.argv[2]), null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
