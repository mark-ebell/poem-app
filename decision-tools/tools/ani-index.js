// ALD/NAFLD Index (ANI): alcohol as the cause of steatohepatitis (Dunn 2006; EE+ 600).
module.exports = {
  id: 'ani-index',
  eeId: 600,
  title: 'ALD/NAFLD Index (ANI)',
  subtitle: 'Alcoholic vs nonalcoholic steatohepatitis',
  question: 'For an adult with steatohepatitis, how likely is alcohol to be the cause?',
  inputs: [
    { id: 'ast', type: 'number', label: 'AST', unit: 'IU/L', min: 1, max: 5000, step: 1, ee: 'result_2' },
    { id: 'alt', type: 'number', label: 'ALT', unit: 'IU/L', min: 1, max: 5000, step: 1, ee: 'result_1' },
    { id: 'mcv', type: 'number', label: 'MCV', unit: 'fL', min: 50, max: 150, step: 0.1, ee: 'result_3' },
    { id: 'bmi', type: 'number', label: 'BMI', unit: 'kg/m²', min: 10, max: 80, step: 0.1, ee: 'result_5' },
    { type: 'heading', label: 'Check if male' },
    { id: 'male', type: 'check', label: 'Male', ee: 'cb1' }
  ],
  footnote: 'The AST/ALT ratio is capped at 3 and MCV is limited to 92 to 103 fL, as in the published model.',
  compute(a) {
    const s = -58.5 + 6.35 * a.male + 0.637 * Math.min(103, Math.max(92, a.mcv)) + 3.91 * Math.min(3, a.ast / a.alt) - 0.406 * a.bmi;
    return { score: { value: Number(s.toFixed(3)), label: 'ANI' }, headline: `Probability that the steatohepatitis is caused by alcohol: ${(100 / (1 + Math.exp(-s))).toFixed(1)}%` };
  }
};
