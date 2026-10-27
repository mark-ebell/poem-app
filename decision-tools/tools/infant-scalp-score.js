// Infant Scalp Score: TBI in infants with an isolated scalp hematoma (Schutzman 2021; EE+ 629). EE+ added
// a stray point to every score; here the points are as published (0 to 8).
const { pointsOf } = require('../lib');
const OUT = [['0', '0'], ['0', '0'], ['0', '0'], ['0', '0'], ['3 of 87 (3.2%)', '0'], ['8 of 99 (8.0%)', '2 of 99 (2.0%)'], ['20 of 84 (24%)', '3 of 84 (3.6%)'], ['18 of 64 (28%)', '4 of 64 (6.3%)'], ['10 of 22 (45%)', '3 of 22 (14%)']];

const tool = module.exports = {
  id: 'infant-scalp-score',
  eeId: 629,
  title: 'Infant Scalp Score',
  subtitle: 'Traumatic brain injury in infants with an isolated scalp hematoma',
  question: 'For an infant under 1 year with an isolated scalp hematoma, how likely is a traumatic brain injury on CT?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: '6 to 12 months', points: 0 }, { label: '3 to under 6 months', points: 1 }, { label: 'Under 3 months', points: 2 }] },
    { id: 'size', type: 'choice', label: 'Hematoma size', ee: 'ddl2', options: [{ label: 'None', points: 0 }, { label: 'Small (under 1 cm)', points: 1 }, { label: 'Medium (1 to 3 cm)', points: 2 }, { label: 'Large (over 3 cm)', points: 3 }] },
    { id: 'location', type: 'choice', label: 'Hematoma location', ee: 'ddl3', options: [{ label: 'Frontal', points: 0 }, { label: 'Occipital', points: 1 }, { label: 'Temporal or parietal', points: 2 }] }
  ],
  points: { label: 'Infant Scalp Score', max: 8 },
  compute(a) {
    const [tbi, citbi] = OUT[pointsOf(tool, a)];
    return { headline: `TBI on CT: ${tbi}`, lines: [`Clinically important TBI: ${citbi}`] };
  }
};
