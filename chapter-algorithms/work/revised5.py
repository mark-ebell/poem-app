from alg import alg, write
C = 'Revised algorithm reviewed by Mark Ebell (Draft algorithm updates for review, 2026-10-24); replaces the original figure.'

write('eee0383', [alg(383, 'Evaluation of the Child With a Limp', [
 ('Child with a limp. Painful (antalgic) gait?', [('Painful gait', 2), ('Painless gait', 7)]),
 ('Fever, refusal to bear weight, or ill appearance?', [('Yes', 3), ('No', 4)]),
 ('CBC, ESR, CRP; hip ultrasound for effusion', [
   ('2 or more of: temperature >38.5 °C, non–weight bearing, ESR >40 mm/h, WBC >12,000/mm³, CRP >2 mg/dL', 'Suspect septic arthritis. Urgent joint aspiration and orthopedic referral.'),
   ('Focal bone tenderness, or septic arthritis excluded', 'Suspect osteomyelitis. MRI.'),
   ('0–1 present and well appearing', 'Transient synovitis likely. NSAIDs, recheck in 24–48 hours.')]),
 ('Recent injury?', [
   ('Acute injury', "X-ray. Fracture (including toddler's fracture), sprain or strain, foreign body."),
   ('Overuse', 'Apophysitis (Sever disease, Osgood–Schlatter, Sinding-Larsen–Johansson), stress fracture, osteochondritis dissecans (OCD), accessory navicular.'),
   ('No injury', 5)]),
 ('Night pain, weight loss, fatigue, bruising, or pallor?', [
   ('Abnormal blood count or blasts', 'Leukemia. Urgent hematology referral.'),
   ('Focal bone pain or mass', 'X-ray, then MRI. Bone tumor (osteoid osteoma, osteosarcoma, Ewing sarcoma).'),
   ('No', 6)]),
 ('Hip and knee X-ray (AP and frog-leg lateral)', [
   ('Slipped capital femoral epiphysis (SCFE), age 10–16', 'Non–weight bearing, same-day orthopedic referral.'),
   ('Legg–Calvé–Perthes disease (LCPD), age 4–10', 'Orthopedic referral.'),
   ('Normal, symptoms over 6 weeks or swollen joints', 'Juvenile idiopathic arthritis (JIA) or Lyme arthritis. Rheumatology referral.')]),
 ('Painless gait. Neurologic deficit (weakness, spasticity, abnormal reflexes)?', [
   ('Yes', 'Cerebral palsy, neuropathy, Charcot–Marie–Tooth disease, muscular dystrophy. Neurology referral.'),
   ('No', 8)]),
 ('Visible structural problem?', [
   ('Yes', 'Leg length discrepancy, scoliosis, clubfoot.'),
   ('No', 'Hip X-ray. Developmental dysplasia of the hip (DDH), LCPD, SCFE.')]),
], ['SCFE often presents with knee or thigh pain only; examine and image the hip.', "A toddler's fracture may not show on the first X-ray."])], C)

write('eee0388', [alg(392, 'Evaluation of Hip Pain in Adults', [
 ('Hip pain. Acute trauma?', [('Yes', 'X-ray (AP pelvis and lateral hip). If negative but unable to bear weight, MRI for occult fracture.'), ('No', 2)]),
 ('Fever, chills, skin infection, recent joint injection or surgery, or hip replacement?', [
   ('Yes', 'Suspect septic arthritis or prosthetic joint infection. ESR, CRP, joint aspiration; urgent orthopedic referral.'), ('No', 3)]),
 ('History of cancer, weight loss, or night pain?', [('Yes', 'X-ray; MRI if negative to evaluate for metastasis or primary bone tumor.'), ('No', 4)]),
 ('Steroid use, heavy alcohol use, sickle cell disease, or past fracture or dislocation?', [
   ('Yes', 'X-ray; noncontrast MRI if negative to rule out avascular necrosis.'), ('No', 5)]),
 ('Where is the pain?', [
   ('Groin pain, stiffness, and painful internal rotation, age 45 or older', 'Hip osteoarthritis. Clinical diagnosis; X-ray only if uncertain. Exercise, weight loss, NSAIDs.'),
   ('Lateral hip pain with tenderness over the greater trochanter', 'Greater trochanteric pain syndrome (gluteal tendinopathy). Exercise therapy; injection if needed.'),
   ('Groin pain with clicking or catching in a younger, active adult', 'Femoroacetabular impingement or labral tear. X-ray, physical therapy; MRI arthrogram if it persists.'),
   ('Buttock or posterior pain', 'Lumbar spine or sacroiliac joint.'),
   ('None of these', 'Consider stress fracture (runners, osteoporosis), hernia, or abdominal or pelvic causes. MRI if pain persists.')]),
], ['Hip pain may be referred from the lumbar spine, abdomen, or pelvis.', 'Hip arthroscopy has limited benefit for degenerative disease.'])], C)

write('eee0389', [alg('217.2', 'Evaluation of Acute Knee Injury', [
 ('Acute knee injury. Ottawa knee rule positive? Any of: age 55 or older; isolated patellar tenderness; fibular head tenderness; cannot flex to 90°; cannot bear weight for 4 steps.', [
   ('Yes', 'X-ray. Fracture: immobilize and refer.'), ('No (X-ray not needed)', 2)]),
 ('Locked knee, gross instability, or knee dislocation?', [('Yes', 'Urgent orthopedic referral; check pulses after a dislocation.'), ('No', 3)]),
 ('Examine for effusion, Lachman positive (ACL), posterior drawer (PCL), varus and valgus stress (collateral ligaments), joint line tenderness and Thessaly or McMurray positive (meniscus)', [
   ('Mild sprain, no instability', 'Ice, NSAIDs, early motion. Recheck in 4–6 weeks.'),
   ('Collateral ligament tear', 'Hinged brace and rehabilitation.'),
   ('ACL or meniscal tear suspected', 4)]),
 ('Physical therapy for 4–6 weeks; MRI if diagnosis unclear or surgery is being considered', [
   ('ACL tear in a young or active patient with instability', 'Orthopedic referral to discuss reconstruction. Rehabilitation alone is a reasonable option.'),
   ('Degenerative meniscal tear in a middle-aged or older patient', 'Exercise therapy. Arthroscopic surgery not recommended.'),
   ('Traumatic meniscal tear with mechanical locking', 'Orthopedic referral.'),
   ('MRI normal', 'Symptomatic treatment and follow-up.')]),
], ['The Lachman test is the most accurate exam for an ACL tear.', 'A large effusion within hours of injury suggests ACL tear or fracture.'])], C)

write('eee0390', [alg('292.2', 'Evaluation of Knee Pain Without Recent Injury', [
 ('Knee pain, no recent injury. Hot, swollen joint or fever?', [('Yes', 2), ('No', 3)]),
 ('Aspirate joint: cell count, Gram stain, culture, crystals', [
   ('Bacteria or very high white count', 'Septic arthritis. Urgent orthopedic referral and antibiotics.'),
   ('Crystals', 'Gout or calcium pyrophosphate (CPPD) arthritis. Treat the flare.'),
   ('Inflammatory without crystals', 'Rheumatology referral (rheumatoid, reactive, or Lyme arthritis).'),
   ('Non-inflammatory', 3)]),
 ('Red flags: night or unremitting pain, weight loss, history of cancer?', [('Yes', 'X-ray and prompt referral.'), ('No', 4)]),
 ('Age 45 or older, pain with activity, morning stiffness 30 minutes or less, joint line pain?', [
   ('Yes', 'Probable knee osteoarthritis. Clinical diagnosis; X-ray optional. Exercise, weight loss, topical then oral NSAIDs. Arthroscopy not recommended.'), ('No', 5)]),
 ('Where is the pain?', [
   ('Anterior pain with stairs, squatting, or sitting', 'Patellofemoral pain. Hip and knee strengthening.'),
   ('Below the kneecap, worse with jumping', 'Patellar tendinopathy. Progressive loading exercise.'),
   ('Lateral, in runners', 'Iliotibial band syndrome. Activity change, stretching, strengthening.'),
   ('Medial, below the joint line', 'Pes anserine bursitis. Exercise, ice, NSAIDs.'),
   ('No better after 3 months', 'X-ray; consider orthopedic or sports medicine referral. MRI only if it would change management.')]),
], ['Hip disease can present as knee pain, especially SCFE in adolescents.'])], C)

write('eee0394', [alg('341.2', 'Evaluation of Metatarsalgia', [
 ('Forefoot pain under the metatarsal heads. Specific cause suggested by exam?', [
   ('Point bone tenderness, swelling, recent increase in activity', 'Possible stress fracture. X-ray (often normal early; MRI if needed). Protected weight bearing.'),
   ('Burning or numbness between the toes, positive Mulder sign', 'Probable Morton neuroma. Wide shoes, metatarsal pad; ultrasound if unclear.'),
   ('Second toe joint swelling or drifting toe', 'Plantar plate injury or MTP joint synovitis. Taping, stiff-soled shoe; refer if persistent.'),
   ('Red, hot, swollen joint', 'Gout or infection. Aspirate and send for cells, culture, crystals.'),
   ('Bunion, claw or hammer toes, or high arch', 'Footwear change, orthoses; podiatry referral.'),
   ('None of these', 2)]),
 ('Conservative care for 6–12 weeks: wide toe box, metatarsal pad or insole, weight loss, activity change, NSAIDs', [
   ('Improved', 'Continue; preventive footwear.'), ('Not improved', 3)]),
 ('Weight-bearing X-ray if not done; check for systemic causes: diabetes or neuropathy (glucose, monofilament), peripheral artery disease (ankle–brachial index), inflammatory arthritis (ESR, CRP), gout (uric acid)', [
   ('Cause found', 'Treat or refer.'), ('No cause found', 'Ultrasound or MRI; podiatry or orthopedic referral.')]),
], ['Check sensation and pulses in every patient with diabetes.'])], C)
print('ok')
