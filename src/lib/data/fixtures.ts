import type { DebateDetail, Person } from "@/lib/types";

/**
 * Demo content shown when Supabase is not configured, so the design can be
 * reviewed immediately. Mirrors `supabase/seed.sql`. All names and topics are
 * fictional — not real political figures. Video IDs are Blender Foundation
 * open movies used purely as visual placeholders; replace with real
 * recordings.
 */

const people = {
  leila: {
    id: "p-leila",
    name_ar: "د. ليلى المصري",
    title_ar: "أستاذة اقتصاد سياسي",
    bio_ar:
      "تُدرّس الاقتصاد السياسي وتكتب عن سياسات المال العام وإعادة الإعمار. لها أبحاث في تمويل التنمية وحوكمة الموارد.",
    image_url: null,
    slug: "leila-almasri",
  },
  samer: {
    id: "p-samer",
    name_ar: "سامر الحلبي",
    title_ar: "كاتب وباحث في الشأن العام",
    bio_ar:
      "باحث مستقل يهتمّ بالإصلاح المؤسسي والسياسات الاجتماعية، وله مقالات دورية في الصحافة العربية.",
    image_url: null,
    slug: "samer-alhalabi",
  },
  nour: {
    id: "p-nour",
    name_ar: "نور العطّار",
    title_ar: "محامية وباحثة في الحوكمة المحلية",
    bio_ar:
      "تعمل على قضايا الإدارة المحلية والمشاركة المدنية، وشاركت في مراجعات تشريعية متعلّقة باللامركزية.",
    image_url: null,
    slug: "nour-alattar",
  },
  rami: {
    id: "p-rami",
    name_ar: "رامي دلعو",
    title_ar: "صحفي اقتصادي",
    bio_ar:
      "يغطّي الاقتصاد والمال العام منذ أكثر من عشر سنوات، ويهتمّ بشفافية العقود العامة.",
    image_url: null,
    slug: "rami-dalou",
  },
  hala: {
    id: "p-hala",
    name_ar: "هالة الشامي",
    title_ar: "باحثة في علم الاجتماع السياسي",
    bio_ar:
      "تركّز أبحاثها على التعليم والهوية والذاكرة الجماعية في مجتمعات ما بعد النزاع.",
    image_url: null,
    slug: "hala-alshami",
  },
  kanan: {
    id: "p-kanan",
    name_ar: "كنان بدوي",
    title_ar: "مهندس ومنظّم مجتمعي",
    bio_ar:
      "عمل في مشاريع خدمات محلية وإعادة تأهيل بنى تحتية، ويكتب عن إدارة المدن.",
    image_url: null,
    slug: "kanan-badawi",
  },
  fadi: {
    id: "p-fadi",
    name_ar: "د. فادي حوراني",
    title_ar: "أستاذ قانون دستوري",
    bio_ar:
      "متخصّص في القانون الدستوري المقارن وترتيبات الحكم في المراحل الانتقالية.",
    image_url: null,
    slug: "fadi-hourani",
  },
  reem: {
    id: "p-reem",
    name_ar: "ريم قاسيون",
    title_ar: "صحفية ومحاوِرة",
    bio_ar: "قدّمت برامج حوارية عن الشأن العام، وتهتمّ بأدب الاختلاف في النقاش.",
    image_url: null,
    slug: "reem-qasioun",
  },
} satisfies Record<string, Person>;

export const FIXTURE_DEBATES: DebateDetail[] = [
  {
    id: "d-lamarkaziyya",
    slug: "al-lamarkaziyya-al-idariyya",
    title_ar:
      "اللامركزية الإدارية في سوريا: مدخل لإعادة البناء أم طريق إلى التفكّك؟",
    summary_ar:
      "نقاش هادئ حول توزيع الصلاحيات بين المركز والأقاليم: ما الذي يعزّز الخدمات والمساءلة، وما الذي قد يفتح باب الانقسام؟",
    description_ar:
      "تطرح المرحلة الانتقالية سؤالاً قديماً بصيغة جديدة: كيف تُدار الدولة؟ يرى فريق أنّ توسيع صلاحيات الإدارات المحلية يقرّب القرار من الناس ويحسّن الخدمات ويعيد الثقة، بينما يرى فريق آخر أنّ مركزية انتقالية منضبطة ضرورية لإعادة بناء المؤسسات وضمان المساواة بين المناطق قبل أيّ توسيع في الصلاحيات. تتناول المناظرة الحوكمة المالية، والعدالة بين الأقاليم، وتسلسل الخطوات الزمني.",
    status: "upcoming",
    starts_at: "2026-10-02T18:00:00+03:00",
    timezone: "Asia/Damascus",
    location_ar: "بثّ مباشر عبر الإنترنت",
    youtube_video_id: null,
    cover_image_url: null,
    registration_open: true,
    broadcast_url: null,
    youtube_url: null,
    speakers: [people.nour, people.kanan],
    moderator: people.fadi,
    participants: [
      {
        person: people.nour,
        role: "speaker",
        position_label_ar: "مع توسيع الصلاحيات المحلية",
        sort_order: 0,
      },
      {
        person: people.kanan,
        role: "speaker",
        position_label_ar: "مع مركزية انتقالية منضبطة",
        sort_order: 1,
      },
    ],
  },
  {
    id: "d-iadat-al-iemar",
    slug: "iadat-al-iemar-man-yumawwil",
    title_ar: "إعادة الإعمار: من يموّل، ومن يقرّر الأولويات؟",
    summary_ar:
      "بين التمويل الخارجي والموارد الداخلية، ومن يملك حقّ ترتيب الأولويات: السكن، البنية التحتية، أم الاقتصاد المنتج؟",
    description_ar:
      "تقدّر كلفة إعادة الإعمار بعشرات المليارات، ومصدر التمويل يحدّد إلى حدّ بعيد من يرسم الأولويات. ناقش المتناظران خيارات التمويل وشروطها، ودور القطاع الخاص، وآليات الشفافية في العقود العامة، والموازنة بين الإغاثة العاجلة والاستثمار طويل الأمد.",
    status: "completed",
    starts_at: "2026-06-12T18:00:00+03:00",
    timezone: "Asia/Damascus",
    location_ar: null,
    youtube_video_id: "aqz-KE-bpKQ",
    cover_image_url: null,
    registration_open: false,
    broadcast_url: null,
    youtube_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    speakers: [people.leila, people.rami],
    moderator: people.reem,
    participants: [
      {
        person: people.leila,
        role: "speaker",
        position_label_ar: "أولوية للاقتصاد المنتج",
        sort_order: 0,
      },
      {
        person: people.rami,
        role: "speaker",
        position_label_ar: "أولوية للسكن والبنية التحتية",
        sort_order: 1,
      },
    ],
  },
  {
    id: "d-al-taleem",
    slug: "al-taleem-fi-marhala-intiqaliyya",
    title_ar: "التعليم في مرحلة انتقالية: منهج موحّد أم مناهج متعدّدة؟",
    summary_ar:
      "كيف نوازن بين وحدة الهوية الوطنية وتنوّع المجتمع، وبين المركزية التربوية ومرونة المدارس؟",
    description_ar:
      "المناهج الدراسية ليست مسألة تربوية فقط، بل سؤال عن السردية الوطنية والذاكرة المشتركة. تناولت المناظرة حدود التوحيد، ومساحة التنوّع المحلي، وتدريس التاريخ القريب، ودور المعلّم.",
    status: "completed",
    starts_at: "2026-03-20T18:00:00+03:00",
    timezone: "Asia/Damascus",
    location_ar: null,
    youtube_video_id: "eRsGyueVLvQ",
    cover_image_url: null,
    registration_open: false,
    broadcast_url: null,
    youtube_url: "https://www.youtube.com/watch?v=eRsGyueVLvQ",
    speakers: [people.hala, people.samer],
    moderator: people.reem,
    participants: [
      {
        person: people.hala,
        role: "speaker",
        position_label_ar: "مع منهج وطني موحّد",
        sort_order: 0,
      },
      {
        person: people.samer,
        role: "speaker",
        position_label_ar: "مع مرونة ومناهج متعدّدة",
        sort_order: 1,
      },
    ],
  },
  {
    id: "d-al-iilaam",
    slug: "al-iilaam-al-aam-khidma-am-tawjih",
    title_ar: "الإعلام العام: خدمة عمومية مستقلّة أم أداة توجيه؟",
    summary_ar:
      "ما الذي يجعل مؤسسة إعلام عامة جديرة بالثقة: التمويل، الحوكمة، أم مسافتها من السلطة؟",
    description_ar:
      "بحثت المناظرة في نماذج الإعلام العام حول العالم، وشروط استقلاليته، وآليات تمويله وحوكمته، والفرق بين إعلام الدولة وإعلام الخدمة العامة.",
    status: "archived",
    starts_at: "2025-11-15T18:00:00+03:00",
    timezone: "Asia/Damascus",
    location_ar: null,
    youtube_video_id: "R6MlUcmOul8",
    cover_image_url: null,
    registration_open: false,
    broadcast_url: null,
    youtube_url: "https://www.youtube.com/watch?v=R6MlUcmOul8",
    speakers: [people.rami, people.samer],
    moderator: people.fadi,
    participants: [
      {
        person: people.rami,
        role: "speaker",
        position_label_ar: "مع نموذج خدمة عامة مستقلّ",
        sort_order: 0,
      },
      {
        person: people.samer,
        role: "speaker",
        position_label_ar: "مع إشراف عام في المرحلة الانتقالية",
        sort_order: 1,
      },
    ],
  },
];
