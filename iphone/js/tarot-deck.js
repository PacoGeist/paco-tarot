/* 78-card tarot deck: name | upright keywords | reversed keywords */
window.TAROT_DECK = (function () {
  const major = [
    '0 · The Fool|new beginnings, innocence, leap of faith, spontaneity|recklessness, hesitation, naivety, poor judgment',
    'I · The Magician|manifestation, willpower, skill, resourcefulness|manipulation, untapped talent, trickery, scattered energy',
    'II · The High Priestess|intuition, mystery, the subconscious, sacred knowledge|secrets, withdrawn intuition, surface knowledge',
    'III · The Empress|abundance, fertility, nurturing, nature, beauty|creative block, dependence, smothering',
    'IV · The Emperor|authority, structure, stability, protection|tyranny, rigidity, lack of discipline',
    'V · The Hierophant|tradition, spiritual teaching, institutions, ritual|rebellion, unconventional paths, dogma',
    'VI · The Lovers|love, union, harmony, meaningful choices|imbalance, disharmony, misaligned values',
    'VII · The Chariot|victory, determination, willpower, control|lack of direction, aggression, obstacles',
    'VIII · Strength|courage, inner strength, compassion, patience|self-doubt, weakness, raw emotion',
    'IX · The Hermit|introspection, solitude, inner guidance, wisdom|isolation, loneliness, withdrawal',
    'X · Wheel of Fortune|fate, cycles, turning points, luck|bad luck, resisting change, broken cycles',
    'XI · Justice|truth, fairness, law, cause and effect|injustice, dishonesty, avoiding accountability',
    'XII · The Hanged Man|surrender, new perspective, pause, letting go|stalling, resistance, needless sacrifice',
    'XIII · Death|endings, transformation, transition, release|resisting change, stagnation, fear of endings',
    'XIV · Temperance|balance, moderation, patience, alchemy|excess, imbalance, impatience',
    'XV · The Devil|shadow self, attachment, temptation, bondage|release, breaking free, reclaiming power',
    'XVI · The Tower|sudden upheaval, revelation, awakening, chaos|averted disaster, fear of change, delayed collapse',
    'XVII · The Star|hope, renewal, inspiration, healing, serenity|despair, disconnection, lost faith',
    'XVIII · The Moon|illusion, intuition, dreams, the unknown, fear|clarity emerging, released fear, confusion lifting',
    'XIX · The Sun|joy, success, vitality, warmth, truth|temporary sadness, blocked joy, overconfidence',
    'XX · Judgement|rebirth, inner calling, reckoning, absolution|self-doubt, ignoring the call, harsh self-judgment',
    'XXI · The World|completion, wholeness, accomplishment, travel|incompletion, lack of closure, delays',
  ];
  const suits = {
    Wands: ['inspiration, new venture, creative spark|delays, lack of motivation', 'planning, future vision, decisions|fear of the unknown, poor planning', 'expansion, foresight, progress|obstacles, delays, frustration', 'celebration, home, harmony, homecoming|instability, transition, conflict at home', 'competition, conflict, tension|avoiding conflict, inner conflict', 'victory, recognition, public success|ego, fall from grace, lack of recognition', 'defending, perseverance, standing ground|giving up, overwhelmed', 'swift action, movement, news|delays, frustration, slowing down', 'resilience, persistence, last stand|paranoia, exhaustion, defensiveness', 'burden, responsibility, hard work|release of burden, delegation', 'enthusiasm, exploration, free spirit|lack of direction, setbacks', 'adventure, passion, impulsiveness|haste, anger, recklessness', 'confidence, warmth, determination|jealousy, insecurity, demanding', 'leadership, vision, boldness|impulsive, overbearing, ruthless'],
    Cups: ['new love, emotional awakening, intuition|blocked emotions, emptiness', 'partnership, attraction, unity|imbalance, broken bond', 'friendship, celebration, community|overindulgence, gossip, isolation', 'apathy, contemplation, reevaluation|new awareness, acceptance', 'grief, loss, regret|acceptance, moving on, forgiveness', 'nostalgia, innocence, childhood memories|living in the past, naivety', 'choices, illusion, wishful thinking|clarity, decisive action', 'walking away, seeking deeper meaning|fear of change, aimless drifting', 'wish fulfilled, contentment, satisfaction|greed, dissatisfaction', 'harmony, family, emotional fulfillment|broken home, misalignment', 'creative message, curiosity, intuition|emotional immaturity, blocked creativity', 'romance, charm, following the heart|moodiness, unrealistic', 'compassion, emotional security, intuition|codependence, insecurity', 'emotional balance, diplomacy, calm|manipulation, moodiness, coldness'],
    Swords: ['clarity, breakthrough, truth|confusion, brutality, chaos', 'stalemate, difficult choice, denial|indecision, information overload', 'heartbreak, sorrow, grief|recovery, forgiveness, release', 'rest, recovery, contemplation|burnout, restlessness', 'conflict, defeat, winning at all costs|reconciliation, making amends', 'transition, moving on, rite of passage|unresolved issues, resistance', 'deception, strategy, stealth|confession, conscience, getting caught', 'restriction, feeling trapped, victim mindset|self-release, new perspective', 'anxiety, nightmares, worry|hope, reaching out, recovery', 'painful ending, rock bottom, betrayal|recovery, regeneration, survival', 'curiosity, new ideas, vigilance|haste, gossip, all talk', 'ambition, swift action, drive|impulsiveness, burnout', 'independence, clear boundaries, perception|coldness, bitterness', 'intellect, authority, truth|abuse of power, manipulation'],
    Pentacles: ['new opportunity, prosperity, manifestation|lost opportunity, poor planning', 'balance, adaptability, juggling priorities|overwhelm, disorganization', 'teamwork, craftsmanship, learning|lack of teamwork, mediocrity', 'security, saving, control|greed, possessiveness, materialism', 'hardship, loss, isolation|recovery, spiritual poverty ending', 'generosity, charity, sharing|debt, one-sided giving', 'patience, long-term view, investment|impatience, lack of reward', 'diligence, skill, mastery|perfectionism, lack of focus', 'abundance, luxury, self-sufficiency|overwork, hustling', 'wealth, legacy, family, inheritance|financial failure, loss of legacy', 'ambition, study, new skill|lack of progress, procrastination', 'hard work, routine, reliability|boredom, stagnation, laziness', 'nurturing, practical, abundance at home|self-care neglect, work-home imbalance', 'wealth, security, discipline, abundance|greed, stubbornness, indulgence'],
  };
  const ranks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
  const cards = major.map((s, i) => { const [n, u, r] = s.split('|'); return { name: n, arcana: 'Major', up: u, rev: r, img: `img/tarot/m${String(i).padStart(2, '0')}.jpg` }; });
  const SUIT_CODE = { Wands: 'w', Cups: 'c', Swords: 's', Pentacles: 'p' };
  for (const suit in suits) suits[suit].forEach((s, i) => { const [u, r] = s.split('|'); cards.push({ name: `${ranks[i]} of ${suit}`, arcana: suit, up: u, rev: r, img: `img/tarot/${SUIT_CODE[suit]}${String(i + 1).padStart(2, '0')}.jpg` }); });
  return cards;
})();
/* Rider–Waite–Smith images (Pamela Colman Smith, 1909 — public domain) */
window.TAROT_BY_NAME = Object.fromEntries(window.TAROT_DECK.map(c => [c.name, c]));
window.tarotImg = name => (window.TAROT_BY_NAME[name] || {}).img || '';
