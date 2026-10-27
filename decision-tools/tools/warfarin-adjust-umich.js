// Warfarin dose adjustment for a target INR of 2.5 (University of Michigan anticoagulation service; EE+ 213). Wording as in EE+.
const ACTION = [
  'Increase the dose 10% to 20%; consider an extra dose. Next INR in 4 to 8 days.',
  'Increase the dose 5% to 10%; if the INR is 1.8 to 1.9, consider no change with a repeat INR in 7 to 14 days. Next INR in 7 to 14 days.',
  null,
  'Decrease the dose 5% to 10%; if the INR is 3.1 to 3.2, consider no change with a repeat INR in 7 to 14 days. Next INR in 7 to 14 days.',
  'Hold 0 to 1 day and decrease the dose 10%. Next INR in 4 to 8 days.',
  'Hold 1 to 2 days and decrease the dose 5% to 15%. Next INR in 1 to 5 days.'
];
const IN_RANGE = ['No change. Repeat the INR in 5 to 10 days.', 'No change. Repeat the INR in 2 weeks.', 'No change. Repeat the INR in 3 weeks.',
  'No change. Repeat the INR in 4 weeks. If 2.0 to 2.1 or 2.9 to 3.0, consider a repeat INR in 2 to 3 weeks.'];
const HIGH = [null, 'Vitamin K1 3 to 5 mg orally; monitor the INR closely; if it is not substantially lower by 24 hours, repeat the vitamin K1.',
  'Vitamin K1 10 mg by slow IV infusion, with fresh plasma or prothrombin complex concentrate depending on urgency; vitamin K1 may be needed every 12 hours.',
  'Vitamin K1 10 mg by slow IV infusion, with fresh plasma or prothrombin complex concentrate depending on urgency; vitamin K1 may be needed every 12 hours.'];
const RISK = ['Omit the next 1 to 2 doses, monitor the INR more often, and resume at a lower dose when the INR is 2.0 to 3.0.',
  'Omit the next dose and give vitamin K1 1.0 to 2.5 mg orally.', 'Vitamin K1 2 to 4 mg orally; if the INR remains high at 24 hours, give another 1 to 2 mg.'];

module.exports = {
  id: 'warfarin-adjust-umich',
  eeId: 213,
  title: 'Warfarin dose adjustment (target INR 2.5)',
  subtitle: 'Adjusting warfarin for a target INR of 2.0 to 3.0',
  question: 'For a patient on warfarin with a target INR of 2.5, how should the dose be adjusted?',
  inputs: [
    { id: 'inr', type: 'choice', label: "Patient's INR", ee: 'IDC_COMBOBOX_1', options: ['Under 1.5', '1.5 to 1.9', '2.0 to 3.0', '3.1 to 3.9', '4.0 to 4.9', '5.0 to 6.0', 'Over 6.0'].map(label => ({ label })) },
    { id: 'consecutive', type: 'choice', label: 'Number of consecutive INRs in range', ee: 'IDC_COMBOBOX_4', when: a => a.inr === 2, options: ['1', '2', '3', '4 or more'].map(label => ({ label })) },
    { id: 'situation', type: 'choice', label: 'Situation', ee: 'IDC_COMBOBOX_2', when: a => a.inr === 6, options: [
      { label: 'INR 6 to 9, no clinically significant bleeding' }, { label: 'INR over 9, no clinically significant bleeding' }, { label: 'Life-threatening bleeding' }, { label: 'Serious warfarin overdose' }] },
    { id: 'risk', type: 'choice', label: 'Bleeding risk', ee: 'IDC_COMBOBOX_3', when: a => a.inr === 6 && a.situation === 0, options: [
      { label: 'No additional risk factors for bleeding' }, { label: 'Increased risk of bleeding' }, { label: 'Needs rapid reversal before surgery' }] }
  ],
  compute(a) {
    if (a.inr === 2) return { headline: IN_RANGE[a.consecutive] };
    if (a.inr === 6) return { headline: a.situation === 0 ? RISK[a.risk] : HIGH[a.situation] };
    return { headline: ACTION[a.inr] };
  },
  evidence: { reference: 'University of Michigan Cardiovascular Anticoagulation Service dosing guideline (as archived on EE+).' }
};
