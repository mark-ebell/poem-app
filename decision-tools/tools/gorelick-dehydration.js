// Dehydration in young children: 4-item scale (Gorelick 1997; EE+ 273).
module.exports = {
  id: 'gorelick-dehydration',
  eeId: 273,
  title: 'Dehydration in children (Gorelick)',
  subtitle: 'Dehydration of 5% or more in children 1 month to 5 years',
  question: 'For a young child with vomiting, diarrhea or poor intake, how likely is dehydration of 5% or more?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'cap', type: 'check', label: 'Capillary refill over 2 seconds', ee: 'CHK_Capillary' },
    { id: 'dry', type: 'check', label: 'Dry mucous membranes', ee: 'CHK_Dry' },
    { id: 'tears', type: 'check', label: 'Absent tears', ee: 'CHK_Tears' },
    { id: 'appearance', type: 'check', label: 'Abnormal general appearance', ee: 'CHK_General' }
  ],
  footnote: 'Probabilities assume an overall likelihood of 50%.',
  compute(a) {
    return a.cap + a.dry + a.tears + a.appearance >= 2
      ? { level: 3, headline: 'Positive: 86% have at least 5% dehydration' }
      : { level: 1, headline: 'Negative: 20% have at least 5% dehydration' };
  }
};
