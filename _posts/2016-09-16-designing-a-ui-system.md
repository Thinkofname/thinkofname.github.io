---
layout: post
title:  "Designing a UI System"
comments: 2
---

UI is a pretty core component of every game. There's a few different
libraries out there already which can handle this for me like:
[Flatui][flatui], [Imgui][imgui] and [Conrod][conrod] which are
all immediate mode instead of retained (my searches for a retained
mode gui library returned nothing useful). I prefer working working
with a retained mode styled GUI which has the benefit of working
better with the scripting interface I want to add later. I like
reinventing the wheel so this should be fun too.

## Representing elements

Inheritance is a pretty useful way of representing a UI system however
Rust (currently at least) doesn't have a way of doing this for us.

### Previous attempts

In the past I've tried a few different ways of handling UI in rust,
[Steven][steven] for example used a [mess of macros][steven-ui-macro]
to allow all elements to share a base set of properties and methods.
This caused a lot of duplicated code to be generated and generally
made the whole system a pain to work with. It also abused the unstable
[`Rc::would_unwrap`][would_unwrap] method to detect when references
were dropped which caused some hard to track down bugs when I forgot
to hold a reference to an element I created. It did have the benefit
that the macros could automatically generate nice builders to work
with:

```rust
let login_btn = ui::ButtonBuilder::new()
    .position(0.0, 100.0)
    .size(400.0, 40.0)
    .alignment(ui::VAttach::Middle, ui::HAttach::Center)
    .create(ui_container);
let login_btn_text = ui::TextBuilder::new()
    .text("Login")
    .position(0.0, 0.0)
    .alignment(ui::VAttach::Middle, ui::HAttach::Center)
    .attach(&mut *login_btn.borrow_mut());
```

The other way I have tried was using an entity component system to
manage ui elements (This was done in the university project I talked
about in the previous post). This solved some of the problems I had
with the previous attempt (as well as being quick to implement using
an entity component I'd already created for this project). Inheritance
wasn't an issue anymore because I could just ensure that all entities
had a base set of components and fetch them when doing layout without
caring about other attached components. This also made handling
parents easier, instead of having a graph of all elements I could store
them all linearly in memory and just lookup the parents position when
aligning the element.

```rust
pub fn create_image(
    m: &mut ecs::Manager, renderer: &mut render::Renderer,
    tex: &'static str, x: f64, y: f64, w: f64, h: f64) -> ecs::Entity
{
    let e = m.create_entity();
    m.add_component(e, Position::new(x, y));
    m.add_component(e, Size::new(w, h));
    m.add_component(e, Image::new(renderer.get_texture(tex)));
    e
}

/// Stores the position of an ui element on the screen.
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub v_align: VerticalAlign,
    pub h_align: HorizontalAlign,
    pub parent: Option<ecs::Entity>,
}
```

The issue with this system is that you lose the ability to be able
to tell what an element is, whether its an image, text etc without
checking for every type of component. For the limited UI of the
project this didn't come into play much as it only had the in-game
UI, no menus or anything else.

### Current system

For this system I went back to a inheritance-like system but instead
of using a macro to provide a base set of fields I just went with
a simple struct. Every element in this system contains this struct
and a implementation of `Deref<Target=BaseElement>` and `DerefMut`
which due to Rust's auto-deref rules allows access to the fields
from `BaseElement` as if they were from the element that contains it.

```rust
/// All elements contain at least this struct
pub struct BaseElement {
    /// The id of the element
    pub id: Option<String>,
    /// Location of the element
    pub position: Position,
    /// Size of the element
    pub size: Size,
    /// Property storage that can be used by events to tag elements
    pub properties: HashMap<String, Box<Any>>,
    /// Method to be called when the mouse is pressed down
    pub on_mouse_down: Vec<MethodDesc>,
    // <snip>
}

let mut img: Image = ...;
img.position.x = 50;
// etc
```

To allow for elements to all be stored in a `Vec` together I wrapped
them all in an enum. This does currently prevent custom element types
but I'm currently hoping that I can just provide a base set of elements
and allow 'custom' elements to just be made up of the base set, this is
something that the entity component system based version handled better.
Element also implements `Deref<Target=BaseElement>` and `DerefMut` which
simply delegates to the wrapped struct. This way when you obtain an
element (e.g. via a `get_element_by_id` method) you don't have to match
against it to simply change its position/size.

```rust
impl Deref for Element {
    type Target = BaseElement;

    fn deref(&self) -> &BaseElement {
        match *self {
            Element::Collection(ref c) => c,
            Element::Image(ref i) => i,
            Element::Text(ref t) => t,
            Element::Image9Patch(ref i) => i,
        }
    }
}
// Repeat for DerefMut
```

## Positioning

The current system I have does not handle layouts currently and
simply relies on relative pixel positions and alignment (same
with all the previous systems too). This is something I want
to work on but I haven't come up with a good way of doing this
yet.

Positioning is all handled by a `compute_rect` method which
takes the rect of the parent either computed by a previous
`compute_rect` call or the rect of the screen and takes the
`BaseElement` struct of the element.

```rust
/// Computes the bounds of the element within the parent rect.
/// This makes no attempt to ensure the size of the element fits
/// within the bounds.
fn compute_rect(parent: Rect, element: &BaseElement) -> Rect {
    let mut ret = Rect {
        x: parent.x,
        y: parent.y,
        // Size is weird here due to the fact its loaded
        // from a json file where null means inherit
        // from the parents size and less than 0 means
        // inherit but reduce by size.
        width: if element.size.width.is_none()
                    || element.size.width.unwrap() < 0 {
            parent.width + element.size.width.unwrap_or(0)
        } else {
            element.size.width.unwrap()
        },
        height: if element.size.height.is_none()
                    || element.size.height.unwrap() < 0 {
            parent.height + element.size.height.unwrap_or(0)
        } else {
            element.size.height.unwrap()
        },
    };
    ret.x += match element.position.h_align {
        HAlign::Left => element.position.x,
        HAlign::Center =>
            (parent.width/2) - (ret.width/2) + element.position.x,
        HAlign::Right =>
            parent.width - ret.width - element.position.x,
    };
    ret.y += match element.position.v_align {
        VAlign::Top => element.position.y,
        VAlign::Middle =>
            (parent.height/2) - (ret.height/2) + element.position.y,
        VAlign::Bottom =>
            parent.height - ret.height - element.position.y,
    };
    ret
}
```

As pointed out in the comments width/height is a bit weird, this
could be better handled by an enum but I haven't found a nice
way to describe it in json form. The same could be done with
the way `HAlign` and `VAlign` as the position could be contained
within the enum itself.

## Issues

### Templates

To save repeating myself in the json UI descriptions I implemented a
template system. These are just simple string substitutions (`$$`/`%%`
variables, `@@` random unique id to prevent conflicts). These are pretty
undebuggable when something goes wrong with no clear indication of
where the error comes from.

### Events

Currently they are pretty hacky. Strings that describe method
calls in json. With a 'fun' custom syntax to referring to elements
with dynamically generated ids (due to templates). This means
all functions that can be used in events must be declared up front
(scripts can't add their own) causing things like the `single_player`
call being accessible whilst already in game.

```json
{
    "on_mouse_move_out": [
        "change_texture(ui/button, @@button_back@@)",
        "change_color(0, 0, 0, 255, @@button_text@@)"
    ]
}
```

I'm not sure of a solution which allows for events to be described in
json, Rust and in scripts.

## Summing up

After attempting a retained mode gui multiple times with varying amounts
of success I'm tempted give a immediate mode style gui a go. Scripting
is still a big limiter on using immediate mode though (invoking a script
every frame doesn't sound like a good idea) but there may be a hybrid
system out there I can use.

[flatui]: https://github.com/google/flatui
[imgui]: https://github.com/ocornut/imgui
[conrod]: https://github.com/PistonDevelopers/conrod
[steven]: https://github.com/Thinkofname/steven
[steven-ui-macro]: https://github.com/Thinkofname/steven/blob/5e0c041a711a19a6220821c2a3c2e96f0cbb1833/src/ui/mod.rs#L473
[would_unwrap]: https://doc.rust-lang.org/std/rc/struct.Rc.html#method.would_unwrap
