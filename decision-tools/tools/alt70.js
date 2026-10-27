// ALT-70 score for lower-extremity cellulitis (Raff 2017; EE+ 611). Wording as in EE+.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'alt70',
  eeId: 611,
  title: 'ALT-70 score (cellulitis)',
  subtitle: 'Cellulitis vs mimics in lower-leg erythema',
  question: 'For a patient with lower-leg redness in whom cellulitis is possible, how likely is cellulitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'asymmetry', type: 'check', label: 'Asymmetry (one leg involved)', points: 3, ee: 'cb1' },
    { id: 'age', type: 'check', label: 'Age 70 or older', points: 2, ee: 'cb4' },
    { id: 'wbc', type: 'check', label: 'White cell count 10,000/µL or more', points: 1, ee: 'cb2' },
    { id: 'hr', type: 'check', label: 'Heart rate 90/min or more', points: 1, ee: 'cb3' }
  ],
  points: { label: 'ALT-70 score', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 2 ? { level: 1, headline: '10% likelihood of cellulitis (95% CI 0 to 29%): cellulitis unlikely, consider other diagnoses' }
      : s <= 4 ? { level: 2, headline: '70% likelihood of cellulitis (95% CI 57% to 87%): indeterminate, consider consultation' }
      : { level: 4, headline: '95% likelihood of cellulitis (95% CI 85% to 100%): cellulitis likely, treat empirically' };
  },
  evidence: { reference: 'Raff AB, Weng QY, Cohen JM, et al. A predictive model for diagnosis of lower extremity cellulitis: a cross-sectional study. J Am Acad Dermatol. 2017;76(4):618-625.',
    population: 'Developed in a retrospective chart review of 259 patients, of whom 70% had a final diagnosis of cellulitis. It had similar predictive value for inpatients 24 and 48 hours after admission. In a prospective validation in 67 ED patients, with dermatology consultation as the reference standard, it outperformed thermal imaging.', validated: 67 }
};
