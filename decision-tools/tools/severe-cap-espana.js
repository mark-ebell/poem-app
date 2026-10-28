// Severe community-acquired pneumonia (España 2006; EE+ 447).
const { pointsOf } = require('../lib');
const OUTCOME = 'severe community-acquired pneumonia (death, shock or mechanical ventilation)';
const tool = module.exports = {
  id: 'severe-cap-espana',
  eeId: 447,
  title: 'Severe pneumonia probability (Spanish)',
  subtitle: 'SCAP score for severe community-acquired pneumonia',
  question: 'For a patient evaluated in the ED for community-acquired pneumonia, what is the probability of severe pneumonia?',
  inputs: [
    { id: 'ph', type: 'check', label: 'pH under 7.30', points: 13, ee: 'PH' },
    { id: 'sbp', type: 'check', label: 'Systolic BP under 90 mm Hg', points: 11, ee: 'SBP' },
    { id: 'rr', type: 'check', label: 'Respiratory rate over 30/min', points: 9, ee: 'RESP' },
    { id: 'bun', type: 'check', label: 'BUN over 30 mg/dL (11 mmol/L)', points: 5, ee: 'BLOOD' },
    { id: 'mental', type: 'check', label: 'Altered mental status', points: 5, ee: 'MENTAL' },
    { id: 'pf', type: 'check', label: 'PaO₂/FiO₂ under 250 mm Hg', points: 6, ee: 'PAO2', note: 'For example, a PaO₂ of 80 mm Hg on 20% oxygen gives 80/0.2 = 400; a PaO₂ of 90 mm Hg on 50% oxygen gives 90/0.5 = 180.' },
    { id: 'age80', type: 'check', label: 'Age 80 years or older', points: 5, ee: 'AGE80' },
    { id: 'multilobar', type: 'check', label: 'Multilobar or bilateral pneumonia on chest x-ray', points: 5, ee: 'XRAY' }
  ],
  points: { label: 'SCAP score', max: 59 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 10 ? { level: 1, headline: `3.4% ${OUTCOME}` } : s < 20 ? { level: 2, headline: `11% ${OUTCOME}` } : s < 30 ? { level: 3, headline: `37% ${OUTCOME}` } : { level: 4, headline: `50% ${OUTCOME}` };
  }
};
