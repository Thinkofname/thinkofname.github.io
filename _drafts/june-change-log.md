---
layout: post
title:  "UniverCity - Change log"
---

The previous post including an introduction about this game
can be found [here]({% post_url 2017-05-24-may-change-log %}).

Not as long as the last one as it only covers one month and
quite a lot of time has been spent on stylish.

## Stylish

![Stylish's demo project](/img/stylish-demo.png){:align="right"}

One of the big things i've been working on this month is [Stylish][stylish].
Stylish is a simple ui system mainly targeted for games. The system
revolves around styles (hence the name). Elements are just names with
key/value pairs and optionally children, by their own they do nothing.

Styles control everything: positioning, appearance and in the case of
UniverCity they control events too. Stylish itself only cares about
a few style rule, `layout` to control what layout engine controls
the children of this element and then `scroll_x/y` and `clip_overflow`
which are used for positioning when querying.

Every other style rule is able to be used by either the user of the
library or the renderer. Stylish comes with a crate `stylish_webrender`
which uses [Servo's webrender][webrender] to render via OpenGL (which
is what I use for my game) however in theory anything can be used. For
example I put together a [simple web version][stylish_web] that uses
a html canvas to render, this is incomplete because I didn't want to
spend too long on it.

### General

For stylish itself the main source of control is via layout engines.
Layout engines position child elements within an element, they can
also resize the element to fit the children. By default every element
uses the layout type `absolute` which uses the `x`, `y`, `width` and
`height` style values to position the element relative to the parent
element. `stylish_webrender` also provides two layout types:

* `grid` which aligns children within a fixed sized grid controlled
    by `rows` and `columns`
* `lined` which aligns elements along one or multiple lines. This
    is currently the only layout that will correctly position
    and size text (although absolute can still be used if sized
    manually).

Stylish was mainly designed for elements and styles to be loaded
from files but I did create a macro that can be used to create
elements inline.

```rust
manager.add_node(node!{
    dragable(x=200, y=60) {
        @text("Drag me!")
    }
});
```

I haven't focused on optimization yet but with webrender it
currently performs well enough for my uses.

### UniverCity

![The server connection screen from univercity](/img/stylish-univercity.jpg){:align="left"}

Embedding stylish + webrender into my game ended up being pretty simple,
the only pain point was working out what state webrender expected opengl
to be in before rendering and then to reset the changes it made to the
state afterwards. This is what ended up being enough for me after
watching webrender in apitrace.

```rust
gl::clear(gl::DEPTH_BUFFER_BIT);
gl::disable(gl::Flag::CullFace);
ui_renderer.render(&mut ui_manager, width, height);
gl::enable(gl::Flag::CullFace);
gl::enable(gl::Flag::DepthTest);
gl::disable(gl::Flag::Blend);
gl::depth_mask(true);
```

I'm slightly worried about what future versions of webrender will do
but I don't think it'll too much of an issue. I currently have
webrender pinned to a commit anyway.

I'm currently in the act of converting all the old UI stuff from json
to stylish but progress has been good so far.

One thing that UniverCity required was a way to interact with the UI
with scripts (lua) and events. For events I decided to build them
into the style rules. This had the benefit of allowing things
like buttons and textboxes to be implemented purely as style
rules instead of specifically handling them in stylish.

```
textbox {
    background_color = rgb(200, 200, 200),
    border_width = border_width(2.0, 2.0),
    border = border(bside("#000000", "solid")),
    can_focus = true,
    layout = "center",

    on_mouse_up = "textbox#node:focus()",
    on_focus = "textbox#focused(node)",
    on_unfocus = "textbox#unfocused(node)",
    on_update = "textbox#update(node, evt.delta)",
    on_char_input = "textbox#
        local txt = node:query():text():matches()(nil, nil)
        txt.text = txt.text .. string.char(evt.input)
    ",
    on_key_up = "textbox#key_up(node, evt)",
    on_key_down = "textbox#key_down(node, evt)",
}
```

The event handlers are lua scripts however by abusing the
custom value feature of stylish I can also use rust
closures by setting them as properties.

```rust
fn from_value(val: stylish::Value) -> Option<Vec<MethodDesc<E>>> {
    if let Some(val) = val.get_custom_value::<Vec<MethodDesc<E>>>() {
        Some(val.clone())
    } else if let Some(val) = val.get_custom_value::<MethodDesc<E>>() {
        Some(vec![val.clone()])
    } else if let Some(desc) = val.get_value::<String>() {
        // The @ here is a hack because stylish doesn't
        // support arrays yet.
        Some(desc.split('@')
            .map(|desc| Self::from_format(ModuleKey::new("base"), &desc))
            .collect())
    } else {
        None
    }
}
```

Mouse events use the `query_at` method to find an element to fire the
event, key events use a *'focused'* element to fire their events at
and (de)init/update work on every element.

I've only just started using stylish with UniverCity but so far it seems
good (A large improvement over what was before). Its possible i'll start
finding issues as I finish moving everything over to it.

## Gameplay

### New path and brick wall textures

![The new improved path texture](/img/path-texture.jpg){:.cimage}

The old path texture was one of the first textures drawn for the game
and was showing its age as i've improved with my texture work.

The brick texture was also pretty old and when the SSAO changes happened
(seen below) I updated the wall texture to have a simpler look.

The textures are still just simple shapes with noise and some basic shading
but it fits in much better with the rest of the textures.

### SSAO and lighting improvements

[![The old look of the game without SSAO](/img/render-before-small.jpg)](/img/render-before.jpg)
[![The new look of the game with SSAO](/img/render-after-small.jpg){:align="right"}](/img/render-after.jpg)

Click the images for a larger view.

Given the angle of the game having depth be clear is important.
The old rendering was bright and colorful but the only visual
clue about depth was from the shadows from walls and objects
which in the case of walls couldn't be seen from every angle.
The game did have some normal based lighting but it wasn't
very visible.

So to improve this I fixed up the normal lighting so it was more
noticable and then added SSAO. With the new pass system (detailed
below in *Internals*) this ended up being somewhat system to add
(apart from tracking down some gpu specific bugs). SSAO comes
with a peforance hit but it isn't noticable on high end machines
and I plan to add an option to disable it on low end machines.

### Students got a model

![A student sitting](/img/student-model.jpg){:align="left"}

[The old blue box model will be missed][boxy] but the new model
is much more fitting. Like the professor this model is fully
setup for the tinting system that was made previously.

The student uses modified animations from the professor with an
additional sitting animation.

I still need to add other student models (female, other looks etc)
however this takes a lot of time so i'm defering that to a later
date.

### Skin color fixes

Minor tweet to the underlying texture of professors/students so
that skin colors don't look as washed out.

### Shops

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Shops and queuing somewhat working <a href="https://twitter.com/hashtag/gamedev?src=hash">#gamedev</a> <a href="https://twitter.com/hashtag/indiedev?src=hash">#indiedev</a> <a href="https://t.co/fRG1MorjIT">pic.twitter.com/fRG1MorjIT</a></p>&mdash; Thinkofname (@thinkofdeath) <a href="https://twitter.com/thinkofdeath/status/872434231510806528">June 7, 2017</a></blockquote>

### Background for the main menu

The main menu now renders the a dummy game instance to use as the background.

## Internal

### Threaded pathfinding

Whilst its still not done in the background I have used [rayon][rayon]
to at least compute a few paths in parallel.

### Render passes

Implemented a new pipeline system for handling render passes. The pipeline
is defined using a builder: [here][passes]. This made adding the passes for
SSAO much easier.

<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

[boxy]: https://twitter.com/thinkofdeath/status/868129670360969217
[rayon]: https://github.com/nikomatsakis/rayon/
[passes]: https://gist.github.com/Thinkofname/6bfdf7d613f42d71eda2e0b4496d6ad5
[stylish]: https://github.com/Thinkofname/stylish
[stylish_web]: /demo/stylish_web/
[webrender]: https://github.com/servo/webrender