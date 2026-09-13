// Curated journeys for the Global Map -- the actual spine of the
// feature per the user's own framing: this is an interactive journey
// map following real people's life journeys across the earth (Jesus,
// the apostles, the prophets), not a static pin catalog. Each journey
// is an ordered walk through src/data/bibleSites.ts's `id`s; the map
// engine (currently FlatAtlasMapEngine.tsx, later a 3D globe) animates
// between them in order.
//
// Starter set: 5 journeys, spanning a major prophet's people (the
// Exodus), a minor prophet's own personal journey (Jonah), Jesus'
// earthly life, an apostle's missionary travels (Paul), and a whole
// people's exile-and-return. Expand over time, same convention as
// bibleCharacters.ts/bibleTimeline.ts.
import type { EraId } from './bibleSites';

export interface BiblicalJourney {
  id: string;
  title: string;
  personLabel: string; // who this journey follows, shown under the title
  era: EraId;
  siteIds: string[]; // in chronological order
  summary: string;
}

export const BIBLE_JOURNEYS: BiblicalJourney[] = [
  {
    id: 'life_of_jesus',
    title: 'The Life of Jesus',
    personLabel: 'Jesus of Nazareth',
    era: 'Gospels',
    siteIds: ['bethlehem', 'nazareth', 'qasr_al_yahud', 'capernaum', 'sea_of_galilee', 'jerusalem'],
    summary: "From His birth in Bethlehem, through His baptism and Galilean ministry, to His death and resurrection in Jerusalem.",
  },
  {
    id: 'pauls_missionary_journeys',
    title: "Paul's Missionary Journeys",
    personLabel: 'The Apostle Paul',
    era: 'Acts',
    siteIds: ['damascus', 'antioch_syria', 'philippi', 'athens', 'corinth', 'ephesus', 'rome'],
    summary: 'From his conversion on the road to Damascus, across the eastern Mediterranean planting churches, to his imprisonment in Rome.',
  },
  {
    id: 'exodus_path',
    title: "Israel's Exodus",
    personLabel: 'Moses and the people of Israel',
    era: 'Exodus',
    siteIds: ['goshen', 'sinai', 'jericho'],
    summary: 'From slavery in Egypt, to receiving the Law at Sinai, to entering the Promised Land at Jericho.',
  },
  {
    id: 'jonahs_journey',
    title: "Jonah's Flight and Mission",
    personLabel: 'The prophet Jonah',
    era: 'Prophets',
    siteIds: ['gath_hepher', 'joppa', 'nineveh'],
    summary: "From his home in Galilee, fleeing by ship in the opposite direction, to finally preaching repentance in Nineveh.",
  },
  {
    id: 'exile_and_return',
    title: 'Exile and Return',
    personLabel: 'Daniel, Ezekiel, Esther, Nehemiah, and the exiled people of Judah',
    era: 'Prophets',
    siteIds: ['jerusalem', 'babylon', 'kebar_river', 'susa', 'jerusalem'],
    summary: "From Jerusalem's fall and seventy years of exile in Babylon and Persia, to the decree of Cyrus and the long road home.",
  },
  {
    id: 'hope_of_the_house',
    title: 'Hope of the House',
    personLabel: 'Prophets, John, and the last conflict',
    era: 'EndTimes',
    siteIds: ['temple_mount_hope', 'megiddo', 'jezreel_valley', 'olivet_summit', 'dominus_flevit', 'gethsemane', 'bethany_bethphage', 'caught_up'],
    summary: 'From the ridge that held two temples, to the valley where kings already died, to the mount of both ascent and hoped-for return -- ending not at a battlefield, but at "caught up... in the air."',
  },
];
