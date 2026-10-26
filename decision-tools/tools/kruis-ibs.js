// Kruis score for irritable bowel syndrome (validation pooled in Ford 2008; EE+ 489).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'kruis-ibs',
  eeId: 489,
  title: 'Kruis score (irritable bowel syndrome)',
  subtitle: 'Irritable bowel syndrome from history, exam and simple tests',
  question: 'For a patient with abdominal pain, flatulence or a change in bowel habit, how likely is irritable bowel syndrome?',
  inputs: [
    { type: 'heading', label: 'Symptoms: check all that apply' },
    { id: 'symptoms', type: 'check', label: 'Abdominal pain, flatulence or bowel irregularity', points: 34, ee: 'PAIN1' },
    { id: 'duration', type: 'check', label: 'Symptoms for more than 2 years', points: 16, ee: 'DURATION' },
    { id: 'pain', type: 'check', label: "Pain described as burning, cutting, very strong, terrible, pressure, dull, boring or 'not so bad'", points: 23, ee: 'PAIN2' },
    { id: 'alternating', type: 'check', label: 'Alternating constipation and diarrhea', points: 14, ee: 'ALT' },
    { type: 'heading', label: 'Findings against IBS: check all that apply' },
    { id: 'other', type: 'check', label: 'History or exam pointing to another diagnosis', points: -47, ee: 'HP' },
    { id: 'esr', type: 'check', label: 'ESR above 10 mm/hour', points: -13, ee: 'ERYTHROCYTE' },
    { id: 'wbc', type: 'check', label: 'White cell count above 10,000/µL', points: -50, ee: 'LEUKOCYTOSIS' },
    { id: 'anemia', type: 'check', label: 'Hemoglobin below 12 g/dL (women) or 14 g/dL (men)', points: -98, ee: 'HEMOGLOBIN' },
    { id: 'blood', type: 'check', label: 'History of blood in the stool', points: -98, ee: 'BLOOD' }
  ],
  points: { label: 'Kruis score' },
  compute(a) {
    return pointsOf(tool, a) >= 44 ? { level: 3, headline: 'High probability of IBS (likelihood ratio 8.6)' } : { level: 1, headline: 'Low probability of IBS (likelihood ratio 0.26)' };
  }
};
