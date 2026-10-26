// ICD implantation: complications or death (NCDR ICD Registry; Haines 2011; EE+ 456).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'icd-risk',
  eeId: 456,
  title: 'ICD implantation risk score',
  subtitle: 'Procedural complications or death after ICD implantation',
  question: 'For a patient having an implantable cardioverter-defibrillator placed, what is the risk of an in-hospital complication or death?',
  inputs: [
    { id: 'nyha', type: 'choice', label: 'NYHA class', ee: 'NYHA', options: [{ label: 'Class I or II', points: 0 }, { label: 'Class III', points: 1 }, { label: 'Class IV', points: 3 }] },
    { id: 'type', type: 'choice', label: 'ICD type', ee: ['ICDDUAL', 'ICDBIV'], options: [
      { label: 'Single chamber', points: 0 }, { label: 'Dual chamber', points: 2 }, { label: 'Biventricular', points: 4 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'reimplant', type: 'check', label: 'Previous ICD, reimplanted for a reason other than battery end of life', points: 6, ee: 'ICD' },
    { id: 'valve', type: 'check', label: 'Previous valve surgery', points: 3, ee: 'SURGERY' },
    { id: 'nonelective', type: 'check', label: 'Non-elective implantation (admitted for another reason)', points: 3, ee: 'NONELECTIVE' },
    { id: 'female', type: 'check', label: 'Female', points: 2, ee: 'FEMALE' },
    { id: 'lung', type: 'check', label: 'Chronic lung disease', points: 2, ee: 'LUNG' },
    { id: 'bun', type: 'check', label: 'BUN above 30 mg/dL (10.7 mmol/L)', points: 2, ee: 'BUN' },
    { id: 'age', type: 'check', label: 'Age 70 or older', points: 1, ee: 'AGE' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation or flutter', points: 1, ee: 'AFIB' }
  ],
  points: { label: 'Score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 10 ? { level: 1, headline: 'Low risk: 1.3% complications or death' }
      : s < 15 ? { level: 2, headline: 'Moderate risk: 3.9% complications or death' }
      : { level: 3, headline: 'High risk: 5.1% complications or death' };
  },
  evidence: { reference: 'Haines DE, Wang Y, Curtis J. Implantable cardioverter-defibrillator registry risk score models for acute procedural complications or death after implantable cardioverter-defibrillator implantation. Circulation. 2011;123(19):2069-2076.' }
};
