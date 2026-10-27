// 1987 American Rheumatism Association criteria for rheumatoid arthritis (Arnett 1988; EE+ 232).
module.exports = {
  id: 'ra-1987',
  eeId: 232,
  title: 'Rheumatoid arthritis criteria (ARA 1987)',
  subtitle: '1987 classification criteria for rheumatoid arthritis',
  question: 'Does a patient with arthritis meet the 1987 ARA criteria for rheumatoid arthritis?',
  inputs: [
    { type: 'heading', label: 'Present for at least 6 weeks (check all that apply)' },
    { id: 'morning', type: 'check', label: 'Morning stiffness', ee: 'CHK_Morning', note: 'In and around the joints, lasting at least 1 hour before maximal improvement.' },
    { id: 'three', type: 'check', label: 'Arthritis of 3 or more joint areas', ee: 'CHK_3joint',
      note: 'At least 3 joint areas at once with soft-tissue swelling or fluid (not bony overgrowth alone) observed by a physician. The 14 areas are the right or left PIP, MCP, wrist, elbow, knee, ankle and MTP joints.' },
    { id: 'hand', type: 'check', label: 'Arthritis of hand joints', ee: 'CHK_Hand', note: 'At least 1 area swollen in a wrist, MCP or PIP joint.' },
    { id: 'symmetric', type: 'check', label: 'Symmetric arthritis', ee: 'CHK_Symmetric', note: 'The same joint areas on both sides at once (bilateral PIP, MCP or MTP involvement is acceptable without absolute symmetry).' },
    { id: 'nodules', type: 'check', label: 'Rheumatoid nodules', ee: 'CHK_Nodules', note: 'Subcutaneous nodules over bony prominences or extensor surfaces, or near joints, observed by a physician.' },
    { id: 'rf', type: 'check', label: 'Serum rheumatoid factor', ee: 'CHK_Serum', note: 'Abnormal amounts by any method positive in under 5% of normal controls.' },
    { id: 'xray', type: 'check', label: 'Radiographic changes', ee: 'CHK_Radiographic',
      note: 'Typical of RA on PA hand and wrist films: erosions or unequivocal bony decalcification localized to or most marked next to the involved joints (osteoarthritis changes alone do not qualify).' }
  ],
  footnote: 'At least 4 of the 7 criteria are needed. The 2010 ACR/EULAR criteria have since replaced these for early arthritis.',
  compute(a) {
    const n = a.morning + a.three + a.hand + a.symmetric + a.nodules + a.rf + a.xray;
    return n >= 4 ? { score: { value: n, max: 7, label: 'Criteria' }, level: 3, headline: 'Meets criteria for rheumatoid arthritis' }
      : { score: { value: n, max: 7, label: 'Criteria' }, level: 1, headline: 'Does not meet criteria for rheumatoid arthritis' };
  },
  evidence: { reference: 'Arnett FC, Edworthy SM, Bloch DA, et al. The American Rheumatism Association 1987 revised criteria for the classification of rheumatoid arthritis. Arthritis Rheum. 1988;31(3):315-324.', pmid: '3358796' }
};
