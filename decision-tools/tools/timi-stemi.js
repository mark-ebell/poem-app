// TIMI risk score for ST-elevation MI (Morrow, NRMI 3; EE+ 152).
const P = [['2.1%', '0.7%'], ['3.5%', '0.9%'], ['6.8%', '2.2%'], ['10%', '3.7%'], ['14%', '5.7%'], ['19%', '10%'], ['22%', '15%'], ['24%', '18%'], ['25%', '23%'], ['29%', '35%']];

module.exports = {
  id: 'timi-stemi',
  eeId: 152,
  title: 'TIMI risk score for STEMI',
  subtitle: 'In-hospital mortality in ST-elevation MI',
  question: 'For a patient with ST-elevation MI, what is the risk of in-hospital death?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '75 or older', points: 3 }, { label: '65 to 74', points: 2 }, { label: 'Under 65', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 100 mm Hg', points: 3, ee: 'SBP' },
    { id: 'hr', type: 'check', label: 'Heart rate above 100 beats/min', points: 2, ee: 'RATE' },
    { id: 'killip', type: 'check', label: 'Killip class II to IV', points: 2, ee: 'KILIP',
      note: 'Killip class II: rales or S3; III: pulmonary edema; IV: cardiogenic shock.' },
    { id: 'history', type: 'check', label: 'History of hypertension, diabetes or angina', points: 1, ee: 'HISTORY' },
    { id: 'weight', type: 'check', label: 'Weight below 67 kg (147 lb)', points: 1, ee: 'WEIGHT' },
    { id: 'anterior', type: 'check', label: 'Anterior ST elevation or LBBB', points: 1, ee: 'LBBB' },
    { id: 'time', type: 'check', label: 'Time to reperfusion more than 4 hours', points: 1, ee: 'TIME' }
  ],
  points: { label: 'TIMI score', max: 14 },
  compute(a) {
    const s = [3, 2, 0][a.age] + 3 * a.sbp + 2 * a.hr + 2 * a.killip + a.history + a.weight + a.anterior + a.time;
    const p = P[Math.min(s, 9)];
    return { level: s <= 2 ? 1 : s <= 4 ? 2 : s <= 7 ? 3 : 4, lines: [{ label: 'In-hospital mortality with revascularization', value: p[1] }, { label: 'In-hospital mortality without revascularization', value: p[0] }] };
  }
};
