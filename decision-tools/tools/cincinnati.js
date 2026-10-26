// Cincinnati Prehospital Stroke Scale (Kothari 1997; EE+ 302).
module.exports = {
  id: 'cincinnati',
  eeId: 302,
  title: 'Cincinnati Prehospital Stroke Scale',
  subtitle: 'Recognizing stroke outside the hospital',
  question: 'For a patient with suspected stroke, how likely is it to be a stroke?',
  inputs: [
    { type: 'heading', label: 'Check all that are abnormal' },
    { id: 'face', type: 'check', label: 'Facial droop', ee: 'IDC_CHECKBOX_1' },
    { id: 'arm', type: 'check', label: 'Arm drift', ee: 'IDC_CHECKBOX_2' },
    { id: 'speech', type: 'check', label: 'Abnormal speech', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const n = a.face + a.arm + a.speech;
    return n === 0 ? { level: 1, headline: 'Low risk: 10% had a stroke (13 of 130)' }
      : n < 3 ? { level: 3, headline: 'Moderate risk: 58% had a stroke (21 of 36)' }
      : { level: 4, headline: 'High risk: 80% had a stroke (4 of 5)' };
  },
  evidence: { reference: 'Kothari R, Hall K, Brott T, Broderick J. Early stroke recognition: developing an out-of-hospital NIH Stroke Scale. Acad Emerg Med. 1997;4(10):986-990.' }
};
