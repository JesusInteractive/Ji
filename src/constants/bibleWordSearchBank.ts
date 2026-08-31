// Word bank for the Bible Word Search game (see services/wordSearchPuzzle.ts
// for how puzzles are generated from it, and screens/BibleWordSearchScreen.tsx
// for the game itself). Over 200 biblical names, places, and terms -- long
// enough that a 3-year daily rotation (~1095 puzzles, 30 words each) draws
// a different 30-word subset each day without exhausting the list, since
// the puzzle generator reshuffles this whole bank per puzzle rather than
// working through it in a fixed order.
//
// English only for now (per spec) -- kept as plain uppercase strings, no
// punctuation or spaces, since the grid places one letter per cell.
export const BIBLE_WORD_SEARCH_BANK: string[] = [
  // People -- Old Testament
  'ADAM', 'EVE', 'NOAH', 'ABRAHAM', 'SARAH', 'ISAAC', 'REBEKAH', 'JACOB', 'RACHEL', 'LEAH',
  'JOSEPH', 'MOSES', 'AARON', 'MIRIAM', 'JOSHUA', 'CALEB', 'RUTH', 'NAOMI', 'BOAZ', 'SAMUEL',
  'SAUL', 'DAVID', 'GOLIATH', 'JONATHAN', 'SOLOMON', 'ELIJAH', 'ELISHA', 'ISAIAH', 'JEREMIAH', 'EZEKIEL',
  'DANIEL', 'ESTHER', 'MORDECAI', 'JOB', 'JONAH', 'GIDEON', 'SAMSON', 'DELILAH', 'DEBORAH', 'HANNAH',
  'NEHEMIAH', 'EZRA', 'ABIGAIL', 'BATHSHEBA', 'ABSALOM', 'NATHAN', 'AMOS', 'HOSEA', 'MICAH', 'MALACHI',
  // People -- New Testament
  'JESUS', 'MARY', 'JOSEPH', 'JOHN', 'PETER', 'ANDREW', 'JAMES', 'PHILIP', 'THOMAS', 'MATTHEW',
  'BARTHOLOMEW', 'THADDAEUS', 'SIMON', 'JUDAS', 'PAUL', 'BARNABAS', 'TIMOTHY', 'TITUS', 'LUKE', 'MARK',
  'LAZARUS', 'MARTHA', 'ZACCHAEUS', 'NICODEMUS', 'STEPHEN', 'PHILEMON', 'SILAS', 'PRISCILLA', 'AQUILA', 'LYDIA',
  'HEROD', 'PILATE', 'CAIAPHAS', 'ELIZABETH', 'ZECHARIAH', 'GABRIEL', 'MICHAEL', 'SATAN',
  // Places
  'EDEN', 'BETHLEHEM', 'JERUSALEM', 'NAZARETH', 'GALILEE', 'JUDEA', 'SAMARIA', 'JORDAN', 'EGYPT', 'CANAAN',
  'SINAI', 'BABYLON', 'NINEVEH', 'DAMASCUS', 'JERICHO', 'BETHANY', 'CAPERNAUM', 'CORINTH', 'EPHESUS', 'ANTIOCH',
  'ARARAT', 'GOLGOTHA', 'GETHSEMANE', 'PATMOS', 'PHILIPPI', 'ROME', 'TARSUS', 'HEBRON', 'SHILOH', 'GAZA',
  // Theological / spiritual terms
  'COVENANT', 'REDEMPTION', 'SALVATION', 'GRACE', 'MERCY', 'FAITH', 'HOPE', 'LOVE', 'PEACE', 'JOY',
  'PRAYER', 'WORSHIP', 'BAPTISM', 'REPENTANCE', 'FORGIVENESS', 'RIGHTEOUSNESS', 'HOLINESS', 'SACRIFICE', 'ATONEMENT', 'RESURRECTION',
  'DISCIPLE', 'APOSTLE', 'PROPHET', 'MESSIAH', 'SAVIOR', 'SHEPHERD', 'KINGDOM', 'GOSPEL', 'SCRIPTURE', 'PSALM',
  'PROVERB', 'PARABLE', 'MIRACLE', 'BLESSING', 'PROMISE', 'GLORY', 'TRINITY', 'SPIRIT', 'ANGEL', 'HEAVEN',
  'ALTAR', 'TEMPLE', 'TABERNACLE', 'ARK', 'MANNA', 'SABBATH', 'PASSOVER', 'PENTECOST', 'JUBILEE', 'TITHE',
  'PSALMS', 'GENESIS', 'EXODUS', 'LEVITICUS', 'NUMBERS', 'REVELATION', 'CROSS', 'CROWN', 'LAMB', 'VINE',
  'LIGHT', 'TRUTH', 'WISDOM', 'HUMILITY', 'PATIENCE', 'KINDNESS', 'GENTLENESS', 'OBEDIENCE', 'SERVANT', 'PILGRIM',
  'DISCIPLESHIP', 'FELLOWSHIP', 'CONGREGATION', 'SANCTUARY', 'PARADISE', 'ETERNITY', 'RESTORATION', 'DELIVERANCE', 'PROVISION', 'PROTECTION',
  'MANGER', 'SHEPHERDS', 'MAGI', 'CARPENTER', 'FISHERMEN', 'CENTURION', 'PHARISEE', 'SADDUCEE', 'SCRIBE', 'RABBI',
  'SYNAGOGUE', 'WILDERNESS', 'VINEYARD', 'HARVEST', 'MUSTARD', 'LEAVEN', 'PEARL', 'TREASURE', 'PRODIGAL', 'SAMARITAN',
];
