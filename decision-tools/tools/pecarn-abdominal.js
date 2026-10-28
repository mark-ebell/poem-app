// PECARN pediatric blunt abdominal trauma (Holmes 2013; validated by Springer 2019; EE+ 615).
const OUT = ['6/5040 (0.1%)', '37/2679 (1.4%)', '47/2576 (1.8%)', '57/1280 (4.5%)', '56/469 (11.9%)'];
const { count } = require('../lib');
module.exports = {
  id: 'pecarn-abdominal',
  eeId: 615,
  title: 'Pediatric blunt abdominal injury - probability of CT finding requiring intervention',
  subtitle: 'Intra-abdominal injury needing intervention in children with blunt trauma',
  question: 'For a child with blunt abdominal trauma, what is the likelihood of an intra-abdominal injury on CT needing intervention?',
  inputs: [
    { id: 'wall', type: 'check', label: 'Evidence of abdominal wall trauma or seatbelt sign', ee: 'cb1' },
    { id: 'gcs', type: 'check', label: 'Glasgow Coma Scale under 14', ee: 'cb2' },
    { id: 'tender', type: 'check', label: 'Abdominal tenderness (at least mild)', ee: 'cb3' },
    { id: 'thorax', type: 'check', label: 'Evidence of thoracic wall trauma', ee: 'cb4' },
    { id: 'pain', type: 'check', label: 'Complaint of abdominal pain', ee: 'cb5' },
    { id: 'breath', type: 'check', label: 'Absent or decreased breath sounds', ee: 'cb6' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', ee: 'cb7' }
  ],
  compute(a) {
    const n = count(a, ['wall', 'gcs', 'tender', 'thorax', 'pain', 'breath', 'vomiting']);
    return { score: { value: n, max: 7, label: 'Findings' }, level: n === 0 ? 1 : n <= 2 ? 2 : n === 3 ? 3 : 4, headline: `${OUT[Math.min(n, 4)]} had an intra-abdominal injury needing acute intervention` };
  }
};
