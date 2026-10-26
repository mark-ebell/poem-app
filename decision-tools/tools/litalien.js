// Cardiac risk of vascular surgery, with and without dipyridamole-thallium results (L'Italien 1996; EE+ 29).
const CLINICAL = [[0.5, [1, 2, 3, 4, 5, 6, 7, 8]], [1, [1.5, 3, 4.5, 6.5, 7.5, 9.5, 11.5, 12.5]], [1.5, [3.5, 6.5, 9.5, 12.5, 15.5, 18, 21, 23.5]],
  [2, [5, 10, 14.5, 19, 23, 27, 30.5, 33.5]], [2.5, [8.5, 15.5, 22, 28, 33, 37.5, 42, 45.5]], [Infinity, [13, 23.5, 31.5, 38.5, 45, 50, 54, 58]]];
const THALLIUM = [[0.5, [1, 1, 2, 2.5, 3, 4, 4.5, 5.5]], [1, [1, 2, 3, 4, 5, 6.5, 7.5, 8.5]], [1.5, [2, 4, 6, 8.5, 10, 12.5, 14.5, 17]],
  [2, [3.5, 6, 9.5, 13, 16, 19, 22, 25]], [2.5, [5, 10, 15.5, 19.5, 23.5, 28, 31.5, 35.5]], [3, [8.5, 15.5, 22.5, 28.5, 33.5, 38.5, 43, 47]],
  [Infinity, [13, 22.5, 32, 39.5, 45.5, 50.5, 55.5, 59.5]]];
const look = (table, score, col) => table.find(([max]) => score <= max)[1][col];

module.exports = {
  id: 'litalien',
  eeId: 29,
  title: "Vascular surgery cardiac risk (L'Italien)",
  subtitle: 'Cardiac death or MI after vascular surgery, with or without thallium testing',
  question: 'For a patient having major vascular surgery, what is the risk of perioperative cardiac death or MI?',
  inputs: [
    { id: 'rate', type: 'choice', label: "Your institution's cardiac complication rate", ee: 'IDC_COMBOBOX_1', options: ['2%', '4%', '6%', '8%', '10%', '12%', '14%', '16%'].map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 70', ee: 'IDC_CHECKBOX_1' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'IDC_CHECKBOX_2' },
    { id: 'angina', type: 'check', label: 'Angina', ee: 'IDC_CHECKBOX_3' },
    { id: 'chf', type: 'check', label: 'Heart failure', ee: 'IDC_CHECKBOX_4' },
    { id: 'mi', type: 'check', label: 'Prior MI', ee: 'IDC_CHECKBOX_5' },
    { id: 'cabg', type: 'check', label: 'Coronary bypass within the past 5 years', ee: 'IDC_CHECKBOX_6' },
    { id: 'thallium', type: 'check', label: 'Dipyridamole-thallium stress test done', ee: 'IDC_CHECKBOX_7' },
    { id: 'thalliumResults', type: 'heading', label: 'Thallium results: check all that apply', when: a => a.thallium },
    { id: 'st', type: 'check', label: 'Ischemic ST changes (1 mm or more of ST depression)', ee: 'IDC_CHECKBOX_8', when: a => a.thallium },
    { id: 'fixed', type: 'check', label: 'Fixed defect', ee: 'IDC_CHECKBOX_9', when: a => a.thallium },
    { id: 'reversible', type: 'check', label: 'Reversible defect', ee: 'IDC_CHECKBOX_10', when: a => a.thallium }
  ],
  compute(a) {
    const s = Math.max(0, 0.5 * a.age + 0.8 * a.dm + 0.8 * a.angina + 0.6 * a.chf + 0.5 * a.mi - 2.2 * a.cabg);
    const risk = look(CLINICAL, s, a.rate);
    const out = { headline: `Risk of cardiac death or MI: ${risk}%`, lines: [`From clinical findings: ${risk}%`] };
    if (a.thallium) {
      const col = [3.75, 6.25, 8.75, 11.25, 13.75, 16.25, 18.75, Infinity].findIndex(m => risk <= m);
      const risk2 = look(THALLIUM, 1.2 * a.st + 0.8 * a.fixed + 1.3 * a.reversible, col);
      out.headline = `Risk of cardiac death or MI: ${risk2}%`;
      out.lines.push(`With the thallium results: ${risk2}%`);
    }
    return out;
  },
  evidence: { reference: "L'Italien GJ, Paul SD, Hendel RC, et al. Development and validation of a Bayesian model for perioperative cardiac risk assessment in a cohort of 1,081 vascular surgical candidates. J Am Coll Cardiol. 1996;27(4):779-786." }
};
