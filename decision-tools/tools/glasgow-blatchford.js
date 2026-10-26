// Glasgow-Blatchford score: need for treatment in upper GI bleeding (Blatchford 2000; EE+ 149).
// EE+ scored women's hemoglobin on the men's bands, giving under 10 g/dL 0 points; here each sex has its own bands.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'glasgow-blatchford',
  eeId: 149,
  title: 'Glasgow-Blatchford score',
  subtitle: 'Need for treatment in upper GI bleeding',
  question: 'For a patient with acute upper GI bleeding, how likely is the need for transfusion, endoscopic treatment or surgery?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'IDC_RADIO', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'bun', type: 'choice', label: 'BUN', ee: 'IDC_COMBOBOX_1', options: [
      { label: 'Under 18.2 mg/dL', points: 0 }, { label: '18.2 to 22.3', points: 2 }, { label: '22.4 to 27.9', points: 3 }, { label: '28 to 69.9', points: 4 }, { label: '70 or more', points: 6 }] },
    { id: 'hbMale', type: 'choice', label: 'Hemoglobin', ee: 'IDC_COMBOBOX_2', when: a => a.sex === 0, options: [
      { label: '13.0 g/dL or more', points: 0 }, { label: '12.0 to 12.9', points: 1 }, { label: '10.0 to 11.9', points: 3 }, { label: 'Under 10.0', points: 6 }] },
    { id: 'hbFemale', type: 'choice', label: 'Hemoglobin', when: a => a.sex === 1, options: [
      { label: '12.0 g/dL or more', points: 0 }, { label: '10.0 to 11.9', points: 1 }, { label: 'Under 10.0', points: 6 }] },
    { id: 'sbp', type: 'choice', label: 'Systolic BP', ee: 'IDC_COMBOBOX_3', options: [
      { label: '110 mm Hg or more', points: 0 }, { label: '100 to 109', points: 1 }, { label: '90 to 99', points: 2 }, { label: 'Under 90', points: 3 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pulse', type: 'check', label: 'Pulse 100/min or more', points: 1, ee: 'Check1_ID' },
    { id: 'melena', type: 'check', label: 'Melena', points: 1, ee: 'Check2_ID' },
    { id: 'syncope', type: 'check', label: 'Syncope', points: 2, ee: 'Check3_ID' },
    { id: 'liver', type: 'check', label: 'Hepatic disease', points: 2, ee: 'Check4_ID' },
    { id: 'hf', type: 'check', label: 'Cardiac failure', points: 2, ee: 'Check5_ID' }
  ],
  points: { label: 'Glasgow-Blatchford score', max: 23 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 2 ? { level: 1, headline: 'Low risk: 0.5% needed treatment' } : s <= 5 ? { level: 2, headline: 'Moderate risk: 23.7% needed treatment' } : { level: 4, headline: 'High risk: 83.0% needed treatment' };
  },
  evidence: { reference: 'Blatchford O, Murray WR, Blatchford M. A risk score to predict need for treatment for upper-gastrointestinal haemorrhage. Lancet. 2000;356(9238):1318-1321.', population: 'Patients admitted to Scottish hospitals with acute upper GI hemorrhage.' }
};
