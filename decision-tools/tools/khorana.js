// Khorana score: VTE in patients starting chemotherapy (Ay validation; EE+ 488).
module.exports = {
  id: 'khorana',
  eeId: 488,
  title: 'Khorana score',
  subtitle: 'Venous thromboembolism in patients receiving chemotherapy',
  question: 'For a patient starting chemotherapy, what is the risk of venous thromboembolism?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'veryHigh', type: 'check', label: 'Very high-risk cancer site (stomach, pancreas)', points: 2, ee: 'VERYHIGH' },
    { id: 'high', type: 'check', label: 'High-risk cancer site (lung, lymphoma, gynecologic, bladder, testicular)', points: 1, ee: 'HIGH' },
    { id: 'platelets', type: 'check', label: 'Pre-chemotherapy platelet count 350,000/mm³ or higher', points: 1, ee: 'PLATELET' },
    { id: 'hgb', type: 'check', label: 'Hemoglobin below 10 g/dL, or use of red cell growth factors', points: 1, ee: 'HEMOGLOBIN' },
    { id: 'wbc', type: 'check', label: 'Pre-chemotherapy leukocyte count above 11,000/mm³', points: 1, ee: 'LEUKOCYTE' },
    { id: 'bmi', type: 'check', label: 'Body mass index 35 kg/m² or higher', points: 1, ee: 'BMI' }
  ],
  points: { label: 'Khorana score', max: 7 },
  compute(a) {
    const s = 2 * a.veryHigh + a.high + a.platelets + a.hgb + a.wbc + a.bmi;
    const r = [[1, 'Low risk', '1.5%'], [2, 'Moderate risk', '3.8%'], [3, 'High risk', '9.6%'], [4, 'Very high risk', '17.7%']][Math.min(s, 3)];
    return { level: r[0], headline: r[1], lines: [{ label: 'VTE within 6 months', value: r[2] }] };
  }
};
