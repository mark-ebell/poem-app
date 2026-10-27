// Temporomandibular joint disorder and myofascial pain (EE+ 223). Rules as in EE+.
module.exports = {
  id: 'tmj-disorders',
  eeId: 223,
  title: 'TMJ disorders diagnosis',
  subtitle: 'TMJ disorder and myofascial pain dysfunction in head or jaw pain',
  question: 'For a patient with head or jaw pain, are a temporomandibular joint (TMJ) disorder and myofascial pain dysfunction likely?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'click', type: 'check', label: 'Reciprocal click (one or both sides)', ee: 'IDC_CHECKBOX_RECIPROCAL_CLICK' },
    { id: 'palpation', type: 'check', label: 'Pain on palpation over the lateral aspect of the TMJ, or through the external auditory meatus (one or both sides)', ee: 'IDC_CHECKBOX_PAIN_ON_PALPATION_OVER_LATERAL_ASPECT_OF_TMJ' },
    { id: 'opening', type: 'check', label: 'Pain with maximum passive opening', ee: 'IDC_CHECKBOX_PAIN_WITH_MAX_PASSIVE_OPENING' },
    { id: 'lateral', type: 'check', label: 'Pain with maximum active lateral movements', ee: 'IDC_CHECKBOX_PAIN_WITH_MAX_ACTIVE_LATERAL_MOVEMENTS' }
  ],
  compute(a) {
    const tmj = a.click || (a.palpation && a.opening), mps = a.palpation || (a.opening && a.lateral);
    return { level: tmj || mps ? 3 : 1, headline: tmj ? 'TMJ disorder likely' : 'TMJ disorder unlikely; consider other causes',
      lines: [mps ? 'Myofascial pain dysfunction likely.' : 'Myofascial pain dysfunction unlikely; consider other causes.'] };
  }
};
