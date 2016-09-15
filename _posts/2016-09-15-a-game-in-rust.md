---
layout: post
title:  "A Game In Rust"
comments: 1
---

As a break in between programming sessions working on my game I
thought that writing posts on the features that i've been working
on and any issues (being Rust related or not) that i've encountered
whilst implementing them would be a fun idea.
As i've already started working on this project before starting
this blog the first few posts will most likely be on things i've
implemented a while ago and may happen slightly out of the order
they were implemented in. Hopefully as these go on i'll get better
at writing these posts too.

## Why Rust?

As you may have guessed from the title the game is being implemented
in [Rust][rust-site]. This is mainly because i've enjoyed working
in it for the past year so I decided now would a good time to try
a larger project in it.

Coming from a background with languages like Java, Go (etc) jumping
into Rust was challenging for me. Getting used to not relying on a
GC to clean up for me and trying to get the hang of borrowing rules
took a bit of time and I still haven't completely mastered them yet.

![My final year project at uni](/img/a-game-in-rust/ce301.jpg){:align="left"}

One of my first projects in Rust was a game I created for my final
year project at university. The game was a platforming game with
destructible terrain and multiplayer. With deadlines it didn't
end up being the neatest thing i've programmed but results
turned out well.

This project was the first time I used [Glutin][glutin] vs something
like SDL or glfw. It worked well for the cases I needed for
this project but I discovered inconsistancies across platforms
when I tried it for Steven (i'll talk about that project later).
I haven't really looked at glutin lately but admittedly I used
the project pretty early on into Rust's stable lifetime as it
had had only just hit 1.0 when I started the project.

Even though the project hasn't been touched in months it still builds
on the latest version of Rust (after a `cargo update` because some
dependencies did break between versions).

![Steven: A Minecraft client reimplementation](/img/a-game-in-rust/steven.jpg){:align="right"}

The other largish project i've done in Rust is a re-implementation
of the Minecraft client in Rust called [Steven][steven] which I
started around the same time as the previous project. This was
actually a rewrite of my client [I wrote in Go a while back][steven-go]
(apparently I like learning new languages by programming
Minecraft clients in them) as it seemed easier to work off
a existing codebase than start from scratch. This project
is public unlike the other one which allowed me to get some feedback
about the implementation.

Steven did really show how slow compiling can be in rust as
your project gets larger. A large part of the compile times
was down to the block macro [`define_blocks!`][steven-blocks].
Even with that the CI used to take over an 1.5 hours to build
a debug (`cargo build`) and a release `cargo build --release`
build. Looking at the CI now however (it always uses the nightly
build of rustc) its down to ~30 minutes which is a huge improvement
(more noticable when not doing a clean build) but still can
be unbearable when trying to test changes quickly. Incremental
builds are still being worked on for rust but hopefully should
be arriving soon.

## The game

![My game](/img/a-game-in-rust/game.jpg){:align="left"}
Planning not being my strong point i'm just making up the game as
I go with a rough idea in my head of whats going to happen.
Its going to be a management game set in a school/university type
enviroment. I'm basing the art style of the game of the game
[Theme Hospital][theme-h] which is a game that loved to play
when I was younger, it had a great sense of humour and a lot
of character.

The game is rendered in 3d at an isometric perspective instead of
2d isometric sprites which greatly simplifies the sorting issues
isometric games generally have. I also get the benefit of
using techniques like shadow mapping to get real-time dynamic
shadows as well.

[rust-site]: https://www.rust-lang.org/
[glutin]: https://github.com/tomaka/glutin
[steven]: https://github.com/Thinkofname/steven
[steven-go]: https://github.com/Thinkofname/steven-go
[steven-blocks]: https://github.com/Thinkofname/steven/blob/5e0c041a711a19a6220821c2a3c2e96f0cbb1833/blocks/src/lib.rs#L359
[theme-h]: https://en.wikipedia.org/wiki/Theme_Hospital