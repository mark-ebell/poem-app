// 90-day VTE after major elective surgery (Pannucci; EE+ 498).
module.exports = {
  id: 'postop-vte',
  eeId: 498,
  title: 'VTE after surgery (Pannucci)',
  subtitle: '90-day venous thromboembolism after major elective inpatient surgery',
  question: 'For a patient having major elective inpatient surgery, what is the 90-day risk of venous thromboembolism?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 60 or older', points: 1, ee: 'AGE' },
    { id: 'bmi', type: 'check', label: 'Body mass index 40 kg/m² or higher', points: 1, ee: 'BMI' },
    { id: 'male', type: 'check', label: 'Male sex', points: 2, ee: 'MALE' },
    { id: 'sepsis', type: 'check', label: 'Sepsis, septic shock or systemic inflammatory response syndrome', points: 3, ee: 'SEPSIS' },
    { id: 'vte', type: 'check', label: 'Personal history of VTE', points: 3, ee: 'VTE' },
    { id: 'family', type: 'check', label: 'Family history of VTE', points: 4, ee: 'VTEFAMILY' },
    { id: 'cancer', type: 'check', label: 'Current diagnosis of cancer', points: 5, ee: 'CA' }
  ],
  points: { label: 'Score', max: 19 },
  compute(a) {
    const s = a.age + a.bmi + 2 * a.male + 3 * (a.sepsis + a.vte) + 4 * a.family + 5 * a.cancer;
    const r = s < 1 ? [1, 'Very low risk', '0.25% (1 of 407)'] : s < 3 ? [1, 'Low risk', '0.52% (8 of 1431)'] : s < 6 ? [2, 'Average risk', '1.8% (22 of 1199)']
      : s < 9 ? [3, 'High risk', '3.0% (16 of 541)'] : [4, 'Very high risk', '4.6% (4 of 88)'];
    return { level: r[0], headline: r[1], lines: [{ label: '90-day risk of VTE', value: r[2] }] };
  }
};
