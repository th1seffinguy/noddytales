# Content QA — Grammar / Comedy lint

Generated: 2026-05-22T01:31:26.753Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)

## Hard checks (joke-breakers)

| Check | Hits | % of sample |
|---|---|---|
| Title bare third-person-singular verb after Cole | 0 | 0.0% |
| Plural noun followed by singular "was" | 0 | 0.0% |
| Singular article + plural-only noun (a binoculars-class) | 1 | 1.0% |
| Duplicate article ("the the", "a a", "an an") | 1 | 1.0% |
| Lowercase letter starts a sentence after period/!/? | 14 | 14.0% |
| Sky-class noun placed on someone's head physically | 0 | 0.0% |

## Glue-phrase frequencies (warn if > 25%)

| Phrase | Hits | % of sample | Warn? |
|---|---|---|---|
| glow | 11 | 11.0% |  |
| room_picked_up | 24 | 24.0% |  |
| just_to_make | 10 | 10.0% |  |
| possibly_memory | 4 | 4.0% |  |
| act_normal | 5 | 5.0% |  |
| meant_business | 6 | 6.0% |  |

## Sample hits (first 3 per check)

### Singular article + plural-only noun (a binoculars-class)

- _(age 11 tween)_ `...ood there with half a binoculars and a decision to make.
The binoculars failed exactly on cue. Cole...`

### Duplicate article ("the the", "a a", "an an")

- _(age 12 tween)_ `...ly Normal Pigeon
At the the back of the bus, Cole had committed to one thing: the vending machine pr...`

### Lowercase letter starts a sentence after period/!/?

- _(age 8 big)_ `..., Cole set everything up. The theatrical moth practiced its part. The whistle sat front and center....`
- _(age 11 tween)_ `...lanned at the weird stairwell. The panda was on board, technically. The mascot head was the centerpi...`
- _(age 12 tween)_ `...rcade. The pigeon was on board, technically. The tiny clipboard was the centerpiece. Nobody had aske...`


## Notes

- This script is DIAGNOSTIC, not a release gate. The release gate is qa-current.js Section 18.
- Glue-phrase threshold is configurable in this file (GLUE_THRESHOLD = 0.25).
- The "lowercase_sentence_start" check sometimes false-positives on stylized lowercase shouts (e.g. `"glorp!" said Cole. then the chick...`) — review hits manually.
