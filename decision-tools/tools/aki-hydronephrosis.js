// Hydronephrosis in acute kidney injury: who needs renal ultrasound (Licurse 2010; EE+ 445). Wording as in EE+.
module.exports = {
  id: 'aki-hydronephrosis',
  eeId: 445,
  title: 'Hydronephrosis in acute kidney injury (Licurse)',
  subtitle: 'Hydronephrosis, and hydronephrosis needing intervention, in acute kidney injury',
  question: 'For a patient with acute kidney injury, how likely is hydronephrosis, and is renal ultrasound needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'previous', type: 'check', label: 'Previous hydronephrosis (makes the patient high risk)', ee: 'HYDRONEPHROSIS' },
    { id: 'uti', type: 'check', label: 'Recurrent UTI (2 or more in the past year)', ee: 'UTI' },
    { id: 'obstruction', type: 'check', label: 'Diagnosis suggesting obstruction (BPH, abdominal or pelvic cancer, neurogenic bladder, single functioning kidney, or previous pelvic surgery)', ee: 'DIAGNOSIS' },
    { id: 'nonblack', type: 'check', label: 'Non-Black race', ee: 'RACE' },
    { id: 'noNephrotoxin', type: 'check', label: 'No inpatient nephrotoxic drugs (aspirin, diuretics, ACE inhibitors, vancomycin)', ee: 'EXPOSURE' },
    { id: 'noChf', type: 'check', label: 'No heart failure', ee: 'CHF' },
    { id: 'noPrerenal', type: 'check', label: 'No prerenal acute kidney injury', ee: 'PRERENAL' }
  ],
  compute(a) {
    const s = 3 * a.previous + a.uti + a.obstruction + a.nonblack + a.noNephrotoxin + a.noChf + a.noPrerenal;
    return s < 2
      ? { score: { value: s, label: 'Score' }, level: 1, headline: 'Low risk: consider selective use of ultrasound', lines: ['17 of 331 (5.1%) had hydronephrosis; 1 of 331 (0.3%) needed intervention.'] }
      : { score: { value: s, label: 'Score' }, level: 3, headline: 'High risk: order ultrasound', lines: ['68 of 466 (14.6%) had hydronephrosis; 26 of 466 (5.6%) needed intervention.'] };
  }
};
