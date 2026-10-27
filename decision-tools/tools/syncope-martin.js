// Arrhythmia and death within 1 year after syncope (Martin 1997; EE+ 47).
const OUT = [['3.3%', '0.0%', '1.1%'], ['6.0%', '1.5%', '8.5%'], ['17.0%', '5.5%', '16.0%'], ['45.5%', '15.1%', '27.3%']];

module.exports = {
  id: 'syncope-martin',
  eeId: 47,
  title: 'Syncope: arrhythmia or death at 1 year (Martin)',
  subtitle: 'Arrhythmia and death within 1 year of syncope',
  question: 'For a patient seen in the ED with syncope, what is the risk of arrhythmia or death within 1 year?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ecg', type: 'check', label: 'Abnormal ECG', ee: 'IDC_CHECKBOX_ABNORMAL_ECG' },
    { id: 'va', type: 'check', label: 'History of ventricular arrhythmia', ee: 'IDC_CHECKBOX_HISTORY_OF_VENTRICULAR_ARRHYTHMIA' },
    { id: 'chf', type: 'check', label: 'History of heart failure', ee: 'IDC_CHECKBOX_HISTORY_OF_CONGESTIVE_HEART_FAILURE' },
    { id: 'age', type: 'check', label: 'Age over 45', ee: 'IDC_CHECKBOX_AGE_GT_45' }
  ],
  footnote: 'Arrhythmia (broad definition): VT of 3 or more beats; symptomatic sinus pauses of 2 seconds or more; symptomatic sinus bradycardia; SVT with symptoms or hypotension; AF with slow ventricular response; complete AV block; Mobitz II AV block; or pacemaker malfunction.',
  compute(a) {
    const n = a.ecg + a.va + a.chf + a.age, [arr, cardiac, any] = OUT[Math.min(n, 3)];
    return { score: { value: n, max: 4, label: 'Risk factors' }, level: [1, 2, 3, 4][Math.min(n, 3)], headline: `1-year risk of arrhythmia: ${arr}`,
      lines: [`Cardiac death: ${cardiac}`, `Any death: ${any}`] };
  }
};
