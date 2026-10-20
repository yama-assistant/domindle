# Domindle

A daily guessing game about the card game Dominion, in the style of loldle/pokedle. Each day every player gets the same puzzle and tries to identify a Dominion card.

## Language

### Catalog

**Card**:
A single, distinctly named physical card from a Dominion Supply or non-Supply pile, with its own artwork. Each card in a split pile is its own Card.
_Avoid_: Kingdom card (too narrow), entry

**Catalog**:
Domindle's own list of every Card, Landscape, Extra and Pile Placeholder, with their categories. The single source the game reads from.

**Landscape**:
A horizontal card-shaped thing laid out in the kingdom: Event, Landmark, Project, Way, Ally, Trait, Prophecy. Its specific kind (Event, Way, …) may be used in its place. Catalogued and categorized, but not yet playable.
_Avoid_: Card-shaped thing, non-card

**Extra**:
A horizontal card-shaped thing used in a game but not laid out in the kingdom: Boon, Hex, State, Artifact. Catalogued and categorized, but not yet playable.

**Split Pile**:
A Supply pile made of several differently named Cards (e.g. the Augurs pile: Herb Gatherer, Acolyte, Sorceress, Sibyl).

**Pile Placeholder** (PP):
A Catalog entry that names a whole split pile rather than a single Card (e.g. "Augurs"). Never a Card; ignored by the game.
_Avoid_: Pile card

**Expansion**:
A published Dominion set (e.g. Base, Intrigue, Seaside). Promos are grouped as their own Expansion.
_Avoid_: Set, box

**Edition**:
The printing of an Expansion (1st or 2nd). When a Card exists only in a 1st edition superseded by a 2nd, it is a **Removed Card** — catalogued but not yet playable.

### Game

**Mode**:
One kind of daily guessing game (e.g. Art Mode). Each Mode has its own Daily Puzzle.

**Art Mode**:
The Mode in which players identify a Card from its artwork.

**Daily Puzzle**:
The one puzzle of a given Mode for a given calendar day, identical for every player.

**Answer**:
The Card a Daily Puzzle is asking for. Any Card except a Removed Card can be an Answer.
_Avoid_: Solution, target

**Answer Formula**:
The rule that derives a Day's Answer from the Day and the Catalog, with nothing stored. Days are drawn independently, except that a Day's Answer is never the previous Day's. A Catalog change may change the Answer of Days, past ones included.

**Guess**:
A Card a player submits as their attempt at the Answer. Any Card that can be an Answer can be Guessed. Guesses are unlimited; a player's **Score** is the number of Guesses they needed.

**Streak**:
The number of consecutive Days on which a player solved the Daily Puzzle. A Day not solved by midnight UTC resets it.

**History**:
The record of every Day a player solved, each with its Score, kept for stats such as the Streak. Days left unsolved are not recorded.

**Day**:
A calendar date in UTC. The Daily Puzzle changes at midnight UTC.
