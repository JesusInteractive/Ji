import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

interface StudyResource {
  title: string;
  author: string;
  era: string;
  description: string;
  url: string;
}

interface StudyCategory {
  heading: string;
  note?: string;
  resources: StudyResource[];
}

// Every entry here either (a) is old enough to be in the public domain,
// so linking to the full text carries no licensing risk, or (b) is a
// free contemporary tool we only link out to, never scrape or
// reproduce. See the file's own citation for why NIV/ESV/NLT/CSB aren't
// here -- those are commercially licensed and would need a paid API
// (api.bible, Crossway's ESV API) with its own signup, key, and usage
// terms before they could be added the same way.
//
// NOTE: this sandbox has no network access to verify these URLs are
// still live/correctly-slugged -- same caveat as bibleApi.ts's Bible
// translation list. Worth a click-through check on a real device before
// shipping.
const CATEGORIES: StudyCategory[] = [
  {
    heading: 'Classic Commentaries',
    note: 'All public domain -- free to read in full, no license required. Hosted by the Christian Classics Ethereal Library (ccel.org), a nonprofit public-domain archive.',
    resources: [
      {
        title: 'Commentary on the Whole Bible',
        author: 'Matthew Henry',
        era: '1706-1721',
        description: 'The most widely used devotional commentary in church history -- warm, practical, verse-by-verse.',
        url: 'https://ccel.org/ccel/henry/mhc1',
      },
      {
        title: "Calvin's Commentaries",
        author: 'John Calvin',
        era: '16th century',
        description: 'Reformation-era exposition covering most of the Bible, translated by the Calvin Translation Society.',
        url: 'https://ccel.org/ccel/calvin',
      },
      {
        title: 'Explanatory Notes Upon the Bible',
        author: 'John Wesley',
        era: '1754-1765',
        description: "Wesley's own notes on the Old and New Testaments, foundational to the Methodist tradition.",
        url: 'https://ccel.org/ccel/wesley',
      },
      {
        title: "Clarke's Commentary",
        author: 'Adam Clarke',
        era: '1810s',
        description: 'Detailed, scholarly notes spanning the whole Bible, strong on historical and textual background.',
        url: 'https://ccel.org/ccel/clarke',
      },
      {
        title: "Barnes' Notes on the Bible",
        author: 'Albert Barnes',
        era: '1830s-1870s',
        description: 'Accessible, widely reprinted 19th-century notes covering nearly every book.',
        url: 'https://ccel.org/ccel/barnes',
      },
      {
        title: "Gill's Exposition of the Entire Bible",
        author: 'John Gill',
        era: '1746-1763',
        description: 'One of the most thorough verse-by-verse commentaries ever written, strong on Hebrew and Greek word study.',
        url: 'https://ccel.org/ccel/gill',
      },
      {
        title: 'Jamieson-Fausset-Brown Commentary',
        author: 'Jamieson, Fausset & Brown',
        era: '1871',
        description: 'A compact, scholarly one-volume commentary covering the whole Bible.',
        url: 'https://ccel.org/ccel/jamieson',
      },
      {
        title: 'Commentary on Galatians',
        author: 'Martin Luther',
        era: '1535',
        description: "Luther's landmark exposition of justification by faith, one of the most influential Reformation-era commentaries.",
        url: 'https://ccel.org/ccel/luther',
      },
      {
        title: 'Commentary on the Old Testament',
        author: 'Carl Friedrich Keil & Franz Delitzsch',
        era: '1861-1875',
        description: 'A rigorous, still-respected Old Testament commentary from two Christian Hebrew scholars -- Delitzsch in particular was known for close, respectful engagement with Jewish scholarship of his day.',
        url: 'https://ccel.org/ccel/keil_delitzsch',
      },
    ],
  },
  {
    heading: 'Sermons & Devotional Writing',
    note: 'Also public domain -- full sermons and devotional works from preachers whose copyrights have long since expired.',
    resources: [
      {
        title: 'Sermons & The Treasury of David',
        author: 'Charles Spurgeon',
        era: '19th century',
        description: "The 'Prince of Preachers' -- thousands of sermons plus his classic verse-by-verse commentary on the Psalms.",
        url: 'https://ccel.org/ccel/spurgeon',
      },
      {
        title: 'Sermons & Discourses',
        author: 'Jonathan Edwards',
        era: '18th century',
        description: "America's foremost colonial-era theologian and preacher.",
        url: 'https://ccel.org/ccel/edwards',
      },
      {
        title: 'Lectures on Revival & Systematic Theology',
        author: 'Charles Finney',
        era: '19th century',
        description: 'Revivalist preaching and practical theology from the Second Great Awakening.',
        url: 'https://ccel.org/ccel/finney',
      },
      {
        title: 'Confessions & The City of God',
        author: 'Saint Augustine',
        era: '4th-5th century',
        description: 'Foundational works of Western Christian theology -- a personal spiritual autobiography and a defense of the faith after the fall of Rome.',
        url: 'https://ccel.org/ccel/augustine',
      },
      {
        title: "The Pilgrim's Progress",
        author: 'John Bunyan',
        era: '1678',
        description: 'One of the most widely published and translated works of Christian allegory ever written.',
        url: 'https://ccel.org/ccel/bunyan',
      },
      {
        title: 'Collected Works',
        author: 'John Owen',
        era: '17th century',
        description: 'The "Prince of the Puritans" -- deep, extensive writing on theology and the Christian life.',
        url: 'https://ccel.org/ccel/owen',
      },
      {
        title: 'Table Talk & Selected Writings',
        author: 'Martin Luther',
        era: '16th century',
        description: 'The father of the Protestant Reformation -- his own writings, including the informal Table Talk recorded by his students, and his German Bible translation that shaped the German language itself.',
        url: 'https://ccel.org/ccel/luther',
      },
      {
        title: "Tyndale's New Testament & Writings",
        author: 'William Tyndale',
        era: '16th century',
        description: 'The first English translator to work directly from Greek and Hebrew rather than Latin -- much of his wording survives almost unchanged in the King James Version. Burned at the stake in 1536 for this work (see also Foxe\'s Book of Martyrs above).',
        url: 'https://ccel.org/ccel/tyndale',
      },
      {
        title: 'Sermons & Teaching Booklets',
        author: 'Dwight L. Moody',
        era: '19th century',
        description: 'Straightforward, practical evangelistic preaching from one of the era\'s most influential evangelists.',
        url: 'https://ccel.org/ccel/moody',
      },
      {
        title: 'With Christ in the School of Prayer',
        author: 'Andrew Murray',
        era: '1885',
        description: 'A classic devotional work on prayer and the deeper Christian life.',
        url: 'https://ccel.org/ccel/murray',
      },
      {
        title: 'Devotions upon Emergent Occasions & Holy Sonnets',
        author: 'John Donne',
        era: '17th century',
        description: 'Poet and Dean of St Paul\'s Cathedral -- his prose meditations written during a serious illness ("no man is an island... never send to know for whom the bell tolls") and his devotional sonnets wrestling honestly with sin, death, and faith.',
        url: 'https://www.ccel.org/d/donne/index.html',
      },
      {
        title: 'The Imitation of Christ',
        author: 'Thomas à Kempis',
        era: '15th century',
        description: 'One of the most widely read Christian devotional books ever written, from a Catholic monk -- read across every tradition since.',
        url: 'https://ccel.org/ccel/kempis',
      },
    ],
  },
  {
    heading: 'Testimonies & Conversion Narratives',
    note: 'Personal accounts of coming to faith -- one of the oldest genres in Christian writing (see also Augustine\'s Confessions above, the original of the form). Modern conversion memoirs are almost all still under copyright, so this stays to the classics.',
    resources: [
      {
        title: 'Grace Abounding to the Chief of Sinners',
        author: 'John Bunyan',
        era: '1666',
        description: "Bunyan's own spiritual autobiography, written in prison -- his raw, personal account of conviction, despair, and coming to faith, distinct from the allegorical Pilgrim's Progress.",
        url: 'https://www.gutenberg.org/ebooks/654',
      },
      {
        title: 'An Authentic Narrative',
        author: 'John Newton',
        era: '1764',
        description: 'The former slave-ship captain who wrote "Amazing Grace" tells his own story of conversion -- a firsthand account behind one of the most famous hymns ever written.',
        url: 'https://www.gutenberg.org/ebooks/search/?query=John+Newton+Authentic+Narrative',
      },
      {
        title: "A Narrative of Some of the Lord's Dealings with George Müller",
        author: 'George Müller',
        era: '19th century',
        description: "Müller's own account of his conversion and his life of prayer -- famous for running orphanages entirely on prayer, never asking anyone for money directly.",
        url: 'https://archive.org/search?query=George+Muller+Narrative+of+the+Lord%27s+Dealings',
      },
    ],
  },
  {
    heading: 'Hymn Writers & Christian Music',
    note: 'The people behind the hymns still sung today -- all public domain. Sheet music/audio itself isn\'t linked here (this library is text-focused), but the writers\' own words and stories are.',
    resources: [
      {
        title: 'Hymns and Spiritual Songs',
        author: 'Isaac Watts',
        era: '1707',
        description: 'The "Father of English Hymnody" -- wrote "When I Survey the Wondrous Cross" and "Joy to the World" -- his original hymn collection.',
        url: 'https://www.gutenberg.org/ebooks/13341',
      },
      {
        title: 'The Story of the Hymns and Tunes',
        author: 'Theron Brown & Hezekiah Butterworth',
        era: '1906',
        description: 'The stories behind hundreds of well-known hymns and the people who wrote them -- Isaac Watts, Charles Wesley, Fanny Crosby, and many more, in one collection.',
        url: 'https://www.gutenberg.org/files/18444/18444-h/18444-h.htm',
      },
    ],
  },
  {
    heading: 'Hidden Gems & Rare Finds',
    note: "Quieter, less-cited public-domain works -- not the household names above, but the ones people who find them tend to never forget.",
    resources: [
      {
        title: 'The Practice of the Presence of God',
        author: 'Brother Lawrence',
        era: '17th century',
        description: 'A humble 17th-century monastery cook\'s short, plainspoken reflections on staying aware of God through the most ordinary work -- tiny, and quietly devastating.',
        url: 'https://ccel.org/ccel/lawrence',
      },
      {
        title: 'Unspoken Sermons',
        author: 'George MacDonald',
        era: '19th century',
        description: 'C.S. Lewis called MacDonald his single greatest influence and said he never wrote a book without quoting him -- yet MacDonald himself is rarely read today.',
        url: 'https://ccel.org/ccel/macdonald',
      },
      {
        title: 'Revelations of Divine Love',
        author: 'Julian of Norwich',
        era: '14th century',
        description: 'The earliest surviving book in English known to be written by a woman -- a mystic\'s visions written while gravely ill, wrestling honestly with suffering and arriving at "all shall be well."',
        url: 'https://ccel.org/ccel/julian',
      },
      {
        title: 'Centuries of Meditations',
        author: 'Thomas Traherne',
        era: 'written 17th century, first published 1908',
        description: 'Ecstatic, wonder-filled meditations on seeing the world as a child does, freshly and gratefully -- the manuscript sat unknown for over 200 years before its accidental rediscovery.',
        url: 'https://ccel.org/ccel/traherne',
      },
      {
        title: 'A Serious Call to a Devout and Holy Life',
        author: 'William Law',
        era: '1728',
        description: 'A quietly demanding call to sincere, wholehearted Christian living that shaped both John Wesley and C.S. Lewis -- far less read today than either of them.',
        url: 'https://ccel.org/ccel/law',
      },
    ],
  },
  {
    heading: 'Catholic Tradition',
    note: 'Public domain works from Catholic saints and theologians -- Augustine (above, in Sermons & Devotional Writing) belongs here too, claimed by both Catholic and Protestant tradition as a Doctor of the Church.',
    resources: [
      {
        title: 'Summa Theologica',
        author: 'Thomas Aquinas',
        era: '13th century',
        description: "The foundational work of Catholic systematic theology, still central to Catholic thought today.",
        url: 'https://ccel.org/ccel/aquinas',
      },
      {
        title: 'Proslogion & Cur Deus Homo',
        author: 'Anselm of Canterbury',
        era: '11th-12th century',
        description: "Archbishop of Canterbury and one of the founders of scholastic theology -- Proslogion contains his famous ontological argument for God's existence, and Cur Deus Homo (\"Why God Became Man\") is a foundational work on why the atonement was necessary.",
        url: 'https://ccel.org/ccel/anselm',
      },
      {
        title: 'The Interior Castle',
        author: 'Saint Teresa of Ávila',
        era: '1577',
        description: 'A major classic of Catholic mystical spirituality, mapping the soul\'s journey toward union with God.',
        url: 'https://ccel.org/ccel/teresa',
      },
      {
        title: 'The Rule of St. Benedict',
        author: 'Benedict of Nursia',
        era: '6th century',
        description: 'The founding document of Western monasticism -- a short, practical guide to communal life, prayer, and work that shaped monastic life across Europe for over a thousand years.',
        url: 'https://ccel.org/ccel/benedict',
      },
      {
        title: 'Orthodoxy',
        author: 'G.K. Chesterton',
        era: '1908',
        description: 'A witty, influential defense of Christian faith from one of the 20th century\'s best-known Catholic converts and apologists.',
        url: 'https://ccel.org/ccel/chesterton',
      },
    ],
  },
  {
    heading: 'Lives of the Saints',
    note: 'Classic public-domain hagiography, spanning early church martyrs through the medieval period.',
    resources: [
      {
        title: "Confession",
        author: 'Saint Patrick',
        era: '5th century',
        description: "Patrick's own short autobiographical account of his life and mission -- one of the earliest surviving pieces of Christian writing from the British Isles.",
        url: 'https://ccel.org/ccel/patrick',
      },
      {
        title: 'The Golden Legend',
        author: 'Jacobus de Voragine',
        era: '13th century',
        description: "The single most influential medieval collection of saints' lives, hugely popular for centuries.",
        url: 'https://ccel.org/ccel/voragine',
      },
      {
        title: 'The Little Flowers of St. Francis',
        author: 'attrib. to followers of Francis of Assisi',
        era: '14th century',
        description: 'Beloved, legend-rich stories of the life of Francis of Assisi and his early companions.',
        url: 'https://ccel.org/ccel/francis',
      },
      {
        title: "Butler's Lives of the Saints",
        author: 'Alban Butler',
        era: '1756-1759',
        description: 'The definitive classic reference work covering the lives of saints across the calendar year.',
        url: 'https://ccel.org/ccel/butler',
      },
    ],
  },
  {
    heading: 'Church History',
    note: 'Foundational historical sources, all public domain.',
    resources: [
      {
        title: 'Ecclesiastical History',
        author: 'Eusebius of Caesarea',
        era: '4th century',
        description: 'The primary surviving history of the early Christian church, from the apostles through the 4th century -- an essential source, not a later reconstruction.',
        url: 'https://ccel.org/ccel/eusebius',
      },
      {
        title: 'On the Incarnation',
        author: 'Athanasius of Alexandria',
        era: '4th century',
        description: 'The great defender of Trinitarian orthodoxy against Arianism at the Council of Nicaea -- this short, still widely-read work explains why the Incarnation itself, not just Christ\'s teaching, is central to salvation.',
        url: 'https://ccel.org/ccel/athanasius',
      },
      {
        title: "Foxe's Book of Martyrs",
        author: 'John Foxe',
        era: '1563',
        description: 'A classic, influential account of Christian martyrdom through history.',
        url: 'https://ccel.org/ccel/foxe',
      },
      {
        title: 'History of the Reformation of the Sixteenth Century',
        author: 'Jean-Henri Merle d\'Aubigné',
        era: '1835-1853',
        description: "A sweeping, monumental history of the Reformation -- Luther and Germany, Zwingli and the Swiss Reformation, and (in his companion volumes on the era of Calvin) the Reformation's spread into England and Scotland.",
        url: 'https://www.gutenberg.org/ebooks/40858',
      },
    ],
  },
  {
    heading: 'The Apostolic Fathers',
    note: 'Writings from the generation right after the apostles -- 1st and 2nd century, some of the earliest Christian documents outside the New Testament itself. All ancient and long public domain.',
    resources: [
      {
        title: 'The Apostolic Fathers',
        author: 'trans. J.B. Lightfoot & others',
        era: '1st-2nd century (public domain translation)',
        description: "1 Clement, the Didache, the letters of Ignatius of Antioch, Polycarp's letter to the Philippians, the Shepherd of Hermas, the Epistle of Barnabas, and the Epistle to Diognetus -- writings by, or attributed to, direct disciples of the apostles.",
        url: 'https://ccel.org/ccel/lightfoot',
      },
    ],
  },
  {
    heading: "Children's Bible Story Books",
    note: 'Classic public-domain Bible storybooks for younger readers -- not modern children\'s Bibles, which are almost all still under copyright.',
    resources: [
      {
        title: "Hurlbut's Story of the Bible",
        author: 'Jesse Lyman Hurlbut',
        era: '1904',
        description: '168 Bible stories told in plain, accessible language from Genesis to Revelation, with the original illustrations -- still in print and referenced today for a reason.',
        url: 'https://archive.org/details/hurlbutsstoryofb00hurl',
      },
      {
        title: 'Peep of Day',
        author: 'Favell Lee Mortimer',
        era: '1833',
        description: "One of the earliest and most widely-read Victorian children's Bible storybooks, written for very young children in simple language.",
        url: 'https://archive.org/search?query=Peep+of+Day+Favell+Lee+Mortimer',
      },
    ],
  },
  {
    heading: 'Reference Tools',
    note: 'Classic public-domain reference works -- word study, definitions, and background, all pre-1900.',
    resources: [
      {
        title: "Strong's Exhaustive Concordance",
        author: 'James Strong',
        era: '1890',
        description: 'The standard reference for locating and studying the original Hebrew and Greek behind every English word in the Bible.',
        url: 'https://ccel.org/ccel/strong',
      },
      {
        title: "Smith's Bible Dictionary",
        author: 'William Smith',
        era: '1863',
        description: 'A classic one-volume reference covering people, places, and terms throughout Scripture. Closest public-domain equivalent to a modern work like the Oxford Companion to the Bible, which is still under active copyright and can\'t be linked the same way.',
        url: 'https://ccel.org/ccel/smith',
      },
      {
        title: 'The Interlinear Greek-English New Testament',
        author: 'George Ricker Berry',
        era: '1897',
        description: 'A public-domain Greek New Testament with a word-for-word English gloss beneath the Greek text.',
        url: 'https://ccel.org/ccel/berry',
      },
      {
        title: "Easton's Bible Dictionary",
        author: 'Matthew George Easton',
        era: '1897',
        description: "A second classic public-domain Bible dictionary alongside Smith's -- useful for cross-checking entries like the Ark of the Covenant, the Tabernacle, and the priesthood against a second 19th-century scholarly source.",
        url: 'https://ccel.org/ccel/easton',
      },
    ],
  },
  {
    heading: 'Biblical Archaeology',
    note: 'Modern archaeology of the biblical world is almost entirely still under copyright, so this is a short list -- one 19th-century classic that is genuinely public domain.',
    resources: [
      {
        title: 'Nineveh and Its Remains',
        author: 'Austen Henry Layard',
        era: '1849',
        description: "The account of Layard's excavation of ancient Nineveh -- the Assyrian capital named throughout Kings, Isaiah, and Jonah -- among the founding works of biblical archaeology.",
        url: 'https://ccel.org/ccel/layard',
      },
      {
        title: 'The Chaldean Account of Genesis',
        author: 'George Smith',
        era: '1876',
        description: "Smith's translation of the Babylonian flood tablets he discovered at the British Museum -- the ancient Mesopotamian flood narrative that parallels the Genesis account of Noah -- alongside other Babylonian creation and history texts compared to Genesis. One of the most significant biblical-archaeology discoveries of the 19th century.",
        url: 'https://sacred-texts.com/ane/caog/index.htm',
      },
      {
        title: 'Excavations at Jerusalem, 1867-70',
        author: 'Charles Warren',
        era: '1876',
        description: "Warren's own account of his pioneering underground exploration of the Temple Mount and ancient Jerusalem -- still a foundational source for the archaeology of the site.",
        url: 'https://archive.org/details/1867-70-jerusalem',
      },
      {
        title: 'The Temple of Solomon (from Chronology of Ancient Kingdoms Amended)',
        author: 'Sir Isaac Newton',
        era: '1728',
        description: "Newton's own architectural reconstruction of Solomon's First Temple, based on the biblical measurements -- the historical temple itself, not a modern design. Pairs with Newton's Daniel & Revelation study above and Edersheim's book on the (later) Second Temple.",
        url: 'https://archive.org/search?query=Isaac+Newton+Chronology+of+Ancient+Kingdoms+Amended',
      },
    ],
  },
  {
    heading: 'Cross-Reference Tools',
    note: 'Free tools that surface public-domain commentaries and original-language text -- not authored works under copyright themselves.',
    resources: [
      {
        title: 'Blue Letter Bible',
        author: 'Blue Letter Bible',
        era: 'free online tool',
        description: 'Free interlinear, concordance, and commentary search -- a fast way to cross-reference several classic commentaries and the original languages at once.',
        url: 'https://www.blueletterbible.org',
      },
      {
        title: 'Bible Hub Interlinear Bible',
        author: 'Bible Hub',
        era: 'free online tool',
        description: "A free, side-by-side Hebrew/Greek-to-English interlinear covering the whole Bible, with Strong's numbers linked to definitions.",
        url: 'https://biblehub.com/interlinear/',
      },
      {
        title: 'Bible Hub Commentaries',
        author: 'Bible Hub',
        era: 'free online tool',
        description: 'Aggregates dozens of public-domain commentaries side-by-side, per verse.',
        url: 'https://biblehub.com/commentaries/',
      },
    ],
  },
  {
    heading: 'Apocrypha & Ancient Jewish Texts',
    note: "Ancient Jewish writings outside the Protestant canon (some, like Maccabees, are part of the Catholic and Orthodox canons). Linked out rather than reproduced here -- reproducing an ancient text from memory risks getting it subtly wrong, which isn't acceptable to present as scripture. Only entries with a confirmed public-domain translation (or, for the Dead Sea Scrolls, an official free viewer rather than a copyrighted modern translation) are included.",
    resources: [
      {
        title: 'The Book of Enoch',
        author: 'trans. R.H. Charles, 1917',
        era: 'public domain translation',
        description: 'A well-known scholarly English translation of 1 Enoch, the Ethiopic apocalyptic text quoted in the New Testament book of Jude.',
        url: 'https://sacred-texts.com/bib/boe/index.htm',
      },
      {
        title: 'The Book of Jubilees',
        author: 'trans. R.H. Charles, 1902',
        era: 'public domain translation',
        description: 'A retelling of Genesis and part of Exodus, dividing history into periods of 49 years -- part of the Ethiopian Orthodox canon.',
        url: 'https://sacred-texts.com/bib/jub/index.htm',
      },
      {
        title: 'The Works of Flavius Josephus',
        author: 'trans. William Whiston, 1737',
        era: 'public domain translation',
        description: "Antiquities of the Jews and The Jewish War -- the essential 1st-century Jewish historian, an eyewitness-era source for the world of the New Testament.",
        url: 'https://ccel.org/ccel/josephus',
      },
      {
        title: 'The Works of Philo',
        author: 'trans. C.D. Yonge, 19th century',
        era: 'public domain translation',
        description: 'A 1st-century Hellenistic Jewish philosopher from Alexandria, contemporary with Jesus, blending Jewish theology with Greek philosophy.',
        url: 'https://ccel.org/ccel/philo',
      },
      {
        title: '1 & 2 Maccabees',
        author: 'trans. R.H. Charles, 1913 (Old Testament Apocrypha)',
        era: 'public domain translation',
        description: "The actual story of \"the Greeks and the Jews\": the Maccabean revolt against the Hellenistic Seleucid empire's attempt to suppress Jewish worship, and the rededication of the Temple that Hanukkah commemorates.",
        url: 'https://sacred-texts.com/bib/apo/index.htm',
      },
      {
        title: 'The Epistle of Aristeas',
        author: 'trans. H.T. Andrews, early 20th century',
        era: 'public domain translation',
        description: 'The legendary account of the Septuagint\'s origin -- 72 Jewish scholars in Ptolemaic Alexandria translating the Hebrew Scriptures into Greek -- the founding document of Hellenistic Judaism.',
        url: 'https://sacred-texts.com/bib/aristeas.htm',
      },
      {
        title: 'The Septuagint (LXX) with Apocrypha',
        author: 'trans. Sir Lancelot C.L. Brenton, 1851',
        era: 'public domain translation',
        description: 'The Greek Old Testament used by Hellenistic Jews (including Philo) and quoted throughout the New Testament -- the actual text where Jewish scripture and Greek language met.',
        url: 'https://ccel.org/ccel/brenton',
      },
      {
        title: 'Leon Levy Dead Sea Scrolls Digital Library',
        author: 'Israel Antiquities Authority & Google',
        era: 'official free viewer',
        description: "High-resolution images and transcriptions of the actual scrolls, direct from the Israel Antiquities Authority. Linked as the official source rather than any particular modern English translation, since most published translations of the scrolls are still under copyright.",
        url: 'https://www.deadseascrolls.org.il',
      },
      {
        title: 'The Temple: Its Ministry and Services',
        author: 'Alfred Edersheim',
        era: '1874',
        description: 'A detailed, classic reconstruction of the Jerusalem Temple, its priesthood, rituals, and daily/festival services as they stood in the time of Christ.',
        url: 'https://ccel.org/ccel/edersheim/temple',
      },
      {
        title: 'The Life and Times of Jesus the Messiah',
        author: 'Alfred Edersheim',
        era: '1883',
        description: 'A monumental, richly detailed study of the Gospels set against 1st-century Jewish life, culture, and thought -- by a scholar who was himself a convert from Judaism.',
        url: 'https://ccel.org/ccel/edersheim/lifetimes',
      },
    ],
  },
  {
    heading: 'Prophecy, Daniel & Revelation',
    note: "All public domain. Worth knowing going in: Christians have never agreed on how to read end-times prophecy -- these four represent different, sometimes conflicting schools of interpretation (historicist, futurist, dispensationalist), not one settled view. Presented as historical sources to study from, not as the app's own position.",
    resources: [
      {
        title: "Ezekiel's Temple Vision (Ezekiel 40-48)",
        author: 'Tanach / Old Testament',
        era: 'ancient text',
        description: "The ancient prophetic vision of a future temple that all later \"third temple\" imagery ultimately comes from -- the scripture itself, not any modern reconstruction movement or design.",
        url: 'https://www.sefaria.org/Ezekiel.40',
      },
      {
        title: 'Observations Upon the Prophecies of Daniel, and the Apocalypse of St. John',
        author: 'Sir Isaac Newton',
        era: '1733',
        description: "Newton's own extensive study of both Daniel and Revelation together -- a historical curiosity as much as a work of theology, from one of history's greatest scientific minds.",
        url: 'https://www.gutenberg.org/ebooks/search/?query=Isaac+Newton+prophecies+Daniel',
      },
      {
        title: 'The Apocalypse: Lectures on the Book of Revelation',
        author: 'Joseph Seiss',
        era: '1865',
        description: 'A detailed, widely-read 19th-century verse-by-verse study of Revelation.',
        url: 'https://ccel.org/ccel/seiss',
      },
      {
        title: 'Studies on the Book of Daniel',
        author: 'John Nelson Darby',
        era: '19th century',
        description: 'From the founder of dispensationalism, whose framework shaped much of modern futurist end-times teaching.',
        url: 'https://ccel.org/ccel/darby',
      },
      {
        title: 'Jesus Is Coming',
        author: 'William E. Blackstone',
        era: '1878',
        description: 'An influential early popular work on the premillennial return of Christ.',
        url: 'https://archive.org/search?query=Jesus+is+Coming+Blackstone',
      },
    ],
  },
  {
    heading: 'Science & the Bible',
    note: "The science-and-faith conversation is old, not new -- these are historical primary sources in that conversation, presented to study from, not as the app's own position on origins (see also Isaac Newton's own writings on Daniel and Revelation above -- a reminder that history's scientists were often deeply engaged with Scripture, not opposed to it).",
    resources: [
      {
        title: 'Natural Theology',
        author: 'William Paley',
        era: '1802',
        description: "The classic \"argument from design\" -- that the intricate order of the natural world points to a designer -- hugely influential on how science and faith were discussed for the next century, including on a young Charles Darwin.",
        url: 'https://ccel.org/ccel/paley/theology',
      },
      {
        title: 'Omphalos: An Attempt to Untie the Geological Knot',
        author: 'Philip Henry Gosse',
        era: '1857',
        description: 'A well-known Victorian naturalist\'s attempt to reconcile the geological evidence for an old earth with a young-earth reading of Genesis -- a genuine, good-faith 19th-century wrestling with the same question still debated today.',
        url: 'https://archive.org/details/omphalosattemptt00goss',
      },
    ],
  },
  {
    heading: 'Historical & Biblical Maps',
    note: 'Wikimedia Commons only accepts public-domain or openly-licensed media, so it doubles as a safe, pre-vetted source for historical maps of the ancient Near East, Israel, and the New Testament world.',
    resources: [
      {
        title: 'Historical maps of the Holy Land & ancient Israel',
        author: 'Wikimedia Commons',
        era: 'public domain / openly licensed',
        description: 'Searchable collection of public-domain historical maps -- the ancient Near East, the twelve tribes, the divided kingdom, Second Temple Jerusalem, and more.',
        url: 'https://commons.wikimedia.org/w/index.php?search=historical+map+ancient+Israel+Holy+Land&title=Special:MediaSearch&type=image',
      },
      {
        title: 'Genealogy charts: Adam to the Twelve Tribes to Jesus',
        author: 'Wikimedia Commons',
        era: 'public domain / openly licensed',
        description: "Public-domain genealogical charts tracing biblical lineage -- from Adam and Eve, through Noah's descendants, to Jacob's twelve sons (the twelve tribes of Israel), through to the genealogies of Jesus in Matthew and Luke.",
        url: 'https://commons.wikimedia.org/w/index.php?search=genealogy+chart+Bible+Adam+twelve+tribes+Jesus&title=Special:MediaSearch&type=image',
      },
    ],
  },
  {
    heading: 'Jewish Study Tools',
    note: "Tanach text traditionally studied during shiva (the seven days of mourning). Kept to public-domain text only -- Sefaria hosts the Talmud, Shulchan Aruch, and Mussar works too, but those are typically modern copyrighted translations (e.g. the Talmud's Davidson edition is CC-BY-NC, not public domain), so they're left out here rather than guessed at.",
    resources: [
      {
        title: 'Job (Iyov)',
        author: 'Tanach',
        era: 'public domain (ancient text; e.g. the 1917 JPS translation)',
        description: 'Wrestles with the mystery of undeserved suffering -- central to Jewish reflection on grief.',
        url: 'https://www.sefaria.org/Job',
      },
      {
        title: 'Lamentations (Eichah)',
        author: 'Tanach',
        era: 'public domain (ancient text; e.g. the 1917 JPS translation)',
        description: "The biblical book of sorrow and destruction, traditionally read on Tisha B'Av.",
        url: 'https://www.sefaria.org/Lamentations',
      },
      {
        title: 'Psalms (Tehillim)',
        author: 'Tanach',
        era: 'public domain (ancient text; e.g. the 1917 JPS translation)',
        description: 'Recited for comfort, reflection, and connection to God during grief and mourning.',
        url: 'https://www.sefaria.org/Psalms',
      },
    ],
  },
  {
    heading: 'Jewish History & the Diaspora',
    note: "General Jewish history and culture, not tied to a specific text or era -- from antiquity through the 19th century. Modern Jewish history (20th century onward, including the Holocaust) is almost entirely still under copyright -- recent, deeply personal scholarship and testimony that rightly belongs to its authors and survivors' families, not something to list here as if it were free to use.",
    resources: [
      {
        title: 'History of the Jews (6 volumes)',
        author: 'Heinrich Graetz',
        era: '1891-1898 English translation',
        description: 'The landmark 19th-century history of the Jewish people from antiquity to the modern era, including the scattering and survival of Jewish communities across the diaspora.',
        url: 'https://www.gutenberg.org/ebooks/author/42001',
      },
      {
        title: 'The Queen of Sheba and Her Only Son Menyelek (Kebra Nagast)',
        author: 'trans. Sir E.A. Wallis Budge, 1922',
        era: 'public domain translation',
        description: "Ethiopia's national epic: the Queen of Sheba's visit to Solomon, their son Menelik I, and the legend of how the Ark of the Covenant came to Ethiopia -- the founding text behind Ethiopian Jewish and Christian claims of descent from the House of Israel.",
        url: 'https://sacred-texts.com/afr/kn/index.htm',
      },
      {
        title: 'Travels to Discover the Source of the Nile',
        author: 'James Bruce',
        era: '1790',
        description: "The Scottish explorer's account of his travels through Ethiopia, including the first significant Western documentation of the Falasha (Beta Israel) -- the Ethiopian Jewish community -- that drew 19th-century Jewish scholars to study and visit them.",
        url: 'https://archive.org/search?query=James+Bruce+Travels+to+Discover+the+Source+of+the+Nile',
      },
    ],
  },
  {
    heading: 'Judeo-Christian Reference',
    note: 'A bridge between the Jewish and Christian sections above -- the shared roots this whole app draws from.',
    resources: [
      {
        title: 'The Jewish Encyclopedia',
        author: 'Funk & Wagnalls',
        era: '1901-1906',
        description: 'A comprehensive, still widely cited reference on Jewish history, religion, and culture -- old enough to be fully public domain.',
        url: 'https://www.jewishencyclopedia.com',
      },
    ],
  },
];

export default function StudyToolsScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Free commentaries, sermons, and study tools -- every entry below is either public domain or a free tool
        we link out to, so nothing here runs into licensing trouble.
      </Text>

      {CATEGORIES.map((category) => (
        <View key={category.heading} style={styles.category}>
          <Text style={styles.categoryHeading}>{category.heading}</Text>
          {category.note && <Text style={styles.categoryNote}>{category.note}</Text>}

          {category.resources.map((resource) => (
            <TouchableOpacity
              key={resource.title}
              style={styles.card}
              onPress={() => openLink(resource.url)}
              accessibilityRole="link"
              accessibilityLabel={`${resource.title} by ${resource.author}`}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="book-outline" size={20} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{resource.title}</Text>
                <Text style={styles.cardMeta}>{resource.author} · {resource.era}</Text>
                <Text style={styles.cardDescription}>{resource.description}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#A0AEC0" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 16, paddingBottom: 32 },
  intro: { fontSize: 13.5, lineHeight: 20, color: '#718096', marginBottom: 20 },
  category: { marginBottom: 24 },
  categoryHeading: { fontSize: 17, fontWeight: '800', color: Colors.royal, marginBottom: 4 },
  categoryNote: { fontSize: 12, lineHeight: 17, color: '#A0AEC0', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.ink },
  cardMeta: { fontSize: 11.5, color: '#718096', marginTop: 2 },
  cardDescription: { fontSize: 12.5, lineHeight: 17, color: '#4A5568', marginTop: 4 },
});
