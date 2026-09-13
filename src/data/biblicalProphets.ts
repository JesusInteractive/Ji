// All 16 writing prophets (4 major, 12 minor) for the Global Map's
// "Prophets" era layer -- richer than the plain BibleCharacter shape
// (see bibleGamesContent.ts) since a prophet dossier needs a ministry
// timeline, the kings they served under, and their key prophecies with
// a fulfillment/scholarly-debate note, none of which BibleCharacter
// carries. `characterId` links to an existing src/data/bibleCharacters.ts
// entry where one exists (only Daniel and Isaiah currently do -- most of
// the Twelve aren't in that 40-entry starter roster yet).
//
// Hand-curated, like bibleCharacters.ts/bibleTimeline.ts -- these dates
// and king-lists follow the traditional/majority scholarly dating; where
// real academic debate exists (e.g. Daniel's date of composition, Joel's
// dating), the historicalContext note says so rather than picking a side.
import type { VerseRef } from '../services/bibleGamesContent';

export interface KeyProphecy {
  text: string;
  reference: VerseRef;
  fulfillmentNote: string;
}

export interface BiblicalProphet {
  id: string;
  name: string;
  characterId?: string;
  major: boolean;
  ministryTimeline: string;
  kingsServedUnder: string[];
  historicalContext: string;
  keyProphecies: KeyProphecy[];
}

export const BIBLICAL_PROPHETS: BiblicalProphet[] = [
  // --- The four major prophets ---
  {
    id: 'isaiah',
    name: 'Isaiah',
    characterId: 'isaiah',
    major: true,
    ministryTimeline: 'c. 740-681 BC, spanning roughly 60 years in Judah.',
    kingsServedUnder: ['Uzziah', 'Jotham', 'Ahaz', 'Hezekiah'],
    historicalContext:
      'Ministered as the Northern Kingdom (Israel) fell to Assyria in 722 BC and Judah itself came under Assyrian threat, including the siege of Jerusalem under Hezekiah in 701 BC. Chapters 40-66 shift to comfort for a future Babylonian exile, which is why some critical scholars propose multiple authors/eras behind the book -- traditional and most evangelical scholarship holds to single authorship by the 8th-century Isaiah.',
    keyProphecies: [
      {
        text: 'The virgin shall conceive and bear a son, and shall call his name Immanuel.',
        reference: { bookId: 'ISA', chapter: 7, verse: 14 },
        fulfillmentNote: 'Applied to Jesus\' virgin birth in Matthew 1:22-23; debated among scholars over whether the original 8th-century audience understood a nearer, non-messianic sign as well.',
      },
      {
        text: 'He was wounded for our transgressions, he was bruised for our iniquities.',
        reference: { bookId: 'ISA', chapter: 53, verse: 5 },
        fulfillmentNote: 'The clearest Old Testament portrait of a suffering, substitutionary Messiah; Christian tradition reads it as directly fulfilled in Jesus\' crucifixion, while some Jewish interpretation reads the "servant" as the nation of Israel.',
      },
    ],
  },
  {
    id: 'jeremiah',
    name: 'Jeremiah',
    characterId: 'jeremiah',
    major: true,
    ministryTimeline: 'c. 627-570 BC, through Jerusalem\'s final decades and into the exile.',
    kingsServedUnder: ['Josiah', 'Jehoahaz', 'Jehoiakim', 'Jehoiachin', 'Zedekiah'],
    historicalContext:
      'The "weeping prophet," ministering through Judah\'s last kings and the Babylonian sieges (597 and 586 BC), personally witnessing Jerusalem\'s destruction. Persecuted and imprisoned for predicting the fall of the city, he was ultimately taken to Egypt after the assassination of the governor Gedaliah.',
    keyProphecies: [
      {
        text: 'I will make a new covenant with the house of Israel... I will write my law in their hearts.',
        reference: { bookId: 'JER', chapter: 31, verse: 33 },
        fulfillmentNote: 'Quoted directly in Hebrews 8:8-12 as fulfilled in the New Covenant inaugurated by Christ.',
      },
      {
        text: 'After seventy years are completed... I will bring you back to this place.',
        reference: { bookId: 'JER', chapter: 29, verse: 10 },
        fulfillmentNote: 'The seventy-year exile is the timeframe Daniel later calculates from (Daniel 9:2) and that closes with Cyrus\'s decree in 538 BC.',
      },
    ],
  },
  {
    id: 'ezekiel',
    name: 'Ezekiel',
    major: true,
    ministryTimeline: 'c. 593-571 BC, entirely from exile in Babylon.',
    kingsServedUnder: ['Jehoiachin (deposed into exile with him)', 'Zedekiah (from a distance, in Jerusalem)'],
    historicalContext:
      'A priest deported to Babylon in 597 BC, settled among the exiles by the Kebar River, where he receives his prophetic call in a vision of God\'s throne-chariot (chapter 1). His ministry runs before and after Jerusalem\'s final fall in 586 BC, combining warnings of judgment with, in later chapters, a detailed vision of a restored Temple.',
    keyProphecies: [
      {
        text: 'I will give you a new heart, and put a new spirit within you.',
        reference: { bookId: 'EZK', chapter: 36, verse: 26 },
        fulfillmentNote: 'Read by Christian tradition as pointing to the inward, Spirit-given renewal of the New Covenant.',
      },
      {
        text: 'The valley of dry bones, made to live again by the breath of God.',
        reference: { bookId: 'EZK', chapter: 37, verse: 10 },
        fulfillmentNote: 'Traditionally read as Israel\'s national restoration; the exact scope and timing of the Temple vision in chapters 40-48 (literal future Temple vs. symbolic) remains a genuinely debated question among scholars.',
      },
    ],
  },
  {
    id: 'daniel',
    name: 'Daniel',
    characterId: 'daniel',
    major: true,
    ministryTimeline: 'c. 605-536 BC, spanning nearly the entire Babylonian and early Persian periods.',
    kingsServedUnder: ['Nebuchadnezzar (Babylon)', 'Belshazzar (Babylon)', 'Darius the Mede', 'Cyrus (Persia)'],
    historicalContext:
      'Deported to Babylon as a young noble in 605 BC, Daniel rose to high office under a succession of Babylonian and Persian rulers, surviving the fiery furnace (with his companions) and the lions\' den. The book\'s date of composition is a genuine scholarly debate: traditional scholarship dates it to Daniel\'s own 6th-century lifetime, while some critical scholarship argues for a 2nd-century BC date based on the specificity of its later prophecies.',
    keyProphecies: [
      {
        text: 'One like a son of man, coming with the clouds of heaven, given dominion and a kingdom that will never be destroyed.',
        reference: { bookId: 'DAN', chapter: 7, verse: 13 },
        fulfillmentNote: 'Jesus applies "Son of Man" to himself throughout the Gospels, most directly at his trial (Mark 14:62), pointing back to this text.',
      },
      {
        text: 'The seventy weeks (sevens) determined for Jerusalem, until the Anointed One.',
        reference: { bookId: 'DAN', chapter: 9, verse: 24 },
        fulfillmentNote: 'One of the most debated prophecies in Scripture -- interpreters differ widely on how the "seventy sevens" map onto historical dates and events.',
      },
    ],
  },
  // --- The twelve minor prophets ---
  {
    id: 'hosea',
    name: 'Hosea',
    major: false,
    ministryTimeline: 'c. 750-715 BC, in the Northern Kingdom\'s final decades.',
    kingsServedUnder: ['Jeroboam II', 'and several short-lived successors in Israel'],
    historicalContext:
      'Ministered in Israel (the Northern Kingdom) during its political collapse before the Assyrian conquest of 722 BC. His own troubled marriage to the unfaithful Gomer becomes a living illustration of Israel\'s unfaithfulness to God.',
    keyProphecies: [
      {
        text: 'Out of Egypt I called my son.',
        reference: { bookId: 'HOS', chapter: 11, verse: 1 },
        fulfillmentNote: 'Quoted in Matthew 2:15 of the holy family\'s flight to and return from Egypt -- a well-known example of a "pattern" (typological) fulfillment rather than a direct predictive one.',
      },
    ],
  },
  {
    id: 'joel',
    name: 'Joel',
    major: false,
    ministryTimeline: 'Date debated -- proposals range from the 9th to the 5th century BC; the book itself gives no king\'s name to anchor it.',
    kingsServedUnder: ['Unknown -- the book names no king, unusual among the prophets'],
    historicalContext:
      'Written in response to a devastating locust plague and drought in Judah, read as both a literal disaster and a picture of coming judgment ("the Day of the Lord").',
    keyProphecies: [
      {
        text: 'I will pour out my Spirit on all flesh... your sons and daughters shall prophesy.',
        reference: { bookId: 'JOL', chapter: 2, verse: 28 },
        fulfillmentNote: 'Quoted directly by Peter at Pentecost (Acts 2:16-21) as being fulfilled that day.',
      },
    ],
  },
  {
    id: 'amos',
    name: 'Amos',
    major: false,
    ministryTimeline: 'c. 760-750 BC, a contemporary of Hosea and Isaiah\'s early ministry.',
    kingsServedUnder: ['Jeroboam II (Israel)', 'Uzziah (Judah)'],
    historicalContext:
      'A shepherd/farmer from Judah sent north to confront Israel during a time of prosperity and complacency, denouncing social injustice, luxury, and empty religious ritual.',
    keyProphecies: [
      {
        text: 'In that day I will raise up the tabernacle of David that is fallen.',
        reference: { bookId: 'AMO', chapter: 9, verse: 11 },
        fulfillmentNote: 'Cited by James at the Jerusalem Council (Acts 15:16-17) as fulfilled in Gentiles being brought into the church.',
      },
    ],
  },
  {
    id: 'obadiah',
    name: 'Obadiah',
    major: false,
    ministryTimeline: 'Likely soon after Jerusalem\'s fall in 586 BC, though an earlier 9th-century date is also proposed.',
    kingsServedUnder: ['Unknown -- the shortest book in the Old Testament, one chapter, names no king'],
    historicalContext:
      'A single-chapter oracle against Edom for gloating over and profiting from Jerusalem\'s destruction, since Edom was Israel\'s close but hostile "brother" nation (descended from Esau).',
    keyProphecies: [
      {
        text: 'The kingdom shall be the Lord\'s.',
        reference: { bookId: 'OBA', chapter: 1, verse: 21 },
        fulfillmentNote: 'A broad promise of God\'s ultimate reign, read by Christian tradition as pointing toward the Kingdom of God more fully revealed in the New Testament.',
      },
    ],
  },
  {
    id: 'jonah',
    name: 'Jonah',
    characterId: 'jonah',
    major: false,
    ministryTimeline: 'c. 780-750 BC, contemporary with Jeroboam II of Israel.',
    kingsServedUnder: ['Jeroboam II (Israel, per 2 Kings 14:25)'],
    historicalContext:
      'A reluctant prophet sent to Nineveh, capital of Assyria -- Israel\'s eventual conqueror -- who flees toward Tarshish rather than preach mercy to a hostile foreign power, is swallowed by a great fish, and ultimately preaches a message that leads the city to repent.',
    keyProphecies: [
      {
        text: 'As Jonah was three days and three nights in the belly of the fish...',
        reference: { bookId: 'JON', chapter: 1, verse: 17 },
        fulfillmentNote: 'Jesus cites this directly as a sign of his own three days in the tomb (Matthew 12:40).',
      },
    ],
  },
  {
    id: 'micah',
    name: 'Micah',
    major: false,
    ministryTimeline: 'c. 735-700 BC, a contemporary of Isaiah.',
    kingsServedUnder: ['Jotham', 'Ahaz', 'Hezekiah'],
    historicalContext:
      'A prophet from rural Judah addressing both Samaria (before its 722 BC fall) and Jerusalem, denouncing corrupt leaders and predicting judgment on both capitals, alongside one of the Old Testament\'s clearest birthplace prophecies of the Messiah.',
    keyProphecies: [
      {
        text: 'But you, Bethlehem Ephrathah... out of you shall come forth one who is to be ruler in Israel.',
        reference: { bookId: 'MIC', chapter: 5, verse: 2 },
        fulfillmentNote: 'Quoted by the chief priests and scribes in Matthew 2:5-6 as identifying Bethlehem as the Messiah\'s birthplace.',
      },
    ],
  },
  {
    id: 'nahum',
    name: 'Nahum',
    major: false,
    ministryTimeline: 'c. 663-612 BC, shortly before Nineveh\'s fall.',
    kingsServedUnder: ['Unknown Judean king -- the book focuses entirely on Nineveh/Assyria, not Judah\'s own throne'],
    historicalContext:
      'Written roughly a century after Jonah\'s Nineveh preached repentance, Nahum announces the city\'s coming, final destruction for its cruelty -- fulfilled when Nineveh fell to a Babylonian-Median coalition in 612 BC.',
    keyProphecies: [
      {
        text: 'The Lord is slow to anger... but he will not at all acquit the wicked.',
        reference: { bookId: 'NAM', chapter: 1, verse: 3 },
        fulfillmentNote: 'Nineveh\'s actual destruction in 612 BC, confirmed archaeologically, is widely read as the historical fulfillment of the book\'s central warning.',
      },
    ],
  },
  {
    id: 'habakkuk',
    name: 'Habakkuk',
    major: false,
    ministryTimeline: 'c. 605-597 BC, as Babylon was rising to power.',
    kingsServedUnder: ['Jehoiakim (Judah, likely)'],
    historicalContext:
      'A dialogue between the prophet and God, wrestling honestly with why God would use a violent nation (Babylon) to judge Judah, before ending in a declaration of trust regardless of circumstance.',
    keyProphecies: [
      {
        text: 'The just shall live by his faith.',
        reference: { bookId: 'HAB', chapter: 2, verse: 4 },
        fulfillmentNote: 'Central to Paul\'s argument for justification by faith in Romans 1:17 and Galatians 3:11, and to Hebrews 10:38.',
      },
    ],
  },
  {
    id: 'zephaniah',
    name: 'Zephaniah',
    major: false,
    ministryTimeline: 'c. 640-609 BC, during Josiah\'s reforms.',
    kingsServedUnder: ['Josiah'],
    historicalContext:
      'A descendant of Judean royalty who prophesied during King Josiah\'s religious reforms, warning of a coming "Day of the Lord" judgment while also promising a faithful remnant\'s restoration.',
    keyProphecies: [
      {
        text: 'The Lord your God is in your midst... he will rejoice over you with singing.',
        reference: { bookId: 'ZEP', chapter: 3, verse: 17 },
        fulfillmentNote: 'Read by Christian tradition as ultimately realized in God\'s presence with his people through Christ and, finally, in the new creation.',
      },
    ],
  },
  {
    id: 'haggai',
    name: 'Haggai',
    major: false,
    ministryTimeline: '520 BC, precisely dated to the second year of Darius I of Persia.',
    kingsServedUnder: ['Darius I of Persia (Judah itself had no king -- it was a Persian province)'],
    historicalContext:
      'Ministered to the returned exiles who had let the Temple rebuilding stall for over a decade; his direct, dated preaching (alongside Zechariah) spurred the leaders Zerubbabel and Joshua the high priest to resume and complete the work.',
    keyProphecies: [
      {
        text: 'I will shake the heavens and the earth... and I will fill this house with glory.',
        reference: { bookId: 'HAG', chapter: 2, verse: 7 },
        fulfillmentNote: 'Hebrews 12:26-27 applies the "shaking" language to the establishing of God\'s unshakeable kingdom through Christ.',
      },
    ],
  },
  {
    id: 'zechariah',
    name: 'Zechariah',
    major: false,
    ministryTimeline: 'c. 520-480 BC, a contemporary of Haggai in the early Persian period.',
    kingsServedUnder: ['Darius I of Persia'],
    historicalContext:
      'Ministered alongside Haggai to encourage the Temple\'s completion, but with a much longer series of visions extending into detailed messianic and end-times imagery.',
    keyProphecies: [
      {
        text: 'Behold, your King is coming to you... riding on a donkey.',
        reference: { bookId: 'ZEC', chapter: 9, verse: 9 },
        fulfillmentNote: 'Directly cited in Matthew 21:4-5 of Jesus\' entry into Jerusalem on Palm Sunday.',
      },
      {
        text: 'They will look on me, the one they have pierced.',
        reference: { bookId: 'ZEC', chapter: 12, verse: 10 },
        fulfillmentNote: 'Applied to Christ\'s crucifixion in John 19:37.',
      },
    ],
  },
  {
    id: 'malachi',
    name: 'Malachi',
    major: false,
    ministryTimeline: 'c. 460-430 BC, roughly contemporary with Ezra and Nehemiah.',
    kingsServedUnder: ['Judah was a Persian province under the Achaemenid kings; no local king reigned'],
    historicalContext:
      'The last of the Old Testament prophets, confronting a post-exilic community that had grown spiritually complacent -- priests offering defective sacrifices, and widespread unfaithfulness in marriage and tithing.',
    keyProphecies: [
      {
        text: 'Behold, I will send my messenger, and he will prepare the way before me.',
        reference: { bookId: 'MAL', chapter: 3, verse: 1 },
        fulfillmentNote: 'Applied to John the Baptist preparing the way for Jesus (Mark 1:2-3).',
      },
      {
        text: 'I will send you Elijah the prophet before the coming of the great and terrible day of the Lord.',
        reference: { bookId: 'MAL', chapter: 4, verse: 5 },
        fulfillmentNote: 'Jesus identifies John the Baptist as coming "in the spirit" of this prophecy (Matthew 11:14), though Jewish tradition also awaits a literal return of Elijah.',
      },
    ],
  },
];
