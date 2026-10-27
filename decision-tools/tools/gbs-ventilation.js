// Mechanical ventilation in Guillain-Barré syndrome (Sharshar 2003; EE+ 391).
const OUT = ['5 of 65 (8%)', '33 of 183 (18%)', '71 of 205 (35%)', '84 of 136 (62%)', '69 of 81 (85%)', '51 of 52 (98%)'];

module.exports = {
  id: 'gbs-ventilation',
  eeId: 391,
  title: 'Mechanical ventilation in Guillain-Barré syndrome',
  subtitle: 'Need for mechanical ventilation in Guillain-Barré syndrome',
  question: 'For a patient with Guillain-Barré syndrome not ventilated on admission, how likely is mechanical ventilation?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'time', type: 'check', label: 'Time from onset to admission 7 days or more', ee: 'CHK_Time' },
    { id: 'stand', type: 'check', label: 'Unable to stand', ee: 'CHK_Stand' },
    { id: 'elbow', type: 'check', label: 'Unable to lift the elbows above the bed', ee: 'CHK_Elbow' },
    { id: 'head', type: 'check', label: 'Unable to lift the head above the bed', ee: 'CHK_Head' },
    { id: 'cough', type: 'check', label: 'Ineffective cough', ee: 'CHK_Coughing' },
    { id: 'liver', type: 'check', label: 'Liver enzymes at least 1.5 times the upper limit of normal', ee: 'CHK_Liver' }
  ],
  compute(a) {
    const n = a.time + a.stand + a.elbow + a.head + a.cough + a.liver;
    return { score: { value: n, max: 6, label: 'Score' }, level: [1, 2, 3, 4, 4, 4, 4][n], headline: `${OUT[Math.min(n, 5)]} needed mechanical ventilation` };
  }
};
