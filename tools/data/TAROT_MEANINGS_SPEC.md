# Tarot interpretation data — spec

The app uses the Rider–Waite–Smith deck. **This app NEVER uses reversed cards** — every card is read upright. Never mention reversals or "reversed".

Exact card names are in /home/claude/witch/data/tarot-card-names.json (e.g. "0 · The Fool", "XIII · Death", "Ace of Wands", "Page of Cups", "King of Pentacles"). Use them EXACTLY.

## Output: JSON array, one object per card
{
 "name": "XVII · The Star",
 "keywords": ["hope", "renewal", "healing", "inspiration", "serenity", "faith"],   (6-8)
 "imagery": "2-3 sentences describing what is pictured on the Rider–Waite–Smith card and what the symbols mean (e.g. the eight-pointed stars, the ibis, the two jugs).",
 "meaning": "A rich upright interpretation, 4-6 sentences, warm and witchy but clear and practical.",
 "element": "Air", "astrology": "Aquarius",          (traditional Golden Dawn attributions; for court cards e.g. "Fire of Water"; for minors give decan e.g. "Venus in Scorpio" where traditional)
 "numerology": "short note on the number's meaning (minors/majors), or court rank meaning",
 "yesNo": "Yes" | "No" | "Maybe",
 "affirmation": "a one-line first-person affirmation",
 "ctx": {
   "past":       "how this card reads in a PAST / roots / what came before position",
   "present":    "... in a PRESENT / current situation / heart of the matter position",
   "future":     "... in a FUTURE / outcome / where this leads / what is coming position",
   "challenge":  "... in a CHALLENGE / obstacle / block / crossing position (describe the shadow side or excess of the card's upright energy, or what it demands of you — never 'reversed')",
   "advice":     "... in an ADVICE / action / next step / how to / lesson position",
   "self":       "... in a SELF / you / how you see yourself / your attitude / inner child position",
   "others":     "... in an OTHERS / environment / outside influences / how others see you / partner's view position",
   "hopes":      "... in a HOPES & FEARS / desire / wish position",
   "love":       "... in a LOVE / relationship / heart / the bond position",
   "work":       "... in a WORK / career / money / creativity / craft position",
   "spirit":     "... in a SPIRIT / guide / ancestor / divine message / higher self position",
   "release":    "... in a RELEASE / let go / what ends / what to leave behind / banishing position",
   "shadow":     "... in a SHADOW / hidden / subconscious / secret / blind spot position",
   "foundation": "... in a FOUNDATION / root cause / beneath / core / what underlies it position",
   "gift":       "... in a GIFT / strength / blessing / hidden help / opportunity position"
 }
}
Each ctx text: 2-3 sentences (35-70 words), second person ("you"), interpretive and specific to THIS card's imagery and meaning AND to that kind of position — not generic filler, no repeating the same sentence across contexts. Speak like an experienced, kind reader. No medical/legal/financial certainty; empowering, not fatalistic (e.g. Death/Tower: transformation, not literal doom).

Validate at the end with node: JSON.parse; the right number of cards; every name exists in tarot-card-names.json; every object has all 15 ctx keys with non-empty strings; no text contains "revers" (case-insensitive).
