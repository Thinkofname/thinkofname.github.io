---
layout: post
title:  "UniverCity - Change log"
comments: 13
---

I didn't make as much progress this month as I would have liked.
A lot of time was spent on internals when I should really be focusing
on gameplay so I can plan to release this. Hopefully the next month
will be better.

## Gameplay

![A paper plane flying around the room](/img/paperplane.jpg){:align="left"}
### Paper planes

Students can now randomly throw paper planes around the room during
lessons. Currently this is just a visual effect but it may have other
effects later.

This is part of a system that allows scripts to spawn, animate and
control objects in a room completely clientside so no networking is
required.

![A paper plane flying around the room](/img/staffstats.jpg){:align="right"}
### Staff can now have stats

This was previously called feelings and was limited to students only.
I have extended the system to cover staff as well with different
entity types being able to have a different set of stats.

Currently the stats on staff don't effect anything during lessons
but this will change later.

These stats will effect the how well professors do their job when
teaching e.g. control will effect how well a professor can handle
large classes, skill will effect how well a professor teachs the
class to its students.

### New hiring screen

![Example 1](/img/stafflist1.jpg){:.cimage}
![Example 2](/img/stafflist2.jpg){:.cimage}

A random selection of staff are now generated and displayed to the
player on the hiring screen instead of giving them a random staff
member when hiring. This includes randomized stats and a random
description.

## Internal

### Render scaling

Rendering scaling should allow those with low end gpus to still
manage to run the game. This reduces the rendering resolution of
the game whilst not effect the user interface keeping the game
playable.

* [Max settings](https://i.imgur.com/2DE7Mcl.png)
* [Render scale + Low settings](https://i.imgur.com/yW2u8LK.png)

### Delta-encode

One of the most messy parts of the game's codebase was the entity
delta encoding system. This system handled collecting 'snapshots'
of the state of entities and serializing them into packet(s) that
could be reconstructed on the other side to recreate the state.
To optimize this it attempted to keep the packets small by only
sending what changed, delta encoding. This involved a lot of
comparing current and previous state and trying to work out how
best to encode it. Like this

```rust
if ne.target.facing != oe.target.facing {
    let _ = entity_data.write_bool(true);
    if let Some(facing) = ne.target.facing {
        let _ = entity_data.write_bool(true);
        let _ = entity_data.write_f32(facing);
    } else {
        let _ = entity_data.write_bool(false);
    }
} else {
    let _ = entity_data.write_bool(false);
}
```

I realized a lot of this could be handled for me by a derive macro
and set out to write one. And the end result was replacing about
200 lines of that with

```rust
let _ = ne.encode(Some(oe), &mut entity_data);
```

and not having to worry about the reading falling out of sync with
the writing.

```rust
#[derive(DeltaEncode)]
struct EntitySnapshot {
    info: EntityInfo,
    #[delta_default]
    entity: ecs::Entity,

    owner: Option<player::Id>,

    target: ETarget,
    selected: Option<player::Id>,
    room: Option<ERoom>,
    data: Option<EntityData>,
    emotes: Vec<EEmote>,
    tints: Vec<EColor>,
}

#[derive(DeltaEncode, PartialEq, Clone)]
#[delta_complete]
struct EntityInfo {
    key: Arc<assets::ResourceKey<'static>>,
    variant: u8,
    name: EName,
}
```

For the most part only the `DeltaEncode` derive is needed to
generate the required code but attributes can be used to
optimize/handle different cases. `delta_complete` for example
will only send the contents of the struct if its not equal to
its previous and it'll send the whole contents in that case
instead of a delta. In the case where nothing has changed a
single bit is used to mark it. `delta_default` just fills the
field with its default value instead of (de)serializing it.
`delta_bits` can be used on integers to set the number of bits
used to serialize the value.

In the case of position of the entity we can use the attributes
to optimize it even more by knowing the limits of the values.

```rust
#[derive(Debug, Clone, DeltaEncode, PartialEq)]
struct ETarget {
    #[delta_fixed]
    #[delta_subbits = "4:5,6:5,10:5,16:5,-1:-1"]
    time: f32,
    #[delta_fixed]
    #[delta_diff]
    #[delta_subbits = "4:5,6:5,10:5,16:5,-1:-1"]
    x: f32,
    #[delta_fixed]
    #[delta_diff]
    #[delta_subbits = "4:5,6:5,10:5,16:5,-1:-1"]
    z: f32,
    facing: Option<Angle>,
}
```

`delta_fixed` causes the floating point number to be encoded
as a fixed point number which can allow for other attributes
like `delta_subbits` and `delta_diff` to function.
`delta_subbits` will go through through the list in order
(where the values are `<intbits>:<fractbits>`) and try
and encode the value in the least number of bits possible.
`delta_diff` will encode the difference from the last
value instead of encoding the full number, when combined
with `delta_subbits` this can end up with large savings
when the entity only moves slightly.

The code for the derive macro is horrible currently but it works.
I'm not really sure how to handle code generation in a nice way
but i'd like to clean it up so I could release this as a crate
at some point.

### Minor things

* Pathfinding now looks for doors in the target room to pathfind to.
  Whilst this may make paths longer in some cases it should prevent
  a lot of cases where they'd struggle to find a place too and also
  improve performance a bit.
* The addition of `filter` to `Option` on nightly actually broke the
  build due to a `filter` method I had already added via a extension
  trait. I had to rename my method to get the build working again.

## Twitch

I've haven't been streaming my work on [twitch here][twitch] lately
but sometimes I will pop up and stream for a bit.
Feel free to stop by and watch if i'm streaming.

## Subreddit

I've opened a subreddit for the game as per someones suggestion. Its
empty currently but hopefully that'll change once I get some time to
put some work into it. [Here][subreddit]

[outlinevideo]: https://www.youtube.com/watch?v=SMLbbi8oaO8
[twitch]: https://www.twitch.tv/thinkofname
[subreddit]: https://www.reddit.com/r/Univercity/