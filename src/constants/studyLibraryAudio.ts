// The Study Library's readable books: everything on its shelves that can
// be fetched as clean plain text, which today means Project Gutenberg --
// gutenberg.org's /ebooks/{id} pages have a single, reliable raw-text URL
// shape (services/studyLibraryReader.ts builds it from `gutenbergId`
// below). Other sources (archive.org's OCR, CCEL, Sefaria, eBible) vary
// too much per item to ship unchecked, so their books stay "open at the
// source" until each gets its own verified ingestion pass.
//
// The list: the catalog's own Gutenberg entries (StudyToolsScreen.tsx's
// CATEGORIES), classic Christian books added for the library, and the 66
// books of the King James Bible -- every Gutenberg id checked against
// Gutenberg's catalog, every text downloaded and its opening checked,
// before it went in.
//
// Every readable book in the Study Library has one of two readers, and
// the shelf shows which before you pick it up (gold mark = Jesus AI,
// plain mark = the Scholar) -- the voice never changes partway through.
// Jesus AI reads Scripture, the devotionals and the Christian classics;
// the Scholar reads everything else: commentaries, biographies, history,
// reference.
export type LibraryVoice = 'jesus' | 'scholar';

// The Scholar's ElevenLabs voice, designed from this direction: "A young
// British male, mid-twenties to early thirties. Clear Received
// Pronunciation with a slight warmth -- not a newsreader, not a vicar.
// Think a junior fellow reading aloud in a college library. Measured
// pace, slight lift at the end of sentences, never theatrical." The app
// sends it with every Scholar request; backend/server.js's
// ELEVENLABS_SCHOLAR_VOICE_ID overrides it when set. Either way the
// Scholar never falls back to Jesus's voice.
export const SCHOLAR_VOICE_ID = 'JmPRMU8qOJ1ijbVU16Ob';

// Shelves the Scholar reads by default; a title's own `voice` wins.
const SCHOLAR_SHELVES = new Set(['Church Fathers & History', 'Lives & Testimonies', 'Home & Family']);

export function voiceFor(title: ReadAloudTitle): LibraryVoice {
  if (title.voice) return title.voice;
  return !title.shelf || SCHOLAR_SHELVES.has(title.shelf) ? 'scholar' : 'jesus';
}

// The Study Library's themed Read Aloud shelves, top to bottom.
export const BIBLE_SHELF = 'The Holy Bible (King James Version)';
export const READ_ALOUD_SHELVES = [
  BIBLE_SHELF,
  'Stories & Allegories',
  'Prayer & Devotion',
  'Sermons & Teaching',
  'Church Fathers & History',
  'Lives & Testimonies',
  'Bible Characters & the Life of Jesus',
  'Poetry & Hymns',
  'Home & Family',
  'For Children',
];

export interface ReadAloudTitle {
  id: string; // stable key, also used for TTS/text caching
  title: string;
  author: string;
  gutenbergId: number;
  // Which themed shelf it sits on in the Study Library. Without one, the
  // book stays on its catalog category's shelf (StudyToolsScreen's
  // CATEGORIES) -- how the Scholar's commentaries and references sit.
  shelf?: string;
  // Who reads it, when not the shelf's default (see voiceFor).
  voice?: LibraryVoice;
  // 1 (a pamphlet) to 5 (a tome), from the book's real length -- sets
  // how thick its spine is on the shelf.
  thickness?: number;
  // Opening words of the paragraph the reading voice starts at, for books
  // whose front matter fools services/readAloudText.ts's findMainStart.
  startsAt?: string;
}

export const READ_ALOUD_TITLES: ReadAloudTitle[] = [
  { id: 'grace-abounding-to-the-chief', title: 'Grace Abounding to the Chief of Sinners', author: 'John Bunyan', gutenbergId: 654, shelf: 'Lives & Testimonies', thickness: 3, startsAt: 'IN this my relation' },
  { id: 'hymns-and-spiritual-songs', title: 'Hymns and Spiritual Songs', author: 'Isaac Watts', gutenbergId: 13341, shelf: 'Poetry & Hymns', voice: 'scholar', thickness: 3, startsAt: 'Hymn . A new song to the Lamb' },
  { id: 'the-holy-war', title: 'The Holy War', author: 'John Bunyan', gutenbergId: 395, shelf: 'Stories & Allegories', thickness: 4, startsAt: 'In my travels' },
  { id: 'phantastes-a-faerie-romance', title: 'Phantastes: A Faerie Romance', author: 'George MacDonald', gutenbergId: 325, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'the-princess-and-the-goblin', title: 'The Princess and the Goblin', author: 'George MacDonald', gutenbergId: 708, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'the-princess-and-curdie', title: 'The Princess and Curdie', author: 'George MacDonald', gutenbergId: 709, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'at-the-back-of-the', title: 'At the Back of the North Wind', author: 'George MacDonald', gutenbergId: 225, shelf: 'Stories & Allegories', thickness: 4 },
  { id: 'the-light-princess', title: 'The Light Princess', author: 'George MacDonald', gutenbergId: 697, shelf: 'Stories & Allegories', thickness: 2, startsAt: '1. What! No Children?' },
  { id: 'lilith-a-romance', title: 'Lilith: A Romance', author: 'George MacDonald', gutenbergId: 1640, shelf: 'Stories & Allegories', thickness: 4 },
  { id: 'the-faery-queen-and-her', title: 'The Faery Queen and Her Knights', author: 'retold by Alfred J. Church', gutenbergId: 55765, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'the-water-babies', title: 'The Water-Babies', author: 'Charles Kingsley', gutenbergId: 1018, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'the-man-who-was-thursday', title: 'The Man Who Was Thursday: A Nightmare', author: 'G.K. Chesterton', gutenbergId: 1695, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'courtship-and-marriage-and-the', title: 'Courtship and Marriage, and the Gentle Art of Home-Making', author: 'Annie S. Swan', gutenbergId: 35963, shelf: 'Home & Family', thickness: 2 },
  { id: 'a-treatise-on-domestic-economy', title: 'A Treatise on Domestic Economy', author: 'Catharine Esther Beecher', gutenbergId: 21829, shelf: 'Home & Family', thickness: 4 },
  { id: 'women-in-white-raiment', title: 'Women in White Raiment', author: 'John Lemley', gutenbergId: 69085, shelf: 'Bible Characters & the Life of Jesus', thickness: 4 },
  { id: 'gold-dust-a-collection-of', title: 'Gold Dust: A Collection of Golden Counsels for the Sanctification of Daily Life', author: 'ed. Charlotte M. Yonge', gutenbergId: 27852, shelf: 'Prayer & Devotion', thickness: 2, startsAt: '"My LORD!"' },
  { id: 'the-wedding-ring', title: 'The Wedding Ring', author: 'T. De Witt Talmage', gutenbergId: 22343, shelf: 'Home & Family', thickness: 3 },
  { id: 'the-christian-home', title: 'The Christian Home', author: 'Samuel Philips', gutenbergId: 14237, shelf: 'Home & Family', thickness: 4 },
  { id: 'a-christian-directory-part-2', title: 'A Christian Directory, Part 2: Christian Economics', author: 'Richard Baxter', gutenbergId: 43800, shelf: 'Sermons & Teaching', thickness: 5 },
  { id: 'the-works-of-the-rev', title: 'The Works of the Rev. Hugh Binning', author: 'Hugh Binning', gutenbergId: 24238, shelf: 'Sermons & Teaching', thickness: 5 },
  { id: 'a-christian-directory-part-3', title: 'A Christian Directory, Part 3: Christian Ecclesiastics', author: 'Richard Baxter', gutenbergId: 44655, shelf: 'Sermons & Teaching', thickness: 5 },
  { id: 'mary-the-queen-of-the', title: 'Mary: The Queen of the House of David and Mother of Jesus', author: 'A. Stewart Walsh', gutenbergId: 60028, shelf: 'Bible Characters & the Life of Jesus', thickness: 5 },
  { id: 'female-scripture-biography', title: 'Female Scripture Biography', author: 'F.A. Cox', gutenbergId: 9782, shelf: 'Bible Characters & the Life of Jesus', thickness: 4 },
  { id: 'woman-in-sacred-history', title: 'Woman in Sacred History', author: 'Harriet Beecher Stowe', gutenbergId: 48872, shelf: 'Bible Characters & the Life of Jesus', thickness: 3 },
  { id: 'the-patriarchs', title: 'The Patriarchs', author: 'J.G. Bellett', gutenbergId: 40216, shelf: 'Bible Characters & the Life of Jesus', thickness: 4, startsAt: 'It is not so much of Enoch' },
  { id: 'bible-characters', title: 'Bible Characters', author: 'D.L. Moody, Joseph Parker & T. De Witt Talmage', gutenbergId: 54736, shelf: 'Bible Characters & the Life of Jesus', thickness: 4 },
  { id: 'men-of-the-bible-some', title: 'Men of the Bible: Some Lesser-Known Characters', author: 'George Milligan and others', gutenbergId: 13860, shelf: 'Bible Characters & the Life of Jesus', thickness: 3 },
  { id: 'legends-of-the-patriarchs-and', title: 'Legends of the Patriarchs and Prophets', author: 'S. Baring-Gould', gutenbergId: 48736, shelf: 'Bible Characters & the Life of Jesus', voice: 'scholar', thickness: 4, startsAt: 'In the beginning, before the creation' },
  { id: 'his-life-a-complete-story', title: 'His Life: A Complete Story in the Words of the Four Gospels', author: 'William E. Barton and others', gutenbergId: 16184, shelf: 'Bible Characters & the Life of Jesus', thickness: 3, startsAt: 'In the beginning was the Word' },
  { id: 'the-miracles-of-our-lord', title: 'The Miracles of Our Lord', author: 'George MacDonald', gutenbergId: 9103, shelf: 'Bible Characters & the Life of Jesus', thickness: 3 },
  { id: 'lives-of-the-apostles-of', title: 'Lives of the Apostles of Jesus Christ', author: 'David Francis Bacon', gutenbergId: 71888, shelf: 'Bible Characters & the Life of Jesus', voice: 'scholar', thickness: 5 },
  { id: 'john-the-baptist', title: 'John the Baptist', author: 'F.B. Meyer', gutenbergId: 25904, shelf: 'Bible Characters & the Life of Jesus', thickness: 3, startsAt: '"John, than which man' },
  { id: 'the-life-of-jesus-christ', title: 'The Life of Jesus Christ for the Young, Volume Four', author: 'Richard Newton', gutenbergId: 67268, shelf: 'For Children', thickness: 3 },
  { id: 'michael-faraday-his-life-and', title: 'Michael Faraday: His Life and Work', author: 'Silvanus P. Thompson', gutenbergId: 65735, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'michael-faraday', title: 'Michael Faraday', author: 'J.H. Gladstone', gutenbergId: 47396, shelf: 'Lives & Testimonies', thickness: 3 },
  { id: 'james-clerk-maxwell-and-modern', title: 'James Clerk Maxwell and Modern Physics', author: 'Richard Glazebrook', gutenbergId: 65359, shelf: 'Lives & Testimonies', thickness: 3 },
  { id: 'the-martyrs-of-science', title: 'The Martyrs of Science', author: 'David Brewster', gutenbergId: 25992, shelf: 'Lives & Testimonies', thickness: 3 },
  { id: 'the-personal-life-of-david', title: 'The Personal Life of David Livingstone', author: 'W. Garden Blaikie', gutenbergId: 13262, shelf: 'Lives & Testimonies', thickness: 5 },
  { id: 'pioneers-and-founders', title: 'Pioneers and Founders', author: 'Charlotte M. Yonge', gutenbergId: 19308, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'beacon-lights-of-history-volume', title: 'Beacon Lights of History, Volume XI: American Founders', author: 'John Lord', gutenbergId: 10644, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'lives-of-poor-boys-who', title: 'Lives of Poor Boys Who Became Famous', author: 'Sarah Knowles Bolton', gutenbergId: 35950, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'the-true-george-washington', title: 'The True George Washington', author: 'Paul Leicester Ford', gutenbergId: 12300, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'lectures-on-bible-revision', title: 'Lectures on Bible Revision', author: 'Samuel Newth', gutenbergId: 42514, shelf: 'Sermons & Teaching', voice: 'scholar', thickness: 4 },
  { id: 'the-pilgrim-s-progress', title: 'The Pilgrim\'s Progress', author: 'John Bunyan', gutenbergId: 131, shelf: 'Stories & Allegories', thickness: 3, startsAt: 'As I walked through the wilderness' },
  { id: 'the-life-and-death-of-mr', title: 'The Life and Death of Mr. Badman', author: 'John Bunyan', gutenbergId: 1986, shelf: 'Stories & Allegories', thickness: 3, startsAt: 'Good morrow my good Neighbour' },
  { id: 'in-his-steps', title: 'In His Steps', author: 'Charles M. Sheldon', gutenbergId: 4540, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'ben-hur-a-tale-of-the', title: 'Ben-Hur: A Tale of the Christ', author: 'Lew Wallace', gutenbergId: 2145, shelf: 'Stories & Allegories', thickness: 5 },
  { id: 'quo-vadis', title: 'Quo Vadis', author: 'Henryk Sienkiewicz', gutenbergId: 2853, shelf: 'Stories & Allegories', thickness: 5 },
  { id: 'the-story-of-the-other-wise', title: 'The Story of the Other Wise Man', author: 'Henry van Dyke', gutenbergId: 10679, shelf: 'Stories & Allegories', thickness: 1, startsAt: 'In the days when Augustus Caesar' },
  { id: 'the-first-christmas-tree', title: 'The First Christmas Tree', author: 'Henry van Dyke', gutenbergId: 16134, shelf: 'Stories & Allegories', thickness: 1 },
  { id: 'a-christmas-carol', title: 'A Christmas Carol', author: 'Charles Dickens', gutenbergId: 46, shelf: 'Stories & Allegories', thickness: 2, startsAt: 'STAVE I: MARLEY\'S GHOST' },
  { id: 'the-innocence-of-father-brown', title: 'The Innocence of Father Brown', author: 'G.K. Chesterton', gutenbergId: 204, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'the-wisdom-of-father-brown', title: 'The Wisdom of Father Brown', author: 'G.K. Chesterton', gutenbergId: 223, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'stepping-heavenward', title: 'Stepping Heavenward', author: 'Elizabeth Prentiss', gutenbergId: 2515, shelf: 'Stories & Allegories', thickness: 4 },
  { id: 'elsie-dinsmore', title: 'Elsie Dinsmore', author: 'Martha Finley', gutenbergId: 6440, shelf: 'Stories & Allegories', thickness: 3 },
  { id: 'paradise-lost', title: 'Paradise Lost', author: 'John Milton', gutenbergId: 26, shelf: 'Poetry & Hymns', thickness: 4 },
  { id: 'paradise-regained', title: 'Paradise Regained', author: 'John Milton', gutenbergId: 58, shelf: 'Poetry & Hymns', thickness: 2 },
  { id: 'the-divine-comedy', title: 'The Divine Comedy', author: 'Dante Alighieri', gutenbergId: 8800, shelf: 'Poetry & Hymns', thickness: 4 },
  { id: 'the-diary-of-an-old-soul', title: 'The Diary of an Old Soul', author: 'George MacDonald', gutenbergId: 1953, shelf: 'Poetry & Hymns', voice: 'scholar', thickness: 2 },
  { id: 'morning-bells', title: 'Morning Bells', author: 'Frances Ridley Havergal', gutenbergId: 11563, shelf: 'For Children', thickness: 1, startsAt: '1. First Day.' },
  { id: 'the-imitation-of-christ', title: 'The Imitation of Christ', author: 'Thomas à Kempis', gutenbergId: 1653, shelf: 'Prayer & Devotion', thickness: 3 },
  { id: 'the-practice-of-the-presence-of', title: 'The Practice of the Presence of God', author: 'Brother Lawrence', gutenbergId: 5657, shelf: 'Prayer & Devotion', thickness: 1, startsAt: 'First Conversation' },
  { id: 'the-greatest-thing-in-the-world', title: 'The Greatest Thing in the World', author: 'Henry Drummond', gutenbergId: 16739, shelf: 'Prayer & Devotion', thickness: 2 },
  { id: 'power-through-prayer', title: 'Power Through Prayer', author: 'E.M. Bounds', gutenbergId: 65115, shelf: 'Prayer & Devotion', thickness: 2, startsAt: 'We are constantly on a stretch' },
  { id: 'purpose-in-prayer', title: 'Purpose in Prayer', author: 'E.M. Bounds', gutenbergId: 66112, shelf: 'Prayer & Devotion', thickness: 3 },
  { id: 'prayer-and-praying-men', title: 'Prayer and Praying Men', author: 'E.M. Bounds', gutenbergId: 70657, shelf: 'Prayer & Devotion', thickness: 2 },
  { id: 'the-essentials-of-prayer', title: 'The Essentials of Prayer', author: 'E.M. Bounds', gutenbergId: 73271, shelf: 'Prayer & Devotion', thickness: 2, startsAt: 'PRAYER TAKES IN THE WHOLE MAN' },
  { id: 'preacher-and-prayer', title: 'Preacher and Prayer', author: 'E.M. Bounds', gutenbergId: 63486, shelf: 'Prayer & Devotion', thickness: 2, startsAt: 'Study universal holiness of life' },
  { id: 'the-reality-of-prayer', title: 'The Reality of Prayer', author: 'E.M. Bounds', gutenbergId: 73032, shelf: 'Prayer & Devotion', thickness: 3, startsAt: 'I PRAYER—A PRIVILEGE' },
  { id: 'humility-the-beauty-of-holiness', title: 'Humility: The Beauty of Holiness', author: 'Andrew Murray', gutenbergId: 57121, shelf: 'Prayer & Devotion', thickness: 2 },
  { id: 'lord-teach-us-to-pray', title: 'Lord, Teach Us to Pray', author: 'Andrew Murray', gutenbergId: 26709, shelf: 'Prayer & Devotion', thickness: 1 },
  { id: 'the-ministry-of-intercession', title: 'The Ministry of Intercession', author: 'Andrew Murray', gutenbergId: 29296, shelf: 'Prayer & Devotion', thickness: 3, startsAt: 'The Lack of Prayer' },
  { id: 'the-spirit-filled-life', title: 'The Spirit-Filled Life', author: 'Andrew Murray', gutenbergId: 33247, shelf: 'Prayer & Devotion', thickness: 2 },
  { id: 'the-master-s-indwelling', title: 'The Master\'s Indwelling', author: 'Andrew Murray', gutenbergId: 12854, shelf: 'Prayer & Devotion', thickness: 3 },
  { id: 'revelations-of-divine-love', title: 'Revelations of Divine Love', author: 'Julian of Norwich', gutenbergId: 52958, shelf: 'Prayer & Devotion', voice: 'scholar', thickness: 3 },
  { id: 'spiritual-torrents', title: 'Spiritual Torrents', author: 'Madame Guyon', gutenbergId: 25133, shelf: 'Prayer & Devotion', thickness: 2 },
  { id: 'letters-of-samuel-rutherford', title: 'Letters of Samuel Rutherford', author: 'Samuel Rutherford', gutenbergId: 42557, shelf: 'Prayer & Devotion', thickness: 5, startsAt: 'I.--For MARION' },
  { id: 'pascal-s-pensees', title: 'Pascal\'s Pensées', author: 'Blaise Pascal', gutenbergId: 18269, shelf: 'Prayer & Devotion', thickness: 4 },
  { id: 'kept-for-the-master-s-use', title: 'Kept for the Master\'s Use', author: 'Frances Ridley Havergal', gutenbergId: 31647, shelf: 'Prayer & Devotion', thickness: 3, startsAt: 'CHAPTER I. Our Lives kept for Jesus' },
  { id: 'coming-to-the-king', title: 'Coming to the King', author: 'Frances Ridley Havergal', gutenbergId: 10630, shelf: 'Prayer & Devotion', voice: 'scholar', thickness: 1, startsAt: 'Coming to the King.' },
  { id: 'thoughts-for-the-quiet-hour', title: 'Thoughts for the Quiet Hour', author: 'D.L. Moody', gutenbergId: 37292, shelf: 'Prayer & Devotion', thickness: 3, startsAt: 'January 1st' },
  { id: 'unspoken-sermons', title: 'Unspoken Sermons', author: 'George MacDonald', gutenbergId: 9057, shelf: 'Sermons & Teaching', thickness: 5 },
  { id: 'the-hope-of-the-gospel', title: 'The Hope of the Gospel', author: 'George MacDonald', gutenbergId: 14453, shelf: 'Sermons & Teaching', thickness: 3 },
  { id: 'around-the-wicket-gate', title: 'Around the Wicket Gate', author: 'C.H. Spurgeon', gutenbergId: 60669, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'secret-power', title: 'Secret Power', author: 'D.L. Moody', gutenbergId: 33341, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'the-way-to-god', title: 'The Way to God', author: 'D.L. Moody', gutenbergId: 30449, shelf: 'Sermons & Teaching', thickness: 3 },
  { id: 'sovereign-grace', title: 'Sovereign Grace', author: 'D.L. Moody', gutenbergId: 30657, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'weighed-and-wanting', title: 'Weighed and Wanting', author: 'D.L. Moody', gutenbergId: 33340, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'prevailing-prayer', title: 'Prevailing Prayer', author: 'D.L. Moody', gutenbergId: 61883, shelf: 'Sermons & Teaching', thickness: 3 },
  { id: 'the-overcoming-life', title: 'The Overcoming Life', author: 'D.L. Moody', gutenbergId: 33015, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'pleasure-and-profit-in-bible-study', title: 'Pleasure and Profit in Bible Study', author: 'D.L. Moody', gutenbergId: 36655, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'selected-sermons-of-jonathan-edwards', title: 'Selected Sermons of Jonathan Edwards', author: 'Jonathan Edwards', gutenbergId: 34632, shelf: 'Sermons & Teaching', thickness: 3, startsAt: 'A DIVINE AND SUPERNATURAL LIGHT' },
  { id: 'orthodoxy', title: 'Orthodoxy', author: 'G.K. Chesterton', gutenbergId: 130, shelf: 'Sermons & Teaching', thickness: 3 },
  { id: 'heretics', title: 'Heretics', author: 'G.K. Chesterton', gutenbergId: 470, shelf: 'Sermons & Teaching', thickness: 3, startsAt: 'I. Introductory Remarks' },
  { id: 'commentary-on-galatians', title: 'Commentary on Galatians', author: 'Martin Luther', gutenbergId: 1549, thickness: 4 },
  { id: 'table-talk', title: 'Table Talk', author: 'Martin Luther', gutenbergId: 9841, shelf: 'Sermons & Teaching', thickness: 2, startsAt: 'OF GOD’S WORD' },
  { id: 'the-small-catechism', title: 'The Small Catechism', author: 'Martin Luther', gutenbergId: 1670, shelf: 'Sermons & Teaching', thickness: 1, startsAt: 'I. The Ten Commandments' },
  { id: 'institutes-of-the-christian-religion-vol', title: 'Institutes of the Christian Religion, Vol. 1', author: 'John Calvin', gutenbergId: 45001, shelf: 'Sermons & Teaching', thickness: 5 },
  { id: 'institutes-of-the-christian-religion-vol-2', title: 'Institutes of the Christian Religion, Vol. 2', author: 'John Calvin', gutenbergId: 64392, shelf: 'Sermons & Teaching', thickness: 5, startsAt: 'BOOK III.' },
  { id: 'the-person-and-work-of-the', title: 'The Person and Work of the Holy Spirit', author: 'R.A. Torrey', gutenbergId: 30241, shelf: 'Sermons & Teaching', thickness: 3 },
  { id: 'how-to-bring-men-to-christ', title: 'How to Bring Men to Christ', author: 'R.A. Torrey', gutenbergId: 51931, shelf: 'Sermons & Teaching', thickness: 2 },
  { id: 'love-to-the-uttermost', title: 'Love to the Uttermost', author: 'F.B. Meyer', gutenbergId: 22376, shelf: 'Sermons & Teaching', thickness: 4 },
  { id: 'the-confessions-of-st-augustine', title: 'The Confessions of St. Augustine', author: 'Augustine of Hippo', gutenbergId: 3296, shelf: 'Church Fathers & History', thickness: 4 },
  { id: 'the-city-of-god-vol-1', title: 'The City of God, Vol. 1', author: 'Augustine of Hippo', gutenbergId: 45304, shelf: 'Church Fathers & History', thickness: 5 },
  { id: 'the-city-of-god-vol-2', title: 'The City of God, Vol. 2', author: 'Augustine of Hippo', gutenbergId: 45305, shelf: 'Church Fathers & History', thickness: 5, startsAt: 'BOOK FOURTEENTH' },
  { id: 'ecclesiastical-history-of-england', title: 'Ecclesiastical History of England', author: 'Bede', gutenbergId: 38326, shelf: 'Church Fathers & History', thickness: 5, startsAt: 'Chap. I. Of the Situation of Britain' },
  { id: 'antiquities-of-the-jews', title: 'Antiquities of the Jews', author: 'Flavius Josephus', gutenbergId: 2848, shelf: 'Church Fathers & History', thickness: 5, startsAt: 'CHAPTER 1. The Constitution Of The World' },
  { id: 'the-wars-of-the-jews', title: 'The Wars of the Jews', author: 'Flavius Josephus', gutenbergId: 2850, shelf: 'Church Fathers & History', thickness: 5 },
  { id: 'foxe-s-book-of-martyrs', title: 'Foxe\'s Book of Martyrs', author: 'John Foxe', gutenbergId: 22400, shelf: 'Church Fathers & History', thickness: 5 },
  { id: 'the-journal-of-george-fox-vol', title: 'The Journal of George Fox, Vol. 1', author: 'George Fox', gutenbergId: 75559, shelf: 'Church Fathers & History', thickness: 5 },
  { id: 'the-journal-of-george-fox-vol-2', title: 'The Journal of George Fox, Vol. 2', author: 'George Fox', gutenbergId: 75590, shelf: 'Church Fathers & History', thickness: 5 },
  { id: 'the-journal-of-john-woolman', title: 'The Journal of John Woolman', author: 'John Woolman', gutenbergId: 37311, shelf: 'Church Fathers & History', thickness: 4 },
  { id: 'the-life-of-david-brainerd', title: 'The Life of David Brainerd', author: 'Jonathan Edwards', gutenbergId: 65066, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'mary-slessor-of-calabar', title: 'Mary Slessor of Calabar', author: 'W.P. Livingstone', gutenbergId: 8906, shelf: 'Lives & Testimonies', thickness: 4 },
  { id: 'st-francis-of-assisi', title: 'St. Francis of Assisi', author: 'G.K. Chesterton', gutenbergId: 63084, shelf: 'Lives & Testimonies', thickness: 3 },
  { id: 'the-life-and-letters-of-elizabeth', title: 'The Life and Letters of Elizabeth Prentiss', author: 'George L. Prentiss', gutenbergId: 11549, shelf: 'Lives & Testimonies', thickness: 5 },
  { id: 'child-s-story-of-the-bible', title: 'Child\'s Story of the Bible', author: 'Mary A. Lathbury', gutenbergId: 25309, shelf: 'For Children', thickness: 3 },
  { id: 'the-peep-of-day', title: 'The Peep of Day', author: 'Favell Lee Mortimer', gutenbergId: 53894, shelf: 'For Children', thickness: 2 },
  { id: 'the-life-of-our-lord-in', title: 'The Life of Our Lord in Simple Language', author: 'Anonymous', gutenbergId: 45716, shelf: 'For Children', thickness: 2 },
  { id: 'jessica-s-first-prayer', title: 'Jessica\'s First Prayer', author: 'Hesba Stretton', gutenbergId: 50104, shelf: 'For Children', thickness: 2 },
  { id: 'stories-of-boys-and-girls-who', title: 'Stories of Boys and Girls Who Loved the Saviour', author: 'John Wesley and others', gutenbergId: 30645, shelf: 'For Children', thickness: 1 },
  { id: 'kjv-genesis', title: 'Genesis', author: 'King James Version', gutenbergId: 8001, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'In the beginning God created the' },
  { id: 'kjv-exodus', title: 'Exodus', author: 'King James Version', gutenbergId: 8002, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'Now these are the names of' },
  { id: 'kjv-leviticus', title: 'Leviticus', author: 'King James Version', gutenbergId: 8003, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'And the LORD called unto Moses,' },
  { id: 'kjv-numbers', title: 'Numbers', author: 'King James Version', gutenbergId: 8004, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'And the LORD spake unto Moses' },
  { id: 'kjv-deuteronomy', title: 'Deuteronomy', author: 'King James Version', gutenbergId: 8005, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'These be the words which Moses' },
  { id: 'kjv-joshua', title: 'Joshua', author: 'King James Version', gutenbergId: 8006, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Now after the death of Moses' },
  { id: 'kjv-judges', title: 'Judges', author: 'King James Version', gutenbergId: 8007, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Now after the death of Joshua' },
  { id: 'kjv-ruth', title: 'Ruth', author: 'King James Version', gutenbergId: 8008, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Now it came to pass in' },
  { id: 'kjv-1-samuel', title: '1 Samuel', author: 'King James Version', gutenbergId: 8009, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Now there was a certain man' },
  { id: 'kjv-2-samuel', title: '2 Samuel', author: 'King James Version', gutenbergId: 8010, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Now it came to pass after' },
  { id: 'kjv-1-kings', title: '1 Kings', author: 'King James Version', gutenbergId: 8011, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Now king David was old and' },
  { id: 'kjv-2-kings', title: '2 Kings', author: 'King James Version', gutenbergId: 8012, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Then Moab rebelled against Israel after' },
  { id: 'kjv-1-chronicles', title: '1 Chronicles', author: 'King James Version', gutenbergId: 8013, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Adam, Sheth, Enosh,' },
  { id: 'kjv-2-chronicles', title: '2 Chronicles', author: 'King James Version', gutenbergId: 8014, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'And Solomon the son of David' },
  { id: 'kjv-ezra', title: 'Ezra', author: 'King James Version', gutenbergId: 8015, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Now in the first year of' },
  { id: 'kjv-nehemiah', title: 'Nehemiah', author: 'King James Version', gutenbergId: 8016, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The words of Nehemiah the son' },
  { id: 'kjv-esther', title: 'Esther', author: 'King James Version', gutenbergId: 8017, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Now it came to pass in' },
  { id: 'kjv-job', title: 'Job', author: 'King James Version', gutenbergId: 8018, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'There was a man in the' },
  { id: 'kjv-psalms', title: 'Psalms', author: 'King James Version', gutenbergId: 8019, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'Blessed is the man that walketh' },
  { id: 'kjv-proverbs', title: 'Proverbs', author: 'King James Version', gutenbergId: 8020, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'The proverbs of Solomon the son' },
  { id: 'kjv-ecclesiastes', title: 'Ecclesiastes', author: 'King James Version', gutenbergId: 8021, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The words of the Preacher, the' },
  { id: 'kjv-song-of-solomon', title: 'Song of Solomon', author: 'King James Version', gutenbergId: 8022, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The song of songs, which is' },
  { id: 'kjv-isaiah', title: 'Isaiah', author: 'King James Version', gutenbergId: 8023, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'The vision of Isaiah the son' },
  { id: 'kjv-jeremiah', title: 'Jeremiah', author: 'King James Version', gutenbergId: 8024, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'The words of Jeremiah the son' },
  { id: 'kjv-lamentations', title: 'Lamentations', author: 'King James Version', gutenbergId: 8025, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'How doth the city sit solitary,' },
  { id: 'kjv-ezekiel', title: 'Ezekiel', author: 'King James Version', gutenbergId: 8026, shelf: BIBLE_SHELF, thickness: 3, startsAt: 'Now it came to pass in' },
  { id: 'kjv-daniel', title: 'Daniel', author: 'King James Version', gutenbergId: 8027, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'In the third year of the' },
  { id: 'kjv-hosea', title: 'Hosea', author: 'King James Version', gutenbergId: 8028, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The word of the LORD that' },
  { id: 'kjv-joel', title: 'Joel', author: 'King James Version', gutenbergId: 8029, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The word of the LORD that' },
  { id: 'kjv-amos', title: 'Amos', author: 'King James Version', gutenbergId: 8030, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The words of Amos, who was' },
  { id: 'kjv-obadiah', title: 'Obadiah', author: 'King James Version', gutenbergId: 8031, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The vision of Obadiah. Thus saith' },
  { id: 'kjv-jonah', title: 'Jonah', author: 'King James Version', gutenbergId: 8032, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Now the word of the LORD' },
  { id: 'kjv-micah', title: 'Micah', author: 'King James Version', gutenbergId: 8033, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The word of the LORD that' },
  { id: 'kjv-nahum', title: 'Nahum', author: 'King James Version', gutenbergId: 8034, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The burden of Nineveh. The book' },
  { id: 'kjv-habakkuk', title: 'Habakkuk', author: 'King James Version', gutenbergId: 8035, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The burden which Habakkuk the prophet' },
  { id: 'kjv-zephaniah', title: 'Zephaniah', author: 'King James Version', gutenbergId: 8036, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The word of the LORD which' },
  { id: 'kjv-haggai', title: 'Haggai', author: 'King James Version', gutenbergId: 8037, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'In the second year of Darius' },
  { id: 'kjv-zechariah', title: 'Zechariah', author: 'King James Version', gutenbergId: 8038, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'In the eighth month, in the' },
  { id: 'kjv-malachi', title: 'Malachi', author: 'King James Version', gutenbergId: 8039, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The burden of the word of' },
  { id: 'kjv-matthew', title: 'Matthew', author: 'King James Version', gutenbergId: 8040, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'The book of the generation of' },
  { id: 'kjv-mark', title: 'Mark', author: 'King James Version', gutenbergId: 8041, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'The beginning of the gospel of' },
  { id: 'kjv-luke', title: 'Luke', author: 'King James Version', gutenbergId: 8042, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'Forasmuch as many have taken in' },
  { id: 'kjv-john', title: 'John', author: 'King James Version', gutenbergId: 8043, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'In the beginning was the Word,' },
  { id: 'kjv-acts', title: 'Acts', author: 'King James Version', gutenbergId: 8044, shelf: BIBLE_SHELF, thickness: 2, startsAt: 'The former treatise have I made,' },
  { id: 'kjv-romans', title: 'Romans', author: 'King James Version', gutenbergId: 8045, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, a servant of Jesus Christ,' },
  { id: 'kjv-1-corinthians', title: '1 Corinthians', author: 'King James Version', gutenbergId: 8046, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul called to be an apostle' },
  { id: 'kjv-2-corinthians', title: '2 Corinthians', author: 'King James Version', gutenbergId: 8047, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, an apostle of Jesus Christ' },
  { id: 'kjv-galatians', title: 'Galatians', author: 'King James Version', gutenbergId: 8048, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, an apostle, (not of men,' },
  { id: 'kjv-ephesians', title: 'Ephesians', author: 'King James Version', gutenbergId: 8049, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, an apostle of Jesus Christ' },
  { id: 'kjv-philippians', title: 'Philippians', author: 'King James Version', gutenbergId: 8050, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul and Timotheus, the servants of' },
  { id: 'kjv-colossians', title: 'Colossians', author: 'King James Version', gutenbergId: 8051, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, an apostle of Jesus Christ' },
  { id: 'kjv-1-thessalonians', title: '1 Thessalonians', author: 'King James Version', gutenbergId: 8052, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, and Silvanus, and Timotheus, unto' },
  { id: 'kjv-2-thessalonians', title: '2 Thessalonians', author: 'King James Version', gutenbergId: 8053, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, and Silvanus, and Timotheus, unto' },
  { id: 'kjv-1-timothy', title: '1 Timothy', author: 'King James Version', gutenbergId: 8054, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, an apostle of Jesus Christ' },
  { id: 'kjv-2-timothy', title: '2 Timothy', author: 'King James Version', gutenbergId: 8055, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, an apostle of Jesus Christ' },
  { id: 'kjv-titus', title: 'Titus', author: 'King James Version', gutenbergId: 8056, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, a servant of God, and' },
  { id: 'kjv-philemon', title: 'Philemon', author: 'King James Version', gutenbergId: 8057, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Paul, a prisoner of Jesus Christ,' },
  { id: 'kjv-hebrews', title: 'Hebrews', author: 'King James Version', gutenbergId: 8058, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'God, who at sundry times and' },
  { id: 'kjv-james', title: 'James', author: 'King James Version', gutenbergId: 8059, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'James, a servant of God and' },
  { id: 'kjv-1-peter', title: '1 Peter', author: 'King James Version', gutenbergId: 8060, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Peter, an apostle of Jesus Christ,' },
  { id: 'kjv-2-peter', title: '2 Peter', author: 'King James Version', gutenbergId: 8061, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Simon Peter, a servant and an' },
  { id: 'kjv-1-john', title: '1 John', author: 'King James Version', gutenbergId: 8062, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'That which was from the beginning,' },
  { id: 'kjv-2-john', title: '2 John', author: 'King James Version', gutenbergId: 8063, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The elder unto the elect lady' },
  { id: 'kjv-3-john', title: '3 John', author: 'King James Version', gutenbergId: 8064, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The elder unto the wellbeloved Gaius,' },
  { id: 'kjv-jude', title: 'Jude', author: 'King James Version', gutenbergId: 8065, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'Jude, the servant of Jesus Christ,' },
  { id: 'kjv-revelation', title: 'Revelation', author: 'King James Version', gutenbergId: 8066, shelf: BIBLE_SHELF, thickness: 1, startsAt: 'The Revelation of Jesus Christ, which' },
  { id: 'devotions-upon-emergent-occasions', title: 'Devotions upon Emergent Occasions', author: 'John Donne', gutenbergId: 23772, shelf: 'Prayer & Devotion', voice: 'scholar', thickness: 3, startsAt: 'VARIABLE, and ther' },
  { id: 'the-story-of-the-hymns-and', title: 'The Story of the Hymns and Tunes', author: 'Theron Brown & Hezekiah Butterworth', gutenbergId: 18444, thickness: 4 },
  { id: 'summa-theologica-part-i', title: 'Summa Theologica, Part I', author: 'Thomas Aquinas', gutenbergId: 17611, thickness: 5, startsAt: 'Because the Master of Catholic Truth' },
  { id: 'history-of-the-reformation-vol-1', title: 'History of the Reformation, Vol. 1', author: 'J.H. Merle d’Aubigné', gutenbergId: 40858, thickness: 4 },
  { id: 'the-chaldean-account-of-genesis', title: 'The Chaldean Account of Genesis', author: 'George Smith', gutenbergId: 60559, thickness: 4 },
  { id: 'observations-upon-the-prophecies-of-daniel', title: 'Observations upon the Prophecies of Daniel', author: 'Sir Isaac Newton', gutenbergId: 16878, thickness: 3, startsAt: 'CHAP. I.' },
  { id: 'travels-to-discover-the-source-of', title: 'Travels to Discover the Source of the Nile, Vol. 1', author: 'James Bruce', gutenbergId: 54180, thickness: 5 },
  { id: 'd-monologia-sacra', title: 'Dæmonologia Sacra', author: 'Richard Gilpin', gutenbergId: 61249, thickness: 5 },
  { id: 'eminent-doctors-vol-1', title: 'Eminent Doctors, Vol. 1', author: 'George Thomas Bettany', gutenbergId: 69406, thickness: 4 },
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
