// Kocher criteria: septic arthritis of the hip in children (Kocher 2004; EE+ 288).
const P = ['2%', '9%', '35%', '73%', '93%'];

module.exports = {
  id: 'kocher-septic-hip',
  eeId: 288,
  title: 'Septic arthritis of the hip in children (Kocher)',
  subtitle: 'Septic arthritis vs transient synovitis in the irritable hip',
  question: 'For a child with an acutely irritable hip, how likely is septic arthritis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fever', type: 'check', label: 'History of fever (oral temperature above 38.5°C / 101.3°F)', ee: 'IDC_CHECKBOX_1' },
    { id: 'nwb', type: 'check', label: 'Non-weight-bearing', ee: 'IDC_CHECKBOX_2' },
    { id: 'esr', type: 'check', label: 'ESR 40 mm/h or more', ee: 'IDC_CHECKBOX_3' },
    { id: 'wbc', type: 'check', label: 'White cell count above 12,000/µL', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const n = a.fever + a.nwb + a.esr + a.wbc;
    return { score: { value: n, max: 4, label: 'Criteria' }, level: [1, 2, 3, 4, 4][n], headline: `${P[n]} had septic arthritis` };
  }
};
