// CIWA-Ar: Clinical Institute Withdrawal Assessment for Alcohol, revised (Sullivan 1989), with EE+'s management
// statements (EE+ 206). Wording as in EE+.
const seven = (labels) => Array.from({ length: 8 }, (_, k) => ({ label: labels[k] ? `${k}: ${labels[k]}` : String(k), points: k }));
const item = (id, label, ee, labels, note) => ({ id, type: 'choice', label, ee, options: seven(labels), ...(note ? { note } : {}) });
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'ciwa-ar',
  eeId: 206,
  title: 'Alcohol withdrawal (CIWA-Ar)',
  subtitle: 'Severity of alcohol withdrawal and treatment',
  question: 'For a patient in alcohol withdrawal, how severe is it on the CIWA-Ar, and what treatment is suggested?',
  inputs: [
    item('nausea', 'Nausea and vomiting', 'COMBO_Nausea', { 0: 'No nausea, no vomiting', 1: 'Mild nausea, no vomiting', 4: 'Intermittent nausea with dry heaves', 7: 'Constant nausea, frequent dry heaves and vomiting' }, 'Ask "Do you feel sick to your stomach? Have you vomited?"'),
    item('tactile', 'Tactile disturbances', 'COMBO_Tactile', { 0: 'None', 1: 'Very mild itching, pins and needles, burning or numbness', 2: 'Mild itching, pins and needles, burning or numbness', 3: 'Moderate itching, pins and needles, burning or numbness', 4: 'Moderately severe hallucinations', 5: 'Severe hallucinations', 6: 'Extremely severe hallucinations', 7: 'Continuous hallucinations' },
      'Ask "Have you any itching, pins and needles, burning or numbness, or do you feel bugs crawling on or under your skin?" Observation.'),
    item('tremor', 'Tremor', 'COMBO_Tremor', { 0: 'No tremor', 1: 'Not visible, but can be felt fingertip to fingertip', 4: 'Moderate, with arms extended', 7: 'Severe, even with arms not extended' }, 'Arms extended and fingers spread apart. Observation.'),
    item('auditory', 'Auditory disturbances', 'COMBO_Auditory', { 0: 'Not present', 1: 'Very mild harshness or ability to frighten', 2: 'Mild harshness or ability to frighten', 3: 'Moderate harshness or ability to frighten', 4: 'Moderately severe hallucinations', 5: 'Severe hallucinations', 6: 'Extremely severe hallucinations', 7: 'Continuous hallucinations' },
      'Ask "Are you more aware of sounds around you? Are they harsh? Do they frighten you? Are you hearing anything that disturbs you, or things you know are not there?" Observation.'),
    item('sweats', 'Paroxysmal sweats', 'COMBO_Paroxysmal', { 0: 'No sweat visible', 1: 'Barely perceptible sweating, palms moist', 4: 'Beads of sweat obvious on forehead', 7: 'Drenching sweats' }, 'Observation only.'),
    item('visual', 'Visual disturbances', 'COMBO_Visual', { 0: 'Not present', 1: 'Very mild sensitivity', 2: 'Mild sensitivity', 3: 'Moderate sensitivity', 4: 'Moderately severe hallucinations', 5: 'Severe hallucinations', 6: 'Extremely severe hallucinations', 7: 'Continuous hallucinations' },
      'Ask "Does the light appear too bright? Is its color different? Does it hurt your eyes? Are you seeing anything that disturbs you, or things you know are not there?" Observation.'),
    item('anxiety', 'Anxiety', 'COMBO_Anxiety', { 0: 'No anxiety, at ease', 1: 'Mildly anxious', 4: 'Moderately anxious, or guarded', 7: 'Acute panic, as in severe delirium' }, 'Ask "Do you feel nervous?" Observation.'),
    item('headache', 'Headache, fullness in the head', 'COMBO_Headache', { 0: 'Not present', 1: 'Very mild', 2: 'Mild', 3: 'Moderate', 4: 'Moderately severe', 5: 'Severe', 6: 'Very severe', 7: 'Extremely severe' },
      'Ask "Does your head feel different? Does it feel like there is a band around your head?" Do not rate dizziness or lightheadedness.'),
    item('agitation', 'Agitation', 'COMBO_Agitation', { 0: 'Normal activity', 1: 'Somewhat more than normal activity', 4: 'Moderately fidgety and restless', 7: 'Paces back and forth or thrashes about constantly' }, 'Observation only.'),
    { id: 'orientation', type: 'choice', label: 'Orientation, clouding of sensorium', ee: 'COMBO_Orientation', note: 'Ask "What day is this? Where are you? Who am I?"',
      options: ['0: Oriented, can do serial additions', '1: Cannot do serial additions, or uncertain about the date', '2: Disoriented for date by no more than 2 days', '3: Disoriented for date by more than 2 days', '4: Disoriented for place or person'].map((label, points) => ({ label, points })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'seizures', type: 'check', label: 'History of withdrawal seizures', ee: 'CHK_Seizures' },
    { id: 'comorbid', type: 'check', label: 'Comorbid illness', ee: 'CHK_Comorbid' },
    { id: 'sedative', type: 'check', label: 'Taking a sedative-hypnotic', ee: 'CHK_Sedative' },
    { id: 'show', type: 'choice', label: 'Also show', options: [{ label: 'Nothing more' }, { label: 'Fixed-schedule regimens' }, { label: 'Symptom-triggered regimens' }] }
  ],
  points: { label: 'CIWA-Ar score', max: 67 },
  compute(a) {
    const s = pointsOf(tool, a), lines = [];
    const headline = s < 8 ? 'Supportive non-pharmacological therapy and continued monitoring (LOE I)'
      : s < 16 ? 'Patients benefit symptomatically from medication that will also reduce the risk of major complications if untreated (LOE I)'
      : 'Significant risk of major complications if untreated (LOE I). Patients should receive benzodiazepines in the amount necessary to control symptoms, with continuous close monitoring until symptoms are controlled';
    if (a.seizures && s <= 15) lines.push('With a history of withdrawal seizures, consider one of the recommended medications at presentation, regardless of symptom severity (LOE III). Monitoring and symptom-triggered therapy are also reasonable.');
    if (a.comorbid && s <= 15) lines.push('Consider medication for patients with notable comorbid illness even if withdrawal is mild or moderate.');
    if (a.sedative) lines.push('Patients taking sedative-hypnotics may be at higher risk of major complications and may show tolerance to benzodiazepines, needing dose adjustment (LOE III).');
    if (a.show === 1) lines.push('Fixed-schedule regimens: lorazepam 2 mg every 6 hours for 4 doses, then 1 mg every 6 hours for 8 doses; or chlordiazepoxide 50 mg every 6 hours for 4 doses, then 25 mg every 6 hours for 8 doses; or diazepam 10 mg every 6 hours for 4 doses, then 5 mg every 6 hours for 8 doses. Give more as needed when symptoms are not controlled (CIWA-Ar 8 to 10 or more).');
    if (a.show === 2) lines.push('Symptom-triggered regimens: give one of lorazepam 2 to 4 mg, chlordiazepoxide 50 to 100 mg, or diazepam 10 to 20 mg every hour while the CIWA-Ar is 8 to 10 or more. Repeat the CIWA-Ar 1 hour after every dose.');
    return { level: s < 8 ? 1 : s < 16 ? 2 : 4, headline, lines };
  }
};
