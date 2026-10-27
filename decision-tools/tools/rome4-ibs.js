// Rome IV criteria for irritable bowel syndrome (2016). Not an EE+ tool; added at Mark Ebell's request
// (2026-10-26) beside the Rome I criteria (EE+ 183).
module.exports = {
  id: 'rome4-ibs',
  title: 'Rome IV criteria (irritable bowel syndrome)',
  subtitle: 'Diagnostic criteria for irritable bowel syndrome',
  question: 'Does this patient meet the Rome IV criteria for irritable bowel syndrome?',
  categories: ['Gastroenterology: Lower GI'],
  inputs: [
    { id: 'pain', type: 'choice', label: 'Recurrent abdominal pain, on average at least 1 day a week in the last 3 months?', options: [{ label: 'Yes' }, { label: 'No' }], default: 1 },
    { id: 'onset', type: 'choice', label: 'Symptoms began at least 6 months ago?', options: [{ label: 'Yes' }, { label: 'No' }], default: 1 },
    { type: 'heading', label: 'The pain is associated with (check all that apply):' },
    { id: 'defecation', type: 'check', label: 'Defecation (relieved or worsened)' },
    { id: 'frequency', type: 'check', label: 'A change in stool frequency' },
    { id: 'form', type: 'check', label: 'A change in stool form (appearance)' }
  ],
  footnote: 'Alarm features (such as bleeding, weight loss, anemia, onset after 50, or a family history of colorectal cancer or IBD) call for further evaluation whatever the result.',
  compute(a) {
    const n = a.defecation + a.frequency + a.form;
    const met = a.pain === 0 && a.onset === 0 && n >= 2;
    return met ? { level: 3, headline: 'Meets the Rome IV criteria for IBS' }
      : { level: 1, headline: 'Does not meet the Rome IV criteria for IBS', lines: [a.pain !== 0 ? 'Pain at least 1 day a week in the last 3 months is required.' : a.onset !== 0 ? 'Symptoms must have begun at least 6 months ago.' : 'At least 2 of the 3 associated features are required.'] };
  },
  evidence: {
    reference: 'Lacy BE, Mearin F, Chang L, et al. Bowel disorders. Gastroenterology. 2016;150(6):1393-1407.',
    pmid: '27144627',
    population: 'Consensus criteria of the Rome Foundation (Rome IV, 2016).',
    validation: null, prevalence: null, developed: null, validated: null, comment: null
  }
};
