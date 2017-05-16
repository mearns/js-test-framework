
## No setup or cleanup hooks

At this point, I'm choosing not to implement any setup or cleanup at a test-context level.
I believe that using the given/taken mechanism will produce cleaner tests.

## Only one When per test

At this point, I'm choosing to limit the number of "when"s to just one per test case. I believe
this will produce cleaner tests, and it is easy enough to add support for more when's later,
if I become convinced that it is useful.
