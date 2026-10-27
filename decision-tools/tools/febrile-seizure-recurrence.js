// Recurrence after a first febrile seizure (Berg 1997; EE+ 589).
const P = ['14%', '24%', '32%', '63%', '75%'];

module.exports = {
  id: 'febrile-seizure-recurrence',
  eeId: 589,
  title: 'Febrile seizure recurrence',
  subtitle: 'Recurrence within 2 years of a first febrile seizure',
  question: 'For a child after a first febrile seizure, what is the risk of another within 2 years?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age under 18 months', ee: 'cb1' },
    { id: 'fever', type: 'check', label: 'Fever for less than 1 hour before the seizure', ee: 'cb2' },
    { id: 'family', type: 'check', label: 'First-degree relative with febrile seizures', ee: 'cb3' },
    { id: 'temp', type: 'check', label: 'Temperature under 40°C (104°F)', ee: 'cb4' }
  ],
  compute(a) {
    const n = a.age + a.fever + a.family + a.temp;
    return { score: { value: n, max: 4, label: 'Risk factors' }, level: [1, 2, 2, 4, 4][n], headline: `2-year recurrence risk: ${P[n]}` };
  }
};
