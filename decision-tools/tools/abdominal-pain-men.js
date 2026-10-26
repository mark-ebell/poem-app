// Abdominal pain in ambulatory men (Wasson 1981; EE+ 172).
const ITEMS = [['chronic', 'Pain for 6 months or more, or at least 10 previous episodes', 'IDC_CHECKBOX_1', -3], ['epigastric', 'Epigastric pain and tenderness', 'IDC_CHECKBOX_2', -2],
  ['history', 'History of cancer, diverticular disease, pancreatitis, gallstones or inflammatory bowel disease', 'IDC_CHECKBOX_10', 6],
  ['age', 'Age 60 or older', 'IDC_CHECKBOX_3', 4], ['constant', 'Pain constant, or not relieved by any food or medicine', 'IDC_CHECKBOX_4', 4],
  ['sleep', 'Pain has affected sleep', 'IDC_CHECKBOX_5', 3], ['exam', 'Mass, rigidity, rebound, distention, absent bowel sounds or abnormal liver on exam', 'IDC_CHECKBOX_6', 3],
  ['blood', 'Occult blood in the stool', 'IDC_CHECKBOX_7', 3], ['vomiting', 'Vomiting since the pain began', 'IDC_CHECKBOX_8', 2], ['weight', 'Weight loss of 10 lb or more', 'IDC_CHECKBOX_9', 1]];

module.exports = {
  id: 'abdominal-pain-men',
  eeId: 172,
  title: 'Abdominal pain in men (Wasson)',
  subtitle: 'Serious disease vs nonspecific abdominal pain in ambulatory men',
  question: 'For a man seen as an outpatient with abdominal pain, how likely is a serious cause?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))],
  compute(a) {
    const s = ITEMS.reduce((t, [id, , , w]) => t + (a[id] ? w : 0), -5);
    return s < 0 ? { score: { value: s, label: 'Score' }, level: 1, headline: 'Low risk: 94% nonspecific abdominal pain, 6% more serious disease' }
      : { score: { value: s, label: 'Score' }, level: 3, headline: 'High risk: 70% nonspecific abdominal pain, 30% more serious disease' };
  }
};
