# Player Identity contract

Inputs: ProfileSystem displayName; PlayerProgressionSystem level/current XP/next XP; RankSystem rank label/rank number.

Action: existing parent button keeps `data-action="profile"`.

Lifecycle: visible only on Home; refreshes after Home render and on profile/progression/rank events.

Presentation-only: no persistence, rewards, progression calculations beyond view percentage, navigation authority, or gameplay mutation.
