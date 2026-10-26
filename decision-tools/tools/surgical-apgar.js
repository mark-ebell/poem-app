// Surgical Apgar score (Gawande 2007; validation Regenbogen 2009; EE+ 424).
const BANDS = [[2, '75%', '44%'], [4, '54%', '16%'], [6, '28%', '5%'], [8, '13%', '2%'], [10, '5%', '0.1%']];

module.exports = {
  id: 'surgical-apgar',
  eeId: 424,
  title: 'Surgical Apgar score',
  subtitle: '30-day complications and death after general or vascular surgery',
  question: 'At the end of general or vascular surgery, what are the risks of a major complication and of death within 30 days?',
  inputs: [
    { id: 'blood', type: 'choice', label: 'Estimated blood loss', ee: 'CMB_BloodLoss', default: 3, options: [
      { label: 'Over 1000 mL', points: 0 }, { label: '601 to 1000 mL', points: 1 }, { label: '101 to 600 mL', points: 2 }, { label: '100 mL or less', points: 3 }] },
    { id: 'map', type: 'choice', label: 'Lowest mean arterial pressure', ee: 'CMB_MAP', default: 3, options: [
      { label: 'Under 40 mm Hg', points: 0 }, { label: '40 to 54', points: 1 }, { label: '55 to 69', points: 2 }, { label: '70 or more', points: 3 }] },
    { id: 'hr', type: 'choice', label: 'Lowest heart rate', ee: 'CMB_HR', default: 4, options: [
      { label: 'Over 85/min', points: 0 }, { label: '76 to 85', points: 1 }, { label: '66 to 75', points: 2 }, { label: '56 to 65', points: 3 }, { label: '55 or less', points: 4 }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'brady', type: 'check', label: 'Pathologic bradyarrhythmia (sinus arrest, AV block or dissociation, junctional or ventricular escape rhythm, or asystole)', ee: 'CHK_Brady',
      note: 'A bradyarrhythmia scores 0 points for the lowest heart rate.' }
  ],
  compute(a) {
    const s = a.blood + a.map + (a.brady ? 0 : a.hr);
    const [, comp, death] = BANDS.find(([max]) => s <= max);
    return {
      score: { value: s, max: 10, label: 'Surgical Apgar score' },
      headline: `30-day major complications ${comp}; mortality ${death}`
    };
  }
};
