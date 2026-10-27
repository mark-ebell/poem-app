// Leiden prediction rule: rheumatoid arthritis at 1 year in undifferentiated arthritis (van der Helm-van Mil 2007; EE+ 365).
// The published rule gives 1 point for female sex, which EE+ left out; it is added here.
module.exports = {
  id: 'leiden-ra',
  eeId: 365,
  title: 'Rheumatoid arthritis prediction (Leiden rule)',
  subtitle: 'Progression of undifferentiated arthritis to rheumatoid arthritis',
  question: 'For a patient with recent-onset undifferentiated arthritis, what is the risk of rheumatoid arthritis at 1 year?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'TXT_Age' },
    { id: 'stiffness', type: 'choice', label: 'Morning stiffness (100 mm visual analog scale)', ee: 'CMB_Stiffness', options: [{ label: '0 to 25' }, { label: '26 to 90' }, { label: 'Over 90' }] },
    { id: 'tender', type: 'choice', label: 'Number of tender joints', ee: 'CMB_Tender', options: [{ label: 'Under 4' }, { label: '4 to 10' }, { label: 'Over 10' }] },
    { id: 'swollen', type: 'choice', label: 'Number of swollen joints', ee: 'CMB_Swollen', options: [{ label: 'Under 4' }, { label: '4 to 10' }, { label: 'Over 10' }] },
    { id: 'crp', type: 'choice', label: 'C-reactive protein', ee: 'CMB_CRP', options: [{ label: 'Under 5 mg/L' }, { label: '5 to 50 mg/L' }, { label: 'Over 50 mg/L' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female' },
    { id: 'rf', type: 'check', label: 'Rheumatoid factor positive', ee: 'CHK_RF' },
    { id: 'ccp', type: 'check', label: 'Anti-CCP antibody positive', ee: 'CHK_CCP' },
    { type: 'heading', label: 'Distribution of involved joints (check all that apply)' },
    { id: 'small', type: 'check', label: 'Small joints of the hands or feet', ee: 'CHK_SmallJoints' },
    { id: 'symmetric', type: 'check', label: 'Symmetrical distribution', ee: 'CHK_Symmetrical' },
    { id: 'upper', type: 'check', label: 'Upper extremities', ee: 'CHK_Upper' },
    { id: 'both', type: 'check', label: 'Both upper and lower extremities', ee: 'CHK_UpperLower' }
  ],
  compute(a) {
    const s = 0.02 * a.age + a.female + a.rf + 2 * a.ccp + 0.5 * a.small + 0.5 * a.symmetric + a.upper + 1.5 * a.both + a.stiffness + a.tender / 2 + a.swollen / 2 + [0, 0.5, 1.5][a.crp];
    const [level, label, p] = s <= 3.5 ? [1, 'Very low risk', '0%'] : s <= 6.5 ? [2, 'Low risk', '16%'] : s <= 8.5 ? [3, 'Moderate to high risk', '57%'] : [4, 'Very high risk', '85%'];
    return { score: { value: Number(s.toFixed(1)), label: 'Score' }, level, headline: `${label}: ${p} had rheumatoid arthritis at 1 year` };
  }
};
