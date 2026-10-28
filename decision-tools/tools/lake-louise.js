// Lake Louise acute mountain sickness score (as used in Meier 2017; EE+ 596).
const SEV = ['No symptoms', 'Mild', 'Moderate', 'Severe'].map((label, points) => ({ label, points }));
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'lake-louise',
  eeId: 596,
  title: 'Acute mountain sickness: Lake Louise Score',
  subtitle: 'Severity of acute mountain sickness',
  question: 'For a patient with suspected acute mountain sickness, how severe are the symptoms?',
  inputs: [
    { id: 'headache', type: 'choice', label: 'Headache', ee: 'ddl1', options: SEV },
    { id: 'gi', type: 'choice', label: 'Gastrointestinal symptoms', ee: 'ddl2', options: SEV },
    { id: 'dizzy', type: 'choice', label: 'Dizzy, lightheaded, or both', ee: 'ddl3', options: SEV },
    { id: 'fatigue', type: 'choice', label: 'Fatigue, weakness, or both', ee: 'ddl4', options: SEV },
    { id: 'sleep', type: 'choice', label: 'Difficulty sleeping', ee: 'ddl5', options: SEV },
    { id: 'resp', type: 'choice', label: 'Respiratory symptoms', ee: 'ddl6', options: SEV }
  ],
  points: { label: 'Lake Louise score', max: 18 },
  compute(a) {
    return pointsOf(tool, a) >= 5 ? { level: 3, headline: 'Symptoms consistent with moderate to severe acute mountain sickness' } : { level: 1, headline: 'Symptoms consistent with mild acute mountain sickness' };
  }
};
