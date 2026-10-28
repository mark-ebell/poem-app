// Surgical Apgar score, 8-country validation (Haynes 2011; EE+ 509). EE+ 424 (Gawande 2007) was retired as a duplicate.
const OUT = { 4: ['32.9', '7.9', '13.3', '9.6'], 5: ['20.5', '3.4', '10.5', '3.7'], 6: ['12.2', '1.9', '6.0', '1.3'], 7: ['9.1', '1.1', '4.8', '0.6'], 8: ['4.8', '0.5', '2.9', '0.5'], 9: ['4.0', '0.5', '1.8', '0.4'], 10: ['3.0', '0.5', '0.7', '0.0'] };
module.exports = {
  id: 'surgical-apgar-global',
  eeId: 509,
  title: 'Surgical Apgar Score',
  subtitle: 'Complications and death after surgery',
  question: 'Using the estimated blood loss and the lowest mean arterial pressure and heart rate during surgery, what are the risks after surgery?',
  inputs: [
    { id: 'ebl', type: 'choice', label: 'Estimated blood loss', ee: 'BL', default: 3, options: ['Over 1000 mL', '601 to 1000 mL', '101 to 600 mL', '100 mL or less'].map((label, points) => ({ label, points })) },
    { id: 'map', type: 'choice', label: 'Lowest mean arterial pressure', ee: 'MAP', default: 3, options: ['Under 40 mm Hg', '40 to 54 mm Hg', '55 to 69 mm Hg', '70 mm Hg or more'].map((label, points) => ({ label, points })) },
    { id: 'hr', type: 'choice', label: 'Lowest heart rate', ee: 'HR', default: 4, options: ['Over 85/min', '76 to 85/min', '66 to 75/min', '56 to 65/min', '55/min or less'].map((label, points) => ({ label, points })) },
    { id: 'brady', type: 'check', label: 'Pathologic bradyarrhythmia (sinus arrest, AV block or dissociation, junctional or ventricular escape rhythm, asystole)', ee: 'BRADY', note: 'Scores 0 points for heart rate.' }
  ],
  compute(a) {
    const s = a.ebl + a.map + (a.brady ? 0 : a.hr), [c, m, ssi, v] = OUT[Math.max(4, s)];
    return { score: { value: s, max: 10, label: 'Surgical Apgar score' }, level: s <= 4 ? 4 : s <= 6 ? 3 : s <= 8 ? 2 : 1, headline: `${c}% complications, ${m}% mortality`, lines: [{ label: 'Surgical site infection', value: `${ssi}%` }, { label: 'Ventilator over 48 hours', value: `${v}%` }] };
  }
};
