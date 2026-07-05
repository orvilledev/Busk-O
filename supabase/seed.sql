-- Busk-O seed: a handful of public-domain hymns to explore with.
-- Run this in the Supabase SQL editor AFTER you have signed up at least once.
-- It attaches the songs to your (the earliest) user account.
--
-- To target a specific account instead, change the `u` CTE to:
--   with u as (select id from auth.users where email = 'you@example.com')

with u as (
  select id from auth.users order by created_at asc limit 1
)
insert into public.songs (user_id, title, artist, original_key, body, tags)
select u.id, s.title, s.artist, s.key, s.body, s.tags
from u, (values
  (
    'Amazing Grace',
    'John Newton',
    'G',
    $cp${title: Amazing Grace}
{key: G}

{start_of_verse}
[G]Amazing [G7]grace, how [C]sweet the [G]sound
That saved a [G]wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind but [D]now I [G]see
{end_of_verse}

{start_of_verse}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear
And grace my [G]fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved
{end_of_verse}$cp$,
    array['hymn', 'traditional']
  ),
  (
    'Holy, Holy, Holy',
    'Reginald Heber',
    'D',
    $cp${title: Holy, Holy, Holy}
{key: D}

{start_of_verse}
[D]Holy, holy, [A]holy! [D]Lord God Al[G]mighty!
[D]Early in the [A]morning our [D]song shall [A]rise to [D]Thee
[D]Holy, holy, [A]holy! [D]Merciful and [G]mighty!
[D]God in three [A]persons, [G]blessed [A]Trin[D]ity!
{end_of_verse}$cp$,
    array['hymn', 'traditional']
  ),
  (
    'Come Thou Fount',
    'Robert Robinson',
    'D',
    $cp${title: Come Thou Fount of Every Blessing}
{key: D}

{start_of_verse}
[D]Come Thou fount of [G]every [D]blessing
Tune my [D]heart to [A]sing Thy [A7]grace
[D]Streams of mercy, [G]never [D]ceasing
Call for [D]songs of [A]loudest [D]praise
{end_of_verse}$cp$,
    array['hymn', 'traditional']
  ),
  (
    'It Is Well with My Soul',
    'Horatio Spafford',
    'C',
    $cp${title: It Is Well with My Soul}
{key: C}

{start_of_verse}
[C]When peace like a river atten[G]deth my [C]way
When [C]sorrows like sea [G]billows [G7]roll
What[C]ever my lot, Thou hast [F]taught me to [C]say
It is [C]well, it is [G7]well with my [C]soul
{end_of_verse}

{start_of_chorus}
It is [C]well [C7]with my [F]soul
It is [C]well, it is [G7]well with my [C]soul
{end_of_chorus}$cp$,
    array['hymn', 'traditional']
  )
) as s(title, artist, key, body, tags);
