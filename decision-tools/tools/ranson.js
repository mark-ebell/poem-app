// Ranson criteria for acute pancreatitis (Ranson 1982; EE+ 137).
const ITEMS = [ // id, label, EE+ id
  ['age', 'Age over 55', 'IDC_Check1_ID'], ['wbc', 'White cell count above 16,000/µL', 'IDC_Check2_ID'], ['glucose', 'Glucose above 200 mg/dL', 'IDC_Check3_ID'],
  ['ldh', 'LDH above 350 IU/L', 'IDC_Check4_ID'], ['ast', 'AST above 250 IU/L', 'IDC_Check5_ID'],
  ['hct', 'Hematocrit falls by more than 10 percentage points', 'IDC_Check6_ID'], ['bun', 'BUN rises by more than 5 mg/dL', 'IDC_Check7_ID'], ['base', 'Base deficit above 4 mEq/L', 'IDC_Check8_ID'],
  ['ca', 'Calcium below 8 mg/dL', 'IDC_Check9_ID'], ['fluid', 'Fluid sequestration above 6000 mL', 'IDC_Check10_ID'], ['po2', 'PaO2 below 60 mm Hg', 'IDC_Check11_ID']
];

module.exports = {
  id: 'ranson',
  eeId: 137,
  title: 'Ranson criteria (acute pancreatitis)',
  subtitle: 'Severity and mortality of acute pancreatitis',
  question: 'For a patient with acute pancreatitis, what is the risk of death?',
  inputs: [
    { type: 'heading', label: 'On admission: check all that apply' },
    ...ITEMS.slice(0, 5).map(([id, label, ee]) => ({ id, type: 'check', label, ee })),
    { type: 'heading', label: 'During the first 48 hours: check all that apply' },
    ...ITEMS.slice(5).map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const s = ITEMS.filter(([id]) => a[id]).length;
    const mort = s <= 2 ? '1%' : s <= 4 ? '16%' : s <= 6 ? '40%' : '100%';
    return { score: { value: s, max: 11, label: 'Ranson score' }, headline: `Mortality: ${mort}` };
  }
};
