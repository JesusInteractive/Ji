// Bible Mazes -- game #10 on the Jesus Interactive Games Hub. NOT a
// procedurally-generated maze engine ("a 1000-maze dump" was explicitly
// the thing to avoid) -- each maze is a short, hand-authored story path
// through a real Bible narrative, and every "gate" between rooms is a
// quiz-style checkpoint, the same tap-a-multiple-choice-answer
// interaction Trivia/Guess-the-Character/Fill-in-the-Blank already use,
// not a separate spatial-maze interaction.
//
// Starter set: 6 mazes. Expand over time the same way bibleCharacters.ts
// and bibleTimeline.ts do -- a one-time editorial task, not something
// later work blocks on.
export interface MazeRoom {
  id: string;
  prompt: string; // scene-setting flavor text for this room
  question: string;
  options: string[];
  correctIndex: number;
  reference?: string; // shown once the room is solved
}

export interface BibleMaze {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  rooms: MazeRoom[];
}

export const BIBLE_MAZES: BibleMaze[] = [
  {
    id: 'exodus_path',
    title: 'The Exodus Path',
    subtitle: 'From slavery in Egypt to the foot of Sinai',
    color: '#FF6B6B',
    rooms: [
      {
        id: 'burning_bush',
        prompt: 'A bush burns on Horeb, yet is not consumed. A voice calls your name.',
        question: 'Who does God call from the burning bush?',
        options: ['Moses', 'Aaron', 'Joshua', 'Abraham'],
        correctIndex: 0,
        reference: 'Exodus 3:4',
      },
      {
        id: 'plagues',
        prompt: 'Pharaoh\'s heart is hard. Egypt suffers plague after plague.',
        question: 'Which of these was one of the ten plagues on Egypt?',
        options: ['Locusts', 'Earthquakes', 'Famine', 'Drought'],
        correctIndex: 0,
        reference: 'Exodus 10:12-15',
      },
      {
        id: 'passover',
        prompt: 'Blood marks the doorframes of Israel\'s homes tonight.',
        question: 'What protects Israel\'s firstborn on the night of the tenth plague?',
        options: ['Blood of a lamb on the doorposts', 'A pillar of fire', 'Moses\' staff', 'A trumpet blast'],
        correctIndex: 0,
        reference: 'Exodus 12:13',
      },
      {
        id: 'red_sea',
        prompt: 'Pharaoh\'s army is closing in. The sea stands ahead of you.',
        question: 'What happens when Moses stretches his hand over the sea?',
        options: ['The waters part', 'A bridge of stone appears', 'The sea freezes', 'Boats appear'],
        correctIndex: 0,
        reference: 'Exodus 14:21',
      },
      {
        id: 'sinai',
        prompt: 'Smoke and thunder cover the mountain. God is about to speak.',
        question: 'What does Moses receive on Mount Sinai?',
        options: ['The Ten Commandments', 'The Ark of the Covenant', 'A crown', 'The Book of Psalms'],
        correctIndex: 0,
        reference: 'Exodus 20:1-17',
      },
    ],
  },
  {
    id: 'pauls_journeys',
    title: "Paul's Missionary Journeys",
    subtitle: 'Cities as rooms, letters as keys',
    color: '#5B8DEF',
    rooms: [
      {
        id: 'damascus_road',
        prompt: 'A blinding light on the road. A voice asks why you persecute Him.',
        question: 'Who confronts Saul on the road to Damascus?',
        options: ['Jesus', 'Peter', 'An angel', 'Stephen'],
        correctIndex: 0,
        reference: 'Acts 9:3-5',
      },
      {
        id: 'antioch',
        prompt: 'In this city, believers are first called by a new name.',
        question: 'What are the followers of Jesus first called in Antioch?',
        options: ['Christians', 'Nazarenes', 'Disciples', 'Saints'],
        correctIndex: 0,
        reference: 'Acts 11:26',
      },
      {
        id: 'philippi',
        prompt: 'An earthquake shakes the prison at midnight, and every door flies open.',
        question: 'Who is converted after the earthquake in the Philippian jail?',
        options: ['The jailer and his household', 'The city governor', 'A merchant named Lydia', 'A Roman centurion'],
        correctIndex: 0,
        reference: 'Acts 16:31-33',
      },
      {
        id: 'athens',
        prompt: 'You stand before the philosophers of the Areopagus.',
        question: 'What altar inscription does Paul use to introduce the Gospel in Athens?',
        options: ['"To an unknown god"', '"To Zeus Almighty"', '"To the sea god"', '"To the emperor"'],
        correctIndex: 0,
        reference: 'Acts 17:23',
      },
      {
        id: 'ephesus',
        prompt: 'A letter is being written, even now, from a Roman prison cell.',
        question: 'Which letter does Paul write to the church in Ephesus?',
        options: ['Ephesians', 'Galatians', 'Romans', 'Hebrews'],
        correctIndex: 0,
        reference: 'Ephesians 1:1',
      },
    ],
  },
  {
    id: 'gospel_harmony',
    title: 'Gospel Harmony',
    subtitle: 'Walk the life of Jesus in order',
    color: '#4ECDC4',
    rooms: [
      {
        id: 'bethlehem',
        prompt: 'A star rests over a small town. Shepherds come running.',
        question: 'Where is Jesus born?',
        options: ['Bethlehem', 'Nazareth', 'Jerusalem', 'Capernaum'],
        correctIndex: 0,
        reference: 'Luke 2:4-7',
      },
      {
        id: 'jordan_baptism',
        prompt: 'A voice from heaven speaks as He rises from the water.',
        question: 'Who baptizes Jesus in the Jordan?',
        options: ['John the Baptist', 'Peter', 'Andrew', 'Nicodemus'],
        correctIndex: 0,
        reference: 'Matthew 3:13-17',
      },
      {
        id: 'wilderness',
        prompt: 'Forty days alone, hungry, and tempted.',
        question: 'Who tempts Jesus in the wilderness?',
        options: ['The devil', 'A Pharisee', 'A Roman soldier', 'Herod'],
        correctIndex: 0,
        reference: 'Matthew 4:1',
      },
      {
        id: 'sermon_on_mount',
        prompt: 'A crowd gathers on a hillside to hear Him teach.',
        question: 'Which teaching opens the Sermon on the Mount?',
        options: ['The Beatitudes', 'The Lord\'s Prayer', 'The Great Commission', 'The Parable of the Sower'],
        correctIndex: 0,
        reference: 'Matthew 5:3-12',
      },
      {
        id: 'upper_room',
        prompt: 'Bread is broken and a cup is shared for the last time before the cross.',
        question: 'What meal does Jesus share with His disciples in the upper room?',
        options: ['The Last Supper', 'The Passover of Egypt', 'The wedding feast', 'The feeding of the 5,000'],
        correctIndex: 0,
        reference: 'Luke 22:14-20',
      },
      {
        id: 'empty_tomb',
        prompt: 'The stone has been rolled away. The tomb stands open and empty.',
        question: 'Who first finds the empty tomb?',
        options: ['The women, including Mary Magdalene', 'Peter alone', 'The Roman guards', 'The high priest'],
        correctIndex: 0,
        reference: 'Luke 24:1-6',
      },
    ],
  },
  {
    id: 'tabernacle',
    title: 'The Tabernacle',
    subtitle: "Walk inward, room by room, to God's presence",
    color: '#FFB454',
    rooms: [
      {
        id: 'outer_court',
        prompt: 'You enter the courtyard through its single gate.',
        question: 'What stands in the outer court, where sacrifices are offered?',
        options: ['The bronze altar', 'The Ark of the Covenant', 'The golden lampstand', 'The table of showbread'],
        correctIndex: 0,
        reference: 'Exodus 27:1-8',
      },
      {
        id: 'bronze_basin',
        prompt: 'Before going further, the priests must be made clean.',
        question: 'What do the priests wash in before entering the Tabernacle itself?',
        options: ['The bronze basin', 'The Jordan River', 'A stone well', 'A rain barrel'],
        correctIndex: 0,
        reference: 'Exodus 30:18-21',
      },
      {
        id: 'holy_place',
        prompt: 'Inside the tent, golden light flickers off the walls.',
        question: 'Which of these is found in the Holy Place?',
        options: ['The golden lampstand', 'The Ark of the Covenant', 'The mercy seat', 'The stone tablets'],
        correctIndex: 0,
        reference: 'Exodus 25:31-40',
      },
      {
        id: 'veil',
        prompt: 'A heavy veil separates you from the innermost room.',
        question: 'What separates the Holy Place from the Most Holy Place?',
        options: ['A veil', 'A bronze gate', 'A river', 'A wall of fire'],
        correctIndex: 0,
        reference: 'Exodus 26:33',
      },
      {
        id: 'most_holy',
        prompt: 'Only the high priest may enter here, and only once a year.',
        question: 'What rests inside the Most Holy Place?',
        options: ['The Ark of the Covenant', 'The bronze altar', 'The table of showbread', 'The golden lampstand'],
        correctIndex: 0,
        reference: 'Exodus 26:33-34',
      },
    ],
  },
  {
    id: 'prophets_rooms',
    title: "The Prophets' Rooms",
    subtitle: 'Voices calling Israel back to God',
    color: '#A66DD4',
    rooms: [
      {
        id: 'isaiah_room',
        prompt: 'A vision of the Lord, high and lifted up, fills the Temple.',
        question: 'What do the seraphim cry out in Isaiah\'s vision?',
        options: ['"Holy, holy, holy"', '"Peace, peace"', '"Woe to Babylon"', '"The Lord is one"'],
        correctIndex: 0,
        reference: 'Isaiah 6:3',
      },
      {
        id: 'jeremiah_room',
        prompt: 'A young man protests that he is only a child.',
        question: 'What does God tell Jeremiah before he was even born?',
        options: ['"I knew you and appointed you a prophet"', '"You will be king"', '"You will build the Temple"', '"You will lead the exodus"'],
        correctIndex: 0,
        reference: 'Jeremiah 1:5',
      },
      {
        id: 'ezekiel_room',
        prompt: 'A valley stretches out before you, full of dry bones.',
        question: 'What happens to the dry bones in Ezekiel\'s vision?',
        options: ['They come to life', 'They turn to dust', 'They are buried', 'They turn to gold'],
        correctIndex: 0,
        reference: 'Ezekiel 37:10',
      },
      {
        id: 'daniel_room',
        prompt: 'Lions pace in the den below, but you are unharmed.',
        question: 'Why is Daniel thrown into the lions\' den?',
        options: ['For praying to God despite the king\'s decree', 'For refusing the king\'s food', 'For interpreting a dream wrongly', 'For stealing from the treasury'],
        correctIndex: 0,
        reference: 'Daniel 6:10-16',
      },
      {
        id: 'jonah_room',
        prompt: 'The belly of a great fish is dark, and the prayer is desperate.',
        question: 'Where was Jonah running to when the storm struck?',
        options: ['Tarshish', 'Nineveh', 'Babylon', 'Egypt'],
        correctIndex: 0,
        reference: 'Jonah 1:3',
      },
    ],
  },
  {
    id: 'narrow_gate',
    title: 'The Narrow Gate',
    subtitle: 'A short daily maze -- one quick path',
    color: '#6FCF97',
    rooms: [
      {
        id: 'narrow_gate_1',
        prompt: 'Two gates stand before you -- one wide, one narrow.',
        question: 'What does Jesus say about the narrow gate?',
        options: ['Few find it, but it leads to life', 'It is locked to everyone', 'Only priests may enter', 'It leads back to Egypt'],
        correctIndex: 0,
        reference: 'Matthew 7:13-14',
      },
      {
        id: 'narrow_gate_2',
        prompt: 'A shepherd counts his flock and finds one missing.',
        question: 'What does the shepherd do when he finds the one lost sheep?',
        options: ['Rejoices and carries it home', 'Leaves it to find its own way', 'Punishes the flock', 'Waits for it at the gate'],
        correctIndex: 0,
        reference: 'Luke 15:4-6',
      },
      {
        id: 'narrow_gate_3',
        prompt: 'A voice says, "I am the door."',
        question: 'Who does Jesus say He is, in John 10?',
        options: ['The good shepherd and the door of the sheep', 'The narrow road only', 'A hired hand', 'A wandering prophet'],
        correctIndex: 0,
        reference: 'John 10:9-11',
      },
    ],
  },
];
