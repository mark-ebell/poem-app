// London Fibromyalgia Epidemiology Study Screening Questionnaire (White 1999; EE+ 187).
const SIDES = [{ label: 'None' }, { label: 'Left' }, { label: 'Right' }, { label: 'Both' }];

module.exports = {
  id: 'fibromyalgia-screen',
  eeId: 187,
  title: 'Fibromyalgia screening (LFESSQ)',
  subtitle: 'Screening questionnaire for fibromyalgia in outpatients',
  question: 'For an outpatient with chronic pain, does a screening questionnaire suggest fibromyalgia?',
  inputs: [
    { type: 'heading', label: 'Pain criteria: in the past 3 months, have you had pain in' },
    { id: 'msk', type: 'check', label: 'Muscles, bones or joints, lasting at least 1 week', ee: 'IDC_CHECKBOX_1' },
    { id: 'axial', type: 'check', label: 'Neck, chest or back', ee: 'IDC_CHECKBOX_4' },
    { id: 'arms', type: 'choice', label: 'Shoulders, arms or hands', ee: 'IDC_COMBOBOX_1', options: SIDES },
    { id: 'legs', type: 'choice', label: 'Legs or feet', ee: 'IDC_COMBOBOX_2', options: SIDES },
    { type: 'heading', label: 'Fatigue criteria' },
    { id: 'tired', type: 'check', label: 'Over the past 3 months, have you often felt tired or fatigued?', ee: 'IDC_CHECKBOX_11' },
    { id: 'limits', type: 'check', label: 'Does tiredness or fatigue significantly limit your activities?', ee: 'IDC_CHECKBOX_12' }
  ],
  compute(a) {
    const pain = a.msk && a.axial && (a.arms === 3 || a.legs === 3 || (a.arms > 0 && a.legs > 0));
    if (!pain) return { level: 1, headline: 'Negative screening test' };
    return a.tired && a.limits ? { level: 4, headline: 'Positive screen by both criteria: 70.6% have fibromyalgia (95% CI 55.3% to 85.9%)' }
      : { level: 3, headline: 'Positive screen by pain criteria: 56.8% have fibromyalgia (95% CI 53.0% to 60.6%)' };
  }
};
