// 3D-CAM: 3-minute diagnostic interview for delirium (Marcantonio 2014; EE+ 520). EE+ gave the steps without
// a calculator.
module.exports = {
  id: 'cam-3d',
  eeId: 520,
  title: 'Delirium diagnosis (3D-CAM)',
  subtitle: '3-minute diagnostic assessment for delirium',
  question: 'For a hospitalized older adult, does the 3D-CAM show delirium?',
  inputs: [
    { type: 'heading', label: 'Check each feature present' },
    { id: 'acute', type: 'check', label: '1. Acute change or fluctuating course', note: 'Self-reported confusion, disorientation or hallucinations, or observed fluctuation in consciousness, attention or speech.' },
    { id: 'inattention', type: 'check', label: '2. Inattention', note: 'Abnormal on digit span 3 backward or 4 backward, days of the week backward, or months of the year backward, or observed fluctuation in consciousness, attention or speech.' },
    { id: 'thinking', type: 'check', label: '3. Disorganized thinking or altered level of consciousness', note: 'Wrong year, day of the week or type of place; unclear or illogical flow of ideas, or rambling, off-target or abnormally sparse conversation; or sleepy, stuporous, comatose or hypervigilant.' }
  ],
  compute(a) {
    return a.acute && a.inattention && a.thinking ? { level: 4, headline: 'Delirium is present' } : { level: 1, headline: 'Delirium is not present by the 3D-CAM' };
  }
};
