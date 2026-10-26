// Brain imaging in girls with central precocious puberty (Chalumeau 2003; EE+ 245). Wording as in EE+.
module.exports = {
  id: 'precocious-puberty',
  eeId: 245,
  title: 'Precocious puberty: need for brain imaging',
  subtitle: 'Occult intracranial lesions in girls with central precocious puberty',
  question: 'For a girl with central precocious puberty (breast development before age 8, without premature thelarche or gonadal or adrenal disease), is brain imaging needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'young', type: 'check', label: 'Age under 6 years', ee: 'IDC_CHECKBOX_1' },
    { id: 'estradiol', type: 'check', label: "Estradiol above the 45th percentile for your center's assay (19 to 71 pmol/L in the 7 study centers)", ee: 'IDC_CHECKBOX_2' }
  ],
  compute(a) {
    if (a.young) return { level: 4, headline: 'High risk (28% occult intracranial lesion): order brain imaging' };
    if (a.estradiol) return { level: 2, headline: 'Moderate risk (3% occult intracranial lesion): order brain imaging' };
    return { level: 1, headline: 'Low risk (0% occult intracranial lesion, 95% CI 0 to 2%): brain imaging unlikely to be helpful' };
  }
};
