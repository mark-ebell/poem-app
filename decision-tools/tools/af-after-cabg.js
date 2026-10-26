// Atrial fibrillation after CABG (Mathew 2004; EE+ 408).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'af-after-cabg',
  eeId: 408,
  title: 'Atrial fibrillation after cardiac surgery (Mathew)',
  subtitle: 'Postoperative atrial fibrillation after CABG',
  question: 'For a patient having coronary bypass surgery, what is the risk of postoperative atrial fibrillation?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: ['Under 30', '30 to 39', '40 to 49', '50 to 59', '60 to 69', '70 to 79', '80 or older'].map((label, k) => ({ label, points: 6 * (k + 1) })) },
    { type: 'heading', label: 'History: check all that apply' },
    { id: 'af', type: 'check', label: 'History of atrial fibrillation', points: 7, ee: 'CHK_Afib' },
    { id: 'copd', type: 'check', label: 'History of COPD', points: 4, ee: 'CHK_COPD' },
    { id: 'valve', type: 'check', label: 'Concurrent valve surgery', points: 6, ee: 'CHK_Surgery' },
    { type: 'heading', label: 'Treatment: check all that apply' },
    { id: 'bbWithdrawn', type: 'check', label: 'Postoperative withdrawal of a beta-blocker', points: 6, ee: 'CHK_BetaWithdrawal' },
    { id: 'aceWithdrawn', type: 'check', label: 'Postoperative withdrawal of an ACE inhibitor', points: 5, ee: 'CHK_ACEWithdrawal' },
    { id: 'bbBoth', type: 'check', label: 'Beta-blocker before and after surgery', points: -7, ee: 'CHK_BetaPrePost' },
    { id: 'aceBoth', type: 'check', label: 'ACE inhibitor before and after surgery', points: -5, ee: 'CHK_ACEPrePost' },
    { id: 'bbPost', type: 'check', label: 'Beta-blocker after surgery', points: -11, ee: 'CHK_BetaPost' },
    { id: 'k', type: 'check', label: 'Potassium supplements after surgery', points: -5, ee: 'CHK_PotPost' },
    { id: 'nsaid', type: 'check', label: 'NSAID after surgery', points: -7, ee: 'CHK_NSAIDPost' }
  ],
  points: { label: 'Score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 14 ? { level: 1, headline: 'Low risk: 14% develop atrial fibrillation' }
      : s < 32 ? { level: 2, headline: 'Moderate risk: 31% develop atrial fibrillation' }
      : { level: 4, headline: 'High risk: 67% develop atrial fibrillation' };
  }
};
