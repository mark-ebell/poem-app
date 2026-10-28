// ARISCAT postoperative pulmonary complications (Canet 2010, validated by Mazo 2014; EE+ 643). EE+ put a
// score of 26 in the low-risk group; the published intermediate group is 26 to 44.
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'ariscat',
  eeId: 643,
  title: 'Risk of pulmonary complications following surgery (ARISCAT score)',
  subtitle: 'In-hospital postoperative pulmonary complications',
  question: 'For a patient undergoing surgery, what is the risk of in-hospital pulmonary complications?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', options: [{ label: '50 years or under', points: 0 }, { label: '51 to 80 years', points: 3 }, { label: 'Over 80 years', points: 16 }] },
    { id: 'spo2', type: 'choice', label: 'Preoperative SpO₂', ee: 'cboSPO2', options: [{ label: '96% or more', points: 0 }, { label: '91% to 95%', points: 8 }, { label: '90% or less', points: 24 }] },
    { id: 'incision', type: 'choice', label: 'Surgical incision', ee: 'cboDuration', options: [{ label: 'Peripheral', points: 0 }, { label: 'Upper abdominal', points: 15 }, { label: 'Intrathoracic', points: 24 }] },
    { id: 'duration', type: 'choice', label: 'Duration of surgery', ee: 'cboIncision', options: [{ label: 'Under 2 hours', points: 0 }, { label: '2 to 3 hours', points: 16 }, { label: 'Over 3 hours', points: 23 }] },
    { id: 'infection', type: 'check', label: 'Respiratory infection in the last month', points: 17, ee: 'chkInfection' },
    { id: 'anemia', type: 'check', label: 'Preoperative anemia (Hb 10 g/dL or less)', points: 11, ee: 'chkAnemia' },
    { id: 'emergency', type: 'check', label: 'Emergency procedure', points: 8, ee: 'chkEmergency' }
  ],
  points: { label: 'ARISCAT score', max: 123 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 26 ? { level: 1, headline: 'Low risk: 3.4% with a pulmonary complication in hospital' } : s <= 44 ? { level: 2, headline: 'Intermediate risk: 13.0% with a pulmonary complication in hospital' } : { level: 4, headline: 'High risk: 38.0% with a pulmonary complication in hospital' };
  }
};
