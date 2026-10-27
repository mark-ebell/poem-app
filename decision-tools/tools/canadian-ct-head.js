// Canadian CT head rule (Stiell 2001; EE+ 135). EE+ left age 65 or older out of the high-risk
// factors; it is one in the published rule.
module.exports = {
  id: 'canadian-ct-head',
  eeId: 135,
  title: 'Canadian CT head rule',
  subtitle: 'Need for head CT after minor head injury',
  question: 'For a patient with blunt head trauma in the past 24 hours causing witnessed loss of consciousness, definite amnesia or disorientation, and a Glasgow Coma Scale of 13 to 15, is a head CT needed?',
  inputs: [
    { type: 'heading', label: 'High risk (for neurosurgical intervention)' },
    { id: 'gcs', type: 'check', label: 'Glasgow Coma Scale under 15 at 2 hours after injury', ee: 'IDC_CHECKBOX_1' },
    { id: 'open', type: 'check', label: 'Suspected open or depressed skull fracture', ee: 'IDC_CHECKBOX_2' },
    { id: 'basal', type: 'check', label: "Any sign of basal skull fracture (hemotympanum, 'raccoon eyes', CSF otorrhea or rhinorrhea, Battle's sign)", ee: 'IDC_CHECKBOX_3' },
    { id: 'vomit', type: 'check', label: 'Vomiting 2 or more times', ee: 'IDC_CHECKBOX_4' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'IDC_CHECKBOX_5' },
    { type: 'heading', label: 'Medium risk (for brain injury on CT)' },
    { id: 'amnesia', type: 'check', label: 'Amnesia for 30 minutes or more before impact', ee: 'IDC_CHECKBOX_6' },
    { id: 'mechanism', type: 'check', label: 'Dangerous mechanism (pedestrian struck by a motor vehicle, ejected from a motor vehicle, fall from more than 3 feet or 5 stairs)', ee: 'IDC_CHECKBOX_7' }
  ],
  compute(a) {
    const high = a.gcs || a.open || a.basal || a.vomit || a.age, medium = high || a.amnesia || a.mechanism;
    return {
      level: high ? 4 : medium ? 3 : 1,
      headline: high ? 'CT indicated: high risk for neurosurgical intervention' : medium ? 'CT indicated: medium risk for brain injury on CT' : 'CT not needed by this rule',
      lines: [
        high ? 'High risk for neurological intervention (4.4%, 44 of 1006).' : 'Low risk for neurological intervention (0%, 0 of 2115).',
        medium ? 'Moderate risk for clinically important brain injury (14.7%, 250 of 1696).' : 'Low risk for clinically important brain injury (0.3%, 4 of 1425).'
      ]
    };
  }
};
