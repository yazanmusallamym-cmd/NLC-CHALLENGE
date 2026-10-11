// Sample questions — one of every kind. Load them from Host → Questions → "Load samples", then edit freely.
export const SAMPLE_QUESTIONS = [
  {
    title_en: "Tutorial: Silent line-up", title_ar: "تجربة: الترتيب الصامت",
    body_en: "Each of you has a secret number. Line up from smallest to biggest WITHOUT saying your number. Hand signals only! Press “We're done” when your line is ready.",
    body_ar: "كل واحد عنده رقم سري. رتبوا حالكم من الأصغر للأكبر بدون ما تحكوا أرقامكم. بالإشارات بس! اضغطوا «خلصنا» لما يكون الصف جاهز.",
    type: "lineup", inputMode: "team", target: "all", timeLimit: 180, lineupRange: 0,
    scoring: "speed", points: "100,70,50,30", wrongPenalty: 0, practice: true,
    notes: "Walk the line and check the numbers before grading. Set a team's points to 0 if their order is wrong."
  },
  {
    title_en: "Capital city sprint", title_ar: "سباق العواصم",
    body_en: "What is the capital of Australia?", body_ar: "ما هي عاصمة أستراليا؟",
    type: "text", answer: "Canberra|كانبرا|كانبيرا", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 30,
    scoring: "speed", points: "100,70,50,30", wrongPenalty: 10, practice: false
  },
  {
    title_en: "Face-off: Player #5", title_ar: "مواجهة: اللاعب رقم ٥",
    body_en: "How many bones are in the adult human body? Closest guess wins.", body_ar: "كم عظمة في جسم الإنسان البالغ؟ الأقرب يفوز.",
    type: "number", answer: "206", tolerance: 0, inputMode: "team", target: "numbers", numbers: "5", timeLimit: 25,
    scoring: "closest", points: "100,70,50,30", practice: false
  },
  {
    title_en: "Face-off: Player #8", title_ar: "مواجهة: اللاعب رقم ٨",
    body_en: "Which planet has the most known moons?", body_ar: "أي كوكب عنده أكبر عدد من الأقمار المعروفة؟",
    type: "choice", options_en: ["Saturn", "Jupiter", "Uranus", "Neptune"], options_ar: ["زحل", "المشتري", "أورانوس", "نبتون"],
    answer: "1", inputMode: "team", target: "numbers", numbers: "8", timeLimit: 20,
    scoring: "speed", points: "100,70,50,30", wrongPenalty: 10, practice: false
  },
  {
    title_en: "EVERYONE IS IMPORTANT", title_ar: "الكل مهم",
    body_en: "Every single player answers: in what year did the first iPhone come out? Your team's points depend on how many of you get it right.",
    body_ar: "كل لاعب بيجاوب: بأي سنة طلع أول آيفون؟ نقاط فريقك بتعتمد على عدد اللي جاوبوا صح.",
    type: "number", answer: "2007", tolerance: 0, inputMode: "each", target: "all", timeLimit: 30,
    scoring: "correct", points: "200", practice: false
  },
  {
    title_en: "Human pyramid photo", title_ar: "صورة الهرم البشري",
    body_en: "One photographer per team. Send a photo of your WHOLE team in a human pyramid (safely!). Creativity counts.",
    body_ar: "مصور واحد لكل فريق. أرسلوا صورة لكل الفريق بهرم بشري (بأمان!). الإبداع بيحسب.",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 180,
    scoring: "manual", points: "150,100,75,50", practice: false,
    notes: "Turn on “Photos on screen” after locking — the room loves seeing them."
  },
  {
    title_en: "Rainbow hunt", title_ar: "صيد ألوان قوس قزح",
    body_en: "Bring the host 5 objects of 5 different colors. Press “We're done” when you're standing in front of the host.",
    body_ar: "جيبوا للمشرف ٥ أغراض بخمس ألوان مختلفة. اضغطوا «خلصنا» لما توصلوا عند المشرف.",
    type: "task", inputMode: "team", target: "all", timeLimit: 150,
    scoring: "speed", points: "120,90,60,30", practice: false
  },
  {
    title_en: "Selfie with a rival", title_ar: "سيلفي مع منافس",
    body_en: "EVERYONE: send a selfie with someone from ANOTHER team. Points = share of your team who did it.",
    body_ar: "الكل: أرسل سيلفي مع شخص من فريق ثاني. النقاط = نسبة اللي عملوها من فريقك.",
    type: "photo", inputMode: "each", target: "all", timeLimit: 120,
    scoring: "participation", points: "150", practice: false
  }
];
