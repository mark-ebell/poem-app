// NCEP ATP III lipid guideline, 2001 (EE+ 134): Framingham points for 10-year CHD risk, risk factors,
// LDL goal and the guideline's recommended action.
const FEMALE = { base: [-7, -3, 0, 3, 6, 8, 10, 12, 14, 16], chol: [[0, 4, 8, 11, 13], [0, 4, 8, 11, 13], [0, 3, 6, 8, 10], [0, 3, 6, 8, 10], [0, 2, 4, 5, 7], [0, 2, 4, 5, 7], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 1, 2, 2], [0, 1, 1, 2, 2]],
  smoke: [9, 9, 7, 7, 4, 4, 2, 2, 1, 1], sbpTreated: [0, 3, 4, 5, 6], sbp: [0, 1, 2, 3, 4], risk: ['1%', '1%', '1%', '1%', '2%', '2%', '3%', '4%', '5%', '6%', '8%', '11%', '14%', '17%', '22%', '27%'], num: [0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.11, 0.14, 0.17, 0.22, 0.27], lo: 9, hi: 24 };
const MALE = { base: [-9, -4, 0, 3, 6, 8, 10, 11, 12, 13], chol: [[0, 4, 7, 9, 11], [0, 4, 7, 9, 11], [0, 3, 5, 6, 8], [0, 3, 5, 6, 8], [0, 2, 3, 4, 5], [0, 2, 3, 4, 5], [0, 1, 1, 2, 3], [0, 1, 1, 2, 3], [0, 0, 0, 1, 1], [0, 0, 0, 1, 1]],
  smoke: [8, 8, 5, 5, 3, 3, 1, 1, 1, 1], sbpTreated: [0, 1, 2, 2, 3], sbp: [0, 0, 1, 1, 2], risk: ['1%', '1%', '1%', '1%', '1%', '2%', '2%', '3%', '4%', '5%', '6%', '8%', '10%', '12%', '16%', '20%', '25%'], num: [0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.16, 0.2, 0.25], lo: 0, hi: 16 };
const EQUIV = [['chd', 'Known coronary heart disease', 'CHD1'], ['carotid', 'Symptomatic carotid artery disease', 'CHD2'], ['aaa', 'Abdominal aortic aneurysm', 'CHD3'], ['pad', 'Peripheral arterial disease', 'CHD4'], ['dm', 'Diabetes mellitus', 'CHD5']];

module.exports = {
  id: 'ncep-atp3',
  eeId: 134,
  title: 'NCEP ATP III lipid guideline (2001)',
  subtitle: '10-year CHD risk, LDL goal and recommended action',
  question: 'Under the 2001 NCEP ATP III guideline, what is this patient\'s 10-year CHD risk, LDL goal and recommended action?',
  inputs: [
    { id: 'ldl', type: 'number', label: 'Latest LDL cholesterol', unit: 'mg/dL', min: 20, max: 400, step: 1, ee: 'LDL' },
    { id: 'age', type: 'choice', label: 'Age', ee: 'Age', options: ['20 to 34', '35 to 39', '40 to 44', '45 to 49', '50 to 54', '55 to 59', '60 to 64', '65 to 69', '70 to 74', '75 to 79'].map(label => ({ label })) },
    { id: 'chol', type: 'choice', label: 'Total cholesterol (mg/dL)', ee: 'Cholesterol', options: ['Below 160', '160 to 199', '200 to 239', '240 to 279', '280 or higher'].map(label => ({ label })) },
    { id: 'hdl', type: 'choice', label: 'HDL cholesterol (mg/dL)', ee: 'HDL', options: ['60 or higher', '50 to 59', '40 to 49', 'Below 40'].map(label => ({ label })) },
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'SBP', options: ['Below 120', '120 to 129', '130 to 139', '140 to 159', '160 or higher'].map(label => ({ label })) },
    { id: 'trig', type: 'choice', label: 'Triglycerides (mg/dL)', ee: 'Trig', options: ['Above 500', '200 to 500', 'Below 200'].map(label => ({ label })) },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' },
    { type: 'heading', label: 'CHD or CHD risk equivalent' },
    ...EQUIV.map(([id, label, ee]) => ({ id, type: 'check', label, ee })),
    { type: 'heading', label: 'Risk factors' },
    { id: 'htn', type: 'check', label: 'Hypertension under treatment', ee: 'Hypertension' },
    { id: 'smoking', type: 'check', label: 'Smoking in the past month', ee: 'Smoking' },
    { id: 'family', type: 'check', label: 'CHD in a first-degree male relative before 55 or female relative before 65', ee: 'FamilyHistory' }
  ],
  footnote: 'Very high risk: multiple risk factors (especially diabetes); severe and poorly controlled risk factors (especially smoking); multiple risk factors of the metabolic syndrome (high triglycerides, low HDL); acute coronary syndromes.',
  compute(a) {
    let rf = +a.smoking + (a.htn || a.sbp >= 3 ? 1 : 0) + (a.hdl === 3 ? 1 : 0) - (a.hdl === 0 ? 1 : 0) + a.family + ((a.female ? a.age >= 5 : a.age >= 3) ? 1 : 0);
    rf = Math.max(0, rf);
    const T = a.female ? FEMALE : MALE;
    const pts = T.base[a.age] + T.chol[a.age][a.chol] + (a.smoking ? T.smoke[a.age] : 0) + [-1, 0, 1, 2][a.hdl] + (a.htn ? T.sbpTreated : T.sbp)[a.sbp];
    const [risk, num] = pts < T.lo ? ['below 1%', 0] : pts > T.hi ? ['30% or more', 0.35] : [T.risk[pts - T.lo], T.num[pts - T.lo]];
    const equiv = EQUIV.some(([id]) => a[id]) || (rf >= 2 && num > 0.2);
    const ldl = a.ldl, trigHdl = a.trig < 2 || a.hdl === 3 ? ' Consider fibrate or nicotinic acid for triglycerides/HDL.' : '';
    let goal, action;
    if (equiv) {
      goal = 'Below 100 mg/dL; consider below 70 mg/dL for very high risk';
      action = (ldl < 100 ? 'LDL goal met; no additional treatment needed unless goal is 70 mg/dL.' : ldl < 130 ? 'Initiate lifestyle changes; consider drug therapy.' : 'Initiate lifestyle changes and drug therapy.') + trigHdl;
    } else if (rf > 1) {
      goal = 'Below 130 mg/dL; below 100 mg/dL is a therapeutic option';
      action = num < 0.1
        ? (ldl < 130 ? 'LDL goal met; no additional treatment needed unless goal is below 100 mg/dL.' : ldl < 160 ? 'Initiate lifestyle changes.' : 'Initiate lifestyle changes and drug therapy.') + trigHdl
        : ldl < 130 ? 'LDL goal met; no additional treatment needed.' : 'Initiate lifestyle changes and drug therapy.';
    } else {
      goal = 'Below 160 mg/dL';
      action = ldl < 160 ? 'LDL goal met; no additional treatment needed.' : ldl < 190 ? 'Initiate lifestyle changes; drug therapy optional.' : 'Initiate lifestyle changes and drug therapy.';
    }
    return { headline: `10-year CHD risk: ${risk}`, lines: [{ label: 'CHD or CHD risk equivalent', value: equiv ? 'Yes' : 'No' }, { label: 'Number of risk factors', value: String(rf) }, { label: 'LDL goal', value: goal }, `${equiv ? 'CHD or CHD risk equivalent' : rf > 1 ? `2+ risk factors and ${num < 0.1 ? 'below 10%' : '10% to 20%'} 10-year risk` : '0 or 1 risk factors'}, LDL ${ldl} mg/dL: ${action}`] };
  }
};
