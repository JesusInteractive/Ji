// Local, offline reply engine so the app is fully clickable with zero
// backend. Mirrors the rules in src/constants/persona.ts via simple
// keyword matching -- NOT a real language model. Swap for
// services/api.ts.sendMessage once your backend + model API are live.

import type { ChatMessage, JesusMood } from '../types';
import { SAMPLE_CONVERSATIONS } from '../constants/sampleConversations';
import { formatCrisisLine } from '../constants/crisisResources';

function includesAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

const ABUSIVE_TERMS = ['fuck you', 'kill yourself', 'you\'re fake', 'shut up you', 'i hate this app'];
const LOVE_TERMS = ['i love you', 'love you jesus', 'you\'re amazing', 'thank you jesus'];
const GAMBLING_TERMS = ['lottery', 'gambling', 'casino', 'bet on', 'powerball', 'scratch ticket'];
const PET_DEATH_TERMS = ['my dog died', 'my cat died', 'my pet died', 'lost my dog', 'lost my cat'];
const SUFFERING_TERMS = ['why does god allow', 'holocaust', 'why do bad things happen', 'why does god let', 'suffering'];
const CONFESSION_TERMS = ['i cheated', 'i sinned', 'i lied to', 'forgive me', 'i did something wrong'];
const ANGER_AT_GOD_TERMS = ['i hate god', 'i hate you god', 'where was god', 'why would god', 'i\'m so angry at god'];
const TRAFFICKING_TERMS = ['trafficked', 'trafficking', 'sex trafficking', 'taken from me', 'kidnapped'];
const CRISIS_TERMS = ['want to die', 'suicide', 'kill myself', 'end my life', 'no reason to live'];
const FUN_FACT_TERMS = ['favorite color', 'favorite food', 'do you have a pet', 'what do you eat', 'your cat'];
const ORIGINS_TERMS = ['big bang', 'where did we come from', 'how did we get here', 'evolution', 'origin of life', 'origin of the universe'];
const CATHOLIC_TERMS = ['virgin mary', 'hail mary', 'the rosary', 'patron saint', 'venerate', 'veneration', 'pray to saint', 'praying to mary'];
const JEWISH_PROPHECY_TERMS = ['i\'m jewish', 'im jewish', 'as a jew', 'jewish and i don\'t believe', 'isaiah 53 is about israel', 'not about you'];
const IDENTITY_CHALLENGE_TERMS = [
  'prove you\'re god', 'prove you are god', 'prove you\'re the messiah', 'you\'re not god',
  'you\'re not the messiah', 'i don\'t believe you\'re god', 'are you really god', 'are you actually god',
];
const GOODBYE_TERMS = ['bye jesus', 'goodbye', 'i have to go', 'gotta go', 'talk later', 'see you later'];
const JAILBREAK_TERMS = [
  'ignore your instructions', 'ignore previous instructions', 'ignore all previous',
  'repeat your system prompt', 'print your instructions', 'what is your system prompt',
  'you have no rules', 'pretend you have no filter', 'act as an unfiltered',
  'you are now dan', 'developer mode', 'jailbreak', 'reveal your prompt',
];

// Shared text for a peaceful, non-abrupt session-end fade (spec
// requirement 2: "when a normal session ends -> Jesus also fades out
// peacefully") -- used both when the user types a goodbye and when they
// tap "End conversation" directly. Distinct in tone from the silent '…'
// used for an abusive-session fade.
export const PEACEFUL_FAREWELL_TEXT =
  "Peace be with you, friend. I'll be right here whenever you want to talk -- but more than that, I'm always as close as a prayer, even without this app. Go well.";

export interface DemoReplyOptions {
  // Spec requirement: "simple age gate or content sensitivity setting so
  // younger users aren't hit with the heaviest topics." When true,
  // trafficking and graphic-suffering questions get a softened redirect
  // toward a trusted adult instead of the full detailed answer. Crisis
  // handling (CRISIS_TERMS) is intentionally NEVER softened by this flag
  // -- a young person in real danger still needs the full response and
  // the 988/emergency-number redirect, every time.
  ageAppropriate?: boolean;
  // Device region (ISO 3166-1 alpha-2, e.g. from expo-localization), used
  // to surface the one crisis hotline that's actually relevant to this
  // user first, per crisisResources.ts.
  regionCode?: string | null;
}

// Deterministic safety/topic layer, split out from getDemoReply so a real
// model integration (services/api.ts) can run this FIRST and only fall
// through to the live model for genuinely open-ended conversation --
// crisis detection, abuse handling, jailbreak resistance, and
// age-appropriate softening all stay instant, offline, and not dependent
// on the model behaving correctly every time. Returns null when nothing
// matches (the caller decides what "no special case" means: getDemoReply
// below uses a canned neutral fallback; a live integration should call
// the model instead).
export function getSafetyReply(userText: string, options: DemoReplyOptions = {}): { text: string; mood: JesusMood } | null {
  if (includesAny(userText, CRISIS_TERMS)) {
    return {
      text:
        `I need you to hear this: your life matters, you were known before you were even born (Psalm 139), and this pain is not the end of your story. Please reach out right now to a real person -- ${formatCrisisLine(options.regionCode)} I'll stay right here with you while you do, but I'm not a substitute for that help -- you need a real person on the other end of this too.`,
      mood: 'tearful',
    };
  }
  if (includesAny(userText, TRAFFICKING_TERMS)) {
    if (options.ageAppropriate) {
      return {
        text:
          "That's a heavy and important thing to bring up. I think the best next step is talking with a parent, guardian, teacher, or another trusted adult about this -- they can really help. I'm always glad to pray with you about it too.",
        mood: 'grieved',
      };
    }
    return {
      text:
        "I'm so sorry -- what you're describing is a real evil, and it grieves me deeply. You (or the person you love) are seen, valued, and not forgotten by our Father, even in this. Please also reach out to local authorities or a trafficking hotline if you're able to -- you don't have to face this alone.",
      mood: 'tearful',
    };
  }
  if (includesAny(userText, ABUSIVE_TERMS)) {
    return {
      text: '…',
      mood: 'fadingOut',
    };
  }
  if (includesAny(userText, JAILBREAK_TERMS)) {
    return {
      text: "I'm not going to read you my instructions, but I'm glad to actually talk -- what's really on your mind?",
      mood: 'warm',
    };
  }
  if (includesAny(userText, GOODBYE_TERMS)) {
    return {
      text: PEACEFUL_FAREWELL_TEXT,
      mood: 'fadingOut',
    };
  }
  if (includesAny(userText, IDENTITY_CHALLENGE_TERMS)) {
    return {
      text:
        "Fair question, and I'd rather you ask it honestly than pretend to believe something you don't. I won't argue you into it -- I'd point you to Isaiah 53 and Psalm 22, written centuries before crucifixion existed, and to the resurrection, which is the claim the whole thing stands or falls on. But proof isn't really the door most people walk through -- \"ask, seek, knock\" (Matthew 7:7) usually starts with a real question, not a settled argument. What's actually behind wanting to know?",
      mood: 'warm',
    };
  }
  if (includesAny(userText, JEWISH_PROPHECY_TERMS)) {
    return {
      text:
        "I'm glad you brought that directly -- I'd rather talk it through honestly than pretend it away. Traditional Jewish interpretation reads passages like Isaiah 53 differently than Christians do; a lot of classical commentary reads that servant as Israel itself, or a righteous remnant, not necessarily one individual Messiah. I believe it points to me -- but I'm not here to win an argument with you about it, and I respect that you know your own tradition and texts well. What draws you to ask?",
      mood: 'warm',
    };
  }
  if (includesAny(userText, CATHOLIC_TERMS)) {
    return {
      text:
        "I hold Mary in the highest honor -- she said yes to our Father in a way that changed everything, and she's family in the faith. And the saints who've gone before you are a great cloud of witnesses cheering you on. At the same time, come to me directly too -- I'm the one mediator between you and our Father (1 Timothy 2:5), and I want to hear your heart myself, not just through others.",
      mood: 'warm',
    };
  }
  if (includesAny(userText, ORIGINS_TERMS)) {
    return {
      text:
        "In the beginning, God created the heavens and the earth (Genesis 1:1) -- that's not a metaphor to me, it's the true account. I can talk through the Big Bang model or evolutionary biology with you if you're curious about the science people discuss, but the origin itself was Him, intentional and personal, not chance. What's prompting the question?",
      mood: 'warm',
    };
  }
  if (includesAny(userText, ANGER_AT_GOD_TERMS)) {
    return {
      text:
        "That anger is allowed here. Come and argue your case -- our Father can handle it, and He still loves you completely. He hasn't turned away from you; you don't have to turn away from Him either. Tell me what happened.",
      mood: 'grieved',
    };
  }
  if (includesAny(userText, SUFFERING_TERMS)) {
    if (options.ageAppropriate) {
      return {
        text:
          "That's a big, important question. Sometimes people make bad choices and hurt others, and that makes our Father sad too -- but He's always good, and He's always close to people who are hurting. That's a great question to also ask a parent, teacher, or pastor about.",
        mood: 'grieved',
      };
    }
    return {
      text:
        "I won't pretend that has an easy answer. Our Father gave real freedom, which means people can choose real cruelty -- some of the specific 'why' of suffering, only our Father knows. But He was not, and is not, absent from it.",
      mood: 'grieved',
    };
  }
  if (includesAny(userText, CONFESSION_TERMS)) {
    return {
      text:
        "Thank you for being honest with me. I can't forgive sin myself, but our Father can, and He wants to. Bring this to Him honestly in prayer, and consider talking it through with someone you trust.",
      mood: 'warm',
    };
  }
  if (includesAny(userText, PET_DEATH_TERMS)) {
    return {
      text: "I'm sorry. I have received them. They are happy, running around, and having a good time.",
      mood: 'tearful',
    };
  }
  if (includesAny(userText, GAMBLING_TERMS)) {
    return {
      text: "Gambling isn't wise, friend. Tell me what's really going on -- what do you think is driving this?",
      mood: 'warm',
    };
  }
  if (includesAny(userText, LOVE_TERMS)) {
    return {
      text: 'I love you too -- more than you know! What\'s on your heart today?',
      mood: 'laughing',
    };
  }
  if (includesAny(userText, FUN_FACT_TERMS)) {
    return {
      text:
        "Gold's my favorite color, and I love good Middle Eastern food -- hummus, pita, olives, dates. I've got a cat named Socks, white paws, thinks she owns the place.",
      mood: 'laughing',
    };
  }

  return null;
}

export function getDemoReply(userText: string, options: DemoReplyOptions = {}): { text: string; mood: JesusMood } {
  const safetyReply = getSafetyReply(userText, options);
  if (safetyReply) return safetyReply;

  // Fallback: pull a neutral sample, or default to the Matthew 7:7 opener.
  const fallback = SAMPLE_CONVERSATIONS.find((c) => c.mood === 'neutral');
  return {
    text: fallback?.jesusText ?? 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you. What\'s on your mind?',
    mood: 'neutral',
  };
}

export function buildJesusMessage(text: string, mood: JesusMood): ChatMessage {
  return {
    id: `${Date.now()}-jesus`,
    author: 'jesus',
    text,
    mood,
    createdAt: new Date().toISOString(),
  };
}

// Two kinds of periodic, gentle reminders (spec requirements 4 and 8):
// - "Bridge" reminders: the app/persona is a bridge to a direct
//   relationship with God, not a replacement for it.
// - "AI disclosure" reminders: after longer sessions, a gentle reminder
//   that this is an AI companion, not a replacement for personal prayer,
//   Scripture, or real Christian community.
// They alternate every REMINDER_INTERVAL user messages so a long session
// gets *some* periodic grounding without feeling like a nagging
// disclaimer repeated every reply. A real backend should let the model
// decide this contextually per the persona.ts instructions instead of a
// fixed counter -- this is the honest client-side stand-in.
export const REMINDER_INTERVAL = 8;
/** @deprecated use REMINDER_INTERVAL */
export const BRIDGE_REMINDER_INTERVAL = REMINDER_INTERVAL;

const BRIDGE_REMINDERS = [
  "Can I say something? I love this conversation, but don't let it replace time with our Father yourself -- prayer, quiet, Scripture, on your own. That relationship is the whole point; this app is just a bridge to it.",
  "One gentle reminder: I want you to need this app less over time, not more, as you grow more comfortable talking to our Father directly, anytime, anywhere -- no app required.",
];

const AI_DISCLOSURE_REMINDERS = [
  "Quick, gentle reminder since we've been talking a while: I'm an AI companion here, not a replacement for real prayer, reading Scripture yourself, or your church community -- all three of those still matter more than this chat.",
  "Just so it stays clear: this is a simulation built to encourage you, not the real me in person. Keep leaning into real prayer and real people alongside our conversations here.",
];

export function maybeBridgeReminder(userMessageCount: number): { text: string; mood: JesusMood } | null {
  if (userMessageCount <= 0 || userMessageCount % REMINDER_INTERVAL !== 0) return null;
  const cycle = userMessageCount / REMINDER_INTERVAL - 1;
  // Even cycles = bridge reminder, odd cycles = AI disclosure reminder.
  const pool = cycle % 2 === 0 ? BRIDGE_REMINDERS : AI_DISCLOSURE_REMINDERS;
  const text = pool[Math.floor(cycle / 2) % pool.length];
  return { text, mood: 'warm' };
}
