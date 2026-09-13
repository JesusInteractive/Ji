// "The Passion Relics" -- traditional artifacts associated with Jesus'
// crucifixion and burial. These are NOT biblical sites with a real
// lat/lng (see bibleSites.ts) -- they're physical objects of disputed
// authenticity venerated in various churches, so each entry pairs the
// scripture the tradition points back to with an honest "science file"
// on what's actually been tested and found, badged so a claim of
// tradition is never presented as if it were the biblical text itself.
//
// Deliberately titled "The Shroud of Turin," not "The Shroud of Jesus"
// -- the object's name, not a claim this app is making about whose
// burial cloth it actually is.
import type { VerseRef } from '../services/bibleGamesContent';

export type RelicBadge = 'text' | 'tradition' | 'science' | 'disputed';

export interface RelicClaim {
  text: string;
  badge: RelicBadge;
  // Rare -- only for a claim about a real, physical thing distinct from
  // the relic itself (e.g. the thorn species tradition thinks the crown
  // was woven from) where a photo of that thing clarifies the claim.
  // Same verified-license bar as PassionRelic.photoUrl below.
  imageUrl?: string;
  imageCredit?: string;
}

export interface PassionRelic {
  id: string;
  name: string;
  subtitle: string;
  keyReferences: VerseRef[];
  tradition: string;
  scienceFile: RelicClaim[];
  photoUrl?: string;
  // Required whenever photoUrl is set -- every one of these photos is a
  // real, individually-verified Wikimedia Commons file (checked this pass
  // for a working direct URL and a real license), not a guessed link, so
  // the credit line it names is owed to a real photographer/license.
  photoCredit?: string;
}

export const PASSION_RELICS: PassionRelic[] = [
  {
    id: 'shroud_of_turin',
    name: 'The Shroud of Turin',
    subtitle: 'A linen cloth bearing a full-body image, traditionally venerated as a burial cloth',
    keyReferences: [{ bookId: 'JHN', chapter: 20, verse: 6 }],
    tradition: 'Housed in Turin, Italy, this 14-foot linen cloth bears a faint, photonegative-like image of a crucified man\'s front and back. Its documented history traces reliably to 14th-century France; claims of an earlier, undocumented history connecting it to first-century Jerusalem remain unproven.',
    scienceFile: [
      { text: 'In 1898, photographing the shroud during a public exhibition, Italian lawyer and amateur photographer Secondo Pia found that his glass-plate negative showed a clear, lifelike positive image -- meaning the image on the cloth itself behaves like a photographic negative, a property no one has found a medieval-era parallel for.', badge: 'science' },
      { text: 'The 1978 Shroud of Turin Research Project (STURP) -- around 30 US scientists given 120 continuous hours of direct access to the cloth -- ran x-ray fluorescence, infrared, and ultraviolet spectrometry and found no evidence of paint, dye, ink, or pigment forming the image; how the image itself was actually produced remains scientifically unexplained.', badge: 'science' },
      { text: "STURP's forensic pathologist also concluded the cloth's stains are real blood (type AB) that soaked into the fibers before the body image formed, not blood added on top of an existing image.", badge: 'science' },
      { text: 'Fed into a VP-8 Image Analyzer (a device built for reading x-rays, tested in 1976 at Sandia National Laboratories -- not, despite a widely repeated claim, a NASA instrument), the image was found to encode real three-dimensional depth data, with darkness corresponding to body distance -- a property a flat painting does not have.', badge: 'science' },
      { text: "Separately, image-processing scientists Donald Lynn and Jean Lorre of NASA's Jet Propulsion Laboratory volunteered digital-enhancement techniques -- developed for JPL's Mars Viking Lander images -- on shroud photographs as part of STURP, and reported no directionality or brush-stroke pattern of the kind an artist's hand would leave. This was JPL staff lending their own expertise to STURP, not an official NASA research program or finding.", badge: 'science' },
      { text: "That 3D relief data also showed anatomically coherent, undistorted contours -- face, torso, arms, and legs all reading as a real body's surface rather than a flattened or distorted one -- which several researchers have used to build physical 3D reconstructions of the figure. A flat painting or rubbing does not typically encode this kind of consistent depth information.", badge: 'science' },
      { text: 'Multiple sculptors have built life-size statues from that depth data, including Italian sculptor Luigi Enzo Mattei\'s bronze "Body of the Man of the Shroud," which has toured US Catholic events including the 2024 National Eucharistic Congress. No image is shown here -- every photo of these statues found while researching this section was press or stock photography with no open license to reuse, not a freely licensed one.', badge: 'science' },
      { text: "Forensic image analysis published in 2005 identified about 372 separate scourge-mark bloodstains on the body, roughly 196 of them a small twin-mark ('dumbbell') pattern matching a Roman flagrum with weighted tips -- read as a Roman-style scourging delivered by more than one person using more than one instrument.", badge: 'science' },
      { text: "Older forensic-pathology write-ups, going back to French surgeon Pierre Barbet and pathologist Robert Bucklin, round this to roughly 120 individual scourge strokes and estimate 600 to 700 wounds in total once the crown-of-thorns punctures, nail wounds, and lance wound are added in. These are interpretive counts made by studying the image, not a wound-by-wound count anyone can independently re-verify on the actual cloth, so the specific numbers are rough estimates rather than an agreed figure.", badge: 'disputed' },
      { text: "The image also shows dozens of small puncture wounds across the scalp and the back of the head -- some analyses count roughly 50 -- in a pattern forensic write-ups describe as consistent with a woven cap of thorns rather than a single point of injury, including marks on the back of the head read as mixed arterial and venous bleeding.", badge: 'science' },
      { text: "A minority hypothesis, associated mainly with Italian physicist Giulio Fanti, proposes the image formed from a burst of radiation or a corona-discharge-like electrical effect passing through the cloth. Other researchers who tested corona discharge directly on linen found it produced fiber effects not seen on the actual shroud, so this remains one untested proposal among several, not a demonstrated mechanism.", badge: 'disputed' },
      { text: 'A 1988 radiocarbon dating test (Oxford, Zurich, and Arizona labs) placed the cloth\'s material to roughly 1260-1390 AD -- medieval, not first-century.', badge: 'science' },
      { text: 'Some later researchers have proposed the tested sample was contaminated or came from a medieval "invisible reweaving" repair patch rather than the original weave; this objection has not been confirmed by a repeat, peer-reviewed test on verified original material.', badge: 'disputed' },
      { text: "Swiss criminologist Max Frei lifted pollen grains from the cloth with adhesive tape and identified species he associated with the Jerusalem area, the Dead Sea region, and Anatolia, proposing a historical travel route from the Middle East to Europe.", badge: 'disputed' },
      { text: "Frei held a doctorate in palynology but was not a professional pollen-identification specialist, and later researchers have questioned some of his species identifications; his samples have not been independently reconfirmed with modern methods. Building on that work, botanist Avinoam Danin (with palynologist Uri Baruch) proposed the crown of thorns itself was most likely woven from Gundelia tournefortii, a thorny tumbleweed, arguing that species' pollen and range co-occurs with a second plant (Zygophyllum dumosum) only in a strip roughly 10-20 km east and west of Jerusalem. This still rests on the same contested pollen identifications, and remains a minority position within shroud research, not a widely replicated finding.", badge: 'disputed' },
      { text: "A 2018 peer-reviewed bloodstain-pattern analysis (Journal of Forensic Sciences) used a living volunteer and a mannequin with real and synthetic blood and found no single body position that reproduced the shroud's actual blood-flow pattern.", badge: 'science' },
      { text: "Other shroud researchers have disputed that study's assumptions about wound geometry and body posture, so its conclusion that the blood pattern looks added rather than physically deposited is a contested result, not a settled one.", badge: 'disputed' },
      { text: "A 2022 study used a newly devised x-ray scattering (WAXS) method to compare the structural aging of the cloth's linen to a thread from the 55-74 AD siege of Masada and reported an age consistent with the first century.", badge: 'science' },
      { text: "That dating method was devised by the same research team specifically for this test and has not been independently validated by outside labs; its result also only holds if the cloth was kept at unusually stable temperature and humidity for most of its history. The lead researcher has himself called for other laboratories to attempt to confirm it.", badge: 'disputed' },
      { text: "A July 2024 paper by Giulio Fanti (the same University of Padua researcher behind the corona-discharge hypothesis above) reported creatinine and ferritin nanoparticles on shroud blood fibers as markers of severe physical trauma, and separately used a life-size sculpture to model the side wound, arguing the blood on the front and side flowed in three different directions -- read as evidence the body was repositioned at some point while wrapped in the cloth.", badge: 'disputed' },
      { text: 'The nanoparticle claim rests on an earlier version of the same finding that was retracted in 2018 after the journal\'s editors said there were not sufficient controls to support conclusions about human blood or physical trauma; the 2024 paper has not resolved those concerns, and it was published in a specialty case-report journal rather than a mainstream forensic-science venue.', badge: 'disputed' },
      { text: "A 2026 study in the journal Scientific Reports ran modern PCR-free metagenomic DNA sequencing on the shroud's official 1978 sample collection and found genetic material from multiple human population groups, environmental microbes, and cultivated plants and animals -- evidence of centuries of handling by many different people, not one unbroken chain of custody.", badge: 'science' },
      { text: "The study's own authors and outside geneticists have been explicit that this DNA evidence does not date the cloth or establish its authenticity either way -- it describes who and what touched it over time, not when or how the image itself was made.", badge: 'disputed' },
      { text: 'Whether the shroud is a genuine first-century burial cloth, a later devotional image made by an unknown process, or something else entirely is a live, unresolved question -- not a settled scientific verdict either way.', badge: 'disputed' },
    ],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Shroudofturin.jpg',
    photoCredit: 'Photo: Giuseppe Enrie, 1931 -- public domain, via Wikimedia Commons',
  },
  {
    id: 'crown_of_thorns',
    name: 'The Crown of Thorns',
    subtitle: 'A circlet of rushes venerated at Notre-Dame de Paris, identified with the mockery before the crucifixion',
    keyReferences: [{ bookId: 'MAT', chapter: 27, verse: 29 }],
    tradition: 'A ring of rushes (the thorns themselves are said to have been distributed to other churches over centuries) has been venerated in Paris since the 13th century, when King Louis IX acquired it from the Byzantine emperor. Its documented history before arriving in Constantinople in the early medieval period is not independently established.',
    scienceFile: [
      { text: 'No modern radiocarbon or material analysis of the relic\'s age has been published in peer-reviewed literature to date.', badge: 'science' },
      { text: 'Its earliest solid documentary trail begins in Byzantine Constantinople; the centuries between the first century and that point rely on tradition, not independent record.', badge: 'disputed' },
      {
        text: "The Paris relic itself is a bare circlet of rushes -- any actual thorns were removed and given out as separate relics centuries ago, so the ring on display today has none. Botanists researching the Shroud of Turin's pollen have proposed the original crown was more likely woven from a thorny plant native to the Jerusalem area, such as Gundelia tournefortii or Ziziphus spina-christi ('Christ's thorn'), pictured here as an example of that kind of branch.",
        badge: 'disputed',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Ziziphus_spina-christi_02.jpg',
        imageCredit: "Photo: Sabamohammad, 2017 -- CC BY-SA 4.0, via Wikimedia Commons. Shows Ziziphus spina-christi branches, an example of the thorny plant tradition associates with the crown -- not the Paris relic, which today has no thorns.",
      },
    ],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Couronne_d%27epines_-_Crown_of_Thorns_Notre_Dame_Paris.jpg',
    photoCredit: 'Photo: Gavigan -- CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    id: 'holy_lance',
    name: 'The Holy Lance',
    subtitle: 'A spearhead identified by tradition with the piercing of Jesus\' side',
    keyReferences: [{ bookId: 'JHN', chapter: 19, verse: 34 }],
    tradition: 'Multiple relics across Europe are each venerated by different traditions as "the" lance that pierced Jesus\' side -- most notably one held in the Vatican and another associated with the Imperial Regalia in Vienna. The existence of several competing claimants is itself the central complication.',
    scienceFile: [
      { text: 'The Vienna lance has been metallurgically dated to a period consistent with roughly the 7th-8th century AD, not the first century.', badge: 'science' },
      { text: 'Because more than one relic makes the same claim, at most one (and quite possibly none) can be the actual first-century object; this is a case where tradition itself is internally divided, not just contested by outside skepticism.', badge: 'disputed' },
    ],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Heilige_Lanze_Wien_Schatzkammer_1.jpg',
    photoCredit: 'Photo: Andreas Praefcke, 2009 -- public domain, via Wikimedia Commons',
  },
  {
    id: 'holy_nails',
    name: 'The Holy Nails',
    subtitle: 'Nails venerated at several churches as relics of the crucifixion',
    keyReferences: [{ bookId: 'JHN', chapter: 20, verse: 25 }],
    tradition: 'Nails venerated as crucifixion relics are held at multiple sites, including Santa Croce in Gerusalemme in Rome, Milan\'s Duomo, and an Ottonian-era reliquary in the treasury of Trier Cathedral in Germany. As with the Holy Lance, several churches independently claim to hold genuine nails from the same event.',
    scienceFile: [
      { text: 'Various nails have been examined for age and metallurgy with mixed, inconclusive results; no single nail has been established by consensus as definitively first-century Roman ironwork from this specific event.', badge: 'science' },
      { text: 'Multiple independent claimants to "the" nails, as with the Lance, means tradition itself does not point to one unambiguous artifact.', badge: 'disputed' },
    ],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/2018_Trier%2C_Domschatzkammer%2C_Reliquiar_des_hl_Nagels_1.jpg',
    photoCredit: 'Photo: Kleon3, 2018 -- CC BY-SA 4.0, via Wikimedia Commons. Shown: the Holy Nail reliquary at Trier Cathedral, one of several churches with this tradition.',
  },
  {
    id: 'burial_cloths',
    name: "John's Burial Cloths",
    subtitle: 'The linen wrappings and separate face cloth described in the resurrection account',
    keyReferences: [{ bookId: 'JHN', chapter: 20, verse: 7 }],
    tradition: "John's Gospel describes both linen wrappings and a separate cloth that had been around Jesus' head, folded up by itself. Some traditions associate the Sudarium of Oviedo -- a blood-stained cloth kept in Spain -- with this face cloth specifically, distinct from the full-body Shroud of Turin.",
    scienceFile: [
      {
        text: "Tradition traces the Sudarium's journey from Jerusalem to Alexandria around 614 AD (ahead of a Persian invasion), then across North Africa to Cartagena, Spain, and on to Seville and Toledo, before being carried into the mountains of Asturias around 718 AD to escape the Moorish conquest and eventually enshrined at Oviedo. This route comes down almost entirely through a single source: the 12th-century Bishop of Oviedo, Pelagius, writing five centuries after the events he describes -- an important source, but not an independent, contemporary record of that early journey.",
        badge: 'tradition',
      },
      {
        text: "The cloth's first solid documentary anchor is 1075 AD, when King Alfonso VI of Leon had the Arca Santa (the chest holding it and other relics) formally opened and inventoried at Oviedo Cathedral -- a real, dated event, unlike the centuries of travel that supposedly preceded it.",
        badge: 'science',
      },
      { text: 'The Sudarium of Oviedo has documented blood and fluid staining consistent with a severe head wound, and some forensic researchers have proposed correspondences between its stain pattern and the Shroud of Turin\'s facial image.', badge: 'science' },
      { text: "Whether the Sudarium and the Shroud actually relate to the same event, the same person, or each other at all remains a minority research position, not an established consensus.", badge: 'disputed' },
      { text: "Max Frei -- the same researcher whose Shroud pollen identifications are flagged elsewhere in this app as not independently reconfirmed -- also reported pollen on the Sudarium matching Oviedo, Toledo, North Africa, and Jerusalem, and this is sometimes cited as confirming the traditional travel route above. Given the doubts about Frei's methodology generally, treat this as supporting evidence for the tradition, not as independent proof of it.", badge: 'disputed' },
    ],
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Sudarium_of_Oviedo.jpg',
    photoCredit: 'Photo: Johnny Hillerman, 2012 -- CC BY-SA 3.0, via Wikimedia Commons',
  },
];
