// Simplified Apfel score for postoperative nausea and vomiting (Apfel 1999). Replaces the 1998 ENT model
// (EE+ 200) at Mark Ebell's request (2026-10-26).
const { pointsOf } = require('../lib');
const RISK = ['10%', '21%', '39%', '61%', '79%'];

const tool = module.exports = {
  id: 'apfel-simplified',
  eeId: 200,
  title: 'Simplified Apfel score (postoperative nausea and vomiting)',
  subtitle: 'Risk of postoperative nausea and vomiting after general anesthesia',
  question: 'For an adult having general anesthesia, what is the risk of postoperative nausea and vomiting?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', points: 1 },
    { id: 'nonsmoker', type: 'check', label: 'Non-smoker', points: 1 },
    { id: 'history', type: 'check', label: 'History of postoperative nausea and vomiting or motion sickness', points: 1 },
    { id: 'opioids', type: 'check', label: 'Postoperative opioids expected', points: 1 }
  ],
  points: { label: 'Apfel score', max: 4 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `Risk of postoperative nausea and vomiting: ${RISK[s]}` };
  },
  evidence: {
    reference: 'Apfel CC, Läärä E, Koivuranta M, Greim CA, Roewer N. A simplified risk score for predicting postoperative nausea and vomiting: conclusions from cross-validations between two centers. Anesthesiology. 1999;91(3):693-700.',
    pmid: '10485781',
    population: 'Adults having general anesthesia for various surgery at centers in Finland and Germany (about 2000 patients).',
    validation: 'Cross-validated between the two centers.',
    prevalence: null, developed: null, validated: null, comment: 'Replaces the 1998 ENT-only model used on EE+.'
  }
};
