# Cultural review, pass 1 (AI-assisted first pass, not a substitute for consultants)

Written 2026-09-28, at the owner's request, after the last splash-art batch completed
full art coverage for the roster (ADR-063). Covers the five origin groups OQ-12 and
`docs/art/splash-production-phases.md` flag for cultural review: Egyptian/desert
(Phase 4, high), Japanese folklore (Phase 6, high), Norse/Celtic (Phase 7, medium),
Slavic folklore (Phase 9, high), and world folklore/several cultures (Phase 11, high).
61 characters in total.

**What this is not.** OQ-12 says it plainly: "Claude Code cannot substitute for
cultural consultants." This pass checked names, lore, ability text, art prompts, and
the actual generated portraits against publicly documented mythology/folklore for
factual accuracy, stereotyping, caricature, and conflation of distinct traditions. It
cannot speak to how a design lands with someone from the culture it draws on, which is
the thing that actually matters and the thing OQ-12 asks for. Treat every finding below
as a lead worth a real reviewer's judgment, not a verdict.

**Method.** Read every flagged character's lore, abilities, and full art spec
(region, palette, avoid-list, splash/portrait prompts) directly from
`packages/content/src/data/characters/*.ts`. Then opened the actual generated
portraits for the characters most likely to show AI-art stereotyping that a careful
prompt doesn't fully prevent (genie/djinn characters, East-Asian fox/goblin/oni
characters, Anansi, the Monkey Trickster, Baba Yaga-type hags) — prompts can be
tasteful while the model's output still drifts.

## What's already solid

- No real kanji, hiragana, Arabic script, or other sacred/real text appears in any
  checked prompt or image — every spec explicitly forbids it, and the images confirm it.
- No franchise, anime, or existing-game character is being copied; every art spec
  carries its own `avoid` list naming the generic thing to stay clear of.
- Almost every character is an **invented** figure in a real tradition (Aurelia,
  Ifrit, Frost Jötunn, Blue/Red Oni, Draugr, Leshy, Domovoi, Rusalka, Baba Yaga, the
  Firebird, Zmey Gorynych, and most of the world-folklore group) rather than a named
  real deity — this is exactly the "original interpretation of public-domain myth"
  CLAUDE.md's non-negotiable #1 asks for, and it's the majority of the roster.
- Aurelia's own spec explicitly says "with no religious symbols" — proof the team
  already applies this standard somewhere. It just didn't reach every character (see
  finding 1).
- The generated art for Oni, Baba Yaga, Draugr, Leshy, Yuki-Onna, Banshee, Rusalka,
  Jiangshi and most others reads as a respectful, non-caricatured treatment with no
  racialized exaggeration.

## Findings, most significant first

### 1. Anubian Judge (and, to a lesser extent, Jackal Guardian) reuse a real, still-practiced religion's specific content, not generic myth
`anubian-judge.ts`'s ability **Verdict of Ma'at** names an actual Egyptian goddess
(Ma'at) and its lore ("sets a feather against every heart") reenacts the real Weighing
of the Heart ceremony from the Book of the Dead almost exactly — this is documented
theology, not folklore in the "story everyone knows" sense, and Kemetic
reconstructionism is a real, practiced modern religion built on this same content.
This is a different, closer kind of reuse than Aurelia (an invented empress with solar
powers) or Ifrit (an invented fire-djinn) — those are original characters *inspired
by* a tradition; Anubian Judge's central ability is that tradition's own liturgy.
Jackal Guardian, a second character built on the same jackal-headed-guardian-of-the-
dead role Anubis actually holds, compounds this by splitting one deity's real
attributes across two separate playable fighters.
**Recommendation:** either rework the ability/lore to drop the named goddess and the
literal heart-weighing rite (an invented "judge of the dead" archetype, the way
Aurelia is an invented sun-empress, keeps the aesthetic without the specific
religious content), or flag this character by name for an Egyptological/Kemetic
reviewer specifically, ahead of the rest of the batch.

### 2. The Monkey Trickster reproduces Sun Wukong's specific identity, not generic trickster folklore
The golden headband (his actual cursed circlet from the novel), the iron-banded
staff (his named weapon, the Ruyi Jingu Bang), and the stolen peaches of immortality
are all drawn directly and specifically from *Journey to the West* — a particular,
authored 16th-century novel with one very famous, still-beloved, still-adapted
character, not undifferentiated public folklore the way "a trickster spirit" would
be. This reads as that one character with the name changed, closer to what CLAUDE.md's
non-negotiable #1 forbids ("no copied ... characters" in spirit, even though the sixteenth
century novel itself is public domain) than an original interpretation.
**Recommendation:** redesign around a different simian-trickster concept, or keep the
general archetype but drop the three identifying props (headband, that specific
staff, the peaches) so the character reads as "a trickster monkey spirit" rather than
"Sun Wukong, renamed."

### 3. Anansi's delivered portrait dropped every element that made him supernatural, leaving mostly ethnic signifiers
The art spec calls for extra eyes, a second pair of arms, web/thread props — all
things that mark him as a mythological being. The actual generated portrait shows
none of that: a dreadlocked, dark-skinned man in patterned cloth with a straw hat and
a hand drum, nothing spider-like visible at all. Without the fantastical markers the
image reads as a generic "African tribesman" costume rather than a trickster deity,
which is a real stereotyping risk on its own — and dreadlocks specifically are a
Rastafarian/Caribbean signifier, not Akan/Ashanti (Anansi's actual origin, in what is
now Ghana), so the image also blends two distinct regions/eras.
**Recommendation:** regenerate this one specifically, checking that the spider
anatomy the brief calls for actually survives into the final image — this is a case
where the written prompt was fine and the generation didn't deliver it.

### 4. Two separate "genie in a lamp" characters both rendered as the Aladdin-lamp stereotype
Desert Djinn (Egyptian group) and The Wandering Genie (world-folklore group) both
generated as a turbaned, gold-jeweled man conjuring smoke from a brass lamp and
granting wishes — one of the most widely criticized Orientalist tropes in Western
media, and having it twice doesn't diversify the roster's treatment of djinn, it
doubles down on the single most clichéd version of them. (Ifrit differentiates itself
as a fire elemental rather than a lamp-genie, which is the right instinct — it just
wasn't applied to the other two.)
**Recommendation:** consolidate to one djinn/genie character, or make the second one
visually and conceptually distinct from "lamp, smoke, wishes" — actual djinn in
Arabic/Islamic folklore are a whole broad class of beings, not exclusively
lamp-dwellers.

### 5. The Nine-Tailed Trickster's art leans into "sexy anime fox girl" over the lore's actual framing
The lore sets her up as genuinely dangerous ("every tail is another favor she is
owed"), but the delivered image is a conventionally pretty, reclining pose with a bare
shoulder — the common "moe/attractive" flattening of kitsune/kumiho/huli jing myths
across East Asia into a cute-and-sexy trope for a Western audience, rather than
something that reads as dangerous the way the writing intends.
**Recommendation:** a re-render emphasizing the "knowing smile" and danger already in
the prompt text over conventional prettiness — no rewrite needed, just a different
generation pass.

### 6. Dokkaebi is visually conflated with Japanese oni
Classical Korean dokkaebi are not traditionally horned; the single-horn, green-skin,
giant-club look is a modern-media convention borrowed from Japanese oni. Using it here
blurs two traditions this roster is otherwise trying to keep distinct (dokkaebi sits
in the Phase 11 "world folklore" group specifically apart from the Phase 6 Japanese
group).
**Recommendation:** drop the horn and differentiate the silhouette from Blue/Red Oni
so the two traditions read as separate rather than reskins of each other.

### 7. The Sphinx is filed as "Egyptian" but her defining trait is Greek myth
The riddle, the winged lion-woman form, and guarding a city against travelers are
specifically the Greek Sphinx of the Oedipus myth (daughter of Echidna and Typhon).
The actual Egyptian sphinx (e.g., Giza) is traditionally male, wingless, and does not
pose riddles. Filing her under "Egyptian / Desert inspiration" mixes two distinct
mythological traditions under one regional label — a factual-accuracy issue a real
reviewer would catch immediately, lower stakes than 1–4 but still worth fixing.
**Recommendation:** move her origin tag to the Ancient Mediterranean/Greek group
(already home to Medusa, Cerberus, Arachne) or redesign her around the actual
Egyptian guardian-sphinx archetype if she needs to stay in this group.

### 8. Jiangshi's forehead talisman is a real Taoist ritual object
The yellow paper charm ("fu") used here as the hopping-corpse's signature prop is a
real object from actual Taoist funerary/exorcism practice, not an invented prop —
common in jiangshi fiction broadly (this isn't unique to this project) but the same
"no religious symbols" bar applied to Aurelia hasn't been applied here.
**Recommendation:** low urgency, but worth the same specialist's opinion as finding 1
— is this read as respected genre convention (it usually is, in jiangshi fiction) or
as trivializing a living ritual practice.

### 9. Minor: "Kappa Kiro" naming pattern
Pairing the yokai's species name with a human given name ("Kappa" + "Kiro") reads a
little like naming a vampire character "Vampire Bob" — every other named character in
the roster uses either a real word-name (Shiro, Yuki-Onna) or an invented descriptive
title ("The Painted Ronin"), not species-plus-name. Not offensive, just an
inconsistency worth a second look.

### 10. Minor: trope crowding within groups
Three separate oni (Red, Blue, Oni of the Red Gate) and three separate djinn/genies
(Ifrit, Desert Djinn, The Wandering Genie) sit in the roster. Not a sensitivity issue
by itself, but it means one narrow slice of two large traditions is getting
disproportionate roster space relative to the breadth of folklore available in each.

## What this doesn't resolve

OQ-12 stays open. This pass is a documented lead list for a human reviewer — ideally
someone from or expert in Egyptian/Kemetic, Japanese, Korean, Chinese, Slavic, and
West African traditions specifically, given where the findings landed — to confirm,
dismiss, or correct before this art is treated as final (every spec is still
`status: "draft"`, `culturalConsultationNeeded: true`, unchanged by this pass).
