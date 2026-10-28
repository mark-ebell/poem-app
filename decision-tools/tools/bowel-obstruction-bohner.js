// Bowel obstruction in acute abdominal pain (Böhner 1998; EE+ 131).
const { count } = require('../lib');
module.exports = {
  id: 'bowel-obstruction-bohner',
  eeId: 131,
  title: 'Bowel obstruction diagnosis: need for x-ray',
  subtitle: 'Bowel obstruction in acute abdominal pain',
  question: 'For a patient with acute abdominal pain and no suspicion of perforation, what is the risk of bowel obstruction?',
  inputs: [
    { id: 'distended', type: 'check', label: 'Distended abdomen', ee: 'IDC_Check1_ID' },
    { id: 'sounds', type: 'check', label: 'Increased bowel sounds', ee: 'IDC_Check2_ID' },
    { id: 'constipation', type: 'check', label: 'History of constipation', ee: 'IDC_Check3_ID' },
    { id: 'surgery', type: 'check', label: 'Previous abdominal surgery', ee: 'IDC_Check5_ID' },
    { id: 'age', type: 'check', label: 'Age over 50 years', ee: 'IDC_Check6_ID' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', ee: 'IDC_Check7_ID' }
  ],
  compute(a) {
    const n = count(a, ['distended', 'sounds', 'constipation', 'surgery', 'age', 'vomiting']);
    return n >= 2 ? { level: 3, headline: '2 or more findings: risk of bowel obstruction 25%' } : { level: 1, headline: 'Fewer than 2 findings: risk of bowel obstruction 0% to 3%' };
  }
};
