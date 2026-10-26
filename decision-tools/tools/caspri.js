// CASPRI: outcome after initial survival of in-hospital cardiac arrest (Chan 2012; EE+ 478).
const { pointsOf } = require('../lib');
const BANDS = [[5, '83% (95% CI 79 to 87)'], [10, '67% (95% CI 64 to 70)'], [15, '42% (95% CI 40 to 44)'], [20, '23% (95% CI 22 to 24)'],
  [25, '12% (95% CI 11 to 13)'], [30, '5.2% (95% CI 4 to 6)'], [35, '2.1% (95% CI 1 to 3)'], [Infinity, '0% (95% CI 0 to 2)']];

const tool = module.exports = {
  id: 'caspri',
  eeId: 478,
  title: 'CASPRI score',
  subtitle: 'Favorable neurologic survival after in-hospital cardiac arrest',
  question: 'For a patient who survives the initial resuscitation after in-hospital cardiac arrest, how likely is survival to discharge without severe disability?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [
      { label: 'Under 50', points: 0 }, { label: '50 to 59', points: 0 }, { label: '60 to 69', points: 1 }, { label: '70 to 79', points: 2 }, { label: '80 or older', points: 4 }] },
    { id: 'rhythm', type: 'choice', label: 'Initial arrest rhythm', ee: 'RYTHM', options: [
      { label: 'VF/VT, defibrillated within 2 minutes', points: 0 }, { label: 'VF/VT, defibrillated at 3 minutes', points: 0 },
      { label: 'VF/VT, defibrillated at 4 to 5 minutes', points: 2 }, { label: 'VF/VT, defibrillated after more than 5 minutes', points: 3 },
      { label: 'Pulseless electrical activity', points: 6 }, { label: 'Asystole', points: 7 }] },
    { id: 'neuro', type: 'choice', label: 'Neurologic status before the arrest', ee: 'NEURO', options: [
      { label: 'CPC 1: no major disability', points: 0 }, { label: 'CPC 2: moderate disability', points: 2 },
      { label: 'CPC 3: severe disability', points: 9 }, { label: 'CPC 4 or 5: coma, vegetative state or brain death', points: 9 }] },
    { id: 'location', type: 'choice', label: 'Location of arrest', ee: 'LOCATION', options: [
      { label: 'Telemetry unit', points: 0 }, { label: 'Intensive care unit', points: 1 }, { label: 'Unmonitored unit', points: 3 }] },
    { id: 'duration', type: 'choice', label: 'Duration of resuscitation', ee: 'DURATION', options: [
      { label: 'Under 2 minutes', points: 0 }, { label: '2 to 4 minutes', points: 0 }, { label: '5 to 9 minutes', points: 3 }, { label: '10 to 14 minutes', points: 5 },
      { label: '15 to 19 minutes', points: 6 }, { label: '20 to 24 minutes', points: 6 }, { label: '25 to 29 minutes', points: 6 }, { label: '30 minutes or more', points: 8 }] },
    { type: 'heading', label: 'Before the arrest: check all that apply' },
    { id: 'vent', type: 'check', label: 'Mechanical ventilation', points: 3, ee: 'VENT' },
    { id: 'renal', type: 'check', label: 'Renal insufficiency', points: 2, ee: 'RENAL' },
    { id: 'hepatic', type: 'check', label: 'Hepatic insufficiency', points: 4, ee: 'HEPATIC' },
    { id: 'sepsis', type: 'check', label: 'Sepsis', points: 3, ee: 'SEPSIS' },
    { id: 'cancer', type: 'check', label: 'Malignant disease', points: 4, ee: 'MALIGNANT' },
    { id: 'hypotension', type: 'check', label: 'Hypotension', points: 3, ee: 'HYPOTENSION' }
  ],
  points: { label: 'CASPRI score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `Survival to discharge with no more than moderate disability: ${BANDS.find(([max]) => s < max)[1]}` };
  }
};
