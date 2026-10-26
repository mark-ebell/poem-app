// Ottawa Heart Failure Risk Scale (Stiell 2013; EE+ 496).
const RISK = [[1, 'Low', '2.8'], [2, 'Medium', '5.1'], [2, 'Medium', '9.2'], [3, 'High', '15.9'], [3, 'High', '26.1'], [4, 'Very high', '39.8'], [4, 'Very high', '55.3'], [4, 'Very high', '69.8'], [4, 'Very high', '81.2'], [4, 'Very high', '89.0']];
module.exports = {
  id: 'ottawa-hf',
  eeId: 496,
  title: 'Ottawa Heart Failure Risk Scale',
  subtitle: 'Serious adverse events in ED patients with heart failure',
  question: 'For a patient 50 or older in the ED with shortness of breath from heart failure, what is the risk of a serious adverse event?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'stroke', type: 'check', label: 'History of stroke or TIA', points: 1, ee: 'STROKE' },
    { id: 'intubation', type: 'check', label: 'History of intubation for respiratory distress', points: 2, ee: 'INTUBATION' },
    { id: 'hr', type: 'check', label: 'Heart rate 110 beats/min or higher on ED arrival', points: 2, ee: 'HRARRIVE' },
    { id: 'sat', type: 'check', label: 'Oxygen saturation below 90% on ED arrival', points: 1, ee: 'O2' },
    { id: 'walk', type: 'check', label: 'Heart rate 110 beats/min or higher during a 3-minute walk test, or too ill to do the walk test', points: 1, ee: 'HRWALK' },
    { id: 'ecg', type: 'check', label: 'Acute ischemic changes on the ECG', points: 2, ee: 'ECG' },
    { id: 'urea', type: 'check', label: 'Urea 12 mmol/L or higher', points: 1, ee: 'BUN' },
    { id: 'co2', type: 'check', label: 'Serum CO2 35 mmol/L or higher', points: 2, ee: 'SERUM' },
    { id: 'troponin', type: 'check', label: 'Troponin I or T elevated to the MI level', points: 2, ee: 'TROP' },
    { id: 'ntprobnp', type: 'check', label: 'NT-proBNP 5000 pg/mL or higher', points: 1, ee: 'NT' }
  ],
  points: { label: 'Ottawa HF score', max: 15 },
  footnote: 'Serious adverse event: death, intubation, admission to a monitored unit, or relapse requiring admission.',
  compute(a) {
    const s = a.stroke + 2 * (a.intubation + a.hr + a.ecg + a.co2 + a.troponin) + a.sat + a.walk + a.urea + a.ntprobnp;
    const r = RISK[Math.min(s, 9)];
    return { level: r[0], headline: `${r[1]} risk`, lines: [{ label: 'Serious adverse event', value: `${r[2]}%` }] };
  }
};
