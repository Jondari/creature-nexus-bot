#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const expoStaticDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const BASE_SCRIPT_REGEX = /<script>globalThis.__EXPO_BASE_URL[\s\S]*?<\/script>/g;
const CUSTOM_LOCATION_REGEX = /<script>\(function\(\)\{try\{var custom=[\s\S]*?<\/script>/g;

function verifyDist() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Dossier dist introuvable: ${distDir}`);
  }
}

function rewriteFile(filePath, transform) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = transform(content);
  if (content !== updated) {
    fs.writeFileSync(filePath, updated);
    console.log(`✔ Modifié: ${path.relative(distDir, filePath)}`);
  } else {
    console.log(`↷ Aucun changement: ${path.relative(distDir, filePath)}`);
  }
}

function collectHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  });
  return files;
}

function getRoutePath(filePath) {
  const relative = path.relative(distDir, filePath).replace(/\\/g, '/');
  const withoutExt = relative.replace(/\.html$/, '');
  if (withoutExt === 'index') return '/';
  const segments = withoutExt
    .split('/')
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  if (segments.length === 0) return '/';
  if (segments[segments.length - 1] === 'index') segments.pop();
  const route = '/' + segments.join('/');
  return route === '' ? '/' : route;
}

function buildRedirectScript(scriptPrefix, routePath) {
  if (routePath === '/') {
    return '';
  }
  const lines = [];
  lines.push(`var target=${JSON.stringify(routePath)};`);
  lines.push(`try{sessionStorage.setItem('__EXPO_TARGET_ROUTE', target);}catch(e){}`);
  lines.push(`var baseUrl=new URL("${scriptPrefix}", window.location.href);`);
  lines.push('var href=baseUrl.href;');
  lines.push("href=href.replace(/index\\.html$/, '');");
  lines.push("if(!href.endsWith('/')) href += '/';");
  lines.push("if(!href.toLowerCase().endsWith('index.html')) href += 'index.html';");
  lines.push('window.location.replace(href);');
  return `<script>(function(){${lines.join('')}})();</script>`;
}

function buildRouteScript(scriptPrefix, routePath) {
  const baseScript = `<script>globalThis.__EXPO_BASE_URL=new URL("${scriptPrefix}",window.location.href).pathname;</script>`;
  const routeScript = `<script>(function(){try{var target=sessionStorage.getItem('__EXPO_TARGET_ROUTE');if(target){sessionStorage.removeItem('__EXPO_TARGET_ROUTE');var custom=new URL(window.location.href);custom.pathname=target;globalThis.__EXPO_CUSTOM_LOCATION=custom;}else{var custom=new URL(window.location.href);custom.pathname=${JSON.stringify(routePath)};globalThis.__EXPO_CUSTOM_LOCATION=custom;}}catch(e){}})();</script>`;
  return baseScript + routeScript;
}

function buildHistoryPatchScript() {
  return `<script>(function(){if(globalThis.__EXPO_HISTORY_PATCHED__)return;try{var base=(globalThis.__EXPO_BASE_URL||new URL("./",window.location.href).pathname).replace(/\/$/,"");function wrap(fn){return function(state,title,url){if(typeof url==="string"&&url.startsWith("/")&&!url.startsWith(base+"/")){url=base+url;}return fn.call(this,state,title,url);};}history.pushState=wrap(history.pushState);history.replaceState=wrap(history.replaceState);globalThis.__EXPO_HISTORY_PATCHED__=true;}catch(e){}})();</script>`;
}

function materializeRouteDirectories() {
  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (!entry.isFile() || !entry.name.endsWith('.html')) return;
    const name = entry.name;
    if (name === 'index.html') return;
    if (name.startsWith('_') || name.startsWith('+')) return;

    const routeName = name.replace(/\.html$/, '');
    const targetDir = path.join(distDir, routeName);

    // Skip if it already exists (idempotent)
    if (fs.existsSync(path.join(targetDir, 'index.html'))) {
      fs.unlinkSync(path.join(distDir, name));
      return;
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.renameSync(path.join(distDir, name), path.join(targetDir, 'index.html'));
  });
}

function fixHtmlFiles() {
  const htmlFiles = collectHtmlFiles(distDir);
  htmlFiles.forEach((filePath) => {
    const relativePrefixRaw = path.relative(path.dirname(filePath), distDir) || '.';
    const normalizedPrefix = relativePrefixRaw.split(path.sep).join('/');
    const assetPrefix = normalizedPrefix === '.' ? '.' : normalizedPrefix;
    const scriptPrefix = assetPrefix === '.' ? './' : `${assetPrefix}/`;
    const routePath = getRoutePath(filePath);

    rewriteFile(filePath, (html) => {
      let output = html;
      const baseTag = `<base href="${scriptPrefix}">`;
      if (!output.includes('<base ')) {
        output = output.replace('<head>', `<head>${baseTag}`);
      }
      output = output.replace(/(["'])\/_expo/g, `$1${assetPrefix}/_expo`);
      output = output.replace(/(["'])\.\/_expo/g, `$1${assetPrefix}/_expo`);
      output = output.replace(/(["'])\/assets/g, `$1${assetPrefix}/assets`);
      output = output.replace(/(["'])\.\/assets/g, `$1${assetPrefix}/assets`);
      output = output.replace(/href=(["'])\/favicon\.ico\1/g, `href=$1${assetPrefix}/favicon.ico$1`);
      output = output.replace(/href=(["'])\.\/favicon\.ico\1/g, `href=$1${assetPrefix}/favicon.ico$1`);
      const assetsCssPattern = /url\((['\"]?)\/{1}assets/g;
      const dotAssetsCssPattern = /url\((['\"]?)\.\/assets/g;
      output = output.replace(assetsCssPattern, `url($1${assetPrefix}/assets`);
      output = output.replace(dotAssetsCssPattern, `url($1${assetPrefix}/assets`);
      output = output.replace(BASE_SCRIPT_REGEX, '');
      output = output.replace(CUSTOM_LOCATION_REGEX, '');
      const newScripts = buildRouteScript(scriptPrefix, routePath) + buildHistoryPatchScript() + buildRedirectScript(scriptPrefix, routePath);
      output = output.replace('</head>', `${newScripts}</head>`);
      return output;
    });
  });
}

function patchBundleLoader() {
  if (!fs.existsSync(expoStaticDir)) {
    console.warn('⚠️  Dossier des bundles Expo introuvable, étape ignorée.');
    return;
  }

  const entryFile = fs
    .readdirSync(expoStaticDir)
    .find((name) => name.startsWith('entry-') && name.endsWith('.js'));

  if (!entryFile) {
    console.warn('⚠️  Aucun fichier entry-*.js trouvé dans _expo/static/js/web.');
    return;
  }

  const entryPath = path.join(expoStaticDir, entryFile);
  rewriteFile(entryPath, (code) => {
    const needle = 'return"/"+t.replace(/^\\/+/,"")';
    const alreadyPatched = code.includes('globalThis.__EXPO_BASE_URL');
    if (alreadyPatched) {
      console.log('↷ Chargeur déjà patché, aucune action.');
      return injectAssetBaseHelper(code);
    }
    if (!code.includes(needle)) {
      console.warn('⚠️  Motif buildUrlForBundle introuvable, vérifiez le fichier entry.');
      return injectAssetBaseHelper(code);
    }
    const updated = code.replace(
      needle,
      'const e=(globalThis.__EXPO_BASE_URL??new URL("./",window.location.href).pathname).replace(/\\\/$/,"");return e+"/"+t.replace(/^\\/+/,"")'
    );
    return injectAssetBaseHelper(updated);
  });
}

function injectAssetBaseHelper(code) {
  let output = code;
  if (!output.includes('__EXPO_ASSET_BASE__')) {
    const helper = 'const __EXPO_ASSET_BASE__=(globalThis.__EXPO_BASE_URL??new URL("./",window.location.href).pathname).replace(/\\\/$/,"");\n';
    output = output.replace('var __BUNDLE_START_TIME__', `${helper}var __BUNDLE_START_TIME__`);
  }
  output = output.replace(/:"\/assets/g, ':__EXPO_ASSET_BASE__+"/assets');
  output = output.replace(/="\/assets/g, '=__EXPO_ASSET_BASE__+"/assets');
  output = output.replace(/='\/assets/g, "=__EXPO_ASSET_BASE__+'/assets");
  const locationNeedle =
    'const P="web"===u.Platform.OS&&"undefined"!=typeof window?new URL(window.location.href):void 0;';
  output = output.replace(
    locationNeedle,
    'const P=globalThis.__EXPO_CUSTOM_LOCATION??("web"===u.Platform.OS&&"undefined"!=typeof window?new URL(window.location.href):void 0);'
  );
  return output;
}

function run() {
  verifyDist();
  materializeRouteDirectories();
  fixHtmlFiles();
  patchBundleLoader();
  console.log('✅ Post-traitement terminé.');
}

run();
