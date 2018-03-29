---
layout: post
title:  "UniverCity - Change log"
comments: 16
---

UniverCity is a university management game being programmed in the Rust
programming language. This month was spent preparing my steam store
page for a release at a later date.

I've been aiming to release UniverCity some time next month into early
access in order to get some feedback and testing however I'm not currently
happy about the game's state so I'll most likely be delaying it a little
while longer.

The game has a lot of the core mechanics implemented but still feels too
bare to release (even in early access). My plans are to finish the
basic tutorial and implement a few more build-able rooms/objects
and then start thinking about early access again. I'm hoping this wont
take too long.

### Early Access Trailer

As the store page required a trailer, I attempted to create one. I used
OBS to record the footage and Blender's built-in video editor to splice
and edit the clips together. My video editing skills still need a lot of
work but I'm hoping this is at least passable.

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/knarohG14G4" frameborder="0" allowfullscreen></iframe>

## Gameplay

### Confirmation prompts

![Asking the player to confirm whether they really wanted to delete the save file](/img/confirm.jpg){:align="right"}

This has been a long time coming. A lot of the people I had test the
game would sometimes perform actions (e.g. deleting a room) without
meaning to. To help with this I've renamed a few buttons and added
a confirmation prompt to deleting a room with objects placed in it.

I've also started reusing this prompt in a few other places to prevent
mistakes from happening.

### Campaign/Mission work

I've started work on implementing a system to write missions which I plan
to use for the tutorial and a short campaign (challenges). I've currently
got the selection menu implemented and have been working adding features
for scripts to have more control over the game including sending commands
to the client. Its still pretty early days for this though.

### Save icons

![Save icon](/img/save-icon.jpg){:align="left"}

Finally got around to implementing icons for saves instead of having the white
placeholder box. This ended up being harder than I thought due to the fact that
saving is handled on the server (even in single-player) whilst the client is the
one doing the rendering. This required setting up a separate channel where the
server could request the client to save a screenshot and send it back to the server.
There was a few edge cases with handling the client being closed and trying to save
at the same time but these have (mostly) been handled.

One issue that came up was extracting the save icon to display on the save file
list ended up being slow and froze the screen for a second whilst loading it. The save
format is currently json encoded via serde and trying to only load part of a json
file still requires parsing all of it. The solution to this was to move the save icon
(and some other header information) outside of the json and store as binary. This
ended up being much faster to load removing the pause completely.

## Internal

### Initial [Steam][steam] integration

Following on with last months post I've started to use the [steamworks][steamworks-rs]
API within my game. Currently its used for multiplayer to verify that
the connecting user is who they say they are and to fetch display names.
Next up would be achievements and steam multiplayer (without a dedicated
server). I'm currently deferring this until a later date though to
focus on gameplay some more.

### Rust <--> Lua via serde

I currently use my own lua wrapper for luajit instead of something like rlua
purely because I started building my game before it really existed and swapping
now would take a lot time.

One issue with my bindings has always been handling tables from a lua function
and passing tables into functions. Previously this required something like this:

```rust
// Reading

let tbl: Ref<Table> = ...;
let r: i32 = tbl.get(Ref::new_string(&lua, "r")).unwrap();
let g: i32 = tbl.get(Ref::new_string(&lua, "g")).unwrap();
let b: i32 = tbl.get(Ref::new_string(&lua, "b")).unwrap();

// Creation

let tbl = Ref::new_table(&lua);
tbl.insert(Ref::new_string(&lua, "r"), 4);
tbl.insert(Ref::new_string(&lua, "g"), 4);
tbl.insert(Ref::new_string(&lua, "b"), 4);
```

Which ends up being pretty long winded for larger structs.

I decided to try and write a serde `Serializer` and `Deserializer`
to see if this could be done automatically. The end result is
that I'm now able to just mark a struct with
`#[derive(Serialize, Deserialize)]` and then pass it to
`lua::to_table` to create a table or `lua::from_table` to parse a
table into a struct.

### Binary icon (Windows)

Managed to add an icon to the final binary on Windows. I couldn't work
out a way to do this with just the rust compiler/cargo so I ended up
invoking `ResourceHacker` as a build step to patch an icon into the
binary. It would be nice to drop this step so if anyone has a better
way of doing this please let me know.

### Minor things

* Fixed reloading a save in multiplayer. This previously required the
  players to rejoin in the same order and even account for gaps in
  their allocated ids if someone left in the lobby. The server now
  automatically assigns players back to their original ids in this
  case.
* You can no longer (try to) load saves from multiplayer in single player.
  This would generally crash due to missing players.
* Fixed a crash that happened if you edited a room whilst a student was
  leaving the UniverCity.

## Twitch

I haven't been streaming my work on [twitch here][twitch] lately
but sometimes I will pop up and stream for a bit.
Feel free to stop by and watch if I'm streaming.

## Subreddit

I've opened a subreddit for the game as per someones suggestion. It's
mostly empty currently but hopefully that'll change once I get some
time to put some work into it. [Here][subreddit]

[twitch]: https://www.twitch.tv/thinkofname
[subreddit]: https://www.reddit.com/r/Univercity/
[steam]: http://store.steampowered.com/
[steamworks-rs]: https://docs.rs/steamworks/