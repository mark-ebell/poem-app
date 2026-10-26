// Aortic Dissection Detection Risk Score with D-dimer (Nazerian; EE+ 565).
const R = { // [d-dimer: not available, < 500, >= 500][score 0..3]
  0: [[1, 'Low risk', '12/437 (2.7%)', 'low'], [2, 'Moderate risk', '96/1070 (9.0%)', 'moderate'], [3, 'High risk', '133/341 (39%)', 'high'], [3, 'High risk', '133/341 (39%)', 'high']],
  1: [[1, 'Low risk', '1/294 (0.3%)', 'lowD'], [1, 'Low risk', '2/630 (0.3%)', 'lowD'], [2, 'Moderate risk', '5/113 (4.4%)', 'moderate'], [2, 'Moderate risk', '5/113 (4.4%)', 'moderate']],
  2: [[2, 'Moderate risk', '11/143 (7.7%)', 'moderate'], [3, 'High risk', '94/440 (21.4%)', 'high'], [4, 'Very high risk', '128/228 (56%)', 'high'], [4, 'Very high risk', '128/228 (56%)', 'high']]
};
const ACTION = {
  low: 'Evaluate for alternate causes; if unexplained hypotension, mediastinal widening, or aortic problem otherwise suspected, obtain expedited aortic imaging.',
  lowD: 'Evaluate for alternate causes; if unexplained hypotension, mediastinal widening, or aortic problem otherwise suspected, obtain aortic imaging.',
  moderate: 'If CXR, ECG or H&P do not provide a clear alternate diagnosis, obtain expedited aortic imaging.',
  high: 'Obtain immediate surgical consult and arrange for expedited aortic imaging.'
};

module.exports = {
  id: 'add-rs',
  eeId: 565,
  title: 'Aortic Dissection Detection Risk Score (ADD-RS)',
  subtitle: 'Acute aortic syndrome, with or without D-dimer',
  question: 'When acute aortic dissection is in the differential diagnosis, how likely is acute aortic syndrome as the cause of the symptoms?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'history', type: 'check', label: 'High-risk history: family history of aortic disease, Marfan syndrome, known aortic valve disease, recent aortic manipulation, or known thoracic aortic aneurysm', points: 1, ee: 'cb1' },
    { id: 'pain', type: 'check', label: 'High-risk pain: back, chest or abdominal pain that is abrupt in onset, ripping or tearing, or severe', points: 1, ee: 'cb2' },
    { id: 'exam', type: 'check', label: 'High-risk exam: perfusion deficit (pulse deficit, systolic BP differential, or focal neurologic deficit with pain), new aortic insufficiency murmur, or hypotension or shock', points: 1, ee: 'cb3' },
    { id: 'ddimer', type: 'choice', label: 'D-dimer', ee: 'ddl1', options: [{ label: 'Not available' }, { label: 'Below 500 ng/mL' }, { label: '500 ng/mL or more' }] }
  ],
  points: { label: 'ADD-RS', max: 3 },
  compute(a) {
    const s = [a.history, a.pain, a.exam].filter(Boolean).length;
    const r = R[a.ddimer][s];
    return { level: r[0], headline: r[1], lines: [`${r[2]} had acute aortic syndrome (dissection, hematoma, ulcer or rupture).`, ACTION[r[3]]] };
  }
};
