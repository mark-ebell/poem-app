// Expert surgeons' judgment of benefit from knee surgery (EE+ 305).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'knee-surgery-referral',
  eeId: 305,
  title: 'Knee surgery referral guide',
  subtitle: 'Likelihood that expert surgeons would judge knee surgery beneficial',
  question: 'For a patient with a knee problem, how likely are expert surgeons to judge that surgery would help?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'acl', type: 'check', label: 'Anterior cruciate ligament laxity', ee: 'IDC_CHECKBOX_1' },
    { id: 'sports', type: 'check', label: 'Sports-related trauma', points: 2, ee: 'IDC_CHECKBOX_2' },
    { id: 'function', type: 'check', label: 'Low functional status', points: 4, ee: 'IDC_CHECKBOX_3' },
    { id: 'rom', type: 'check', label: 'Limited flexion or extension', points: 2, ee: 'IDC_CHECKBOX_4' },
    { id: 'jlt', type: 'check', label: 'Joint line tenderness', points: 2, ee: 'IDC_CHECKBOX_5' },
    { id: 'mcmurray', type: 'check', label: 'Pain or click on McMurray test', points: 2, ee: 'IDC_CHECKBOX_6' }
  ],
  compute(a) {
    if (a.acl) return { level: 3, headline: 'Surgery recommended for almost all patients with ACL laxity' };
    const s = pointsOf(tool, a);
    return { score: { value: s, max: 12, label: 'Score' }, level: s < 4 ? 1 : s <= 8 ? 2 : 3,
      headline: `${s < 4 ? '8%' : s <= 8 ? '33%' : '84%'} were judged likely to benefit from surgery` };
  }
};
