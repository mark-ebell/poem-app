// CATCH2 rule: CT for children with minor head injury (Osmond 2018; EE+ 588).
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'catch2',
  eeId: 588,
  title: 'Pediatric head injury: need for CT (CATCH2)',
  subtitle: 'CT for children with minor head injury',
  question: 'For a child with a minor head injury in the past 24 hours (initial GCS 13 to 15, with more than one episode of vomiting or, under 2, persistent irritability), is CT needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('gcs', 'Glasgow Coma Scale under 15 two hours after the injury', 'cb1'),
    check('open', 'Suspected open or depressed skull fracture', 'cb2'),
    check('headache', 'Worsening headache', 'cb3'),
    check('irritable', 'Irritability on examination', 'cb4'),
    check('basal', "Any sign of basal skull fracture (hemotympanum, raccoon eyes, CSF otorrhea or rhinorrhea, Battle's sign)", 'cb5'),
    check('hematoma', 'Large, boggy scalp hematoma', 'cb6'),
    check('mechanism', 'Dangerous mechanism (fall from 3 feet or 5 stairs or more, fall from a bicycle without a helmet, or a motor vehicle crash)', 'cb7'),
    check('vomiting', '4 or more episodes of vomiting', 'cb8')
  ],
  compute(a) {
    return ['gcs', 'open', 'headache', 'irritable', 'basal', 'hematoma', 'mechanism', 'vomiting'].some(k => a[k])
      ? { level: 3, headline: 'CT recommended', lines: ['23 of 2214 (1%) needed neurosurgery and 196 of 2214 (8.8%) had brain injury on CT.'] }
      : { level: 1, headline: 'Low risk for brain injury', lines: ['0 of 1846 needed neurosurgery and 1 of 1846 had brain injury on CT.'] };
  }
};
