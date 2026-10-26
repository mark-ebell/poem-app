// Treatment calculator: NNT, relative and absolute risk reduction (EE+ 179).
module.exports = {
  id: 'nnt',
  eeId: 179,
  title: 'Treatment calculator (NNT, RRR, ARR)',
  subtitle: 'Number needed to treat from a treatment study',
  question: 'From the results of a treatment study, what are the relative and absolute risk reductions and the number needed to treat?',
  inputs: [
    { id: 'txWith', type: 'number', label: 'Treatment group: number with the adverse outcome', min: 0, max: 10000000, step: 1, ee: 'EDIT_TxWith' },
    { id: 'txWithout', type: 'number', label: 'Treatment group: number without the adverse outcome', min: 0, max: 10000000, step: 1, ee: 'EDIT_TxWO' },
    { id: 'cWith', type: 'number', label: 'Control group: number with the adverse outcome', min: 0, max: 10000000, step: 1, ee: 'EDIT_ControlWith' },
    { id: 'cWithout', type: 'number', label: 'Control group: number without the adverse outcome', min: 0, max: 10000000, step: 1, ee: 'EDIT_ControlWO' }
  ],
  compute(a) {
    const nt = a.txWith + a.txWithout, nc = a.cWith + a.cWithout;
    if (nt < 1 || nc < 1) return { headline: `The ${nt < 1 ? 'treatment' : 'control'} group has no members.` };
    const pt = a.txWith / nt, pc = a.cWith / nc, arr = pc - pt, rrr = pc ? arr / pc : 0;
    const lines = [`Adverse outcome: ${Math.round(100 * pt)}% with treatment, ${Math.round(100 * pc)}% in controls`];
    if (arr === 0) return { headline: 'No difference between the groups', lines };
    const benefit = arr > 0, n = benefit ? Math.ceil(1 / arr - 1e-9) : Math.round(-1 / arr); // NNT rounds up, by convention
    lines.push(`${benefit ? 'Relative risk reduction' : 'Relative risk increase'}: ${(100 * Math.abs(rrr)).toFixed(2)}%`,
      `${benefit ? 'Absolute risk reduction' : 'Absolute risk increase'}: ${(100 * Math.abs(arr)).toFixed(2)}%`,
      benefit ? `You would have to give ${n} patients the intervention instead of the comparison, for the duration of the study, to prevent one adverse outcome.`
        : `For every ${n} patients who get the intervention instead of the comparison, you cause one adverse outcome.`);
    return { headline: `${benefit ? 'Number needed to treat' : 'Number needed to harm'}: ${n}`, lines };
  }
};
