// Step-by-Step approach for febrile infants under 90 days (validation: Gomez 2016; EE+ 549).
const yesNo = [{ label: 'Yes' }, { label: 'No' }];

module.exports = {
  id: 'step-by-step',
  eeId: 549,
  title: 'Step-by-Step approach (febrile infants)',
  subtitle: 'Invasive bacterial infection in febrile infants under 90 days',
  question: 'For a febrile infant under 90 days with fever without source, what is the risk of invasive bacterial infection?',
  inputs: [
    { id: 'ill', type: 'choice', label: '1. Ill-appearing (abnormal appearance, work of breathing or circulation)?', required: true, options: yesNo },
    { id: 'young', type: 'choice', label: '2. Age 21 days or younger?', required: true, options: yesNo, when: a => a.ill === 1 },
    { id: 'urine', type: 'choice', label: '3. Leukocyturia?', required: true, options: yesNo, when: a => a.ill === 1 && a.young === 1 },
    { id: 'pct', type: 'choice', label: '4. Procalcitonin 0.5 ng/mL or more?', required: true, options: yesNo, when: a => a.ill === 1 && a.young === 1 && a.urine === 1 },
    { id: 'crp', type: 'choice', label: '5. C-reactive protein above 20 mg/L or absolute neutrophil count above 10,000/µL?', required: true, options: yesNo,
      when: a => a.ill === 1 && a.young === 1 && a.urine === 1 && a.pct === 1 }
  ],
  compute(a) {
    if (a.ill === 0) return { level: 4, headline: 'High risk: 29 of 269 (10.8%) had invasive bacterial infection' };
    if (a.young === 0) return { level: 4, headline: 'High risk: 26 of 307 (8.5%) had invasive bacterial infection' };
    if (a.urine === 0) return { level: 4, headline: 'High risk: 14 of 398 (3.5%) had invasive bacterial infection' };
    if (a.pct === 0) return { level: 4, headline: 'High risk: 6 of 74 (8.1%) had invasive bacterial infection' };
    if (a.crp === 0) return { level: 2, headline: 'Intermediate risk: 5 of 146 (3.4%) had invasive bacterial infection' };
    return { level: 1, headline: 'Low risk: 7 of 991 (0.7%) had invasive bacterial infection' };
  }
};
