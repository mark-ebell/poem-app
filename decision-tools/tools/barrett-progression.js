// Progression of Barrett's esophagus (Weston 2004; EE+ 283).
const RISK = { long: [['Low risk', '6.8% (95% CI 0 to 14)', 1], ['Moderate risk', '35.0% (95% CI 14 to 56)', 3], ['High risk', '77.8% (95% CI 51 to 100)', 4]],
  short: [['Low risk', '2.4% (95% CI 0 to 5)', 1], ['Low risk', '5.3% (95% CI 0 to 12)', 1], ['High risk', '66.7% (95% CI 29 to 100)', 4]] };

module.exports = {
  id: 'barrett-progression',
  eeId: 283,
  title: "Barrett's esophagus progression (Weston)",
  subtitle: "Progression of Barrett's esophagus to cancer or high-grade dysplasia",
  question: "For a patient with Barrett's esophagus (without cancer, a dysplasia-associated lesion or mass, or multifocal high-grade dysplasia), what is the risk of progression?",
  inputs: [
    { id: 'dysplasia', type: 'choice', label: 'Dysplasia', ee: 'IDC_COMBOBOX_1', options: [{ label: 'None' }, { label: 'Low-grade dysplasia' }, { label: 'Unifocal high-grade dysplasia' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'long', type: 'check', label: "Initial length of Barrett's segment 6 cm or more", ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const [label, p, level] = RISK[a.long ? 'long' : 'short'][a.dysplasia];
    return { level, headline: `${label}: ${p}`, lines: ['Progression to cancer, a dysplasia-associated lesion or mass, or multifocal high-grade dysplasia over a mean of 6 years.'] };
  }
};
