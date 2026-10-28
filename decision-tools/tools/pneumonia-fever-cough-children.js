// Low risk of pneumonia in children with fever and cough (Oostenbrink 2013; EE+ 527).
module.exports = {
  id: 'pneumonia-fever-cough-children',
  eeId: 527,
  title: 'Children with fever and cough: low risk score for pneumonia',
  subtitle: 'Pneumonia in children with fever and cough in the ED',
  question: 'For a child aged 1 month to 16 years in the ED with fever and cough, what is the risk of pneumonia?',
  inputs: [
    { id: 'ill', type: 'check', label: 'Ill appearance by clinical judgment or Yale score over 6', ee: 'ILLAPPEAR' },
    { id: 'sat', type: 'check', label: 'Oxygen saturation under 94%', ee: 'SATURATION' },
    { id: 'tachypnea', type: 'check', label: 'Tachypnea for age', ee: 'TACHYPNEA' }
  ],
  compute(a) {
    const s = (a.ill ? 1 : 0) + (a.sat || a.tachypnea ? 1 : 0);
    return s === 0 ? { level: 1, headline: 'Low risk for pneumonia: 5% (95% CI 2% to 11%)' }
      : s === 1 ? { level: 2, headline: 'Moderate risk for pneumonia: 13%', lines: ['If CRP is over 40 mg/L the risk is 22%; if 40 mg/L or less, only 8%.'] }
      : { level: 4, headline: 'High risk for pneumonia: 31% (95% CI 23% to 39%)' };
  }
};
