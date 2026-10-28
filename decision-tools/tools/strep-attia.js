// Strep score in children 1 to 18 (Attia 2001; EE+ 167). A scarlatiniform rash counts 2 points, as on EE+.
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'strep-attia',
  eeId: 167,
  title: 'Strep score (pediatric)',
  subtitle: 'Streptococcal pharyngitis in children with sore throat',
  question: 'For a child aged 1 to 18 with sore throat, what is the probability of strep?',
  inputs: [
    { id: 'tonsils', type: 'check', label: 'Tonsillar swelling (moderate or severe)', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'nodes', type: 'check', label: 'Cervical lymphadenopathy (moderate or severe)', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'rash', type: 'check', label: 'Scarlatiniform rash', points: 2, ee: 'IDC_CHECKBOX_3' },
    { id: 'noCoryza', type: 'check', label: 'No moderate or severe coryza', points: 1, ee: 'IDC_CHECKBOX_4' }
  ],
  points: { label: 'Strep score', max: 5 },
  footnote: 'Probabilities assume a 39% overall risk of strep.',
  compute(a) {
    const s = pointsOf(tool, a);
    return s === 0 ? { level: 1, headline: 'Low risk: probability of strep 12% (LR 0.2)' }
      : s <= 3 ? { level: 2, headline: 'Moderate risk: probability of strep 36% (LR 0.9)' }
      : { level: 4, headline: 'High risk: probability of strep 79% (LR 5.9)' };
  }
};
