// Predicted peak expiratory flow (adults: Gregg and Nunn 1973; children: Iowa Family Practice Handbook; EE+ 204).
module.exports = {
  id: 'peak-flow',
  eeId: 204,
  title: 'Peak flow - normal values',
  subtitle: 'Predicted peak expiratory flow',
  question: 'What is the predicted normal peak expiratory flow?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 3, max: 100, ee: 'AGE' },
    { id: 'units', type: 'choice', label: 'Height units', ee: 'UNITS', options: [{ label: 'Inches' }, { label: 'Centimeters' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'inches', min: 30, max: 90, ee: 'HEIGHT', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 76, max: 230, ee: 'HEIGHT', when: a => a.units === 1 },
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'GENDER', options: [{ label: 'Male' }, { label: 'Female' }] }
  ],
  footnote: 'Age 14 and over: Gregg and Nunn equations for adults who had never smoked. Under 14: 147 + 13.3 × (height in inches − 43), with height limited to 43 to 67 inches.',
  compute(a) {
    let h = a.units === 1 ? a.heightCm / 2.54 : a.heightIn;
    let pef;
    if (a.age >= 14) {
      pef = a.sex === 1 ? 198.07 + 3.07 * a.age - 0.0477 * a.age * a.age + 3.6 * h
        : -30.15 + 30.63 * a.age - 0.723 * a.age * a.age + 0.00521 * Math.pow(a.age, 3) + 3.71 * h;
    } else {
      h = Math.min(67, Math.max(43, h));
      pef = 147 + (h - 43) * 13.3;
    }
    return { headline: `Normal peak flow ${Math.round(pef)} L/min`, lines: [{ label: '80% of predicted', value: `${Math.round(pef * 0.8)} L/min` }] };
  }
};
