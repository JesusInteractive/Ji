import type { TranslationShape } from './en';

// Arabic (Modern Standard). This locale is RTL -- see src/i18n/index.ts,
// which flips I18nManager.forceRTL when 'ar' is active.
const ar: TranslationShape = {
  common: {
    continue: 'متابعة',
    back: 'رجوع',
    accept: 'أوافق',
    decline: 'رفض',
    cancel: 'إلغاء',
    save: 'حفظ',
    retry: 'إعادة المحاولة',
    loading: 'جارٍ التحميل…',
    send: 'إرسال',
    close: 'إغلاق',
  },
  language: {
    title: 'اختر لغتك',
    subtitle: 'يمكنك تغيير هذا في أي وقت من الإعدادات.',
  },
  disclaimer: {
    title: 'قبل أن تبدأ',
    body:
      'يستخدم تطبيق Jesus Interactive الذكاء الاصطناعي لمحاكاة محادثة بصوت ' +
      'يسوع المسيح، مستندة إلى الكتاب المقدس. إنه أداة للتأمل الشخصي ' +
      'والتشجيع الروحي -- وهو ليس يسوع نفسه، ولا مستشارًا مرخصًا، ولا ' +
      'أخصائيًا طبيًا أو قانونيًا، وليس بديلاً عن الصلاة أو الكتاب المقدس أو ' +
      'شركة الكنيسة أو الرعاية الرعوية أو الدعم المهني للصحة النفسية. في ' +
      'حالات الأزمات، يرجى الاتصال فورًا برقم الطوارئ المحلي أو خط الأزمات.',
    checkbox: 'أفهم أن هذه محاكاة بالذكاء الاصطناعي وليست يسوع نفسه.',
  },
  agreement: {
    title: 'اتفاقية المستخدم والتعويض',
    checkbox: 'لقد قرأت ووافقت على اتفاقية المستخدم وسياسة الخصوصية وشروط التعويض.',
  },
  entrance: {
    verseReference: 'متى 7:7',
    verseText: 'اسألوا تعطوا. اطلبوا تجدوا. اقرعوا يفتح لكم.',
    cta: 'دخول',
  },
  pricing: {
    title: 'اختر خطتك',
    subtitle: 'يمكنك التغيير أو الإلغاء في أي وقت.',
    tokenTitle: 'أو أهدِ الوصول',
    tokenSubtitle: 'اشترِ رموزًا لنفسك أو أهدها لشخص لا يستطيع تحمل تكلفة خطة.',
  },
  home: {
    title: 'مرحباً',
    subtitle: 'إلى أين تودّ الذهاب؟',
  },
  tabs: {
    home: 'الرئيسية',
    chat: 'اسأل يسوع',
    prayerWall: 'حائط الصلاة',
    bible: 'الكتاب المقدس',
    journal: 'اليوميات',
    about: 'حول',
    settings: 'الإعدادات',
    studyTools: 'أدوات الدراسة',
    profile: 'الملف الشخصي',
  },
  chat: {
    inputPlaceholder: 'اطرح سؤالاً أو صلاة',
    limitReached: 'لقد وصلت إلى حد الأسئلة لهذا اليوم. عد غدًا أو قم بترقية خطتك.',
    whatDoYouThink: 'ما رأيك؟',
  },
  prayerWall: {
    title: 'الحائط',
    subtitle: 'ضع صلاة بين الحجارة.',
    inputPlaceholder: 'اكتب صلاتك…',
    anonymous: 'انشر بشكل مجهول',
    shared: 'شارك على الحائط العام',
    placed: 'تم وضع صلاتك.',
  },
  about: {
    title: 'عن يسوع',
    biography: 'السيرة الذاتية',
    lineage: 'النسب (إنجيل متى)',
    prophecies: 'النبوءات المتحققة',
  },
  settings: {
    account: 'الحساب',
    plan: 'الخطة الحالية',
    tokens: 'رصيد الرموز',
    giftTokens: 'إهداء رموز لشخص ما',
    preferences: 'التفضيلات',
    notifications: 'إشعارات الآية اليومية',
    dailyVerse: 'تذكير الآية اليومية',
    ageAppropriate: 'وضع المحتوى المناسب للعمر',
    offlineMode: 'وضع عدم الاتصال (المحتوى المخزن مؤقتًا فقط)',
    language: 'اللغة',
    privacyData: 'الخصوصية والبيانات',
    downloadData: 'تنزيل بياناتي',
    deleteAccount: 'حذف حسابي وجميع بياناتي',
    support: 'المجتمع والدعم',
    reportContent: 'الإبلاغ عن محتوى غير لائق',
    contactSupport: 'التواصل مع الدعم',
    about: 'حول',
    version: 'إصدار التطبيق',
    privacyPolicy: 'سياسة الخصوصية',
    terms: 'شروط الخدمة',
    disclosureLink: 'إفصاح الذكاء الاصطناعي',
  },
};

export default ar;
