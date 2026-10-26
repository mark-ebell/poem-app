// Diagnostic test calculator: likelihood ratios and predictive values (EE+ 178; standard formulas).
module.exports = {
  id: 'diagnostic-test',
  eeId: 178,
  title: 'Diagnostic test calculator',
  subtitle: 'Likelihood ratios and post-test probability from sensitivity and specificity',
  question: 'Given a test\'s sensitivity and specificity and the pretest probability, what are the likelihood ratios and post-test probabilities?',
  inputs: [
    { id: 'sens', type: 'number', label: 'Sensitivity', unit: '%', min: 1, max: 99.9, step: 0.1 },
    { id: 'spec', type: 'number', label: 'Specificity', unit: '%', min: 1, max: 99.9, step: 0.1 },
    { id: 'pre', type: 'number', label: 'Pretest probability', unit: '%', min: 0.1, max: 99.9, step: 0.1 }
  ],
  footnote: 'LR+ = sensitivity / (1 − specificity); LR− = (1 − sensitivity) / specificity. Post-test probability = post-test odds / (1 + post-test odds), where post-test odds = pretest odds × LR.',
  compute(a) {
    const se = a.sens / 100, sp = a.spec / 100, p = a.pre / 100;
    const lrPos = se / (1 - sp), lrNeg = (1 - se) / sp;
    const ppv = (se * p) / (se * p + (1 - sp) * (1 - p)), npv = (sp * (1 - p)) / (sp * (1 - p) + (1 - se) * p);
    const f = x => `${(100 * x).toFixed(1)}%`;
    return {
      headline: `If positive: ${f(ppv)}; if negative: ${f(1 - npv)}`,
      lines: [`LR+ ${lrPos.toFixed(2)}; LR− ${lrNeg.toFixed(2)}`, `Positive predictive value: ${f(ppv)}`, `Negative predictive value: ${f(npv)}`]
    };
  }
};
