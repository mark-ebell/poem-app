// Recurrence after unprovoked VTE in women (Rodger, "Men continue and HER DOO2"; EE+ 375).
module.exports = {
  id: 'herdoo-women',
  eeId: 375,
  title: 'VTE recurrence risk in women (HERDOO2)',
  subtitle: 'Who can stop anticoagulation after unprovoked VTE',
  question: 'For a woman with a first unprovoked DVT or PE and no known major thrombophilia, what is the annual risk of recurrence?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'skin', type: 'check', label: 'Hyperpigmentation, edema or redness of either leg', points: 1, ee: 'CHK_Hyper' },
    { id: 'ddimer', type: 'check', label: 'D-dimer 250 µg/L or higher', points: 1, ee: 'CHK_Ddimer' },
    { id: 'bmi', type: 'check', label: 'Body mass index 30 kg/m² or higher', points: 1, ee: 'CHK_BMI' },
    { id: 'age', type: 'check', label: 'Age 65 or older', points: 1, ee: 'CHK_Age' }
  ],
  points: { label: 'HERDOO2 score', max: 4 },
  compute(a) {
    return a.skin + a.ddimer + a.bmi + a.age < 2
      ? { level: 1, headline: 'Low risk', lines: ['1.6% annual recurrence risk (52% of patients were in this group).'] }
      : { level: 4, headline: 'High risk', lines: ['14.1% annual recurrence risk (48% of patients were in this group).'] };
  }
};
