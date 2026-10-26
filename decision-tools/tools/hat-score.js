// HAT score: hemorrhage after thrombolysis for ischemic stroke (Lou 2008; EE+ 373).
const OUT = [['6%', '2%', '0%', '6%'], ['16%', '5%', '3%', '17%'], ['23%', '10%', '7%', '42%'], ['36%', '15%', '6%', '62%'], ['78%', '44%', '33%', '67%']];

module.exports = {
  id: 'hat-score',
  eeId: 373,
  title: 'HAT score',
  subtitle: 'Hemorrhage after tPA for ischemic stroke',
  question: 'For a patient receiving tPA for ischemic stroke, what is the risk of intracranial hemorrhage?',
  inputs: [
    { id: 'nihss', type: 'choice', label: 'NIH Stroke Scale score before treatment', ee: 'CMB_NIHSS', options: [{ label: 'Under 15' }, { label: '15 to 19' }, { label: '20 or more' }] },
    { id: 'ct', type: 'choice', label: 'Easily visible hypodensity on the first head CT', ee: 'CMB_HeadCT', options: [{ label: 'None' }, { label: 'Less than 1/3 of the MCA territory' }, { label: '1/3 of the MCA territory or more' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'glucose', type: 'check', label: 'Diabetes, or glucose above 200 mg/dL (11.1 mmol/L) on admission', ee: 'CHK_Glucose' }
  ],
  compute(a) {
    const s = a.glucose + a.nihss + a.ct, [any, sich, fatal, poor] = OUT[Math.min(4, s)];
    return {
      score: { value: s, max: 5, label: 'HAT score' },
      headline: `Symptomatic intracranial hemorrhage: ${sich}`,
      lines: [`Any hemorrhage: ${any}`, `Fatal hemorrhage: ${fatal}`, `Poor outcome at 3 months: ${poor}`]
    };
  },
  evidence: { reference: 'Lou M, Safdar A, Mehdiratta M, et al. The HAT Score: a simple grading scale for predicting hemorrhage after thrombolysis. Neurology. 2008;71(18):1417-1423.' }
};
