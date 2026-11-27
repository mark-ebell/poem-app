// One-off (2026-11-27): POEMs about an individual patient data (IPD) meta-analysis get the new
// study design "Meta-analysis (individual patient data)". Chosen by reading each POEM that
// mentions individual patient/participant data. Left alone: POEMs that only mention IPD, or
// whose study got individual data from a minority of its trials (e.g. 121073), IPD network
// meta-analyses (374678, 376734), and decision rules derived from pooled data (150301, 190508).
// Run in the Render Shell:  node scripts/ipd-study-design.js        (lists the changes)
//                           node scripts/ipd-study-design.js --apply (makes them)
const db = require('../db');
const DESIGN = 'Meta-analysis (individual patient data)';
const POEM_IDS = [
  10705, 30407, 40964, 41167, 50310, 70743, 90841, 91195, 100952, 110643, 110748, 110842, 111141,
  130146, 130341, 130401, 130581, 121142, 131034, 140344, 140592, 140872, 140942, 150424, 150743,
  150745, 160741, 161041, 170245, 170941, 171013, 180906, 181007, 181117, 190801, 190921, 200214,
  200516, 200528, 200727, 201026, 210305, 210503, 210704, 210820, 220724, 313520, 316616, 317067,
  317296, 321221, 329413, 330014, 332335, 332722, 338128, 339732, 342500, 344177, 347506, 362836,
  367159, 373836, 375743, 387181, 436910
];
const apply = process.argv.includes('--apply');
const find = db.prepare('SELECT id, poem_id, study_design, title FROM poems WHERE poem_id = ?');
const update = db.prepare('UPDATE poems SET study_design = ?, updated_by = ?, updated_at = ? WHERE id = ?');
const now = new Date().toISOString();
let changed = 0;
db.transaction(() => {
  for (const pid of POEM_IDS) {
    const rows = find.all(pid);
    if (!rows.length) { console.log(`${pid}: not found`); continue; }
    for (const r of rows) {
      if (r.study_design === DESIGN) continue;
      console.log(`${pid}: "${r.study_design}" -> "${DESIGN}"  (${r.title.slice(0, 70)})`);
      if (apply) update.run(DESIGN, 'ipd-study-design script', now, r.id);
      changed++;
    }
  }
})();
console.log(`${changed} POEM(s) ${apply ? 'changed' : 'to change (run with --apply to make the changes)'}.`);
