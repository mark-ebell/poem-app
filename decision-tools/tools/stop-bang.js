// STOP-Bang obstructive sleep apnea screen (Chung 2008; risk groups Chung 2012). Not an EE+ tool: added
// in place of the Flemons sleep apnea score (EE+ 238) at Mark Ebell's request (2026-10-28), flagged for his review.
const { count } = require('../lib');
const ITEMS = ['snore', 'tired', 'observed', 'pressure', 'bmi', 'age', 'neck', 'male'];
module.exports = {
  id: 'stop-bang',
  categories: ['Respiratory disease: Other'],
  title: 'Sleep apnea screening (STOP-Bang)',
  subtitle: 'Screening for obstructive sleep apnea',
  question: 'For an adult, what is the risk of moderate to severe obstructive sleep apnea?',
  inputs: [
    { id: 'snore', type: 'check', label: 'Snoring: loud snoring (louder than talking, or heard through a closed door)' },
    { id: 'tired', type: 'check', label: 'Tired: often tired, fatigued or sleepy during the day' },
    { id: 'observed', type: 'check', label: 'Observed: someone has seen you stop breathing, or choking or gasping, during sleep' },
    { id: 'pressure', type: 'check', label: 'Pressure: high blood pressure, or being treated for it' },
    { id: 'bmi', type: 'check', label: 'BMI over 35 kg/m²' },
    { id: 'age', type: 'check', label: 'Age over 50 years' },
    { id: 'neck', type: 'check', label: 'Neck circumference over 40 cm (16 inches)' },
    { id: 'male', type: 'check', label: 'Male' }
  ],
  footnote: 'Low risk 0 to 2; intermediate risk 3 to 4; high risk 5 to 8. A score of 3 or more was 84% sensitive for any OSA (AHI over 5), 93% for moderate to severe OSA (AHI over 15) and 100% for severe OSA (AHI over 30) in the 2008 study.',
  compute(a) {
    const n = count(a, ITEMS);
    const score = { value: n, max: 8, label: 'STOP-Bang' };
    return n <= 2 ? { score, level: 1, headline: 'Low risk of moderate to severe obstructive sleep apnea' }
      : n <= 4 ? { score, level: 2, headline: 'Intermediate risk of moderate to severe obstructive sleep apnea' }
      : { score, level: 4, headline: 'High risk of moderate to severe obstructive sleep apnea' };
  },
  evidence: {
    reference: 'Chung F, Yegneswaran B, Liao P, et al. STOP questionnaire: a tool to screen patients for obstructive sleep apnea. Anesthesiology. 2008;108(5):812-21. Risk groups: Chung F, Subramanyam R, Liao P, et al. High STOP-Bang score indicates a high probability of obstructive sleep apnoea. Br J Anaesth. 2012;108(5):768-75.',
    pmid: '18431116',
    population: 'Adult surgical patients at preoperative clinics, compared with overnight polysomnography; the 2012 study included 746 patients.',
    validation: 'In the 2012 study the probability of moderate to severe OSA rose from 0.36 at a score of 3 to 0.60 at 7 or 8.',
    prevalence: null, developed: null, validated: 746,
    comment: 'Replaces the Flemons sleep apnea clinical score (EE+ 238).'
  }
};
