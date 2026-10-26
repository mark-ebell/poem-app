// Rome I criteria for irritable bowel syndrome (validation: Tibble 2002; EE+ 183).
module.exports = {
  id: 'rome1-ibs',
  eeId: 183,
  title: 'Rome I criteria (irritable bowel syndrome)',
  subtitle: 'Irritable bowel syndrome by the Rome I criteria',
  question: 'For a patient with bowel symptoms, do the Rome I criteria suggest irritable bowel syndrome?',
  inputs: [
    { id: 'pretest', type: 'choice', label: 'Pretest probability of IBS', ee: 'IDC_COMBOBOX_1', options: [{ label: '20%' }, { label: '50%' }, { label: '80%' }] },
    { type: 'heading', label: 'At least 3 months of continuous or recurrent abdominal pain or discomfort that is:' },
    { id: 'relieved', type: 'check', label: 'Relieved by defecation', ee: 'IDC_CHECKBOX_1' },
    { id: 'frequency', type: 'check', label: 'Associated with a change in stool frequency', ee: 'IDC_CHECKBOX_2' },
    { id: 'consistency', type: 'check', label: 'Associated with a change in stool consistency', ee: 'IDC_CHECKBOX_3' },
    { type: 'heading', label: 'On at least a quarter of days:' },
    { id: 'altFreq', type: 'check', label: 'Altered stool frequency (more than 3 a day or fewer than 3 a week)', ee: 'IDC_CHECKBOX_4' },
    { id: 'altForm', type: 'check', label: 'Altered stool form (lumpy, hard, loose or watery)', ee: 'IDC_CHECKBOX_5' },
    { id: 'altPassage', type: 'check', label: 'Altered passage (straining, urgency or incomplete evacuation)', ee: 'IDC_CHECKBOX_6' },
    { id: 'mucus', type: 'check', label: 'Passage of mucus', ee: 'IDC_CHECKBOX_7' },
    { id: 'bloating', type: 'check', label: 'Bloating or abdominal distension', ee: 'IDC_CHECKBOX_8' }
  ],
  compute(a) {
    const pos = a.relieved + a.frequency + a.consistency >= 1 && a.altFreq + a.altForm + a.altPassage + a.mucus + a.bloating >= 2;
    return pos
      ? { level: 3, headline: `Positive screen for IBS: ${['42%', '75%', '92%'][a.pretest]} risk` }
      : { level: 1, headline: `Negative screen for IBS: ${['5%', '17%', '46%'][a.pretest]} risk` };
  }
};
