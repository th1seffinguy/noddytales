# Content QA — Grammar / Comedy lint

Generated: 2026-06-05T01:39:48.446Z
Sample: 2000 V3 stories (random ages 2-13; 0 nulls)

## Hard checks (joke-breakers)

| Check | Hits | % of sample |
|---|---|---|
| Title bare third-person-singular verb after Cole | 0 | 0.0% |
| Plural noun followed by singular "was" | 0 | 0.0% |
| Singular article + plural-only noun (a binoculars-class) | 0 | 0.0% |
| "one" + plural-only food/mcguffin noun (one cupcakes-class) | 0 | 0.0% |
| "a" + vowel-start mood (a overexcited-class article mismatch) | 0 | 0.0% |
| hyphen-"ly" adverb artifact ("clumsy-ly" / "professionally unhinged-ly") | 0 | 0.0% |
| Duplicate article ("the the", "a a", "an an") | 0 | 0.0% |
| Lowercase letter starts a sentence after period/!/? | 0 | 0.0% |
| Sky-class noun placed on someone's head physically | 0 | 0.0% |

## Glue-phrase frequencies (warn if > 25%)

| Phrase | Hits | % of sample | Warn? |
|---|---|---|---|
| glow | 0 | 0.0% |  |
| room_picked_up | 0 | 0.0% |  |
| just_to_make | 208 | 10.4% |  |
| possibly_memory | 0 | 0.0% |  |
| act_normal | 42 | 2.1% |  |
| meant_business | 0 | 0.0% |  |

## Sample hits (first 3 per check)


## Notes

- This script is DIAGNOSTIC, not a release gate. The release gate is qa-current.js Section 18.
- Glue-phrase threshold is configurable in this file (GLUE_THRESHOLD = 0.25).
- The "lowercase_sentence_start" check sometimes false-positives on stylized lowercase shouts (e.g. `"glorp!" said Cole. then the chick...`) — review hits manually.
