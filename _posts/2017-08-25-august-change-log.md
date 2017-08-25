---
layout: post
title:  "UniverCity - Change log"
comments: 10
---

Trying out including videos in this post to make things more
interesting. I've tried my best to keep their size as small
as I could.

## Gameplay

### Inspectors and VIPs

<video loop autoplay>
  <source src="/vid/inspector-vid.webm" type="video/webm">
  <source src="/vid/inspector-vid.mp4" type="video/mp4">
</video>

Inspectors and VIPs will occasionally spawn and visit the player's
UniverCity. Inspectors will generally focus on a specific subject
while VIPs will visit the whole building. If they are happy with the
state of things they will reward the player with a rating increase
and money.

### Janitors

<video loop autoplay>
  <source src="/vid/janitor-vid.webm" type="video/webm">
  <source src="/vid/janitor-vid.mp4" type="video/mp4">
</video>

Currently janitors only water plants but later they'll preform other
tasks around the UniverCity. This work differently to other staff
members as they don't belong to a single room, they currently use
the per-entity script that inspectors use.

### Added and then removed bloom

Tried it for a little while and it ended up not looking that good.
After a few days I ended up removing it. Win some, lose some.

### Improved the look of SSAO slightly

Used a better blur shader (two passes) to improve the look of the
SSAO effect. Its a minor improvement but it helps a lot in some
places.


### New rooms

![Science Basics](/img/science_basics.jpg)
![Science Lab](/img/science_lab.jpg)
![Compsci Lab](/img/compsci_lab.jpg)
![Art Room](/img/art_room.jpg)
![Toilets](/img/toilets.jpg)

### Stats screen

![Stats screen](/img/stats-screen.png){:.cimage}

The line drawing code needs some work but it works well enough for
now. Currently this only tracks total money over time, the buttons
at the top are not implemented.

### Student feelings

![Student feelings screen](/img/student-feelings.png){:align="left"}

Students now have 'feelings' which decay over time. Hunger can be
fixed by building places to obtain food (e.g. snack stop) which students
will visit when they are hungry enough.

Happiness is rasied via idle activities slightly. Having a full lesson also
improves happiness, whilst cutting the lesson short via editting or them
being late will descrease happiness.

I'm hoping to expand on this more later but the ground work is now implemented.

### Rating

Rating is now effected by various things instead of being static.
E.g.: Overall student happiness, inspection results etc.

## Internal

### Free-roaming entities

Free roaming entities don't follow the normal rules that all the other
entities follow. Normally an entity is controlled by the game to find
a room that wants/needs it and then that entity is handed over to the
room's script to control.

Free roaming entities don't belong to a room and instead have a script
for themselves. This script is implemented as a coroutine where certain
functions will yield to the system and run that action before returning.
This makes scripting these entities easier as you can write synchronous
code that runs over many ticks.

Due to my binding's handling of coroutines being pretty much missing
(bar some handling for running within a coroutine) the main part of
this system is implemented purely in lua instead of rust.

### Object groups

Some sets of objects needed to be in most rooms (e.g. plants) but
previously each of these objects had to be added to every room manually
which made it easy to forget some. I've now implemented object groups
which allow for a set of objects to be defined in a file and then have
that file referenced by the room. Updating that file updates all
the room's lists.

### Minor things

* The registeration room gained a 'waiting area' tile. This is a
  small work around to stop the students from stacking up on each
  other whilst waiting for a desk.
* I tried to cross compile to MacOS from linux. Managed to get a
  binary but it apparently segfaults according to testers. Without
  a Mac to work with I can't debug this though.
* Fixed my near and far planes. I misread the cgmath docs months
  ago and managed to have these backwards.
* Staff placement can now be cancelled.

[stylish]: https://github.com/Thinkofname/stylish
[imgur-options]: http://i.imgur.com/vCpnGHw.gifv