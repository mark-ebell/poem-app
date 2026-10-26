// ENGAGE AF-TIMI 48 score: net clinical outcome on warfarin in atrial fibrillation (Fanola; EE+ 557).
const RISK = ['1.44', '1.44', '1.44', '1.8', '2.6', '4.5', '5.4', '8.2', '9.2', '14.6', '18.5', '20.8'];
module.exports = {
  id: 'engage-af',
  eeId: 557,
  title: 'ENGAGE AF-TIMI 48 score',
  subtitle: 'Choosing a DOAC vs warfarin in atrial fibrillation',
  question: 'For a patient with atrial fibrillation started on warfarin, what is the risk of disabling stroke, life-threatening bleeding or death?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: 'Under 66', points: 1 }, { label: '66 to 74', points: 2 }, { label: '75 or older', points: 3 }] },
    { id: 'lvef', type: 'choice', label: 'Left ventricular ejection fraction', ee: 'ddl2', options: [{ label: 'Above 49%', points: 0 }, { label: 'Unknown', points: 1 }, { label: '30% to 49%', points: 2 }, { label: 'Below 30%', points: 3 }] },
    { id: 'race', type: 'choice', label: 'Race', ee: 'ddl3', options: [{ label: 'White', points: 0 }, { label: 'Asian', points: 2 }, { label: 'Black', points: 2 }, { label: 'Other', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'hgb', type: 'check', label: 'Hemoglobin below 13 g/dL', points: 2, ee: 'cb1' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation or flutter at baseline', points: 1, ee: 'cb2' },
    { id: 'stroke', type: 'check', label: 'Prior ischemic stroke', points: 1, ee: 'cb3' },
    { id: 'creat', type: 'check', label: 'Creatinine 1.24 mg/dL (110 µmol/L) or higher', points: 1, ee: 'cb4' },
    { id: 'male', type: 'check', label: 'Male sex', points: 1, ee: 'cb5' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', points: 1, ee: 'cb6' },
    { id: 'carotid', type: 'check', label: 'History of carotid disease', points: 1, ee: 'cb7' },
    { id: 'mi', type: 'check', label: 'Previous myocardial infarction', points: 1, ee: 'cb8' }
  ],
  points: { label: 'ENGAGE AF score', max: 16 },
  compute(a) {
    const s = a.age + 1 + a.lvef + (a.race > 0 ? 2 : 0) + 2 * a.hgb + a.af + a.stroke + a.creat + a.male + a.dm + a.carotid + a.mi;
    const r = s >= 12 ? '34.1' : RISK[s];
    return { level: s <= 3 ? 1 : s <= 6 ? 2 : s <= 9 ? 3 : 4, headline: `Disabling stroke, death or life-threatening bleeding: ${r}% per year` };
  }
};
