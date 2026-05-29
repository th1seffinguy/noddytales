# Content QA — Grammar / Comedy lint

Generated: 2026-05-29T00:03:31.044Z
Sample: 1000 V3 stories (random ages 2-13; 0 nulls)

## Hard checks (joke-breakers)

| Check | Hits | % of sample |
|---|---|---|
| Title bare third-person-singular verb after Cole | 0 | 0.0% |
| Plural noun followed by singular "was" | 0 | 0.0% |
| Singular article + plural-only noun (a binoculars-class) | 0 | 0.0% |
| Duplicate article ("the the", "a a", "an an") | 0 | 0.0% |
| Lowercase letter starts a sentence after period/!/? | 0 | 0.0% |
| Sky-class noun placed on someone's head physically | 0 | 0.0% |

## Glue-phrase frequencies (warn if > 25%)

| Phrase | Hits | % of sample | Warn? |
|---|---|---|---|
| glow | 0 | 0.0% |  |
| room_picked_up | 0 | 0.0% |  |
| just_to_make | 106 | 10.6% |  |
| possibly_memory | 0 | 0.0% |  |
| act_normal | 38 | 3.8% |  |
| meant_business | 0 | 0.0% |  |

## Sample hits (first 3 per check)


## Notes

- This script is DIAGNOSTIC, not a release gate. The release gate is qa-current.js Section 18.
- Glue-phrase threshold is configurable in this file (GLUE_THRESHOLD = 0.25).
- The "lowercase_sentence_start" check sometimes false-positives on stylized lowercase shouts (e.g. `"glorp!" said Cole. then the chick...`) — review hits manually.
