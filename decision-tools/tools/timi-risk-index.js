// TIMI risk index for ST-elevation MI (Morrow; EE+ 141).
const BANDS = [[12.5, '0.2%', '0.4%', '0.8%', 1], [17.5, '0.6%', '1.2%', '1.9%', 2], [22.5, '1.1%', '2.9%', '3.3%', 2], [30, '2.7%', '6.1%', '7.3%', 3], [Infinity, '7.0%', '13.8%', '17.4%', 4]];

module.exports = {
  id: 'timi-risk-index',
  eeId: 141,
  title: 'TIMI risk index for STEMI',
  subtitle: 'Mortality in ST-elevation MI within 6 hours of onset',
  question: 'For a patient with ST-elevation MI within 6 hours of symptom onset, what is the risk of death?',
  inputs: [
    { id: 'hr', type: 'number', label: 'Heart rate', unit: 'beats/min', min: 50, max: 150, step: 1, ee: 'RATE' },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 60, max: 200, step: 1, ee: 'SYSTOLIC' },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 120, step: 1, ee: 'AGE' }
  ],
  footnote: 'Risk index = heart rate × (age / 10)² ÷ systolic BP.',
  compute(a) {
    const s = (a.hr * (a.age / 10) ** 2) / a.sbp;
    if (s < 10.6 || s > 250) return { problems: [`The risk index (${s.toFixed(1)}) is outside the range studied (10.6 to 250); please check the values.`] };
    const b = BANDS.find(([max]) => s <= max);
    return { score: { value: Number(s.toFixed(1)), label: 'TIMI risk index' }, level: b[4],
      lines: [{ label: '24-hour mortality', value: b[1] }, { label: 'In-hospital mortality', value: b[2] }, { label: '30-day mortality', value: b[3] }] };
  }
};
