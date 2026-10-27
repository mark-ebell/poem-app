// IOTA simple rules (M and B rules) for adnexal masses on ultrasound (Timmerman 2008; EE+ 395).
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'iota-simple-rules',
  eeId: 395,
  title: 'Ovarian cancer: IOTA simple rules (M and B rules)',
  subtitle: 'Benign vs malignant adnexal mass on ultrasound',
  question: 'For an adnexal mass on ultrasound, do the IOTA simple rules suggest malignancy?',
  inputs: [
    { type: 'heading', label: 'M rules (check all that apply)' },
    check('m1', 'Irregular solid tumor', 'CHK_Tumor'), check('m2', 'Ascites', 'CHK_Ascites'), check('m3', 'At least 4 papillary structures', 'CHK_FourPapillary'),
    check('m4', 'Irregular multilocular solid tumor with largest diameter 100 mm or more', 'CHK_IrrMulti'), check('m5', 'Very strong blood flow (color score 4)', 'CHK_StrongBlood'),
    { type: 'heading', label: 'B rules (check all that apply)' },
    check('b1', 'Unilocular', 'CHK_Unilocular'), check('b2', 'Solid components, the largest under 7 mm in largest diameter', 'CHK_Solid'), check('b3', 'Acoustic shadows', 'CHK_Acoustic'),
    check('b4', 'Smooth multilocular tumor with largest diameter under 100 mm', 'CHK_SmMulti'), check('b5', 'No blood flow (color score 1)', 'CHK_NoBlood')
  ],
  footnote: 'Any M rule without a B rule suggests cancer; any B rule without an M rule suggests a benign mass. With both or neither, the rules cannot classify the mass.',
  compute(a) {
    const m = a.m1 + a.m2 + a.m3 + a.m4 + a.m5, b = a.b1 + a.b2 + a.b3 + a.b4 + a.b5;
    return m && !b ? { level: 4, headline: 'Suspicious for malignancy (LR+ 10.4)' } : b && !m ? { level: 1, headline: 'Benign disease likely (LR− for malignancy 0.06)' } : { headline: 'Unable to classify the likelihood of malignancy' };
  }
};
