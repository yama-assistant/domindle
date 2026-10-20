# Answer Formula replaces the stored Answer Schedule

Supersedes [0001](0001-append-only-answer-schedule.md).

A Day's Answer is computed from the Day and the Catalog: among the Cards that can be Answers, the one with the highest `hash(salt, day, id)` wins, ignoring the previous Day's winner so the same Card never comes two Days in a row. The salt is a public constant in the code. Nothing is stored, so there is no schedule to generate, commit or keep topped up.

The stored, append-only schedule guaranteed that a Day meant the same Answer forever, at the cost of a generator script, a committed data file and a CI check that it hadn't run low. That guarantee isn't needed: the History stores only each solved Day and its Score, so stats never depend on which Card was the Answer, and the only place a past Answer is shown is the footer's "Yesterday's answer".

Picking by index (`ids[hash(day) mod N]`) was rejected because any change to the number of Cards would change almost every Day. Highest-hash-wins changes only the Days a added or removed Card wins, about 1/N of them, which keeps a Catalog change from disturbing today's Answer in the common case.

## Consequences

- A Catalog change can change the Answer of any Day, including today's and yesterday's. Deploy Catalog changes just after midnight UTC where possible. A wrong "Yesterday's answer" after such a deploy is accepted.
- The previous Day's winner is computed without its own exclusion, so in rare cases (about once per N² Days) a Day repeats the previous Day's published Answer. Accepted.
- Cards can repeat on non-adjacent Days; there is no cycle guaranteeing every Card appears before any repeats.
- The formula and salt ship in the client, so anyone determined can compute future Answers.
- Removing a Card from the pool only changes the Days it won.
