// Survival after resection of colorectal liver metastases (clinical risk score; EE+ 286).
module.exports = {
  id: 'crc-liver-mets-fong',
  eeId: 286,
  title: 'Colon cancer hepatic metastases: survival',
  subtitle: 'Survival after resection of colorectal liver metastases',
  question: 'For a patient with liver metastases from colorectal cancer, what is the 1- and 5-year survival?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'nodes', type: 'check', label: 'Positive lymph nodes with the primary colorectal cancer', ee: 'IDC_CHECKBOX_1' },
    { id: 'interval', type: 'check', label: 'Less than 12 months from the primary diagnosis to the liver metastases', ee: 'IDC_CHECKBOX_2' },
    { id: 'multiple', type: 'check', label: 'More than one liver metastasis on preoperative imaging', ee: 'IDC_CHECKBOX_3' },
    { id: 'size', type: 'check', label: 'Largest liver metastasis over 5 cm on preoperative imaging', ee: 'IDC_CHECKBOX_4' },
    { id: 'cea', type: 'check', label: 'Preoperative CEA over 200 ng/mL', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    const n = a.nodes + a.interval + a.multiple + a.size + a.cea;
    const [y5, y1] = n <= 1 ? ['72.5%', '93.8%'] : n <= 3 ? ['31.2%', '76.6%'] : ['0.0%', '75.0%'];
    return { score: { value: n, max: 5, label: 'Risk score' }, level: n <= 1 ? 1 : n <= 3 ? 3 : 4, headline: `5-year survival ${y5}`, lines: [`1-year survival ${y1}`] };
  }
};
