// Michigan score: in-hospital mortality after percutaneous coronary intervention (Moscucci; EE+ 352).
const RISK = { 3: '1.2%', 3.5: '2%', 4: '4%', 4.5: '6%', 5: '9.5%', 5.5: '14%', 6: '20%', 6.5: '29.5%', 7: '39%', 7.5: '52%', 8: '63.5%', 8.5: '74.5%' };
const ITEMS = [['ami', 'Acute MI within 24 hours of symptom onset', 1, 'chk1'], ['shock', 'Shock (systolic BP below 90 mm Hg for 30 minutes, or pump failure, or signs of hypoperfusion)', 2.5, 'chk2'],
  ['creat', 'Creatinine above 1.5 mg/dL (114 µmol/L)', 1.5, 'chk3'], ['arrest', 'History of cardiac arrest', 1.5, 'chk4'], ['age', 'Age 70 or older', 1, 'chk5'],
  ['ef', 'Ejection fraction below 50%', 0.5, 'chk6'], ['thrombus', 'Thrombus in the treated segment', 0.5, 'chk7'],
  ['pvd', 'Peripheral vascular disease (claudication, amputation, vascular surgery or angioplasty, AAA, stroke, TIA or carotid stenosis)', 0.5, 'chk8'], ['female', 'Female sex', 0.5, 'chk9']];

module.exports = {
  id: 'michigan-pci',
  eeId: 352,
  title: 'Angioplasty mortality (Michigan score)',
  subtitle: 'In-hospital death after percutaneous coronary intervention',
  question: 'For a patient having percutaneous coronary intervention, what is the risk of in-hospital death?',
  inputs: [
    { id: 'vessels', type: 'choice', label: 'Number of vessels with 70% or more obstruction (LAD, RCA, circumflex and grafts; not branches)', ee: 'combo1',
      options: [1, 2, 3, 4].map(n => ({ label: String(n), points: n / 2 })) },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, points, ee]) => ({ id, type: 'check', label, points, ee }))
  ],
  compute(a) {
    const s = (a.vessels + 1) / 2 + ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    const risk = s <= 2.5 ? 'below 0.8%' : s >= 9 ? 'above 75%' : RISK[s];
    return { score: { value: s, label: 'Michigan score' }, level: s <= 3 ? 1 : s <= 5 ? 2 : s <= 7 ? 3 : 4, headline: `Risk of in-hospital death: ${risk}` };
  }
};
