// PECARN rule for children under 2, as a single positive/negative result (Kuppermann 2009; EE+ 460).
module.exports = {
  id: 'pecarn-under2-simple',
  eeId: 460,
  title: 'Clinically important brain injury under 2 years (PECARN)',
  subtitle: 'Clinically important traumatic brain injury in children under 2',
  question: 'For a child under 2 with head trauma and a Glasgow Coma Scale of 14 or 15, is the PECARN rule positive?',
  inputs: [
    { id: 'normal', type: 'choice', label: 'Acting normally per parent', ee: 'NORMAL', options: [{ label: 'Yes' }, { label: 'No' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mental', type: 'check', label: 'Altered mental status', ee: 'MENTAL' },
    { id: 'hematoma', type: 'check', label: 'Scalp hematoma (other than frontal)', ee: 'HEMATOMA' },
    { id: 'loc', type: 'check', label: 'Loss of consciousness of 5 seconds or more', ee: 'CONSCIOUS' },
    { id: 'mechanism', type: 'check', label: 'Severe mechanism of injury', ee: 'MECHANISMS', note: 'Motor vehicle crash with ejection, death of a passenger or rollover; pedestrian or unhelmeted cyclist struck by a vehicle; fall of more than 3 feet; or head struck by a high-impact object.' },
    { id: 'fracture', type: 'check', label: 'Palpable or unclear skull fracture', ee: 'FRACTURE' }
  ],
  compute(a) {
    return a.mental || a.hematoma || a.loc || a.mechanism || a.fracture || a.normal === 1 ? { level: 3, headline: 'Positive PECARN rule: 25 of 1015 (2.5%) had a clinically important traumatic brain injury' }
      : { level: 1, headline: 'Negative PECARN rule: 0 of 1176 (0.0%) had a clinically important traumatic brain injury' };
  }
};
