// RACA score: return of spontaneous circulation after out-of-hospital cardiac arrest (Grasner 2011; EE+ 462).
module.exports = {
  id: 'raca',
  eeId: 462,
  title: 'RACA score',
  subtitle: 'Return of spontaneous circulation after out-of-hospital cardiac arrest',
  question: 'For a patient with out-of-hospital cardiac arrest, how likely is return of spontaneous circulation?',
  inputs: [
    { id: 'cause', type: 'choice', label: 'Cause of arrest', ee: 'CAUSE', options: ['Cardiac', 'Hypoxia', 'Intoxication', 'Trauma', 'Other'].map(label => ({ label })) },
    { id: 'witness', type: 'choice', label: 'Witnessed', ee: 'WITNESS', options: [{ label: 'Not witnessed' }, { label: 'Witnessed by a lay person' }, { label: 'Witnessed by a health care professional' }] },
    { id: 'location', type: 'choice', label: 'Location of arrest', ee: 'LOCATION', options: ['Nursing home', "Doctor's office", 'Public place', 'Non-hospital medical institution', 'Any other location'].map(label => ({ label })) },
    { id: 'ecg', type: 'choice', label: 'Initial ECG rhythm', ee: 'ECG', options: ['Asystole', 'Pulseless electrical activity', 'Ventricular fibrillation', 'Other rhythm'].map(label => ({ label })) },
    { id: 'time', type: 'number', label: 'Time until EMS arrival', unit: 'minutes', min: 0, max: 120, step: 1, ee: 'TIME' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'age', type: 'check', label: 'Age 80 years or older', ee: 'AGE' },
    { id: 'cpr', type: 'check', label: 'Bystander CPR performed', ee: 'CPR' }
  ],
  compute(a) {
    const x = 0.3 - 0.2 * a.male - 0.2 * a.age + 0.2 * a.cpr + [-0.3, 1.2, 0.3, 0.5, 0][a.location] + [0, 0.7, 0.5, -0.6, 0][a.cause]
      + [-1.1, -0.8, 0, 0][a.ecg] + [0, 0.6, 0.5][a.witness] - 0.04 * a.time;
    const p = 100 / (1 + Math.exp(-x));
    return { headline: `Probability of return of spontaneous circulation: ${p.toFixed(1)}%` };
  }
};
