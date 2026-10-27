// Edinburgh Dysphagia Score: esophageal cancer in referred dysphagia (Rhatigan 2010; EE+ 432).
module.exports = {
  id: 'edinburgh-dysphagia',
  eeId: 432,
  title: 'Esophageal cancer risk with dysphagia (Edinburgh)',
  subtitle: 'Esophageal cancer in patients referred with dysphagia',
  question: 'For a patient referred for evaluation of dysphagia, what is the risk of esophageal cancer?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [['Under 40', 0], ['40 to 49', 4], ['50 to 59', 5], ['60 to 69', 6], ['70 to 79', 7], ['80 to 89', 8], ['90 to 99', 9]].map(([label, points]) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'weight', type: 'check', label: 'Weight loss over 3 kg (6.6 lb)', points: 2, ee: 'WEIGHT_LOSS' },
    { id: 'duration', type: 'check', label: 'Symptoms for 6 months or more', points: -1.5, ee: 'DURATION' },
    { id: 'female', type: 'check', label: 'Female', points: -1, ee: 'FEMALE' },
    { id: 'neck', type: 'check', label: 'Dysphagia localized to the neck', points: -2, ee: 'LOCALIZED' },
    { id: 'reflux', type: 'check', label: 'Acid reflux', points: -1, ee: 'REFLUX' }
  ],
  points: { label: 'Score' },
  compute(a) {
    return require('../lib').pointsOf(module.exports, a) >= 3.5 ? { level: 3, headline: 'High risk: 65 of 378 (17%) had esophageal cancer' } : { level: 1, headline: 'Low risk: 1 of 196 (0.5%) had esophageal cancer' };
  }
};
