// Ectopic pregnancy in first-trimester pain or bleeding (Buckley 1999; EE+ 113). EE+ checked cervical
// motion tenderness twice and never peritoneal signs; here either one makes the patient high risk.
module.exports = {
  id: 'ectopic-buckley',
  eeId: 113,
  title: 'Ectopic pregnancy risk (Buckley)',
  subtitle: 'Ectopic pregnancy in the first trimester with pain or bleeding',
  question: 'For a hemodynamically stable woman in the first trimester with abdominal pain or vaginal bleeding, how likely is an ectopic pregnancy?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'cmt', type: 'check', label: 'Definite cervical motion tenderness', ee: 'IDC_CHECKBOX_1' },
    { id: 'peritoneal', type: 'check', label: 'Signs of peritoneal irritation on abdominal exam', ee: 'IDC_CHECKBOX_2' },
    { id: 'noFht', type: 'check', label: 'No fetal heart tones by handheld Doppler', ee: 'IDC_CHECKBOX_3' },
    { id: 'noTissue', type: 'check', label: 'No tissue visible at the cervical os', ee: 'IDC_CHECKBOX_4' },
    { id: 'pain', type: 'check', label: 'Pain (other than midline suprapubic cramping) or tenderness (cervical motion, uterine or adnexal)', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    if (a.cmt || a.peritoneal) return { level: 4, headline: 'High risk of ectopic pregnancy: 29%' };
    if (a.noFht && a.noTissue && a.pain) return { level: 2, headline: 'Moderate risk of ectopic pregnancy: 7.3%' };
    return { level: 1, headline: 'Low risk of ectopic pregnancy: 0.5%' };
  }
};
