---
layout: post
title:  "UniverCity - Change log"
comments: 12
---

Spent this month doing a bit of clean up both for the code and the assets.
In general I think the game feels a bit better now.

## Gameplay

### Highlights when hovering over students/staff/objects

![Highlights around the edge of entities](/img/highlight.png){:align="left"}

Added a highlight to students, staff and objects when you mouse over them
to help being able to see which one you are actually selecting. Objects
are only selectable when editing a room. The highlight is a different
color depending on what is being hovered over.

The highlight is implemented by rendering the object in a solid color on
a black background and then blured. The original solid color render is then
subtracted from the blur to produce the outline. This was implemented based
on [this great video][outlinevideo].

### Gardens

<video loop autoplay>
  <source src="/vid/waterbanner.webm" type="video/webm">
  <source src="/vid/waterbanner.mp4" type="video/mp4">
</video>

Added a garden that students can idle in whilst having a free period/waiting
to register. You can place benches, plants, bushes, paths and ponds. I
spent a bit of time trying to make the water to look good. Its currently a
special case within the rendering due to way its animated but I'm hoping to
generalise the case where models have custom shaders at some point.

### Object menu redesign

![The new object menu](/img/objectmenu.jpg){:align="right"}

I decided to redesign the object menu to make finding objects easier. Whilst
the old menu provided a icon for the object which this one is currently missing,
this one provides groups and is able to fit more objects on to the screen without
scrolling.

This also provides a button to hide all objects in the list apart from the objects
required to complete the room. This should fix the issues some testers were having
trying to work out what they were missing from the room.

### Added more sounds

Added some basic sound when placing (or failing to place) an object as well
as removing an object. This just provides a bit more feedback to players
when building rooms.

### Models can now have attachments

These objects can be attached to any bone on the model and will animate
along with the model they are attached to.

### Model additions

![Office worker and talk animation](/img/officeworker.jpg){:.cimage}

Finally have an office worker model (RIP boxy the yellow box) and there is
now an animation for students when sitting at the desk. Professors are also
animated when teaching.

![New science desk and animation/attachments](/img/scienceattachments.jpg){:.cimage}

Science lab got an improvement with a improvement to the desk model, animations
for students working and attachments for the students to hold.

![Janitor with a broom](/img/janitorbroom.jpg){:.cimage}

The janitor's watering can was updated to be an attachment instead of a seperate
model holding it. Also added a broom for the janitor to sweep with.

### Tooltip when hovering over rooms

Added a tooltip that displays after hovering over a room for a bit. Currently
displays the name of the room as its not always easy to tell what room is
what.

### Selections render through walls

![Selection rendering through a wall](/img/selectionwall.jpg){:.cimage}

If a selection for a room ended up behind a wall it became hard to tell
where the selection was going. Also if an object was behind that wall that
blocked placement it would be hard to see what blocked your selection.

To fix this the selection now shows through walls whilst still showing
whats behind it.

### Graph improvements

Redid the line drawing code for the stats screen. The line should no longer
have gaps in it when the line is really steep.

## Internal

### `!Send/!Sync` components on entities

Previously I was using a seperate hashmap to store lua properties for entities
due to the fact that lua isn't thread-safe. This was hard to maintain as I
would have to try and keep track when an entity stored in that map was removed.

The reason components required `Send + Sync` was due to systems being run in
parallel when possible which while nice for performance did cause issues when
trying to use components with properties from lua or opengl.

To fix this I removed the restriction on `Send/Sync` from components and instead
moved it to the system. This prevents adding systems that access `!Send/!Sync`
components whilst still allowing its use outside of systems either via the
`get_component(_mut)` getters on the container or via `Container::with` to
run a system inline.

### Using `slog` for logging/`unwrap` removal

`println` statements weren't really cutting it anymore and its already pretty
hard to debug when issues occur in release builds so I decided to start using
`slog` and increase the amount of logging I do.

As a part of this I also removed every use of `unwrap` and replaced it with a
`assume!` macro I wrote. Functionally `assume!` is the same as unwrap apart from
when it fails. `unwrap`'s panics always show as happening in the stdlib which
isn't useful when you don't have stacktraces enabled. `assume!` is able (due to
being a macro instead) to attach the line and file of the caller instead, it also
logs the file/line via `slog` so I can view the log file to track down the issue.

I've also registered a panic handler that also logs panics to the log file before
forwarding to the default handler.

### Minor things

* The initial level syncing is now compressed

  It was starting to get a bit large slowing down the initial load.
* Increased the max packet size from 16kb to ~9mb

  Level loading was hitting the old limit so I reworked it slightly
  to support larger packets.
* Rooms now have a place for scripts to store values between ticks
* Entity script handles are no longer recreated every time its needed

  This previously caused a lot of preasure on lua's GC by allocating
  a new one every tick.
* The ecs got rayon support.

  This allows spliting up the work within systems.
* Objects store their rotation when placed

  Whilst this isn't need to render them correctly it does allow the script
  to re-use the old rotation when moving an object instead of starting from
  the defualt.
* Lots of script bug fixes

## Twitch

I've been streaming my work on [twitch here][twitch] most days.
Feel free to stop by and watch if i'm streaming.

[outlinevideo]: https://www.youtube.com/watch?v=SMLbbi8oaO8
[twitch]: https://www.twitch.tv/thinkofname
