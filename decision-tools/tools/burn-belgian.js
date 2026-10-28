// Belgian Outcome in Burn Injury score (2009; EE+ 421).
const M = ['0.1', '1.5', '5', '10', '20', '30', '50', '75', '85', '95', '99'];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'burn-belgian',
  eeId: 421,
  title: 'Burn injury prognosis (Belgian)',
  subtitle: 'Mortality in hospitalized burn patients',
  question: 'For an adult or child hospitalized with burns, what is the risk of death?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: ['Under 50', '50 to 64', '65 to 79', '80 or older'].map((label, points) => ({ label: `${label} years`, points })) },
    { id: 'bsa', type: 'choice', label: 'Burned surface area', ee: 'CMB_BSA', options: ['Under 20%', '20% to 39%', '40% to 59%', '60% to 79%', '80% or more'].map((label, points) => ({ label, points })) },
    { id: 'inhal', type: 'check', label: 'Inhalation injury', points: 3, ee: 'CHK_Inhal' }
  ],
  points: { label: 'Points', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a), m = M[s];
    return { level: s <= 2 ? 1 : s <= 4 ? 2 : s <= 6 ? 3 : 4, headline: `${m}% mortality` };
  }
};
