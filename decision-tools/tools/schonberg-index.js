// Schonberg index: 5- and 9-year mortality in community-dwelling adults 65 and older (Schonberg 2009; EE+ 458).
const OUT = [['2', '1 to 3', '7', '4 to 13'], ['4', '3 to 5', '8', '6 to 11'], ['6', '5 to 7', '16', '13 to 19'], ['9', '7 to 10', '26', '23 to 29'], ['13', '12 to 15', '33', '29 to 37'],
  ['23', '20 to 25', '52', '48 to 56'], ['35', '32 to 38', '58', '53 to 62'], ['43', '39 to 47', '75', '69 to 80'], ['59', '54 to 63', '83', '76 to 88'], ['69', '63 to 73', '92', '86 to 96']];
const { pointsOf } = require('../lib');
const opt = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'schonberg-index',
  eeId: 458,
  title: '5- and 9-year mortality in adults 65 and older (Schonberg index)',
  subtitle: 'Mortality in community-dwelling older adults',
  question: 'For a community-dwelling adult 65 or older, what is the risk of death within 5 and 9 years?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: opt([['65 to 69', 0], ['70 to 74', 1], ['75 to 79', 3], ['80 to 84', 5], ['85 or older', 7]]) },
    { id: 'health', type: 'choice', label: 'Self-rated health', ee: 'HEALTH', options: opt([['Excellent or very good', 0], ['Good', 1], ['Fair or poor', 2]]) },
    { id: 'walking', type: 'choice', label: 'By yourself, without special equipment, how hard is it to walk about a quarter mile (3 city blocks)?', ee: 'WALKING', options: opt([['Not at all difficult', 0], ['A little to very difficult', 3], ["Can't do it, or don't do it", 3]]) },
    { id: 'smoking', type: 'choice', label: 'Cigarettes', ee: 'CIGARETTE', options: opt([['Never smoked (under 100 in life)', 0], ['Former smoker', 1], ['Current smoker', 3]]) },
    { id: 'hosp', type: 'choice', label: 'Overnight hospital stays in the past 12 months', ee: 'HOSPITALIZATION', options: opt([['None', 0], ['Once', 1], ['Twice or more', 3]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 3, ee: 'MALE' },
    { id: 'bmi', type: 'check', label: 'BMI under 25 (not overweight or obese)', points: 2, ee: 'BMI' },
    { id: 'copd', type: 'check', label: 'Emphysema or chronic bronchitis', points: 2, ee: 'EMPHYSEMA' },
    { id: 'cancer', type: 'check', label: 'Cancer (not skin cancer other than melanoma)', points: 2, ee: 'CANCER' },
    { id: 'dm', type: 'check', label: 'Diabetes or borderline diabetes', points: 2, ee: 'DIABETES' },
    { id: 'help', type: 'check', label: 'Needs help with routine needs (chores, business, shopping, getting around) because of a physical, mental or emotional problem', points: 2, ee: 'NEEDHELP' }
  ],
  points: { label: 'Schonberg index', max: 32 },
  compute(a) {
    const s = pointsOf(tool, a), [m5, c5, m9, c9] = OUT[Math.min(Math.floor(s / 2), 9)];
    return { headline: `5-year mortality ${m5}% (95% CI ${c5})`, lines: [`9-year mortality ${m9}% (95% CI ${c9})`] };
  }
};
