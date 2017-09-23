---
layout: post
title:  "UniverCity - Change log"
comments: 11
---

## Gameplay

### Saving and Loading

![Save file list](/img/load-list.jpg){:.cimage}

Built UniverCities can finally be saved and loaded at a later date.
I may make breaking changes to the format whilst i'm working on this
but it will be stable by the time the game releases.

For rooms this just saves the placement instructions in order and replays
the placement of the room/objects on load. The only downside is if the rules
of valid placements change loading can fail.

For entities this just serializes the type and a select number of components
(the ones that can't be recreated from scratch). This seems to work well
so far.

Currently the format is json, I was originally going to use msgpack but
the serde library failed to decode the files after saving them. I may
try it again later if save file size becomes an issue.

### Wall toggle for limited mode editing

![Limited mode walls being lowered](/img/limited-walls.jpg){:align="right"}

Previously this was only possible when editing rooms/placing buildings but
wouldn't work if the building/room contained another room. This now works
and also lowers the walls of all rooms within as well.

Limited mode is where you edit a room/building containing
another building, this doesn't disable the room and prevents fully removing it
but allows adding/removing objects.

### Improved door model/texture

![New door look](/img/new-door.jpg){:align="left"}

Previously this was just a flat texture with a hole. The texture resolution
was increased and the handle got a model instead of being flat.

This still isn't the greatest looking door but its much better than before.
At some point I plan to add multiple door types to give players a option to select
from.

### Pausing

![Pause Menu](/img/pause.jpg){:align="right"}

The game has an in game menu that pauses in single player. From this
menu the game can be saved and the options menu can be accessed.
Currently all settings can be changed whilst in game.

### Chat

![Chat system](/img/chat.jpg){:.cimage}

Implemented a basic chat system. In multiplayer the names will be what
the player entered on the connection screen but single player is currently
hardcoded to 'Local Player'. This also gives me a way to implement some
cheats to make testing things easier. Currently I only have two cheats
implemented:

* `/prebuild` -- Rebuilds the rendering pipeline. Useful for testing shaders
* `/moneypls` -- Gives the player extra money

### Credits

<video loop autoplay>
  <source src="/vid/credits.webm" type="video/webm">
  <source src="/vid/credits.mp4" type="video/mp4">
</video>

Added a credits screen. This lists the sources for the music and sound i've
used in my game as well as listing every crate and library used.

Crates and their licenses are extracted by a simple shell script that the
CI runs every build although some (webrender/stylish) are hardcoded due to
being git only. The links to the crates are also clickable.

### Graphics settings and FXAA

Added a graphics menu that lets you control the quality of shadows (up to a
resolution of 8096x8096) and SSAO (number of samples). I also implemented
a FXAA shader to smooth out the rough edges. The effect is small but noticable.

The graphics menu lets you disable shadows, ssao and fxaa which greatly improves
the performance on low end machines.

### Floors can now be customized per a room

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Floors can now be customized. Make a nice or ugly pattern how ever you like. <a href="https://twitter.com/hashtag/gamedev?src=hash">#gamedev</a> <a href="https://twitter.com/hashtag/indiedev?src=hash">#indiedev</a> <a href="https://t.co/NShjYn7uY2">pic.twitter.com/NShjYn7uY2</a></p>&mdash; Thinkofname (@thinkofdeath) <a href="https://twitter.com/thinkofdeath/status/911243216963457024">September 22, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## Internal

### `get_tile` optimized slightly

Previously to map the id to a tile it invoked the asset loader which requires
a lock plus a few hashmap lookups. Instead of doing this on `get_tile` `set_tile`
now does it and caches the result in a faster `IntMap`. This helped pref quite a
bit in a few cases.

### Walls aren't a part of tiles anymore

Previously the texture of the wall would be decided based on what tiles it was
touching. This made having multiple floor options per a room hard as changing
the floor would change the walls at the same time.

Now walls are decided by the room (but connectivity rules are still on the tiles).

### Scripts now rely less on specific tiles

Some scripts used the exact name of tiles to work out what to do or if a placement
was valid. This has been changed to either looking at the tile's properties or
checking the tiles room instead.

### Minor things

* Objects can't be removed if the removal would cause another object's
  placement to be invalid.
  This fixes an issue where you could put a door on an extension/inner wall
  and then remove the wall leaving a floating door.
* Toliets had their script changed from guessing the toilet the student
  was using client via distance to using the toilets index in the objects
  list. This fixes issues where one student would close multiple doors.
* Fixed up a pathfinding bug causing it to never path south from the initial node.
  I also added a captured backtrace in dev mode to trace where pathfinding requests
  where created.
* The action buttons on the hud now toggle the menus they open.
* Doors can't be placed between rooms anymore.

## Twitch

I've been streaming my work on [twitch here][twitch] most days.
Feel free to stop by and watch if i'm streaming.

<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

[twitch]: https://www.twitch.tv/thinkofname