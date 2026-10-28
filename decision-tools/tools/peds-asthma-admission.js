// Admission for children with acute asthma (Chey 1999; EE+ 190).
module.exports = {
  id: 'peds-asthma-admission',
  eeId: 190,
  title: 'Peds asthma - hospitalization risk',
  subtitle: 'Hospital admission for children with acute asthma in the ED',
  question: 'For a child 16 or younger in the ED with acute asthma, what is the probability of hospital admission?',
  inputs: [
    { id: 'young', type: 'check', label: 'Age 6 years or younger', ee: 'IDC_CHECKBOX_1' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_2' },
    { id: 'interval', type: 'check', label: 'Moderate or severe interval severity', ee: 'IDC_CHECKBOX_3', note: 'Severity between exacerbations. Moderate or severe: wheeze most days; daily or frequent nocturnal asthma; history of life-threatening attacks; bronchodilator needed on most days; or mean peak expiratory flow variability over 20%.' },
    { id: 'wheeze', type: 'check', label: 'Moderate or severe pretreatment wheeze', ee: 'IDC_CHECKBOX_4' },
    { id: 'oxygen', type: 'check', label: 'Oxygen given', ee: 'IDC_CHECKBOX_5' },
    { id: 'sat', type: 'number', label: 'Oxygen saturation after treatment', unit: '%', min: 50, max: 100, ee: 'IDC_EDIT_1' }
  ],
  compute(a) {
    const x = 25.413 - 0.114 * a.young + 0.29 * a.male + 1.509 * a.oxygen + 1.245 * a.interval + 2.289 * a.wheeze - 0.296 * a.sat;
    const p = 100 / (1 + Math.exp(-x));
    return { level: p < 10 ? 1 : p < 30 ? 2 : p < 60 ? 3 : 4, headline: `Probability of hospital admission ${Math.round(p * 10) / 10}%` };
  }
};
