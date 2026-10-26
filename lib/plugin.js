'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createRenderer } = require('../vendor/engine.cjs');
const ASSETS = 'assets/kratos-latex';

module.exports = function register(hexo) {
  const marker = Symbol.for('hexo-renderer-kratos-latex.registered');
  if (hexo[marker]) return;
  hexo[marker] = true;
  let renderer;
  let lastConfig;
  function render(data) {
    const config = hexo.config.kratos_latex || {};
    const signature = JSON.stringify(config);
    if (!renderer || signature !== lastConfig) {
      renderer = createRenderer(config, msg => hexo.log.warn(msg));
      lastConfig = signature;
    }
    return renderer(data.text, { path: data.path });
  }
  function installRenderer() {
    for (const ext of ['md', 'markdown', 'mkd', 'mkdn', 'mdwn', 'mdtxt', 'mdtext']) {
      hexo.extend.renderer.register(ext, 'html', render, true);
    }
  }
  installRenderer();
  // Hexo loads plugins concurrently. Register once again after all initializers,
  // so a template's marked/pandoc renderer cannot win based on load order.
  hexo.extend.filter.register('after_init', installRenderer, 9999);

  hexo.extend.injector.register('head_end', () => {
    const root = String(hexo.config.root || '/');
    const url = `${root.replace(/\/$/, '')}/${ASSETS}/katex.min.css`;
    const escaped = url.replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c]));
    return `<link rel="stylesheet" href="${escaped}" data-kratos-latex="1">`;
  });

  hexo.extend.generator.register('kratos-latex-assets', () => {
    const base = path.join(__dirname, '..', 'vendor', 'katex');
    const assets = [];
    const walk = (directory, relative = '') => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const rel = relative ? `${relative}/${entry.name}` : entry.name;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(absolute, rel);
        else assets.push({ path: `${ASSETS}/${rel}`, data: () => fs.createReadStream(absolute) });
      }
    };
    walk(base);
    return assets;
  });
};
