// AFC score: mortality after colorectal resection (Alves 2007; EE+ 392).
const OUT = ['2 of 424 (0.5%)', '6 of 366 (1.6%)', '11 of 153 (7.2%)', '29 of 57 (51%)'];

module.exports = {
  id: 'afc-colorectal',
  eeId: 392,
  title: 'AFC score (colorectal surgery)',
  subtitle: 'Mortality after colorectal resection for cancer or diverticular disease',
  question: 'For a patient having colorectal resection for cancer or diverticular disease, what is the risk of death after surgery?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 70', ee: 'CHK_Age' },
    { id: 'weight', type: 'check', label: 'Weight loss of 10% or more in the past 6 months', ee: 'CHK_Weight' },
    { id: 'neuro', type: 'check', label: 'Neurologic comorbidity (such as stroke, Parkinson disease or dementia)', ee: 'CHK_Neurologic' },
    { id: 'emergency', type: 'check', label: 'Emergency surgery', ee: 'CHK_Surgery' }
  ],
  compute(a) {
    const s = a.age + a.weight + a.neuro + a.emergency;
    return { score: { value: s, max: 4, label: 'AFC score' }, headline: `Postoperative mortality: ${OUT[Math.min(3, s)]}` };
  }
};
