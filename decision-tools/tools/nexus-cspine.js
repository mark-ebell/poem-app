// NEXUS low-risk criteria for cervical spine imaging (Hoffman 2000; EE+ 112).
module.exports = {
  id: 'nexus-cspine',
  eeId: 112,
  title: 'NEXUS cervical spine rule',
  subtitle: 'Need for cervical spine imaging after blunt trauma',
  question: 'For a patient in the ED after blunt trauma, is cervical spine imaging needed?',
  inputs: [
    { type: 'heading', label: 'Check each criterion that is met' },
    { id: 'tender', type: 'check', label: 'No tenderness at the posterior midline of the cervical spine', ee: 'IDC_CHECKBOX_1' },
    { id: 'distracting', type: 'check', label: 'No distracting painful injury', ee: 'IDC_CHECKBOX_5' },
    { id: 'alert', type: 'check', label: 'Normal level of alertness', ee: 'IDC_CHECKBOX_2' },
    { id: 'intox', type: 'check', label: 'No evidence of intoxication', ee: 'IDC_CHECKBOX_4' },
    { id: 'focal', type: 'check', label: 'No focal neurologic deficit', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    return a.tender && a.distracting && a.alert && a.intox && a.focal ? { level: 1, headline: 'Imaging not needed: all five low-risk criteria are met' }
      : { level: 3, headline: 'Imaging recommended: not all low-risk criteria are met' };
  }
};
