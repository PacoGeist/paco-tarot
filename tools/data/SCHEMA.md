# Grimoire data schema (all files are UTF-8 JSON arrays)

Write plain, valid JSON (no comments, no trailing commas). Use straight quotes inside strings escaped properly. `id` = lowercase kebab-case, unique, prefixed by type (e.g. "herb-lavender", "spell-honey-jar-sweetening", "oil-four-thieves").
Keywords are short lowercase phrases (1-3 words), 3-10 per list. Use a CONSISTENT vocabulary for metaphysical keywords so they group well in tables. Prefer these canonical metaphysical keywords where they fit (you may add others sparingly):
protection, purification, cleansing, banishing, uncrossing, hex breaking, love, self-love, attraction, lust, friendship, money, prosperity, luck, success, abundance, healing, health, divination, psychic powers, dreams, prophetic dreams, astral travel, meditation, spirituality, peace, happiness, calm, sleep, courage, strength, confidence, wisdom, knowledge, memory, clarity, focus, communication, justice, legal matters, binding, hex, curse, exorcism, spirit work, ancestors, necromancy, faery, fertility, beauty, youth, longevity, transformation, new beginnings, road opening, wishes, manifestation, consecration, blessing, grounding, balance, energy, vitality, power, domination, control, reconciliation, fidelity, emotional healing, grief, release, endings, shadow work, moon magic, sun magic, glamour, invisibility, travel, home blessing, employment, business, gambling, victory, uncrossing.
Medical keywords: plain-language folk/traditional uses, lowercase (e.g. "digestion", "nausea", "insomnia", "anxiety", "headache", "colds", "cough", "sore throat", "fever", "inflammation", "wounds", "skin", "burns", "menstrual cramps", "circulation", "immune support", "stress", "muscle pain", "antiseptic", "antifungal", "bloating", "liver support", "kidney support", "diuretic", "allergies", "congestion", "bug bites"). Empty array [] if none.

## Herb (herbs-*.json)
{
 "id": "herb-lavender",
 "name": "Lavender",
 "latin": "Lavandula angustifolia",
 "folkNames": ["Elf Leaf", "Nard", "Spike"],
 "planet": "Mercury", "element": "Air", "gender": "Masculine",
 "deities": ["Hecate", "Saturn"],
 "partsUsed": "flowers, leaves",
 "description": "2-4 sentence evocative description of the plant & its lore/history",
 "metaphysical": ["peace", "sleep", "love", "purification", "happiness"],
 "medical": ["anxiety", "insomnia", "headache", "burns"],
 "metaphysicalUses": "paragraph of magical uses & lore",
 "medicalUses": "paragraph of traditional/folk medicinal uses (traditional, hedge-wise wording)",
 "whereToFind": "native range, habitat where it grows wild, how/when to forage or grow it, and where to buy (e.g. apothecaries, garden centers)",
 "uses": ["5-8 concrete practical uses, e.g. 'Tuck dried buds under your pillow for peaceful dreams'"],
 "caution": "safety notes: pregnancy, interactions, allergies, toxicity. Empty string only if truly benign.",
 "toxic": false
}
Toxic plants: set "toxic": true, begin caution with "POISONOUS —", medical keywords should be [] or historical only, and uses must be non-ingestive (e.g. symbolic, kept in sealed jar, gardening, imagery). Never give dosage for toxic plants.

## Spell / formula (spells.json, oils.json, incense.json, tinctures.json, brews.json)
{
 "id": "oil-four-thieves",
 "type": "spell" | "oil" | "incense" | "tincture" | "brew",
 "name": "Title",
 "description": "2-4 sentences: what it is, lore/origin, what it does",
 "ingredients": [{"item": "Lavender buds", "amount": "1 tbsp"}],
 "steps": ["ordered preparation steps, each 1-2 sentences"],
 "howToUse": "how to use / work the spell or apply the formula",
 "chant": "words to chant/speak (rhyming incantations are welcome). Empty string if none.",
 "intention": "a one-line statement of intention",
 "timing": "best moon phase / day / hour (optional, may be empty)",
 "metaphysical": ["..."],
 "medical": ["..."],
 "caution": "safety notes (fire safety, skin patch test, dilution, pregnancy, etc.)"
}
Ingredient names should match herb names from the herb list below where applicable (e.g. "Rosemary", "Bay Laurel leaves") so the app can cross-link.
Oils: use a carrier oil and essential oils with safe dilution (usually <= 2-3% for skin) OR infused herbs. Tinctures: real folk proportions (folk method, 1:5 etc.), alcohol strength, steep time, typical dropper dose plus "consult a healthcare provider". Brews: teas, potions, moon waters, washes, baths, floor washes — mark external-only ones clearly. Never use toxic herbs in anything ingested or applied to skin.

## Sigil (sigils.json)
{
 "id": "sigil-...",
 "name": "...",
 "origin": "e.g. Norse bindrune, planetary seal, alchemical symbol, chaos-magic style, traditional folk mark",
 "description": "2-4 sentences",
 "metaphysical": ["..."],
 "directions": "how to use: draw/charge/activate, where to place, when",
 "intention": "words of intention to speak while charging it",
 "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>...</svg>"
}
SVG rules: single quotes for attributes inside the JSON string; viewBox 0 0 100 100; strokes only using currentColor (fill='currentColor' allowed for small dots); keep within 8..92; only path/line/circle/polyline/polygon/ellipse elements; must look clean and symmetric where appropriate.

## Tarot layout (tarot.json)
{
 "id": "tarot-celtic-cross",
 "name": "...",
 "description": "...",
 "cardCount": 10,
 "difficulty": "Beginner" | "Intermediate" | "Advanced",
 "metaphysical": ["divination", "..."],
 "positions": [{"n": 1, "name": "The Present", "meaning": "what this position reveals", "x": 1, "y": 1, "rotate": 0}],
 "howToUse": "shuffling/laying instructions & reading tips",
 "intention": "a question or words to speak before drawing"
}
x,y are grid coordinates in card units (card is 1 wide, 1.5 tall; use x spacing ~1.2 and y spacing ~1.7 for non-overlapping). rotate 0 or 90 (crossing card). Coordinates >= 0.

## Herb list (canonical names — herb files must use exactly these names; formulas should reference them)
A (herbs-a.json): Lavender, Rosemary, Common Sage, White Sage, Mugwort, Yarrow, Chamomile, Peppermint, Spearmint, Basil, Thyme, Bay Laurel, Cinnamon, Clove, Nutmeg, Star Anise, Ginger, Garlic, Rose, Jasmine, Calendula, St. John's Wort, Vervain, Wormwood, Rue, Valerian, Lemon Balm, Hyssop, Patchouli, Sandalwood, Frankincense, Myrrh, Dragon's Blood, Copal, Benzoin, Cedar, Juniper, Pine, Eucalyptus, Elder
B (herbs-b.json): Hawthorn, Rowan, Oak, Willow, Birch, Mistletoe, Holly, Ivy, Dandelion, Nettle, Plantain, Burdock, Comfrey, Mullein, Red Clover, Echinacea, Elecampane, Angelica, Lovage, Fennel, Dill, Caraway, Coriander, Cumin, Black Pepper, Cayenne, Mustard Seed, Bayberry, Allspice, Cardamom, Vanilla, Orange Peel, Lemon, Apple, Pomegranate, Raspberry Leaf, Blackberry, Strawberry, Catnip, Damiana
C (herbs-c.json): Passionflower, Skullcap, Hops, Blue Lotus, Violet, Marjoram, Oregano, Parsley, Tansy, Feverfew, Horehound, Licorice Root, Marshmallow Root, Slippery Elm, Black Cohosh, Goldenseal, Ginseng, High John the Conqueror, Cinquefoil, Devil's Shoestring, Solomon's Seal, Agrimony, Wood Betony, Meadowsweet, Vetiver, Lemongrass, Mandrake, Belladonna, Foxglove, Datura, Henbane, Wolfsbane, Pennyroyal, Lady's Mantle, Motherwort, Sweetgrass, Hibiscus, Saffron, Lemon Verbena, Borage

## Timing fields (added to EVERY item of every type)
 "bestTime": "best time of year — season, months and/or sabbat, e.g. 'Spring, Ostara to Beltane (Mar–May)'; for herbs say best harvest/working season",
 "moonPhases": ["one or more of exactly: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, Waning Crescent, Dark Moon"]

## Crystal (crystals.json)
{
 "id": "crystal-amethyst", "name": "Amethyst",
 "folkNames": ["Bishop's Stone", "Stone of Sobriety"],   (witchcraft/metaphysical names; [] if none)
 "mineral": "Quartz variety (silicon dioxide)", "hardness": "7",
 "color": "#8e5cc7",   (representative hex colour)
 "colors": "pale lilac to deep violet",
 "chakra": "Third Eye, Crown", "element": "Water, Air", "planet": "Jupiter, Neptune", "zodiac": ["Pisces", "Aquarius"],
 "description": "2-4 sentences of lore/history",
 "metaphysical": ["keywords per canonical list"],
 "metaphysicalUses": "paragraph",
 "uses": ["5-7 concrete ways to use it in practice"],
 "substitutes": ["3-5 crystal names from the crystal list that can stand in, best first"],
 "substituteNotes": "one sentence on why those work as substitutes",
 "cleansing": "how to cleanse/charge it; whether it is water-safe / sun-safe",
 "whereToFind": "where it is mined / found and how to buy ethically",
 "caution": "e.g. toxic dust, not water safe, fades in sunlight; empty string if none",
 "bestTime": "...", "moonPhases": ["..."]
}
Crystal list (exact names): Amethyst, Clear Quartz, Rose Quartz, Smoky Quartz, Citrine, Ametrine, Herkimer Diamond, Black Tourmaline, Obsidian, Snowflake Obsidian, Apache Tear, Black Onyx, Hematite, Jet, Shungite, Selenite, Moonstone, Labradorite, Lapis Lazuli, Sodalite, Turquoise, Malachite, Azurite, Green Aventurine, Jade, Tiger's Eye, Carnelian, Red Jasper, Bloodstone, Garnet, Ruby, Emerald, Sapphire, Aquamarine, Fluorite, Lepidolite, Howlite, Amazonite, Chrysocolla, Rhodonite, Rhodochrosite, Kunzite, Morganite, Pyrite, Moss Agate, Blue Lace Agate, Fire Agate, Peridot, Prehnite, Celestite, Angelite, Blue Kyanite, Orange Calcite, Sunstone, Unakite, Amber, Opal, Charoite, Larimar, Danburite, Lodestone, Hag Stone, Staurolite, Pearl

## Expansion set 2 (new canonical names)
Herbs D (herbs-d.json): Anise, Ashwagandha, Bee Balm, Blessed Thistle, Boneset, Chickweed, Cleavers, Galangal, Holy Basil, Honeysuckle, Horsetail, Lilac, Linden, Magnolia, Mexican Marigold, Milk Thistle, Orris Root, Poppy, Self-Heal, Sunflower, Tobacco, Turmeric, Witch Hazel, Yew, Yerba Santa
Crystals 2 (crystals-2.json): Aragonite, Apophyllite, Chrysoprase, Dalmatian Jasper, Desert Rose, Goldstone, Iolite, Lemurian Quartz, Ocean Jasper, Rutilated Quartz, Septarian, Seraphinite, Spirit Quartz, Sugilite, Tanzanite, Pink Tourmaline, Watermelon Tourmaline, Chiastolite, Moldavite, Topaz, Bronzite, Mahogany Obsidian, Ammonite, Petrified Wood, Fulgurite
All items in expansion files MUST include "bestTime" and "moonPhases" directly (see Timing fields).

## Deity (deities-a.json / deities-b.json)
{
 "id": "deity-cerridwen", "name": "Cerridwen",
 "altNames": ["Ceridwen", "Keridwen", "Caridwen"],
 "title": "Keeper of the Cauldron of Inspiration",           (a short epithet)
 "pantheon": "Welsh (Brythonic Celtic)",
 "metaphysical": ["transformation", "wisdom", "..."],        (what they represent, canonical keywords; 5-10)
 "represents": "paragraph: what they rule/represent and their nature",
 "description": "history & lore: 2-4 paragraphs separated by \n\n — sources (e.g. Hanes Taliesin, Hesiod, Prose Edda), myths, how they were worshipped historically, and how modern witches/pagans relate to them. Be honest about what is ancient vs. modern interpretation.",
 "gems": ["crystal names — ONLY from the crystal lists in this file (original + Crystals 2)"],
 "herbs": ["herb names — ONLY from the herb lists in this file (A, B, C, D)"],
 "items": ["sacred symbols, tools & items, e.g. cauldron, white sow imagery, grain"],
 "animals": ["..."], "colors": ["..."],
 "planet": "...", "element": "...",
 "sacredDays": "festivals, days of the week, seasons associated",
 "howToInvoke": "paragraph: how to call on them respectfully — altar set-up, candles, prayer posture, what to do afterwards (thanks, closing)",
 "invocation": "an original invocation/prayer to speak (rhyming welcome), multi-line with \n",
 "offerings": ["6-10 specific things they love as gifts/tribute/offerings"],
 "avoid": "taboos / what not to offer or do (or empty)",
 "bestTime": "best time of year to work with them", "moonPhases": ["valid phase names"],
 "caution": "respect notes: e.g. living religion / closed practice considerations, approach with respect, not a vending machine; empty only if nothing to say"
}
Deities (exact names) — A (deities-a.json): Cerridwen, Brigid, The Morrígan, Cernunnos, Rhiannon, Arianrhod, Lugh, Danu, Hecate, Persephone, Demeter, Artemis, Aphrodite
B (deities-b.json): Hermes, Selene, Pan, Diana, Isis, Bastet, Thoth, Anubis, Freyja, Odin, Frigg, Hel, Inanna
