// Falls in assisted living (Chen 2005; EE+ 301).
module.exports = {
  id: 'falls-assisted-living',
  eeId: 301,
  title: 'Fall risk in assisted living',
  subtitle: 'Falls within 6 months in older adults in hostel care',
  question: 'For an older adult in assisted living, what is the risk of falling in the next 6 months?',
  inputs: [
    { id: 'balance', type: 'choice', label: 'Balance', ee: 'balance', default: 4, options: ['Not capable', 'Poor', 'Poor to fair', 'Fair', 'Good'].map(label => ({ label })) },
    { id: 'smmse', type: 'choice', label: 'Standardized Mini-Mental State Examination', ee: 'smms', default: 2, options: ['0 to 17', '18 to 23', '24 to 30'].map(label => ({ label })) },
    { id: 'illness', type: 'choice', label: 'Illness severity', ee: 'severity', default: 2, options: ['Moderate or severe', 'Mild', 'No symptoms'].map(label => ({ label })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'age', default: 2, options: ['95 or older', '80 to 94', '65 to 79'].map(label => ({ label: `${label} years` })) },
    { id: 'incontinence', type: 'check', label: 'Incontinence', ee: 'incontinence' }
  ],
  compute(a) {
    const s = [3.82, 2.26, 1.64, 1.37, 1][a.balance] * [1.65, 1.33, 1][a.smmse] * [3.08, 2.17, 1][a.illness] * [1.78, 1.13, 1][a.age] * (a.incontinence ? 1.26 : 1);
    return s < 3 ? { level: 1, headline: 'Low risk: 15% fall risk in 6 months' } : s < 7 ? { level: 2, headline: 'Moderate risk: 30% fall risk in 6 months' } : { level: 4, headline: 'High risk: 60% fall risk in 6 months' };
  }
};
