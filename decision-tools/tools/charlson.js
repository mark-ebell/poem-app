// Charlson Comorbidity Index (Charlson 1987; EE+ 203).
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));
const check = (id, label, points, ee) => ({ id, type: 'check', label, points, ee });

const tool = module.exports = {
  id: 'charlson',
  eeId: 203,
  title: 'Charlson Comorbidity Index',
  subtitle: 'Weighted index of comorbid conditions',
  question: 'What is the Charlson Comorbidity Index?',
  inputs: [
    { id: 'diabetes', type: 'choice', label: 'Diabetes', ee: 'IDC_COMBOBOX_1', options: opts([['None', 0], ['Without end-organ damage', 1], ['With end-organ damage', 2]]) },
    { id: 'liver', type: 'choice', label: 'Liver disease', ee: 'IDC_COMBOBOX_2', options: opts([['None', 0], ['Mild', 1], ['Moderate or severe', 3]]) },
    { id: 'cancer', type: 'choice', label: 'Malignancy', ee: 'IDC_COMBOBOX_3', options: opts([['None', 0], ['Leukemia', 2], ['Lymphoma', 2], ['Metastatic solid tumor', 6], ['Other malignancy', 2]]) },
    { type: 'heading', label: 'Check all that apply' },
    check('mi', 'Myocardial infarction', 1, 'IDC_CHECKBOX_1'), check('pad', 'Peripheral arterial disease', 1, 'IDC_CHECKBOX_2'), check('copd', 'COPD', 1, 'IDC_CHECKBOX_3'),
    check('hemiplegia', 'Hemiplegia', 2, 'IDC_CHECKBOX_4'), check('dementia', 'Dementia', 1, 'IDC_CHECKBOX_5'), check('renal', 'Moderate or severe renal disease', 2, 'IDC_CHECKBOX_6'),
    check('chf', 'Heart failure', 1, 'IDC_CHECKBOX_7'), check('cvd', 'Cerebrovascular disease', 1, 'IDC_CHECKBOX_8'), check('ulcer', 'Peptic ulcer disease', 1, 'IDC_CHECKBOX_9'),
    check('ctd', 'Connective tissue (collagen vascular) disease', 1, 'IDC_CHECKBOX_10'), check('aids', 'AIDS', 6, 'IDC_CHECKBOX_11')
  ],
  points: { label: 'Charlson score' },
  compute(a) {
    return { headline: `Charlson Comorbidity Index: ${pointsOf(tool, a)}` };
  }
};
