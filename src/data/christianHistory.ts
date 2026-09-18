// "On This Day" -- a dated commemoration strip inside the Jesus
// Interactive News Brief (NewsWatchScreen.tsx), sitting between the
// AI-generated "Now Brief" and the live "Headlines" feed. This is
// church history, not revelation: every entry below is a real, dated
// event or a long-established traditional commemoration, never
// something invented or "remembered" by the model. Entries whose exact
// day genuinely isn't settled by the historical record are left out
// entirely rather than guessed (see getOnThisDay's own comment on the
// archive fallback for what happens on a day with none seeded).
//
// `source` is either a real citation ("Diet of Worms, 1521") or the
// literal string 'Traditional commemoration' for feast/observance days
// whose historical origin predates precise recordkeeping -- the UI
// should render that string as-is, verbatim, per the spec this screen
// was built from.
export type HistoryEntry = {
  month: number; // 1-12
  day: number; // 1-31
  year?: number; // omitted for entries with no single historical year (traditional feast days)
  title: string;
  summary: string;
  tags: string[];
  source: string;
  scripture?: string;
};

const HISTORY_ENTRIES: HistoryEntry[] = [
  {
    month: 1,
    day: 1,
    year: 1773,
    title: '"Amazing Grace" first sung',
    summary:
      'Former slave-ship captain John Newton, by then a pastor at Olney, England, wrote "Amazing Grace" for a New Year\'s Day service. His own history of the slave trade gave the hymn\'s language of a wretch once lost and blind unusual weight.',
    tags: ['church', 'mercy'],
    source: 'Hymn history (Olney Hymns, John Newton)',
  },
  {
    month: 1,
    day: 6,
    title: 'Feast of the Epiphany',
    summary:
      'Western churches mark the visit of the Magi to the infant Jesus on this day; Eastern churches most often observe it as the feast of Christ\'s baptism. Either way it closes the twelve days of Christmas.',
    tags: ['church'],
    source: 'Traditional commemoration',
    scripture: 'Matthew 2:1-12',
  },
  {
    month: 1,
    day: 8,
    year: 1956,
    title: 'Five missionaries killed in Ecuador',
    summary:
      'Jim Elliot, Nate Saint, Ed McCully, Roger Youderian, and Pete Fleming were killed by Waodani (then called "Auca") warriors on a sandbar of the Curaray River while attempting peaceful contact. Elliot\'s widow Elisabeth and Saint\'s sister Rachel later returned and lived among the same people.',
    tags: ['missions', 'martyrs'],
    source: 'Operation Auca, January 8, 1956',
  },
  {
    month: 1,
    day: 25,
    title: 'Conversion of Paul',
    summary:
      'Traditional commemoration of Saul of Tarsus\'s encounter on the road to Damascus, where the persecutor of the early church became one of its central missionary voices.',
    tags: ['church', 'missions'],
    source: 'Traditional commemoration',
    scripture: 'Acts 9:1-19',
  },
  {
    month: 2,
    day: 5,
    year: 1597,
    title: 'The 26 Martyrs of Japan',
    summary:
      'Twenty-six Christians, including the Jesuit novice Paul Miki, were crucified on Nishizaka Hill in Nagasaki under a ban on Christianity. Miki is said to have preached from his cross, forgiving those who ordered his death.',
    tags: ['martyrs', 'missions'],
    source: 'Traditional commemoration (Roman Martyrology; feast observed Feb. 6)',
  },
  {
    month: 2,
    day: 14,
    year: 869,
    title: 'Saints Cyril and Methodius',
    summary:
      'The brothers, called the "Apostles to the Slavs," devised the Cyrillic alphabet\'s ancestor to translate Scripture and the liturgy into the Slavic vernacular of ninth-century Moravia. Cyril died on this date; Western churches mark it as their shared feast.',
    tags: ['bible', 'missions', 'church'],
    source: 'Traditional commemoration (Western calendar; Eastern churches observe May 11)',
  },
  {
    month: 2,
    day: 18,
    year: 1546,
    title: 'Martin Luther dies',
    summary:
      'Luther died in Eisleben, the town of his birth, roughly three decades after the Ninety-Five Theses set off the Reformation across German-speaking Europe.',
    tags: ['reformation', 'church'],
    source: 'Historical record, 1546',
  },
  {
    month: 2,
    day: 23,
    year: 1807,
    title: 'Britain\'s Slave Trade Act passes',
    summary:
      'The House of Commons voted 283-16 to abolish the slave trade across the British Empire, the culmination of a campaign William Wilberforce and other evangelical Christians had pressed in Parliament for two decades.',
    tags: ['mercy', 'abolition'],
    source: 'House of Commons vote, February 23, 1807',
  },
  {
    month: 3,
    day: 17,
    title: 'Feast of St. Patrick',
    summary:
      'Traditional date marking the death of Patrick, a fifth-century Romano-British Christian who returned to Ireland -- the land where he had once been enslaved -- as a missionary bishop.',
    tags: ['missions', 'church'],
    source: 'Traditional commemoration',
  },
  {
    month: 3,
    day: 25,
    title: 'The Annunciation',
    summary:
      'Nine months before Christmas on the church calendar, this feast marks the angel Gabriel\'s announcement to Mary. It is one of the oldest dated Christian commemorations, observed since at least the fifth century.',
    tags: ['church'],
    source: 'Traditional commemoration',
    scripture: 'Luke 1:26-38',
  },
  {
    month: 4,
    day: 9,
    year: 1945,
    title: 'Dietrich Bonhoeffer executed',
    summary:
      'The German pastor and theologian, imprisoned for his part in resistance to the Nazi regime, was hanged at Flossenbürg concentration camp weeks before the war in Europe ended.',
    tags: ['martyrs', 'church'],
    source: 'Historical record, April 9, 1945',
  },
  {
    month: 4,
    day: 18,
    year: 1521,
    title: 'Luther at the Diet of Worms',
    summary:
      'Summoned before Emperor Charles V and the imperial assembly at Worms, Luther refused to recant his writings unless shown by Scripture or clear reason that he was wrong -- a defining moment of the Reformation.',
    tags: ['reformation', 'church'],
    source: 'Diet of Worms, April 1521',
  },
  {
    month: 4,
    day: 23,
    title: 'Feast of St. George',
    summary:
      'Traditional commemoration of a Christian soldier martyred under Emperor Diocletian in the early fourth century, centuries before the dragon legend attached to his name.',
    tags: ['martyrs', 'church'],
    source: 'Traditional commemoration',
  },
  {
    month: 4,
    day: 29,
    year: 1380,
    title: 'Catherine of Siena',
    summary:
      'A laywoman and Dominican tertiary who corresponded with popes and worked to end the Avignon papacy\'s split from Rome, remembered on her traditional feast day.',
    tags: ['church', 'mercy'],
    source: 'Traditional commemoration',
  },
  {
    month: 5,
    day: 12,
    year: 1820,
    title: 'Florence Nightingale born',
    summary:
      'Nightingale described her hospital and nursing reform work, beginning in the Crimean War, as a call from God. Her statistical case for sanitation reshaped modern hospital care.',
    tags: ['mercy'],
    source: 'Historical record, born May 12, 1820',
  },
  {
    month: 5,
    day: 21,
    year: 1738,
    title: 'Charles Wesley\'s conversion',
    summary:
      'Three days before his brother John, Charles Wesley described a settled assurance of faith while recovering from illness in London -- soon after he began writing the hymns (including "And Can It Be") that would carry the Methodist revival.',
    tags: ['awakening', 'church'],
    source: 'Charles Wesley\'s journal, May 1738',
  },
  {
    month: 5,
    day: 24,
    year: 1738,
    title: 'John Wesley at Aldersgate',
    summary:
      'At a meeting on Aldersgate Street in London, Wesley wrote that he felt his heart "strangely warmed" and trusted Christ for salvation alone -- a moment he marked as the turning point behind the Methodist movement.',
    tags: ['awakening', 'church'],
    source: 'John Wesley\'s journal, May 24, 1738',
  },
  {
    month: 5,
    day: 25,
    year: 735,
    title: 'The Venerable Bede dies',
    summary:
      'The English monk and historian, dictating to the end, completed a translation of the Gospel of John into Old English on the day he died.',
    tags: ['bible', 'church'],
    source: 'Traditional commemoration, 735',
  },
  {
    month: 5,
    day: 27,
    year: 1564,
    title: 'John Calvin dies',
    summary:
      'Calvin died in Geneva, where his preaching and writing -- especially the Institutes of the Christian Religion -- had shaped Reformed theology across Europe.',
    tags: ['reformation', 'church'],
    source: 'Historical record, 1564',
  },
  {
    month: 6,
    day: 5,
    year: 754,
    title: 'Boniface martyred in Frisia',
    summary:
      'The English missionary bishop, known for felling a sacred oak to demonstrate the powerlessness of the old gods, was killed with dozens of companions while evangelizing in what is now the Netherlands.',
    tags: ['missions', 'martyrs'],
    source: 'Traditional commemoration, June 5, 754',
  },
  {
    month: 6,
    day: 22,
    year: 431,
    title: 'The Council of Ephesus opens',
    summary:
      'Bishops gathered at Ephesus to address teaching from Nestorius about the nature of Christ, one of the early church\'s formative councils on how to speak accurately about who Jesus is.',
    tags: ['church'],
    source: 'Council of Ephesus, 431',
  },
  {
    month: 6,
    day: 24,
    title: 'Nativity of John the Baptist',
    summary:
      'Traditionally observed six months before Christmas, marking the birth of the prophet who prepared the way for Jesus.',
    tags: ['church'],
    source: 'Traditional commemoration',
    scripture: 'Luke 1:57-66',
  },
  {
    month: 6,
    day: 29,
    title: 'Feast of Peter and Paul',
    summary:
      'A shared traditional commemoration of the two apostles most associated with the early church\'s spread from Jerusalem to Rome.',
    tags: ['church', 'missions'],
    source: 'Traditional commemoration',
  },
  {
    month: 7,
    day: 1,
    year: 1523,
    title: 'The first Lutheran martyrs',
    summary:
      'Augustinian friars Jan van Essen and Hendrik Vos were burned at the stake in Brussels for refusing to recant Reformation teaching -- the first executions carried out specifically for Lutheran belief. Luther, on hearing of it, wrote a hymn in their memory.',
    tags: ['reformation', 'martyrs'],
    source: 'Historical record, July 1, 1523',
  },
  {
    month: 7,
    day: 6,
    year: 1415,
    title: 'Jan Hus burned at Constance',
    summary:
      'The Bohemian priest and reformer, who had preached against church corruption and translated Scripture for ordinary readers, was executed at the Council of Constance a century before Luther.',
    tags: ['reformation', 'martyrs'],
    source: 'Council of Constance, 1415',
  },
  {
    month: 7,
    day: 10,
    year: 1509,
    title: 'John Calvin born',
    summary:
      'Born in Noyon, France, Calvin would later flee to Geneva, where his theological writing shaped Reformed and Presbyterian churches worldwide.',
    tags: ['reformation'],
    source: 'Historical record, 1509',
  },
  {
    month: 7,
    day: 29,
    year: 1833,
    title: 'William Wilberforce dies',
    summary:
      'Wilberforce died three days after learning that the Slavery Abolition Act -- the bill he had championed on explicitly Christian conviction for decades -- was assured of passing Parliament.',
    tags: ['mercy', 'abolition'],
    source: 'Historical record, July 29, 1833',
  },
  {
    month: 8,
    day: 10,
    year: 258,
    title: 'Lawrence of Rome martyred',
    summary:
      'A deacon responsible for the church\'s care of the poor in Rome, killed under Emperor Valerian\'s persecution. Tradition holds he kept his composure to the end.',
    tags: ['martyrs', 'mercy'],
    source: 'Traditional commemoration',
  },
  {
    month: 8,
    day: 15,
    year: 1534,
    title: 'The Jesuits are founded',
    summary:
      'Ignatius of Loyola and six companions bound themselves to a common mission at Montmartre in Paris, forming what became the Society of Jesus -- soon a major force in Catholic missions from Japan to the Americas.',
    tags: ['missions', 'church'],
    source: 'Historical record, 1534',
  },
  {
    month: 8,
    day: 24,
    year: 1572,
    title: 'St. Bartholomew\'s Day Massacre',
    summary:
      'Mob and state violence against French Protestants (Huguenots) began in Paris and spread across France, killing thousands over the following weeks -- one of the deadliest episodes of Christian-on-Christian persecution in European history.',
    tags: ['persecution', 'church'],
    source: 'Historical record, August 1572',
  },
  {
    month: 8,
    day: 28,
    year: 430,
    title: 'Augustine of Hippo dies',
    summary:
      'The North African bishop\'s Confessions and City of God shaped Western Christian theology for a thousand years after his death.',
    tags: ['church'],
    source: 'Traditional commemoration, 430',
  },
  {
    month: 9,
    day: 8,
    title: 'Nativity of Mary',
    summary:
      'Observed in Catholic and Orthodox tradition as the birth of Jesus\'s mother, nine months after the Immaculate Conception is marked on the calendar.',
    tags: ['church'],
    source: 'Traditional commemoration',
  },
  {
    month: 9,
    day: 14,
    title: 'Exaltation of the Holy Cross',
    summary:
      'Traditionally tied to the fourth-century dedication of the Church of the Holy Sepulchre in Jerusalem, built on the site venerated as Christ\'s crucifixion and burial.',
    tags: ['church', 'israel'],
    source: 'Traditional commemoration',
  },
  {
    month: 9,
    day: 21,
    title: 'Feast of St. Matthew',
    summary:
      'Traditional commemoration of the tax collector called to follow Jesus, remembered in church tradition as the author of the first Gospel.',
    tags: ['church', 'bible'],
    source: 'Traditional commemoration',
    scripture: 'Matthew 9:9',
  },
  {
    month: 9,
    day: 30,
    year: 420,
    title: 'Jerome dies',
    summary:
      'Jerome spent decades in Bethlehem translating the Bible into Latin from Hebrew and Greek, producing the Vulgate that remained the standard Western text for over a thousand years.',
    tags: ['bible', 'church'],
    source: 'Traditional commemoration, 420',
  },
  {
    month: 10,
    day: 2,
    year: 1792,
    title: 'The Baptist Missionary Society is founded',
    summary:
      'Fourteen men, including William Carey, met in Kettering, England, to form the Particular Baptist Society for Propagating the Gospel Among the Heathen -- an organizing model later credited with launching the modern Protestant missions movement.',
    tags: ['missions'],
    source: 'Historical record, October 2, 1792',
  },
  {
    month: 10,
    day: 4,
    year: 1535,
    title: 'The Coverdale Bible is published',
    summary:
      'Miles Coverdale produced the first complete printed English Bible, drawing on William Tyndale\'s unfinished translation work -- Tyndale himself had been executed the previous year for the same effort.',
    tags: ['bible', 'translation'],
    source: 'Historical record, 1535',
  },
  {
    month: 10,
    day: 4,
    title: 'Feast of St. Francis of Assisi',
    summary:
      'Traditional commemoration of the thirteenth-century friar known for a life of deliberate poverty and care for the poor and for creation.',
    tags: ['mercy', 'church'],
    source: 'Traditional commemoration',
  },
  {
    month: 10,
    day: 6,
    year: 1536,
    title: 'William Tyndale executed',
    summary:
      'Tyndale was strangled and burned near Brussels for translating the Bible into English against the wishes of church authorities. Much of his wording survived into the King James Version nearly a century later.',
    tags: ['bible', 'translation', 'martyrs'],
    source: 'Historical record, October 6, 1536',
  },
  {
    month: 10,
    day: 15,
    year: 1582,
    title: 'Teresa of Ávila',
    summary:
      'The Spanish mystic and reformer of the Carmelite order died the night Spain switched from the Julian to the Gregorian calendar -- October 4 was followed directly by October 15, now kept as her feast.',
    tags: ['church'],
    source: 'Traditional commemoration',
  },
  {
    month: 10,
    day: 18,
    title: 'Feast of St. Luke',
    summary:
      'Traditional commemoration of the physician and companion of Paul credited with writing the Gospel of Luke and the Acts of the Apostles.',
    tags: ['church', 'bible'],
    source: 'Traditional commemoration',
  },
  {
    month: 10,
    day: 28,
    year: 312,
    title: 'The Battle of the Milvian Bridge',
    summary:
      'Constantine defeated his rival Maxentius outside Rome after reportedly seeing a vision he took as a sign to fight under a Christian symbol -- a turning point toward Christianity\'s legal toleration across the empire.',
    tags: ['church'],
    source: 'Historical record, October 28, 312',
  },
  {
    month: 10,
    day: 31,
    year: 1517,
    title: 'Luther\'s Ninety-Five Theses',
    summary:
      'Martin Luther is traditionally said to have posted his challenge to the sale of indulgences on the door of Wittenberg\'s castle church, the spark historians most often point to for the Protestant Reformation.',
    tags: ['reformation', 'church'],
    source: 'Traditional dating, 1517',
  },
  {
    month: 11,
    day: 1,
    title: 'All Saints\' Day',
    summary:
      'A traditional commemoration, dating to the early medieval church, honoring the whole company of Christian saints and martyrs rather than any one person.',
    tags: ['church', 'martyrs'],
    source: 'Traditional commemoration',
  },
  {
    month: 11,
    day: 10,
    year: 1483,
    title: 'Martin Luther born',
    summary:
      'Born in Eisleben, in what is now Germany, to a mining family -- decades before his name became attached to the Reformation.',
    tags: ['reformation'],
    source: 'Historical record, 1483',
  },
  {
    month: 11,
    day: 30,
    title: 'Feast of St. Andrew',
    summary:
      'Traditional commemoration of the fisherman called first among the twelve apostles, later associated with mission work as far as the Black Sea region.',
    tags: ['church', 'missions'],
    source: 'Traditional commemoration',
  },
  {
    month: 12,
    day: 4,
    year: 1563,
    title: 'The Council of Trent concludes',
    summary:
      'After eighteen years spanning several popes, the Catholic Church\'s response to the Reformation closed its final session, settling doctrine and launching reforms that shaped Catholic practice for centuries.',
    tags: ['church', 'reformation'],
    source: 'Historical record, December 4, 1563',
  },
  {
    month: 12,
    day: 6,
    title: 'Feast of St. Nicholas of Myra',
    summary:
      'The fourth-century bishop remembered for quietly providing for the poor -- the historical figure behind the Santa Claus legend, though the traditions have little in common.',
    tags: ['mercy', 'church'],
    source: 'Traditional commemoration',
  },
  {
    month: 12,
    day: 25,
    title: 'Christmas',
    summary:
      'Western churches have marked December 25 as the traditional date of Christ\'s birth since at least the fourth century in Rome. The Gospels themselves don\'t record a calendar date.',
    tags: ['church'],
    source: 'Traditional commemoration',
    scripture: 'Luke 2:1-20',
  },
  {
    month: 12,
    day: 26,
    title: 'Feast of St. Stephen',
    summary:
      'Traditional commemoration of the first Christian martyr, a deacon stoned to death for his testimony before the Sanhedrin.',
    tags: ['martyrs', 'church'],
    source: 'Traditional commemoration',
    scripture: 'Acts 7:54-60',
  },
];

// Walks backward day-by-day from `date` (inclusive) using a real Date
// object so month/year rollovers -- including leap years -- are handled
// by the platform's own calendar math rather than hand-rolled
// arithmetic. Stops at the first day with a seeded entry, capped at 2.
// Never invents a "this happened today" event: a day with nothing
// seeded silently falls back to the nearest earlier one, and the caller
// (NewsWatchScreen.tsx) is expected to compare the returned entry's
// month/day against the requested date to decide whether to show the
// "From the archive" label.
export function getOnThisDay(date: Date): HistoryEntry[] {
  const cursor = new Date(date.getTime());
  for (let i = 0; i < 366; i++) {
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();
    const matches = HISTORY_ENTRIES.filter((entry) => entry.month === month && entry.day === day);
    if (matches.length > 0) {
      return matches.slice(0, 2);
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  // Unreachable in practice -- every month has at least one seeded day
  // above, so the loop always finds a match well within 366 steps.
  return [];
}

export default HISTORY_ENTRIES;
