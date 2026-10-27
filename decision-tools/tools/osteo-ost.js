// Osteoporosis Self-assessment Tool (OST; EE+ 263).
module.exports = {
  id: 'osteo-ost',
  eeId: 263,
  title: 'Osteoporosis screening (OST)',
  subtitle: 'Osteoporosis Self-assessment Tool for postmenopausal women',
  question: 'For a postmenopausal woman, what is the risk of osteoporosis from age and weight?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 40, max: 110, step: 1, ee: 'EDIT_Age' },
    { id: 'units', type: 'choice', label: 'Weight units', ee: 'COMBO_Units', options: [{ label: 'Pounds' }, { label: 'Kilograms' }] },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 60, max: 450, step: 1, ee: 'EDIT_Weight', when: a => a.units === 0 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 27, max: 205, step: 1, ee: 'EDIT_Weight', when: a => a.units === 1 }
  ],
  footnote: 'Osteoporosis is a T-score of −2.5 or below. The OST score is 0.2 × (weight in kg − age in years).',
  compute(a) {
    const s = 0.2 * ((a.units === 0 ? a.weightLb / 2.2 : a.weightKg) - a.age);
    const [level, label, hip, neck, spine, any] = s > 1 ? [1, 'Low risk', '1.4%', '6%', '12.6%', '16.1%'] : s >= -3 ? [2, 'Moderate risk', '10.6%', '22.2%', '28.6%', '31%'] : [4, 'High risk', '43.7%', '59.9%', '51.6%', '74.2%'];
    return { score: { value: Number(s.toFixed(1)), label: 'OST score' }, level, headline: label,
      table: { head: ['Osteoporosis at', 'Likelihood'], rows: [['Hip', hip], ['Femoral neck', neck], ['L2–L4', spine], ['Any site', any]] } };
  }
};
