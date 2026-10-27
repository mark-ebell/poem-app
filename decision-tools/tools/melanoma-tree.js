// 2- and 5-year survival in melanoma from a classification tree (EE+ 267).
const n = (y2, y5, size, why) => ({ y2, y5, size, why });

module.exports = {
  id: 'melanoma-tree',
  eeId: 267,
  title: 'Melanoma 2- and 5-year prognosis',
  subtitle: 'Survival after melanoma by sex, ulceration, thickness and invasion',
  question: 'For a patient with melanoma, what is the chance of surviving 2 and 5 years?',
  inputs: [
    { id: 'thickness', type: 'number', label: 'Tumor thickness', unit: 'mm', min: 0.1, max: 30, step: 0.1, ee: 'EDIT_Tumor' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'CHK_Male' },
    { id: 'ulcer', type: 'check', label: 'Ulcerated lesion', ee: 'CHK_Lesion' },
    { id: 'age', type: 'number', label: 'Age at diagnosis', unit: 'years', min: 1, max: 110, step: 1, ee: 'EDIT_Age', when: a => !a.male },
    { id: 'level', type: 'choice', label: 'Level of invasion', ee: 'COMBO_Invasion', when: a => !a.ulcer, options: [
      { label: '1: confined to the epidermis (in situ)' }, { label: '2: into the papillary dermis' }, { label: '3: filling the papillary dermis, compressing the reticular dermis' },
      { label: '4: into the reticular dermis' }, { label: '5: into subcutaneous tissue' }] },
    { id: 'axial', type: 'choice', label: 'Location', ee: 'COMBO_Location', when: a => !a.male && !a.ulcer, options: [{ label: 'Extremity' }, { label: 'Axial' }] }
  ],
  compute(a) {
    const t = a.thickness, level = (a.level || 0) + 1;
    let r;
    if (a.male) {
      if (a.ulcer) r = t <= 4.7 ? n(82, 52, 111, 'Tumor 4.7 mm or less') : n(61, 34, 68, 'Tumor over 4.7 mm');
      else if (t <= 0.9) r = level <= 3 ? n(100, 99, 125, 'Tumor 0.9 mm or less; level 1, 2 or 3') : n(96, 88, 28, 'Tumor 0.9 mm or less; level 4 or 5');
      else r = t <= 3 ? n(92, 76, 117, 'Tumor over 0.9 mm and up to 3 mm') : n(76, 52, 53, 'Tumor over 3 mm');
    } else if (a.ulcer) {
      if (t > 3.9) r = n(63, 43, 151, 'Tumor over 3.9 mm');
      else if (a.age > 63) r = n(88, 67, 85, 'Tumor 3.9 mm or less; age over 63');
      else r = t <= 1.5 ? n(100, 100, 23, 'Age 63 or under; tumor 1.5 mm or less') : n(92, 77, 73, 'Age 63 or under; tumor over 1.5 mm and up to 3.9 mm');
    } else if (t <= 0.8) {
      r = level <= 2 ? n(100, 100, 154, 'Tumor 0.8 mm or less; level 1 or 2')
        : a.axial ? n(98, 92, 60, 'Tumor 0.8 mm or less; level 3, 4 or 5; axial') : n(100, 99, 191, 'Tumor 0.8 mm or less; level 3, 4 or 5; extremity');
    } else if (t <= 2.1) r = n(99, 93, 279, 'Tumor over 0.8 mm and up to 2.1 mm');
    else r = a.age <= 53 ? n(95, 89, 59, 'Tumor over 2.1 mm; age 53 or under') : n(89, 75, 107, 'Tumor over 2.1 mm; age over 53');
    return { headline: `2-year survival ${r.y2}%, 5-year survival ${r.y5}%`, lines: [`Group: ${r.why} (n = ${r.size}).`] };
  }
};
