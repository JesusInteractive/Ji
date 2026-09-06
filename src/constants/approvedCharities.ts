// Single source of truth for the "Jesus Interactive Approved Charities"
// feature (Welcome card + ApprovedCharitiesScreen) -- mirrors the
// approved_charities.json the app owner supplied verbatim, just typed.
// Jesus Interactive does not process any of these gifts; every row links
// straight out to the organization's own official giving page.
export interface ApprovedCharity {
  id: string;
  name: string;
  fullName: string;
  // 2-4 letter monogram shown as a photocopy-style stamp -- never an
  // official logo (see ApprovedCharitiesScreen.tsx's own comment on why).
  mark: string;
  url: string;
  synopsis: string;
}

export interface ApprovedCharityCategory {
  id: string;
  label: string;
  charities: ApprovedCharity[];
}

export const APPROVED_CHARITIES_TITLE = 'Jesus Interactive Approved Charities';
export const APPROVED_CHARITIES_SUBTITLE = 'Gospel, children, rescue, life, and animals -- give on their sites.';
export const APPROVED_CHARITIES_DISCLAIMER =
  "Jesus Interactive does not process these gifts. Give directly on each organization's site.";

export const APPROVED_CHARITY_CATEGORIES: ApprovedCharityCategory[] = [
  {
    id: 'gospel',
    label: 'Gospel, church & relief',
    charities: [
      {
        id: 'icm',
        name: 'ICM',
        fullName: 'International Cooperating Ministries',
        mark: 'ICM',
        url: 'https://www.icm.org/',
        synopsis:
          'Partners with indigenous ministries to build churches and train disciples, with the aim of a healthy church within walking distance of everyone in the world.',
      },
      {
        id: 'samaritans-purse',
        name: "Samaritan's Purse",
        fullName: "Samaritan's Purse",
        mark: 'SP',
        url: 'https://www.samaritanspurse.org/donate/',
        synopsis:
          'A Christian relief organization that rushes food, shelter, medical care, and the Gospel to people hit by war, disaster, famine, and poverty.',
      },
      {
        id: 'godtv',
        name: 'GOD TV',
        fullName: 'GOD TV',
        mark: 'GTV',
        url: 'https://www.god.tv/donate/',
        synopsis:
          'A global Christian media ministry broadcasting teaching, worship, and the Gospel free across TV and digital platforms.',
      },
      {
        id: 'ywam',
        name: 'YWAM',
        fullName: 'Youth With A Mission',
        mark: 'YWAM',
        url: 'https://secure.ywam.org/',
        synopsis:
          'A global movement of Christians from many nations, training and sending missionaries to know God and make Him known through evangelism, discipleship, and mercy ministry.',
      },
      {
        id: 'yfc',
        name: 'Youth for Christ',
        fullName: 'Youth for Christ',
        mark: 'YFC',
        url: 'https://yfc.net/give/',
        synopsis:
          'Reaches young people everywhere, working together with the local church and caring adults to lead them into a lasting relationship with Jesus Christ.',
      },
      {
        id: 'iris-global',
        name: 'Iris Global',
        fullName: 'Iris Global',
        mark: 'IG',
        url: 'https://www.irisglobal.org/other-ways-to-give',
        synopsis:
          "Heidi and Rolland Baker's ministry planting churches and caring for orphans and the poor across Mozambique and other nations, rooted in radical love and dependence on God.",
      },
      {
        id: 'prison-fellowship',
        name: 'Prison Fellowship',
        fullName: 'Prison Fellowship',
        mark: 'PF',
        url: 'https://secure.prisonfellowship.org/donate/restore',
        synopsis:
          'Brings the Gospel and discipleship to prisoners, ex-prisoners, and their families, working toward a restorative approach to justice that helps people find new life in Christ.',
      },
      {
        id: 'one-for-israel',
        name: 'One for Israel',
        fullName: 'One for Israel',
        mark: 'OFI',
        url: 'https://www.oneforisrael.org/donate/',
        synopsis:
          'An Israeli ministry led by Messianic Jewish believers, training native missionaries and sharing the Gospel of Jesus the Messiah with Jewish and Arab people across Israel.',
      },
    ],
  },
  {
    id: 'life',
    label: 'Life, mothers & babies',
    charities: [
      {
        id: 'preborn',
        name: 'PreBorn!',
        fullName: 'PreBorn!',
        mark: 'PB',
        url: 'https://preborn.com/donate-en/',
        synopsis:
          'Equips pregnancy clinics with ultrasounds, grants, and evangelism training so women considering abortion can see their baby and hear the Gospel.',
      },
      {
        id: 'mamas-house',
        name: "Mama's House",
        fullName: "Mama's House Ministries",
        mark: 'MH',
        url: 'https://www.themamashouse.org/',
        synopsis:
          'A Christ-centered maternity home in Southern California offering safe housing, life skills, and support for women in crisis pregnancy.',
      },
    ],
  },
  {
    id: 'children',
    label: 'Children & youth',
    charities: [
      {
        id: 'crh',
        name: "Children's Receiving Home",
        fullName: "Children's Receiving Home of Sacramento",
        mark: 'CRH',
        url: 'https://crhkids.org/how-to-make-a-difference/',
        synopsis:
          'Provides housing, mental-health care, and immediate needs for children and teens in Sacramento affected by abuse, neglect, and trauma.',
      },
      {
        id: 'stjude',
        name: 'St. Jude',
        fullName: "St. Jude Children's Research Hospital",
        mark: 'SJ',
        url: 'https://www.stjude.org/donate/donate-to-st-jude.html',
        synopsis:
          'Treats children with cancer and other life-threatening diseases and leads research so families never receive a bill for treatment, travel, housing, or food.',
      },
      {
        id: 'fc2s',
        name: 'Foster Care to Success',
        fullName: 'Foster Care to Success',
        mark: 'FC',
        url: 'https://www.fc2success.org/',
        synopsis:
          'Helps college-bound foster youth with scholarships, mentors, emergency funds, and coaching so they can finish school and stand on their own.',
      },
    ],
  },
  {
    id: 'rescue',
    label: 'Homelessness & city rescue',
    charities: [
      {
        id: 'midnight-mission',
        name: 'The Midnight Mission',
        fullName: 'The Midnight Mission',
        mark: 'MM',
        url: 'https://www.midnightmission.org/',
        synopsis:
          'Serves people experiencing homelessness in Los Angeles with meals, shelter, recovery, job training, and a path back to stable life.',
      },
      {
        id: 'urm',
        name: 'Union Rescue Mission',
        fullName: 'Union Rescue Mission',
        mark: 'URM',
        url: 'https://urm.org/',
        synopsis:
          'One of the oldest rescue missions on Skid Row, offering emergency shelter, recovery programs, and long-term help for people overcoming homelessness.',
      },
      {
        id: 'dream-center',
        name: 'Dream Center',
        fullName: 'Dream Center Los Angeles',
        mark: 'DC',
        url: 'https://www.dreamcenter.org/',
        synopsis:
          'A faith-based Los Angeles ministry providing food, housing, recovery, education, and outreach so people can rebuild their lives.',
      },
    ],
  },
  {
    id: 'animals',
    label: 'Animals & conservation',
    charities: [
      {
        id: 'mmc',
        name: 'The Marine Mammal Center',
        fullName: 'The Marine Mammal Center',
        mark: 'MMC',
        url: 'https://www.marinemammalcenter.org/',
        synopsis:
          'Rescues and rehabilitates sick and injured marine mammals and advances ocean conservation through science and education.',
      },
      {
        id: 'best-friends',
        name: 'Best Friends Animal Society',
        fullName: 'Best Friends Animal Society',
        mark: 'BF',
        url: 'https://bestfriends.org/donate',
        synopsis:
          'Works toward no-kill animal rescue nationwide, including sanctuary care and specialized medical help for animals that others would give up on.',
      },
      {
        id: 'shambala',
        name: 'Shambala Preserve',
        fullName: 'The Shambala Preserve / The Roar Foundation',
        mark: 'SH',
        url: 'https://www.shambala.org/',
        synopsis:
          'A California sanctuary, supported by The Roar Foundation, that gives rescued captive big cats a safe, permanent home.',
      },
      {
        id: 'white-oak',
        name: 'White Oak Conservation',
        fullName: 'White Oak Conservation',
        mark: 'WO',
        url: 'https://www.whiteoakwildlife.org/',
        synopsis:
          'A Florida conservation center that breeds, studies, and helps recover rare and endangered species while training the next generation of wildlife caretakers.',
      },
    ],
  },
];
