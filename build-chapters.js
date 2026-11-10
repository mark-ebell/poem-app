// Brings the Essential Evidence textbook chapters (XML, one file per chapter, e.g.
// EEE0001.xml) into the app, checking each one converts:
//
//     chapters/index.json        the list of chapters (id, title, last updated)
//     chapters/xml/eee0001.xml   each chapter's XML, which the app converts when opened
//
// Run it after adding or changing chapter files, then commit and push this app:
//
//     npm run build-chapters                         reads ../EEPlus chapters/EE Topics
//     npm run build-chapters -- /path/to/xml/folder
//
// Algorithms redrawn for the app are kept in chapter-algorithms/eee0001.xml (one file per
// chapter, its <algorithm> elements inside <algorithms>): each replaces the chapter's
// algorithm with the same id, or is added to the chapter. They survive the next content
// transfer, so edit them there, not in chapters/xml.
//
// Figure images (<graphic href="...">) are copied to chapters/images (file names in lower
// case) from the chapter folder and the folders next to it (EE Algorithms, EE Figures Not
// Algorithms); the app serves them at /api/chapters/images/.
//
// A chapter edited in the Edit Chapter tab is kept in the app's database and shown
// instead of its file; the tab flags it when a newer file arrives (chapter-store.js).
// The conversion itself is in chapter-convert.js.
const fs = require('fs');
const path = require('path');
const { convertChapter, loadCalculatorLabels } = require('./chapter-convert');

const SRC_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'EEPlus chapters', 'EE Topics');
const OUT_DIR = path.join(__dirname, 'chapters');
const XML_DIR = path.join(OUT_DIR, 'xml');
const IMG_DIR = path.join(OUT_DIR, 'images');
const ALG_DIR = path.join(__dirname, 'chapter-algorithms');

// Every image file in the chapter folder, the folder above it and the folders beside it, by lower-case name.
function imageFiles() {
  const found = new Map();
  const parent = path.dirname(SRC_DIR);
  const dirs = [SRC_DIR, parent, ...fs.readdirSync(parent, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(parent, d.name))];
  for (const dir of dirs) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch { continue; }
    for (const f of names) if (/\.(gif|jpe?g|png|svg)$/i.test(f) && !found.has(f.toLowerCase())) found.set(f.toLowerCase(), path.join(dir, f));
  }
  return found;
}

// The chapter's XML with its redrawn algorithms (chapter-algorithms/<id>.xml) put in.
function withAlgorithms(xml, cid) {
  let extra;
  try { extra = fs.readFileSync(path.join(ALG_DIR, `${cid}.xml`), 'utf8'); } catch { return xml; }
  for (const alg of extra.match(/<algorithm\b[\s\S]*?<\/algorithm>/g) || []) {
    const id = (/^<algorithm\b[^>]*\bid="([^"]+)"/.exec(alg) || [])[1];
    const same = id && new RegExp(`<algorithm\\b[^>]*\\bid="${id}"[\\s\\S]*?<\\/algorithm>`);
    if (same && same.test(xml)) xml = xml.replace(same, () => alg);
    else if (/<\/algorithm_group>/.test(xml)) xml = xml.replace(/<\/algorithm_group>/, () => `${alg}\n</algorithm_group>`);
    else xml = xml.replace(/<\/topic_text>/, () => `</topic_text>\n<algorithm_group>\n${alg}\n</algorithm_group>`);
  }
  return xml;
}

function main() {
  let files;
  try {
    files = fs.readdirSync(SRC_DIR).filter(f => /\.xml$/i.test(f)).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  } catch {
    files = [];
  }
  if (!files.length) {
    console.error(`No chapter files (*.xml) in ${SRC_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(XML_DIR, { recursive: true });
  const calcLabels = loadCalculatorLabels();
  const unknownAll = new Map();
  const index = [], failed = [], written = new Set(), graphics = [];
  for (const f of files) {
    let result, xml;
    try {
      xml = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
      xml = withAlgorithms(xml, (/<topic_id>\s*([^<\s]+)/.exec(xml) || [])[1]?.toLowerCase() || path.basename(f, path.extname(f)).toLowerCase());
      result = convertChapter(xml, calcLabels);
    } catch (err) {
      failed.push(`${f}: ${err.message}`);
      continue;
    }
    const { chapter, problems, unknown } = result;
    const cid = chapter.id || path.basename(f, path.extname(f)).toLowerCase();
    if (!/^[a-z0-9]+$/.test(cid)) {
      failed.push(`${f}: unusable topic id '${cid}'`);
      continue;
    }
    chapter.id = cid;
    fs.writeFileSync(path.join(XML_DIR, `${cid}.xml`), xml);
    written.add(`${cid}.xml`);
    index.push({ id: cid, title: chapter.title, updated: chapter.updated });
    for (const [tag, n] of unknown) unknownAll.set(tag, (unknownAll.get(tag) || 0) + n);
    for (const p of problems) console.log(`  ${f}: ${p}`);
    for (const m of xml.matchAll(/<graphic\b[^>]*\bhref="([^"]+)"/g)) graphics.push([f, path.basename(m[1])]);
  }
  // Figure images: copy the ones the chapters use; remove the rest.
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const available = imageFiles(), used = new Set(), missingImages = [];
  for (const [f, name] of graphics) {
    const lower = name.toLowerCase(), src = available.get(lower);
    if (!src) { missingImages.push(`${f}: ${name}`); continue; }
    used.add(lower);
    const dest = path.join(IMG_DIR, lower);
    const st = fs.statSync(src);
    if (!fs.existsSync(dest) || fs.statSync(dest).size !== st.size) fs.copyFileSync(src, dest);
  }
  for (const old of fs.readdirSync(IMG_DIR)) if (!used.has(old)) fs.unlinkSync(path.join(IMG_DIR, old));
  console.log(`Copied ${used.size} figure image(s) to ${IMG_DIR}`);
  if (missingImages.length) {
    console.log('Figure images not found:');
    for (const x of missingImages) console.log(`  ${x}`);
  }
  // Chapters whose XML file has gone are removed (and converted files from the old layout).
  for (const old of fs.readdirSync(XML_DIR)) {
    if (old.endsWith('.xml') && !written.has(old)) fs.unlinkSync(path.join(XML_DIR, old));
  }
  for (const old of fs.readdirSync(OUT_DIR)) {
    if (old.endsWith('.json') && old !== 'index.json') fs.unlinkSync(path.join(OUT_DIR, old));
  }
  index.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));
  console.log(`Copied ${index.length} chapter(s) to ${XML_DIR}`);
  if (unknownAll.size) {
    console.log('Elements with no heading in HEADINGS (shown with a heading made from the tag):');
    for (const [tag, n] of [...unknownAll].sort((a, b) => b[1] - a[1])) console.log(`  ${tag} (${n})`);
  }
  if (failed.length) {
    console.log('Could not read:');
    for (const x of failed) console.log(`  ${x}`);
  }
}

main();
