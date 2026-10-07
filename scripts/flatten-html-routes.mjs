// Angular's static prerenderer emits routes containing a dot (e.g. "products.html")
// as a directory (`browser/products.html/index.html`) rather than a literal file,
// since route segments are treated as directories regardless of their name. GitLab
// Pages serves plain files, so `/products.html` must be a real file at that path to
// preserve the site's existing indexed URLs. This flattens each `<name>.html/index.html`
// directory into a literal `<name>.html` file after the build.
import { readdirSync, statSync, renameSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const browserDir = process.argv[2];
if (!browserDir || !existsSync(browserDir)) {
  console.error(`flatten-html-routes: browser output dir not found: ${browserDir}`);
  process.exit(1);
}

let flattened = 0;
for (const entry of readdirSync(browserDir)) {
  if (!entry.endsWith('.html')) continue;
  const entryPath = join(browserDir, entry);
  if (!statSync(entryPath).isDirectory()) continue; // already a flat file, no-op

  const indexPath = join(entryPath, 'index.html');
  if (!existsSync(indexPath)) continue;

  const tmpPath = join(browserDir, `.__flatten_${entry}`);
  renameSync(indexPath, tmpPath);
  rmSync(entryPath, { recursive: true });
  renameSync(tmpPath, entryPath);
  flattened++;
  console.log(`flatten-html-routes: ${entry}/index.html -> ${entry}`);
}

console.log(`flatten-html-routes: done (${flattened} route(s) flattened)`);
