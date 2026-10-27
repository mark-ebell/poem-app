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
    return pointsOf(tool, a) >= 3 ? { level: 4, headline: 'High risk: 25% mortality' } : { level: 1, headline: 'Low risk: 4% mortality' };
  }
};
