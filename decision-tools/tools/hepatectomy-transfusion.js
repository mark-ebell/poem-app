// Transfusion after liver resection (Pulitano 2007; EE+ 384).
const OUT = ['3 of 80 (3%)', '28 of 54 (52%), median 1 unit', '12 of 17 (71%), median 2 units', '5 of 6 (83%), median 3 units', '3 of 3 (100%), median 4 units'];

module.exports = {
  id: 'hepatectomy-transfusion',
  eeId: 384,
  title: 'Transfusion risk in liver resection (Pulitano)',
  subtitle: 'Perioperative blood transfusion in liver surgery',
  question: 'For a patient having liver resection, what is the risk of needing a blood transfusion?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'hb', type: 'check', label: 'Preoperative hemoglobin 12.5 g/dL or less', ee: 'CHK_Hemoglobin' },
    { id: 'cava', type: 'check', label: 'Exposure of the vena cava', ee: 'CHK_Exposure' },
    { id: 'cirrhosis', type: 'check', label: 'Cirrhosis', ee: 'CHK_Cirrhosis' },
    { id: 'other', type: 'check', label: 'Another surgical procedure at the same time', ee: 'CHK_Surgical' },
    { id: 'tumor', type: 'check', label: 'Largest tumor over 4 cm', ee: 'CHK_Tumor' }
  ],
  compute(a) {
    const s = a.hb + a.cava + a.cirrhosis + a.other + a.tumor;
    return { score: { value: s, max: 5, label: 'Score' }, headline: `Transfused: ${OUT[Math.max(0, s - 1)]}` };
  }
};
