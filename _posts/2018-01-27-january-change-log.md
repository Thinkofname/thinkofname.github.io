---
layout: post
title:  "UniverCity - Change log"
comments: 14
---

UniverCity is a university management game being programmed in the Rust
programming language. Lots of internal work this week plus work on
implementing grading for students.

## Gameplay

### Grades

Students (finally) have grades given to them when completing lessons.
The system is still in the works but currently grades are affected
by the stats of the teacher of the lesson and not the student (to be
fixed later). The teachers skill plays the largest role in grades followed
by their control stat. If the teacher has too many students all students
in the class will suffer as a result, the game will notify the player
if this happens.

### Student UI additions

![The new tabs on the student UI](/img/student-tabs.jpg){:align="right"}

The student information page now has tabs to split up some of the information
about the student. The tabs are:

* Overview - The original timetable and stats view
* Grades - The student's grades for the currently active lessons on the
  timetable. Three entries are shown as each student takes each lesson
  3 times for completing and a final grade is computed.
* History - In the case where the student stays at the UniverCity after
  completing a term previous grades for lessons taken will show here.

## Internal

### Saving improvements

Due to the design of the game internally single-player works by connecting to
a server with some optimizations (channels instead of sockets, etc). This
works well but introduced an issue where exiting the game would cause the server
to shutdown and begin saving the game but the player could exit before this
finished. To fix this the client will now disconnect from the server and then
wait for it to fully shutdown before returning to the main menu.

### MMap'd asset loading

For release versions of the game the assets are packed into a single file.
Previously the asset loader would seek to the asset location and read it
into a vector (without locking which could have caused issues I hadn't noticed
previously, not sure why `fs::File` is `Sync`). I decided to try and use mmapping
via the `memmap` crate to improve the loading. Using this I was able to remove
the vector allocation and instead just return a slice to the mmap'd memory region.
This did involve a bit of unsafe code to do but the end result is nicer and slightly
faster in some cases.

### Rendering pipeline improvements

The pipeline system talked about in a previous post got a improvement where
it will reused framebuffer textures in future render passes when they are
no longer used (within a single frame). This removes 2 (or 3 depending on
rendering settings) large textures saving a bit of VRAM.

### Minor things

* Now using `panic="abort"` for release builds. I couldn't do this previously
  because luajit required the unwinding information to work with but the fix
  to handle rust changes with panics actually allowed this to work as well.
* The student UI was missing tooltips on the stats listed, this has been fixed.
* Fixed a case of `ok_or` being used instead of `ok_or_else` allocating a string
  everytime a lua function called a rust method, whoops.
* Used `Arc<str>` instead of `Arc<String>` to save a bit of memory.
* Optimized `ResourceKey`s to be less costly on cloning.

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