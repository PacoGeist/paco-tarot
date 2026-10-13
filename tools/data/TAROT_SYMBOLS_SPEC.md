# Tarot imagery & symbols — spec

Deck: the classic Rider–Waite–Smith (Pamela Colman Smith, 1909). This app NEVER uses reversed cards; never mention reversals.
Exact card names: /home/claude/witch/data/tarot-card-names.json (e.g. "0 · The Fool", "Ace of Wands"). The card pictures are in /home/claude/witch/www/img/tarot/ (m00–m21 majors; w/c/s/p + 01–14 = Ace…King of Wands/Cups/Swords/Pentacles). LOOK AT THE ACTUAL CARD IMAGES (use the Read tool on the .jpg files) so every feature you list is really on the card — do not invent details.

## Per-card file: JSON array of
{
 "name": "XVII · The Star",
 "symbols": [
   {"feature": "Great eight-pointed star", "where": "top centre, golden, above the figure", "meaning": "1-3 sentences: what this feature traditionally means and how it shapes the card's message"},
   ...
 ]
}
- 8-14 symbols per card, ordered roughly from most to least important.
- Cover EVERY notable visual element: the figure(s) and their pose, gaze direction and clothing (colours of robes, cloaks, shoes, headwear), objects held, animals, plants & flowers, the SKY COLOUR (yellow = consciousness, optimism, the divine; blue = calm, spirit, intuition; grey = sorrow, uncertainty, conflict; black = despair, the unknown, night), clouds, sun/moon/stars, the landscape (mountains = challenges, aspirations or abstract thought — note near vs. distant and which side; hills; plains; deserts), water (rivers, sea, pools = emotion, the subconscious; still vs. rough), buildings, pillars, thrones and their carvings, ground/floor, numbers and letters on the card, and the overall colour palette.
- Meanings follow Waite's Pictorial Key, Golden Dawn and common modern reading practice; say "traditionally" or "often read as" where interpretations vary.

## Symbol dictionary file (tarot-symbol-dictionary.json): JSON array of
{"category": "Sky & Weather" | "Landscape" | "Water" | "Colours" | "Figures & Poses" | "Clothing & Crowns" | "Animals" | "Plants & Flowers" | "Objects & Tools" | "Architecture" | "Celestial" | "Numbers & Letters",
 "symbol": "Yellow sky", "meaning": "2-3 sentences", "seenIn": ["exact card names where it clearly appears", ...]}
Validate with node: JSON.parse; names exist in tarot-card-names.json; no text contains "revers".
