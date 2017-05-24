---
layout: post
title:  "UniverCity - Change log"
---

I thought I should start a little series of monthly blog posts
to show progress on the game. This will be a nice way for
me to track my own progress on the project as well. This first
one will include a bit of april, too, due to it being the
series opener.

## Introduction

Since this is the first post I thought I'd talk about what I'm
doing.

I'm building a game called (currently) UniverCity, a
simulation game inspired by Theme Hospital. The player will
manage a university: hiring staff, building rooms, managing
student happiness, etc. The game has been built with
multiplayer in mind so that you can compete with your friends
and potentially sabotage their university. The game is still
very much a work in progress.

I'm building it in [Rust][rust-site] using SDL2 for
window management/audio, OpenGL for rendering and LuaJIT
for scripting. It's been a bit challenging so far because
whilst I've written Rust code in the past I've never done
anything on this scale (the same could be said about most
other languages I've programmed in, though).
The only large, open-source Rust projects I currently know
about are [`rustc`][rust-repo] and [Servo][servo-repo],
both of which have different structures when compared to
a game engine (servo might be close but I struggle
navigating its repo). I feel like my issues so far are due
to a lack of experience rather than Rust, however, and that
I'll get better at handling this as I go on.

Bar me running into a wall with some design issues Rust has
been pretty pleasant to work in. `cargo` makes using small
libraries to handle common tasks easy. The error messages for
compile errors are great and getting better all the time; I've
almost never found myself confused by one. I've been stuck
on nightly for a while now ~~but I'm one unstable feature away from
stable (`retain_hash_collection`)~~ **Update** Just was marked
stable before publishing this in the latest nightly (and beta), will
be in stable in a few weeks. Even so, nightly breakages have been rare,
and when it has happened `rustup` makes it easy to rollback. I've managed
to keep unsafe code to a minimum, with the only exceptions currently being:

* Access of components outside the ECS

    I'm using my own currently but using [specs][specs]
    could solve this. (I started around the time
    specs came into being/slightly before, so I ended
    up creating my own). It can be done safely in some
    cases with my system but the unsafe method allows
    skipping a lookup per entity which helps with
    performance (the unsafe methods are generally only
    used during rendering).

* Scripting

    Whilst I've made a safe wrapper around luajit now,
    a lot of my code still uses a `State` struct (below)
    to work around borrow issues.
    This occured because before using a safe wrapper, raw
    pointers were passed into lua hiding the borrowing
    issues; now it's gotten to the point where changing
    it has become too hard. This is something I really
    want to fix because it's one of the ugliest parts of
    my game's code, but I'm at a loss at how to solve this
    nicely.

    **Update**: After writing this I attempted to solve
    this issue. I was able to fix `ui` and `audio` (below)
    by changing to `Rc<RefCell<T>>` for those types (handled
    internally for the most part) and storing a weak reference
    to them in lua's registry. The only issue left is the
    level which is the only part of `GameInstance` that is
    actually used by lua. This is complicated because the
    level uses scripting to build some rooms and to place
    every type of object whilst also having to be accessible
    from lua. It might be possible to split up the level
    struct more to try and solve this but i'm somewhat lost
    on where to split.

```bash
$ rg "State" | wc -l
818
```

```rust
#[derive(Clone, Copy)]
pub struct State {
    ui: *mut ui::Elements,
    instance: *mut instance::GameInstance,
    audio: *mut audio::AudioController,
}
```

## Gameplay

### Timetables for students

Students now have timetables generated for them once they have
registered at the registration office.

These timetables currently can have 4 entries on them (may
change later). Each entry can either be a lesson (bound
to a room) or a free period allowing the student to idle
and relax. When generating a timetable the game will
only pick lessons from the same 'group' as the first lesson
and will not select the same lesson twice. Lessons with students
already registered to them will be prefered over empty rooms.
Free periods are currently randomly inserted.

Right now students are stuck with the first timetable they
get which causes issues when rooms are removed. The plan
is for students to re-register (or leave) at the end of
an in-game term.

### Money

![HUD display money and the current rating](/img/money.png){:align="right"}
Staff, rooms and objects now have a cost and will charge the player
to place them. Students can now pay the player as well.

Staff have to be paid every 7 in-game days. Currently this is done
based on the time they were initially placed and not on a schedule,
behavior that should hopefully be fixed later.

Rooms charge once fully placed and not during placement, making
playing around with the design of the room cheaper. When editing
the room the cost of removed objects (or that gained by shrinking
the room) can be used to place new objects. Any money unspent
when finalizing the edit, however, will be lost.

### Redrawn icons

![Before](/img/icons-before.jpg){:.cimage}
![After](/img/icons-after.jpg){:.cimage}

Improved the look of icons on the ui. Previously a pixel art style was
used but I've changed over to a sketchy style instead. I feel this new
style fits in better with the paper theme the ui currently has going on.

### Notification system

The look is complete, but the system itself is currently a bare-bones
implementation. It will be used to notify the player of events occuring
during the game.

[A video of this system may be found here][notify]

### Chairs/Benches

![Chairs](/img/chairs.jpg){:align="left"}
![A bench](/img/bench.jpg){:align="right"}

Chairs and benches were added. Students will automatically sit
in chairs during a lecture. The number of chairs affects the
number of students a room can support (controller via a script).

Benches will be a place for a student to idle during free periods.
At some point students may also use this whilst waiting for a staff
member to enter a room.

### Idling

Students can be assigned to rooms marked as `can_idle` during free periods.
This functions like a lesson where a script handles what the student
does in the room, except that the room isn't fixed. Rooms are randomly
selected (slightly biased towards closer rooms) and students will attempt
to switch rooms after a random amount of time. Students will stop their idle
task as soon as a lesson starts.

### Extensions

![Extension joining two buildings](/img/extension.jpg){:.cimage}

An extension object was added that allows for two buildings to be joined
together. Originally you could overlap buildings to join them but this
introduced a lot of hard-to-handle edge cases; using an extension object
solved a lot of these issues and allows for more control over the joins of
two buildings.

### Work on having random colors for units

[![Random colours for professors](/img/random-prof.jpg){:.cimage}](/img/random-prof-orig.jpg)

[Video showing more][random] To try and make staff/students feel
more unique I've started to work on a feature that allows for
entities to randomly colours parts of their model. Currently
these colours are selected from the entity's json file but that
does limit the number of colors I have to work with (mainly
because listing them all is a pain). I also need to work on
syncing these colours between the server and client.

### Text wrapping on UI elements

Simple enough but was something that had been missing for a while.
Still have a few places that need updating to use it but the implementation
exists now.

### Walls are lowered during editing

This replaces the transparent effect I was using before. Easier to render
and solves a lot of the graphical glitches that the old effect had.

### Moving/removing objects

Objects can now be removed via a right click or moved via a left click.
Saves having to dig up the whole room everytime you made a mistake.

### Limited mode editing

This allows for rooms to be edited whilst containing other rooms. This
works like normally editing a room but prevents the removal or resizing
of the room. Removing/resizing will work once all contained rooms are
removed.

### Overhead icons

Entities can now have icons above their head to display a message to the
player. Currently this is used for paying (money icon) and confusion (question
marks). This will be used later to display happiness or other emotions.

### Initial work on audio

Nothing major but scripts can now play non-positional audio. I currently use
this for button presses (although I'm not happy with the current sound).

## Internal

### Wrapper types

In order to keep the code clean a few types have been changed
from raw integers to wrapper types. This changes nothing at
runtime but prevents confusion when using them. e.g.:

`i16 -> player::Id`

`i16 -> room:Id`

`i64 -> UniDollar`

In the case of `UniDollar` operator overloading is used to
make sure the value is used in a way that makes sense

```rust
// Valid - Returns UniDollar
dollar * 5
// Invalid
dollar * dollar
// Valid - Returns i64
dollar / dollar
// etc..
```

### Removed usage of `conservative_impl_trait`

Whilst I love this feature, I do want to start moving towards the stable
compiler, and this doesn't seem like it's going to be stable for a while.
Most usages of this that I changed just exposed the private type to the public
(although one did require boxing the type instead).

### Improved server side checks of commands

The server ended up being too trusting in some cases. Some extra checks
have been added to ensure the player is in the correct state for a command.

### Pathfinding queue

Previously all pathfinding requests were handled instantly. This started
to cause issues at the end of lessons where almost every entity will try to
request a path. This has been changed to a queue where paths are generated
every tick up to a time limit; once the time limit is reached the queue will
wait until the next tick to continue processing paths. This will cause a small
delay for entities getting paths during busy periods but prevents freezing
the game, which would be worse.

[rust-site]: https://www.rust-lang.org/
[rust-repo]: https://github.com/rust-lang/rust
[servo-repo]: https://github.com/servo/servo
[specs]: https://github.com/slide-rs/specs
[notify]: https://vid.me/adyC
[random]: https://vid.me/ZetY