// Glasgow (Imrie) score for acute pancreatitis (Blamey 1984; EE+ 139).
const { pointsOf } = require('../lib');
const RISK = ['6%', '8%', '11%', '17%', '32%', '64%'];

const tool = module.exports = {
  id: 'imrie',
  eeId: 139,
  title: 'Glasgow (Imrie) score (acute pancreatitis)',
  subtitle: 'Risk of severe acute pancreatitis',
  question: 'For a patient with acute pancreatitis, what is the risk of a severe attack?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    ...[['age', 'Age over 55', 'IDC_CHECKBOX_1'], ['wbc', 'White cell count above 15,000/µL', 'IDC_CHECKBOX_2'], ['glucose', 'Glucose above 180 mg/dL', 'IDC_CHECKBOX_3'],
      ['po2', 'PaO2 below 60 mm Hg', 'IDC_CHECKBOX_4'], ['ca', 'Calcium below 8 mg/dL', 'IDC_CHECKBOX_5'], ['albumin', 'Albumin below 3.2 g/dL', 'IDC_CHECKBOX_6'],
      ['ast', 'AST above 100 U/L', 'IDC_CHECKBOX_7'], ['ldh', 'LDH above 600 IU/L', 'IDC_CHECKBOX_8'], ['bun', 'BUN above 45 mg/dL', 'IDC_CHECKBOX_9']]
      .map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))
  ],
  points: { label: 'Imrie score', max: 9 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `Risk of severe pancreatitis: ${RISK[Math.min(5, s)]}` };
  }
};
