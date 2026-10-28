// Outcome after severe head injury (Cremer 2006; EE+ 386).
const CT = [0, 0, -0.73, -1.21, -0.87, -1.12];
const r1 = x => Math.round(x * 1000) / 10;
module.exports = {
  id: 'head-injury-cremer',
  eeId: 386,
  title: 'Severe head injury prognosis',
  subtitle: 'Recovery, disability or death after severe head injury',
  question: 'For an adult still comatose 24 hours after severe head injury, what are the probabilities of recovery, disability and death?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 1, max: 100, ee: 'TXT_Age' },
    { id: 'motor', type: 'choice', label: 'Best GCS motor score on day 1', ee: 'CMB_Motor', options: ['1: No response', '2: Extension (decerebrate)', '3: Abnormal flexion (decorticate)', '4: Flexion withdrawal', '5: Localizes pain', '6: Obeys commands'].map(label => ({ label })) },
    { id: 'ct', type: 'choice', label: 'CT diagnosis', ee: 'CMB_CT', options: ['I: No visible pathology', 'II: Diffuse injury', 'III: Diffuse injury with swelling', 'IV: Diffuse injury with shift', 'V: Evacuated mass lesion', 'VI: Nonevacuated mass lesion'].map(label => ({ label })) },
    { id: 'pupils', type: 'choice', label: 'Pupils', ee: 'CMB_Pupils', options: [{ label: 'Both reactive' }, { label: 'One nonreactive' }, { label: 'Both nonreactive' }] },
    { id: 'hypotension', type: 'check', label: 'Hypotension (systolic under 90 mm Hg on day 1)', ee: 'CHK_Hypotension' }
  ],
  compute(a) {
    const c = 0.21 * (a.motor + 1) - 0.039 * Math.trunc(a.age) - 0.3 * (a.hypotension ? 1 : 0) + [0, -0.23, -1.09][a.pupils] + CT[a.ct];
    const recover = 1 / (1 + Math.exp(-(0.71 + c))), notDead = 1 / (1 + Math.exp(-(2.18 + c)));
    const death = 1 - notDead;
    return { level: death < 0.2 ? 1 : death < 0.4 ? 2 : death < 0.6 ? 3 : 4, headline: `Probability of death ${r1(death)}%`, lines: [{ label: 'Probability of recovery', value: `${r1(recover)}%` }, { label: 'Probability of disability', value: `${r1(notDead - recover)}%` }] };
  }
};
