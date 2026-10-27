// Evaluation of acute low back pain (Jarvik and Deyo 2002, an update of the AHCPR guideline; EE+ 184). Wording as in EE+.
const TYPES = [
  ['Simple back pain: age under 50, no signs of systemic disease, no history of cancer, no neurologic deficit',
    'Complicated back pain: age 50 or older, or systemic signs, symptoms or risk factors (fever, weight loss, history of cancer, hematuria, adenopathy or IV drug use)'],
  ['Radiculopathy: signs and symptoms of radiculopathy without bladder involvement or bilateral findings (99%)',
    'Urgent: acute radiculopathy with urinary retention, saddle anesthesia or bilateral neurologic findings (1%)'],
  ['Tolerable symptoms without neurologic deficit', 'Intolerable symptoms or neurologic deficits']
];
const ADVICE = [
  ['No diagnostic tests. If not improved after 6 weeks of conservative therapy, order an ESR. If 2 or more risk factors (fever, weight loss, history of cancer, hematuria, adenopathy or IV drug use), obtain radiographs. If radiographs or ESR are abnormal, consider MRI.',
    'Order an ESR. If 2 or more risk factors or ESR above 20 mm/h, obtain radiographs. If radiographs or ESR are abnormal, consider MRI.'],
  ['Conservative care for 6 weeks unless the neurologic deficit progresses. If no improvement, CT or MRI.',
    'Urgent consultation and CT or MRI to evaluate for cord or cauda equina compression. Consider discectomy.'],
  ['Treat symptoms. If not improved, order MRI, CT or electrodiagnosis and consider laminectomy.', 'MRI, CT or electrodiagnosis. Consider laminectomy.']
];

module.exports = {
  id: 'back-pain-guideline',
  eeId: 184,
  title: 'Back pain evaluation guideline',
  subtitle: 'Diagnostic evaluation of acute low back pain',
  question: 'For a patient with acute low back pain, what diagnostic evaluation is recommended?',
  inputs: [
    { id: 'type', type: 'choice', label: 'Type of pain', ee: 'IDC_RADIO_1', options: [{ label: 'Back pain only (93%)' }, { label: 'Sciatica (4%)' }, { label: 'Possible stenosis (3%)' }],
      note: 'Possible stenosis: back and leg pain relieved by sitting; usually seen in older adults.' },
    ...TYPES.map((labels, t) => ({ id: `symptoms${t}`, type: 'choice', label: 'Symptoms', ee: 'IDC_RADIO_4', when: a => a.type === t, options: labels.map(label => ({ label })) }))
  ],
  compute(a) {
    const s = a[`symptoms${a.type}`];
    return { headline: ADVICE[a.type][s] };
  }
};
