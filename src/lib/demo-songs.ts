/** Songs bundled for the backend-free "try" playground. */
export interface DemoSong {
  title: string;
  artist?: string;
  key: string;
  body: string;
}

export const DEMO_SONGS: DemoSong[] = [
  {
    title: "Leaving On A Jet Plane",
    artist: "John Denver",
    key: "G",
    body: `{title: Leaving On A Jet Plane}
{artist: John Denver}
{key: G}

{comment: Intro}
[D]

{comment: Verse 1}
All my [G]bags are packed, I'm [C]ready to go
I'm [G]standing here outs[C]ide your door
[G]I hate to wake you u[C]p to say goodby[D]e
But the [G]dawn is breaking, it's [C]early morn,
The [G]taxi's waiting, he's [C]blowing his horn
[G]Already I'm so l[C]onesome I could di[D]e

{comment: Chorus}
So [G]kiss me and [C]smile for me
[G]Tell me that you'll [C]wait for me
[G]Hold me like you'll [C]never let me go[D]
I'm [G]leaving [C]on a jet plane
[G]Don't know when [C]I'11 be back again
[G]Oh b[C]abe, I hate to [D]go

{comment: Verse 2}
There's so [G]many times I've [C]let you down
So[G] many times I've [C]played around
[G]I tell you now [C]they don't mean a [D]thing
Every [G]place I go I'll [C]think of you
Every [G]song I sing I'll [C]sing for you
When [G]I come back I'[C]ll bring your wedding [D]ring

{comment: Verse 3}
[G]Now the time has [C]come to leave you
[G]One more time [C]let me kiss you
Then [G]close your eyes [C]I'11 be on my w[D]ay
[G]Dream about the [C]days to come
When [G]I won't have to [C]leave alone
Ab[G]out the times [C]I won't have to [D]say`,
  },
];
