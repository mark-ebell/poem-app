// PECARN head injury rule, children under 2 (Kuppermann 2009; EE+ 434).
module.exports = {
  id: 'pecarn-head-under2',
  eeId: 434,
  title: 'PECARN head injury rule (under 2 years)',
  subtitle: 'Need for head CT in children under 2 after head trauma',
  question: 'For a child under 2 seen within 24 hours of non-trivial head trauma with a Glasgow Coma Scale of 14 or 15, is a head CT needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mental', type: 'check', label: 'Altered mental status, or Glasgow Coma Scale under 15', ee: 'MENTAL' },
    { id: 'fracture', type: 'check', label: 'Palpable skull fracture (or unclear exam)', ee: 'FRACTURE' },
    { id: 'hematoma', type: 'check', label: 'Scalp hematoma (other than frontal)', ee: 'HEMATOMA' },
    { id: 'notNormal', type: 'check', label: 'Not acting normally per parent', ee: 'NOT_NORMAL' },
    { id: 'mechanism', type: 'check', label: 'Severe mechanism of injury', ee: 'MECHANISM', note: 'Motor vehicle crash with ejection, death of another passenger or rollover; pedestrian or unhelmeted cyclist struck by a motorized vehicle; fall of more than 3 feet; or head struck by a high-impact object.' },
    { id: 'loc', type: 'check', label: 'Loss of consciousness of 5 seconds or more', ee: 'CONSCIOUSNESS' }
  ],
  compute(a) {
    if (a.mental || a.fracture) return { level: 4, headline: 'CT recommended: 4.4% had a clinically important traumatic brain injury' };
    if (a.hematoma || a.notNormal || a.mechanism || a.loc) return { level: 2, headline: 'Consider observation vs CT: 0.9% risk of clinically important traumatic brain injury',
      lines: ['Factors include physician experience, multiple vs isolated findings, worsening after initial ED observation, age under 3 months, and parental preference.'] };
    return { level: 1, headline: 'CT not recommended unless there are other compelling indications', lines: ['0 of 1176 in the validation population had a clinically important traumatic brain injury.'] };
  }
};
