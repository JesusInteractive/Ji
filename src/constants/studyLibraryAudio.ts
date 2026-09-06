// The "Read Aloud" starter shelf: a hand-picked subset of the existing
// 221 Study Tools resources (StudyToolsScreen.tsx's CATEGORIES) that are
// actually fetchable as plain text -- everything else in the library
// keeps today's "opens the source link" behavior unchanged. Deliberately
// its own list, not a flag scattered across all 36 categories, per the
// product decision to make audio-eligible titles unmistakable rather
// than something a user has to tap around to discover.
//
// v1 is Project Gutenberg only -- gutenberg.org's /ebooks/{id} pages have
// a single, reliable raw-text URL shape (services/studyLibraryReader.ts
// builds it from `gutenbergId` below). archive.org's plain-text quality
// varies far more per item (OCR'd djvu.txt, sometimes missing entirely),
// so that source is left for a later pass rather than shipped unreliable.
//
// This is EVERY resource in StudyToolsScreen.tsx's CATEGORIES whose url
// is a direct gutenberg.org/ebooks/{id} link (verified via script against
// the live file, not hand-picked) -- 43 of 221 total resources. The rest
// stay "Text only" on the shelf until a second source (Internet Archive,
// with its own text-reliability check) gets its own ingestion pass.
export interface ReadAloudTitle {
  id: string; // stable key, also used for TTS/text caching
  title: string;
  author: string;
  gutenbergId: number;
}

export const READ_ALOUD_TITLES: ReadAloudTitle[] = [
  { id: 'grace-abounding-to-the-chief', title: 'Grace Abounding to the Chief of Sinners', author: 'John Bunyan', gutenbergId: 654 },
  { id: 'hymns-and-spiritual-songs', title: 'Hymns and Spiritual Songs', author: 'Isaac Watts', gutenbergId: 13341 },
  { id: 'the-holy-war', title: 'The Holy War', author: 'John Bunyan', gutenbergId: 395 },
  { id: 'phantastes-a-faerie-romance', title: 'Phantastes: A Faerie Romance', author: 'George MacDonald', gutenbergId: 325 },
  { id: 'the-princess-and-the-goblin', title: 'The Princess and the Goblin', author: 'George MacDonald', gutenbergId: 708 },
  { id: 'the-princess-and-curdie', title: 'The Princess and Curdie', author: 'George MacDonald', gutenbergId: 709 },
  { id: 'at-the-back-of-the', title: 'At the Back of the North Wind', author: 'George MacDonald', gutenbergId: 225 },
  { id: 'the-light-princess', title: 'The Light Princess', author: 'George MacDonald', gutenbergId: 697 },
  { id: 'lilith-a-romance', title: 'Lilith: A Romance', author: 'George MacDonald', gutenbergId: 1640 },
  { id: 'the-faery-queen-and-her', title: 'The Faery Queen and Her Knights', author: 'retold by Alfred J. Church', gutenbergId: 55765 },
  { id: 'the-water-babies', title: 'The Water-Babies', author: 'Charles Kingsley', gutenbergId: 1018 },
  { id: 'the-man-who-was-thursday', title: 'The Man Who Was Thursday: A Nightmare', author: 'G.K. Chesterton', gutenbergId: 1695 },
  { id: 'courtship-and-marriage-and-the', title: 'Courtship and Marriage, and the Gentle Art of Home-Making', author: 'Annie S. Swan', gutenbergId: 35963 },
  { id: 'a-treatise-on-domestic-economy', title: 'A Treatise on Domestic Economy', author: 'Catharine Esther Beecher', gutenbergId: 21829 },
  { id: 'women-in-white-raiment', title: 'Women in White Raiment', author: 'John Lemley', gutenbergId: 69085 },
  { id: 'gold-dust-a-collection-of', title: 'Gold Dust: A Collection of Golden Counsels for the Sanctification of Daily Life', author: 'ed. Charlotte M. Yonge', gutenbergId: 27852 },
  { id: 'the-wedding-ring', title: 'The Wedding Ring', author: 'T. De Witt Talmage', gutenbergId: 22343 },
  { id: 'the-christian-home', title: 'The Christian Home', author: 'Samuel Philips', gutenbergId: 14237 },
  { id: 'a-christian-directory-part-2', title: 'A Christian Directory, Part 2: Christian Economics', author: 'Richard Baxter', gutenbergId: 43800 },
  { id: 'the-works-of-the-rev', title: 'The Works of the Rev. Hugh Binning', author: 'Hugh Binning', gutenbergId: 24238 },
  { id: 'a-christian-directory-part-3', title: 'A Christian Directory, Part 3: Christian Ecclesiastics', author: 'Richard Baxter', gutenbergId: 44655 },
  { id: 'mary-the-queen-of-the', title: 'Mary: The Queen of the House of David and Mother of Jesus', author: 'A. Stewart Walsh', gutenbergId: 60028 },
  { id: 'female-scripture-biography', title: 'Female Scripture Biography', author: 'F.A. Cox', gutenbergId: 9782 },
  { id: 'woman-in-sacred-history', title: 'Woman in Sacred History', author: 'Harriet Beecher Stowe', gutenbergId: 48872 },
  { id: 'the-patriarchs', title: 'The Patriarchs', author: 'J.G. Bellett', gutenbergId: 40216 },
  { id: 'bible-characters', title: 'Bible Characters', author: 'D.L. Moody, Joseph Parker & T. De Witt Talmage', gutenbergId: 54736 },
  { id: 'men-of-the-bible-some', title: 'Men of the Bible: Some Lesser-Known Characters', author: 'George Milligan and others', gutenbergId: 13860 },
  { id: 'legends-of-the-patriarchs-and', title: 'Legends of the Patriarchs and Prophets', author: 'S. Baring-Gould', gutenbergId: 48736 },
  { id: 'his-life-a-complete-story', title: 'His Life: A Complete Story in the Words of the Four Gospels', author: 'William E. Barton and others', gutenbergId: 16184 },
  { id: 'the-miracles-of-our-lord', title: 'The Miracles of Our Lord', author: 'George MacDonald', gutenbergId: 9103 },
  { id: 'lives-of-the-apostles-of', title: 'Lives of the Apostles of Jesus Christ', author: 'David Francis Bacon', gutenbergId: 71888 },
  { id: 'john-the-baptist', title: 'John the Baptist', author: 'F.B. Meyer', gutenbergId: 25904 },
  { id: 'the-life-of-jesus-christ', title: 'The Life of Jesus Christ for the Young, Volume Four', author: 'Richard Newton', gutenbergId: 67268 },
  { id: 'michael-faraday-his-life-and', title: 'Michael Faraday: His Life and Work', author: 'Silvanus P. Thompson', gutenbergId: 65735 },
  { id: 'michael-faraday', title: 'Michael Faraday', author: 'J.H. Gladstone', gutenbergId: 47396 },
  { id: 'james-clerk-maxwell-and-modern', title: 'James Clerk Maxwell and Modern Physics', author: 'Richard Glazebrook', gutenbergId: 65359 },
  { id: 'the-martyrs-of-science', title: 'The Martyrs of Science', author: 'David Brewster', gutenbergId: 25992 },
  { id: 'the-personal-life-of-david', title: 'The Personal Life of David Livingstone', author: 'W. Garden Blaikie', gutenbergId: 13262 },
  { id: 'pioneers-and-founders', title: 'Pioneers and Founders', author: 'Charlotte M. Yonge', gutenbergId: 19308 },
  { id: 'beacon-lights-of-history-volume', title: 'Beacon Lights of History, Volume XI: American Founders', author: 'John Lord', gutenbergId: 10644 },
  { id: 'lives-of-poor-boys-who', title: 'Lives of Poor Boys Who Became Famous', author: 'Sarah Knowles Bolton', gutenbergId: 35950 },
  { id: 'the-true-george-washington', title: 'The True George Washington', author: 'Paul Leicester Ford', gutenbergId: 12300 },
  { id: 'lectures-on-bible-revision', title: 'Lectures on Bible Revision', author: 'Samuel Newth', gutenbergId: 42514 },
];

// ElevenLabs' eleven_flash_v2_5 model (backend/server.js's TTS voice) --
// verified against ElevenLabs' own docs, not assumed. Outside this set,
// the reader falls back to the free on-device Narration voice
// (expo-speech) instead of a locked dead end -- see StudyLibraryReaderScreen.
// Codes match this app's own LanguageCode values (src/i18n/languages.ts),
// not raw ElevenLabs identifiers -- verified against that list directly,
// since a silent mismatch here (e.g. ElevenLabs' 'fil' vs this app's
// 'tl' for Filipino) would make the routing check below always fail for
// that language without ever throwing an error.
export const JESUS_VOICE_LANGUAGES = new Set<string>([
  'en', 'es', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it',
  'nl', 'tr', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi',
  'hr', 'ms', 'sk', 'da', 'hu', 'no', 'vi', 'ta', 'uk', 'ru',
  'id', 'tl',
]);

export function jesusVoiceSupportsLanguage(languageCode: string): boolean {
  return JESUS_VOICE_LANGUAGES.has(languageCode);
}
