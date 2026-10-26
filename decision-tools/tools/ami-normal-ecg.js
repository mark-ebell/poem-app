// Risk of acute MI with a normal or nearly normal ECG (Rouan; EE+ 43).
const PROB = { normal: [0, 1.1, 2.5, 9.0, 26.0], nonspecific: [0, 2.6, 4.8, 11.0, 23.0] };

module.exports = {
  id: 'ami-normal-ecg',
  eeId: 43,
  title: 'Acute MI with a normal or near-normal ECG',
  subtitle: 'Rouan rule for emergency department chest pain',
  question: 'In an adult over 30 with chest pain and a normal or nonspecific ECG, how likely is acute MI?',
  inputs: [
    { id: 'ecg', type: 'choice', label: 'ECG', ee: 'ECG', options: [{ label: 'Normal' }, { label: 'Nonspecific ST-T wave changes' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'MALE' },
    { id: 'age', type: 'check', label: 'Age over 60 years', points: 1, ee: 'AGE' },
    { id: 'pressure', type: 'check', label: 'Pain described as pressure', points: 1, ee: 'PRESSURE' },
    { id: 'radiation', type: 'check', label: 'Pain radiating to arm, shoulder, neck or jaw', points: 1, ee: 'PAIN' }
  ],
  points: { label: 'Features', max: 4 },
  compute(a) {
    const n = [a.male, a.age, a.pressure, a.radiation].filter(Boolean).length;
    const p = (a.ecg === 0 ? PROB.normal : PROB.nonspecific)[n];
    return { level: n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4, headline: `Likelihood of acute MI: ${p.toFixed(1)}%` };
  }
};
