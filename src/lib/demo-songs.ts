/** Public-domain hymns bundled for the backend-free "try" playground. */
export interface DemoSong {
  title: string;
  key: string;
  body: string;
}

export const DEMO_SONGS: DemoSong[] = [
  {
    title: "Leaving On A Jet Plane",
    key: "G",
    body: `{title: Leaving On A Jet Plane}
{key: G}

{start_of_verse}
[G]All my bags are packed, I'm [D]ready to go
I'm [D]standing here outside your [G]door
[G]I hate to wake you up to [D]say goodbye
But the [D]dawn is breaking, it's [G]early morn
{end_of_verse}

{start_of_chorus}
So [G]kiss me and smile for [D]me
Tell me that you'll [G]wait for me
[Am]Hold me like you'll never let me [D]go
Cause I'm [G]leaving on a jet [D]plane
Don't know when I'll be back [G]again
Oh [G]babe, I hate to [D]go
{end_of_chorus}`,
  },
];
