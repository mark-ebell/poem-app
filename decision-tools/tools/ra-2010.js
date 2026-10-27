// 2010 ACR/EULAR classification criteria for rheumatoid arthritis (Aletaha 2010). Replaces the 1987 ARA
// criteria (EE+ 232) at Mark Ebell's request (2026-10-27).
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'ra-2010',
  eeId: 232,
  title: 'Rheumatoid arthritis criteria (ACR/EULAR 2010)',
  subtitle: '2010 classification criteria for rheumatoid arthritis',
  question: 'For a patient with definite clinical synovitis in at least one joint, not better explained by another disease, are the 2010 ACR/EULAR criteria for rheumatoid arthritis met?',
  inputs: [
    { id: 'joints', type: 'choice', label: 'Joint involvement (swollen or tender)', options: opts([['1 large joint', 0], ['2 to 10 large joints', 1], ['1 to 3 small joints (with or without large joints)', 2], ['4 to 10 small joints (with or without large joints)', 3], ['More than 10 joints (at least 1 small joint)', 5]]),
      note: 'Large joints: shoulders, elbows, hips, knees and ankles. Small joints: MCP, PIP, second to fifth MTP and thumb IP joints, and wrists. DIP, first CMC and first MTP joints are not counted.' },
    { id: 'serology', type: 'choice', label: 'Serology (RF and anti-CCP antibody)', options: opts([['Both negative', 0], ['Low-positive RF or anti-CCP (up to 3 times the upper limit of normal)', 2], ['High-positive RF or anti-CCP (more than 3 times the upper limit of normal)', 3]]) },
    { id: 'apr', type: 'choice', label: 'Acute-phase reactants', options: opts([['Normal CRP and normal ESR', 0], ['Abnormal CRP or abnormal ESR', 1]]) },
    { id: 'duration', type: 'choice', label: 'Duration of symptoms', options: opts([['Under 6 weeks', 0], ['6 weeks or more', 1]]) }
  ],
  points: { label: 'Score', max: 10 },
  footnote: 'At least one serology result and one acute-phase reactant are needed. Patients with erosions typical of rheumatoid arthritis and a history compatible with meeting the criteria before are also classified as having rheumatoid arthritis.',
  compute(a) {
    return pointsOf(tool, a) >= 6 ? { level: 3, headline: 'Meets the criteria for definite rheumatoid arthritis (6 or more of 10 points)' }
      : { level: 1, headline: 'Does not meet the criteria for definite rheumatoid arthritis (under 6 points)' };
  },
  evidence: {
    reference: 'Aletaha D, Neogi T, Silman AJ, et al. 2010 Rheumatoid arthritis classification criteria: an American College of Rheumatology/European League Against Rheumatism collaborative initiative. Arthritis Rheum. 2010;62(9):2569-2581.',
    pmid: '20872595',
    population: 'Developed by an ACR/EULAR working group from data on patients with early undifferentiated arthritis in several cohorts, refined by expert consensus and tested in further cohorts.',
    validation: 'Validated in separate early arthritis cohorts; designed to identify rheumatoid arthritis earlier than the 1987 criteria.',
    prevalence: null, developed: null, validated: null,
    comment: 'Replaces the 1987 ARA criteria (EE+ 232).'
  }
};
