// EuroSIDA prognostic score for patients on antiretroviral therapy (Lundgren 2002; EE+ 170).
module.exports = {
  id: 'eurosida',
  eeId: 170,
  title: 'HIV progression on ART (EuroSIDA score)',
  subtitle: 'New AIDS-defining illness or death on antiretroviral therapy',
  question: 'For a patient with HIV on combination antiretroviral therapy, what is the rate of new AIDS-defining illness or death?',
  inputs: [
    { id: 'cd4', type: 'choice', label: 'CD4 count', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Over 200/µL' }, { label: '51 to 200' }, { label: '50 or less' }] },
    { id: 'vl', type: 'choice', label: 'Viral load (HIV RNA)', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Under 500 copies/mL' }, { label: '500 to 999' }, { label: '1000 or more' }] },
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'IDC_COMBOBOX_3', options: [{ label: 'Over 14 g/dL' }, { label: '12.1 to 14' }, { label: '8 to 12' }, { label: 'Under 8' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'severe', type: 'check', label: 'Severe AIDS ever diagnosed (non-Hodgkin lymphoma or progressive multifocal leukoencephalopathy)', ee: 'IDC_CHECKBOX_1' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_2' }
  ],
  compute(a) {
    const s = 2 * a.severe + [0, 3, 7][a.cd4] + a.vl + (a.male ? [0, 2, 2, 6] : [0, 0, 2, 6])[a.hb];
    const r = s <= 1 ? [1, '0.7 (lowest risk group)'] : s <= 4 ? [2, '2.8 (second lowest risk group)'] : s <= 8 ? [3, '10.3 (second highest risk group)'] : [4, '36.4 (highest risk group)'];
    return { score: { value: s, label: 'Score' }, level: r[0], headline: `New AIDS-defining illness or death: ${r[1]} per 100 person-years` };
  }
};
