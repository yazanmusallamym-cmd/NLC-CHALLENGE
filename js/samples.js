// Camp question pack — 50 questions in 4 groups. Host → Questions → "📦 Load camp pack (50)".
// ✏️ = needs something from you before the event (a photo, a quote or an answer). See each one's host notes.

const P = "100,70,50,30";          // default points by rank
const q = o => ({ wrongPenalty: 0, tolerance: 0, practice: false, requirePhoto: false, lineupRange: 0, groupSize: 1, numbers: "", ...o });

const ALL = [
  // =====================================================================
  // 🎉 FUN (12)
  // =====================================================================
  ...[1, 2, 3, 4].map(n => q({
    title_en: `🔍 Zoom #${n}: What is this?`, title_ar: `🔍 تكبير ${n}: شو هاد؟`,
    body_en: "A super zoomed-in photo of something here at camp. First correct answer wins!",
    body_ar: "صورة مكبّرة كثير لشي موجود هون بالمخيم. أول جواب صح بيربح!",
    type: "text", answer: "", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 40,
    scoring: "speed", points: P, wrongPenalty: 10,
    notes: "✏️ Take a very close-up photo of an object at camp (a door handle, a guitar string, a shoe lace…). Press 📷 Upload picture, then type the answer(s) in Correct answer, e.g. guitar|جيتار. Wrong guesses cost 10."
  })),
  ...[1, 2, 3].map(n => q({
    title_en: `🗣️ Who always says this? (${n})`, title_ar: `🗣️ مين دايماً بيحكي هالجملة؟ (${n})`,
    body_en: "«✏️ write the sentence here»\nType the name of the person who says it ALL the time.",
    body_ar: "«✏️ اكتب الجملة هون»\nاكتبوا اسم الشخص اللي بيحكيها طول الوقت.",
    type: "text", answer: "", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 30,
    scoring: "speed", points: P,
    notes: "✏️ Replace the «…» line (English + Arabic) with a phrase a leader or camper always says. Put their name(s) in Correct answer, e.g. Rami|رامي|Abu Rami."
  })),
  q({
    title_en: "🎬 Emoji movie", title_ar: "🎬 فيلم بالإيموجي",
    body_en: "Which movie is this?  🦁👑", body_ar: "أي فيلم هاد؟  🦁👑",
    type: "text", answer: "The Lion King|Lion King|الأسد الملك|الملك الأسد", inputMode: "team", target: "numbers", numbers: "1",
    timeLimit: 30, scoring: "speed", points: P, reveal_en: "The Lion King", reveal_ar: "الأسد الملك"
  }),
  q({
    title_en: "🎬 Emoji movie", title_ar: "🎬 فيلم بالإيموجي",
    body_en: "Which movie is this?  🚢🧊💔", body_ar: "أي فيلم هاد؟  🚢🧊💔",
    type: "text", answer: "Titanic|تايتانيك|تيتانيك", inputMode: "team", target: "numbers", numbers: "2",
    timeLimit: 30, scoring: "speed", points: P, reveal_en: "Titanic", reveal_ar: "تايتانيك"
  }),
  q({
    title_en: "🎬 Emoji movie", title_ar: "🎬 فيلم بالإيموجي",
    body_en: "Which movie is this?  🕷️🧑🕸️", body_ar: "أي فيلم هاد؟  🕷️🧑🕸️",
    type: "text", answer: "Spider-Man|Spiderman|Spider Man|سبايدرمان|سبايدر مان|الرجل العنكبوت", inputMode: "team", target: "numbers", numbers: "3",
    timeLimit: 30, scoring: "speed", points: P, reveal_en: "Spider-Man", reveal_ar: "الرجل العنكبوت"
  }),
  q({
    title_en: "🎨 60-second portrait", title_ar: "🎨 رسمة بـ ٦٠ ثانية",
    body_en: "One artist per team draws the HOST on paper in 60 seconds. Send a photo of the drawing. Funniest / best wins!",
    body_ar: "رسّام واحد من كل فريق يرسم المشرف على ورقة بـ ٦٠ ثانية. أرسلوا صورة الرسمة. الأحلى / الأضحك بيربح!",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 90,
    scoring: "manual", points: "100,70,50,30",
    notes: "Turn on 🖼 Photos on screen after locking — the room will love it. Type the points yourself."
  }),
  q({
    title_en: "😜 Copy the face", title_ar: "😜 قلّدوا الوجه",
    body_en: "The WHOLE team copies the host's silliest face — one photo with everyone in it.",
    body_ar: "كل الفريق يقلّد أغرب وجه بيعمله المشرف — صورة وحدة فيها الكل.",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 60,
    scoring: "manual", points: "100,70,50,30",
    notes: "Make your silly face on stage before starting the timer. Teams with someone missing from the photo get fewer points."
  }),

  // =====================================================================
  // 📖 BIBLE (14)
  // =====================================================================
  q({
    title_en: "📖 Swallowed!", title_ar: "📖 ابتلعه حوت!",
    body_en: "Who was swallowed by a great fish?", body_ar: "مين ابتلعه حوت كبير؟",
    type: "choice", options_en: ["Jonah", "Moses", "Elijah", "Peter"], options_ar: ["يونان", "موسى", "إيليا", "بطرس"],
    answer: "1", inputMode: "team", target: "numbers", numbers: "4", timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "📖 The first miracle", title_ar: "📖 أول معجزة",
    body_en: "What was Jesus' first miracle (John 2)?", body_ar: "شو كانت أول معجزة عملها يسوع (يوحنا ٢)؟",
    type: "choice",
    options_en: ["Walking on water", "Turning water into wine", "Feeding the 5,000", "Healing a blind man"],
    options_ar: ["المشي على الماء", "تحويل الماء إلى خمر", "إشباع الخمسة آلاف", "شفاء أعمى"],
    answer: "2", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "📖 How old?!", title_ar: "📖 قديش عاش؟!",
    body_en: "Methuselah is the oldest person in the Bible. How many years did he live? Closest wins!",
    body_ar: "متوشالح أكبر شخص عاش بالكتاب المقدس. كم سنة عاش؟ الأقرب بيربح!",
    type: "number", answer: "969", inputMode: "team", target: "numbers", numbers: "5", timeLimit: 25, scoring: "closest", points: P,
    reveal_en: "969 years (Genesis 5:27)", reveal_ar: "٩٦٩ سنة (تكوين ٥: ٢٧)"
  }),
  q({
    title_en: "📖 EVERYONE: the disciples", title_ar: "📖 الكل: التلاميذ",
    body_en: "Every player answers: how many disciples did Jesus choose?", body_ar: "كل لاعب يجاوب: كم تلميذ اختار يسوع؟",
    type: "number", answer: "12", inputMode: "each", target: "all", timeLimit: 20, scoring: "correct", points: "150"
  }),
  q({
    title_en: "📖 Rooster crow", title_ar: "📖 صياح الديك",
    body_en: "Which disciple denied Jesus three times before the rooster crowed?", body_ar: "أي تلميذ أنكر يسوع ثلاث مرات قبل ما يصيح الديك؟",
    type: "choice", options_en: ["John", "Thomas", "Peter", "Judas"], options_ar: ["يوحنا", "توما", "بطرس", "يهوذا"],
    answer: "3", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "📖 Up a tree", title_ar: "📖 فوق الشجرة",
    body_en: "Which short tax collector climbed a sycamore tree to see Jesus?", body_ar: "مين العشّار القصير اللي طلع على شجرة جمّيز ليشوف يسوع؟",
    type: "text", answer: "Zacchaeus|Zacheus|Zaccheus|زكا|زكّا", inputMode: "team", target: "numbers", numbers: "6",
    timeLimit: 30, scoring: "speed", points: P, reveal_en: "Zacchaeus (Luke 19)", reveal_ar: "زكّا (لوقا ١٩)"
  }),
  q({
    title_en: "📖 David vs Goliath", title_ar: "📖 داود وجليات",
    body_en: "How many smooth stones did David pick from the stream before facing Goliath?", body_ar: "كم حجر أملس أخذ داود من الوادي قبل ما يواجه جليات؟",
    type: "number", answer: "5", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10,
    reveal_en: "5 stones (1 Samuel 17:40)", reveal_ar: "٥ حجارة (١ صموئيل ١٧: ٤٠)"
  }),
  q({
    title_en: "📖 Baptism", title_ar: "📖 المعمودية",
    body_en: "In which river was Jesus baptized?", body_ar: "بأي نهر تعمّد يسوع؟",
    type: "text", answer: "Jordan|Jordan River|The Jordan|نهر الأردن|الأردن|الاردن|نهر الاردن", inputMode: "team", target: "rotate", groupSize: 2,
    timeLimit: 25, scoring: "speed", points: P, reveal_en: "The Jordan River", reveal_ar: "نهر الأردن"
  }),
  q({
    title_en: "📖 EVERYONE: fruit of the Spirit", title_ar: "📖 الكل: ثمر الروح",
    body_en: "Every player answers: how many fruit of the Spirit are listed in Galatians 5:22–23?", body_ar: "كل لاعب يجاوب: كم ثمر للروح مذكور في غلاطية ٥: ٢٢–٢٣؟",
    type: "number", answer: "9", inputMode: "each", target: "all", timeLimit: 30, scoring: "correct", points: "150",
    reveal_en: "9 — love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control",
    reveal_ar: "٩ — محبة، فرح، سلام، طول أناة، لطف، صلاح، إيمان، وداعة، تعفف"
  }),
  q({
    title_en: "📖 Shortest verse", title_ar: "📖 أقصر آية",
    body_en: "Finish the shortest verse in the Bible (John 11:35): “Jesus ___.”", body_ar: "كمّلوا أقصر آية بالكتاب المقدس (يوحنا ١١: ٣٥): «___ يسوع.»",
    type: "text", answer: "wept|cried|بكى", inputMode: "team", target: "numbers", numbers: "7",
    timeLimit: 25, scoring: "speed", points: P, reveal_en: "“Jesus wept.”", reveal_ar: "«بكى يسوع.»"
  }),
  q({
    title_en: "📖 Four days later", title_ar: "📖 بعد أربع أيام",
    body_en: "Who did Jesus raise from the dead after four days in the tomb?", body_ar: "مين أقام يسوع من الموت بعد أربع أيام بالقبر؟",
    type: "choice", options_en: ["Lazarus", "Jairus", "Nicodemus", "Bartimaeus"], options_ar: ["لعازر", "يايرس", "نيقوديموس", "بارتيماوس"],
    answer: "1", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "📖 Loaves and fish", title_ar: "📖 الخبز والسمك",
    body_en: "To feed the 5,000, how many loaves AND fish were there altogether? (one number)", body_ar: "لإشباع الخمسة آلاف، كم رغيف وسمكة كان في مع بعض؟ (رقم واحد)",
    type: "number", answer: "7", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 25, scoring: "speed", points: P, wrongPenalty: 10,
    reveal_en: "7 — five loaves and two fish", reveal_ar: "٧ — خمس أرغفة وسمكتين"
  }),
  q({
    title_en: "📖 The last book", title_ar: "📖 آخر سفر",
    body_en: "What is the LAST book of the Bible?", body_ar: "شو آخر سفر بالكتاب المقدس؟",
    type: "choice", options_en: ["Jude", "Revelation", "Malachi", "Acts"], options_ar: ["يهوذا", "رؤيا يوحنا", "ملاخي", "أعمال الرسل"],
    answer: "2", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "📖 EVERYONE: John 3:16", title_ar: "📖 الكل: يوحنا ٣: ١٦",
    body_en: "Every player fills the gap: “For God so loved the ___ …”", body_ar: "كل لاعب يعبّي الفراغ: «لأنه هكذا أحب الله ___ …»",
    type: "text", answer: "world|the world|العالم|عالم", inputMode: "each", target: "all", timeLimit: 25, scoring: "correct", points: "150",
    reveal_en: "the world", reveal_ar: "العالم"
  }),

  // =====================================================================
  // 🏃 ACTIVITY (12)
  // =====================================================================
  q({
    title_en: "🏃 Tutorial: Silent line-up", title_ar: "🏃 تجربة: الترتيب الصامت",
    body_en: "Everyone gets a secret number on their phone. Line up from smallest to biggest WITHOUT saying your number — hand signals only! Press “We're done” when ready.",
    body_ar: "كل واحد بياخد رقم سري على جواله. اصطفّوا من الأصغر للأكبر بدون ما تحكوا أرقامكم — إشارات بس! اضغطوا «خلصنا» لما تجهزوا.",
    type: "lineup", inputMode: "team", target: "all", timeLimit: 180, lineupRange: 0, scoring: "speed", points: P, practice: true,
    notes: "Practice round so everyone learns the app. Walk the lines and check the numbers."
  }),
  q({
    title_en: "🏃 Speed line-up: birthdays", title_ar: "🏃 ترتيب سريع: أعياد الميلاد",
    body_en: "Line up by birthday, January 1 → December 31. No talking! Press “We're done” when the line is ready.",
    body_ar: "اصطفّوا حسب تاريخ الميلاد من ١ كانون الثاني لـ ٣١ كانون الأول. ممنوع الحكي! اضغطوا «خلصنا» لما يجهز الصف.",
    type: "task", inputMode: "team", target: "all", timeLimit: 150, scoring: "speed", points: P,
    notes: "Check each line (ask birthdays down the line). A wrong order → set that team to 0 before applying. Deduct for talking."
  }),
  q({
    title_en: "🏃 Speed line-up: height", title_ar: "🏃 ترتيب سريع: الطول",
    body_en: "Line up from shortest to tallest — eyes CLOSED! Press “We're done” when ready.",
    body_ar: "اصطفّوا من الأقصر للأطول — وعيونكم مسكّرة! اضغطوا «خلصنا» لما تجهزوا.",
    type: "task", inputMode: "team", target: "all", timeLimit: 120, scoring: "speed", points: P,
    notes: "One player per team (their phone) can keep eyes open to press the button. Check order before applying."
  }),
  q({
    title_en: "🏃 Speed line-up: random numbers", title_ar: "🏃 ترتيب سريع: أرقام عشوائية",
    body_en: "Secret numbers from 1 to 100 this time — so there are gaps! Line up smallest → biggest without talking.",
    body_ar: "أرقام سرية من ١ لـ ١٠٠ هالمرة — يعني في فراغات! اصطفّوا من الأصغر للأكبر بدون حكي.",
    type: "lineup", inputMode: "team", target: "all", timeLimit: 150, lineupRange: 100, scoring: "speed", points: P,
    notes: "Harder than the tutorial because numbers aren't 1, 2, 3… Check each line."
  }),
  q({
    title_en: "🏃 Make a heart", title_ar: "🏃 اعملوا قلب",
    body_en: "Use your WHOLE team's bodies to make a giant ❤️ on the ground. One person takes the photo from above.",
    body_ar: "استعملوا أجسام كل الفريق لتعملوا ❤️ كبير على الأرض. واحد بيصوّر من فوق.",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 150, scoring: "manual", points: P,
    notes: "Show the photos on screen and rank them. Missing teammates = fewer points."
  }),
  q({
    title_en: "🏃 Spell NLC", title_ar: "🏃 اكتبوا NLC",
    body_en: "Spell the letters N L C with your bodies and send a photo.", body_ar: "اكتبوا الأحرف N L C بأجسامكم وأرسلوا صورة.",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 150, scoring: "manual", points: P,
    notes: "✏️ Change the letters if your camp name is different."
  }),
  q({
    title_en: "🏃 Make a star", title_ar: "🏃 اعملوا نجمة",
    body_en: "Make a ⭐ shape with your whole team — lying on the ground or holding hands. Photo from above!",
    body_ar: "اعملوا شكل ⭐ بكل الفريق — نايمين على الأرض أو ماسكين إيدين بعض. صوّروا من فوق!",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 150, scoring: "manual", points: P
  }),
  q({
    title_en: "🏃 Rainbow hunt", title_ar: "🏃 صيد قوس قزح",
    body_en: "Bring the host 5 objects in 5 different colours. Press “We're done” when you're standing in front of the host.",
    body_ar: "جيبوا للمشرف ٥ أغراض بخمس ألوان مختلفة. اضغطوا «خلصنا» لما توقفوا قدام المشرف.",
    type: "task", inputMode: "team", target: "all", timeLimit: 150, scoring: "speed", points: P,
    notes: "Check the colours before applying points."
  }),
  q({
    title_en: "🏃 Fetch it!", title_ar: "🏃 جيبوها!",
    body_en: "Get a leaf 🍃, a stone 🪨 and a shoe from someone on ANOTHER team. Send a photo of all three together.",
    body_ar: "جيبوا ورقة شجر 🍃 وحجر 🪨 وفردة حذاء من حدا بفريق ثاني. أرسلوا صورة للثلاثة مع بعض.",
    type: "task", requirePhoto: true, inputMode: "team", target: "rotate", groupSize: 3, timeLimit: 180, scoring: "speed", points: P,
    notes: "Only 3 runners per team are on duty — the rest cheer. Return the shoes after! 😄"
  }),
  q({
    title_en: "🏃 Shoe chain", title_ar: "🏃 سلسلة الأحذية",
    body_en: "Make the longest line using your team's shoes, toe to heel. Photo of the whole line!",
    body_ar: "اعملوا أطول خط بأحذية فريقكم، رأس بكعب. صوّروا الخط كامل!",
    type: "photo", inputMode: "team", target: "rotate", groupSize: 1, timeLimit: 120, scoring: "manual", points: P,
    notes: "Walk and compare the lines in real life, then rank."
  }),
  q({
    title_en: "🏃 EVERYONE: rival selfie", title_ar: "🏃 الكل: سيلفي مع منافس",
    body_en: "Every player sends a selfie with someone from ANOTHER team. Points = how many of your team did it.",
    body_ar: "كل لاعب يرسل سيلفي مع حدا من فريق ثاني. النقاط = قديش من فريقك عملها.",
    type: "photo", inputMode: "each", target: "all", timeLimit: 120, scoring: "participation", points: "150"
  }),
  q({
    title_en: "🏃 EVERYONE: something red", title_ar: "🏃 الكل: إشي أحمر",
    body_en: "Every player finds something RED (not on themselves!) and sends a photo of it.",
    body_ar: "كل لاعب يلاقي إشي أحمر (مش لابسه!) ويرسل صورته.",
    type: "photo", inputMode: "each", target: "all", timeLimit: 90, scoring: "participation", points: "150"
  }),

  // =====================================================================
  // 🧠 GENERAL KNOWLEDGE (12)
  // =====================================================================
  q({
    title_en: "🧠 Lowest place on Earth", title_ar: "🧠 أخفض مكان على الأرض",
    body_en: "What is the lowest point on land on Earth?", body_ar: "شو أخفض نقطة على اليابسة بالعالم؟",
    type: "text", answer: "Dead Sea|The Dead Sea|البحر الميت", inputMode: "team", target: "numbers", numbers: "1",
    timeLimit: 25, scoring: "speed", points: P, reveal_en: "The Dead Sea", reveal_ar: "البحر الميت"
  }),
  q({
    title_en: "🧠 Independence", title_ar: "🧠 الاستقلال",
    body_en: "In what year did Jordan become independent? Closest wins!", body_ar: "بأي سنة استقل الأردن؟ الأقرب بيربح!",
    type: "number", answer: "1946", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 25, scoring: "closest", points: P,
    reveal_en: "1946 (25 May)", reveal_ar: "١٩٤٦ (٢٥ أيار)"
  }),
  q({
    title_en: "🧠 Petra", title_ar: "🧠 البترا",
    body_en: "Which ancient people carved the city of Petra?", body_ar: "أي شعب قديم نحت مدينة البترا؟",
    type: "choice", options_en: ["Romans", "Nabataeans", "Greeks", "Pharaohs"], options_ar: ["الرومان", "الأنباط", "اليونان", "الفراعنة"],
    answer: "2", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "🧠 Capital city sprint", title_ar: "🧠 سباق العواصم",
    body_en: "What is the capital of Australia?", body_ar: "شو عاصمة أستراليا؟",
    type: "text", answer: "Canberra|كانبرا|كانبيرا", inputMode: "team", target: "numbers", numbers: "2",
    timeLimit: 25, scoring: "speed", points: P, wrongPenalty: 10, reveal_en: "Canberra", reveal_ar: "كانبرا"
  }),
  q({
    title_en: "🧠 Biggest planet", title_ar: "🧠 أكبر كوكب",
    body_en: "Which is the largest planet in our solar system?", body_ar: "شو أكبر كوكب بالمجموعة الشمسية؟",
    type: "choice", options_en: ["Saturn", "Earth", "Jupiter", "Neptune"], options_ar: ["زحل", "الأرض", "المشتري", "نبتون"],
    answer: "3", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "🧠 Bones", title_ar: "🧠 العظام",
    body_en: "How many bones are in an adult human body? Closest wins!", body_ar: "كم عظمة بجسم الإنسان البالغ؟ الأقرب بيربح!",
    type: "number", answer: "206", inputMode: "team", target: "numbers", numbers: "3", timeLimit: 25, scoring: "closest", points: P
  }),
  q({
    title_en: "🧠 Octopus", title_ar: "🧠 الأخطبوط",
    body_en: "How many hearts does an octopus have?", body_ar: "كم قلب عند الأخطبوط؟",
    type: "number", answer: "3", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "🧠 EVERYONE: minutes in a day", title_ar: "🧠 الكل: دقائق اليوم",
    body_en: "Every player, no calculators: how many minutes are in one day?", body_ar: "كل لاعب، بدون آلة حاسبة: كم دقيقة باليوم الواحد؟",
    type: "number", answer: "1440", inputMode: "each", target: "all", timeLimit: 40, scoring: "correct", points: "150",
    reveal_en: "1440 (24 × 60)", reveal_ar: "١٤٤٠ (٢٤ × ٦٠)"
  }),
  q({
    title_en: "🧠 Burj Khalifa", title_ar: "🧠 برج خليفة",
    body_en: "How tall is the Burj Khalifa, in metres? Closest wins!", body_ar: "قديش طول برج خليفة بالمتر؟ الأقرب بيربح!",
    type: "number", answer: "828", inputMode: "team", target: "numbers", numbers: "4", timeLimit: 25, scoring: "closest", points: P,
    reveal_en: "828 m", reveal_ar: "٨٢٨ متر"
  }),
  q({
    title_en: "🧠 Fastest on land", title_ar: "🧠 الأسرع على البر",
    body_en: "What is the fastest land animal?", body_ar: "شو أسرع حيوان على البر؟",
    type: "choice", options_en: ["Lion", "Horse", "Cheetah", "Gazelle"], options_ar: ["الأسد", "الحصان", "الفهد", "الغزال"],
    answer: "3", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "🧠 Biggest ocean", title_ar: "🧠 أكبر محيط",
    body_en: "Which is the largest ocean on Earth?", body_ar: "شو أكبر محيط بالعالم؟",
    type: "choice", options_en: ["Atlantic", "Indian", "Arctic", "Pacific"], options_ar: ["الأطلسي", "الهندي", "المتجمد الشمالي", "الهادئ"],
    answer: "4", inputMode: "team", target: "numbers", numbers: "5", timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10
  }),
  q({
    title_en: "🧠 Gold", title_ar: "🧠 الذهب",
    body_en: "What is the chemical symbol for gold?", body_ar: "شو الرمز الكيميائي للذهب؟",
    type: "text", answer: "Au", inputMode: "team", target: "rotate", groupSize: 2, timeLimit: 20, scoring: "speed", points: P, wrongPenalty: 10,
    reveal_en: "Au", reveal_ar: "Au"
  })
];

// Tutorial first, then the rest in order.
const tut = ALL.findIndex(x => x.title_en.includes("Tutorial"));
export const SAMPLE_QUESTIONS = [ALL[tut], ...ALL.filter((_, i) => i !== tut)];
