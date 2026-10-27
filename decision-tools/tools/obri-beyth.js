// Outpatient Bleeding Risk Index: 3- and 12-month risk (Beyth 1998; EE+ 385).
const OUT = { '000': ['1%', '3%'], '001': ['4%', '9%'], '010': ['3%', '7%'], '011': ['8%', '18%'], '100': ['4%', '9%'], '101': ['11%', '23%'], '110': ['8%', '19%'], '111': ['22%', '43%'] };

module.exports = {
  id: 'obri-beyth',
  eeId: 385,
  title: 'Outpatient Bleeding Risk Index (Beyth)',
  subtitle: 'Major bleeding at 3 and 12 months on warfarin',
  question: 'For a patient starting warfarin, what are the risks of major bleeding at 3 and 12 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'CHK_Age' },
    { id: 'stroke', type: 'check', label: 'History of stroke', ee: 'CHK_Stroke' },
    { id: 'gi', type: 'check', label: 'History of GI bleeding', ee: 'CHK_Bleeding' },
    { id: 'comorbid', type: 'check', label: 'Recent MI, hematocrit below 30%, creatinine above 1.5 mg/dL (133 µmol/L), or diabetes', ee: 'CHK_Comorbid' }
  ],
  compute(a) {
    const [m3, m12] = OUT[`${+(a.gi || a.stroke)}${+a.comorbid}${+a.age}`];
    return { headline: `Major bleeding: ${m3} at 3 months, ${m12} at 12 months` };
  }
};
