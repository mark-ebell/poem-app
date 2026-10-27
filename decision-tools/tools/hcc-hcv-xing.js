// Hepatocellular cancer risk in hepatitis C (Xing 2017; EE+ 571).
const MEN = ['0.3', '0.4', '0.5', '0.6', '0.8', '1.0', '1.3', '1.7', '2.2', '2.9', '3.8', '4.9', '6.3', '8.1', '10.4', '13.3', '17.0', 'over 21.4']; // -3 to 14
const WOMEN = ['0.1', '0.1', '0.2', '0.3', '0.4', '0.5', '0.7', '1.0', '1.3', '1.8', '2.3', '3.4', '4.7', '6.4', '8.7', 'over 11.7']; // -3 to 12

module.exports = {
  id: 'hcc-hcv-xing',
  eeId: 571,
  title: 'Hepatocellular cancer risk in hepatitis C (Xing)',
  subtitle: '5-year risk of hepatocellular carcinoma in chronic hepatitis C',
  question: 'For a patient with chronic hepatitis C, what is the 5-year risk of hepatocellular carcinoma?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'radio_Male', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: ['20 to 24', '25 to 29', '30 to 34', '35 to 39', '40 to 44', '45 to 49', '50 to 54', '55 to 59', '60 to 64', '65 to 69', '70 to 74', '75 to 79', '80 to 84', '85 or older'].map(label => ({ label })) },
    { id: 'treatment', type: 'choice', label: 'Treatment history', ee: 'ddl2', options: [{ label: 'Never treated' }, { label: 'Interferon failure' }, { label: 'Sustained virologic response' }] },
    { id: 'ast', type: 'number', label: 'AST', unit: 'IU/L', min: 1, max: 2000, step: 1, ee: 'txt_AST' },
    { id: 'uln', type: 'number', label: 'Upper limit of normal for AST', unit: 'IU/L', min: 10, max: 200, step: 1, default: 40, ee: 'txt_ULN' },
    { id: 'plt', type: 'number', label: 'Platelet count', unit: '× 10⁹/L', min: 1, max: 2000, step: 1, ee: 'txt_PlateletCount', note: 'Normal range 150 to 450.' },
    { type: 'heading', label: 'Check if present' },
    { id: 'alcohol', type: 'check', label: 'Alcohol use disorder', ee: 'cb1' }
  ],
  compute(a) {
    const apri = (a.ast / a.uln / a.plt) * 100, male = a.sex === 0;
    const band = apri <= 1 ? 0 : apri <= 2 ? 1 : apri <= 4 ? 2 : apri <= 5 ? 3 : 4;
    const s = (a.age - 3) + 2 * a.alcohol + (male ? [0, 4, 5, 6, 8] : [0, 5, 6, 7, 8])[band] + (male ? [1, 4, 0] : [0, 2, 0])[a.treatment];
    const table = male ? MEN : WOMEN, risk = table[Math.min(table.length - 1, Math.max(0, s + 3))];
    return { score: { value: s, label: `Score (range −3 to ${male ? 14 : 12})` }, headline: `5-year risk of hepatocellular carcinoma: ${risk}%`, lines: [`APRI ${apri.toFixed(2)}`] };
  }
};
