// NIH Stroke Scale, with 3-month outcome by baseline score (Adams 1999, TOAST; EE+ 282).
const item = (id, label, ee, options, note) => ({ id, type: 'choice', label, ee, options: options.map(([l, p]) => ({ label: l, points: p })), note });
const MOTOR_ARM = [['No drift: holds 90° (or 45°) for 10 seconds', 0], ['Drift', 1], ['Some effort against gravity', 2], ['No effort against gravity', 3], ['No movement', 4]];
const MOTOR_LEG = [['No drift: holds 30° for 5 seconds', 0], ['Drift', 1], ['Some effort against gravity', 2], ['No effort against gravity', 3], ['No movement', 4]];
const BANDS = [[3, '1%', '3%', '15%', '80%'], [6, '2%', '10%', '25%', '63%'], [10, '4%', '18%', '32%', '46%'], [15, '9%', '35%', '34%', '22%'], [22, '18%', '40%', '25%', '17%'], [Infinity, '34%', '48%', '12%', '6%']];
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'nihss',
  eeId: 282,
  title: 'NIH Stroke Scale',
  subtitle: 'Stroke severity, with 3-month outcome',
  question: 'How severe is this acute stroke, and what outcome can be expected at 3 months?',
  inputs: [
    item('loc', '1a. Level of consciousness', 'COMBO_Consciousness', [['Alert', 0], ['Not alert, but arousable by minor stimulation', 1], ['Not alert, needs repeated stimulation to attend', 2], ['Coma: reflex responses only, or unresponsive', 3]]),
    item('questions', '1b. Asks the month and their age', 'COMBO_MoAge', [['Answers both correctly', 0], ['Answers one correctly', 1], ['Both incorrect', 2]]),
    item('commands', '1c. Open and close the eyes; grip and release', 'COMBO_Eyes', [['Performs both correctly', 0], ['Performs one correctly', 1], ['Both incorrect', 2]]),
    item('gaze', '2. Best gaze (horizontal eye movements only)', 'COMBO_Gaze', [['Normal', 0], ['Partial gaze palsy', 1], ['Forced deviation', 2]]),
    item('visual', '3. Visual fields', 'COMBO_Visual', [['No visual loss', 0], ['Partial hemianopia', 1], ['Complete hemianopia', 2], ['Bilateral hemianopia (blind)', 3]]),
    item('facial', '4. Facial palsy', 'COMBO_Facial', [['Normal symmetrical movement', 0], ['Minor (flattened nasolabial fold, asymmetric smile)', 1], ['Partial (total or near-total paralysis of the lower face)', 2], ['Complete paralysis of one or both sides', 3]]),
    item('armR', '5a. Motor: right arm', 'COMBO_RightArm', MOTOR_ARM),
    item('armL', '5b. Motor: left arm', 'COMBO_LeftArm', MOTOR_ARM),
    item('legR', '6a. Motor: right leg', 'COMBO_LeftLeg', MOTOR_LEG),
    item('legL', '6b. Motor: left leg', 'COMBO_RightLeg', MOTOR_LEG),
    item('ataxia', '7. Limb ataxia', 'COMBO_Ataxia', [['Absent', 0], ['Present in one limb', 1], ['Present in two limbs', 2]]),
    item('sensory', '8. Sensory (pinprick to arms, legs, trunk and face)', 'COMBO_Sensory', [['Normal', 0], ['Mild to moderate loss', 1], ['Severe to total loss', 2]]),
    item('language', '9. Best language (describe a picture, name items, read sentences)', 'COMBO_Language', [['No aphasia', 0], ['Mild to moderate aphasia', 1], ['Severe aphasia', 2], ['Mute or global aphasia', 3]]),
    item('dysarthria', '10. Dysarthria (read several words)', 'COMBO_Dysarthria', [['Normal articulation', 0], ['Mild to moderate slurring', 1], ['Severe: unintelligible, or unable to speak', 2], ['Intubated or other physical barrier (untestable, not scored)', 0]]),
    item('extinction', '11. Extinction and inattention', 'COMBO_Exenction', [['No abnormality', 0], ['Inattention or extinction to bilateral simultaneous stimulation in one modality', 1], ['Profound hemi-inattention, or extinction in more than one modality', 2]])
  ],
  points: { label: 'NIHSS score', max: 42 },
  compute(a) {
    const s = pointsOf(tool, a), [, dead, poor, good, excellent] = BANDS.find(([max]) => s <= max);
    return {
      headline: `3-month outcome: ${excellent} excellent, ${good} good, ${poor} poor, ${dead} dead`,
      table: { head: ['Outcome at 3 months', 'Patients'], rows: [['Excellent', excellent], ['Good', good], ['Poor', poor], ['Dead', dead]] }
    };
  },
  evidence: { reference: 'NIH Stroke Scale (National Institute of Neurological Disorders and Stroke). Outcomes: Adams HP Jr, Davis PH, Leira EC, et al. Baseline NIH Stroke Scale score strongly predicts outcome after stroke: a report of the Trial of Org 10172 in Acute Stroke Treatment (TOAST). Neurology. 1999;53(1):126-131.' }
};
