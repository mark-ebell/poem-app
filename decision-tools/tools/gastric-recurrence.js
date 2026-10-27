// 5-year recurrence after resection of gastric cancer (EE+ 417).
module.exports = {
  id: 'gastric-recurrence',
  eeId: 417,
  title: 'Gastric cancer recurrence after resection',
  subtitle: '5-year recurrence after surgery for gastric cancer',
  question: 'For a patient after surgical resection of gastric cancer, what is the risk of recurrence within 5 years?',
  inputs: [
    { id: 'location', type: 'choice', label: 'Tumor location', ee: 'CMB_Location', options: [{ label: 'Upper' }, { label: 'Middle' }, { label: 'Lower' }, { label: 'Diffuse' }] },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, default: 45, ee: 'TXT_Age' },
    { id: 'invasion', type: 'choice', label: 'Depth of invasion', ee: 'CMB_Invasion', options: [{ label: 'pT1' }, { label: 'pT2' }, { label: 'pT3 to pT4' }] },
    { id: 'nodes', type: 'choice', label: 'Nodal status', ee: 'CMB_Nodal', options: [{ label: 'pN0' }, { label: 'pN1' }, { label: 'pN2' }, { label: 'pN3' }] },
    { type: 'heading', label: 'Check if done' },
    { id: 'd2', type: 'check', label: 'Extended lymphadenectomy (D2 to D3)', ee: 'CHK_Lymph' }
  ],
  compute(a) {
    const x = -3.888 + [0.917, -0.339, 0, 6.266][a.location] + 0.027 * a.age + [0, 1.075, 2.013][a.invasion] + [0, 1.668, 3.056, 4.971][a.nodes] - 0.848 * a.d2;
    return { headline: `Probability of recurrence within 5 years: ${(100 / (1 + Math.exp(-x))).toFixed(1)}%` };
  }
};
