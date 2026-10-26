// ORBIT bleeding score in atrial fibrillation (O'Brien; EE+ 541).
const RATE = ['1.7', '2.3', '2.9', '4.7', '6.8', '10.2', '10.2', '10.2'];
module.exports = {
  id: 'orbit-bleeding',
  eeId: 541,
  title: 'ORBIT bleeding score',
  subtitle: 'Major bleeding with anticoagulation for atrial fibrillation',
  question: 'For a patient with atrial fibrillation taking an anticoagulant, what is the risk of major bleeding?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 74', points: 1, ee: 'AGE' },
    { id: 'anemia', type: 'check', label: 'Anemia: history of anemia, or hemoglobin below 13 g/dL (men) or 12 g/dL (women), or hematocrit below 40% (men) or 36% (women)', points: 2, ee: 'ANEMIA' },
    { id: 'bleed', type: 'check', label: 'History of GI bleeding, intracranial bleeding or hemorrhagic stroke', points: 2, ee: 'BLEED' },
    { id: 'renal', type: 'check', label: 'Impaired renal function (eGFR below 60 mL/min/1.73 m²)', points: 1, ee: 'RENAL' },
    { id: 'antiplatelet', type: 'check', label: 'Taking an antiplatelet agent', points: 1, ee: 'AGENT' }
  ],
  points: { label: 'ORBIT score', max: 7 },
  compute(a) {
    const s = a.age + 2 * a.anemia + 2 * a.bleed + a.renal + a.antiplatelet;
    return { level: s <= 2 ? 1 : s === 3 ? 2 : s === 4 ? 3 : 4, headline: `${RATE[s]} major bleeds per 100 patient-years` };
  }
};
