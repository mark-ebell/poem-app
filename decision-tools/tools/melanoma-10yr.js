// 10-year survival in clinical stage I melanoma (EE+ 37). EE+ rounded the probability up; here it is rounded.
module.exports = {
  id: 'melanoma-10yr',
  eeId: 37,
  title: 'Melanoma 10-year prognosis',
  subtitle: 'Survival 10 years after diagnosis of melanoma',
  question: 'For a patient with localized melanoma, what is the chance of being alive 10 years after diagnosis?',
  inputs: [
    { id: 'thickness', type: 'choice', label: 'Lesion thickness', ee: 'LESION', options: [{ label: 'Under 0.76 mm' }, { label: '0.76 to 1.69 mm' }, { label: '1.7 to 3.6 mm' }, { label: 'Over 3.6 mm' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' },
    { id: 'extremity', type: 'check', label: 'Primary lesion on an extremity', ee: 'PRIMARY' },
    { id: 'age', type: 'check', label: 'Age 60 or younger at diagnosis', ee: 'AGE' }
  ],
  compute(a) {
    const x = [3.93, 2.25, 1.07, 0][a.thickness] + 1.47 * a.extremity + 0.71 * a.female + 1.1 * a.age - 2.245;
    return { headline: `Probability of being alive 10 years after diagnosis: ${Math.round(100 / (1 + Math.exp(-x)))}%` };
  }
};
