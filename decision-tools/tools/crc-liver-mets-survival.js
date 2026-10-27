// Survival after resection of colorectal liver metastases (EE+ 426).
module.exports = {
  id: 'crc-liver-mets-survival',
  eeId: 426,
  title: 'Hepatic metastases from colorectal cancer: 5- and 10-year survival',
  subtitle: 'Survival after resection of colorectal liver metastases',
  question: 'For a patient with resectable liver metastases from colorectal cancer, what is the 5- and 10-year survival?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'hepaticNodes', type: 'check', label: 'Regional (hepatic) lymph node metastases', ee: 'CHK_Regional' },
    { id: 'nodes4', type: 'check', label: '4 or more lymph node metastases around the primary cancer', ee: 'CHK_4Nodes' },
    { id: 'cea', type: 'check', label: 'CEA 50 ng/mL or more', ee: 'CHK_CEA' },
    { id: 'multiple', type: 'check', label: 'Multiple liver metastases', ee: 'CHK_Liver' }
  ],
  compute(a) {
    if (a.hepaticNodes) return { level: 4, headline: '5- and 10-year survival 0%' };
    const n = a.nodes4 + a.cea + a.multiple;
    return n === 0 ? { level: 1, headline: '5-year survival 58%, 10-year survival 48%' } : n === 1 ? { level: 2, headline: '5-year survival 42%, 10-year survival 30%' }
      : { level: 3, headline: '5-year survival 26%, 10-year survival 17%' };
  }
};
