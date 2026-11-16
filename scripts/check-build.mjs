import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const origin = "https://3nconsultinggroup.com";
const root = "dist";
const redirects = readFileSync(join(root, "_redirects"), "utf8");
const pages = readdirSync(root, { recursive: true }).filter((path) => path.endsWith(".html"));

for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  assert.doesNotMatch(html, /ethanwu\.me|\/3nconsulting\/|<!-- PAPER_/, page);
  for (const [, reference] of html.matchAll(/\b(?:href|src|poster)=["']([^"'\s]+)["']/g)) {
    if (!reference.startsWith("/") || reference.startsWith("//")) continue;
    const { pathname } = new URL(reference, origin);
    const path = join(root, decodeURIComponent(pathname));
    assert.ok(pathname.endsWith("/") ? existsSync(join(path, "index.html")) : existsSync(path),
      `${page}: missing ${reference}`);
  }
}

const home = readFileSync(join(root, "index.html"), "utf8");
const hub = readFileSync(join(root, "thought-leadership/index.html"), "utf8");
const publications = pages.filter((path) => /^insights\/[^/]+\/index\.html$/.test(path));
assert.ok(publications.length > 0, "Expected published Sanity white papers");
for (const path of publications) {
  const url = "/" + path.replace("index.html", "");
  assert.ok(home.includes(url) && hub.includes(url), `Unlisted publication: ${url}`);
  assert.ok(redirects.includes(` ${url} 301`), `Missing legacy publication URL: ${url}`);
}

const careers = readFileSync(join(root, "careers/index.html"), "utf8");
assert.match(careers, /id="rec_job_listing_div"/);
assert.match(careers, /<iframe[^>]+src="https:\/\/3nconsultinggroup\.zohorecruit\.com\/forms\//);
assert.match(readFileSync(join(root, "contact/index.html"), "utf8"), /action="https:\/\/formspree\.io\/f\/xeoykvke"/);
console.log(`Checked ${pages.length} pages, ${publications.length} publications, and the Zoho and Formspree integrations.`);
