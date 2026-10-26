// Permanent pacing after cardiac valve surgery (Koplan; EE+ 226).
const RISK = ['1.9', '5.2', '8.7', '12', '21', '36', '50'];
module.exports = {
  id: 'pacing-after-valve',
  eeId: 226,
  title: 'Permanent pacing after valve surgery',
  subtitle: 'Risk of needing a permanent pacemaker (Koplan)',
  question: 'For an adult having cardiac valve surgery, what is the risk of needing permanent pacing?',
  inputs: [
    { id: 'multi', type: 'choice', label: 'Surgery', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Not multivalve', points: 0 }, { label: 'Multivalve, including tricuspid', points: 2 }, { label: 'Multivalve, not including tricuspid', points: 1 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'rbbb', type: 'check', label: 'Right bundle branch block on the preoperative ECG', points: 2, ee: 'IDC_CHECKBOX_1' },
    { id: 'lbbb', type: 'check', label: 'Left bundle branch block on the preoperative ECG', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'pr', type: 'check', label: 'PR interval above 200 ms on the preoperative ECG', points: 1, ee: 'IDC_CHECKBOX_3' },
    { id: 'age', type: 'check', label: 'Age 70 or older', points: 1, ee: 'IDC_CHECKBOX_4' },
    { id: 'prior', type: 'check', label: 'Prior valve surgery', points: 1, ee: 'IDC_CHECKBOX_5' }
  ],
  points: { label: 'Risk score', max: 8 },
  compute(a) {
    const s = [0, 2, 1][a.multi] + 2 * a.rbbb + a.lbbb + a.pr + a.age + a.prior;
    return { level: s <= 1 ? 1 : s <= 3 ? 2 : s <= 4 ? 3 : 4, headline: `Risk of permanent pacing: ${RISK[Math.min(s, 6)]}%` };
  }
};
