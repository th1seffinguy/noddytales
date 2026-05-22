# Content QA — Grammar / Comedy lint

Generated: 2026-05-22T14:33:47.932Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)

## Hard checks (joke-breakers)

| Check | Hits | % of sample |
|---|---|---|
| Title bare third-person-singular verb after Cole | 0 | 0.0% |
| Plural noun followed by singular "was" | 0 | 0.0% |
| Singular article + plural-only noun (a binoculars-class) | 0 | 0.0% |
| Duplicate article ("the the", "a a", "an an") | 2 | 2.0% |
| Lowercase letter starts a sentence after period/!/? | 16 | 16.0% |
| Sky-class noun placed on someone's head physically | 0 | 0.0% |

## Glue-phrase frequencies (warn if > 25%)

| Phrase | Hits | % of sample | Warn? |
|---|---|---|---|
| glow | 11 | 11.0% |  |
| room_picked_up | 5 | 5.0% |  |
| just_to_make | 11 | 11.0% |  |
| possibly_memory | 8 | 8.0% |  |
| act_normal | 4 | 4.0% |  |
| meant_business | 6 | 6.0% |  |

## Sample hits (first 3 per check)

### Duplicate article ("the the", "a a", "an an")

- _(age 13 tween)_ `...Cole vs the Rule
At the the back of the bus, Cole was doing the bare minimum. So was the raccoon. Su...`
- _(age 12 tween)_ `...e a Stuck Friend
At the the back of the bus, Cole had decided. Today: rescue a stuck friend. The pan...`

### Lowercase letter starts a sentence after period/!/?

- _(age 6 kid)_ `...Cole woke up with a plan. Today, at the water park, Cole was going to invent a brand new dance. Th...`
- _(age 6 kid)_ `...Cole told the goldfish the plan. The plan was simple: open the door that won't open. The goldfish no...`
- _(age 6 kid)_ `...It started at the meadow. Cole looked at the lynx and made up their mind: today they...`


## Notes

- This script is DIAGNOSTIC, not a release gate. The release gate is qa-current.js Section 18.
- Glue-phrase threshold is configurable in this file (GLUE_THRESHOLD = 0.25).
- The "lowercase_sentence_start" check sometimes false-positives on stylized lowercase shouts (e.g. `"glorp!" said Cole. then the chick...`) — review hits manually.
