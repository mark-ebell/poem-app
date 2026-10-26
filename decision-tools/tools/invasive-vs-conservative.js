// Invasive vs conservative management of unstable angina / non-Q-wave MI (Solomon; EE+ 161).
const R = [ // [max score, risk group, 42-day conservative, invasive, 1-year conservative, invasive, level]
  [2, 'Very low risk; invasive no better', '3%', '5%', '6%', '7%', 1], [4, 'Low risk; invasive no better', '5%', '7%', '9%', '9%', 1],
  [6, 'Moderate risk; invasive no better', '8%', '6%', '13%', '10%', 2], [8, 'High risk; invasive better', '18%', '12%', '24%', '21%', 3],
  [10, 'Very high risk; invasive better', '24%', '13%', '28%', '16%', 4]];

module.exports = {
  id: 'invasive-vs-conservative',
  eeId: 161,
  title: 'Invasive vs conservative management in unstable angina',
  subtitle: 'Which patients benefit from early catheterization (Solomon)',
  question: 'In unstable angina or non-Q-wave MI, which patients do better with an early invasive strategy?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: 'Under 50', points: 0 }, { label: '50 to 59', points: 1 }, { label: '60 to 69', points: 3 }, { label: '70 or older', points: 5 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'st', type: 'check', label: 'ST-segment depression of 0.1 mV or more in at least 2 contiguous leads', points: 2, ee: 'IDC_CHECKBOX_1' },
    { id: 'accelerated', type: 'check', label: 'Accelerated angina in the prior 2 months', points: 2, ee: 'IDC_CHECKBOX_2' },
    { id: 'ckmb', type: 'check', label: 'CK-MB above 5 IU/mL', points: 1, ee: 'IDC_CHECKBOX_3' }
  ],
  points: { label: 'Score', max: 10 },
  footnote: 'Invasive treatment is early catheterization followed by PTCA or CABG if indicated. It was only beneficial in high or very high risk patients.',
  compute(a) {
    const s = [0, 1, 3, 5][a.age] + 2 * a.st + 2 * a.accelerated + a.ckmb;
    const r = R.find(([max]) => s <= max);
    return { level: r[6], headline: r[1],
      table: { head: ['Death or MI', 'Conservative', 'Invasive'], rows: [['42 days', r[2], r[3]], ['1 year', r[4], r[5]]] } };
  }
};
