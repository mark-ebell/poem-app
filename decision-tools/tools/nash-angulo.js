// Severe fibrosis in NASH (Angulo 1999; EE+ 237). EE+ also asked "Male", which did not change the result; it is left out.
module.exports = {
  id: 'nash-angulo',
  eeId: 237,
  title: 'Severe fibrosis in NASH (Angulo 1999)',
  subtitle: 'Stage 3 or 4 fibrosis in nonalcoholic steatohepatitis',
  question: 'For a patient with nonalcoholic steatohepatitis (on biopsy), how likely is severe fibrosis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'young', type: 'check', label: 'Age under 45', ee: 'Check_ID2' },
    { id: 'obese', type: 'check', label: 'BMI above 31.1 (men) or 32.3 (women)', ee: 'Check_ID1' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'Check_ID3' }
  ],
  footnote: 'NASH is a biopsy diagnosis (at least 10% steatosis with lobular or portal inflammation); not all fatty liver is NASH. Not prospectively validated.',
  compute(a) {
    const risk = a.obese || a.dm;
    if (a.young) return risk ? { level: 2, headline: 'Moderate risk: 8% (2/25) stage 3 or 4 fibrosis', lines: ['May be higher if the AST/ALT ratio is above 1.'] } : { level: 1, headline: 'Low risk: 0% (0/27) stage 3 or 4 fibrosis' };
    return risk ? { level: 4, headline: 'High risk: 60% (33/59) stage 3 or 4 fibrosis', lines: ['May be higher if the AST/ALT ratio is above 1.'] } : { level: 2, headline: 'Moderate risk: 12% (4/33) stage 3 or 4 fibrosis' };
  }
};
