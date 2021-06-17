# Overview

Infects an object with multicast property and method mirroring.

```
reflect(source, ['property_a', 'property_b', 'method_a']).onto(target);
```

The `target` object will be invoked with the same calls/values as those
made against the `source` on the listed properties and methods -- or
ALL enumerable properties and methods if none are given.

You can `shatter` the mirror to stop the reflection.

```
let mirror = reflect(source).onto(target);

// later.
mirror.shatter();
```

Once an object is being reflected, regardless of whether it is being
actively mirrored, it is embedded with reflection hooks. This library does
not try to remove those hooks at any time. Your object may corrupt.

# Contributing

Yep. Feel free to contribute.

There is currently no build step. Tests can be run with:

```
yarn test
```

Or,

```
yarn test:web
```
