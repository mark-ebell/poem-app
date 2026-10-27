// Advanced colorectal neoplasia at screening colonoscopy (Schroy 2015; EE+ 533).
module.exports = {
  id: 'advanced-neoplasia',
  eeId: 533,
  title: 'Colorectal cancer: risk of advanced neoplasia',
  subtitle: 'Advanced neoplasia at screening colonoscopy',
  question: 'For a patient having screening colonoscopy, what is the risk of advanced colorectal neoplasia?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', options: [{ label: '50 to 59' }, { label: '60 to 69' }, { label: '70 to 79' }] },
    { id: 'group', type: 'choice', label: 'Race and sex', ee: 'cboRace', options: [{ label: 'White man' }, { label: 'Black man' }, { label: 'All others' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'smoking', type: 'check', label: 'Smoked for 20 years or more', ee: 'SMOKING' },
    { id: 'alcohol', type: 'check', label: '2 or more alcoholic drinks a day', ee: 'ALOCHOL' },
    { id: 'tall', type: 'check', label: 'Taller than 1.78 m (70 in) for men or 1.70 m (67 in) for women', ee: 'HEIGHT' }
  ],
  compute(a) {
    const s = 3 * a.smoking + 2 * a.alcohol + a.tall + a.age + 1 + (2 - a.group);
    return { score: { value: s, max: 11, label: 'Risk score' }, level: s <= 2 ? 1 : s <= 5 ? 2 : 3,
      headline: s <= 2 ? 'Low risk for advanced colorectal neoplasia (3.2%)' : s <= 5 ? 'Intermediate risk for advanced colorectal neoplasia (6.0%)' : 'High risk for advanced colorectal neoplasia (15.4%)' };
  }
};
