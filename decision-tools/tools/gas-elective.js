// Glasgow Aneurysm Score for elective AAA repair, open or endovascular (DREAM trial: Baas 2008; EE+ 481).
module.exports = {
  id: 'gas-elective',
  eeId: 481,
  title: 'Glasgow Aneurysm Score (elective AAA repair)',
  subtitle: '30-day and 2-year mortality after elective open or endovascular repair',
  question: 'For a patient having elective repair of an abdominal aortic aneurysm, what are the risks of death at 30 days and 2 years?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'AGE' },
    { id: 'repair', type: 'choice', label: 'Type of repair', ee: 'TYPESURGERY', options: [{ label: 'Open surgery' }, { label: 'Endovascular repair (EVAR)' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'cardiac', type: 'check', label: 'Myocardial disease (previous MI, angina or coronary heart disease)', ee: 'MI' },
    { id: 'cva', type: 'check', label: 'Cerebrovascular disease (any stroke or TIA)', ee: 'STROKE' },
    { id: 'renal', type: 'check', label: 'Renal disease (creatinine above 150 µmol/L or 1.7 mg/dL, creatinine clearance below 50 mL/min, or a history of renal failure)', ee: 'RENAL' }
  ],
  compute(a) {
    const s = Math.trunc(a.age) + 7 * a.cardiac + 10 * a.cva + 14 * a.renal;
    const [d30, d2y] = a.repair === 0
      ? [s < 75.5 ? '2 of 92 (2%)' : '6 of 82 (7%)', s < 74.5 ? '4 of 83 (5%)' : '14 of 86 (16%)']
      : [s < 86.5 ? '0 of 144 (0%)' : '2 of 27 (7%)', s < 77.5 ? '2 of 96 (2%)' : '16 of 74 (22%)'];
    return { score: { value: s, label: 'Glasgow Aneurysm Score' }, headline: `30-day mortality ${d30}`, lines: [`2-year mortality ${d2y}`] };
  }
};
