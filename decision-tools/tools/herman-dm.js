// Undiagnosed diabetes screening questionnaire, decision tree (Herman 1995; EE+ 18).
module.exports = {
  id: 'herman-dm',
  eeId: 18,
  title: 'Diabetes screening questionnaire (Herman)',
  subtitle: 'Undiagnosed diabetes in adults',
  question: 'For an adult without known diabetes, how likely is undiagnosed diabetes?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_RADIO_1', options: [{ label: 'Under 45' }, { label: '45 to 64' }, { label: '65 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'obese', type: 'check', label: 'Obese (weight 120% or more of ideal for a medium frame)', ee: 'IDC_CHECKBOX_4' },
    { id: 'sedentary', type: 'check', label: 'Sedentary (little or no exercise, and inactive on a usual day)', ee: 'IDC_CHECKBOX_3' },
    { id: 'sibling', type: 'check', label: 'Sibling with diabetes', ee: 'IDC_CHECKBOX_2' },
    { id: 'parent', type: 'check', label: 'Parent with diabetes', ee: 'IDC_CHECKBOX_5' },
    { id: 'macrosomia', type: 'check', label: 'Woman who has had a baby weighing more than 9 lb', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    let r;
    if (a.age === 0) r = a.obese ? (a.sedentary ? '5.2% (8 of 154)' : '0.5% (1 of 216)') : '0.4% (4 of 1073)';
    else if (a.obese) r = '12.3% (83 of 677)';
    else if (a.age === 1) r = a.sedentary ? '6.2% (18 of 290)' : '2.7% (13 of 478)';
    else r = a.sibling ? '16% (8 of 50)' : a.macrosomia ? '14.3% (7 of 49)' : a.parent ? '10.2% (5 of 49)' : '4.9% (17 of 348)';
    return { headline: `Likelihood of undiagnosed diabetes: ${r}` };
  },
  evidence: { reference: 'Herman WH, Smith PJ, Thompson TJ, Engelgau MM, Aubert RE. A new and simple questionnaire to identify people at increased risk for undiagnosed diabetes. Diabetes Care. 1995;18(3):382-387.' }
};
