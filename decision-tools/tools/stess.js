// Status Epilepticus Severity Score (STESS; Rossetti 2006; EE+ 345). The published score gives a point when
// there is NO history of seizures (or it is unknown); EE+ gave it for a history of seizures.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'stess',
  eeId: 345,
  title: 'Status epilepticus prognosis (STESS)',
  subtitle: 'Status Epilepticus Severity Score',
  question: 'For an adult with status epilepticus, what is the risk of death?',
  inputs: [
    { id: 'consciousness', type: 'choice', label: 'Consciousness', ee: 'combo1', options: [{ label: 'Alert, or somnolent or confused', points: 0 }, { label: 'Stuporous or comatose', points: 1 }] },
    { id: 'type', type: 'choice', label: 'Worst seizure type', ee: 'combo2', options: [{ label: 'Simple or complex partial, absence, or myoclonic (with idiopathic generalized epilepsy)', points: 0 }, { label: 'Generalized convulsive', points: 1 }, { label: 'Nonconvulsive status epilepticus in coma', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', points: 2, ee: 'chk1' },
    { id: 'noHistory', type: 'check', label: 'No history of seizures (or unknown)', points: 1, ee: 'chk2' }
  ],
  points: { label: 'STESS', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a), lines = ['In an external validation in 171 ICU patients (18% died), the best cut-off was 4 or more points (AUC 0.74).'];
    return s >= 3 ? { level: 4, headline: 'High risk: 25% mortality', lines } : { level: 1, headline: 'Low risk: 4% mortality', lines };
  },
  evidence: { comment: 'External validation (Sutter R, Kaplan PW, Rüegg S. Independent external validation of the status epilepticus severity score. Crit Care Med. 2013;41(12):e475-9; PubMed 23982031): 171 consecutive adult ICU patients with status epilepticus, mean age 64, 18% mortality. AUC 0.744 for death, with an optimal cut-off of 4 or more (rather than 3), and good calibration.' }
};
