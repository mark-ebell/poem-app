// ROSE rule: serious outcome or death within 30 days of syncope (Reed 2010; EE+ 438). Wording as in EE+.
module.exports = {
  id: 'rose-syncope',
  eeId: 438,
  title: 'Syncope prognosis (ROSE rule)',
  subtitle: 'Serious outcome or death within 30 days of syncope',
  question: 'For a patient in the ED with syncope, what is the risk of a serious outcome or death within 30 days?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bnp', type: 'check', label: 'BNP 300 pg/mL or more', ee: 'BNP' },
    { id: 'brady', type: 'check', label: 'Heart rate 50 or less in the ED or before hospital', ee: 'BRADYCARDIA' },
    { id: 'fobt', type: 'check', label: 'Fecal occult blood on rectal exam', ee: 'BLEED' },
    { id: 'hb', type: 'check', label: 'Hemoglobin 9 g/dL or less', ee: 'HEMOGLOBIN' },
    { id: 'chest', type: 'check', label: 'Chest pain with the syncope', ee: 'CHEST_PAIN' },
    { id: 'q', type: 'check', label: 'Q wave on ECG (not in lead III)', ee: 'QWAVE' },
    { id: 'sat', type: 'check', label: 'Oxygen saturation 94% or less on room air', ee: 'O2SAT' }
  ],
  compute(a) {
    return a.bnp || a.brady || a.fobt || a.hb || a.chest || a.q || a.sat ? { level: 3, headline: 'High risk, consider admission: 16.5% had a serious outcome at 30 days' }
      : { level: 1, headline: 'Low risk: 1.5% had a serious outcome at 30 days' };
  }
};
