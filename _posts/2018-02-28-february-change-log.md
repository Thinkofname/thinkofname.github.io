---
layout: post
title:  "UniverCity - Change log"
comments: 15
redirect_from: "/2018/01/28/february-change-log.html"
---

UniverCity is a university management game being programmed in the Rust
programming language. This month was spent mostly on the business side
of things including going through the steam partner process.

## Internal

### Steamworks(-rs)

As i'm working on putting them game on [Steam][steam] I wanted to
integrate with steamworks. There didn't appear to be any work on this
already so i've begun some work [here][steamworks-rs]. I've only
been wrapping parts that may be useful for me currently due to a lack
of time but i'm more than happy to accept PRs for missing parts.

This ended up harder than I originally expected due to the design
of steamworks. The steamworks library was originally designed with
a C++ interface with a C interface added later on. The C interface
is lacking in some parts, missing:

* Any way to handle callbacks
* Only can handle call results with polling
* Global accessors are missing preventing use of most of the api

  I've tried using the `SteamAPI_ISteamClient_Get*` API but whilst
  it did return instances to work with they didn't seem to work the
  same in every case.

To handle this i've had to use the C++ API in these cases with a
thin wrapper built and linked via a build script. I've tried to
make the wrapper as rust-like as possible. I'm not completely
sure if the wrapping is completely safe as it is currently as
the documentation is a bit sparse in places on the correct way
to use methods. Thread-safety is a concern as well because whilst
the API supports being used in multiple threads, parts state they
cannot and some state that the whole API mustn't be used whilst
they are being called. So far I haven't found a reason to use these
methods yet so i'm hoping I can just avoid the issue altogether.
As it stands the wrapper in its current state seems to work with my
limited testing with the test AppId (480) and my own but i'm hoping
to put it through some more real-world testing soon.

```rust
let client = Client::init().unwrap();
let user = client.user();

client.register_callback(|v: AuthSessionTicketResponse| println!("{:?}", v));
client.register_callback(|v: ValidateAuthTicketResponse| println!("{:?}", v));

let id = user.steam_id();
let (auth, ticket) = user.authentication_session_ticket();

let result = user.begin_authentication_session(id, &ticket);

client.run_callbacks();
```

### Steam builds

Had to rework my CI build process slightly to work better when uploading
to steam. This required seperating the assets from the main build so that
they could be placed in their own depot and shared between all platforms.

### Swtiched to MSVC for Windows builds

Due to linux servers being cheaper and the fact I develop on linux i've been
cross-compiling my game to windows via the Mingw toolchain which has been
really useful for testing quickly. However due to the integration with steam
requiring the use of C++ I wasn't able to have Mingw link with the steamapi.dll
correctly and have had to swap to MSVC instead. Luckily most things already
worked when building the only issues I had were with my own luajit bindings when
building for 32 bit and getting the Nvidia optimus (and the AMD version) flags
exporting correctly.

### GPU flags for MSVC

Originally I had hoped to do this in a reusable crate but that doesn't seem
to be possible. Apparently just having these variables public wasn't enough
to do the trick and a seperate definition file (included below) was required
before the driver would pick them up.

As part of my build I now use `.cargo/config` to manually a linker parameter
as followed: `-Clink-arg=/DEF:gpuopt/lib.def`. I've only been able to test
with one Nvidia optimus laptop but i'm assuming this should work for all
of them.

```rust
#[no_mangle]
#[allow(non_upper_case_globals)]
pub static NvOptimusEnablement: u32 = 1;

#[no_mangle]
#[allow(non_upper_case_globals)]
pub static AmdPowerXpressRequestHighPerformance: u32 = 1;
```

gpuopt/lib.def:
```
EXPORTS
    NvOptimusEnablement DATA
    AmdPowerXpressRequestHighPerformance DATA
```

## Gameplay

### Staff room

![Staff can now finally take a break](/img/staff-room.jpg){:align="left"}

Finally added a staff room which will allow tired staff to rest. Currently
the room only contains sofas to rest on but i'm planning more in the future.

In order to have sofas work (due to allowing two people on one object) I reworked
the sitting scripts in rooms and shared a lot of the code between them in the
process, in theory it should now be possible to add chairs with any number of
seats now.

### UniverCity Settings

![Per a player UniverCity configuration](/img/uni-settings.jpg){:align="right"}

To go along with the staff room players needed a way to control various
settings with their UniverCity. A new settings screen has been added to
allow players to do this. Currently this only has a way to control when
staff takes breaks and leave the staff room but I'm planning to add more
here in the future.

### Improved roads

![Roads are now a crossing at the edges](/img/new-roads.jpg){:.cimage}

Roads are now crossings at the edges of the map and between players in
multiplayer. This was somewhat attempted before but ended up being really
broken in a lot of places, this should correctly handle all those cases now.

### Minor things

* Objects now effect the skill of professors in a lesson.

  Players can add objects to help their professors teacher better
* Objects now have effects on students

  e.g. plants can makes students happier
* Staff shouldn't get stuck in toilets anymore

  This actually effected more than toilets but theres where it
  was originally noticed.
* Scroll bars have been improved

  The collision on the scroll nub has been fixed and the scroll
  speed when using the mouse wheel has been improved
* Fullscreen should mostly work on Windows

  I've had a few issues trying to get SDL2 to go fullscreen on
  Windows in a way that works in every setup, hopefully I've
  got the major usecases working now.

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
[steamworks-rs]: https://docs.rs/steamworks/
[steam]: http://store.steampowered.com/