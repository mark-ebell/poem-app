// Acute renal colic in adults with abdominal pain (Eskelinen 1998; EE+ 201).
module.exports = {
  id: 'stone-eskelinen',
  eeId: 201,
  title: 'Renal lithiasis diagnosis (Eskelinen)',
  subtitle: 'Renal colic in adults admitted with abdominal pain',
  question: 'For an adult with abdominal pain, does the score suggest renal colic?',
  inputs: [
    { id: 'rbc', type: 'check', label: 'More than 10 RBC per high-power field in urine', ee: 'IDC_CHECKBOX_1' },
    { id: 'groin', type: 'check', label: 'Groin tenderness', ee: 'IDC_CHECKBOX_2' },
    { id: 'cvat', type: 'check', label: 'Renal (CVA) tenderness', ee: 'IDC_CHECKBOX_3' },
    { id: 'short', type: 'check', label: 'Duration of pain less than 12 hours', ee: 'IDC_CHECKBOX_4' },
    { id: 'appetite', type: 'check', label: 'Normal appetite', ee: 'IDC_CHECKBOX_5' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_6' }
  ],
  footnote: 'Not prospectively validated, and old dataset, so use with caution. A score above −0.69 is 89% sensitive and 99% specific in the development set.',
  compute(a) {
    const s = 7.56 * a.rbc + 6.89 * a.groin + 3.23 * a.cvat + 2.6 * a.short + 1.54 * a.appetite - 3.25 * a.female - 8.06;
    return s > -0.69 ? { level: 4, headline: 'Risk score positive for renal colic' } : { level: 1, headline: 'Risk score negative for renal colic' };
  }
};
