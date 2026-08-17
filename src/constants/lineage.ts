// The genealogy of Jesus per Matthew 1:1-17, structured as three sets of
// fourteen generations, as Matthew himself frames it (v. 17). Quoted names
// follow the KJV (public domain).

export interface LineageSection {
  title: string;
  note?: string;
  names: string[];
}

export const MATTHEW_LINEAGE: LineageSection[] = [
  {
    title: 'Abraham to David',
    names: [
      'Abraham', 'Isaac', 'Jacob', 'Judah', 'Perez', 'Hezron', 'Ram',
      'Amminadab', 'Nahshon', 'Salmon', 'Boaz', 'Obed', 'Jesse', 'David the king',
    ],
  },
  {
    title: 'David to the Babylonian exile',
    note: 'Matthew\'s list telescopes some generations between Joram and Uzziah, a common practice in ancient genealogies to preserve a symmetrical structure.',
    names: [
      'Solomon', 'Rehoboam', 'Abijah', 'Asa', 'Jehoshaphat', 'Joram', 'Uzziah',
      'Jotham', 'Ahaz', 'Hezekiah', 'Manasseh', 'Amon', 'Josiah', 'Jeconiah and his brothers',
    ],
  },
  {
    title: 'The exile to Christ',
    names: [
      'Shealtiel', 'Zerubbabel', 'Abiud', 'Eliakim', 'Azor', 'Zadok', 'Achim',
      'Eliud', 'Eleazar', 'Matthan', 'Jacob', 'Joseph, husband of Mary', 'Jesus, who is called Christ',
    ],
  },
];

export const LINEAGE_NOTE =
  'Matthew traces Jesus\' legal lineage through Joseph, establishing His ' +
  'right to David\'s throne, and deliberately names four women (Tamar, ' +
  'Rahab, Ruth, and "Uriah\'s wife" / Bathsheba) -- each with an ' +
  'unconventional story -- highlighting God\'s grace reaching beyond ' +
  'expected boundaries from the very start of the Gospel.';

// Luke 3:23-38 records a second genealogy, running the opposite direction
// (Jesus back to Adam) and diverging from Matthew's list between David and
// Joseph -- Matthew runs through Solomon, Luke through Nathan, another of
// David's sons. The traditional harmonization (held since the early
// church, e.g. by Julius Africanus and later Reformers) is that Matthew
// gives Joseph's legal/royal line -- the line of succession to David's
// throne, which is why it matters that Joseph legally adopts Jesus as his
// son -- while Luke gives either Joseph's line through a different branch
// or, on the reading many hold today, Mary's own descent from David
// through Nathan, making Jesus a blood descendant of David as well as the
// legal heir. Both lists agree on the essential claim this app cares
// about: Jesus descends from David on both the legal and (on the Marian
// reading) biological line, satisfying the royal lineage the prophecies
// require, from two independent Gospel sources.
export const LUKE_LINEAGE_NOTE =
  'Luke 3:23-38 gives a second, independent genealogy -- read by many as ' +
  'Mary\'s own line back to David (through his son Nathan, not Solomon) ' +
  'and further back to Adam. Whether read as Mary\'s or an alternate ' +
  'Josephite line, it reinforces the same claim from a second source: ' +
  'Jesus descends from David.';
