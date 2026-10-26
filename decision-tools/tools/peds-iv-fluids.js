// Pediatric IV fluids: maintenance (Holliday-Segar) and deficit replacement (EE+ 99).
module.exports = {
  id: 'peds-iv-fluids',
  eeId: 99,
  title: 'Pediatric IV fluid calculator',
  subtitle: 'Maintenance rate and deficit replacement for a dehydrated child',
  question: 'For a dehydrated child, what are the maintenance fluid rate and the extra fluid needed to replace the deficit?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Weight units', options: [{ label: 'Pounds' }, { label: 'Kilograms' }] },
    { id: 'current', type: 'number', label: 'Current weight', unit: 'lb or kg', min: 1, max: 300, step: 0.1, ee: 'IDC_EDIT_1' },
    { id: 'mode', type: 'choice', label: 'Dehydration from', ee: 'CMB_WT_DEHYDRATE', options: [{ label: 'Usual weight' }, { label: 'Estimated % dehydration' }] },
    { id: 'usual', type: 'number', label: 'Usual weight', unit: 'lb or kg', min: 1, max: 300, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.mode === 0 },
    { id: 'percent', type: 'number', label: 'Estimated dehydration', unit: '%', min: 1, max: 30, step: 1, ee: 'IDC_EDIT_2', when: a => a.mode === 1 }
  ],
  footnote: 'Maintenance (per hour): 4 mL/kg for the first 10 kg, 2 mL/kg for the next 10 kg, and 1 mL/kg above 20 kg, based on usual weight.',
  compute(a) {
    const kg = w => (a.units === 0 ? w / 2.2 : w);
    const current = kg(a.current), usual = a.mode === 0 ? kg(a.usual) : current / (1 - a.percent / 100);
    if (usual <= current) return { headline: 'Not dehydrated: usual weight is not more than current weight.' };
    const pct = a.mode === 1 ? a.percent : (100 * (usual - current)) / usual;
    const rate = usual <= 10 ? 4 * usual : usual <= 20 ? 40 + 2 * (usual - 10) : 60 + (usual - 20);
    const deficit = (usual - current) * 1000;
    return {
      headline: `Maintenance rate: ${rate.toFixed(1)} mL/hour`,
      lines: [`Dehydration: ${pct.toFixed(1)}%`, `Extra fluid to replace the deficit over 24 hours: ${(deficit / 24).toFixed(1)} mL/hour`, `Over 48 hours: ${(deficit / 48).toFixed(1)} mL/hour`]
    };
  }
};
