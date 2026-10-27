// Warfarin initiation in older inpatients (Siguret 2005; EE+ 316).
module.exports = {
  id: 'warfarin-siguret',
  eeId: 316,
  title: 'Warfarin initiation in older adults (Siguret)',
  subtitle: 'Maintenance warfarin dose for patients over 70',
  question: 'For a patient over 70 given 4 mg of warfarin on days 1 to 3, what daily dose does the day 4 INR predict?',
  inputs: [
    { type: 'text', text: 'Give 4 mg of warfarin on days 1 to 3, and check the INR on day 4. Not for patients with a pretreatment INR above 1.3 or who took warfarin in the previous week.' },
    { id: 'inr', type: 'choice', label: 'Day 4 INR', ee: 'IDC_COMBOBOX_1', options: ['Under 1.3', '1.3 to 1.49', '1.5 to 1.69', '1.7 to 1.89', '1.9 to 2.49', '2.5 or more'].map(label => ({ label })) }
  ],
  compute(a) {
    const dose = 5 - a.inr;
    return dose > 0 ? { headline: `Predicted daily dose: ${dose} mg` } : { headline: 'Measure the INR daily and omit doses until it is below 2.5, then give 1 mg daily' };
  }
};
