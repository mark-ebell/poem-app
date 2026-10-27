// Bacterial meningitis in children with meningeal signs (Oostenbrink 2004; EE+ 416).
module.exports = {
  id: 'meningeal-signs-lp',
  eeId: 416,
  title: 'Need for LP in children with meningeal signs (Oostenbrink)',
  subtitle: 'Bacterial meningitis in children 1 month to 15 years with meningeal signs',
  question: 'For a child with meningeal signs, how likely is bacterial meningitis?',
  inputs: [
    { id: 'days', type: 'choice', label: 'Duration of the main problem', ee: 'CMB_Days', options: ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days', '8 days', '9 days', '10 days or more'].map(label => ({ label })) },
    { id: 'crp', type: 'choice', label: 'C-reactive protein', ee: 'CMB_CRP', options: ['Under 50 mg/L', '50 to 99', '100 to 149', '150 to 199', '200 or more'].map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'vomiting', type: 'check', label: 'History of vomiting', ee: 'CHK_Vomiting' },
    { id: 'cyanosis', type: 'check', label: 'Cyanosis', ee: 'CHK_Cyanosis' },
    { id: 'consciousness', type: 'check', label: 'Disturbed consciousness', ee: 'CHK_Dist' },
    { id: 'meningeal', type: 'check', label: 'Meningeal irritation', ee: 'CHK_Menin',
      note: "Brudzinski's or Kernig's sign, tripod position, or neck stiffness; in infants, irritability on moving the head or legs, or a bulging fontanel." },
    { id: 'petechiae', type: 'check', label: 'Petechiae', ee: 'CHK_Pete' }
  ],
  compute(a) {
    const s = 2 * a.vomiting + 6.5 * a.cyanosis + 8 * a.consciousness + 7.5 * a.meningeal + 4 * a.petechiae + (a.days + 1) + a.crp / 2;
    const r = s < 8.5 ? [1, 'Low risk', '0 of 205 (0%, 95% CI 0 to 2%)'] : s < 15 ? [2, 'Moderate risk', '32 of 251 (13%, 95% CI 9 to 17%)'] : s < 20 ? [3, 'High risk', '31 of 60 (52%, 95% CI 39 to 65%)'] : [4, 'Very high risk', '61 of 70 (87%, 95% CI 79 to 95%)'];
    return { score: { value: s, label: 'Score' }, level: r[0], headline: `${r[1]}: ${r[2]} had bacterial meningitis` };
  }
};
