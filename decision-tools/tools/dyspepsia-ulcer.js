// Probability of peptic ulcer in dyspepsia (Spiegelhalter 1987; EE+ 46). Each finding adds one weight
// when present and another when absent; probability = logistic(sum / 100), from a baseline of 40%.
const ITEMS = [ // id, label, EE+ id, weight if present, weight if absent
  ['male', 'Male', 'IDC_Check_ID1', 30, -33], ['vomiting', 'Vomiting', 'IDC_Check_ID2', 5, -2], ['short', 'Symptoms for less than 2 years', 'IDC_Check_ID3', 38, -40],
  ['episodic', 'Episodic pain', 'IDC_Check_ID4', 13, -25], ['epigastric', 'Pain in the epigastrium', 'IDC_Check_ID5', 26, -29], ['food', 'Food relieves the pain', 'IDC_Check_ID6', 72, -22],
  ['night', 'Waking at night, relieved by food', 'IDC_Check_ID7', 51, -23], ['pain', 'Pain is the main symptom', 'IDC_Check_ID8', 3, -27], ['family', 'Family history of ulcer', 'IDC_Check_ID9', 24, -15],
  ['appetite', 'Loss of appetite', 'IDC_Check_ID10', 18, -14], ['heartburn', 'Heartburn', 'IDC_Check_ID11', 5, -8], ['flatulence', 'Flatulence', 'IDC_Check_ID12', 4, -5],
  ['smoker', 'Smoker', 'IDC_Check_ID13', 31, -51], ['waterbrash', 'Waterbrash', 'IDC_Check_ID14', 38, -18]
];

module.exports = {
  id: 'dyspepsia-ulcer',
  eeId: 46,
  title: 'Dyspepsia: probability of peptic ulcer',
  subtitle: 'Peptic ulcer in patients referred for endoscopy for dyspepsia',
  question: 'For an adult with dyspepsia referred for endoscopy, how likely is a peptic ulcer?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))],
  footnote: 'Based on a baseline prevalence of ulcer of 40%.',
  compute(a) {
    const s = ITEMS.reduce((t, [id, , , yes, no]) => t + (a[id] ? yes : no), 0);
    return { headline: `Probability of peptic ulcer: ${Math.trunc(100 / (1 + Math.exp(-s / 100)))}%` };
  },
  evidence: { reference: 'Spiegelhalter DJ, Crean GP, Holden R, Knill-Jones RP. Taking a calculated risk: predictive scoring systems in dyspepsia. Scand J Gastroenterol Suppl. 1987;128:152-160.' }
};
