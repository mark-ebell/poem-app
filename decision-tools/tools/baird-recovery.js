// Early recovery after acute ischemic stroke: three-item scale (Baird 2001; EE+ 146).
module.exports = {
  id: 'baird-recovery',
  eeId: 146,
  title: 'Stroke recovery three-item scale (Baird)',
  subtitle: 'Early recovery after acute ischemic stroke (Barthel Index 90 or more)',
  question: 'For a patient admitted with acute anterior-circulation ischemic stroke, how likely is a good recovery?',
  inputs: [
    { id: 'nihss', type: 'choice', label: 'NIH Stroke Scale score', ee: 'NIHSS', options: [{ label: '3 or less' }, { label: '4 to 15' }, { label: 'Over 15' }] },
    { id: 'time', type: 'choice', label: 'Time from symptom onset', ee: 'TIME', options: [{ label: '3 hours or less' }, { label: 'Over 3 to 6 hours' }, { label: 'Over 6 hours' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'dwi', type: 'check', label: 'Diffusion-weighted MRI lesion volume 14.1 mL or less', ee: 'DIFFUSION' }
  ],
  compute(a) {
    const s = a.dwi + [4, 2, 0][a.nihss] + a.time;
    return s <= 2 ? { score: { value: s, max: 7, label: 'Score' }, level: 4, headline: 'Low probability of recovery: 7% (95% CI 0 to 15%)' }
      : s <= 4 ? { score: { value: s, max: 7, label: 'Score' }, level: 2, headline: 'Moderate probability of recovery: 53% (95% CI 37 to 68%)' }
      : { score: { value: s, max: 7, label: 'Score' }, level: 1, headline: 'High probability of recovery: 87% (95% CI 77 to 97%)' };
  }
};
