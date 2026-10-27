// Survival after cystectomy for bladder cancer (EE+ 328).
module.exports = {
  id: 'bladder-cystectomy',
  eeId: 328,
  title: 'Bladder cancer prognosis after cystectomy',
  subtitle: '5-year survival after cystectomy for bladder cancer',
  question: 'For a patient after cystectomy for bladder cancer, what is the 5-year survival?',
  inputs: [
    { id: 'nodes', type: 'choice', label: 'Nodal status', ee: 'COMBO_Nodal', options: [{ label: 'N0: none' }, { label: 'N1: 1 node under 2 cm' }, { label: 'N2: 1 node 2 to 5 cm, or several all under 5 cm' }, { label: 'N3: 1 or more nodes over 5 cm' }] },
    { id: 'local', type: 'choice', label: 'Local stage at pathology', ee: 'COMBO_Local', options: [{ label: 'P1: lamina propria' }, { label: 'P2: muscularis' }, { label: 'P3: perivesical fat' }, { label: 'P4: prostate, uterus, vagina, pelvic or abdominal wall' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'stroma', type: 'check', label: 'Prostatic stroma invasion', ee: 'CHK_Stroma' }
  ],
  compute(a) {
    const r = a.nodes === 0 ? (a.local === 3 || a.stroma ? 2 : a.local === 2 ? 1 : 0) : a.nodes === 1 ? (a.local < 2 ? 1 : 2) : 2;
    return [{ level: 1, headline: 'Low risk: 86% 5-year survival' }, { level: 3, headline: 'Intermediate risk: 64% 5-year survival' }, { level: 4, headline: 'High risk: 28% 5-year survival' }][r];
  }
};
