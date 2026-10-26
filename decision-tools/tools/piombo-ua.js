// Prognosis of unstable angina (Piombo; EE+ 276).
module.exports = {
  id: 'piombo-ua',
  eeId: 276,
  title: 'Unstable angina prognosis (Piombo)',
  subtitle: 'Death, MI and refractory ischemia in unstable angina',
  question: 'For a patient admitted to the CCU with new or progressive unstable angina, what is the risk of death, MI or refractory ischemia?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'st', type: 'check', label: 'ST elevation or depression of 1 mm or more in 2 contiguous leads', points: 4, ee: 'IDC_CHECKBOX_1' },
    { id: 'age', type: 'check', label: 'Age 70 or older', points: 2, ee: 'IDC_CHECKBOX_2' },
    { id: 'cabg', type: 'check', label: 'Previous bypass surgery', points: 2, ee: 'IDC_CHECKBOX_3' },
    { id: 'troponin', type: 'check', label: 'Abnormal troponin test', points: 2, ee: 'IDC_CHECKBOX_4' }
  ],
  points: { label: 'Score', max: 10 },
  compute(a) {
    const s = 4 * a.st + 2 * (a.age + a.cabg + a.troponin);
    const r = s <= 2 ? [1, '3.3%', '5.2%'] : s <= 6 ? [2, '8.1%', '8.1%'] : [4, '33.3%', '13.3%'];
    return { level: r[0], lines: [{ label: 'Death or acute MI', value: r[1] }, { label: 'Refractory ischemia', value: r[2] }] };
  }
};
