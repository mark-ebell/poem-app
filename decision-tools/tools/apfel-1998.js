// Postoperative vomiting after ENT surgery (Apfel 1998; EE+ 200).
const DURATION = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

module.exports = {
  id: 'apfel-1998',
  eeId: 200,
  title: 'Postoperative vomiting (Apfel 1998)',
  subtitle: 'Vomiting after general anesthesia for ENT surgery',
  question: 'For an adult having elective ENT surgery under general anesthesia, what is the risk of postoperative vomiting?',
  inputs: [
    { id: 'duration', type: 'choice', label: 'Duration of anesthesia', ee: 'IDC_COMBOBOX_2', default: 1, options: DURATION.map(h => ({ label: `${h} hour${h === 1 ? '' : 's'}` })) },
    { id: 'age', type: 'choice', label: 'Age (by decade)', ee: 'IDC_COMBOBOX_1', default: 2, options: ['20s', '30s', '40s', '50s', '60s', '70s', '80s', '90s'].map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_4' },
    { id: 'smoker', type: 'check', label: 'Smoker', ee: 'IDC_CHECKBOX_3' },
    { id: 'motion', type: 'check', label: 'History of motion sickness', ee: 'IDC_CHECKBOX_1' },
    { id: 'ponv', type: 'check', label: 'History of postoperative nausea or vomiting', ee: 'IDC_CHECKBOX_2' }
  ],
  footnote: 'Developed in ENT surgery without antiemetic prophylaxis; uncertain for other surgery. The simplified Apfel score (2 to 4 risk factors) is now more widely used.',
  compute(a) {
    const x = 1.28 * a.female - 0.029 * (a.age + 2) - 0.74 * a.smoker + 0.63 * (a.motion || a.ponv ? 1 : 0) + 0.26 * DURATION[a.duration] - 0.92;
    return { headline: `Risk of postoperative vomiting: ${(100 / (1 + Math.exp(-x))).toFixed(1)}%` };
  }
};
