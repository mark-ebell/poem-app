// AWTT score: severe alcohol withdrawal syndrome (EE+ 638).
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'awtt',
  eeId: 638,
  title: 'Severe alcohol withdrawal risk (AWTT score)',
  subtitle: 'Severe alcohol withdrawal syndrome in patients with alcohol use disorder',
  question: 'For a patient with alcohol use disorder seen in the ED or admitted, what is the risk of severe alcohol withdrawal?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('seizure', 'History of seizure', 'cb1'), check('bili', 'Total bilirubin over 1.0 mg/dL', 'cb2'), check('ast', 'AST 41 U/L or more', 'cb3'), check('hr', 'Heart rate 100 or more', 'cb4'),
    check('depression', 'Depression', 'cb5'), check('white', 'White race', 'cb6'), check('otherDx', 'Seen for a diagnosis other than alcohol use disorder', 'cb7'), check('k', 'Potassium under 3.5 mmol/L', 'cb8')
  ],
  compute(a) {
    const n = ['seizure', 'bili', 'ast', 'hr', 'depression', 'white', 'otherDx', 'k'].reduce((t, k) => t + a[k], 0);
    return n >= 3 ? { score: { value: n, max: 8, label: 'AWTT score' }, level: 4, headline: 'High risk for severe alcohol withdrawal syndrome (35%)' } : { score: { value: n, max: 8, label: 'AWTT score' }, level: 1, headline: 'Low risk for severe alcohol withdrawal syndrome (5.6%)' };
  }
};
