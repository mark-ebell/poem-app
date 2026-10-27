// Type of chronic recurrent headache in children (Golferini 1988; EE+ 231). Three discriminant functions; the
// largest gives the likely diagnosis.
const FREQ = ['Once a year or less', 'More than once a year', 'Once a month', 'Twice a month', 'More than twice a month', 'Once a week', 'Twice a week', 'More than twice a week', 'Daily'];
const PAIN = ['Superficial', 'Other', 'Constrictive', 'Shooting', 'Throbbing'];

module.exports = {
  id: 'peds-headache',
  eeId: 231,
  title: 'Headache diagnosis in children',
  subtitle: 'Migraine, psychogenic or non-defined headache in children',
  question: 'For a child with chronic, recurrent headache, which type of headache is most likely?',
  inputs: [
    { id: 'freq', type: 'choice', label: 'Frequency of attacks', ee: 'IDC_COMBOBOX_FREQUENCY_OF_ATTACKS', options: FREQ.map(label => ({ label })) },
    { id: 'pain', type: 'choice', label: 'Type of pain', ee: 'IDC_COMBOBOX_TYPE_OF_PAIN', options: PAIN.map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'neuro', type: 'check', label: 'Neurologic deficits', ee: 'IDC_CHECKBOX_NEUROLOGIC_DEFICITS' },
    { id: 'nausea', type: 'check', label: 'Nausea', ee: 'IDC_CHECKBOX_NAUSEA' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', ee: 'IDC_CHECKBOX_VOMITING' }
  ],
  compute(a) {
    const f = a.freq + 1, p = a.pain + 1;
    const mig = 1.3 * f + 3.4 * p - 45 + 59 * a.neuro + 4.3 * a.nausea + 65 * a.vomiting;
    const psy = 2.1 * f + 1.9 * p - 10.8 + 5.5 * a.neuro + 0.4 * a.nausea + 2.6 * a.vomiting;
    const und = 1.5 * f + 2.1 * p - 9.7 + 5.7 * a.neuro + 3.5 * a.nausea + 1.5 * a.vomiting;
    return mig >= psy && mig >= und ? { headline: 'Migraine is the most likely diagnosis' }
      : psy >= und ? { headline: 'Psychogenic headache is the most likely diagnosis' } : { headline: 'Non-defined headache: migraine unlikely, psychogenic possible' };
  }
};
