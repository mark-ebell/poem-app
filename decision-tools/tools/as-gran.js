// Ankylosing spondylitis among patients with back pain (Gran 1985; EE+ 224).
const OUT = [[1, '0% (0 of 52 patients)'], [3, '5% (9 of 194 patients)'], [5, '15% (12 of 82 patients)'], [8, '36% (5 of 14 patients)']];
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'as-gran',
  eeId: 224,
  title: 'Ankylosing spondylitis diagnosis (Gran)',
  subtitle: 'Ankylosing spondylitis in patients with back pain',
  question: 'For a patient with back pain, how likely is ankylosing spondylitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('leaveBed', 'Back pain makes the patient leave bed at night', 'IDC_CHECKBOX_1'),
    check('lying', 'Back pain not relieved by lying down', 'IDC_CHECKBOX_2'),
    check('duration', 'Back pain for 3 months or more', 'IDC_CHECKBOX_3'),
    check('night', 'Back pain at night', 'IDC_CHECKBOX_4'),
    check('stiffness', 'Morning stiffness in the back for 30 minutes or more', 'IDC_CHECKBOX_5'),
    check('lateral', 'Reduced lateral mobility of the lumbar spine', 'IDC_CHECKBOX_6'),
    check('flexion', 'Spondylometry flexion 40 degrees or less', 'IDC_CHECKBOX_7'),
    check('extension', 'Spondylometry extension 20 degrees or less', 'IDC_CHECKBOX_8')
  ],
  compute(a) {
    const n = ['leaveBed', 'lying', 'duration', 'night', 'stiffness', 'lateral', 'flexion', 'extension'].reduce((t, k) => t + a[k], 0);
    return { score: { value: n, max: 8, label: 'Findings' }, headline: `Probability of ankylosing spondylitis: ${OUT.find(([max]) => n <= max)[1]}` };
  }
};
