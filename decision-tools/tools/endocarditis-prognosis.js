// 6-month mortality in complicated left-sided native valve endocarditis (Hasbun; EE+ 202).
module.exports = {
  id: 'endocarditis-prognosis',
  eeId: 202,
  title: 'Endocarditis prognosis (Hasbun)',
  subtitle: '6-month mortality in complicated native valve endocarditis',
  question: 'For an adult with complicated left-sided native valve endocarditis, what is the 6-month mortality?',
  inputs: [
    { id: 'organism', type: 'choice', label: 'Microbiology', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Viridans streptococci', points: 0 }, { label: 'Staphylococcus aureus', points: 6 }, { label: 'Other', points: 8 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chf', type: 'check', label: 'Moderate or severe heart failure (rales, dyspnea at rest, or pulmonary edema on chest x-ray)', points: 3, ee: 'IDC_CHECKBOX_1' },
    { id: 'medical', type: 'check', label: 'Medical therapy only (no valve surgery)', points: 5, ee: 'IDC_CHECKBOX_2' },
    { id: 'mental', type: 'check', label: 'Lethargy or disorientation (not alert)', points: 4, ee: 'IDC_CHECKBOX_3' },
    { id: 'charlson', type: 'check', label: 'Charlson comorbidity score 2 or higher', points: 3, ee: 'IDC_CHECKBOX_4' }
  ],
  points: { label: 'Score', max: 23 },
  compute(a) {
    const s = [0, 6, 8][a.organism] + 3 * a.chf + 5 * a.medical + 4 * a.mental + 3 * a.charlson;
    const r = s < 7 ? [1, 'Risk group 1 of 4 (lowest)', '6%'] : s < 12 ? [2, 'Risk group 2 of 4', '17%'] : s < 16 ? [3, 'Risk group 3 of 4', '31%'] : [4, 'Risk group 4 of 4 (highest)', '63%'];
    return { level: r[0], headline: r[1], lines: [{ label: '6-month mortality', value: r[2] }] };
  }
};
