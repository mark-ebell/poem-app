// Risk of malignancy index (RMI) for an ovarian mass (meta-analysis: Geomini 2009; EE+ 425).
module.exports = {
  id: 'rmi-ovarian',
  eeId: 425,
  title: 'Risk of malignancy index (ovarian mass)',
  subtitle: 'Malignancy in a woman with an ovarian mass',
  question: 'For a woman with an ovarian mass, how likely is malignancy?',
  inputs: [
    { id: 'ca125', type: 'number', label: 'CA-125', unit: 'U/mL', min: 1, max: 100000, step: 1, ee: 'TXT_CA125' },
    { type: 'heading', label: 'Ultrasound findings: check all that apply' },
    { id: 'multilocular', type: 'check', label: 'Multilocular cyst', ee: 'CHK_Cyst' },
    { id: 'solid', type: 'check', label: 'Solid areas', ee: 'CHK_Solid' },
    { id: 'mets', type: 'check', label: 'Metastases', ee: 'CHK_Metastases' },
    { id: 'ascites', type: 'check', label: 'Ascites', ee: 'CHK_Ascites' },
    { id: 'bilateral', type: 'check', label: 'Bilateral lesions', ee: 'CHK_Lesions' },
    { type: 'heading', label: 'Check if present' },
    { id: 'post', type: 'check', label: 'Postmenopausal', ee: 'CHK_PostMeno' }
  ],
  footnote: 'RMI = ultrasound score (0 for no features, 1 for one, 3 for two or more) × menopausal status (1 or 3) × CA-125.',
  compute(a) {
    const n = a.multilocular + a.solid + a.mets + a.ascites + a.bilateral;
    const rmi = (n === 0 ? 0 : n === 1 ? 1 : 3) * (a.post ? 3 : 1) * Math.trunc(a.ca125);
    return rmi >= 200
      ? { score: { value: rmi, label: 'RMI' }, level: 3, headline: 'High risk for malignancy', lines: ['40% given a 10% pretest probability; 67% given 25%.'] }
      : { score: { value: rmi, label: 'RMI' }, level: 1, headline: 'Low risk for malignancy', lines: ['3% given a 10% pretest probability; 7% given 25%.'] };
  }
};
