// Depression screening in older adults: 4-item Geriatric Depression Scale and 1-item Mental Health Inventory (EE+ 229).
module.exports = {
  id: 'depression-elderly',
  eeId: 229,
  title: 'Depression screening in older adults (GDS-4 and MHI-1)',
  subtitle: 'Brief depression screens for patients over 60',
  question: 'For a patient over 60, do brief screens suggest depression?',
  inputs: [
    { type: 'heading', label: 'Geriatric Depression Scale (check each yes answer)' },
    { id: 'satisfied', type: 'check', label: 'Are you basically satisfied with your life?', ee: 'IDC_CHECKBOX_1' },
    { id: 'empty', type: 'check', label: 'Do you feel your life is empty?', ee: 'IDC_CHECKBOX_2' },
    { id: 'afraid', type: 'check', label: 'Are you afraid that something bad is going to happen to you?', ee: 'IDC_CHECKBOX_3' },
    { id: 'happy', type: 'check', label: 'Do you feel happy most of the time?', ee: 'IDC_CHECKBOX_4' },
    { id: 'mhi', type: 'choice', label: 'Mental Health Inventory: how much of the time in the past month have you felt downhearted and sad?', ee: 'IDC_COMBOBOX_1',
      options: ['All of the time', 'Most of the time', 'A good bit of the time', 'Some of the time', 'A little of the time', 'None of the time'].map(label => ({ label })) }
  ],
  compute(a) {
    const gds = (!a.satisfied) + a.empty + a.afraid + (!a.happy), mhi = 6 - a.mhi >= 3;
    return { level: gds >= 1 || mhi ? 3 : 1, headline: `${gds >= 1 ? 'Positive' : 'Negative'} screen on the GDS; ${mhi ? 'positive' : 'negative'} screen on the MHI`, lines: [`GDS score ${gds} of 4.`] };
  }
};
