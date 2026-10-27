// Liver and lung recurrence after colon cancer resection (Nagata 2019; EE+ 607). Points as on EE+; Mark Ebell
// checked the paper: 4 points for moderately and 3 for poorly differentiated tumors is correct (2026-10-27).
module.exports = {
  id: 'crc-organ-recurrence',
  eeId: 607,
  title: 'Organ-specific recurrence after colon cancer resection',
  subtitle: '5-year risk of liver and lung recurrence after colon cancer surgery',
  question: 'After resection of colon cancer, what is the 5-year risk of recurrence in the liver and in the lung?',
  inputs: [
    { id: 'diff', type: 'choice', label: 'Differentiation', ee: 'ddl1', options: [{ label: 'Well' }, { label: 'Moderately' }, { label: 'Poorly' }] },
    { id: 't', type: 'choice', label: 'T category', ee: 'ddl2', options: [{ label: 'T0 to T2' }, { label: 'T3' }, { label: 'T4a' }, { label: 'T4b' }] },
    { id: 'n', type: 'choice', label: 'N category', ee: 'ddl3', options: [{ label: 'N0' }, { label: 'N1' }, { label: 'N2' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'venous', type: 'check', label: 'Venous invasion', ee: 'cb1' },
    { id: 'cea', type: 'check', label: 'Preoperative CEA over 5 ng/mL', ee: 'cb2' },
    { id: 'female', type: 'check', label: 'Female', ee: 'cb3' },
    { id: 'lymphatic', type: 'check', label: 'Lymphatic invasion', ee: 'cb4' },
    { id: 'obstruction', type: 'check', label: 'Malignant bowel obstruction', ee: 'cb5' }
  ],
  compute(a) {
    const liver = [0, 4, 3][a.diff] + [0, 5, 8, 11][a.t] + 9 * a.venous + [0, 10, 14][a.n] + 4 * a.cea;
    const lung = 7 * a.female + 7 * a.lymphatic + 11 * a.venous + [0, 5, 9][a.n] + 5 * a.cea + 7 * a.obstruction;
    const band = (s, r) => r[s <= 10 ? 0 : s <= 20 ? 1 : s <= 30 ? 2 : 3];
    return { headline: `5-year risk of liver recurrence: ${band(liver, ['1.77%', '5.24%', '10.6%', '22.5%'])}`, lines: [`5-year risk of lung recurrence: ${band(lung, ['0.56%', '3.33%', '5.32%', '7.62%'])}`, `Liver score ${liver} of 42; lung score ${lung} of 46.`] };
  }
};
