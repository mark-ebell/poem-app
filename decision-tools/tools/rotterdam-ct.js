// Rotterdam CT score for traumatic brain injury (Maas 2005; EE+ 331, titled "Marshall CT score" on EE+).
// EE+ added a point when an epidural mass was present; in the Rotterdam score the point is for its absence.
const M = ['0% (0/36)', '6.8% (41/600)', '16% (122/773)', '26% (121/465)', '53% (138/261)', '61% (69/114)'];
module.exports = {
  id: 'rotterdam-ct',
  eeId: 331,
  title: 'Traumatic brain injury prognosis (Rotterdam CT score)',
  subtitle: '6-month mortality from CT findings in traumatic brain injury',
  question: 'For a patient with moderate or severe traumatic brain injury, what is the 6-month mortality from the CT findings?',
  inputs: [
    { id: 'cisterns', type: 'choice', label: 'Basal cisterns', ee: 'COMBO_Cisterns', options: [{ label: 'Normal' }, { label: 'Compressed' }, { label: 'Absent' }] },
    { id: 'shift', type: 'check', label: 'Midline shift over 5 mm', ee: 'CHK_Midline' },
    { id: 'epidural', type: 'check', label: 'Epidural mass lesion present', ee: 'CHK_Epidural', note: 'An epidural mass lesion lowers the score (1 point if absent).' },
    { id: 'blood', type: 'check', label: 'Intraventricular blood or traumatic subarachnoid hemorrhage', ee: 'CHK_Blood' }
  ],
  compute(a) {
    const s = 1 + a.cisterns + (a.shift ? 1 : 0) + (a.epidural ? 0 : 1) + (a.blood ? 1 : 0);
    return { score: { value: s, max: 6, label: 'Rotterdam CT score' }, level: s <= 2 ? 1 : s <= 4 ? 2 : 4, headline: `Mortality ${M[s - 1]}` };
  }
};
