// 2019 EULAR/ACR classification criteria for systemic lupus erythematosus (Aringer 2019; EE+ 620).
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'sle-2019',
  eeId: 620,
  title: 'SLE criteria (EULAR/ACR 2019)',
  subtitle: 'Classification criteria for systemic lupus erythematosus',
  question: 'For a patient with a positive ANA (titer 1:80 or more) at any time, are the 2019 EULAR/ACR criteria for SLE met?',
  inputs: [
    { id: 'heme', type: 'choice', label: 'Hematologic', ee: 'ddl1', options: opts([['None', 0], ['Leukopenia', 3], ['Thrombocytopenia', 4], ['Autoimmune hemolysis', 4]]) },
    { id: 'neuro', type: 'choice', label: 'Neuropsychiatric', ee: 'ddl2', options: opts([['None', 0], ['Delirium', 2], ['Psychosis', 3], ['Seizure', 5]]) },
    { id: 'skin', type: 'choice', label: 'Mucocutaneous', ee: 'ddl3', options: opts([['None', 0], ['Non-scarring alopecia', 2], ['Oral ulcers', 2], ['Subacute cutaneous or discoid lupus', 4], ['Acute cutaneous lupus', 6]]) },
    { id: 'serosal', type: 'choice', label: 'Serosal', ee: 'ddl6', options: opts([['None', 0], ['Pleural or pericardial effusion', 5], ['Acute pericarditis', 6]]) },
    { id: 'renal', type: 'choice', label: 'Renal', ee: 'ddl4', options: opts([['None', 0], ['Proteinuria over 0.5 g/24 h', 4], ['Renal biopsy class II or V lupus nephritis', 8], ['Renal biopsy class III or IV lupus nephritis', 10]]) },
    { id: 'complement', type: 'choice', label: 'Complement proteins', ee: 'ddl5', options: opts([['None', 0], ['Low C3 or low C4', 3], ['Low C3 and low C4', 4]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fever', type: 'check', label: 'Fever', points: 2, ee: 'cb1' },
    { id: 'joints', type: 'check', label: 'Joint involvement', points: 6, ee: 'cb2' },
    { id: 'apl', type: 'check', label: 'Anticardiolipin or anti-β2GP1 antibodies, or lupus anticoagulant', points: 2, ee: 'cb3' },
    { id: 'dsdna', type: 'check', label: 'Anti-dsDNA or anti-Smith antibody', points: 6, ee: 'cb4' }
  ],
  points: { label: 'SLE score' },
  footnote: 'Only the highest-weighted item in each domain counts. Classify as SLE with 10 or more points, including at least one clinical (non-blood-test) item, plus a positive ANA of 1:80 or more (or equivalent) at any time.',
  compute(a) {
    const s = pointsOf(tool, a), clinical = a.fever || a.heme || a.neuro || a.skin || a.serosal || a.joints || a.renal;
    return s >= 10 && clinical ? { level: 3, headline: 'Meets the classification criteria for SLE' }
      : { level: 1, headline: s >= 10 ? 'Does not meet the criteria: at least one clinical item is needed' : 'Does not meet the classification criteria for SLE (under 10 points)' };
  }
};
