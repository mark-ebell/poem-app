// Type of chronic constipation from symptoms (Knowles 2000; EE+ 215).
module.exports = {
  id: 'constipation-knowles',
  eeId: 215,
  title: 'Chronic constipation type (Knowles)',
  subtitle: 'Slow transit, rectal evacuatory disorder or both',
  question: 'For a patient with intractable chronic constipation, which physiological type is most likely?',
  inputs: [
    { id: 'duration', type: 'choice', label: 'Duration', ee: 'Combo1_ID', options: ['Up to 18 months', '18 months to 5 years', '5 to 10 years', '10 to 20 years', 'More than 20 years or lifelong'].map(label => ({ label })) },
    { id: 'laxatives', type: 'choice', label: 'Laxative use', ee: 'Combo2_ID', options: ['None', 'As needed or short-term', 'Regular or long-term', 'Long-term and ineffective'].map(label => ({ label })) },
    { id: 'frequency', type: 'choice', label: 'Bowel movements', ee: 'Combo3_ID', options: ['1 or 2 every 1 to 2 days', '2 or fewer a week', 'Less than once a week', 'Less than once in 2 weeks'].map(label => ({ label })) },
    { id: 'pain', type: 'choice', label: 'Abdominal pain', ee: 'Combo4_ID', options: ['Never', 'Rarely', 'Occasionally', 'Usually', 'Always'].map(label => ({ label })) },
    { id: 'time', type: 'choice', label: 'Time spent trying to evacuate', ee: 'Combo5_ID', options: ['Under 5 minutes', '5 to 10 minutes', '10 to 30 minutes', 'Over 30 minutes'].map(label => ({ label })) }
  ],
  footnote: 'Developed in a referral setting; not prospectively validated.',
  compute(a) {
    const rectal = -5.813 + 0.969 * a.duration - 0.005 * a.laxatives - 1.484 * a.frequency + 1.899 * a.pain + 2.003 * a.time;
    const mixed = -6.233 + 1.475 * a.duration + 0.882 * a.laxatives - 0.007 * a.frequency + 1.035 * a.pain + 1.169 * a.time;
    const slow = -6.566 + 1.766 * a.duration + 0.666 * a.laxatives + 0.447 * a.frequency + 1.039 * a.pain + 0.339 * a.time;
    const best = Math.max(rectal, mixed, slow);
    return { headline: `Most likely: ${best === slow ? 'slow transit constipation' : best === mixed ? 'mixed slow transit and rectal evacuatory disorder' : 'rectal evacuatory disorder'}` };
  }
};
