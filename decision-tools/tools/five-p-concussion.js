// 5P score: persistent post-concussion symptoms in children (Zemek 2016; EE+ 546).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'five-p-concussion',
  eeId: 546,
  title: 'Persistent post-concussion symptoms in children (5P)',
  subtitle: 'Post-concussion syndrome at 28 days in children',
  question: 'For a child 5 to 17 seen in the ED within 48 hours of a head injury, what is the risk of post-concussion syndrome at 28 days?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: '5 to 7', points: 0 }, { label: '8 to 12', points: 1 }, { label: '13 to 17', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', points: 2, ee: 'cb1' },
    { id: 'prior', type: 'check', label: 'Prior concussion with symptoms lasting more than 1 week', points: 1, ee: 'cb2' },
    { id: 'migraine', type: 'check', label: 'Physician-diagnosed migraine', points: 1, ee: 'cb3' },
    { id: 'slow', type: 'check', label: 'Answers questions slowly', points: 1, ee: 'cb4' },
    { id: 'bess', type: 'check', label: 'Balance Error Scoring System tandem stance: 4 or more errors, or unable to do the test', points: 1, ee: 'cb5' },
    { id: 'headache', type: 'check', label: 'Headache', points: 1, ee: 'cb6' },
    { id: 'noise', type: 'check', label: 'Sensitivity to noise', points: 1, ee: 'cb7' },
    { id: 'fatigue', type: 'check', label: 'Fatigue', points: 2, ee: 'cb8' }
  ],
  points: { label: '5P score', max: 12 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 3 ? { level: 1, headline: 'Low risk: 15% had post-concussion syndrome at 28 days (95% CI 10% to 22%)' }
      : s <= 8 ? { level: 2, headline: 'Medium risk: 32% had post-concussion syndrome at 28 days (95% CI 29% to 36%)' }
      : { level: 4, headline: 'High risk: 60% had post-concussion syndrome at 28 days (95% CI 50% to 69%)' };
  }
};
