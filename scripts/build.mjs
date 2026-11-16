import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { toHTML } from "@portabletext/to-html";

const project = "l89oo1tq";
const dataset = "production";
const api = new URL(`https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`);
const blocks = `[]{..., _type == "image" => {"url": asset->url}}`;
api.searchParams.set("query", `*[_type == "whitePaper"] | order(publishDate desc, slug.current asc){
  title, subtitle, "slug": slug.current, publishDate, summary, authors,
  "cover": coverImage.asset->url, "pdf": pdf.asset->url,
  sections[]{heading, content${blocks}}, body${blocks}
}`);
api.searchParams.set("perspective", "published");

const response = await fetch(api, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Sanity query failed (HTTP ${response.status})`);
const { result: papers } = await response.json();
if (!Array.isArray(papers) || !papers.length) throw new Error("Sanity returned no published white papers");

const aliases = new Map([
  ["driving-cost-efficiency-in-higher-education-strategic-approaches-for-sustainable-savings", "higher-education-cost-efficiency"],
  ["the-human-side-of-transformation-leading-change-in-mission-driven-organizations", "human-side-of-transformation"],
]);

const paths = new Set();
for (const paper of papers) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(paper.slug ?? "") || !paper.title?.trim()) {
    throw new Error("A published white paper requires a valid slug and title");
  }
  paper.path = `/insights/${aliases.get(paper.slug) ?? paper.slug}/`;
  if (paths.has(paper.path)) throw new Error(`Duplicate white paper URL: ${paper.path}`);
  paths.add(paper.path);
}

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]
));
function assetUrl(value, directory) {
  if (typeof value !== "string") return "";
  const prefix = `https://cdn.sanity.io/${directory}/${project}/${dataset}/`;
  return value.startsWith(prefix) ? escape(value) : "";
}

function dateLabel(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  const label = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date);
  return ` · <time datetime="${date.toISOString()}">${label}</time>`;
}

function portableText(value) {
  return toHTML(value ?? [], {
    components: {
      types: {
        image: ({ value }) => {
          const url = assetUrl(value.url, "images");
          if (!url) return "";
          const caption = value.caption ? `<figcaption>${escape(value.caption)}</figcaption>` : "";
          return `<figure><img src="${url}" alt="${escape(value.alt)}" loading="lazy">${caption}</figure>`;
        },
      },
    },
  });
}

function paperCard(paper, library) {
  const title = escape(paper.title);
  const cover = assetUrl(paper.cover, "images");
  const photo = library && cover ? `<img src="${cover}" alt="" loading="lazy" width="640" height="360">` : "";
  const heading = library ? `<h3>${title}</h3>` : `<h3><a href="${paper.path}">${title}</a></h3>`;
  const summary = `<p class="resource-summary">${escape(paper.summary)}</p>`;
  const meta = `<p class="${library ? "category" : "publication-meta"}">White paper${dateLabel(paper.publishDate)}</p>`;
  const content = meta + heading + summary;
  return library
    ? `<article class="case-card publication-card"><a href="${paper.path}">${photo}<div>${content}</div></a></article>`
    : `<article>${content}</article>`;
}

function paperDetail(paper) {
  const pdf = assetUrl(paper.pdf, "files");
  const subtitle = paper.subtitle ? `<p>${escape(paper.subtitle)}</p>` : "";
  const authors = paper.authors?.length ? `<p>${escape(paper.authors.join(", "))}</p>` : "";
  const download = pdf ? `<a class="outline-button" href="${pdf}">Download PDF</a>` : "";
  const sections = paper.sections?.length ? paper.sections : [{ content: paper.body }];

  return `<section class="practice-hero"><div class="page-width"><div>
    <p class="detail-kicker">White paper${dateLabel(paper.publishDate)}</p>
    <h1>${escape(paper.title)}</h1>${subtitle}${authors}<p>${escape(paper.summary)}</p>
    <a class="outline-button" href="/thought-leadership/">All publications</a> ${download}
  </div></div></section>
  ${sections.map(({ heading, content }) => `<section class="page-width practice-section"><div class="detail-copy">
    ${heading ? `<h2>${escape(heading)}</h2>` : ""}${portableText(content)}
  </div></section>`).join("\n")}`;
}

const preview = process.env.CONTEXT !== "production";
const robots = '    <meta name="robots" content="noindex,nofollow" />\n';
const nav = papers.map((paper) => `<li><a href="${paper.path}">${escape(paper.title)}</a></li>`).join("");
await rm("dist", { recursive: true, force: true });
await cp("site", "dist", { recursive: true });

for (const entry of await readdir("dist", { recursive: true })) {
  if (!entry.endsWith(".html")) continue;
  const path = join("dist", entry);
  const html = await readFile(path, "utf8");
  await writeFile(path, (preview ? html : html.replace(robots, ""))
    .replace("<!-- PAPER_NAV -->", () => nav)
    .replace("<!-- PAPER_HOME -->", () => papers.map((paper) => paperCard(paper, false)).join("\n"))
    .replace("<!-- PAPER_LIBRARY -->", () => papers.map((paper) => paperCard(paper, true)).join("\n")));
}

const template = await readFile("scripts/white-paper.html", "utf8");
for (const paper of papers) {
  const path = join("dist", paper.path, "index.html");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, (preview ? template : template.replace(robots, ""))
    .replace("<!-- PAPER_NAV -->", () => nav)
    .replace("<!-- PAPER_TITLE -->", () => escape(paper.title))
    .replace("<!-- PAPER_DETAIL -->", () => paperDetail(paper)));
}

const redirects = await readFile("site/_redirects", "utf8");
const legacyPaperLinks = papers.map(({ slug, path }) => `/white-paper.html slug=${slug} ${path} 301\n/white-paper slug=${slug} ${path} 301`);
await writeFile("dist/_redirects", [ ...legacyPaperLinks, redirects ].join("\n"));
console.log(`Built 3N site with ${papers.length} published Sanity white papers.`);
