---
layout: post
title:  "UniverCity - Change log"
comments: 9
---

## Gameplay

### Stylish conversion complete + UI Improvements

![The server connection screen from univercity with a new font](/img/new-font.jpg){:align="left"}

The conversion from the old UI system to [stylish][stylish] is complete.
This did take a while but things look and work better because of it.
It also made adding new windows/menus like the [options menu][imgur-options]
much easier.

This change also comes with a swap in font from Indie Flower to Schoolbell.
Schoolbell still gives off the handdrawn feel that the previous font but
is much easier to read in-game (and easier to render without issues).

I also took the time to make things like scrollbars feel much nicer to use.
Previously they would stop moving when dragging if you moved your mouse off
to the side, now they use a fullscreen invisible box to keep hold until the
mouse is released.

### Logo Updated

![Old Logo](/img/old-logo.png)
![New Logo](/img/new-logo.png)

With the font change I dedicided it was time to update the game's logo as well.
As you can see i'm not an artist. The new logo uses the same idea of the previous
one but is more compact. I also added a bit of a background to it as well in the
form of a graduation cap.

### Tooltips improved

![New tooltip layout](/img/tooltip.jpg){:align="right"}

Tooltips can now include icons and highlighted text. This should make them
clearer to players. The current icons aren't that clear so they may get
redone in the future.

### Options menu

Finally added an [options menu][imgur-options]. Supports audio levels,
resolution/framerate and keybindings.

Keybindings support more control than the UI currently shows as its
possible (via the config file) to bind to the direction of the key
(up/down) instead of just a key. This allows, for example, to change
the drag to select into a press one key to start selecting and press
another to stop. This might be useful for some accessibility uses but
i'm not sure.

### Music/Sound

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/RvABOwwqot4" frameborder="0" allowfullscreen></iframe>

Added music and replaced the clicking sound with just a basic clicking noise
as the paper sound got old really fast. Doors have an opening and closing
sound with basic positional audio as well as a sound when a student spends
money.

### Names and lists

Students and staff members now have names generated for them. Along
with this a list of staff members was added to allow tracking down
staff. Clicking on students/staff will open an info window for them,
the student window includes their current timetable.

### Student spawning

Students will automatically 'spawn' at the edges of the world and walk to
your UniverCity. The limit is based on the capacity of the player's class
rooms so more will walk in over time as the player builds.

### Model changes

![Professor variants](/img/variants-prof.jpg){:align="left"}

The animation rig for professors and students was completely redone
and they now share the same rig. This allows for the animations
to be reused greatly reducing the amount of duplicate work and
work to add a new model to the game.

![Student variants](/img/variants-students.jpg){:align="right"}

Along with this new variants of the exist models were added. The
game now supports random variants for entities which can override
certain properties of the base entity e.g. model, name list.
The new variants are as follows: Female professor, Male student with
trousers instead of shorts, Female student with trousers and a Female
student with a skirt. The random color tints still apply to these
models as well. Hopefully i'll be able to add more variants later
but currently my modeling skills are pretty limited as well as the
amount of time I have to be working on models.

### Plants

![Plant models](/img/plants.jpg){:.cimage}

### Professors teach

Instead of just standing in the middle of the room professors now
walk around the projector and rarely stand next to a student.
This is still missing animations but the basic framework is now
there.

Objects can have behaviours registered to them (as seen below).
These are run inside a coroutine allowing for synchronous code
to be writen whilst being run async. `walk_to_face` and
`wait_tick` both 'block' until they complete.

```lua
actions.register("base:chairs/single_chair", function(obj)
    local x, y = obj:get_position()
    local s = math.sin(obj.rotation + math.pi * 0.5)
    local c = math.cos(obj.rotation + math.pi * 0.5)
    helpers.walk_to_face(x + 0.4 * s, y + 0.4 * c, obj.rotation)
    helpers.wait_ticks(20 * math.random(4, 20))
end, 0.05)

actions.register("base:projector", function(obj)
    local x, y = obj:get_position()
    local s = math.sin(obj.rotation + math.pi * 0.5)
    local c = math.cos(obj.rotation + math.pi * 0.5)
    helpers.walk_to_face(x + 0.7 * s, y + 0.7 * c, obj.rotation)
    helpers.wait_ticks(20 * math.random(4, 20))
    helpers.walk_to_face(x - 0.7 * s, y - 0.7 * c, obj.rotation)
    helpers.wait_ticks(20 * math.random(4, 20))
end, 5.0)
```

## Internal

### Added a green-screen room

This exists purely to make taking screenshots of entities/objects
easier. Should be removed before release (assuming I remember).

### Lua bindings fixes

This took a while to track down but my lua wrapper was miss-handling
ffi functions being called whilst inside a coroutine. Since i've
only just started using coroutines this hasn't popped up before.

### Minor things

* Students now randomly select benches to sit on instead of using the
  placement order
* The button clicking noise was missing from a few buttons, this has
  been fixed
* Various scripting issues fixed with students/staff leaving
* Some unsafety removed when using my ecs outside of a system.
* Timetable generation now handles students re-registering at the
  end of a term
* The price of most rooms/objects was adjusted to make things fairer
* Network error handling improvements
* Added inner walls that are basically the inverse of the extension object
* Staff summoning is now smarter in what entities it selects to go to rooms

[stylish]: https://github.com/Thinkofname/stylish
[imgur-options]: http://i.imgur.com/vCpnGHw.gifv