// Severe lower GI bleeding (Strate 2003; EE+ 220).
module.exports = {
  id: 'strate-lgib',
  eeId: 220,
  title: 'Severe lower GI bleeding (Strate)',
  subtitle: 'Severe bleeding in acute lower GI bleeding',
  question: 'For a patient with acute lower GI bleeding (no upper source, under 3 days, not scant or occult), how likely is severe bleeding?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'hr', type: 'check', label: 'Heart rate 100/min or more', ee: 'CHK_HeartRate' },
    { id: 'sbp', type: 'check', label: 'Systolic BP 115 mm Hg or less', ee: 'CHK_BP' },
    { id: 'syncope', type: 'check', label: 'Syncope', ee: 'CHK_Syncope' },
    { id: 'nontender', type: 'check', label: 'Non-tender abdominal exam', ee: 'CHK_Exam' },
    { id: 'early', type: 'check', label: 'Rectal bleeding within 4 hours of evaluation', ee: 'CHK_Bleed' },
    { id: 'aspirin', type: 'check', label: 'Aspirin in the past week', ee: 'CHK_Aspirin' },
    { id: 'comorbid', type: 'check', label: 'More than 2 comorbid illnesses', ee: 'CHK_Comorbid',
      note: 'MI, peripheral arterial disease, COPD, hemiplegia, dementia, renal disease, heart failure, cerebrovascular disease, ulcer, collagen vascular disease, AIDS, diabetes, liver disease, cancer.' }
  ],
  footnote: 'Severe bleeding: transfusion of 2 or more units, or a fall in hematocrit of 20% or more, or recurrent bleeding after 24 hours of stability.',
  compute(a) {
    const n = a.hr + a.sbp + a.syncope + a.nontender + a.early + a.aspirin + a.comorbid;
    const r = n < 1 ? [1, 'Low risk', '6%'] : n < 4 ? [2, 'Moderate risk', '43%'] : [4, 'High risk', '79%'];
    return { score: { value: n, max: 7, label: 'Risk factors' }, level: r[0], headline: `${r[1]}: ${r[2]} severe bleeding` };
  }
};
