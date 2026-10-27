// Cambridge Prognostic Groups for non-metastatic prostate cancer (Gnanapragasam 2016; EE+ 566).
const OUT = [null, '482 of 25,303 (1.9%)', '628 of 14,796 (4.2%)', '589 of 7354 (8.0%)', '1831 of 13,506 (13.6%)', '3632 of 11,378 (31.9%)'];

module.exports = {
  id: 'cambridge-prostate',
  eeId: 566,
  title: 'Prostate cancer prognosis (Cambridge Prognostic Groups)',
  subtitle: 'Prostate cancer mortality in non-metastatic prostate cancer',
  question: 'For a man with non-metastatic prostate cancer, what is the risk of dying of prostate cancer?',
  inputs: [
    { id: 'gleason', type: 'choice', label: 'Gleason score', ee: 'ddl1', options: [{ label: '6' }, { label: '3 + 4' }, { label: '4 + 3' }, { label: '8' }, { label: '9 to 10' }] },
    { id: 'psa', type: 'choice', label: 'PSA', ee: 'ddl2', options: [{ label: 'Under 10 ng/mL' }, { label: '10 to 20 ng/mL' }, { label: 'Over 20 ng/mL' }] },
    { id: 'stage', type: 'choice', label: 'Stage', ee: 'ddl3', options: [{ label: 'T1 to T2' }, { label: 'T3' }, { label: 'T4' }] }
  ],
  compute(a) {
    const G = a.gleason + 1, P = a.psa + 1, S = a.stage + 1;
    let cpg = 0;
    if (G === 1 && P === 1 && S === 1) cpg = 1;
    if (G === 2 || (P === 2 && S === 1)) cpg = 2;
    if ((G === 2 && P === 2 && S === 1) || (G === 3 && S === 1)) cpg = 3;
    if (G === 4 || P === 3 || S === 2) cpg = 4;
    if ((G === 4) + (P === 3) + (S === 2) > 1 || S === 3 || G === 5) cpg = 5;
    return { level: [1, 1, 2, 3, 4, 4][cpg], headline: `Cambridge Prognostic Group ${cpg}`, lines: [`${OUT[cpg]} died of prostate cancer at a median 7 years of follow-up.`] };
  }
};
