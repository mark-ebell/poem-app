// Brings the Essential Evidence textbook chapters (XML, one file per chapter, e.g.
// EEE0001.xml) into the app, checking each one converts:
//
//     chapters/index.json        the list of chapters (id, title, last updated)
//     chapters/xml/eee0001.xml   each chapter's XML, which the app converts when opened
//
// Run it after adding or changing chapter files, then commit and push this app:
//
//     npm run build-chapters                         reads ../EEPlus chapters
//     npm run build-chapters -- /path/to/xml/folder
//
// A chapter edited in the Edit Chapter tab is kept in the app's database and shown
// instead of its file; the tab flags it when a newer file arrives (chapter-store.js).
// The conversion itself is in chapter-convert.js.
const fs = require('fs');
const path = require('path');
const { convertChapter, loadCalculatorLabels } = require('./chapter-convert');

const SRC_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'EEPlus chapters');
const OUT_DIR = path.join(__dirname, 'chapters');
const XML_DIR = path.join(OUT_DIR, 'xml');

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
  const index = [], failed = [], written = new Set();
  for (const f of files) {
    let result, xml;
    try {
      xml = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
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
