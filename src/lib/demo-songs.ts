/** Public-domain hymns bundled for the backend-free "try" playground. */
export interface DemoSong {
  title: string;
  key: string;
  body: string;
}

export const DEMO_SONGS: DemoSong[] = [
  {
    title: "Amazing Grace",
    key: "G",
    body: `{title: Amazing Grace}
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
{end_of_verse}`,
  },
  {
    title: "It Is Well",
    key: "C",
    body: `{title: It Is Well with My Soul}
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
{end_of_chorus}`,
  },
  {
    title: "Come Thou Fount",
    key: "D",
    body: `{title: Come Thou Fount of Every Blessing}
{key: D}

{start_of_verse}
[D]Come Thou fount of [G]every [D]blessing
Tune my [D]heart to [A]sing Thy [A7]grace
[D]Streams of mercy, [G]never [D]ceasing
Call for [D]songs of [A]loudest [D]praise
{end_of_verse}`,
  },
];
