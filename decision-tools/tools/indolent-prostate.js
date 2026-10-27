// Kattan nomogram: probability that screen-detected prostate cancer is indolent (Kattan 2003; EE+ 387).
const PROB = { 10: 16, 11: 19, 12: 23, 13: 28, 14: 33, 15: 39, 16: 45, 17: 52, 18: 58, 19: 64, 20: 69, 21: 74, 22: 79, 23: 83, 24: 86 };
const opts = (labels, pts) => labels.map((label, k) => ({ label, points: pts[k] }));
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'indolent-prostate',
  eeId: 387,
  title: 'Probability that prostate cancer is indolent',
  subtitle: 'Indolent cancer in screen-detected, low-grade prostate cancer',
  question: 'For a man with screen-detected T1c or T2 prostate cancer and Gleason 3+3 or less, how likely is the cancer to be indolent?',
  inputs: [
    { id: 'psa', type: 'choice', label: 'PSA (ng/mL)', ee: 'CMB_PSA', options: opts(['20', '13', '9', '6', '5', '4', '3.3', '2.2', '1.0'], [0, 2, 4, 6, 7, 8, 9, 11, 15]) },
    { id: 'volume', type: 'choice', label: 'Ultrasound volume (cc)', ee: 'CMB_Ultrasound', options: opts(['20', '40', '60', '80'], [0, 2, 4, 6]) },
    { id: 'gleason', type: 'choice', label: 'Gleason grades', ee: 'CMB_Gleason', options: opts(['3+3', '2+3', '2+2'], [0, 1, 4]) },
    { id: 'cancerMm', type: 'choice', label: 'Total mm of cancer in biopsy cores', ee: 'CMB_CACore', options: opts(['20', '10', '8', '4', '2', '1'], [0, 2, 3, 5, 7, 9]) },
    { id: 'benignMm', type: 'choice', label: 'Total mm of non-cancerous tissue in biopsy cores', ee: 'CMB_NonCACore', options: opts(['40', '60', '80'], [0, 2, 4]) }
  ],
  points: { label: 'Score' },
  footnote: 'Indolent cancer carries little risk to the patient; about 50% of screen-detected T1c or T2 cancers were indolent.',
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `${s < 10 ? 13 : s > 24 ? 89 : PROB[s]}% probability of indolent cancer` };
  }
};
