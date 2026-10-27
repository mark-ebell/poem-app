// SARS during an outbreak (Leung 2004; EE+ 281). Two steps: clinical findings, then laboratory findings.
module.exports = {
  id: 'sars-leung',
  eeId: 281,
  title: 'SARS diagnosis during an outbreak (Leung)',
  subtitle: 'Severe acute respiratory syndrome in an outbreak triage clinic',
  question: 'During a SARS outbreak, how likely is SARS in a patient at a triage clinic?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'COMBO_Age', default: 1, options: [{ label: 'Under 18' }, { label: '18 to 64' }, { label: '65 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    ...[['contact', 'Contact with a SARS patient', 'CHK_Contact'], ['fever', 'Fever', 'CHK_Fever'], ['myalgia', 'Myalgia', 'CHK_Myalgia'], ['malaise', 'Malaise', 'CHK_Malaise'],
      ['sputum', 'Sputum', 'CHK_Sputum'], ['abdo', 'Abdominal pain', 'CHK_AbPain'], ['throat', 'Sore throat', 'CHK_Throat'], ['rhinorrhea', 'Rhinorrhea', 'CHK_Rhinorrhea']]
      .map(([id, label, ee]) => ({ id, type: 'check', label, ee })),
    { id: 'xray', type: 'choice', label: 'Chest x-ray', ee: 'COMBO_Xray', when: a => tool.clinical(a) > -3, options: [{ label: 'Normal' }, { label: 'Haziness' }, { label: 'Pneumonia' }] },
    { id: 'lymph', type: 'choice', label: 'Lymphocyte count', ee: 'COMBO_Lymphocyte', default: 1, when: a => tool.clinical(a) > -3, options: [{ label: 'Under 1.5 × 10⁹/L' }, { label: '1.5 to 4' }, { label: 'Over 4' }] },
    { id: 'neut', type: 'choice', label: 'Neutrophil count', ee: 'COMBO_Neutrophil', default: 1, when: a => tool.clinical(a) > -3, options: [{ label: 'Under 2 × 10⁹/L' }, { label: '2 to 7.5' }, { label: 'Over 7.5' }] },
    { id: 'plt', type: 'choice', label: 'Platelet count', ee: 'COMBO_Platelet', default: 1, when: a => tool.clinical(a) > -3, options: [{ label: 'Under 150 × 10⁹/L' }, { label: '150 to 400' }, { label: 'Over 400' }] }
  ],
  clinical: a => [-1, 0, -5][a.age] + 8 * !!a.contact + 15 * !!a.fever + 3 * !!a.myalgia + 3 * !!a.malaise - 4 * !!a.sputum - 8 * !!a.abdo - 5 * !!a.throat - 4 * !!a.rhinorrhea,
  compute(a) {
    if (tool.clinical(a) <= -3) return { level: 1, headline: 'Lowest risk (group I): 4.4% (95% CI 3.1 to 6.0%)', lines: ['No laboratory tests needed for this estimate.'] };
    const s = [-1, 0, -6][a.age] + 7 * a.contact + 5 * a.fever - 4 * a.sputum + [0, 8, 8][a.xray] + [5, 0, 5][a.lymph] + [4, 0, -5][a.neut] + [5, 0, -5][a.plt];
    const g = s < 8 ? [1, 'Lowest risk (group I)', '4.4% (95% CI 3.1 to 6.0%)'] : s < 13 ? [2, 'Risk group II', '21% (95% CI 16 to 27%)'] : s < 16 ? [3, 'Risk group III', '40% (95% CI 31 to 49%)']
      : s < 19 ? [3, 'Risk group IV', '61% (95% CI 54 to 68%)'] : [4, 'Risk group V', '80% (95% CI 72 to 86%)'];
    return { level: g[0], headline: `${g[1]}: ${g[2]}` };
  }
};
const tool = module.exports;
