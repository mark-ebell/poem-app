// Mortality in older adults admitted with pneumonia (Ewig 1999; EE+ 168).
const { count } = require('../lib');
module.exports = {
  id: 'pneumonia-elderly-ewig',
  eeId: 168,
  title: 'Pneumonia prognosis: mortality in elderly',
  subtitle: 'Mortality in patients over 65 admitted with pneumonia',
  question: 'For a patient over 65 admitted with pneumonia, is the risk of death high?',
  inputs: [
    { id: 'rr', type: 'check', label: 'Respiratory rate 30 breaths/min or more', ee: 'IDC_CHECKBOX_1' },
    { id: 'dbp', type: 'check', label: 'Diastolic blood pressure 60 mm Hg or less', ee: 'IDC_CHECKBOX_2' },
    { id: 'confusion', type: 'check', label: 'Mental confusion', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    return count(a, ['rr', 'dbp', 'confusion']) >= 2 ? { level: 4, headline: 'High risk: 31% mortality' } : { level: 1, headline: 'Low risk: 6% mortality' };
  }
};
