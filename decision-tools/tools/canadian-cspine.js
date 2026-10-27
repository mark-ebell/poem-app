// Canadian C-spine rule (Stiell 2001; EE+ 147).
module.exports = {
  id: 'canadian-cspine',
  eeId: 147,
  title: 'Canadian C-spine rule',
  subtitle: 'Need for cervical spine imaging after trauma',
  question: 'For an alert (Glasgow Coma Scale 15), stable trauma patient, is cervical spine imaging needed?',
  inputs: [
    { type: 'heading', label: 'High-risk factors' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'IDC_CHECKBOX_1' },
    { id: 'paresthesia', type: 'check', label: 'Paresthesias in the extremities', ee: 'IDC_CHECKBOX_2' },
    { id: 'mechanism', type: 'check', label: 'Dangerous mechanism (fall from 3 feet or 5 stairs or more, axial load to the head, high-speed or rollover motor vehicle crash or ejection, motorized recreational vehicle, bicycle collision)', ee: 'IDC_CHECKBOX_4' },
    { type: 'heading', label: 'Low-risk factors that allow a safe range-of-motion assessment' },
    { id: 'rearEnd', type: 'check', label: 'Simple rear-end motor vehicle collision', ee: 'IDC_CHECKBOX_3' },
    { id: 'sitting', type: 'check', label: 'Sitting position in the ED', ee: 'IDC_CHECKBOX_5' },
    { id: 'ambulatory', type: 'check', label: 'Ambulatory at any time', ee: 'IDC_CHECKBOX_6' },
    { id: 'delayed', type: 'check', label: 'Delayed onset of neck pain', ee: 'IDC_CHECKBOX_7' },
    { id: 'noTender', type: 'check', label: 'No midline cervical spine tenderness', ee: 'IDC_CHECKBOX_8' },
    { type: 'heading', label: 'Range of motion' },
    { id: 'rotate', type: 'check', label: 'Able to actively rotate the neck 45 degrees to the left and right', ee: 'IDC_CHECKBOX_9' }
  ],
  compute(a) {
    const why = a.age || a.paresthesia || a.mechanism ? 'a high-risk factor is present'
      : !(a.rearEnd || a.sitting || a.ambulatory || a.delayed || a.noTender) ? 'no low-risk factor allows a safe range-of-motion assessment'
      : !a.rotate ? 'the patient cannot rotate the neck 45 degrees to each side' : null;
    return why ? { level: 3, headline: 'Cervical spine imaging indicated', lines: [`Because ${why}.`] } : { level: 1, headline: 'Cervical spine imaging not indicated' };
  }
};
