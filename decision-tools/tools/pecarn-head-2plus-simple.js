// PECARN head injury rule for children 2 to 18, positive or negative (Kuppermann 2009; EE+ 461).
const { count } = require('../lib');
module.exports = {
  id: 'pecarn-head-2plus-simple',
  eeId: 461,
  title: 'Clinically important brain injury 2-18 yrs (PECARN)',
  subtitle: 'Any PECARN predictor in children 2 and older',
  question: 'For a child 2 years or older with head injury and a GCS of 14 or 15, is any PECARN predictor present?',
  inputs: [
    { id: 'mental', type: 'check', label: 'Altered mental status', ee: 'MENTAL' },
    { id: 'loc', type: 'check', label: 'Loss of consciousness', ee: 'CONSCIOUS' },
    { id: 'vomiting', type: 'check', label: 'History of vomiting', ee: 'VOMITING' },
    { id: 'mechanism', type: 'check', label: 'Severe mechanism of injury', ee: 'MECHANISMS', note: 'Motor vehicle crash with ejection, death of another passenger or rollover; pedestrian or unhelmeted bicyclist struck by a vehicle; fall over 5 feet (1.5 m); head struck by a high-impact object.' },
    { id: 'basilar', type: 'check', label: 'Clinical signs of basilar skull fracture', ee: 'FRACTURE' },
    { id: 'headache', type: 'check', label: 'Severe headache', ee: 'HEADACHE' }
  ],
  compute(a) {
    return count(a, ['mental', 'loc', 'vomiting', 'mechanism', 'basilar', 'headache']) > 0
      ? { level: 3, headline: 'Positive PECARN screen: 61/2611 (2.3%) with clinically important traumatic brain injury' }
      : { level: 1, headline: 'Negative PECARN screen: 2/3800 (0.05%) with clinically important traumatic brain injury' };
  }
};
