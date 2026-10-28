// Acute kidney injury needing dialysis after noncardiac surgery (Wilson 2021; EE+ 644).
const { pointsOf } = require('../lib');
const RISK = { 17: '14%', 18: '22%', 19: '33%', 20: '46%', 21: '60%', 22: '73%', 23: '82%', 24: '89%' };
const tool = module.exports = {
  id: 'aki-noncardiac-surgery',
  eeId: 644,
  title: 'Risk of acute kidney injury after non-cardiac surgery',
  subtitle: 'Acute kidney injury needing kidney replacement therapy',
  question: 'For a patient undergoing noncardiac surgery, what is the risk of acute kidney injury?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', default: 2, options: [{ label: 'Under 40 years', points: 3 }, { label: '40 to 70 years', points: 2 }, { label: 'Over 70 years', points: 0 }] },
    { id: 'male', type: 'check', label: 'Male sex', points: 1, ee: 'chkMale' },
    { id: 'surgery', type: 'choice', label: 'Type of surgery', ee: 'cboSurgery', options: [['Retroperitoneal or musculoskeletal', 0], ['Colorectal surgery', 4], ['Liver or pancreatic surgery', 4], ['Other abdominal surgery', 2], ['AAA surgery', 7], ['Other vascular surgery', 5], ['Thoracic surgery', 3]].map(([label, points]) => ({ label, points })) },
    { id: 'gfr', type: 'choice', label: 'eGFR (mL/min/1.73 m²)', ee: 'cboGFR', options: ['120 or more', '105 to 119', '90 to 104', '75 to 89', '60 to 74', '45 to 59', '30 to 44', '20 to 29', '10 to 19'].map((label, points) => ({ label, points })) },
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'cboHb', options: ['14.0 or more', '11.0 to 13.9', '6.0 to 10.9', '3.0 to 5.9'].map((label, points) => ({ label: `${label} g/dL`, points })) },
    { id: 'alb', type: 'choice', label: 'Albuminuria', ee: 'cboAlbumin', options: [{ label: 'None: dipstick protein negative or ACR < 30 mg/g', points: 0 }, { label: 'Mild: dipstick protein trace or 1+ or ACR 30 to 300 mg/g', points: 1 }, { label: 'Heavy: dipstick protein 2+ or ACR > 300 mg/g', points: 3 }] },
    { id: 'mi', type: 'check', label: 'Myocardial infarction', points: 1, ee: 'chkMI' },
    { id: 'liver', type: 'choice', label: 'Liver disease', ee: 'cboLiver', options: [{ label: 'No liver disease', points: 0 }, { label: 'Chronic liver disease or cirrhosis', points: 2 }, { label: 'Esophageal varices, encephalopathy, hepatorenal syndrome or portal hypertension', points: 4 }] }
  ],
  points: { label: 'Points', max: 30 },
  compute(a) {
    const s = pointsOf(tool, a);
    const r = s <= 7 ? '< 0.1%' : s <= 12 ? '0.1% to 1.0%' : s <= 16 ? '1% to 10%' : RISK[s] || '> 90%';
    return { level: s <= 12 ? 1 : s <= 16 ? 2 : s <= 20 ? 3 : 4, headline: `Risk of acute kidney injury ${r}` };
  }
};
