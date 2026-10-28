// AUA symptom index for benign prostatic hyperplasia (Barry 1992; EE+ 323).
const OFTEN = ['Never', 'Less than 1 time in 5', 'Less than half the time', 'About half the time', 'More than half the time', 'Almost always'].map((label, points) => ({ label, points }));
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'ipss',
  eeId: 323,
  title: 'BPH symptom index (AUA)',
  subtitle: 'American Urological Association symptom index',
  question: 'Over the past month or so, how often have you:',
  inputs: [
    { id: 'empty', type: 'choice', label: 'Had the sensation of not emptying your bladder completely after you finished urinating?', ee: 'COMBO_NotEmpty', options: OFTEN },
    { id: 'again', type: 'choice', label: 'Had to urinate again less than 2 hours after you finished urinating?', ee: 'COMBO_UrinateAgain', options: OFTEN },
    { id: 'stop', type: 'choice', label: 'Found you stopped and started again several times when urinating?', ee: 'COMBO_StopStart', options: OFTEN },
    { id: 'postpone', type: 'choice', label: 'Found it difficult to postpone urination?', ee: 'COMBO_Postpone', options: OFTEN },
    { id: 'weak', type: 'choice', label: 'Had a weak urinary stream?', ee: 'COMBO_WeakStream', options: OFTEN },
    { id: 'strain', type: 'choice', label: 'Had to push or strain to begin urination?', ee: 'COMBO_Strain', options: OFTEN },
    { id: 'night', type: 'choice', label: 'Had to get up to urinate during the night?', ee: 'COMBO_Night', options: ['Never', '1 time', '2 times', '3 times', '4 times', '5 or more times'].map((label, points) => ({ label, points })) }
  ],
  points: { label: 'AUA score', max: 35 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 8 ? { level: 1, headline: 'Mild symptoms (0 to 7)' } : s < 20 ? { level: 2, headline: 'Moderate symptoms (8 to 19)' } : { level: 3, headline: 'Severe symptoms (20 to 35)' };
  }
};
