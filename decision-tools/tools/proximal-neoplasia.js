// Advanced proximal neoplasia after flexible sigmoidoscopy (Imperiale 2003; EE+ 264).
module.exports = {
  id: 'proximal-neoplasia',
  eeId: 264,
  title: 'Advanced proximal colon neoplasia after sigmoidoscopy',
  subtitle: 'Risk of advanced proximal neoplasia from age, sex and distal findings',
  question: 'For a patient who has had flexible sigmoidoscopy, what is the risk of advanced neoplasia in the proximal colon?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Under 55' }, { label: '55 to 59' }, { label: '60 to 64' }, { label: '65 or older' }] },
    { id: 'distal', type: 'choice', label: 'Most advanced distal finding', ee: 'IDC_COMBOBOX_1', options: [{ label: 'No polyps' }, { label: 'Hyperplastic polyp' }, { label: 'Tubular adenoma under 1 cm' }, { label: 'Advanced lesion' }],
      note: 'Advanced lesion: tubular adenoma 1 cm or more, any villous histology, high-grade dysplasia, or cancer.' },
    { type: 'heading', label: 'Check if present' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const s = a.male + a.age + a.distal;
    return { score: { value: s, max: 7, label: 'Score' }, level: s <= 1 ? 1 : s <= 3 ? 2 : 3,
      headline: `Risk of advanced proximal neoplasia: ${s <= 1 ? '0.40% (95% CI 0.05% to 1.49%)' : s <= 3 ? '1.92% (95% CI 0.83% to 3.75%)' : '3.79% (95% CI 1.24% to 8.62%)'}` };
  }
};
