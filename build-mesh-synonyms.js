// Builds mesh-synonyms.json, the synonyms the search uses (search.js), from the National
// Library of Medicine's MeSH vocabulary. Download the descriptor file (desc<year>.gz, about
// 17 MB) and the supplementary concepts file (supp<year>.gz, about 47 MB, for drug names) from
// https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/ once a year, then:
//   npm run mesh-synonyms -- /path/to/desc2026.gz /path/to/supp2026.gz
//
// Each MeSH heading lists the words people use for it ("Heart Attack" for Myocardial
// Infarction). A group is the heading and those words; searching for any of them finds the
// others too. Kept: headings for anatomy, diseases, drugs and chemicals, procedures and
// equipment, psychiatry, biological phenomena, and health care (tree letters A, C, D, E,
// F, G, N). Left out of what a search adds: inverted forms ("Infarction, Myocardial"),
// abbreviations and other short forms (searching "myocardial infarction" should not find
// every "MI"); an abbreviation typed in capitals (COPD) still finds its heading's words.
// A drug heading's concepts (brand names, salts) make one group.
// From the supplementary concepts: drugs (chemicals with a pharmacological action, cited at
// least MIN_DRUG_CITATIONS times), with their brand names (apixaban, Eliquis); names with
// digits (research codes such as BMS 562247) are left out. Common clinical abbreviations
// that MeSH lacks (DVT, UTI) are in search-abbreviations.json instead.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const KEEP_TREES = /^[ACDEFGN]/;
const MAX_PER_GROUP = 15;
const MIN_DRUG_CITATIONS = 20;
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
// Abbreviations (no lower-case letters: AIDS, COPD) are looked for only as typed in capitals.
const isAbbreviation = t => !/\p{Ll}/u.test(t);
// Words added to a search: not abbreviations, not short (under 4 letters), not inverted
// ("Infarction, Myocardial"), and not the forms with brackets.
const usable = t => !isAbbreviation(t) && t.replace(/[^\p{L}\p{N}]/gu, '').length >= 4 && !/[,()[\]]/.test(t);

// A descriptor's concepts, each with its terms: the preferred concept first.
function parseRecord(xml) {
  const heading = (/<DescriptorName>\s*<String>([^<]*)<\/String>/.exec(xml) || [])[1];
  if (!heading) return null;
  const trees = [...xml.matchAll(/<TreeNumber>([^<]*)<\/TreeNumber>/g)].map(m => m[1]);
  if (!trees.some(t => KEEP_TREES.test(t))) return null;
  const concepts = [];
  for (const c of xml.matchAll(/<Concept\s+PreferredConceptYN="(.)"[\s\S]*?<\/Concept>/g)) {
    const terms = [];
    for (const m of c[0].matchAll(/<Term\s[^>]*>([\s\S]*?)<\/Term>/g)) {
      const str = (/<String>([^<]*)<\/String>/.exec(m[1]) || [])[1];
      if (str) terms.push(decode(str).trim());
    }
    concepts.push({ preferred: c[1] === 'Y', terms });
  }
  concepts.sort((a, b) => b.preferred - a.preferred);
  // Drugs (tree D): the other concepts are mostly brand names and salts (Ibuprofen: Advil,
  // Motrin), so they all go in one group with the heading; research codes (with digits) do not.
  if (trees.some(t => /^D/.test(t)) && concepts.length > 1) {
    const all = concepts.flatMap(c => c.terms).filter((t, i) => i === 0 || !/\d/.test(t));
    return { heading: decode(heading).trim(), concepts: [{ preferred: true, terms: all }] };
  }
  return { heading: decode(heading).trim(), concepts };
}

// A drug from the supplementary concepts: its name and the other names of all its concepts.
function parseDrug(xml) {
  if (!/SCRClass\s*=\s*"1"/.test(xml) || !xml.includes('<PharmacologicalActionList>')) return null;
  if (Number((/<Frequency>(\d+)<\/Frequency>/.exec(xml) || [])[1] || 0) < MIN_DRUG_CITATIONS) return null;
  const name = (/<SupplementalRecordName>\s*<String>([^<]*)<\/String>/.exec(xml) || [])[1];
  if (!name) return null;
  const list = (/<ConceptList>[\s\S]*<\/ConceptList>/.exec(xml) || [''])[0];
  const terms = [...list.matchAll(/<Term\s[^>]*>[\s\S]*?<String>([^<]*)<\/String>/g)].map(m => decode(m[1]).trim());
  return { name: decode(name).trim(), terms };
}

async function* records(file, endTag) {
  let input = fs.createReadStream(file);
  if (/\.gz$/.test(file)) input = input.pipe(zlib.createGunzip());
  input.setEncoding('utf8');
  let buf = '';
  for await (const chunk of input) {
    buf += chunk;
    let end;
    while ((end = buf.indexOf(endTag)) !== -1) {
      yield buf.slice(0, end);
      buf = buf.slice(end + endTag.length);
    }
  }
}

async function main(file, suppFile) {
  if (!file) throw new Error('Give the path of the MeSH descriptor file (desc<year>.gz or .xml), and of the supplementary concepts file (supp<year>.gz).');

  // One group for each concept: its words, and for a narrower or related concept the
  // heading as well (PubMed indexes "cancer" articles under Neoplasms).
  const groups = [];
  const keys = new Map(); // lower-case word or phrase -> Map(group -> rank)
  const capsKeys = new Map();
  const addKey = (map, k, g, rank) => { if (!map.has(k)) map.set(k, new Map()); map.get(k).set(g, Math.max(rank, map.get(k).get(g) || 0)); };

  for await (const xml of records(file, '</DescriptorRecord>')) {
    {
      const rec = parseRecord(xml);
      if (!rec) continue;
      for (const c of rec.concepts) {
        const words = c.preferred ? [rec.heading] : [];
        // Plurals are left out: the search already finds a word's plural (and keys cover them).
        const plural = t => words.some(w => [norm(w) + 's', norm(w) + 'es', norm(w).replace(/y$/, 'ies')].includes(norm(t)));
        for (const t of c.terms) if (usable(t) && !words.some(w => norm(w) === norm(t)) && !plural(t)) words.push(t);
        if (!c.preferred && !words.some(w => norm(w) === norm(rec.heading))) words.push(rec.heading);
        const abbrs = c.terms.filter(t => isAbbreviation(t) && t.replace(/[^\p{L}\p{N}]/gu, '').length >= 2);
        if (words.length < 2) continue; // nothing to add to a search
        const g = groups.length;
        groups.push(words.slice(0, MAX_PER_GROUP));
        // Rank, for a word in more than one group: the heading itself, then its preferred
        // concept, then the others.
        for (const w of [...words, ...c.terms.filter(t => usable(t) && plural(t))]) {
          if (!c.preferred && norm(w) === norm(rec.heading)) continue;
          addKey(keys, norm(w), g, norm(w) === norm(rec.heading) ? 3 : c.preferred ? 2 : 1);
        }
        // Short forms with lower-case letters ("Flu") start a search but are not added to one.
        for (const t of c.terms) if (!usable(t) && !isAbbreviation(t) && !/[,()[\]]/.test(t) && t.length >= 3) addKey(keys, norm(t), g, c.preferred ? 2 : 1);
        for (const a of abbrs) addKey(capsKeys, a, g, c.preferred ? 2 : 1);
      }
    }
  }
  // Drugs rank below every heading, so a word that is also a heading's goes with the heading.
  let drugs = 0;
  if (suppFile) for await (const xml of records(suppFile, '</SupplementalRecord>')) {
    const d = parseDrug(xml);
    if (!d) continue;
    const words = [d.name];
    const plural = t => words.some(w => [norm(w) + 's', norm(w) + 'es'].includes(norm(t)));
    for (const t of d.terms) if (usable(t) && !/\d/.test(t) && !words.some(w => norm(w) === norm(t)) && !plural(t)) words.push(t);
    if (words.length < 2) continue;
    const g = groups.length;
    groups.push(words.slice(0, MAX_PER_GROUP));
    words.forEach((w, i) => addKey(keys, norm(w), g, i === 0 ? 0.5 : 0.25));
    drugs++;
  }

  // A word in more than one group goes with its best-ranked one; on a tie it is ambiguous
  // and left out.
  const pick = ranks => {
    const sorted = [...ranks].sort((a, b) => b[1] - a[1]);
    return sorted.length === 1 || sorted[0][1] > sorted[1][1] ? sorted[0][0] : null;
  };
  const out = { source: [file, suppFile].filter(Boolean).map(f => path.basename(f)).join(', '), groups, keys: {}, capsKeys: {} };
  for (const [k, ranks] of keys) { const g = pick(ranks); if (g !== null) out.keys[k] = g; }
  for (const [k, ranks] of capsKeys) { const g = pick(ranks); if (g !== null) out.capsKeys[k] = g; }
  fs.writeFileSync(path.join(__dirname, 'mesh-synonyms.json'), JSON.stringify(out));
  console.log(`mesh-synonyms.json: ${groups.length} groups (${drugs} drugs), ${Object.keys(out.keys).length} words and phrases, ${Object.keys(out.capsKeys).length} abbreviations.`);
}

main(process.argv[2], process.argv[3]).catch(err => { console.error(err.message); process.exit(1); });
