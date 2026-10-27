// New Orleans criteria for head CT after minor head injury (Haydel 2000; EE+ 111).
module.exports = {
  id: 'new-orleans-head',
  eeId: 111,
  title: 'New Orleans head CT rule',
  subtitle: 'Need for head CT after minor head injury',
  question: 'For a patient with loss of consciousness after a head injury, a normal brief neurologic exam and a Glasgow Coma Scale of 15, is a head CT indicated?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 60', ee: 'IDC_CHECKBOX_1' },
    { id: 'headache', type: 'check', label: 'Headache or vomiting', ee: 'IDC_CHECKBOX_2' },
    { id: 'intox', type: 'check', label: 'Drug or alcohol intoxication', ee: 'IDC_CHECKBOX_3' },
    { id: 'memory', type: 'check', label: 'Deficit in short-term memory', ee: 'IDC_CHECKBOX_4' },
    { id: 'trauma', type: 'check', label: 'Physical evidence of trauma above the clavicles', ee: 'IDC_CHECKBOX_5' },
    { id: 'seizure', type: 'check', label: 'Seizure', ee: 'IDC_CHECKBOX_6' }
  ],
  compute(a) {
    return a.age || a.headache || a.intox || a.memory || a.trauma || a.seizure ? { level: 3, headline: 'Head CT is indicated' }
      : { level: 1, headline: 'Head CT may not be indicated if there is no coagulopathy' };
  }
};
