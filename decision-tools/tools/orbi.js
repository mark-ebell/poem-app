// ORBI risk score: in-hospital cardiogenic shock in STEMI treated with primary PCI (Auffret; EE+ 606).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'orbi',
  eeId: 606,
  title: 'ORBI risk score',
  subtitle: 'Cardiogenic shock in STEMI treated with primary PCI',
  question: 'For a patient hospitalized with STEMI treated with primary PCI, what is the risk of in-hospital cardiogenic shock?',
  inputs: [
    { id: 'killip', type: 'choice', label: 'Killip class on admission', ee: 'ddl1', options: [{ label: 'I: no signs of congestion', points: 0 }, { label: 'II: S3 and rales', points: 2 }, { label: 'III: acute pulmonary edema', points: 6 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 70', points: 2, ee: 'cb1' },
    { id: 'stroke', type: 'check', label: 'Previous stroke or TIA', points: 2, ee: 'cb2' },
    { id: 'arrest', type: 'check', label: 'Presentation as cardiac arrest', points: 3, ee: 'cb3' },
    { id: 'anterior', type: 'check', label: 'Anterior myocardial infarction', points: 1, ee: 'cb4' },
    { id: 'delay', type: 'check', label: 'First medical contact to primary PCI more than 90 minutes', points: 2, ee: 'cb5' },
    { id: 'hr', type: 'check', label: 'Heart rate above 90 beats/min on admission', points: 3, ee: 'cb7' },
    { id: 'pressure', type: 'check', label: 'Systolic BP below 125 mm Hg and pulse pressure below 45 mm Hg on admission', points: 4, ee: 'cb8' },
    { id: 'leftMain', type: 'check', label: 'Culprit lesion in the left main coronary artery', points: 5, ee: 'cb9' },
    { id: 'timi', type: 'check', label: 'TIMI flow below 3 after primary PCI', points: 5, ee: 'cb10' },
    { id: 'glucose', type: 'check', label: 'Blood glucose above 10 mmol/L (180 mg/dL)', points: 3, ee: 'cb6' }
  ],
  points: { label: 'ORBI score', max: 36 },
  compute(a) {
    const s = pointsOf(tool, a);
    const r = s <= 7 ? [1, '1.3%'] : s <= 10 ? [2, '6.6%'] : s <= 12 ? [3, '11.7%'] : [4, '31.8%'];
    return { level: r[0], headline: `Risk of in-hospital cardiogenic shock: ${r[1]}` };
  }
};
