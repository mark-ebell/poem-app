// Light's criteria for pleural effusion (accuracy from Vives 1996; EE+ 320).
module.exports = {
  id: 'lights-criteria',
  eeId: 320,
  title: "Pleural effusion (Light's criteria)",
  subtitle: 'Exudate or transudate',
  question: 'For a patient with a pleural effusion, is it an exudate?',
  inputs: [
    { type: 'heading', label: 'Pleural fluid' },
    { id: 'pp', type: 'number', label: 'Protein', min: 0.1, max: 200, step: 0.1, ee: 'EDIT_PP', note: 'Any unit, as long as pleural and serum protein use the same one.' },
    { id: 'pldh', type: 'number', label: 'LDH', unit: 'U/L', min: 1, max: 20000, ee: 'EDIT_PLDH' },
    { type: 'heading', label: 'Serum' },
    { id: 'sp', type: 'number', label: 'Protein', min: 0.1, max: 200, step: 0.1, ee: 'EDIT_SP' },
    { id: 'sldh', type: 'number', label: 'LDH', unit: 'U/L', min: 1, max: 20000, ee: 'EDIT_SLDH' },
    { id: 'uln', type: 'number', label: 'Upper limit of normal for serum LDH', unit: 'U/L', min: 50, max: 2000, ee: 'EDIT_ULN' }
  ],
  footnote: "Light's criteria: an exudate has a pleural:serum protein ratio over 0.5, OR a pleural:serum LDH ratio over 0.6, OR a pleural LDH over two-thirds of the upper limit of normal for serum.",
  compute(a) {
    const ex = a.pp / a.sp > 0.5 || a.pldh > 0.66 * a.uln || a.pldh / a.sldh > 0.6;
    return { level: ex ? 3 : 1, headline: ex ? 'Exudate likely (95% probability given an overall risk of 80%)' : 'Exudate unlikely (7% probability given an overall risk of 80%)', lines: [{ label: 'Protein ratio', value: String(Math.round((a.pp / a.sp) * 100) / 100) }, { label: 'LDH ratio', value: String(Math.round((a.pldh / a.sldh) * 100) / 100) }] };
  }
};
