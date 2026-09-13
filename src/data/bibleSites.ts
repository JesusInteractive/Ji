// Curated sites for the Global Map ("Journeys Through the Bible") --
// see src/components/globe/FlatAtlasMapEngine.tsx for how these get
// projected onto the v1 flat atlas. Coordinates are real approximate
// lat/lng (not arbitrary image-pixel positions) specifically so the same
// data works unchanged under a future 3D globe engine.
//
// `photoUrl` is intentionally left unset on every entry in this pass --
// verifying a real photo's public-domain status (Library of Congress,
// Wikimedia Commons) one by one wasn't done here, and a guessed/unverified
// URL would be worse than none. Fill it in per-site once a real,
// checked URL exists; the dossier screen already renders it when present.
//
// Starter set: ~30 sites spanning all 7 era layers. Expand over time,
// same convention as bibleCharacters.ts/bibleTimeline.ts.
import type { VerseRef } from '../services/bibleGamesContent';

export type EraId = 'Patriarchs' | 'Exodus' | 'Kingdoms' | 'Prophets' | 'Gospels' | 'Acts' | 'Epistles' | 'EndTimes';

export interface SiteDossier {
  archaeology?: string;
  excavationHistory?: string;
  scholarlyDebate?: string;
}

// Every eschatological claim gets a badge naming what kind of claim it
// is, per explicit requirement: a verse is not the same kind of thing
// as a present-day fact, a symbolic vision, or one reading among several.
// - 'text': the plain scripture reference itself.
// - 'fact': a verifiable Second-Temple-period / archaeological fact.
// - 'present-day': what is physically there right now (e.g. the Temple
//   Mount's current structures) -- explicitly NOT "the Third Temple."
// - 'vision': a prophetic vision/measured plan (Ezekiel 40-48, Revelation
//   11's measuring), not a construction drawing of something standing.
// - 'diagram': an optional illustrative overlay of a vision, clearly
//   marked as a diagram, never presented as archaeology.
// - 'pack': an interpretation-pack claim -- one of several live readings,
//   never printed without the plain verses appearing first.
// - 'movement': a contemporary religious/cultural practice (e.g. modern
//   prepared temple vessels), explicitly not an archaeological find.
export type ClaimBadge = 'text' | 'fact' | 'present-day' | 'vision' | 'diagram' | 'pack' | 'movement';

export interface BadgedReference {
  reference: VerseRef;
  badge: ClaimBadge;
  note?: string; // e.g. "disputed sense of 'taken'" -- a short caveat shown next to the verse
}

// The three interpretation packs for end-times content -- same pins,
// same verses, different reading. Scripture always prints before any
// pack; the UI enforces this rather than trusting each site to order it
// correctly. See bibleSites.ts callers for the exact text supplied.
export interface InterpretationPack {
  futurist: string;
  historical: string;
  symbolic: string;
}

// A locked satellite framing for a site -- MapKit's own camera (heading
// = compass bearing in degrees, pitch = tilt in degrees, altitude in
// meters), not a separate 3D-globe engine. This is real, honestly-
// obtained oblique framing (Apple's own satellite imagery tilted and
// oriented the way the imagery actually reads best), not a fabricated
// "Earth 3D" mode -- see FlatAtlasMapEngine.tsx's own comment on why a
// true tilt-globe (Cesium/Google Earth) isn't part of this pass. Omit
// heading/pitch/altitude to fall back to a plain top-down look.
export interface SatelliteCamera {
  latitude: number;
  longitude: number;
  heading?: number;
  pitch?: number;
  altitude?: number;
}

export interface BiblicalSite {
  id: string;
  name: string;
  aliases?: string[];
  coordinates: { lat: number; lng: number };
  eras: EraId[];
  summary: string;
  whatHappened: string;
  keyReferences: VerseRef[];
  relatedCharacterIds: string[];
  relatedSiteIds?: string[];
  dossier?: SiteDossier;
  photoUrl?: string;
  liveFeedUrl?: string;
  satelliteCamera?: SatelliteCamera;
  // Overrides plain keyReferences with per-verse badges + optional
  // caveats, for sites where the kind of claim matters (end-times
  // content especially). When present, the dossier screen renders this
  // instead of the plain keyReferences list.
  badgedReferences?: BadgedReference[];
  // One of several live readings of the same pins/verses -- always
  // rendered after scripture, never in place of it. See InterpretationPack.
  interpretationPack?: InterpretationPack;
  // True for a site that names a real biblical location/event but is
  // NOT itself a claimed physical coordinate (e.g. "caught up... in the
  // clouds") -- FlatAtlasMapEngine skips rendering a map marker for
  // these so nothing reads as "the GPS pickup point," while the site
  // still has a normal dossier reachable via journeys/related-site links.
  nonGeographic?: boolean;
}

export const BIBLE_SITES: BiblicalSite[] = [
  // --- Patriarchs ---
  {
    id: 'ur',
    name: 'Ur of the Chaldees',
    coordinates: { lat: 30.96, lng: 46.1 },
    eras: ['Patriarchs'],
    summary: "Abraham's home city in southern Mesopotamia before God called him to leave.",
    whatHappened: 'A major Sumerian city with a great ziggurat to the moon god Sin -- Abram\'s family worshiped other gods here before God called him out to a land he had not yet seen.',
    keyReferences: [{ bookId: 'GEN', chapter: 11, verse: 31 }],
    relatedCharacterIds: ['abraham', 'sarah'],
    relatedSiteIds: ['haran'],
    dossier: {
      archaeology: 'Identified with Tell el-Muqayyar in southern Iraq, excavated extensively by Leonard Woolley in the 1920s-30s, revealing the Great Ziggurat of Ur and royal tombs from the Sumerian period.',
      scholarlyDebate: 'A minority of scholars propose a northern "Ur" near Haran instead of the southern Sumerian city, based on the patriarchal narratives\' northern Mesopotamian setting -- the identification with Tell el-Muqayyar remains the majority view.',
    },
  },
  {
    id: 'haran',
    name: 'Haran',
    coordinates: { lat: 36.86, lng: 39.03 },
    eras: ['Patriarchs'],
    summary: "The city in northern Mesopotamia where Abraham's family settled on the way to Canaan.",
    whatHappened: "Terah's family stopped and settled here; Abram continued on to Canaan only after Terah's death, and it's the city his servant later returns to in order to find a wife for Isaac.",
    keyReferences: [{ bookId: 'GEN', chapter: 12, verse: 4 }],
    relatedCharacterIds: ['abraham', 'isaac'],
    relatedSiteIds: ['ur'],
  },
  {
    id: 'bethel',
    name: 'Bethel',
    coordinates: { lat: 31.93, lng: 35.22 },
    eras: ['Patriarchs'],
    summary: "Where Jacob dreamed of a stairway to heaven and later wrestled with his identity as Israel.",
    whatHappened: "Jacob names this place 'Bethel' ('house of God') after dreaming of angels ascending and descending a stairway to heaven, and God renewing the Abrahamic covenant to him.",
    keyReferences: [{ bookId: 'GEN', chapter: 28, verse: 19 }],
    relatedCharacterIds: ['jacob'],
  },
  {
    id: 'hebron',
    name: 'Hebron',
    coordinates: { lat: 31.53, lng: 35.1 },
    eras: ['Patriarchs'],
    summary: 'Where Abraham, Isaac, and Jacob are all buried, in the Cave of Machpelah.',
    whatHappened: 'Abraham purchases the cave and field of Machpelah here to bury Sarah, and it becomes the burial place of the patriarchs and their wives.',
    keyReferences: [{ bookId: 'GEN', chapter: 23, verse: 19 }],
    relatedCharacterIds: ['abraham', 'sarah', 'isaac', 'jacob'],
  },
  {
    id: 'ararat',
    name: 'Mount Ararat',
    coordinates: { lat: 39.7, lng: 44.3 },
    eras: ['Patriarchs'],
    summary: "Where Noah's ark is said to have come to rest after the flood.",
    whatHappened: 'The Genesis flood narrative -- chronologically before the patriarchs, grouped here as the earliest available era layer -- describes the ark resting "on the mountains of Ararat" as the floodwaters receded.',
    keyReferences: [{ bookId: 'GEN', chapter: 8, verse: 4 }],
    relatedCharacterIds: ['noah'],
    dossier: {
      archaeology: 'No confirmed archaeological remains of an ark have ever been recovered on or near the mountain, despite numerous expeditions and claimed sightings.',
      scholarlyDebate: '"Ararat" in Genesis names a mountainous region (ancient Urartu), not necessarily the single peak known today as Mount Ararat in eastern Turkey -- that specific-peak identification is a later tradition. Independent geological surveys of the mountain have found no evidence of a large ancient wooden structure; most claimed "ark" formations are natural rock and ice features. The flood narrative itself remains a subject of wide-ranging debate between global-flood, local/regional-flood, and purely literary/theological readings.',
    },
  },

  // --- Exodus ---
  {
    id: 'goshen',
    name: 'Goshen (Nile Delta, Egypt)',
    coordinates: { lat: 30.8, lng: 31.2 },
    eras: ['Exodus'],
    summary: 'The fertile region of Egypt where Jacob\'s family settled and Israel multiplied for generations.',
    whatHappened: 'Joseph settles his family here during a famine; over centuries Israel grows from one family into a nation, eventually enslaved by Pharaoh.',
    keyReferences: [{ bookId: 'GEN', chapter: 47, verse: 6 }],
    relatedCharacterIds: ['joseph', 'jacob', 'moses'],
  },
  {
    id: 'sinai',
    name: 'Mount Sinai',
    aliases: ['Mount Horeb'],
    coordinates: { lat: 28.54, lng: 33.98 },
    eras: ['Exodus'],
    summary: 'Where Moses received the Ten Commandments and the Law from God.',
    whatHappened: 'God calls Moses from the burning bush here, and later Israel camps at its foot while Moses receives the Ten Commandments and the Law amid thunder, smoke, and fire.',
    keyReferences: [{ bookId: 'EXO', chapter: 19, verse: 20 }, { bookId: 'EXO', chapter: 20, verse: 1 }],
    relatedCharacterIds: ['moses', 'aaron'],
    dossier: {
      scholarlyDebate: 'The traditional site, Jebel Musa in Egypt\'s southern Sinai Peninsula, has been venerated since at least the 4th century AD (St. Catherine\'s Monastery sits at its base) but has no direct archaeological confirmation as the biblical mountain. A minority view associates biblical Sinai with Jabal al-Lawz in northwestern Saudi Arabia, citing the region\'s "Midian" associations and disputed surface finds (blackened peak rock, a large boulder split formation) as evidence -- mainstream biblical archaeology does not accept these as confirmed, and no peer-reviewed excavation has been conducted at Jabal al-Lawz. The mountain\'s true location remains an open, genuinely unresolved question.',
    },
  },
  {
    id: 'jericho',
    name: 'Jericho',
    coordinates: { lat: 31.87, lng: 35.44 },
    eras: ['Exodus'],
    summary: "Israel's first conquest in the Promised Land, its walls famously collapsing after seven days.",
    whatHappened: "After crossing the Jordan, Israel marches around Jericho's walls for seven days; on the seventh, the walls fall and the city is taken.",
    keyReferences: [{ bookId: 'JOS', chapter: 6, verse: 20 }],
    relatedCharacterIds: ['joshua', 'rahab'],
    dossier: {
      archaeology: 'Tell es-Sultan, one of the oldest continuously inhabited sites in the world, has been excavated since the 1860s, most famously by John Garstang (1930s) and Kathleen Kenyon (1950s-60s).',
      scholarlyDebate: 'Garstang dated a collapsed mudbrick wall layer to the Late Bronze Age, matching a traditional conquest date; Kenyon\'s later, more rigorous stratigraphy dated the same destruction layer roughly two centuries too early to match Joshua, and found little evidence of occupation at all in the traditional conquest period (c. 1400-1200 BC) -- a central point of ongoing debate in biblical archaeology between "early," "late," and "no historical conquest" conquest chronologies.',
    },
  },

  // --- Kingdoms ---
  {
    id: 'jerusalem',
    name: 'Jerusalem',
    coordinates: { lat: 31.78, lng: 35.22 },
    eras: ['Kingdoms', 'Gospels', 'Acts'],
    summary: "David's capital, the site of Solomon's Temple, and the city where Jesus was crucified and rose again.",
    whatHappened: "David conquers Jerusalem and makes it Israel's capital; Solomon builds the Temple here; centuries later, Jesus is tried, crucified, and rises from the dead just outside its walls, and the church is born here at Pentecost.",
    keyReferences: [{ bookId: '2SA', chapter: 5, verse: 7 }, { bookId: 'JHN', chapter: 19, verse: 17 }, { bookId: 'ACT', chapter: 2, verse: 5 }],
    relatedCharacterIds: ['david', 'solomon', 'jesus', 'peter'],
    relatedSiteIds: ['babylon'],
    dossier: {
      archaeology: 'Among the most excavated cities on earth -- the City of David excavations, the Western Wall tunnels, and the Temple Mount\'s surrounding areas have all been extensively studied, though excavation directly on the Temple Mount itself is politically and religiously restricted.',
      excavationHistory: 'Systematic excavation began in the 19th century (Charles Warren, 1867) and continues today; findings span from Bronze Age Canaanite Jerusalem through First and Second Temple periods to the Roman destruction of 70 AD.',
    },
    // The Western Wall Heritage Foundation's own official live camera --
    // verified via web search to be a real, currently-operating public
    // stream (not a third-party aggregator), per the "never fake a LIVE
    // badge" requirement. The Foundation pauses the feed for Shabbat and
    // Jewish holy days, which the dossier screen should be understood to
    // inherit if the embed itself goes dark at those times.
    liveFeedUrl: 'https://thekotel.org/en/western-wall/israel-live-cam/',
  },
  {
    id: 'shiloh',
    name: 'Shiloh',
    coordinates: { lat: 32.05, lng: 35.29 },
    eras: ['Kingdoms'],
    summary: "Israel's central worship site before Jerusalem, home to the Tabernacle for centuries.",
    whatHappened: 'The Ark of the Covenant and Tabernacle rest here for generations; the boy Samuel serves and hears God\'s call under the priest Eli at Shiloh.',
    keyReferences: [{ bookId: '1SA', chapter: 1, verse: 24 }, { bookId: '1SA', chapter: 3, verse: 10 }],
    relatedCharacterIds: ['samuel'],
  },
  {
    id: 'shechem',
    name: 'Shechem',
    coordinates: { lat: 32.21, lng: 35.28 },
    eras: ['Kingdoms'],
    summary: 'A covenant-renewal site between the patriarchal and kingdom periods, and briefly Israel\'s first northern capital.',
    whatHappened: 'Joshua leads Israel in a covenant-renewal ceremony here; later, it briefly serves as Israel\'s capital at the start of the divided kingdom.',
    keyReferences: [{ bookId: 'JOS', chapter: 24, verse: 25 }],
    relatedCharacterIds: ['joshua'],
  },
  {
    id: 'samaria',
    name: 'Samaria',
    coordinates: { lat: 32.28, lng: 35.19 },
    eras: ['Kingdoms'],
    summary: "Capital of the Northern Kingdom of Israel until its fall to Assyria in 722 BC.",
    whatHappened: 'Built by King Omri as Israel\'s capital and expanded by his son Ahab; it stands as the Northern Kingdom\'s seat of power until Assyria conquers it and deports much of its population.',
    keyReferences: [{ bookId: '1KI', chapter: 16, verse: 24 }],
    relatedCharacterIds: [],
    dossier: {
      archaeology: "Excavations (notably by the Harvard Expedition, 1908-1910, and later British teams) uncovered Ahab's palace complex and famed ivory inlays, matching the Bible's description of Ahab's opulence (1 Kings 22:39).",
    },
  },
  {
    id: 'mount_carmel',
    name: 'Mount Carmel',
    coordinates: { lat: 32.73, lng: 35.05 },
    eras: ['Kingdoms'],
    summary: 'Where Elijah defeated the prophets of Baal with fire from heaven.',
    whatHappened: 'Elijah challenges 450 prophets of Baal to a contest of sacrifice; God answers with fire from heaven, and Elijah has the false prophets executed.',
    keyReferences: [{ bookId: '1KI', chapter: 18, verse: 38 }],
    relatedCharacterIds: ['elijah'],
    relatedSiteIds: ['elijahs_cave'],
  },
  {
    id: 'megiddo',
    name: 'Megiddo',
    aliases: ['Armageddon', 'Har Megiddo'],
    coordinates: { lat: 32.585, lng: 35.183 },
    eras: ['Kingdoms', 'EndTimes'],
    summary: "A strategic fortress city Solomon fortified, the place kings already died, and the site whose name John borrows for a vision of a last gathering.",
    whatHappened: "Solomon builds up Megiddo as one of his chariot cities guarding the Jezreel Valley's trade routes. Kings had already died here in real history -- Deborah and Barak's victory, and centuries later King Josiah's death -- before John's vision in Revelation names \"Har Megiddo\" (Armageddon) as the place kings of the earth are gathered.",
    keyReferences: [],
    badgedReferences: [
      { reference: { bookId: '1KI', chapter: 9, verse: 15 }, badge: 'text' },
      { reference: { bookId: 'JDG', chapter: 4, verse: 15 }, badge: 'text', note: "Deborah and Barak's victory, fought on this same land" },
      { reference: { bookId: '2KI', chapter: 23, verse: 29 }, badge: 'text', note: 'King Josiah dies at Megiddo' },
      { reference: { bookId: 'REV', chapter: 16, verse: 16 }, badge: 'vision', note: 'John names the gathering "Har Megiddo" -- a vision, not a coordinate for troop movements' },
      { reference: { bookId: 'PSA', chapter: 2, verse: 2 }, badge: 'text' },
      { reference: { bookId: 'REV', chapter: 19, verse: 19 }, badge: 'vision' },
      { reference: { bookId: 'REV', chapter: 20, verse: 8 }, badge: 'vision', note: 'This gathering follows the thousand years per Revelation 20:7\'s own sequence -- its timing relative to other end-times events is itself debated between packs' },
      { reference: { bookId: 'COL', chapter: 2, verse: 15 }, badge: 'text', note: 'The cross already strips the powers -- the last battle is not the only victory this story tells' },
      { reference: { bookId: 'JHN', chapter: 12, verse: 31 }, badge: 'text' },
    ],
    relatedCharacterIds: ['solomon'],
    relatedSiteIds: ['jezreel_valley', 'temple_mount_hope'],
    dossier: {
      archaeology: 'One of the most excavated tells in the Near East (University of Chicago in the 1920s-30s, later Tel Aviv University-led expeditions), with 20+ superimposed layers of occupation spanning roughly 5,000 years, including monumental gate structures and stables/storehouse complexes debated as Solomonic or slightly later (Omride) construction. A later Christian prayer-hall mosaic was also found at the site, from the Roman-era garrison town nearby.',
      scholarlyDebate: 'The exact date of Megiddo\'s famous six-chambered gate and associated structures -- 10th-century Solomonic vs. 9th-century Omride -- is a genuinely live debate in Israeli archaeology (the "Low Chronology" question), not a settled matter.',
    },
    interpretationPack: {
      futurist: 'Kings of the earth gather at Har Megiddo for a final campaign against Jerusalem, met by Christ\'s appearing (Revelation 19:11-21) and, after a thousand years, a last rebellion (Revelation 20:7-10); Ezekiel 38\'s invasion by Gog is debated as happening before, during, or after this same window.',
      historical: 'Megiddo\'s own history already supplies the pattern -- Deborah and Barak\'s victory and King Josiah\'s death here -- and Revelation borrows the name as a symbol of decisive, God-ended conflict, not a predicted map coordinate for a future battle.',
      symbolic: 'Armageddon and Gog name the last assault on the city of God in apocalyptic language; the real victory is already described as won at the cross (Colossians 2:15; John 12:31) -- the final scene in Revelation is worship, not primarily a battlefield report.',
    },
    // Framed obliquely over the ruin mound so the excavated gate/palace
    // area reads as a real tell, not a flat aerial square.
    satelliteCamera: { latitude: 32.585, longitude: 35.183, heading: 200, pitch: 55, altitude: 550 },
  },

  // --- Prophets ---
  {
    id: 'elijahs_cave',
    name: "Elijah's Cave",
    coordinates: { lat: 32.82, lng: 34.97 },
    eras: ['Prophets'],
    summary: 'Traditional site on Mount Carmel associated with Elijah taking refuge.',
    whatHappened: "Jewish, Christian, and Muslim tradition alike venerate this cave as a place where Elijah sheltered -- the biblical text itself does not name this specific cave, unlike the widely-recognized contest with Baal's prophets nearby.",
    keyReferences: [{ bookId: '1KI', chapter: 19, verse: 9 }],
    relatedCharacterIds: ['elijah'],
    relatedSiteIds: ['mount_carmel'],
    dossier: {
      scholarlyDebate: 'The text of 1 Kings 19:9 places Elijah in "a cave" near Horeb (Sinai), far to the south -- not on Carmel. The Haifa cave\'s association with Elijah is a later devotional tradition rather than a claim the biblical text itself makes about this specific location; it remains a meaningful pilgrimage site regardless of the precise textual match.',
    },
  },
  {
    id: 'babylon',
    name: 'Babylon',
    coordinates: { lat: 32.54, lng: 44.42 },
    eras: ['Prophets'],
    summary: "Capital of the empire that destroyed Jerusalem and carried Judah into exile.",
    whatHappened: 'Nebuchadnezzar besieges and destroys Jerusalem, deporting Judah\'s people here; Daniel serves in the royal court, and the exiles live here for roughly seventy years before Cyrus of Persia permits their return.',
    keyReferences: [{ bookId: '2KI', chapter: 25, verse: 11 }, { bookId: 'DAN', chapter: 1, verse: 6 }],
    relatedCharacterIds: ['daniel', 'jeremiah'],
    relatedSiteIds: ['jerusalem', 'susa'],
    dossier: {
      archaeology: 'Extensively excavated by German archaeologist Robert Koldewey (1899-1917), uncovering the Ishtar Gate, the Processional Way, and the massive city walls of Nebuchadnezzar\'s Babylon.',
      excavationHistory: "Koldewey's finds -- including the foundations popularly (though not certainly) linked to the legendary Hanging Gardens -- confirmed Babylon's scale as the ancient world's largest city in its time.",
    },
  },
  {
    id: 'susa',
    name: 'Susa',
    coordinates: { lat: 32.19, lng: 48.26 },
    eras: ['Prophets'],
    summary: "The Persian royal capital where Esther became queen and Nehemiah served the king.",
    whatHappened: 'Esther is taken into King Ahasuerus\'s harem and becomes queen here, later risking her life to save her people; Nehemiah also serves as royal cupbearer here before leading the return to rebuild Jerusalem\'s walls.',
    keyReferences: [{ bookId: 'EST', chapter: 1, verse: 2 }, { bookId: 'NEH', chapter: 1, verse: 1 }],
    relatedCharacterIds: ['esther'],
    relatedSiteIds: ['babylon'],
  },
  {
    id: 'nineveh',
    name: 'Nineveh',
    coordinates: { lat: 36.36, lng: 43.15 },
    eras: ['Prophets'],
    summary: "The Assyrian capital that repented at Jonah's preaching, and later fell as Nahum foretold.",
    whatHappened: "Jonah reluctantly preaches judgment here and the city repents; roughly a century later, Nahum predicts its final destruction, which comes in 612 BC.",
    keyReferences: [{ bookId: 'JON', chapter: 3, verse: 4 }, { bookId: 'NAM', chapter: 1, verse: 1 }],
    relatedCharacterIds: ['jonah'],
    dossier: {
      archaeology: 'Excavated since the mid-19th century (Austen Henry Layard and others); finds include the palace of Sennacherib and the great Library of Ashurbanipal, with thousands of cuneiform tablets.',
    },
  },
  {
    id: 'gath_hepher',
    name: 'Gath-hepher',
    coordinates: { lat: 32.75, lng: 35.43 },
    eras: ['Prophets'],
    summary: "Jonah's hometown in Galilee.",
    whatHappened: 'The prophet Jonah\'s home village, in the territory of Zebulun -- the starting point of his journey away from, and eventually to, Nineveh.',
    keyReferences: [{ bookId: '2KI', chapter: 14, verse: 25 }],
    relatedCharacterIds: ['jonah'],
    relatedSiteIds: ['joppa', 'nineveh'],
  },
  {
    id: 'joppa',
    name: 'Joppa',
    coordinates: { lat: 32.05, lng: 34.75 },
    eras: ['Prophets'],
    summary: 'The port from which Jonah fled by ship rather than preach to Nineveh.',
    whatHappened: 'Jonah boards a ship here bound for Tarshish, fleeing in the opposite direction from Nineveh, before the storm and the great fish turn him back toward his calling.',
    keyReferences: [{ bookId: 'JON', chapter: 1, verse: 3 }],
    relatedCharacterIds: ['jonah'],
    relatedSiteIds: ['gath_hepher', 'nineveh'],
    // Framed on the old harbor mouth at Jaffa, not downtown Tel Aviv --
    // that distinction is the whole point of a locked camera here.
    satelliteCamera: { latitude: 32.0533, longitude: 34.7502, heading: 280, pitch: 55, altitude: 450 },
  },
  {
    id: 'kebar_river',
    name: 'Kebar River',
    coordinates: { lat: 32.13, lng: 45.24 },
    eras: ['Prophets'],
    summary: "Where the exiled priest Ezekiel received his prophetic call in a vision of God's throne.",
    whatHappened: "Settled here among fellow exiles, Ezekiel sees the heavens open in a vision of God's throne-chariot and is commissioned as a prophet to Israel in exile.",
    keyReferences: [{ bookId: 'EZK', chapter: 1, verse: 1 }],
    relatedCharacterIds: [],
    dossier: {
      scholarlyDebate: 'The exact course of the ancient "Kebar" (Chebar) canal is not precisely fixed by archaeology; most scholars locate it in the vicinity of Nippur in southern Mesopotamia based on a Babylonian-era canal name recorded in cuneiform texts, but the identification is reasoned rather than certain.',
    },
  },

  // --- Gospels ---
  {
    id: 'bethlehem',
    name: 'Bethlehem',
    coordinates: { lat: 31.7, lng: 35.2 },
    eras: ['Gospels'],
    summary: 'The birthplace of Jesus, foretold centuries earlier by the prophet Micah.',
    whatHappened: 'Mary and Joseph travel here for a census, and Jesus is born and laid in a manger; shepherds and, later, magi from the east come to see him.',
    keyReferences: [{ bookId: 'LUK', chapter: 2, verse: 7 }, { bookId: 'MIC', chapter: 5, verse: 2 }],
    relatedCharacterIds: ['jesus', 'mary', 'joseph_nt'],
    // The Bethlehem Municipality's own official live feed of Manger
    // Square (in front of the Church of the Nativity) -- verified via
    // web search to be a real, official source, not a third-party
    // aggregator. Same "never fake a LIVE badge" bar as Jerusalem's.
    liveFeedUrl: 'https://www.bethlehem-city.org/en/live',
  },
  {
    id: 'nazareth',
    name: 'Nazareth',
    coordinates: { lat: 32.7, lng: 35.3 },
    eras: ['Gospels'],
    summary: "Jesus' childhood home town in Galilee.",
    whatHappened: 'The angel Gabriel announces Jesus\' coming birth to Mary here, and Jesus grows up in this small Galilean town before beginning his public ministry.',
    keyReferences: [{ bookId: 'LUK', chapter: 1, verse: 26 }, { bookId: 'LUK', chapter: 4, verse: 16 }],
    relatedCharacterIds: ['jesus', 'mary'],
  },
  {
    // Named as the specific traditional baptism site (Qasr al-Yahud, on
    // the West Bank side of the Jordan), not a vague single pin on "the
    // Jordan River" -- the river itself runs for miles and a bare
    // "Jordan River" pin doesn't say where. Yardenit, further north on
    // the Sea of Galilee's outflow, is a separate, more recently
    // established baptism site some tour groups visit instead; this
    // pin and its satellite camera are Qasr al-Yahud specifically.
    id: 'qasr_al_yahud',
    name: 'Qasr al-Yahud',
    aliases: ['Jordan River baptism site'],
    coordinates: { lat: 31.8383, lng: 35.5392 },
    eras: ['Gospels'],
    summary: 'The traditional site on the Jordan River where John the Baptist baptized Jesus.',
    whatHappened: "John the Baptist baptizes Jesus here, and a voice from heaven declares him God's beloved Son as the Spirit descends like a dove.",
    keyReferences: [{ bookId: 'MAT', chapter: 3, verse: 16 }],
    relatedCharacterIds: ['jesus', 'john_baptist'],
    dossier: {
      scholarlyDebate: 'Qasr al-Yahud is the traditional Christian pilgrimage site, with baptism platforms on both the West Bank and Jordanian sides of the river; Yardenit, near the Sea of Galilee\'s outflow, is a separate, more modern site many tour groups visit instead for practical/access reasons -- the two are genuinely different locations on the same river, not interchangeable names for one spot.',
    },
    // Framed to show both riverbanks and the wooden baptism platforms,
    // not a straight-down view -- a real MapKit camera (heading/pitch/
    // altitude), not a fabricated "3D Earth" render.
    satelliteCamera: { latitude: 31.8383, longitude: 35.5392, heading: 95, pitch: 55, altitude: 350 },
  },
  {
    id: 'capernaum',
    name: 'Capernaum',
    coordinates: { lat: 32.88, lng: 35.58 },
    eras: ['Gospels'],
    summary: "Jesus' home base for much of his Galilean ministry, on the Sea of Galilee's northern shore.",
    whatHappened: "Jesus calls several disciples from here, teaches in its synagogue, and performs many miracles, including healing Peter's mother-in-law and a paralyzed man lowered through the roof.",
    keyReferences: [{ bookId: 'MAT', chapter: 4, verse: 13 }, { bookId: 'MRK', chapter: 2, verse: 4 }],
    relatedCharacterIds: ['jesus', 'peter'],
    relatedSiteIds: ['sea_of_galilee'],
    dossier: {
      archaeology: 'Excavations have uncovered a 1st-century synagogue foundation beneath a later, more elaborate synagogue building, and a house traditionally identified as Peter\'s, over which a later church was built.',
    },
  },
  {
    id: 'sea_of_galilee',
    name: 'Sea of Galilee',
    aliases: ['Lake of Gennesaret', 'Sea of Tiberias'],
    coordinates: { lat: 32.83, lng: 35.59 },
    eras: ['Gospels'],
    summary: 'The freshwater lake at the center of much of Jesus\' public ministry.',
    whatHappened: 'Jesus calls his first disciples from its fishing boats, calms a storm on its waters, walks on the sea, and teaches crowds gathered along its shore.',
    keyReferences: [{ bookId: 'MRK', chapter: 4, verse: 39 }, { bookId: 'MAT', chapter: 14, verse: 25 }],
    relatedCharacterIds: ['jesus', 'peter'],
    relatedSiteIds: ['capernaum'],
  },

  // --- Acts ---
  {
    id: 'damascus',
    name: 'Damascus',
    coordinates: { lat: 33.51, lng: 36.29 },
    eras: ['Acts'],
    summary: 'Where Saul, on his way to persecute Christians, encountered the risen Jesus.',
    whatHappened: 'A blinding light and the voice of Jesus confront Saul on the road here, turning history\'s most zealous persecutor of the church into its most influential missionary.',
    keyReferences: [{ bookId: 'ACT', chapter: 9, verse: 3 }],
    relatedCharacterIds: ['paul'],
  },
  {
    id: 'antioch_syria',
    name: 'Antioch (Syria)',
    coordinates: { lat: 36.2, lng: 36.16 },
    eras: ['Acts'],
    summary: 'Where believers were first called "Christians," and the launch point for Paul\'s missionary journeys.',
    whatHappened: 'A thriving multi-ethnic church forms here; it commissions and sends out Paul and Barnabas on the first of the missionary journeys recorded in Acts.',
    keyReferences: [{ bookId: 'ACT', chapter: 11, verse: 26 }, { bookId: 'ACT', chapter: 13, verse: 3 }],
    relatedCharacterIds: ['paul'],
  },
  {
    id: 'philippi',
    name: 'Philippi',
    coordinates: { lat: 41.01, lng: 24.29 },
    eras: ['Acts', 'Epistles'],
    summary: "The first church Paul planted in Europe, and recipient of one of his epistles.",
    whatHappened: 'Paul and Silas are imprisoned here after an earthquake opens the jail doors; the jailer and his household are converted, and the church here later receives Paul\'s letter to the Philippians.',
    keyReferences: [{ bookId: 'ACT', chapter: 16, verse: 31 }],
    relatedCharacterIds: ['paul'],
  },
  {
    id: 'athens',
    name: 'Athens',
    coordinates: { lat: 37.98, lng: 23.73 },
    eras: ['Acts'],
    summary: "Where Paul preached to Greek philosophers at the Areopagus.",
    whatHappened: 'Paul addresses the philosophers of the Areopagus, using an altar "to an unknown god" as his opening to introduce the God who made heaven and earth.',
    keyReferences: [{ bookId: 'ACT', chapter: 17, verse: 23 }],
    relatedCharacterIds: ['paul'],
  },
  {
    id: 'corinth',
    name: 'Corinth',
    coordinates: { lat: 37.94, lng: 22.93 },
    eras: ['Acts', 'Epistles'],
    summary: "A major commercial city where Paul planted a church and later wrote two epistles to correct it.",
    whatHappened: "Paul ministers here for eighteen months; the church he plants struggles with division and moral compromise, prompting his two New Testament letters to the Corinthians.",
    keyReferences: [{ bookId: 'ACT', chapter: 18, verse: 11 }],
    relatedCharacterIds: ['paul'],
    // Framed on the ancient harbor of Lechaion specifically -- Corinth's
    // Gulf-of-Corinth port, not the inland main city site.
    satelliteCamera: { latitude: 37.9436, longitude: 22.8747, heading: 10, pitch: 55, altitude: 500 },
  },

  // --- Epistles ---
  {
    id: 'ephesus',
    name: 'Ephesus',
    coordinates: { lat: 37.94, lng: 27.34 },
    eras: ['Acts', 'Epistles'],
    summary: "A major church Paul planted and later wrote to from prison.",
    whatHappened: 'Paul ministers here for over two years; the church he plants later receives his letter to the Ephesians, written while he was imprisoned in Rome.',
    keyReferences: [{ bookId: 'ACT', chapter: 19, verse: 10 }, { bookId: 'EPH', chapter: 1, verse: 1 }],
    relatedCharacterIds: ['paul'],
    dossier: {
      archaeology: 'One of the best-preserved ancient cities in the eastern Mediterranean, with the Library of Celsus, the Great Theatre (where a riot against Paul\'s preaching broke out, Acts 19:29), and the Temple of Artemis site all excavated.',
    },
  },
  {
    id: 'rome',
    name: 'Rome',
    coordinates: { lat: 41.9, lng: 12.5 },
    eras: ['Acts', 'Epistles'],
    summary: 'Where Paul was imprisoned and wrote several of his epistles, and where church tradition holds he and Peter were martyred.',
    whatHappened: 'Paul is brought here under guard to appeal his case to Caesar, writing his "prison epistles" during his confinement; church tradition holds both Paul and Peter were later martyred here under Nero.',
    keyReferences: [{ bookId: 'ACT', chapter: 28, verse: 16 }, { bookId: 'ROM', chapter: 1, verse: 7 }],
    relatedCharacterIds: ['paul', 'peter'],
  },
  {
    id: 'patmos',
    name: 'Patmos',
    coordinates: { lat: 37.3, lng: 26.55 },
    eras: ['Epistles'],
    summary: "The island where John received the vision recorded in the Book of Revelation.",
    whatHappened: 'Exiled here for his faith, the apostle John receives the apocalyptic vision he records as the Book of Revelation.',
    keyReferences: [{ bookId: 'REV', chapter: 1, verse: 9 }],
    relatedCharacterIds: [],
    // Framed to show the whole island. A second bookmark specifically
    // on Chora (the hilltop town/monastery of St. John) would be a
    // natural addition -- the data model only carries one camera per
    // site in this pass, so that's future work, not built here.
    satelliteCamera: { latitude: 37.31, longitude: 26.545, heading: 0, pitch: 45, altitude: 8000 },
  },

  // --- End Times: Prophets / Revelation / Hope of the House / Last
  // Conflict -- deliberately its OWN era layer, not folded into
  // Gospels. Every claim in this section is badged (see ClaimBadge)
  // and, where a live interpretive debate exists, carries an
  // interpretationPack with three readings (futurist/dispensational,
  // historical/preterist-leaning, symbolic/amillennial) -- scripture
  // always renders before the pack, never instead of it.
  {
    id: 'temple_mount_hope',
    name: 'Temple Mount -- Memory and Hope',
    aliases: ['Har HaBayit'],
    coordinates: { lat: 31.7780, lng: 35.2354 },
    eras: ['EndTimes'],
    summary: 'The ridge held the First and Second Temples. No third house stands today -- what is there now is the Dome of the Rock and Al-Aqsa Mosque, not a rebuilt Jewish sanctuary.',
    whatHappened: "Solomon's Temple (the First House) stood here, was destroyed by Babylon, and was rebuilt after the exile; Herod's expansion of that Second House was itself destroyed by Rome in 70 CE. What occupies the platform today is Islamic, not a third Jewish temple -- interpreters disagree on whether a rebuilt stone temple is still expected.",
    keyReferences: [],
    badgedReferences: [
      { reference: { bookId: '1KI', chapter: 6, verse: 1 }, badge: 'text', note: 'The First House, begun under Solomon' },
      { reference: { bookId: 'EZR', chapter: 3, verse: 10 }, badge: 'text', note: 'The Second House\'s foundation laid after the exile' },
      { reference: { bookId: 'HAG', chapter: 2, verse: 9 }, badge: 'text' },
      { reference: { bookId: 'JHN', chapter: 2, verse: 20 }, badge: 'text' },
      { reference: { bookId: 'MRK', chapter: 13, verse: 2 }, badge: 'text', note: 'Jesus\' prophecy of the Second House\'s destruction, fulfilled in 70 CE' },
      { reference: { bookId: 'ISA', chapter: 2, verse: 2 }, badge: 'text' },
      { reference: { bookId: 'DAN', chapter: 9, verse: 27 }, badge: 'text', note: 'What this "abomination" refers to is exactly what the three packs below disagree on' },
      { reference: { bookId: 'MAT', chapter: 24, verse: 15 }, badge: 'text' },
      { reference: { bookId: '2TH', chapter: 2, verse: 4 }, badge: 'text' },
      { reference: { bookId: 'EZK', chapter: 43, verse: 5 }, badge: 'vision', note: 'Ezekiel measures a future sanctuary -- a vision/plan, not a building under construction' },
      { reference: { bookId: 'REV', chapter: 11, verse: 1 }, badge: 'vision', note: 'John measures a temple in a vision, not a construction drawing' },
      { reference: { bookId: 'REV', chapter: 21, verse: 22 }, badge: 'text', note: 'The New Testament\'s own last word on the subject: a city with no temple at all' },
    ],
    relatedCharacterIds: ['solomon'],
    relatedSiteIds: ['jerusalem', 'megiddo'],
    dossier: {
      archaeology: 'Herodian ashlars, Robinson\'s Arch, the Temple Warning Inscription (barring Gentiles from the inner courts on pain of death), and the Trumpeting Stone are all real Second-Temple-period finds around the platform. The 70 CE burn layer is independently attested archaeologically, not only textually.',
      scholarlyDebate: 'Whether Daniel\'s and Jesus\' "abomination of desolation" points to Antiochus Epiphanes (167 BC), the Roman destruction of 70 CE, a still-future event, or more than one of these historical moments read together, is a genuine, long-standing interpretive disagreement -- not a settled question this app takes a side on.',
    },
    interpretationPack: {
      futurist: 'A rebuilt sanctuary resumes sacrifice under a coming adversary for 42 months (Daniel 9:27; 2 Thessalonians 2:3-4), ended by Christ\'s appearing (Revelation 19).',
      historical: 'Daniel and Jesus both point at least partly to Antiochus Epiphanes and/or the Roman destruction of 66-70 CE; Revelation\'s temple-measuring addresses the first-century Jewish and Roman world, not a still-future building.',
      symbolic: 'Ezekiel 40-48 is a measured hope for restored worship, not a construction blueprint on a fixed timetable. Some Jewish expectation still looks for a rebuilt Mikdash with no Christian timetable attached -- but the New Testament\'s own last word (Revelation 21:22) is a city with no temple at all.',
    },
    satelliteCamera: { latitude: 31.7780, longitude: 35.2354, heading: 0, pitch: 60, altitude: 700 },
  },
  {
    id: 'jezreel_valley',
    name: 'Jezreel Valley',
    aliases: ['Plain of Esdraelon'],
    coordinates: { lat: 32.65, lng: 35.30 },
    eras: ['Kingdoms', 'EndTimes'],
    summary: "The broad valley floor below Megiddo where armies have historically moved -- the field named in John's vision of a gathering at \"Armageddon.\"",
    whatHappened: "This valley, running between Mount Carmel and Mount Gilboa, has been fought over for millennia because it commands the routes between Egypt and Mesopotamia; Revelation borrows the name of the fortress overlooking it (Har Megiddo) for its vision of a last gathering of kings.",
    keyReferences: [],
    badgedReferences: [
      { reference: { bookId: 'JOL', chapter: 3, verse: 14 }, badge: 'text', note: 'The "valley of decision" is Joel\'s own naming, distinct from Jezreel/Megiddo' },
      { reference: { bookId: 'EZK', chapter: 38, verse: 16 }, badge: 'vision', note: 'Ezekiel names "the mountains of Israel," not this valley specifically -- grouped here as the nearest mapped geography, not a claim they are the same place' },
    ],
    relatedCharacterIds: [],
    relatedSiteIds: ['megiddo'],
    satelliteCamera: { latitude: 32.65, longitude: 35.30, heading: 320, pitch: 50, altitude: 4500 },
  },
  {
    id: 'olivet_summit',
    name: 'Mount of Olives -- Summit',
    aliases: ['Olivet', 'Traditional Ascension site'],
    coordinates: { lat: 31.7784, lng: 35.2446 },
    eras: ['Gospels', 'Acts', 'EndTimes'],
    summary: "From this ridge Jesus taught about the end of the age and was taken up into heaven.",
    whatHappened: "Jesus teaches privately on this mountain about the destruction of the Temple and the end of the age (Matthew 24), and after the resurrection is carried up from near here into a cloud, with the promise that he will come the same way he went.",
    keyReferences: [],
    badgedReferences: [
      { reference: { bookId: '2SA', chapter: 15, verse: 30 }, badge: 'text', note: 'David\'s own ascent of this ridge, weeping, centuries earlier' },
      { reference: { bookId: 'EZK', chapter: 11, verse: 23 }, badge: 'text', note: 'The glory of the Lord departs Jerusalem to "the mountain on the east of the city"' },
      { reference: { bookId: 'ZEC', chapter: 14, verse: 4 }, badge: 'text', note: 'His feet stand on the Mount of Olives, and it splits' },
      { reference: { bookId: 'MAT', chapter: 24, verse: 3 }, badge: 'text' },
      { reference: { bookId: 'LUK', chapter: 24, verse: 51 }, badge: 'text' },
      { reference: { bookId: 'ACT', chapter: 1, verse: 9 }, badge: 'text' },
      { reference: { bookId: 'ACT', chapter: 1, verse: 11 }, badge: 'text', note: 'Acts does not itself quote Zechariah 14 -- linking the ascension to that oracle is a later, reasonable but interpretive connection, not something Acts states outright' },
    ],
    relatedCharacterIds: ['jesus'],
    relatedSiteIds: ['jerusalem', 'dominus_flevit', 'gethsemane', 'bethany_bethphage', 'caught_up'],
    interpretationPack: {
      futurist: 'Jesus will return the same way he ascended, his feet again on the Mount of Olives (Zechariah 14:4), splitting it as he comes to reign.',
      historical: 'Luke and Acts describe a real, historical ascension from this ridge; Zechariah\'s splitting-mountain oracle addressed Judah\'s own future deliverance in its own moment, and applying it to Jesus\' return is a New Testament-era reading rather than a claim Acts itself makes.',
      symbolic: 'The mount functions as the place of both departure and hoped-for arrival -- ground that carries a promise, not a mechanism to be diagrammed.',
    },
    // Framed east-west so Zechariah's "mount... on the east of the
    // city" geography actually reads in the image -- not a claim about
    // any fault line, which the ridge does not visibly show.
    satelliteCamera: { latitude: 31.7784, longitude: 35.2446, heading: 270, pitch: 55, altitude: 500 },
  },
  {
    id: 'dominus_flevit',
    name: 'Dominus Flevit',
    aliases: ["Where Jesus wept"],
    coordinates: { lat: 31.7770, lng: 35.2427 },
    eras: ['Gospels'],
    summary: 'The traditional spot on the Mount of Olives where Jesus wept over Jerusalem.',
    whatHappened: 'Looking out over the city from this slope, Jesus weeps, foreseeing Jerusalem\'s coming destruction.',
    keyReferences: [{ bookId: 'LUK', chapter: 19, verse: 41 }],
    relatedCharacterIds: ['jesus'],
    relatedSiteIds: ['olivet_summit'],
  },
  {
    id: 'gethsemane',
    name: 'Gethsemane',
    aliases: ['Kidron Valley foot', 'Valley of Jehoshaphat (traditional ID)'],
    coordinates: { lat: 31.7794, lng: 35.2396 },
    eras: ['Gospels'],
    summary: "The garden at the foot of the Mount of Olives, across the Kidron Valley, where Jesus prayed the night before his crucifixion.",
    whatHappened: "Jesus prays here in anguish the night of his arrest; the Kidron Valley he crossed to reach it is traditionally (not certainly) identified with the \"Valley of Jehoshaphat\" of Joel's oracle.",
    keyReferences: [{ bookId: 'MAT', chapter: 26, verse: 36 }],
    badgedReferences: [
      { reference: { bookId: 'MAT', chapter: 26, verse: 36 }, badge: 'text' },
      { reference: { bookId: '2SA', chapter: 15, verse: 23 }, badge: 'text', note: 'David crosses this same Kidron Valley centuries earlier' },
      { reference: { bookId: 'JOL', chapter: 3, verse: 2 }, badge: 'vision', note: '"Valley of Jehoshaphat" is a traditional identification with Kidron, not a certain one' },
    ],
    relatedCharacterIds: ['jesus'],
    relatedSiteIds: ['olivet_summit'],
  },
  {
    id: 'bethany_bethphage',
    name: 'Bethany and Bethphage',
    coordinates: { lat: 31.7719, lng: 35.2611 },
    eras: ['Gospels'],
    summary: 'The villages on the Mount of Olives\' eastern slope where Jesus stayed and from which the triumphal entry began.',
    whatHappened: 'Jesus stays in Bethany (home of Lazarus, Mary, and Martha) and sends disciples ahead from Bethphage to fetch a colt for his entry into Jerusalem.',
    keyReferences: [{ bookId: 'MRK', chapter: 11, verse: 1 }],
    relatedCharacterIds: ['jesus', 'lazarus', 'martha'],
    relatedSiteIds: ['olivet_summit'],
  },
  {
    id: 'euphrates_river',
    name: 'The Euphrates',
    coordinates: { lat: 35.5, lng: 40.0 },
    eras: ['EndTimes'],
    summary: "The great river named in John's vision as the site of a sixth-bowl judgment -- a real, named river, not a described troop movement.",
    whatHappened: 'John sees a bowl of judgment poured out on "the great river Euphrates," drying its waters to prepare a way -- imagery, not a claimed battlefield map.',
    keyReferences: [],
    badgedReferences: [
      { reference: { bookId: 'REV', chapter: 16, verse: 12 }, badge: 'vision', note: 'A named river in a vision -- not a described army column' },
    ],
    relatedCharacterIds: [],
    relatedSiteIds: ['babylon'],
  },
  {
    id: 'caught_up',
    name: 'Caught Up -- 1 Thessalonians 4',
    coordinates: { lat: 31.7784, lng: 35.2446 }, // deliberately Olivet's own coordinates -- see nonGeographic note below
    eras: ['EndTimes'],
    nonGeographic: true,
    summary: 'Not a place on the map. Paul describes believers meeting the Lord in the clouds, in the air -- no mountain, airport, or rooftop is named as the location.',
    whatHappened: 'Paul comforts a grieving church: the dead in Christ rise first, then the living are "caught up... in the clouds, to meet the Lord in the air." This is a meeting in the sky, not a coordinate on the ground.',
    keyReferences: [],
    badgedReferences: [
      { reference: { bookId: 'JHN', chapter: 14, verse: 3 }, badge: 'text' },
      { reference: { bookId: '1TH', chapter: 4, verse: 17 }, badge: 'text' },
      { reference: { bookId: '1CO', chapter: 15, verse: 52 }, badge: 'text' },
      { reference: { bookId: '2TH', chapter: 2, verse: 1 }, badge: 'text' },
      { reference: { bookId: 'MAT', chapter: 24, verse: 40 }, badge: 'text', note: 'The sense of "taken" here -- taken in judgment, or taken to safety -- is itself disputed between packs' },
    ],
    relatedCharacterIds: [],
    relatedSiteIds: ['olivet_summit'],
    dossier: {
      scholarlyDebate: 'This card exists specifically because no mountain, airport, Petra, the Garden Tomb, or any church roof should be marked as the "location" of this event. Where it happens is the sky; the "optional remembrance viewpoint" some hold (looking west from Olivet) is a viewpoint for reflection, not the coordinates of 1 Thessalonians 4.',
    },
    interpretationPack: {
      futurist: 'Believers are caught up to meet the Lord in the air (1 Thessalonians 4:16-17) -- readings differ on whether this happens before a coming tribulation, after it, or partway through, and on whether it is the same moment as Olivet\'s appearing or an earlier one.',
      historical: 'Paul\'s aim is pastoral: certainty of reunion with the Lord and with departed believers, answering grief in Thessalonica. Detailed sequencing schemes are a later systematizing of the text rather than something the passage itself sets out to establish.',
      symbolic: 'The "meeting in the air" echoes how a city would go out to welcome an arriving king and then return with him -- the emphasis lands on permanent presence with the Lord, not on a removal-and-return itinerary.',
    },
  },
];
