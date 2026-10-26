// ADHERE classification tree: in-hospital mortality in acutely decompensated heart failure (Fonarow; EE+ 307).
module.exports = {
  id: 'adhere-hf',
  eeId: 307,
  title: 'Heart failure in-hospital mortality (ADHERE, Fonarow)',
  subtitle: 'Acutely decompensated heart failure',
  question: 'For a patient admitted with acutely decompensated heart failure, what is the risk of in-hospital death?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bun', type: 'check', label: 'BUN 43 mg/dL (15.4 mmol/L) or higher', ee: 'bun' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 115 mm Hg', ee: 'bp' },
    { id: 'creat', type: 'check', label: 'Serum creatinine 2.75 mg/dL (243 µmol/L) or higher', ee: 'creat' }
  ],
  compute(a) {
    const r = a.bun ? (a.sbp ? (a.creat ? [4, 'Very high risk', '22%'] : [3, 'High risk', '12.4%']) : [2, 'Moderate risk', '6.4%'])
      : a.sbp ? [2, 'Moderate risk', '5.5%'] : [1, 'Low risk', '2.1%'];
    return { level: r[0], headline: r[1], lines: [{ label: 'In-hospital mortality', value: r[2] }] };
  }
};
