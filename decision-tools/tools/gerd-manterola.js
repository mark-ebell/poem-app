// GERD questionnaire for epidemiologic settings (Manterola 2002; EE+ 289).
const { pointsOf } = require('../lib');
const FREQ = ['Never', 'Once a month or more', 'Once a week or more', 'Daily'].map((label, points) => ({ label, points }));
const OCC = ['Never', 'Occasional', 'Constant'].map((label, points) => ({ label, points }));

const tool = module.exports = {
  id: 'gerd-manterola',
  eeId: 289,
  title: 'GERD questionnaire (Manterola)',
  subtitle: 'Symptom score for gastroesophageal reflux disease',
  question: 'How strongly do reflux symptoms point to gastroesophageal reflux disease?',
  inputs: [
    { id: 'heartburn', type: 'choice', label: 'Heartburn', ee: 'IDC_COMBOBOX_1', options: FREQ },
    { id: 'regurgitation', type: 'choice', label: 'Regurgitation', ee: 'IDC_COMBOBOX_2', options: FREQ },
    { id: 'chest', type: 'choice', label: 'Chest pain', ee: 'IDC_COMBOBOX_3', options: OCC },
    { id: 'cough', type: 'choice', label: 'Night-time cough', ee: 'IDC_COMBOBOX_4', options: OCC },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dysphagia', type: 'check', label: 'Dysphagia', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'dysphonia', type: 'check', label: 'Dysphonia', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'asthma', type: 'check', label: 'Asthma', points: 1, ee: 'IDC_CHECKBOX_3' }
  ],
  points: { label: 'Score', max: 13 },
  compute(a) {
    return { headline: `Score ${pointsOf(tool, a)} of 13`, lines: ['Mean score 7 in patients with GERD and 0.5 in those without.'] };
  }
};
