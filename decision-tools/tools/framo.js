// FRAMO index: 2-year hip fracture and mortality in older women (Albertsson 2007; EE+ 378).
module.exports = {
  id: 'framo',
  eeId: 378,
  title: 'Hip fracture risk in women (FRAMO)',
  subtitle: '2-year hip fracture and death in older women',
  question: 'For an older woman, what is the 2-year risk of hip fracture and of death?',
  inputs: [
    { id: 'rise', type: 'choice', label: 'Can rise 5 times from a chair without using the arms', ee: 'CHK_Rise', options: [{ label: 'Yes' }, { label: 'No' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 80 or older', ee: 'CHK_Age' },
    { id: 'weight', type: 'check', label: 'Weight under 60 kg', ee: 'CHK_Weight' },
    { id: 'fracture', type: 'check', label: 'After age 40, fracture of the wrist, lower or upper arm, hip or vertebrae, or vertebral compression on x-ray', ee: 'CHK_Fracture' }
  ],
  compute(a) {
    const s = a.age + a.weight + a.fracture + a.rise;
    return s <= 1 ? { score: { value: s, max: 4, label: 'FRAMO score' }, level: 1, headline: '2-year hip fracture risk 0.8%, mortality 3.2%' }
      : { score: { value: s, max: 4, label: 'FRAMO score' }, level: 3, headline: '2-year hip fracture risk 5.4%, mortality 23.7%' };
  }
};
