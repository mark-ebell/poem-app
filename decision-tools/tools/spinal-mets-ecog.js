// Survival with spinal metastases from 7 factors (EE+ 374).
module.exports = {
  id: 'spinal-mets-ecog',
  eeId: 374,
  title: 'Spinal metastasis prognosis',
  subtitle: 'Survival with spinal metastases',
  question: 'For a patient with spinal metastases, what is the expected survival?',
  inputs: [
    { id: 'favorable', type: 'choice', label: 'Favorable primary tumor (breast, prostate, lymphoma or non-anaplastic thyroid)', ee: 'CHK_Primary', options: [{ label: 'Yes' }, { label: 'No' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ecog', type: 'check', label: 'ECOG performance status 3 or more (limited self-care, in bed or chair more than half of waking hours, or worse)', ee: 'CHK_ECOG' },
    { id: 'visceral', type: 'check', label: 'Visceral metastases', ee: 'CHK_Visceral' },
    { id: 'chemo', type: 'check', label: 'Previous chemotherapy', ee: 'CHK_Previous' },
    { id: 'calcium', type: 'check', label: 'Hypercalcemia', ee: 'CHK_Hyper' },
    { id: 'multiple', type: 'check', label: 'Multiple bone metastases', ee: 'CHK_Multiple' },
    { id: 'age', type: 'check', label: 'Age 71 or older', ee: 'CHK_71' }
  ],
  compute(a) {
    const s = 3 * a.favorable + 3 * a.ecog + 2 * a.visceral + 2 * a.chemo + 2 * a.calcium + a.multiple + a.age;
    const r = s < 5 ? [1, '27.1', '89%', '77%', '54%'] : s < 10 ? [3, '5.4', '46%', '22%', '9%'] : [4, '1.8', '7%', '4%', '0%'];
    return { score: { value: s, max: 14, label: 'Score' }, level: r[0], headline: `Median survival ${r[1]} months`,
      table: { head: ['Survival at', 'Percent'], rows: [['6 months', r[2]], ['12 months', r[3]], ['24 months', r[4]]] } };
  }
};
