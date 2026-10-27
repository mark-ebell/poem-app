// Dhall score for induction of labor (Dhall 1987; EE+ 39).
module.exports = {
  id: 'dhall',
  eeId: 39,
  title: 'Dhall score (induction of labor)',
  subtitle: 'Success of induction of labor',
  question: 'Before induction of labor, how likely is a successful induction?',
  inputs: [
    { id: 'dilation', type: 'choice', label: 'Dilation', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Closed' }, { label: '1 to 2 cm' }, { label: '3 to 4 cm' }, { label: '5 cm or more' }] },
    { id: 'consistency', type: 'choice', label: 'Consistency', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Firm' }, { label: 'Medium' }, { label: 'Soft' }] },
    { id: 'effacement', type: 'choice', label: 'Effacement', ee: 'IDC_COMBOBOX_3', options: [{ label: '0% to 30%' }, { label: '40% to 50%' }, { label: '60% to 70%' }, { label: 'Over 70%' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'multiparous', type: 'check', label: 'Multiparous', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const s = 3 * a.dilation + 2 * a.consistency + a.effacement + 4 * a.multiparous;
    const [hours, p] = s <= 6 ? ['21.1', '34%'] : s <= 8 ? ['15.8', '72%'] : ['10.8', '91%'];
    return { score: { value: s, label: 'Dhall score' }, headline: `Likelihood of successful induction: ${p}`, lines: [`Mean duration of labor: ${hours} hours`] };
  }
};
