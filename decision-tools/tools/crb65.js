// CRB-65 (meta-analysis: Ebell 2019; EE+ 597).
module.exports = {
  id: 'crb65',
  eeId: 597,
  title: 'CRB-65 (community-acquired pneumonia)',
  subtitle: 'Mortality in outpatients with community-acquired pneumonia',
  question: 'For an adult diagnosed with community-acquired pneumonia in an outpatient setting, what is the risk of death?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'confusion', type: 'check', label: 'New confusion', ee: 'cb1' },
    { id: 'rr', type: 'check', label: 'Respiratory rate 30/min or more', ee: 'cb2' },
    { id: 'bp', type: 'check', label: 'Systolic BP below 90 or diastolic below 60 mm Hg', ee: 'cb3' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'cb4' }
  ],
  footnote: 'Mortality assumes an overall risk of death of 4%.',
  compute(a) {
    const s = a.confusion + a.rr + a.bp + a.age;
    return s === 0 ? { score: { value: s, max: 4, label: 'CRB-65' }, level: 1, headline: 'Low risk: 0.5% mortality' }
      : s <= 2 ? { score: { value: s, max: 4, label: 'CRB-65' }, level: 2, headline: 'Moderate risk: 5.1% mortality' }
      : { score: { value: s, max: 4, label: 'CRB-65' }, level: 4, headline: 'High risk: 18.9% mortality' };
  }
};
