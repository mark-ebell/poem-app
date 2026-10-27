// Inflammatory back pain criteria for ankylosing spondylitis (Rudwaleit 2006; EE+ 339).
const P = ['1.3%', '2.6%', '10.8%', '39.4%', '39.4%'];

module.exports = {
  id: 'as-inflammatory-back',
  eeId: 339,
  title: 'Ankylosing spondylitis diagnosis (inflammatory back pain)',
  subtitle: 'Ankylosing spondylitis in chronic back pain',
  question: 'For a patient under 50 with back pain for more than 3 months, how likely is ankylosing spondylitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'stiffness', type: 'check', label: 'Morning stiffness over 30 minutes', ee: 'chk1' },
    { id: 'exercise', type: 'check', label: 'Back pain improves with exercise but not with rest', ee: 'chk2' },
    { id: 'night', type: 'check', label: 'Woken by back pain during the second half of the night only', ee: 'chk3' },
    { id: 'buttock', type: 'check', label: 'Alternating buttock pain', ee: 'chk4' }
  ],
  footnote: 'Probabilities assume an overall probability of ankylosing spondylitis of 5%.',
  compute(a) {
    const n = a.stiffness + a.exercise + a.night + a.buttock;
    return { score: { value: n, max: 4, label: 'Criteria' }, headline: `Probability that ankylosing spondylitis causes the pain: ${P[n]}` };
  }
};
