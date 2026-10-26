// C-WATCH score: adverse outcome in upper GI bleeding (Hoffmann 2015; EE+ 540).
const { pointsOf } = require('../lib');
const RISK = [3, 5, 10, 18, 30, 45, 62, 76, 86];

const tool = module.exports = {
  id: 'c-watch',
  eeId: 540,
  title: 'C-WATCH score (upper GI bleeding)',
  subtitle: 'Rebleeding, intervention or death in upper GI bleeding',
  question: 'For a patient with suspected upper GI bleeding, before endoscopy, what is the risk of rebleeding, angiography or surgery, or death?',
  inputs: [
    { id: 'platelets', type: 'choice', label: 'Platelet count', ee: 'PLATELET', options: [{ label: '150,000/µL or more', points: 0 }, { label: '50,000 to 150,000', points: 1 }, { label: 'Under 50,000', points: 2 }] },
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'HEMOGLOBIN', options: [
      { label: '12 g/dL or more (women) or 14 or more (men)', points: 0 }, { label: '10 to 11.9 (women) or 10 to 13.9 (men)', points: 1 }, { label: 'Under 10', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'crp', type: 'check', label: 'C-reactive protein above 5 mg/L', points: 1, ee: 'PROTEIN' },
    { id: 'wbc', type: 'check', label: 'White cell count above 11,300/µL', points: 1, ee: 'BLOOD' },
    { id: 'alt', type: 'check', label: 'ALT above 35 U/L (women) or 50 U/L (men)', points: 1, ee: 'ALTSCORE' },
    { id: 'creat', type: 'check', label: 'Creatinine above 0.9 mg/dL (women) or 1.1 mg/dL (men)', points: 1, ee: 'SERUM' }
  ],
  points: { label: 'C-WATCH score', max: 8 },
  compute(a) {
    return { headline: `Risk of rebleeding, angiography or surgery, or death: ${RISK[pointsOf(tool, a)]}%` };
  }
};
