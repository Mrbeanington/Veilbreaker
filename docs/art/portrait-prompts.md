# Portrait prompts

Generated from the game data (119 playable fighters). Do not edit by hand: run `pnpm art:portraits`.

## How to use this file

1. **Start a chat** with your image generator and paste the **style block** below as your first message. Say you will send characters one at a time and want a square 1:1 portrait for each.
2. **Make the reference set first**: the four fighters listed below, one at a time. Look at all four together. If they do not look like one game, change the style block (never a single prompt) and redo them. Keep the four you approve.
3. **Run the rest in batches** of one origin group per chat. Start each chat with the style block and attach one approved reference image.
4. For each fighter, paste its prompt. **Reject** any image with letters, a logo, a watermark or a signature, a cropped head or feet, or extra or missing limbs, and ask for another.
5. **Save each approved image** as `<id>.portrait.png` (the file name is under every heading), square, at least 512 pixels. Put them all in one folder and run `pnpm art:import <folder>`. It shrinks them to the game's size and reports anything missing.
6. Groups marked **cultural review** draw on living traditions. Treat their art as a draft until someone from or expert in that tradition has looked at it (OQ-12).

## Style block (paste once at the start of every chat)

```text
I am making portrait art for an original 3v3 fantasy arena game. I will describe one character at a time. For each, make ONE square 1:1 image: a shoulders-up character portrait that reads clearly at small size, on a plain dark neutral background.

Style, the same for every image: high-detail original 2D fantasy combat illustration, strong readable silhouette, dramatic graphic lighting, hand-painted texture, stylized anatomy, expressive faces, mythic atmosphere, clean ability-icon readability, dark neutral battlefield presentation, rich regional artistic inspiration where appropriate, modern competitive-game readability, no copyrighted logos, no modern franchise iconography, no text baked into character art.

Never include: text, letters, words, numbers, logo, watermark, signature, caption, frame with lettering, existing franchise character, existing game character, photorealistic, 3D render, blurry, low resolution, extra fingers, deformed hands, duplicated limbs, cropped head. There must be no writing of any kind anywhere in the image. Do not imitate any living artist, studio, game or franchise.
```

## Reference set (make these four first)

- **Tortuga Rex** (Core, original): `tortuga-rex.portrait.png`
- **Koschei the Deathless** (Secret, slavic): `koschei.portrait.png`
- **Zeiron, the God Who Refused Olympus** (Legend, mediterranean): `zeiron.portrait.png`
- **Yuki-Onna** (Rare, japanese): `yuki-onna.portrait.png`

They cover a starter, a Secret, a Legend and a high-priority cultural group, so the look has to hold across very different designs.

## Ancient Mediterranean

15 fighters.

### Arachne

Rare · file: `arachne.portrait.png`

```text
a weaver transformed into a spider-woman of Mediterranean myth, an ageless woman, a proud narrow face with a cold smile and many small dark eyes across her brow, a slender woman's torso above a long-legged spider body, a sleeveless tunic woven of fine grey thread, a loom-shuttle in one hand and glinting strands trailing from her fingers, loom-pattern lines in pale gold across her arms, a woman's figure rising from eight long jointed legs against a web, a loom shuttle, gleaming threads, a half-finished tapestry, a cold smile, threads drawn taut between her fingers
```

### Asterion

Core · file: `asterion.portrait.png`

```text
a bull-headed man-beast of Mediterranean myth, ageless, a heavy bull's skull-face with deep-set human eyes, enormously broad, hunched under his own shoulders, a rough hide kilt and bronze wrist bands, sweeping curved horns and a length of frayed thread around one wrist, pale scars in the pattern of a labyrinth across his chest, a hulking figure with wide curved horns against a corridor wall, curved horns, a frayed thread, labyrinth scars, the bull face in profile, breath steaming, one eye catching torchlight
```

### Cerberus

Core · file: `cerberus.portrait.png`

```text
a three-headed hound of the underworld from Mediterranean myth, ageless, three heavy black hound heads, one snarling, one watching, one sleeping, a massive low-slung hound with a serpent's tail, none — matted black fur and a heavy iron collar, fangs and a broken iron chain hanging from the collar, ember-red eyes and a single white scar on the middle head, a wide crouched hound with three heads in a row above the shoulders, three heads, a broken chain, an iron collar, three overlapping hound heads with ember eyes
```

### Charon

Rare · file: `charon.portrait.png`

```text
an ancient ferryman of the underworld, more spirit than man, impossibly old, a gaunt hooded face, hollow cheeks and patient, tired eyes, tall and stooped, long-limbed, a sodden grey hooded cloak, a long black boat pole with a lantern hung from its tip, coins pressed into the skin of his palms, a stooped hooded figure leaning on a very long pole, a boat pole, a hanging lantern, two coins glinting, his hooded face lit from below by the lantern, a coin between two fingers
```

### Cyclops Brontes

Core · file: `cyclops-brontes.portrait.png`

```text
a one-eyed giant smith of Mediterranean myth, middle-aged for his kind, a broad soot-smeared face with one large central eye and a heavy brow, huge, barrel-chested, thick forearms scarred by sparks, a scorched leather apron and iron wrist guards, a great forge hammer and tongs holding a glowing bolt, burn scars in a lightning-fork pattern on his arms, a huge one-eyed figure with a hammer raised over an anvil, a great hammer, a glowing bolt, an anvil, the single eye lit orange by the forge, soot on his brow
```

### Hecate's Disciple

Rare · file: `hecates-disciple.portrait.png`

```text
a young initiate of a crossroads goddess from Mediterranean myth, young adult, a watchful young face with dark eyes and a small knowing smile, lean and quick, always half in shadow, a dark hooded cloak over a plain grey tunic, a black-flamed torch and a ring of three old keys, three thin lines painted across her brow, one for each road, a hooded figure holding a torch at a three-way crossing, a black-flamed torch, three keys, a crossroads marker, half her face lit by the black flame, keys glinting
```

### Hydra

Core · file: `hydra.portrait.png`

```text
a many-headed marsh serpent of Mediterranean myth, ancient, several narrow serpent heads with amber slit eyes, a thick coiled body on short clawed limbs, none — overlapping dark green scales, fangs dripping pale venom, weathered bronze-coloured scale ridges, a fan of serpent necks rising from a single mass, multiple serpent heads, dripping venom, three serpent heads overlapping the frame, amber eyes fixed forward
```

### Icarion

Secret · file: `icarion.portrait.png`

```text
a young flier of Mediterranean myth, a teenager, an eager, sun-flushed young face with wide bright eyes, slight and wiry, arms spread as if always mid-leap, a plain tunic scorched at the hem, two huge wings of feathers held with wax, dripping and cracked, sun-freckled skin and a single golden feather tucked behind one ear, a slight figure with wide feathered wings caught against a bright disc, wax-and-feather wings, dripping wax, a golden feather, his grin caught in blinding light, a single feather drifting past
```

### Medusa

Rare · file: `medusa.portrait.png`

```text
a gorgon of Mediterranean myth, ageless, a stern, sorrowful woman's face with unreadable pale eyes, tall and still, coiled serpent lower body, a tattered bronze-green mantle, a mass of living snakes for hair, and a cracked bronze mirror shard at her belt, green-gold scale patterns along her arms, a tall still figure crowned by writhing snakes, hair of snakes, stone-grey statues at her feet, a cracked bronze mirror, her face half turned away, one pale eye visible, snakes in the frame's corners
```

### Nemesis

Rare · file: `nemesis.portrait.png`

```text
a winged goddess of retribution from Mediterranean myth, ageless, a severe, even-featured face with steady dark eyes, tall and balanced, with folded dark wings, a plain white chiton and a bronze breastplate, a set of bronze scales in one hand and a wheel-shaped whip in the other, a balanced-scale pattern in gold across the breastplate, a winged figure holding a pair of scales level, bronze scales, dark wings, a whip, a level stare over the raised scales
```

### The Bronze Giant

Rare · file: `the-bronze-giant.portrait.png`

```text
a colossal automaton of bronze from Mediterranean myth, ancient, an expressionless beaten-bronze face with hollow eyes, colossal, hulking, plated in overlapping bronze sheets, riveted bronze plates weathered green at the seams, his own huge fists and torn-up boulders, a single riveted seam at the ankle where a thin vein of gold shows, a vast plated figure standing on a shoreline, riveted bronze plates, an ankle rivet, a boulder in one fist, the blank bronze face tilted down toward the viewer, rivets catching light
```

### The Forgotten Titan

Secret · file: `the-forgotten-titan.portrait.png`

```text
a primordial giant of Mediterranean myth, half buried in stone, older than the mountains, a vast worn stone face, eyes closed, moss in the creases, enormous and half-sunk into rock, shoulders like cliffs, none — skin like grey stone with veins of dull gold, broken chains of bronze still wrapped around wrists the size of columns, cracks of faint gold light running through the stone of his chest, a mountain with the shape of a sleeping giant's shoulders and head, broken bronze chains, gold light in cracks, moss and roots on stone, the great closed-eyed face with one crack of gold running down it
```

### The Oracle

Rare · file: `the-oracle.portrait.png`

```text
a priestess-seer of Mediterranean myth, impossible to tell, a calm face with milky, unfocused eyes and lips slightly parted mid-prophecy, slight and upright, seated on a tall tripod, flowing white robes with a laurel wreath, a shallow bronze bowl of smoking vapours and a laurel branch, faint gold lines drawn across her closed lids, a robed figure perched on a tripod amid rising vapour, a tripod, rising vapour, a laurel wreath, her milky eyes fixed past the viewer, gold lines on her lids
```

### The Siren

Rare · file: `the-siren.portrait.png`

```text
a sea-singer of Mediterranean myth, half woman and half bird, ageless, a beautiful open-mouthed face mid-song with pale sea-green eyes, a woman's torso with wide feathered wings and talon feet, a drape of wet sea-green silk and pearl strings, a shell-horn and trailing strands of pearls, shimmering blue-green feather patterns on her arms, a winged figure perched on a jagged sea rock with mouth open in song, wide feathered wings, a shell horn, a jagged sea rock, open-mouthed and luminous, wind lifting her feathers
```

### Zeiron, the God Who Refused Olympus

Legend · file: `zeiron.portrait.png`

```text
a rebellious Greek-inspired god of storms, ageless, apparently in his prime, a stern, scarred, bearded face with storm-grey eyes, towering and heavily muscled, storm-scarred bronze armor with a torn cloak, crackling lightning gathered in one fist, branching lightning-scar patterns across the arms, a colossal figure under a broken crown of golden points, the broken golden crown, gathered lightning, storm-lit stare, the broken crown dark against the sky
```

## Animal tall tales

7 fighters.

### General Goose

Rare · file: `general-goose.portrait.png`

```text
a decorated military goose of barnyard-war satire, an old campaigner, a stern, flat-billed goose face with a hard yellow eye and a scar over one brow, broad-chested and upright, a dark green dress uniform with gold epaulettes, a chest of medals and a peaked cap, a short bayonet-tipped rifle and a brass bugle, a small feather-scar over one eye, an upright goose in a peaked cap and medals with a bayonet over one wing, a peaked cap, a chest of medals, a brass bugle, a stern goose face under a peaked cap
```

### King Croak

Rare · file: `king-croak.portrait.png`

```text
a crowned frog monarch of swamp fairy tales, old and pompous, a wide, warty green face with bulging gold eyes and a wider mouth, squat, round and regal, a moth-eaten ermine-trimmed red robe and a tarnished gold crown that sits between the eyes, a long sceptre topped with a dragonfly and a quiver of dart-thorns, dark warts and a pale throat that swells when he speaks, a squat crowned frog on a huge lily pad holding a tall sceptre, a tarnished crown, an ermine-trimmed robe, a dragonfly sceptre, a warty green face with bulging gold eyes under a crown
```

### Professor Octopus

Rare · file: `professor-octopus.portrait.png`

```text
a scholarly giant octopus of whimsical sea tales, middle-aged, a large domed head with heavy-lidded, intelligent eyes behind half-moon spectacles, a round head above eight long curling arms, a small tweed waistcoat and a tiny mortarboard, with a bow tie at the neck, a heavy book held in one arm, a piece of chalk in another and a cup of tea in a third, faint pale rings along every arm, a round-headed octopus in a mortarboard with several arms holding books and chalk, half-moon spectacles, a tiny mortarboard, a heavy book, a domed head with spectacles and heavy-lidded eyes
```

### Sir Hopsalot

Core · file: `sir-hopsalot.portrait.png`

```text
an earnest knight-errant rabbit of storybook tales, a young adult rabbit, a long-eared, wide-eyed rabbit face with a determined set to the mouth, small, upright and springy, a dented silver breastplate a size too big, a tiny plumed helm with ear-holes and a red cloak, a slender lance with a carrot-orange pennant and a round shield, a white blaze down the nose, a small armoured rabbit with tall ears through a plumed helm holding a long lance, a plumed helm with ear-holes, a lance with a pennant, a red cloak, a determined rabbit face under a plumed helm
```

### The Albino Gorilla

Core · file: `the-albino-gorilla.portrait.png`

```text
a huge albino silverback gorilla of jungle legend, a mature adult, a broad, heavy-browed face of pale pink-white skin with deep, calm, pale eyes, immense, broad-shouldered and long-armed, none: thick off-white fur with a silver-grey saddle across the back, huge knuckled fists and a bunch of bananas, pale pink skin around the eyes and knuckles, an immense pale hunched figure with long arms dragging its knuckles in a jungle clearing, off-white fur, huge knuckled fists, a heavy brow, a heavy-browed pale face with calm eyes
```

### The Honey Badger

Core · file: `the-honey-badger.portrait.png`

```text
a fearless badger of savannah tall tales, a grizzled adult, a broad, flat-headed badger face with small dark eyes and a white cap of fur, low, wide and solid, none: a thick black coat with a white saddle from head to tail, long dark claws and a scrap of honeycomb stuck to one paw, a jagged old scar across the muzzle, a low, wide, white-capped badger in a defiant crouch with claws out, a white-capped back, long claws, a scrap of honeycomb, a flat-headed badger face with small dark eyes
```

### The Minotaur King

Legend · file: `minotaur-king.portrait.png`

```text
a colossal crowned bull-headed monarch of the labyrinth, ancient, a huge horned bull's head under a dented bronze crown with small, weary, furious eyes, vast, broad and towering, battered bronze plate armour engraved with labyrinth patterns over a dark hide, an enormous ceremonial axe with a maze engraved on the blade, concentric maze engravings worn into the armour, entirely original, a colossal horned crowned figure with a huge axe standing in a narrow stone corridor, a dented bronze crown, labyrinth-engraved armour, an enormous axe, a horned bull's head under a dented crown
```

## Egyptian and desert traditions (cultural review: high priority)

11 fighters.

### Anubian Judge

Secret · file: `anubian-judge.portrait.png`

```text
a jackal-masked judge of the dead from desert myth, ageless, a black jackal mask with narrow gold eye-slits, tall, still and composed, a white pleated robe, a heavy gold collar and black leather sandals, a pair of brass scales and a single white feather, black kohl lines running down from the eye slits, a tall jackal-masked figure holding brass scales at arm's length, brass scales, a white feather, a jackal mask, a black jackal mask with two gold slits
```

### Aurelia, Empress of the Sun

Legend · file: `aurelia.portrait.png`

```text
a solar empress of a lost desert empire, ageless, apparently in her prime, a serene, luminous face with golden eyes and a slight, patient smile, tall, upright and dignified, radiant gold plate over layers of flowing ceremonial cloth in white and saffron, a long sun-tipped spear and a floating halo of geometric sun fragments, fine gold inlay lines on the armour, with no religious symbols, a tall armoured figure crowned by a ring of floating geometric sun shards, a halo of sun shards, flowing saffron cloth, a sun-tipped spear, a serene face with golden eyes lit from above
```

### Desert Djinn

Rare · file: `desert-djinn.portrait.png`

```text
a genie of desert whirlwind and smokeless fire, ageless, a smiling, sharp-featured face with glowing white eyes, a lithe upper body that trails into a spiralling column of sand, silk sashes, gold armlets and a jewelled turban, a small brass lamp and swirling ribbons of sand, gold rings of glowing script-free geometric patterns on the forearms, a smiling figure rising from a swirling sand column with a lamp in one hand, a brass lamp, a sand whirlwind, gold armlets, a grinning face with white glowing eyes in swirling sand
```

### Ifrit

Rare · file: `ifrit.portrait.png`

```text
a great fire-djinn of the deep desert, ageless, a fierce, horned face of glowing orange with slit black eyes, broad, towering and half made of drifting embers, a bronze breastplate over molten skin and a smoking sash, a whip of living flame and a curved fire-blade, cracks of white-hot light across the chest and arms, a huge horned figure wreathed in flames with a fire whip, a fire whip, curved horns, drifting embers, a horned face with glowing eyes and heat shimmer
```

### Jackal Guardian

Core · file: `jackal-guardian.portrait.png`

```text
a jackal-headed tomb guardian of desert myth, timeless, a lean black jackal head with alert amber eyes and tall ears, tall, lean and still as a statue, a gold collar, linen kilt and bronze arm guards, a curved khopesh sword and a tall bronze-tipped staff, pale sand dust on the shoulders, a tall jackal-headed figure standing motionless with a curved blade, a curved khopesh, a gold collar, a tall staff, a still jackal face with amber eyes in torch light
```

### Sand Assassin

Rare · file: `sand-assassin.portrait.png`

```text
a masked desert killer of legend, a young adult, a face wrapped in a sand-coloured veil with only narrow dark eyes showing, lean, low and quick, layered sand-tan wraps, a hooded half-cloak and leather bracers, a pair of curved daggers and a small blowpipe, a thin line of black paint under each eye, a hooded crouching figure with two curved daggers against a dune, curved daggers, a sand-coloured veil, a hooded half-cloak, two dark eyes in a sand-coloured veil
```

### The Living Sarcophagus

Rare · file: `the-living-sarcophagus.portrait.png`

```text
an animated stone sarcophagus of desert myth, ancient, a carved stone face in the lid with hollow eye slots and a faint glow inside, a huge upright stone coffin on thick stone limbs, weathered painted stone, gold leaf flaking off in patches, a heavy stone lid held as a shield, chipped geometric borders and faded painted patterns, a huge upright coffin-shaped figure on thick stone legs, a stone lid, gold leaf flaking, a glowing eye slit, a carved stone face with two glowing eye slits
```

### The Mummy Prince

Rare · file: `the-mummy-prince.portrait.png`

```text
a mummified young prince of a lost desert dynasty, a youth, long dead, a wrapped face with two pale, unblinking eyes and a cracked gold death-mask on one side, slim and stiff, wrapped head to foot, fine linen wrappings, a gold pectoral and a broken princely circlet, a slender scepter and trailing loose bandages, faded ochre patterns painted on the linen, a slim wrapped figure with trailing bandages and a cracked circlet, a cracked circlet, trailing bandages, a gold pectoral, a wrapped face with two pale eyes and half a gold mask
```

### The Pharaoh Without a Tomb

Rare · file: `pharaoh-without-a-tomb.portrait.png`

```text
a restless pharaoh of a forgotten dynasty, a man of middle years, long dead, a stern, gaunt, proud face with hollow eyes and a thin gold beard, tall, regal and faintly translucent at the edges, a tall double crown, a gold-and-lapis collar and a tattered royal kilt, a crook and flail and a rolled, unfinished tomb plan, cracks of pale light along the hands and neck, a tall crowned figure holding a crook and flail on bare sand, a double crown, a crook and flail, an unfinished tomb plan, a proud hollow-eyed face under a tall crown
```

### The Scarab King

Rare · file: `scarab-king.portrait.png`

```text
a scarab-crowned lord of the desert dead, ancient, a gaunt grey face with black compound-eye lenses over the eyes, thin and tall with a hunched, insect-like stance, glossy green-black chitin armour plates over linen wraps, a curved beetle-horn staff and a cloud of scarabs, iridescent green beetle-shell scales across the shoulders, a tall crowned figure wreathed in a swirling cloud of beetles, a beetle-shell crown, a horned staff, a swirling scarab cloud, a gaunt face with black lenses among a few crawling beetles
```

### The Sphinx

Rare · file: `the-sphinx.portrait.png`

```text
a winged, lion-bodied riddler of desert myth with a woman's face, ancient, a calm, sculpted human face with kohl-dark eyes and a faint knowing smile, a great lion's body with folded eagle wings, a gold nemes-style headdress and a broad gold collar, long claws and a low stone plinth beneath her paws, sand-worn stone texture across the flanks, a huge lion-bodied winged figure seated like a monument, a gold headdress, folded wings, a stone plinth, a calm sculpted face with dark eyes
```

## Gothic and folk horror

9 fighters.

### Ashmouth

Rare · file: `ashmouth.portrait.png`

```text
a furnace-throated ash monster of gothic folk horror, ancient, a huge charcoal-black maw ringed with cracked teeth and dull orange light deep in the throat, hulking, low and hunched, cracked grey-black hide crusted with ash and old soot, trailing grey smoke and glowing cracks, orange ember light seeping through every crack in the hide, a huge hunched shape with an open glowing mouth trailing ash, a glowing furnace throat, cracked ash-grey hide, trailing smoke, a wide dark mouth with a dull orange glow inside
```

### Maestro Nocturne

Rare · file: `maestro-nocturne.portrait.png`

```text
a tall, spectral human conductor of a phantom orchestra, ageless, elegant, a pale, sharp face with closed eyes and a faint smile, tall and impossibly slender, a long midnight-blue tailcoat with silver thread and a high collar, a slim silver baton trailing faint light, silver staff-line patterns running along the sleeves, a thin figure in a long tailcoat with one arm raised, baton pointing up, silver baton, floating sheet music, eyes closed, baton at his lips, silver light on his cheek
```

### The Collector

Rare · file: `the-collector.portrait.png`

```text
a well-dressed collector of curiosities from gothic folk horror, a gaunt man of middle age, a long, pleasant face with round spectacles and a thin smile, tall, narrow and precise, a plum velvet coat, a high collar and white gloves, a silver-topped cane and a small glass display case, a monocle chain looped at the lapel, a tall narrow figure with a cane and a glass case tucked under one arm, a silver-topped cane, a glass display case, round spectacles, a long pleasant face with round spectacles
```

### The Grave Digger

Rare · file: `the-grave-digger.portrait.png`

```text
a weathered gravedigger of gothic folk horror, an old man, tireless, a lined, patient face with a grey stubble and tired eyes, broad-shouldered and stooped, with earth on every seam, a long dark coat, a flat cap and heavy muddy boots, a long-handled shovel and a hooded oil lantern, grave-dirt ground into the knuckles, a stooped figure with a shovel over one shoulder and a lantern in the other hand, a long shovel, a hooded lantern, a flat cap, a lined patient face lit by a lantern
```

### The Headless Bride

Rare · file: `the-headless-bride.portrait.png`

```text
a headless bride ghost of European folk horror, a young woman, long dead, no head: a high lace collar and a torn veil hanging over empty air, slim and upright, in a moth-eaten wedding gown, a yellowed lace wedding dress, a torn veil and a rusted ring on a chain, a wilted bouquet in one hand and a long strip of veil in the other, faded grave-dirt stains at the hem, a slim gowned figure with a veil hanging over nothing where the head should be, a torn veil, a wilted bouquet, a yellowed lace gown, a high lace collar and a veil hanging over empty air
```

### The Marionettist

Rare · file: `the-marionettist.portrait.png`

```text
a shadowy puppeteer of gothic folk horror, a thin, ageless man, a pale, thin face with a fixed smile and painted circles on the cheeks, tall, thin and stooped over his own hands, a tattered tailcoat, fingerless gloves and a battered top hat, a wooden control-bar with long fine strings running up into the dark, faint string-marks across the wrists, a tall stooped figure holding a wooden bar with strings rising into the dark, a wooden control-bar, fine strings, a battered top hat, a pale painted-cheek face lit from below
```

### The Scarecrow

Core · file: `the-scarecrow.portrait.png`

```text
a living scarecrow of gothic harvest folk horror, long standing, a burlap sack face with stitched mouth and two dull orange eyes, tall and stiff-limbed, propped on a wooden post, a torn patchwork coat, a ragged straw hat and straw poking from every seam, a rusted pitchfork and a few perched crows, dark stitching across the face and hands, a tall stiff figure on a post in a wheat field with crows on its shoulders, a straw hat, a rusted pitchfork, perched crows, a burlap face with two dull orange eyes
```

### The Thing Beneath the Bed

Rare · file: `the-thing-beneath-the-bed.portrait.png`

```text
a long-armed shadow creature of childhood folk horror, unknowable, no clear face: two wide pale eyes low in a mass of shadow, flat, low and impossibly long-armed, nothing: a shape of dust, shadow and loose threads, long thin fingers with too many joints, a faint film of dust and cobweb over everything, a low mass of shadow under a bed with a long thin arm reaching out, two pale eyes, long thin fingers, a dusty shadow, two wide pale eyes low in the dark
```

### The Vampire Countess

Rare · file: `the-vampire-countess.portrait.png`

```text
an aristocratic vampire countess of gothic folk horror, apparently thirty, centuries old, a pale, sharp-boned face with dark red lips and cold amber eyes, tall, slender and poised, a high-collared black velvet gown with crimson lining and a long dark cloak, a jewelled goblet and a cloud of small bats, a thin dark line at the corner of the mouth, a tall gowned figure with a high collar and a cloak flowing into a cloud of bats, a high collar, a crimson-lined cloak, a cloud of bats, a pale sharp-boned face with cold amber eyes
```

## Japanese folklore and ink tradition (cultural review: high priority)

15 fighters.

### Blue Oni

Core · file: `blue-oni.portrait.png`

```text
a horned ogre-demon of Japanese folklore, ageless, a calm cold-eyed face with a single curved horn and a faint smile, tall and broad, held very still, a folded indigo sash and a plain dark tunic, a long plain iron bar, pale blue skin with darker blue veins, a tall horned figure standing quietly with an iron bar upright beside him, a plain iron bar, one curved horn, an indigo sash, a still face with half-lidded eyes and a faint frost on the horn
```

### Gashadokuro

Rare · file: `gashadokuro.portrait.png`

```text
a giant skeleton spirit of Japanese folklore, ancient, an enormous bare skull with a hinged jaw and pinpoints of cold light for eyes, a skeleton many times human size, made of many different bones, none — bones bound with old rope, huge skeletal hands, hairline cracks glowing faintly pale green along the bones, a towering skeleton looming over a burnt village, jaw hanging open, a huge skull, many bones bound together, green light in the cracks, the great skull filling the frame with a cold green glint
```

### Kappa Kiro

Rare · file: `kappa-kiro.portrait.png`

```text
a river imp of Japanese folklore, ageless, boyish, a beaked, whiskered face with wide bright eyes and a mischievous grin, small, wiry and green-skinned with a turtle-like shell on his back, none — a scaled shell and webbed hands, a shallow dish of water on top of his head and a cucumber tucked in his belt, pale belly, olive-green skin with dark speckles, a small hunched figure with a round dish-topped head and a shell, a water dish on the head, a cucumber, a shell, a cheeky beaked grin under the shining dish
```

### Lantern Spirit

Rare · file: `lantern-spirit.portrait.png`

```text
an old paper lantern come to life, from Japanese folklore, a hundred years old, a paper lantern body with one wide eye and a long thin tongue of flame, round and squat on two small feet, none — torn, patched paper and a wooden frame, a single flickering flame inside the body, a faded family crest painted on the paper in an original design, a round glowing shape on small feet, with a wisp of flame at its top, a paper body, one big eye, a glowing flame, a single round eye lit from inside, paper glowing
```

### Nekomata

Rare · file: `nekomata.portrait.png`

```text
an old two-tailed cat spirit of Japanese folklore, very old, a lean grey cat's face with pale green eyes that never quite blink, a sleek cat, standing partly upright, with a long forked tail, a torn indigo scarf tied around her neck, long curved claws and two tails flickering with cold blue flame, a white patch over one eye, a lean cat standing on hind legs with two tails curling behind her, two tails, cold blue flame, an indigo scarf, pale green eyes in the dark with a flicker of blue tail-fire
```

### Oni of the Red Gate

Secret · file: `oni-of-the-red-gate.portrait.png`

```text
a gate-guardian demon of Japanese folklore, ageless, a stern dark-red face with a single long horn and glowing amber eyes, tall and armoured, standing very square, dark lacquered armour with a red sash and a tattered banner, a long two-handed blade with a red-tasselled hilt, a gate-shaped scar in ember light across the chest plate, a tall horned figure framed by a huge red gate with its doors half closed, a red gate, a long blade, a torn banner, a stern horned face lit amber by the low sun
```

### Red Oni

Core · file: `red-oni.portrait.png`

```text
a horned ogre-demon of Japanese folklore, ageless, a broad flushed face with two short horns, a wide grin of tusks and bright gold eyes, enormous and barrel-chested with thick arms, a tiger-patterned loincloth and iron wrist bands, a huge iron-studded club, deep red skin with pale scars, a hulking horned figure resting a studded club on one shoulder, a studded iron club, two short horns, red skin, a grinning tusked face with steam breathing out of the nostrils
```

### Shiro, the Last Brush

Legend · file: `shiro.portrait.png`

```text
a living ink-wash warrior, ageless, a calm monochrome face with brush-stroke features, lean and upright, loose robes rendered in layered black wash, a blade shaped like a long brush, restrained red seal-like accents in wholly original symbols, an upright figure whose edges dissolve into brush strokes, the brush-blade, dissolving ink edges, the face half-rendered, one eye a single brush dot
```

### Tengu Swordsman

Rare · file: `tengu-swordsman.portrait.png`

```text
a mountain spirit swordsman of Japanese folklore, middle-aged, weathered, a long-nosed red face with sharp dark eyes and a stern set mouth, lean and balanced, always mid-stance, a dark mountain-ascetic robe with white tassels and a small black cap, a long straight sword in a plain scabbard and a fan of black feathers, black-feathered wings folded at his back, a still figure with folded wings, one hand on a sword hilt, a long-nosed mask-like face, black feather wings, a feather fan, a stern long-nosed face in profile with a single feather falling
```

### The Mirror Samurai

Rare · file: `the-mirror-samurai.portrait.png`

```text
an armoured swordsman-spirit of Japanese folklore, impossible to tell, a face hidden by a plain polished steel mask that shows only reflections, tall, straight and completely still, lacquered plate armour polished to a mirror finish over a dark under-robe, a long sword with a blade like a bar of light, no crest — the armour reflects whatever stands before it, an upright armoured figure holding a sword point-down before him, mirror-polished armour, a plain steel mask, a long bright blade, the steel mask reflecting a blurred figure, a faint gleam of light
```

### The Nine-Tailed Trickster

Rare · file: `nine-tailed-trickster.portrait.png`

```text
a fox spirit of East Asian folklore, centuries old, appearing youthful, a sly narrow face with amber eyes and a knowing smile, slender and light-footed, layered silk robes in pale blue and white, floating pale fox-fire orbs, red markings along the eyes and cheeks in an original pattern, a graceful figure fanned by a spread of long tails, a fan of tails, pale fox-fire orbs, a sidelong glance over one shoulder, a tail curling into frame
```

### The Painted Ronin

Secret · file: `the-painted-ronin.portrait.png`

```text
a masterless swordsman who is a living ink painting, from the Ink Realm, impossible to tell, a calm face drawn in a few strong brush lines with no colour, eyes as two black dots, lean, painted in graduated ink washes so edges fade into the background, a wide-sleeved robe and a straw hat, all in black ink and grey wash, a sword whose blade is a single sharp brush stroke, one red seal-stamp shape (invented) at the shoulder, a lone figure in a straw hat whose edges dissolve into ink wash, a straw hat, a brush-stroke blade, a red seal stamp, a brush-drawn face under the straw hat with a single red seal
```

### The Paper Monk

Rare · file: `the-paper-monk.portrait.png`

```text
a wandering scribe-monk of Japanese folklore, elderly, a gentle lined face with closed eyes and a faint calm smile, thin and stooped, always carrying a load of scrolls, a plain grey monk's robe pinned with strips of paper prayer slips, a long calligraphy brush and a bundle of folded paper, ink-stained fingers and a line of black characters (invented, unreadable) on his forearm, a stooped robed figure trailing paper cranes, a calligraphy brush, folded paper cranes, prayer slips, a serene face with a drifting paper crane at one shoulder
```

### Umbrella Yokai

Rare · file: `umbrella-yokai.portrait.png`

```text
an old oiled-paper umbrella come to life, from Japanese folklore, a hundred years old, a single large eye on the umbrella's canopy and a wide grin with a long tongue, an upright umbrella hopping on a single geta-shod leg, none — patched oiled paper and bamboo ribs, a long lolling tongue and a wooden handle used as a limb, a faded blue-and-white pattern on the canopy in an original design, an umbrella on a single wooden sandal with a long tongue trailing, a big single eye, a long tongue, one wooden sandal, the one big eye and a wide grin on the canopy
```

### Yuki-Onna

Rare · file: `yuki-onna.portrait.png`

```text
a snow spirit of Japanese folklore, ageless, a still, beautiful pale face with dark eyes and frost on the lashes, tall and slender, barely touching the ground, a long white kimono trailing into drifting snow, her own cold breath, visible as a white mist, faint ice-blue lines at her throat, a slender white figure dissolving into a swirl of snow at the hem, a trailing white kimono, drifting snow, visible breath, her calm face half hidden by a drift of snow
```

## Norse and Celtic myth (cultural review: medium priority)

11 fighters.

### Banshee

Rare · file: `banshee.portrait.png`

```text
a mourning spirit of Irish folklore, ageless, a pale, tear-streaked woman's face with hollow dark eyes and an open mouth, slight and drifting, feet never quite touching ground, a long grey-white shroud and hair that streams like smoke, a silver comb held in one hand, faint blue veins at her temples, a floating pale figure with long streaming hair and a wide mouth, a silver comb, long streaming hair, a grey shroud, a pale face with open mouth and hollow eyes in fog
```

### Draugr

Core · file: `draugr.portrait.png`

```text
a barrow-dwelling undead warrior of Norse myth, long dead, a grey, desiccated face with sunken pale-blue eyes and a wispy beard, tall and broad, stiff with the cold of the grave, a rusted mail shirt and a cracked, dented helm, a notched rusted axe and a chipped round shield, frost and grave-moss on the armour, a tall helmed figure with an axe, rising from a mound in a cold mist, a rusted axe, a dented helm, grave-mist, a grey face under a dented helm with two pale blue eyes
```

### Fenris

Rare · file: `fenris.portrait.png`

```text
the great wolf of Norse myth, ageless, a huge grey wolf's head with amber eyes and bared, scarred fangs, a wolf the size of a house, straining forward, none — grey fur scarred with old chain marks, fangs and a broken, glowing chain around the neck and forelegs, pale scars where the chain has bitten into the fur, an enormous wolf straining against a chain, jaws wide, a heavy chain, scarred fur, bared fangs, the great grey head with amber eyes and bared fangs
```

### Frost Jötunn

Rare · file: `frost-jotunn.portrait.png`

```text
a frost giant of Norse myth, primeval, a slab-jawed pale-blue face with a beard of icicles and white-rimmed eyes, colossal, thick-limbed, like a walking glacier, a kilt of frozen hide and shoulder plates of blue ice, a club that is a single spike of glacier ice, cracks of pale light running through his skin like ice fissures, a huge broad figure with an ice club against a white sky, an ice club, a beard of icicles, blue ice shoulder plates, a huge pale face with icicle beard and pale eyes
```

### Morrigan, Mother of Crows

Legend · file: `morrigan.portrait.png`

```text
a dark sovereign of Celtic myth, mother of crows, ageless, apparently in her prime, an imposing pale face with dark eyes and a faint cruel calm, tall and regal, wrapped in a cloak that seems to be made of feathers, a long black feathered cloak over dark leather and iron torcs, a slender spear and a great crow perched on her shoulder, blue knotwork war-paint running across the face and hands in an original pattern, a tall cloaked figure ringed by circling crows on a stormy moor, a black feathered cloak, circling crows, iron torcs, a still, pale face with a crow's eye glinting over her shoulder
```

### Púca

Rare · file: `puca.portrait.png`

```text
a shape-shifting spirit of Irish folklore, ageless, a sleek black horse's head with glowing golden eyes and a knowing grin, a lean black horse with a long mane, always half-changing into something else, none — glossy black coat with flecks of grey, iron-shod hooves and a curling goat's horn on one side of the head, a white star on the forehead, a black horse with one horn, mane blowing as if in a wind that is not there, golden eyes, one curled horn, a long black mane, a horse's head with gold eyes and a wide grin
```

### Shieldmaiden Yrsa

Core · file: `shieldmaiden-yrsa.portrait.png`

```text
a shield-bearing warrior woman of Norse saga, a woman in her prime, a broad, freckled face with steady green eyes and a braided fringe, strong, square-shouldered and planted, a leather-and-mail shirt, a plain helm with a nose guard and a wool cloak, a long spear and a big round shield painted in an original knot design, a blue-painted line across her cheekbones, a helmed figure behind a big round shield with a spear over it, a round painted shield, a long spear, a wool cloak, a steady face over the rim of the shield
```

### The Berserker

Core · file: `the-berserker.portrait.png`

```text
a frenzied warrior of Norse saga, a man in his prime, a wild, scarred face with wide pale eyes and a matted beard, heavily muscled, hunched and coiled, a pelt of grey wolf-skin worn over bare shoulders and a leather kilt, two hand axes and teeth-marked wolf-bone charms, blue war-paint knotwork over the chest, a hunched wolf-skinned figure with an axe in each hand, mid-roar, a wolf pelt, two hand axes, war-paint knotwork, a wild face lit by fire, eyes very wide
```

### The Dullahan

Rare · file: `the-dullahan.portrait.png`

```text
a headless horseman of Irish folklore, long dead, no head on the shoulders; a pale head with a wide grin is carried under one arm, tall and lean in the saddle, a long black cloak and dark riding leathers, a whip made of a human spine and a black horse with ember-red eyes, a faint glow from the carried head's eyes, a black-cloaked rider on a black horse with a head held at the hip, a carried head, a spine whip, a black horse, the carried head grinning in profile against the black cloak
```

### The Valkyrie

Rare · file: `the-valkyrie.portrait.png`

```text
a winged chooser of the slain from Norse myth, a woman in her prime, a stern, beautiful face with pale eyes and a fine braid, tall and athletic with wide feathered wings, a winged helm, a burnished mail shirt and a white cloak, a long spear and a round shield, gold knotwork running along the wing feathers in an original design, a helmed winged figure with a raised spear against storm clouds, a winged helm, a long spear, feathered wings, a stern face under a winged helm with one feather drifting past
```

### The Wild Huntsman

Secret · file: `the-wild-huntsman.portrait.png`

```text
a spectral storm-rider of northern legend, ancient, a gaunt shadowed face under a wide hat with two points of pale light for eyes, tall and rangy on a huge black horse, a tattered black cloak and hunting leathers, a long curved hunting horn and a pack of pale hounds, storm-lightning scars across the hands, a horned-hatted rider on a huge horse with hounds streaming behind in a storm, a hunting horn, a pack of pale hounds, a black horse, a gaunt face under a hat brim with two pale eyes
```

## Original, no single culture

16 fighters.

### Behemoth

Legend · file: `behemoth.portrait.png`

```text
a primordial biological horror of prehistoric anatomy, older than the arena, a small, dull-eyed head sunk into heavy bone plates, mountain-sized build compressed to arena scale, none — a stone-like hide serves as armor, tusks and a bone-plated tail, lichen and old fractures across the hide, a vast hunched mass with a ridge of bone plates, stone-like hide, bone-plated tail, the small dull eye and heavy brow plate filling the frame
```

### Calypsa, Queen Beneath the Sea

Legend · file: `calypsa.portrait.png`

```text
a deep-sea queen of ocean legend, ageless, a stern, pale-blue face with dark, wide-set eyes and faint gill-lines along the jaw, tall and poised, flowing at every edge as though underwater, layered abyssal-blue robes that drift like current, a collar of pearl-black scales and a crown of glowing bioluminescent coral, a long staff of pale coral and a globe of suspended water at her open hand, glowing teal spots along the collarbone and hands, a tall figure with a spiked glowing crown and robes that flow upward, with a floating globe of water at one hand, a glowing coral crown, a globe of suspended water, drifting abyssal robes, a stern pale-blue face under a glowing coral crown
```

### Emperor Zero

Legend · file: `emperor-zero.portrait.png`

```text
an ancient machine sovereign of black ceramic and aged metal, millennia old, a smooth, expressionless ceramic mask with a single horizontal glyph-slit, tall, symmetrical and rigid, black ceramic plates over aged bronze-grey metal, with a stiff layered mantle, a slender rod of dark metal engraved with counting marks, glowing original mathematical glyphs in orderly rows across the chest and mask, a perfectly symmetrical crowned figure with a rigid, layered mantle, glowing mathematical glyphs, engraved counting rod, the blank ceramic mask lit by a single row of glyphs
```

### Father Bell

Rare · file: `father-bell.portrait.png`

```text
a human sexton-priest of an original order, weathered late middle age, a kind, tired face with unwavering eyes, stooped but sturdy, patched dark vestments with a rope belt, no real religious insignia, a large hand bell on a worn cord, ash smudged on the brow in an invented mark, a hunched figure holding a bell at arm's length, the hand bell, ash-smudged brow, head bowed slightly, bell cord in hand, lantern glow on one side of the face
```

### Malachar, Lord of the Last Breath

Secret · file: `malachar.portrait.png`

```text
an original necromancer sovereign, more spirit than flesh, ageless, unnervingly calm, a gaunt, partially visible face, unnervingly calm, a towering, long, gaunt silhouette, layered blackened ceremonial armor over ancient funeral robes, a crown formed from uneven fragments of ancient metal, floating fragments of broken gravestones, skeletal motifs original to this design, not copied from any existing fantasy property, a tall gaunt silhouette trailing pale soul-fire, the fragment crown, floating gravestone shards, pale soul-fire, an unnervingly calm three-quarter gaze, soul-fire drifting past
```

### Mason "Moonshot" Maddox

Core · file: `moonshot-maddox.portrait.png`

```text
human, prime athletic adulthood, a confident, competitive expression, powerful athletic build, a completely original cream and dark-red uniform with plain, unmarked panels and no real-world team or sponsor identity, a wooden bat, resting over one shoulder, dirt and chalk marks around his cleats, a classic power-hitter stance silhouette, the wooden bat, cream and dark-red uniform, confident three-quarter turn, bat resting on one shoulder
```

### Mister Whiskers

Core · file: `mister-whiskers.portrait.png`

```text
a small black cat, ageless, though he looks like an ordinary young cat, bright intelligent eyes and slightly crooked whiskers, small and sleek, a tiny damaged collar carrying an unidentified original charm, none visible — his claws and the collar charm are the only props, solid black fur with no distinguishing patches, an ordinary small housecat silhouette, deceptively unthreatening, the damaged collar charm, subtle impossible shadows extending behind him, head tilted, one eye slightly narrowed in mischief
```

### Patient Zero

Core · file: `patient-zero.portrait.png`

```text
a reanimated zombie, patient zero of an original plague, died in early adulthood, appearance frozen since, sunken eyes, greyed skin, an expression caught between hunger and hollow grief, gaunt and shambling, stronger than the frame suggests, tattered original hospital-gown-like wrappings, no real-world medical branding, none — bites and grasping hands are the whole kit, spreading dark infection veins visible beneath greyed skin, a stooped, shambling humanoid outline, spreading infection veins, tattered original wrappings, hollow stare directly at the camera, infection veins faintly visible at the temple
```

### The Black Knight

Legend · file: `black-knight.portrait.png`

```text
an unidentifiable armored warrior; nothing of the person inside is visible, unknowable, a blank, unmarked black visor with no eye slits, tall, broad and rigidly upright, nearly featureless blackened plate armor with cracked seams, an enormous weathered greatsword planted point-down, cracked pale light leaking through every seam of the armor, a towering armored figure leaning on a huge sword, enormous weathered sword, seams of cracked pale light, the blank visor turned toward the viewer, cracks of light across the brow
```

### The Gambler

Secret · file: `the-gambler.portrait.png`

```text
a human card sharp of uncertain origin, middle-aged, a relaxed half-smile and hooded, calculating eyes, lean and languid, a rumpled long coat over a patterned waistcoat, a fanned hand of blank-faced cards and a pair of bone dice, a gold tooth and ink-stained fingertips, a lounging figure fanning cards under a low hat brim, fanned blank cards, bone dice, a half-smile under the hat brim, lamp catching the gold tooth
```

### The Gatekeeper

Secret · file: `the-gatekeeper.portrait.png`

```text
a tireless guardian of a final gate of tall tales, ageless, a blank, plated helm with a single vertical slit and a faint white light behind it, huge, broad and utterly still, heavy dark-iron plate armour with a long grey tabard bearing a plain empty circle, and a single iron key on a chain, a long-hafted halberd taller than he is and a great iron key, a pale white light seeping through every seam of the armour, an enormous still armoured figure with a tall halberd beside a huge stone gate, a tall halberd, a great iron key, a plated slit helm, a blank plated helm with a vertical slit of white light
```

### The Lawyer

Secret · file: `the-lawyer.portrait.png`

```text
a slick, tireless trial lawyer of comic legend, a man in his forties, a broad, confident grin, slicked-back hair and heavy-lidded eyes that have never lost an argument, tall, sharp-shouldered and theatrical, a razor-sharp charcoal three-piece suit with a gold tie-pin, a long black gown thrown over one shoulder and gleaming shoes, a bulging leather briefcase, a gavel-headed cane and a rolled scroll, a thin gold ring on every finger, a sharp-shouldered figure with a raised finger, a briefcase and a long gown, a bulging briefcase, a gavel-headed cane, a rolled scroll, a confident grin over a gold tie-pin
```

### The Nameless One

Legend · file: `the-nameless-one.portrait.png`

```text
an uncanny humanoid sovereign whose appearance seems partially missing from reality, impossible to judge, a face that the eye slides off, with parts simply absent, as if never drawn, tall, regal and subtly wrong in its proportions, ceremonial regalia whose edges fade into nothing, no visible weapon; one hand always slightly out of focus, one impossible white fracture running through the whole figure, a tall regal figure split by a single thin white fracture, the white fracture, missing edges, the almost-absent face, one edge of it simply missing
```

### The Plague Doctor

Core · file: `plague-doctor.portrait.png`

```text
a human physician of an invented plague-stricken city, indeterminate behind the mask, a long-beaked leather mask with round glass eyepieces, tall and narrow, a waxed black coat, wide-brimmed hat and gloves, a satchel of corked vials and a long cane, faded chalk tally marks along the coat hem, a tall beaked silhouette under a wide brim, the beaked mask, corked vial satchel, beaked mask turned three-quarters, glass eyepieces catching lantern light
```

### The Tax Collector

Rare · file: `the-tax-collector.portrait.png`

```text
a relentless revenue collector of dry-humoured tall tales, a man in his fifties, a thin, joyless face with a sharp nose, rimless spectacles and a permanent pinched frown, narrow, stooped and precise, a grey pinstriped suit, a high starched collar, black sleeve-guards and a battered black bowler hat, a heavy brass-bound ledger and a long quill pen, ink stains up both cuffs, a narrow stooped figure in a bowler hat clutching a huge ledger under one arm, a heavy ledger, a quill pen, a black bowler hat, a pinched frown behind rimless spectacles
```

### Tortuga Rex

Core · file: `tortuga-rex.portrait.png`

```text
ancient anthropomorphic turtle, impossibly old, timeless, weathered reptilian face with a calm, intimidating expression, never a cartoon smile, low, broad, powerfully built with thick forearms, fragments of ancient bronze armor attached around the shoulders and wrists, none — fights bare-handed and shell-first, old battle scars across weathered reptilian skin, a massive, cracked, fortress-like shell carved with original geometric markings, carved geometric shell markings, bronze armor fragments, calm intimidating gaze toward the camera, ruined arena stonework softly blurred behind him
```

## Slavic folklore (cultural review: high priority)

12 fighters.

### Baba Yaga

Rare · file: `baba-yaga.portrait.png`

```text
an ancient witch of Slavic folklore, impossibly old, a hooked nose, sharp chin and bright suspicious eyes, bent and wiry with surprising strength, layered patched shawls and a knotted headscarf, a wooden mortar and a broom-like pestle, soot smudges and ash-grey hair in long braids, a hunched figure standing in a wooden mortar, the mortar and pestle, the hut on chicken legs, leaning in from the side with a knowing grin, hearth glow on her face
```

### Domovoi

Core · file: `domovoi.portrait.png`

```text
a household spirit of Slavic folklore, an old man in appearance, a small wrinkled face with a thick grey beard and bright watchful eyes, short, stout and shaggy, a patched wool coat and felt boots, a short-handled broom and a ring of house keys, soot smudges on his cheeks, a small bearded figure with a broom beside a warm glowing stove, a broom, a ring of keys, a warm stove glow, a bearded face lit orange by the stove, one eye narrowed
```

### Father Frost

Rare · file: `father-frost.portrait.png`

```text
a winter lord of Slavic folklore, an old man in appearance, a stern white-bearded face with pale blue eyes and a red nose from the cold, tall and broad, heavy with layered furs, a long embroidered blue coat trimmed with white fur and a tall fur hat, a tall staff topped with a crystal of ice, frost patterns creeping across the coat, a tall bearded figure with a fur hat and a staff on a snowy road, an ice-crystal staff, an embroidered blue coat, a sack of gifts, a white-bearded face rimed with frost, pale blue eyes
```

### Koschei the Deathless

Secret · file: `koschei.portrait.png`

```text
a gaunt sorcerer of Slavic folklore who cannot die, centuries old, a bone-pale narrow face with pale, patient eyes, tall, skeletal and unnaturally still, a heavy fur-trimmed coat over iron-studded leather, a long staff hung with small locked reliquaries, frost creeping across the knuckles, a tall thin figure with a hanging cluster of small chests, small locked reliquaries, frost-rimed staff, pale eyes level, frost gathering on the collar
```

### Leshy

Core · file: `leshy.portrait.png`

```text
a forest spirit of Slavic folklore, ancient, a long, bark-textured face with moss for a beard and two deep-green eyes, tall, gaunt and knotted like a tree, a cloak of leaves and lichen, worn back to front, a crooked staff of living wood, pale mushroom clusters growing along his shoulders, a tall thin figure whose antlered head merges with the branches behind him, a living wood staff, moss beard, mushrooms on the shoulders, a moss-bearded face half hidden in branches, green eyes
```

### Marya the Warrior

Rare · file: `marya-the-warrior.portrait.png`

```text
a folk-tale heroine and warrior of the Slavic steppe and forest, a woman in her prime, a strong, sun-browned face with a firm jaw, grey eyes and a long fair braid, broad-shouldered and athletic, a chain-mail shirt over a red embroidered tunic and a plain steel cap, a curved sabre and a round painted shield, a faded scar over one eyebrow, a braided warrior beside a big horse with a sabre raised, a curved sabre, a round shield, a long braid, a firm face under a steel cap, braid over one shoulder
```

### One-Eyed Likho

Rare · file: `one-eyed-likho.portrait.png`

```text
a misfortune spirit of Slavic folklore, an old woman in appearance, a gaunt, sallow face with a single huge eye in the centre of her forehead and a toothless grin, tall, bent and thin, trailing rags, layers of grey patched rags tied with old rope, a walking stick and a sack of bad news, a milky scar where the second eye should be, a bent, ragged figure with a single glowing eye on a road at dusk, one huge eye, a ragged sack, a walking stick, the single huge eye filling the frame under a ragged hood
```

### Rusalka

Rare · file: `rusalka.portrait.png`

```text
a drowned maiden spirit of Slavic folklore, a young woman, long dead, a pale, beautiful face with sea-green eyes and a sad smile, slender, dripping, half in the water, a wet white shift and a wreath of river reeds, long green hair that moves like weed and a wreath of water lilies, faint blue-veined skin, a slim figure rising from a dark river with long hair trailing into the water, a reed wreath, long weed-green hair, river water, a pale face just above the waterline with lilies in her hair
```

### The Birch Witch

Rare · file: `the-birch-witch.portrait.png`

```text
a forest witch of Slavic folklore, old and wiry, a narrow pale face with sunken cheeks and pale birch-white eyebrows, thin and straight like a sapling, a layered dress of peeling white birch bark and grey linen, a bundle of birch switches and a small wooden cup, black birch-bark stripes along her arms, a thin white-clad figure among birch trunks holding a bundle of switches, birch switches, peeling bark dress, a wooden cup of sap, a narrow pale face half hidden by a fold of bark
```

### The Firebird

Rare · file: `the-firebird.portrait.png`

```text
a fire-feathered bird of Slavic folklore, ageless, a proud bird's head with a golden crest and glowing amber eyes, a long-tailed bird the size of a horse, wings wide, none — feathers of red, gold and orange that glow like coals, trailing tail feathers that burn without being consumed, ornamental gold scrollwork patterns along the wings in an original folk style, a bird with a huge fanned tail of long feathers, lit from within, glowing tail feathers, a golden crest, cinders in the air, the bird's head turned, amber eye bright, sparks drifting off the crest
```

### The Midnight Tsar

Secret · file: `the-midnight-tsar.portrait.png`

```text
a dead ruler of a Slavic folk tale, still sitting his throne, long dead, a gaunt grey face under a heavy crown, eyes like two small cold lamps, tall, stiff and upright, hands folded on the arms of a throne, a heavy embroidered robe of midnight blue and dull gold with a high fur collar, a jewelled scepter and a gold orb, frost gathered in the folds of the robe, a crowned figure seated on a tall throne against a starless sky, a heavy crown, a scepter, a gold orb, a crowned face in cold light with two pale eyes
```

### Zmey Gorynych

Rare · file: `zmey-gorynych.portrait.png`

```text
a three-headed dragon of Slavic folklore, ancient, three dragon heads: one wreathed in flame, one heavy-jawed and bare, one with venom-green eyes, a huge winged serpentine body with a long spiked tail, overlapping dark red scales, fire, fangs and a barbed tail, gold ornament-like patterning along the wing edges in an original folk style, a huge winged body with three long necks rising from it against a burning sky, three heads, wide wings, a barbed tail, the three heads side by side, each with a different eye colour
```

## Sport and stage

11 fighters.

### Ace

Rare · file: `ace.portrait.png`

```text
a poised tennis professional of court tall tales, a woman in her mid-twenties, a sharp, focused face with a sweatband, narrowed eyes and a steady jaw, lean, athletic and light on her feet, a crisp white tennis dress with a green trim, a green visor and white wristbands, a wooden-framed racket and a can of yellow balls, a green wristband on the racket arm, a lean figure in mid-serve with the racket high and a yellow ball at the top of its arc, a wooden racket, a green visor, a yellow ball, a focused face under a green visor
```

### Chef Ramble

Rare · file: `chef-ramble.portrait.png`

```text
a furious restaurant chef of kitchen-nightmare legend, a man in his forties, a red-faced, scowling face with a huge moustache and wild grey eyebrows under a crumpled chef's hat, stocky, barrel-chested and sweating, a stained white chef's jacket with rolled sleeves, a checked apron, and burnt oven mitts, a huge cleaver and a smoking cast-iron pan, burn scars and old knife-nicks along both forearms, a stocky red-faced figure in a tall crumpled chef's hat with a cleaver raised in one hand and a smoking pan in the other, a tall crumpled chef's hat, a huge cleaver, a smoking cast-iron pan, a red-faced scowl under a crumpled chef's hat
```

### DJ Cataclysm

Rare · file: `dj-cataclysm.portrait.png`

```text
a turntable sorcerer of neon club legend, a woman in her thirties, a cool, smirking face behind mirrored cyan visor-glasses with a shaved-side undercut, tall, lean and hunched over decks, a silver reflective jacket over a black bodysuit, oversized headphones and fingerless gloves, a pair of glowing turntables and a cloud of floating vinyl discs, cyan waveform lines glowing along the hands and jaw, a hunched figure behind a pair of turntables with vinyl discs orbiting overhead, glowing turntables, oversized headphones, orbiting vinyl discs, a smirk behind mirrored cyan visor-glasses
```

### El Magnífico

Rare · file: `el-magnifico.portrait.png`

```text
a masked wrestling showman of arena tall tales, a man in his thirties, a full-face silver-and-emerald mask with gold trim, two dark eye-holes and a fierce mouth-slit, broad-shouldered and barrel-chested, a sequinned emerald cape, a gold championship belt, silver trunks and laced wrestling boots, a heavy gold belt and a rolled-up cape, gold thread outlines round the eye-holes of the mask, a broad masked figure on a ring corner post with a cape streaming behind, a silver-and-emerald mask, a sequinned cape, a gold belt, a silver-and-emerald mask with fierce dark eye-holes
```

### Fourth & One

Rare · file: `fourth-and-one.portrait.png`

```text
a battered veteran running back of stadium tall tales, a man in his thirties, a square, stubbled face with a broken nose, eye-black stripes and a calm squint, compact, thick-legged and heavily padded, a scuffed red-and-white armoured jersey with a large number, shoulder pads, a cracked helmet and tape-wrapped wrists, a worn leather football tucked under one arm, eye-black stripes and old tape on both wrists, a low, padded figure charging with a ball under one arm and a cracked helmet, a scuffed helmet, a padded jersey, a leather football, a stubbled face with eye-black and a calm squint under a cracked helmet
```

### Johnny Feedback

Rare · file: `johnny-feedback.portrait.png`

```text
a supernatural punk guitarist of stage legend, a man in his late twenties, a sneering, sweaty face with a mohawk of sharp blue spikes and heavy black eyeliner, wiry and restless, a studded black leather vest over a torn band-less T-shirt, ripped jeans and battered boots, a scarred electric guitar with a cracked body and a cable that trails off into the dark, electric-blue crackles running along the forearms and neck, a wiry spiky-haired figure leaning back with a guitar and a cable trailing behind, a cracked electric guitar, a spiked blue mohawk, a studded vest, a sneering face with blue spikes and heavy eyeliner
```

### Orpheon, the Final Song

Legend · file: `orpheon.portrait.png`

```text
a supernatural composer-warrior of legend, ageless, a calm, luminous face with closed eyes and a faint listening smile, tall, poised and armoured in flowing layers, a long coat of layered midnight-blue cloth over pale ceremonial armour, threaded with glowing staff lines, an impossible instrument of floating strings and glowing sound-rings, with a baton-like blade, glowing staff lines of light running down both arms, entirely original notation, a tall poised figure with an impossible floating instrument and rings of light around it, an impossible floating instrument, glowing staff lines, a midnight-blue coat, a calm face with closed eyes lit gold from below
```

### The Contender

Core · file: `the-contender.portrait.png`

```text
a determined heavyweight boxer of ring tall tales, a man in his thirties, a swollen-browed, stubborn face with a taped cut over one eye and a steady stare, broad, thick-armed and slightly hunched, scuffed red gloves, faded grey trunks with a white waistband, bandaged wrists and worn boots, a pair of scuffed red boxing gloves and a dented water bottle, a taped cut above the left eye, a hunched figure in gloves held high in a guard with a towel over one shoulder, red boxing gloves, a taped cut brow, a towel over the shoulder, a taped cut brow over a steady stare
```

### The Gunslinger QB

Rare · file: `the-gunslinger-qb.portrait.png`

```text
a swaggering quarterback of stadium tall tales, a man in his late twenties, a confident grin under a scuffed helmet with a clear visor and a strip of white tape across the nose, tall, lean and loose-armed, a dusty blue jersey with a large number, a padded vest, tape-wrapped fingers and a long towel at the belt, a leather football held like a pistol, a long white scar across the throwing hand, a tall lean figure cocked back with a football raised like a pistol, a clear-visor helmet, a football held like a pistol, a belt towel, a confident grin under a clear visor
```

### The Mime

Rare · file: `the-mime.portrait.png`

```text
a white-faced street mime of theatre legend, ageless, a chalk-white painted face with a thin black-lined smile, exaggerated arched brows and a single painted tear, slim and precise in every gesture, a black-and-white striped shirt, black braces, a small bowler hat and white gloves, an invisible box outlined by faint pale lines in the air, a single black painted tear under one eye, a slim figure in a bowler hat with both palms pressed against an invisible wall, a bowler hat, white gloves, faint outlines of an invisible box, a chalk-white face with a painted tear
```

### The Referee

Secret · file: `the-referee.portrait.png`

```text
a stern, impartial human official of an invented sport, middle-aged, a lined, unsmiling face with a whistle clamped between the teeth, lean and upright, a black-and-white striped official's jersey with a plain unbranded collar, a silver whistle, a folded red card and a yellow flag, a neat armband with a plain circular mark, a thin upright figure with one arm raised holding a card, silver whistle, red card, yellow flag, level stare over the whistle
```

## World folklore (several cultures) (cultural review: high priority)

12 fighters.

### Anansi

Rare · file: `anansi.portrait.png`

```text
a clever spider-man of West African folk tales, ageless, a sly, laughing face with too many bright eyes above the brow, wiry and long-limbed, with a second pair of thin arms folded at his back, a patchwork waistcoat sewn from bright story-cloth and a wide straw hat, a ball of glittering silk thread and a small carved story drum, silver thread-lines running along the arms, a thin, many-armed figure crouched under a hat with a web behind him, a straw hat, story-cloth waistcoat, a ball of silk thread, a laughing face with several bright eyes under a straw hat
```

### Dokkaebi

Rare · file: `dokkaebi.portrait.png`

```text
a mischievous goblin of Korean folk tales, ageless, a wide grin, a single short horn and bright playful eyes, stocky and springy, a rough hanbok-style jacket, a fur-trimmed hat and a bright sash, a big knobbly magic club and a pouch that spills gold, small painted red stripes on the cheeks, a stocky horned figure carrying a huge knobbly club over one shoulder, a knobbly magic club, a pouch of gold, a single horn, a wide grin under one short horn
```

### Jiangshi

Core · file: `jiangshi.portrait.png`

```text
a hopping corpse of Chinese folk horror, long dead, a pale, blank face with sunken eyes and a yellow paper charm stuck to the forehead, stiff and upright with the arms held straight out, a dark Qing-style official's robe and a tall stiff hat, long dark nails and a strip of yellow paper, faded red writing-free brush marks on the charm, a stiff figure with arms outstretched and a paper charm on the brow, a paper charm on the brow, outstretched arms, an official's tall hat, a pale face under a tall hat with a charm on the forehead
```

### Madame Fortuna

Legend · file: `madame-fortuna.portrait.png`

```text
a supernatural fortune master of travelling-fair legend, ageless, a poised, elegant face with a knowing smile and eyes that seem to show a card in each pupil, tall, graceful and theatrical, an elegant dark-violet theatre gown with gold trim and a tall feathered headdress, a floating fan of playing cards and a pair of gold dice, broken circular probability symbols drawn in gold on the sleeves, entirely original, a tall theatrical figure with a fan of cards and dice floating round her, floating cards, gold dice, a feathered headdress, a poised face with a knowing smile and gold-flecked eyes
```

### The Ghoul

Rare · file: `the-ghoul.portrait.png`

```text
a graveyard-haunting desert ghoul of Arabian tales, ancient, a gaunt, hollow-cheeked face with a wide jaw and pale eyes, stooped, long-armed and thin, tattered burial shrouds and a ragged cloak dusted with sand, long grey claws, grave dirt caked along the arms, a hunched, long-armed figure among broken headstones under a thin moon, ragged shrouds, long claws, broken headstones, a gaunt face with pale eyes and a wide jaw
```

### The Monkey Trickster

Rare · file: `the-monkey-trickster.portrait.png`

```text
a stone-born monkey king of Chinese folk tales, ageless, a grinning, bright-eyed monkey face with a golden-brown fur ruff, agile and wiry, a tiger-skin kilt, a golden headband and light red armour plates, a long iron-banded staff and a peach in one hand, a golden headband with no writing on it, a lean monkey figure balanced on a small cloud with a long staff, a long staff, a golden headband, a small cloud, a grinning monkey face under a golden headband
```

### The Moon Rabbit

Rare · file: `the-moon-rabbit.portrait.png`

```text
a white rabbit of the moon from East Asian folk tales, ageless, a soft round face with long ears and calm, large dark eyes, small and round, kneeling, a simple pale robe and a red sash, a big stone mortar and a heavy pestle, faint silver crescents on the ears, a small kneeling rabbit with a mortar under a huge full moon, a stone mortar, a heavy pestle, long ears, a calm rabbit face under long ears in moonlight
```

### The Roc

Rare · file: `the-roc.portrait.png`

```text
a colossal bird of prey from Arabian tales, ancient, a fierce hooked beak and small gold eyes, enormous, broad-winged and feathered, layered brown and gold feathers with a crest of long plumes, huge dark talons, gold-tipped primary feathers, a vast winged bird casting a shadow over a tiny cliff and a village, gold-tipped wings, a crest of plumes, huge talons, a hooked beak and one gold eye
```

### The Storyteller

Rare · file: `the-storyteller.portrait.png`

```text
a travelling teller of tales from many lands, an old man with young eyes, a warm, lined face with a white moustache and bright eyes, stooped, comfortable and round-shouldered, a patched travelling cloak, a scarf of many colours and worn boots, a big storybook with pressed flowers between the pages and a walking stick, ink stains on the fingertips, a stooped figure with a big open book and a walking stick beside a small fire, a big storybook, a walking stick, a colourful scarf, a warm lined face lit by fire
```

### The Thousand-Faced Stranger

Secret · file: `the-thousand-faced-stranger.portrait.png`

```text
a shape-changing wanderer of many folk tales, of no fixed age, a smooth, half-finished face like a carved mask with different features glimpsed at the edges, of medium height and no particular shape, a plain grey travelling cloak over a patchwork of faded coloured cloth, a string of small wooden masks hung at the belt, none, except a faint seam along the jaw, a hooded figure with a string of small masks at the belt, a string of wooden masks, a grey cloak, a faint jaw seam, a smooth half-finished face with a jaw seam
```

### The Wandering Genie

Rare · file: `the-wandering-genie.portrait.png`

```text
a lamp-bound genie of Arabian Nights tales, ageless, a tired, kind face with a neat beard and glowing amber eyes, tall, slender and trailing into smoke below the waist, loose blue silks, gold cuffs and a small folded turban, a dented brass lamp and three small floating gold lights, a faint spiral of smoke-blue light around the wrists, a tall figure holding a brass lamp with three small lights floating above it, a brass lamp, three gold lights, gold cuffs, a tired kind face lit amber from below
```

### The White Fox

Rare · file: `the-white-fox.portrait.png`

```text
a white fox spirit of folk tales, ageless, a narrow, gentle face with pale gold eyes and long white whiskers, lithe and light on her feet, a flowing white and pale-blue robe with long sleeves, a few small floating flames of pale light, soft grey paw-print patterns along the sleeves, a slim figure in a long-sleeved robe with a big white tail curling behind, a big white tail, long sleeves, small pale flames, a gentle fox face with pale gold eyes
```

