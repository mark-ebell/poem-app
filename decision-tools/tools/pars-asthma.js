// Pediatric asthma risk score for preschool children (Pescatore 2014; EE+ 493).
const PROB = [5, 8, 11, 15, 21, 28, 36, 45, 55, 64, 72, 79, 85, 89, 92, 95];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'pars-asthma',
  eeId: 493,
  title: 'Asthma prediction in preschool children',
  subtitle: 'Asthma 5 years later in children aged 1 to 3 with wheeze or cough',
  question: 'For a child aged 1 to 3 with wheeze or cough, what is the probability of an asthma diagnosis 5 years later?',
  inputs: [
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'MALE' },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '1 year', points: 0 }, { label: '2 to 3 years', points: 1 }] },
    { id: 'wheeze', type: 'check', label: 'In the past 12 months, wheeze or whistling in the chest even without a cold or flu', points: 1, ee: 'WHEEZE' },
    { id: 'three', type: 'check', label: 'More than 3 attacks of wheeze in the last 12 months', points: 2, ee: 'THREE' },
    { id: 'daily', type: 'choice', label: "How much did wheezing interfere with the child's daily activities?", ee: 'DAILY', options: ['None', 'A little', 'A lot'].map((label, points) => ({ label, points })) },
    { id: 'sob', type: 'choice', label: 'Do these wheezing attacks cause shortness of breath?', ee: 'SOB', options: [{ label: 'Never', points: 0 }, { label: 'Sometimes', points: 2 }, { label: 'Always', points: 3 }] },
    { id: 'exercise', type: 'check', label: 'In the last 12 months, exercise (playing, running), laughing, crying or excitement caused wheezing or coughing', points: 1, ee: 'EXERCISE' },
    { id: 'dust', type: 'check', label: 'In the last 12 months, contact with dust, grass, pets or other animals caused wheezing or coughing', points: 1, ee: 'DUST' },
    { id: 'eczema', type: 'check', label: 'Has ever had eczema', points: 1, ee: 'ECZEMA' },
    { id: 'parents', type: 'choice', label: 'Have the parents ever had wheezing, asthma or bronchitis?', ee: 'PARENTS', options: ['Neither', 'Father or mother', 'Both father and mother'].map((label, points) => ({ label, points })) }
  ],
  points: { label: 'Asthma risk score', max: 15 },
  compute(a) {
    const p = PROB[pointsOf(tool, a)];
    return { level: p < 20 ? 1 : p < 40 ? 2 : p < 70 ? 3 : 4, headline: `${p}% probability of asthma in 5 years` };
  }
};
