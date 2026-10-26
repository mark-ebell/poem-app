// MELD (Kamath 2001), 3-month mortality by patient group (EE+ 193). EE+ cut bilirubin, creatinine and INR
// to whole numbers and used 8.6 for creatinine; here MELD = 9.57 ln(creatinine) + 3.78 ln(bilirubin) +
// 11.2 ln(INR) + 6.43 (etiology), with values below 1 set to 1.
const OUT = { hosp: ['4% (6/148)', '27% (28/103)', '76% (16/21)', '90% (9/10)'], amb: ['2% (5/213)', '5.6% (14/248)', '50% (15/30)', '50% (15/30)'], pbc: ['1% (3/308)', '11% (2/18)', '11% (2/18)', '11% (2/18)'] };

module.exports = {
  id: 'meld-kamath',
  eeId: 193,
  title: 'MELD score (original, Kamath)',
  subtitle: '3-month mortality in end-stage liver disease',
  question: 'For a patient with end-stage liver disease, what is the MELD score and the 3-month mortality?',
  inputs: [
    { id: 'bili', type: 'number', label: 'Bilirubin', unit: 'mg/dL', min: 0.1, max: 80, step: 0.1, ee: 'IDC_EDIT_1' },
    { id: 'creat', type: 'number', label: 'Creatinine', unit: 'mg/dL', min: 0.1, max: 20, step: 0.1, ee: 'IDC_EDIT_2' },
    { id: 'inr', type: 'number', label: 'INR', min: 0.5, max: 15, step: 0.1, ee: 'IDC_EDIT_3' },
    { id: 'etiology', type: 'choice', label: 'Cause of liver disease', ee: 'IDC_COMBOBOX_2', default: 1, options: [{ label: 'Cholestatic or alcoholic' }, { label: 'Hepatitis or other' }] },
    { id: 'group', type: 'choice', label: 'Type of patient', ee: 'IDC_COMBOBOX_1', options: [
      { label: 'Hospitalized with decompensated cirrhosis' }, { label: 'Outpatient with non-cholestatic disease' }, { label: 'Outpatient with primary biliary cirrhosis' }] }
  ],
  compute(a) {
    const ln = v => Math.log(Math.max(1, v));
    const meld = 9.57 * ln(a.creat) + 3.78 * ln(a.bili) + 11.2 * ln(a.inr) + (a.etiology === 1 ? 6.43 : 0);
    const band = meld <= 9 ? 0 : meld <= 19 ? 1 : meld <= 29 ? 2 : 3;
    return { score: { value: Number(meld.toFixed(1)), label: 'MELD score' }, headline: `3-month mortality: ${OUT[['hosp', 'amb', 'pbc'][a.group]][band]}` };
  }
};
