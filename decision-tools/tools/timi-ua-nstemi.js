// TIMI risk score for unstable angina / non-ST-elevation MI (Antman; EE+ 153).
const UFH = ['7.2%', '7.2%', '11.6%', '15.8%', '16.8%', '31%', '38.1%', '38.1%'];
const ENOX = ['7.3%', '7.3%', '9.5%', '12%', '12.4%', '18.3%', '20%', '20%'];
const ITEMS = [['age', 'Age 65 or older', 'CHK_Age'], ['rf', 'At least 3 of: family history of CAD, hypertension, hyperlipidemia, diabetes, current smoker', 'CHK_Three'],
  ['stenosis', 'Prior coronary stenosis of 50% or more', 'CHK_Prior'], ['st', 'ST deviation', 'CHK_ST'], ['angina', 'Severe angina (2 or more episodes in the last 24 hours)', 'CHK_Anginal'],
  ['aspirin', 'Aspirin use in the last 7 days', 'CHK_Aspirin'], ['markers', 'Elevated CK or cardiac troponin', 'CHK_CK']];

module.exports = {
  id: 'timi-ua-nstemi',
  eeId: 153,
  title: 'TIMI risk score for UA/NSTEMI',
  subtitle: 'Unstable angina and non-ST-elevation MI',
  question: 'For a patient with an acute coronary syndrome without ST elevation, what is the 2-week risk of death, MI or urgent revascularization?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))],
  points: { label: 'TIMI score', max: 7 },
  compute(a) {
    const s = ITEMS.filter(([id]) => a[id]).length;
    return { level: s <= 2 ? 1 : s <= 4 ? 2 : s <= 5 ? 3 : 4,
      lines: [{ label: 'Death, MI or urgent revascularization at 2 weeks with unfractionated heparin', value: UFH[s] }, { label: 'With enoxaparin', value: ENOX[s] }] };
  }
};
