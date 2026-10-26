// Framingham criteria for heart failure (accuracy from Maestre 2009; EE+ 411).
const MAJOR = [['pnd', 'Paroxysmal nocturnal dyspnea or orthopnea', 'CHK_Dyspnea'], ['jvd', 'Neck vein distension', 'CHK_NeckVein'], ['rales', 'Rales', 'CHK_Rales'],
  ['cardiomegaly', 'Cardiomegaly', 'CHK_Cardiomegaly'], ['edema', 'Acute pulmonary edema', 'CHK_PulmEdema'], ['s3', 'S3 gallop', 'CHK_S3'], ['hjr', 'Hepatojugular reflux', 'CHK_Hepat']];
const MINOR = [['ankle', 'Ankle edema', 'CHK_AnkleEdema'], ['cough', 'Nocturnal cough', 'CHK_Cough'], ['doe', 'Dyspnea on exertion', 'CHK_DyspEx'],
  ['hepatomegaly', 'Hepatomegaly', 'CHK_Hepatomegaly'], ['effusion', 'Pleural effusion', 'CHK_PlEff'], ['tachy', 'Tachycardia (above 120 beats/min)', 'CHK_Tachycardia']];
module.exports = {
  id: 'framingham-hf',
  eeId: 411,
  title: 'Framingham criteria for heart failure',
  subtitle: 'Clinical diagnosis of heart failure',
  question: 'Does this patient meet the Framingham criteria for heart failure, and how likely is heart failure?',
  inputs: [
    { type: 'heading', label: 'Major criteria' }, ...MAJOR.map(([id, label, ee]) => ({ id, type: 'check', label, ee })),
    { type: 'heading', label: 'Minor criteria (not due to another condition)' }, ...MINOR.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  footnote: 'Heart failure: 2 major criteria, or 1 major and 2 minor criteria.',
  compute(a) {
    const major = MAJOR.filter(([id]) => a[id]).length, minor = MINOR.filter(([id]) => a[id]).length;
    return major >= 2 || (major >= 1 && minor >= 2)
      ? { level: 3, headline: 'Meets the criteria for heart failure', lines: ['Probability of heart failure 81% given a 50% pretest probability, and 60% given 25%.'] }
      : { level: 1, headline: 'Does not meet the criteria for heart failure', lines: ['Probability of heart failure 9% given a 50% pretest probability, and 3% given 25%.'] };
  }
};
