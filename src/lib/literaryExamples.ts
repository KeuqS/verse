/**
 * Editorial writing exercises inspired by broad craft concerns associated with
 * selected poets. Every example is newly written for Verse and is explicitly
 * illustrative, not a quotation, imitation, measured prosodic analysis, or AI output.
 *
 * Keep influence metadata and exercise coverage in one registry so a selector
 * entry cannot silently fall back to unrelated examples.
 */
export interface LiteraryInfluence {
  id: string;
  name: string;
  period: string;
  style: string;
  description: string;
}

export const INFLUENCES = [
  { id: "dickinson", name: "Emily Dickinson", period: "1830–1886", style: "Compression & Paradox", description: "Explore compression, unusual comparisons and personification." },
  { id: "rimbaud", name: "Arthur Rimbaud", period: "1854–1891", style: "Sensory Experiment", description: "Explore startling images and exchanges between the senses." },
  { id: "vuong", name: "Ocean Vuong", period: "Contemporary", style: "Memory & Detail", description: "Explore intimacy through physical detail and associative images." },
  { id: "bishop", name: "Elizabeth Bishop", period: "1911–1979", style: "Observation & Precision", description: "Explore careful observation and particular objects." },
  { id: "neruda", name: "Pablo Neruda", period: "1904–1973", style: "Image & Address", description: "Explore concrete images for absence and emotion." },
  { id: "shakespeare", name: "William Shakespeare", period: "1564–1616", style: "Drama & Rhetoric", description: "Explore direct address, rhetorical questions and personification." },
  { id: "angelou", name: "Maya Angelou", period: "1928–2014", style: "Refrain & Resolve", description: "Explore repetition and deliberate first-person declarations." },
  { id: "frost", name: "Robert Frost", period: "1874–1963", style: "Landscape & Choice", description: "Explore how a scene or action carries a question." },
  { id: "plath", name: "Sylvia Plath", period: "1932–1963", style: "Charged Imagery", description: "Explore the emotional pressure of concrete comparisons." },
  { id: "rumi", name: "Rumi", period: "1207–1273", style: "Paradox & Reflection", description: "Explore paradox and images of inward discovery. These English exercises are not translations." },
  { id: "hughes", name: "Langston Hughes", period: "1901–1967", style: "Rhythm & Repetition", description: "Explore cadence, repetition and the sound of ordinary speech." },
  { id: "oliver", name: "Mary Oliver", period: "1935–2019", style: "Nature & Attention", description: "Explore close attention to an ordinary natural scene." },
] as const satisfies readonly LiteraryInfluence[];

export type InfluenceId = (typeof INFLUENCES)[number]["id"];
export type Technique =
  | "diction" | "imagery" | "personification" | "repetition"
  | "rhythm" | "syntax" | "question" | "paradox" | "synesthesia";

export interface LiteraryExample {
  id: string;
  technique: Technique;
  original_text: string;
  suggested_text: string;
  explanation: string;
}

export const GENERAL_EXAMPLES: readonly LiteraryExample[] = [
  {
    id: "general-compression",
    technique: "diction",
    original_text: "very sad",
    suggested_text: "melancholy",
    explanation: "Condenses two words into one. Decide whether the meaning suits your poem.",
  },
  {
    id: "general-syntax",
    technique: "syntax",
    original_text: "moonlight bright",
    suggested_text: "bright beneath the moon",
    explanation: "Reorders the phrase to change its emphasis, without a claim about meter or rhyme.",
  },
  {
    id: "general-image",
    technique: "imagery",
    original_text: "beautiful morning light",
    suggested_text: "light spilled across the morning",
    explanation: "Replaces an evaluation with a physical action the reader might picture.",
  },
];

export const EXAMPLES_BY_INFLUENCE: Record<InfluenceId, readonly LiteraryExample[]> = {
  dickinson: [
    { id: "dickinson-compression", technique: "imagery", original_text: "very sad", suggested_text: "grief has a circumference", explanation: "Tries a compact geometric comparison for an emotion; an editorial exercise, not a quotation." },
    { id: "dickinson-personification", technique: "personification", original_text: "the room was quiet", suggested_text: "the room held its breath", explanation: "Treats a room as a living presence to change the pressure of the scene." },
  ],
  rimbaud: [
    { id: "rimbaud-senses", technique: "synesthesia", original_text: "colors blend", suggested_text: "blue rings like a bell", explanation: "Crosses sight and hearing in a single invented image." },
    { id: "rimbaud-image", technique: "imagery", original_text: "I want freedom", suggested_text: "I want the horizon to open", explanation: "Makes an abstract desire spatial and perceptible." },
  ],
  vuong: [
    { id: "vuong-detail", technique: "imagery", original_text: "I remember my mother", suggested_text: "I remember the warmth of her coat", explanation: "Replaces a general recollection with one tactile detail." },
    { id: "vuong-metaphor", technique: "imagery", original_text: "the past hurts", suggested_text: "the past pulls at the hem of today", explanation: "Tests a physical metaphor for an experience of memory." },
  ],
  bishop: [
    { id: "bishop-harbor", technique: "imagery", original_text: "the harbor is empty", suggested_text: "one green rope floats beside the pier", explanation: "Tests whether a concrete observed detail conveys emptiness." },
    { id: "bishop-object", technique: "diction", original_text: "I lost my keys", suggested_text: "the brass key is missing from its hook", explanation: "Adds a particular object and location. Use only if the invented details are true to the scene." },
  ],
  neruda: [
    { id: "neruda-absence", technique: "imagery", original_text: "I miss you", suggested_text: "your absence fills the unlit kitchen", explanation: "Gives absence a physical place through a paradoxical image." },
    { id: "neruda-sea", technique: "imagery", original_text: "the sea is vast", suggested_text: "the sea keeps unfolding beyond the boats", explanation: "Replaces a scale judgment with a moving image." },
  ],
  shakespeare: [
    { id: "shakespeare-hour", technique: "personification", original_text: "time passes", suggested_text: "the hour steals the color from the rose", explanation: "Makes time act as a character. No metrical claim is implied." },
    { id: "shakespeare-question", technique: "question", original_text: "I am afraid", suggested_text: "shall fear command the course of my own feet?", explanation: "Turns a statement into a rhetorical question to change the speaker's stance." },
  ],
  angelou: [
    { id: "angelou-refrain", technique: "repetition", original_text: "I will continue", suggested_text: "I will begin again. I will begin again.", explanation: "Tests a recurring declaration for emphasis and momentum." },
    { id: "angelou-voice", technique: "diction", original_text: "they ignored me", suggested_text: "still, I spoke my name aloud", explanation: "Moves the focus from the crowd's action to the speaker's." },
  ],
  frost: [
    { id: "frost-path", technique: "imagery", original_text: "the road splits", suggested_text: "the path divides at the fence", explanation: "Places an abstract choice in a specific rural scene." },
    { id: "frost-field", technique: "imagery", original_text: "nature is beautiful", suggested_text: "the field brightened after rain", explanation: "Replaces an evaluation with an observed change." },
  ],
  plath: [
    { id: "plath-match", technique: "imagery", original_text: "feeling angry", suggested_text: "anger struck like a match", explanation: "Uses a brief, volatile comparison for intensity." },
    { id: "plath-ash", technique: "imagery", original_text: "dark thoughts", suggested_text: "thoughts black as cooling ash", explanation: "Tests a material image in place of an abstract description." },
  ],
  rumi: [
    { id: "rumi-map", technique: "paradox", original_text: "I feel lost", suggested_text: "perhaps the wandering is the map", explanation: "Introduces a paradox about direction. This is an English craft exercise, not a translation." },
    { id: "rumi-door", technique: "personification", original_text: "the door is closed", suggested_text: "the closed door asks me to listen", explanation: "Transforms a barrier into a figure for attention." },
  ],
  hughes: [
    { id: "hughes-step", technique: "rhythm", original_text: "I kept walking", suggested_text: "step by step, I walked on", explanation: "Tests verbal recurrence and a spoken cadence, without assigning a fixed meter." },
    { id: "hughes-city", technique: "personification", original_text: "the city is awake", suggested_text: "streetlights flicker; the windows answer", explanation: "Lets separate city details take turns as speaking presences." },
  ],
  oliver: [
    { id: "oliver-trees", technique: "personification", original_text: "trees are tall", suggested_text: "the trees lean into the afternoon", explanation: "Slows attention onto a natural image with a human gesture." },
    { id: "oliver-sun", technique: "imagery", original_text: "morning sun", suggested_text: "sunlight settles on wet grass", explanation: "Adds weather and texture in place of a general label." },
  ],
};

/** Unknown or unselected influence IDs use explicitly general examples. */
export function examplesForInfluence(selectedId?: string): readonly LiteraryExample[] {
  if (!selectedId || !Object.prototype.hasOwnProperty.call(EXAMPLES_BY_INFLUENCE, selectedId)) {
    return GENERAL_EXAMPLES;
  }
  return EXAMPLES_BY_INFLUENCE[selectedId as InfluenceId];
}

/**
 * Match only the exact, case-sensitive source phrase at word boundaries.
 * Avoid changing "very sadness" into "melancholyness", including for Unicode text.
 */
export function findExampleMatch(text: string, source: string): { start: number; end: number } | null {
  if (!source) return null;
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|[^\\p{L}\\p{N}\\p{M}_])(${escaped})(?=$|[^\\p{L}\\p{N}\\p{M}_])`, "u").exec(text);
  if (!match) return null;
  const start = match.index + match[1].length;
  return { start, end: start + source.length };
}

export function applyLiteraryExample(text: string, example: Pick<LiteraryExample, "original_text" | "suggested_text">): string | null {
  const range = findExampleMatch(text, example.original_text);
  if (!range) return null;
  return text.slice(0, range.start) + example.suggested_text + text.slice(range.end);
}
