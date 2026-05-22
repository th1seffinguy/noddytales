# Content QA — Grammar / Comedy lint

Generated: 2026-05-22T15:14:29.108Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)

## Hard checks (joke-breakers)

| Check | Hits | % of sample |
|---|---|---|
| Title bare third-person-singular verb after Cole | 0 | 0.0% |
| Plural noun followed by singular "was" | 0 | 0.0% |
| Singular article + plural-only noun (a binoculars-class) | 1 | 1.0% |
| Duplicate article ("the the", "a a", "an an") | 0 | 0.0% |
| Lowercase letter starts a sentence after period/!/? | 0 | 0.0% |
| Sky-class noun placed on someone's head physically | 0 | 0.0% |

## Glue-phrase frequencies (warn if > 25%)

| Phrase | Hits | % of sample | Warn? |
|---|---|---|---|
| glow | 12 | 12.0% |  |
| room_picked_up | 12 | 12.0% |  |
| just_to_make | 8 | 8.0% |  |
| possibly_memory | 0 | 0.0% |  |
| act_normal | 3 | 3.0% |  |
| meant_business | 3 | 3.0% |  |

## Sample hits (first 3 per check)

### Singular article + plural-only noun (a binoculars-class)

- _(age 10 big)_ `...he crucial prop was a binoculars.
The binoculars just gave up. It sat there. Completely uncooperativ...`


## Notes

- This script is DIAGNOSTIC, not a release gate. The release gate is qa-current.js Section 18.
- Glue-phrase threshold is configurable in this file (GLUE_THRESHOLD = 0.25).
- The "lowercase_sentence_start" check sometimes false-positives on stylized lowercase shouts (e.g. `"glorp!" said Cole. then the chick...`) — review hits manually.
