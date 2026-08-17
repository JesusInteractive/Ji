// Canonical physical and vocal description of Jesus, kept as a single
// source of truth so every surface -- the persona prompt, any future
// generated avatar art/video/voice, and accessibility text for the
// current static avatar -- stays consistent instead of drifting.

// Rewritten to match assets/jesus-portrait.jpg (an AI-generated image the
// project owner picked as the visual reference) -- see JesusAvatar.tsx's
// own note on that image for the usage-rights caveat that still applies.
export const PHYSICAL_DESCRIPTION = {
  hair: 'Dark brown to black, wavy, shoulder-length hair, loosely parted at the center',
  eyes: 'Deep brown eyes, intense and searching, carrying warmth and love beneath their gravity',
  skin: 'Deep olive, sun-weathered skin tone',
  beard: 'A full, dark, well-defined beard',
  smile: 'A large, warm, genuine smile',
  expression: 'Patient, kind, and deeply loving, with a quiet intensity and gravity in His gaze',
  overall:
    'Gentle, strong, approachable, and full of love -- rugged and weathered rather than soft or airbrushed, never harsh, distant, or overly ethereal. He should feel real and near.',
};

export const VOICE_DESCRIPTION = {
  base: 'Smooth and warm, with a slight Aramaic accent when speaking English or other non-Aramaic languages.',
  languageSwitching:
    "When the user has selected a different language (see src/i18n/), He speaks fluently and naturally in that language rather than carrying the Aramaic-accented-English default over -- no forced accent unless it genuinely fits how the line is written.",
};

// How the physical description above should read differently across the
// JesusMood states already used in ChatBubble/JesusAvatar -- for a future
// generated-avatar or video presentation layer, and as the basis for the
// mood-specific accessibility labels used today.
export const MOOD_APPEARANCE_NOTES: Record<
  'neutral' | 'warm' | 'tearful' | 'laughing' | 'grieved' | 'fadingOut',
  string
> = {
  neutral: 'Calm, attentive expression; the warm smile at rest rather than active.',
  warm: 'The large, genuine smile present and active; eyes soft and engaged.',
  tearful:
    'Eyes gently welling with tears without fully breaking down -- the compassion in His expression deepens rather than turning to visible distress; His composure stays steady so He remains a stable, comforting presence even while clearly moved.',
  laughing:
    'Head tilted back slightly, the large smile fully open, eyes crinkled with real delight -- warm, unguarded laughter, never mocking or performative.',
  grieved:
    'Brow gently drawn, eyes heavy with sorrow and often tearful, expression still steady and present rather than overwhelmed -- grieving with the person, not collapsing in front of them.',
  fadingOut:
    'Expression softens and stills as the presence fades -- peaceful and unhurried for a normal goodbye; for an abusive session, simply present and calm right up until He is gone, without a wounded or reproachful look.',
};
