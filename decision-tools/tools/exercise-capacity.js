// Predicted exercise capacity by age and sex (EE+ 322).
module.exports = {
  id: 'exercise-capacity',
  eeId: 322,
  title: 'Exercise capacity by age',
  subtitle: 'Predicted exercise capacity in METs',
  question: 'What exercise capacity (METs) is expected for a given age and sex?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'EDIT_Age' },
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'COMBO_Gender', options: [{ label: 'Male' }, { label: 'Female' }] }
  ],
  compute(a) {
    return { headline: `Predicted exercise capacity: ${(Math.round((14.7 - (a.sex === 0 ? 0.11 : 0.13) * a.age) * 10) / 10).toFixed(1)} METs` };
  }
};
