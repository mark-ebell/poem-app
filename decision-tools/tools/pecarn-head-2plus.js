// PECARN head injury rule, children 2 and older (Kuppermann 2009; EE+ 435).
module.exports = {
  id: 'pecarn-head-2plus',
  eeId: 435,
  title: 'PECARN head injury rule (2 years and older)',
  subtitle: 'Need for head CT in children 2 and older after head trauma',
  question: 'For a child 2 or older seen within 24 hours of non-trivial head trauma with a Glasgow Coma Scale of 14 or 15, is a head CT needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mental', type: 'check', label: 'Altered mental status, or Glasgow Coma Scale under 15', ee: 'MENTAL' },
    { id: 'fracture', type: 'check', label: 'Signs of basilar skull fracture', ee: 'FRACTURE', note: "Retro-auricular bruising (Battle's sign), periorbital bruising (raccoon eyes), hemotympanum, CSF otorrhea or rhinorrhea." },
    { id: 'vomiting', type: 'check', label: 'History of vomiting', ee: 'VOMITING' },
    { id: 'headache', type: 'check', label: 'Severe headache', ee: 'HEADACHE' },
    { id: 'mechanism', type: 'check', label: 'Severe mechanism of injury', ee: 'MECHANISM', note: 'Motor vehicle crash with ejection, death of another passenger or rollover; pedestrian or unhelmeted cyclist struck by a motorized vehicle; fall of more than 5 feet; or head struck by a high-impact object.' },
    { id: 'loc', type: 'check', label: 'Any loss of consciousness', ee: 'CONSCIOUSNESS' }
  ],
  compute(a) {
    if (a.mental || a.fracture) return { level: 4, headline: 'CT recommended: 4.3% had a clinically important traumatic brain injury' };
    if (a.vomiting || a.headache || a.mechanism || a.loc) return { level: 2, headline: 'Consider observation vs CT: 0.9% risk of clinically important traumatic brain injury',
      lines: ['Factors include physician experience, multiple vs isolated findings, worsening after initial ED observation, and parental preference.'] };
    return { level: 1, headline: 'CT not recommended unless there are other compelling indications', lines: ['2 of 3800 in the validation population had a clinically important traumatic brain injury.'] };
  }
};
