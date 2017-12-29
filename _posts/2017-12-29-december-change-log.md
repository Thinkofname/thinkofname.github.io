---
layout: post
title:  "UniverCity - Change log"
comments: 14
---

Things were a bit slow this month due to christmas but there were still
a large number changes made this month internally.

## Gameplay

![Windows now use a model](/img/windows-model.jpg){:.cimage}

### Windows are models instead of flat textures

![The window model in blender](/img/window-blender.jpg){:align="left"}

Previously windows were a flat texture cut out of the wall texture.
This made adding new wall types harder and limited windows to
only one type.

Windows are now implemented using multi-textured static models,
special textures get replaced with the correct wall texture at
runtime based on placement.

Implementing this required a bit of work to efficiently store the
type of window for a wall without increasing the size of `WallInfo`
which each tile in the level has two, making every little addition
to the structure greatly increase the memory required. The
`ResourceKey` structure used to name resources was too large to
store in the `WallInfo` struct (about 64 bytes on 64 bit machines).
Instead of storing it directly the level now keeps a map of key
to a 8 bit id which is stored instead, this limits the number of
unique types of windows to 256 but that should be more than enough
for now.

### Staff members can be moved between rooms

When selecting a staff member a new option to move them has been
added. This has an added effect (which has also been added to the
initial placement of a staff member as well) of forcing the entity
to be owned by the room they are placed into. Rooms' scripts have
been updated to remove extra staff members they don't care about
or need.

### The map now has a border

Instead of falling off into a black void the map has some padding at
edge, its pretty empty and uninteresting at the moment but hopefully
I will be able to improve this later. Along with this change the
camera was clamped as well.

### Improved tooltips for rooms

![New detailed tooltips](/img/tooltip-new.jpg){:align="right"}

Rooms now can have detailed tooltips. Currently only used for the
registration office to display the number of staff but can be used
for anything. The idea for this is to allow rooms to display the
current state of the room and any issues so that the player can
react to them.

### Main menu building improved

The building on the main menu has been improved with a few new objects
and two rooms built. Minor changes but it does help with the look
a lot.

## Internal

### Script features

Scripts can now create notifications to alert the player about issues
within a room. This required a bit of work to allow the server side
script to notify a remote player whilst also allowing them to have
full control over the look of it. To handle this, scripts can encode
data to be sent to the client and be decoded by the script on the
the client where it can create the UI elements required.

Scripts can also control the tooltips displayed when hovering over
a room. This works like above but has the client request the server
to generate the tooltip instead of the server pushing to the client.

### Minor things

* Had to use more bits for positions with networking due to rounding
  issues causing pathfinding to fail. There might be a better way to
  solve this without increasing it but I haven't got the time to research
  this.
* Simplified script handling for rooms. Previously I supported
  customizing the method name prefix for room scripts so that
  multiple rooms could be in a single file. Every room used the
  same prefix and due to the number of methods now having multiple
  rooms in one file would be really messy. The prefix has been removed.
* The `Bitable` type has been removed.
  For networking the `Bitable` trait was used to allow types to be
  encoded into packets with control at the bit level instead of
  byte. `delta-encode` can be set to always encode a type effectively
  disabling the delta encoding handling. This ended up being easier
  to use due to the derive support than manually implementing `Bitable`
  so all previous use cases have been changed to use `delta-encode`.
* Unwinding changes in rust broke my luajit bindings as luajit
  uses unwinding to implement `lua_error`. I've worked around this
  by using a c wrapper function that calls into the rust function
  and invokes `lua_error` based on the return value of the rust
  function. Not the nicest work around but it works and doesn't
  rely on how unwinding is implemented in rust.
* Added an `Angle` type to handle angles. Previously I just used
  a `f32` but kept encountering issues due to the value not always
  being within the same range (if it was even kept within a range).
  This type keeps the value within `-PI,PI` wrapping if needed.
  This ended up fixing a few issues where entities could end up spinning.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Huh, this is a new bug <a href="https://twitter.com/hashtag/gamedev?src=hash&amp;ref_src=twsrc%5Etfw">#gamedev</a> <a href="https://twitter.com/hashtag/indiedev?src=hash&amp;ref_src=twsrc%5Etfw">#indiedev</a> <a href="https://t.co/mWgVU1y1YE">pic.twitter.com/mWgVU1y1YE</a></p>&mdash; Thinkofname (@thinkofdeath) <a href="https://twitter.com/thinkofdeath/status/943490337187749889?ref_src=twsrc%5Etfw">December 20, 2017</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Twitch

I haven't been streaming my work on [twitch here][twitch] lately
but sometimes I will pop up and stream for a bit.
Feel free to stop by and watch if I'm streaming.

## Subreddit

I've opened a subreddit for the game as per someones suggestion. It's
mostly empty currently but hopefully that'll change once I get some
time to put some work into it. [Here][subreddit]

<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

[twitch]: https://www.twitch.tv/thinkofname
[subreddit]: https://www.reddit.com/r/Univercity/