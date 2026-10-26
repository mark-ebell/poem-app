// Recurrence after unprovoked VTE in men (Rodger 2008; EE+ 376).
module.exports = {
  id: 'vte-recurrence-men',
  eeId: 376,
  title: 'VTE recurrence risk in men',
  subtitle: 'Recurrence after unprovoked VTE (Rodger)',
  question: 'For a man with a first unprovoked DVT or PE and no known major thrombophilia, what is the annual risk of recurrence?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'skin', type: 'check', label: 'Hyperpigmentation, edema or redness of either leg', points: 1, ee: 'CHK_Hyper' },
    { id: 'apl', type: 'check', label: 'Antiphospholipid antibodies 6 U/mL or higher', points: 1, ee: 'CHK_Antibodies' },
    { id: 'hgb', type: 'check', label: 'Hemoglobin 170 g/L or higher', points: 1, ee: 'CHK_Hemoglobin' }
  ],
  points: { label: 'Score', max: 3 },
  compute(a) {
    return a.skin + a.apl + a.hgb < 2
      ? { level: 2, headline: 'Low risk', lines: ['3.7% annual recurrence risk (29% of patients were in this group).'] }
      : { level: 4, headline: 'High risk', lines: ['18.8% annual recurrence risk (71% of patients were in this group).'] };
  }
};
