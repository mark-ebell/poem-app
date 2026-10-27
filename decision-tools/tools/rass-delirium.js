// Richmond Agitation-Sedation Scale as a delirium screen in older ED patients (Han 2015; EE+ 531).
const LEVELS = [['−5', 'Unarousable (no response to voice or physical stimulation)'], ['−4', 'Arousable to pain only (no response to voice; responds to physical stimulation)'],
  ['−3', 'Severely drowsy (responds to voice, but no eye contact)'], ['−2', 'Moderately drowsy (responds to voice; eye contact under 10 seconds)'],
  ['−1', 'Slightly drowsy (responds to voice; eye contact over 10 seconds)'], ['0', 'Alert and calm'], ['+1', 'Restless (anxious, but movements not aggressive)'],
  ['+2', 'Agitated (frequent, non-purposeful movement)'], ['+3', 'Very agitated (pulls or removes tubes or catheters; aggressive)'], ['+4', 'Combative (overtly combative or violent; danger to staff)']];

module.exports = {
  id: 'rass-delirium',
  eeId: 531,
  title: 'Richmond Agitation-Sedation Scale (RASS)',
  subtitle: 'RASS as a delirium screen in older ED patients',
  question: 'For an older patient in the ED, which best describes their mental status, and how likely is delirium?',
  inputs: [
    { id: 'rass', type: 'choice', label: 'Mental status', default: 5, ee: 'STIMULATION', options: LEVELS.map(([v, d]) => ({ label: `${v}: ${d}` })) }
  ],
  footnote: 'A RASS other than 0 is 82% sensitive and 85% specific for delirium (LR+ 5.5, LR− 0.2).',
  compute(a) {
    const v = a.rass - 5;
    return v === 0 ? { level: 1, headline: 'Low risk for delirium' }
      : { level: 4, headline: 'High risk for delirium', lines: [v < -1 || v > 1 ? 'A score below −1 or above +1 means very high risk for delirium (LR+ 57).' : 'Scores below −1 or above +1 carry very high risk (LR+ 57).'] };
  }
};
