---
layout: post
title:  "UniverCity - Change log"
comments: 17
---

UniverCity is a university management game being programmed in the Rust
programming language. This month was spent preparing my steam store
page for a release at a later date.

I'm currently still aiming to release in late May. Its pretty scary
with the date getting closer though, even with my checklist getting
smaller I still don't feel ready.

## Gameplay

### Missions

![Placement hint for the first building placement](/img/tutorial.jpg){:align="right"}

*Aka a basic tutorial.* The mission system has finished
being implemented. The mission system allows for more scripting
control over gameplay vs the free build mode. Normally scripts
are limited to only controlling one thing either a room (plus
the entities inside) or a single free roaming entity, mission
scripts on the other-hand run over the whole level (including
multiple players although this currently doesn't come up *yet*).
They can intercept events and cancel them, inject their own commands
for a player or send commands from the server. A special mission
only command exists to allow mission scripts to send their own
data to the client to control the visuals like the placement
marker and the hint box.

This system needs to be expanded in the future, the number of
events currently fired are only the ones needed for the tutorial
for example, but for now it will do.

### Placement helper

![Placement help, grid lines off into the distance to help with lining objects](/img/placement_helper.jpg){:align="left"}

One of the things that came up in testing was that lining up
objects with other objects was pretty hard due to the camera
angle. To help with this I've extended the placement grid
off the edges (but without the filling). I think it could
look better but I'm leaving that until later.

Along with this I also fixed the placement grid not showing
up when editing a room in limited mode (editing a room without
being able to remove it, used when a building has rooms inside)
like the building. A few objects don't use the placement grid
currently but hopefully that can be improved in the future.

### Floor placement improvements

Changing the floor of a room works just like any other object in
the game making adding/changing them pretty simple for me.
Unfortunately this also meant their placement worked just like
other objects which caused:

* Tiles could be stacked costing the player for every tile
  on the stack, also slowed down loading times in this
  case if stacked enough.
* Placement could be painful as they had to be placed one
  at a time.

To fix the stacking issue floors are now slightly special
and remove any previously placed tile at a location when
placed.

To fix the placement issues an object setting was added
allowing the placement style to be changed, floor tiles
can now be drag placed making placing a large number of
them easier.

## Internal

### Build Process

![Current full gitlab pipeline](/img/pipeline.jpg){:align="right"}

I was asked on [twitter](https://twitter.com/FilmFabrikTV/status/987320354455654401)
to talk about my build process so I thought I'd bundle it up with
the monthly blog post as well.

The build process is run via a [gitlab][gitlab] runner using
their pipeline system however due to budget issues other
parts are involved (explained later).

#### Test

The first stage is the testing stage. This stage builds
the client and server in debug mode (to ensure that building
is working before doing the release builds), it then
runs the (sadly limited) set of tests that the game has.

This step also includes part of the release process as well
(despite its name) as it was quicker to do it here. It
packs up the assets into the format the game uses and
regenerates the license information from all the crates used
using a fork of [`cargo-license`](https://github.com/onur/cargo-license)
called [`cargo-unilicense`](https://github.com/Thinkofname/cargo-license)
which outputs the information in a json format. This
is all stored as an artifact to be downloaded later.

#### Prepare (Linux)

This step runs for both 32 bit and 64 bit builds, both
builds are mostly the same.

Builds are run in a docker container with separate images
for 32 bit and 64 bit (which the testing step also uses).
The docker images are normally rebuilt every time a new
stable version of rust is released. The images contains
the dependencies required to build pre-installed and some
tools `cargo-unilicense`, `sccache`. The 32 bit version
also builds a 32bit version of sdl2 to link against.

The builds themselves are just simple `--release` builds
with `rpath` and `lto` set. The builds are then stripped
and packaged up with the luajit library and `libsteam_api`
as an artifact to be downloaded later.

#### Prepare (Windows)

This step runs for both 32 bit and 64 bit builds, both
builds are mostly the same. These only run for
commits on the release branch to save money on spinning
up the servers.

The Windows version's build process has gone through
a lot of changes since the start. Originally I used
`mingw` to cross-compile to windows allowing me to use
my current server to build the game without issue.
The problem came when I added steamworks to the build,
it seems that because of ABI differences I have to use `msvc` instead
of `mingw` in order to use steamworks (this wouldn't be
an issue if the steamworks api had a pure C version but
the C bindings it does have are imcomplete). At this
point I moved to setting up a gitlab runner in a VM on
my desktop to run the builds, this worked fine but
was a pain as my PC would become slow whenever a build
was running and I couldn't run builds if my PC wasn't on.
I started to look into cheap ways of using a Windows server
to run the builds, auto-scaling using gitlab's docker-machine support
looked good at first but it seems like it doesn't support
running Windows on the target machines yet. So I decided
to write a simple script that would run the builds and then
kill the server. I tried both AWS and GCP
and settled on GCP because its per-second billing for
Windows ended up making the builds slightly cheaper.

The script itself spins up a preemptible server using
the `gcloud` command line tool and waits for it to
start. It then `ssh`s into the server which has been
setup to have a powershell instance on the otherside
and pipes commands to it. The commands downloads
`sccache` and setups some environment variables
and clones the repo using the gitlab provided
token. It then builds release builds like on linux
with `lto` enabled and a `.cargo/config` setup
to export some variables for optimus laptops.
As an extra step I currently use ResourceHacker to change
the icon of the binary as Rust currently doesn't
provide a way to do this. The build results are then
copied back with `scp` and the instance killed/deleted.
The results are then uploaded as an artifact to gitlab.

If there is a better way to do Windows builds I'd love suggestions
because I'm still not completely happy with my current setup.

#### Deploying to Steam

Nothing to special here, I'd mostly be repeating the
documentation from [here](https://partner.steamgames.com/doc/sdk/uploading).
I just have a script that downloads the artifacts from the builds
before and then uploads each one as a separate steam deport.

#### Other Information

I've recently started using [`sccache`](https://github.com/mozilla/sccache)
(actually a [fork](https://github.com/thinkofname/sccache/tree/get-s3) of
it with one change so I could use for a non-public `minio` bucket) to speed
up builds. Previously I just had gitlab cache the `target/` folder
however the target folder ends up getting pretty big after a few
builds (locally mine can get between 15-40gb if I don't cargo clean
every now and again) and ends up taking a long time to cache.
When I replaced the cache on the linux builds (Windows builds
had no cache) the build times actually got slightly slower but
due to not having a long cache step at the end the build times
improved greatly.

* Debug:
    - Before: 10m 4s
    - After: 3m 16s
* Prepare (Linux 64 bit):
    - Before: 22m 27s
    - After: 15m 47s

However when I enabled `sccache` for the Windows builds I didn't seem
much (if any) improvement. They are uploading things to the cache
yet according to the `sccache` logs they are missing the cache a
lot (but are hitting it sometimes). I've yet to work out why currently
but it is something I wish to solve.

### Asset layout changes

I made a slight tweak to the layout of assets to hopefully
improve the modding situation down the line when that gets
added as I thought it would be better to do a change like this
earlier on. The changes:

* Before: `/assets/<pack name>/...`
* After: `/assets/<pack name>/<pack name>/...`

It may seem pointless to require the pack name twice but
with the changes to the asset loader this allows for
mods to override assets from other packs. For example
if a mod called `test` included a folder called `base`
(the name of the core game's pack) like so:
`/assets/test/base/...` files in the `base` folder
would override the assets from the core game.

### Saving changes

Previously save files would save the placement actions of an
object (the actions the script took to place an object)
which would allow for recreating the level to be pretty
quick. As a downside if I ever changed an object's script
to fix something like the collision bounds any previously
placed objects wouldn't update until they were manually
picked up and replaced. To fix this the save file instead
saves the position, rotation of where an object was placed
along with a script provided version number (to handle large
changes) and simply recalls the script on load to replace the
object. This ended up being slightly harder due to the fact
some objects required walls that didn't exist at certain
points during loading but it seems to work fine now.

### Fixed the SSAO glow

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Finally fixed the dark glow around everything (A bug with the SSAO). Something that has been pointed out to me a few times but I&#39;ve only just tracked down. <a href="https://twitter.com/hashtag/gamedev?src=hash&amp;ref_src=twsrc%5Etfw">#gamedev</a> <a href="https://twitter.com/hashtag/indiedev?src=hash&amp;ref_src=twsrc%5Etfw">#indiedev</a> <a href="https://t.co/GxgtC8lkcK">pic.twitter.com/GxgtC8lkcK</a></p>&mdash; Thinkofname (@thinkofdeath) <a href="https://twitter.com/thinkofdeath/status/986683607870828545?ref_src=twsrc%5Etfw">April 18, 2018</a></blockquote>


As pointed out to me a few times and what has been a bug for a
while now is that everything had a dark glow around it. This
was a bug in the SSAO shader which I had struggled to track
down. The issue turned out to be a bug with the range check,
changing the value used until it looked right fixed the issue.
My understanding of shaders like this is limited but it
seems to be working.

```diff
--- a/assets/base/base/shaders/ssao.glsl
+++ b/assets/base/base/shaders/ssao.glsl
@@ -29,7 +29,7 @@ void main() {
         offset.xyz /= offset.w;
         offset.xyz = offset.xyz * 0.5 + 0.5;
         float depth = texture(g_position, offset.xy).z;
-        float range_check = smoothstep(0.0, 1.0, radius / abs(frag_pos.z - depth));
+        float range_check = smoothstep(0.0, 1.0, 7.0 / abs(depth - frag_pos.z));
         occlusion += float(depth <= sample.z + bias) * range_check;
     }
```

### Lua improvements

Storing values in lua's registry was always slightly error
prone (with my luajit bindings at least) due to the fact
you had to use the right string key and type of the
thing (as stored in lua) you were trying to get out every
time you wanted to access it. Enter the `LuaTracked` trait
along with the `(store/get)_tracked` methods


```rust
/// A value that is managed/stored in lua
pub trait LuaTracked {
    /// The key in the registry where this value is stored
    const KEY: &'static str;
    /// The type of the value that will actually be stored
    type Storage: lua::LuaUsable;
    /// The value that will actually be returned
    type Output;

    /// Tries to convert the storage into the output
    fn try_convert(s: &Self::Storage) -> Option<Self::Output>;
}

impl TrackStore for lua::Lua {
    fn store_tracked<T: LuaTracked>(&self, val: T::Storage) {
        use lua::*;
        self.set::<Ref<T::Storage>>(Scope::Registry, T::KEY, Ref::new(&self, val));
    }
    fn get_tracked<T: LuaTracked>(&self) -> Option<T::Output> {
        use lua::*;
        self.get::<Ref<T::Storage>>(Scope::Registry, T::KEY)
            .ok()
            .and_then(|v| T::try_convert(&v))
    }
}
```

This ends up nicer to use than constants and type aliases that
were being used previously.

Along with this I finally removed one of the largest actually
unsafe thing being done in the game. Passing the `Level` into
lua as a `*mut` pointer to bypass the borrow checker. This
was done previously because the level calls into scripts which
may need to access the level to read tile/room information
and handling this ended up being hard so I worked around it.
I finally took the time to split up the level struct a little bit
and used a `Rc<RefCell<_>>` to allow both the level and lua
to own and use the data. Its harder to work with as I now
have to watch out for borrow errors at runtime when both the
level and a script tries to access something at the same
time but in the long run it will have hopefully prevented
any silent but dangerous issues popping up later.

### Minor things

* Fixed the server sometimes trying to save every tick causing
  slowdowns.
* Scrollbars apparently broke with some scripting changes I made
  a while back, this was fixed.
* Nightly caused tests to fail to find the steamworks lib for some
  reason, fixed by setting `LD_LIBRARY_PATH`.
* Fixed icons ended up being gamma correct twice and looking too bright.
* Fixed cancelling staff placement
* Fixed the remote command buffer being larger than the max packet size
  causing a crash.
* Tile flags weren't being cleared when a tile was changed causing some
  weird bugs.
* Updated webrender + stylish, this seems to have fixed an Intel GPI
  (Windows only) rendering bug that was happening on the UI

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
[steam]: http://store.steampowered.com/
[gitlab]: https://gitlab.com/