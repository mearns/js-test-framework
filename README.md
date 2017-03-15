## Examples

```javascript

import {regarding} from 'js-test-framework';
import {expect} from 'chai';    // or any other assertion library, or nothing at all.

import * as myModule from './myModule';

regarding(myModule, (regardingMyModule) => {
    regardingMyModule.andSpecifically(regardingMyModule.subject.frob, (regardingFrobFunction) => {
        regardingFrobFunction.testThat(({oneMay, when, given}, frob) => {
            oneMay((it, {expectedOutput}) => {
                expect(it.value).to.equal(expectedOutput);
            })
            when(({input}) => frob(input));
            given({input: X, expectedOutput: Y});
        });

        regardingFrobFunction.testThat(({oneMay, when, given}, frob) => {
            oneMay((it) => {
                expect(result.threw).to.be.an.instanceOf(Error);
            });
            when(({input}) => frob(input));
            given({input: Z});
        });
    });
});
```

The order in which the functions of the test spec (passed to `testThat`) is recommended
to be reversed from typical style. The typical style is "given...when...then", also known as
"arrange...act...assert". This is a natural way to write code: you setup your environment,
then perform some action, then make assertions about what happened. But it's not really
a natural way to think about tests.

Instead, we recommend writing your tests in reverse order, which is why we had to change
some of the names ;-). In this framework, tests should be written as
"OneMay \[expect that\] ..., When ..., Given \[that\] ...". This isn't simply the order in
which the code should occur in the file, it's the recommended order for actually writing
(and thinking about) your tests: decide what state it is that you actually want to assert on,
then figure out what actions you need to take to bring that state about, and lastly determine
what needs to happen to setup your actions (which is largely incidental to the test).

You aren't obligated to write your code in this order: all your "givens" will be run
first, then your "when", and lastly your "oneMay"'s, regardless of what order they
appear in the code. This is simply recommended as a best practice. Also note that the
order in which your "givens" occur is the same order in which they will be applied to
setup the test, and likewise the order of your "oneMay"'s is the order in which they
will be applied to assert on your test.

### API Documentation

### `regarding([description], subject, spec)`

Creates a new context for running tests in. Contexts can be arbitarily nested.
This is similar to a "describe" in mocha.

The `spec` is a function that will be invoked _to define_ test cases in this context.
This is done unconditionally (though not necessarily syncronously or immediately),
even if test case evaluation is conditional (e.g., only run tests cases matching a
certain pattern).

When `spec` is invoked, it is invoked with a single argument, generally referred to
as the _context API_. This object includes the necessary functions for defining sub-contexts
and test cases within the context created by the call to `regarding`. It also includes
functions for setting up and tearing down tests. Lastly, it includes a `subject` property
which is set to the value of the `subject` parameter passed to `regarding`.

It is recommended to _not_ unpack this parameter, and to name it something specific to
the context. This will avoid having the same name reference different variables within
nested scopes. The suggested pattern is something like `regarding${Subject}` so that
your statements utilizing it read somewhat fluently.

If `spec` returns a thenable, then the specification is not considered defined until
the thenable fulfills. The specific fulfill value is ignored, but this can be used
to define sub-contexts and test cases asynchronously using the provided API objects.

### `ContextAPI::andSpecifically([description], subject, spec)`

This is the same as the top-level `regarding`, except that it creates a nested context.

### `ContextAPI::given(setup)`

This is the "before-each" setup hook for the context. It works similarly to `TestAPI::given()`,
except that the setup is performed for every test case defined in the context _and_ in nested
contexts.

Note that it is generally prefrable to limit the amount of setup done in a context, pushing as
much as possible down into the test cases. Consider this function a crutch. The recommended
way to do common setup is to define common setup functions at an appropriate scope,
and simply have the test cases call `TestAPI::given` with that function is they want to use
the same setup. Performing common setups in a context makes it harder to keep track of exactly
what setups apply in each test case, and hard or impossible for individual test-cases to pick-and-choose
which pieces of setup they want.

Returns an object with a single method, `taken(cleanup)`, used for cleanup/teardown.
This method is passed a cleanup function which is called after a test case
is evaluated, regardless of whether the test passed, failed, or erred. The cleanup
function is invoked with an object containing the test variables as were defined
at the time the corresponding setup function completed. If subsequent setups
_replaced_ the value of a test variable, the replacements will be rolled back
by the time then corresponding cleanup function is called.

As a **best practice**, you should avoid mutation of test variables: subsequent
setup functions can result in _replacement_ of test variables, but should not mutate
the existing objects. If mutation occurs, then the test variables passed to the cleanup
function will be different than those that came out of the setup function.

#### `ContextAPI::given.pure(setup)`

The `ContextAPI::given` function has a `pure` method attached to it, which marks the given
`setup` as a pure setup. Otherwise, passing a `setup` (either a function, an Object, or a
promise of an Object) is identical to passing it directly to `given`.

A **pure** setup is one which _has no side effects_ and whose result depends _only_ on the
explicit inputs. An Object setup is implicitly a pure setup, but neither a setup function
nor a setup promise are implicitly pure and must be marked as such if you know that they are.

A pure setup can be invoked at any time, and one or more times, and will always return the
same value. By marking a setup as pure, the test runner can take advantage of this by running it
once for all tests that use it and simply caching the result. It is unspecified whether or not
a pure setup will be run if there are no test cases that rely on it, but since it is a pure function,
it doesn't matter.

Marking setup and other test steps as pure can greatly improve the speed of the run, because the
pure steps can be run once and reused many times, and they can be run in parallel. However, you
**must make sure that the functions are really pure** or you will run into any number of race
conditions and your tests will be generally meaningless and unpredicatable.

### `ContextAPI::testThat(description, testFunc)`

This is how you actually define a test case within a context.

The `testFunc` is a function that will be invoked _to define_ the test case. Similar to
the `spec` function passed to `regarding`, this is invoked unconditionally during test
definition (though not necessarily synchronously or immediately). _If and when_ the test
case is actually evaluated, any functions passed to `given`, `when`, or `oneMay` will be invoked,
as described below.

#### `testFunc(testAPI, subject)`

The `testFunc` is invoked with two arguments as shown above. One is the test API which
provides functions for setting up and running the test case. The second is the subject
of _the context_ in which the test is run (i.e., `ContextAPI::subject` for the closest
containing context).

Since test cases are never nested, it is fine to unpack the `testAPI` into the individual
API functions that you need.

### `ContextAPI::tag(tag, [tag, [...]])`

Used to tag subsequent tests and sub-contexts with the specified labels. When running tests,
you can select which test cases to run based on the applied tags. Tags applied to a context
apply to every test case defined inside it, _or_ inside a sub-context.

The use of this function looks like:

```javascript
regardingMyModule.tag('foo', 'bar').testThat(...);
```

Specifically, the `tag` function does not alter the state of the `ContextAPI` on which it
is invoked (at least no in any meaningful way), but instead returns an object which has the same
interface as `ContextAPI` but will attach the specified tags to any sub contexts and test cases
defined with it.

### `ContextAPI::doOnce(setup)`

```javascript
doOnce((Object) => Object);
doOnce((Object) => Promise<Object>);
```

A setup method that ensures the given setup is performed at most once, and only
if a test case within the context is actually to be evaluated. This will be treated
as a test step in a test case evaluation, in the correct sequence in which the
`doneOnce` function is invoked relative to any `given` function invocations, however,
the step will have state associated with it such that once it has been invoked once,
it will become a no-op for any future test-cases it may be attached to.

Like the setup function passed to `given`, it will be invoked with an object containing
the current test variables, and any non-null Object that comes out of the setup function
will be used to update the test variables. Since the setup function is only called once,
the resulting object is cached for use in future test cases.

This is another crutch, much like using `given` at the context level instead of inside
a test case, but even worse. Ideally, you should be doing any requisite setup and teardown
for every test case. But sometimes, things just aren't that simple.

This is _not_ recommended as an alternative to using `pure`, this is intended as a way
to perform side-effects that are not idempotent.

As with `given`, if the function throws, the step fails, and _any_ test cases associated with
it will be marked as failing in setup. Likewise if the setup function returns a thenable that
rejects or timesout. Returned thenables that fulfill are handled as with `given`.

The `doOnce` function returns an object that has an `undo` method attached to it, which
takes a `cleanup` function as a parameter and shouldbe used as a corresponding tear-down.
The cleanup function will be used for tear down _only_ once, corresponding to the single
invocation of the setup function. For subsequent test cases, the cleanup function is ignored
and normal unwinding of test-variables is performed.

### `TestAPI::given(setup)`

```javascript
given(Object);
given(Promise<Object>);
given((Object) => Object);
given((Object) => Promise<Object>);
```

The `given` function is used to setup the scenario of the test case. It has two main purposes:
define test variables and prepare requisite systems for the test. The end result of all the
calls to `given` is an object which will be passed in to the actual test function as a way
of providing test variables. Additionally, debugging information for each test can provide
information about this object to provide context for understanding a test's results.

To set up this object of test variables, you can pass in an Object, or a thennable that
fulfills with an Object. In either case, the Object will be merged into the previous
test-variable Object, created by previous calls to `given` (initialized as an empty
Object before any `givens` have been called).

Alternatively, you can pass in a function that _returns_ an Object, or a promise of an
Object. The returned/fulfilled Object will likewise be merged into the existing test-variable
Object. Also note that the existing test-variables will be passed in as an Object as the only
parameter to the provided function so you can use that to make decisions about how to populate
the returned object if necessary. Note however that _changing_ the provided Object has
_undefined behavior_: specifically, it is unspecified whether or not this is the actual
object that will be used, so changes made to this object _may or may not_ affect the resulting
test variables. In other words, don't mutate the passed in object.

Also note that the top-level fields of these Objects are considered to define the test variables,
and only a shallow-merge is done. If you return (or provide) an Object with a property that
already exists as a test variable, the value of that property will _be the new value_ of that
test variable, the values will not themselves be merged.

Passing a function is also a way to perform necessary side effects for setup, e.g., configuring
other systems that the test will rely on. However, it _important to note_ that the provided
functions are _not_ invoked synchronously or immediately. In fact, they will _only_ be invoked
_if_ the test case is actually evaluated. They are guaranteed to be executed in the same
order in which they were provided to `given`, and if any function returns a thenable, subsequent
givens will _not_ be evaluated until it fulfills.

You need to be careful about invoking functions _in_ or _around_ calls to _given_, cognizant that such
invocations are synchronous as part of the _test definition_, where as functions passed to _given_ etc.
are executed asynchronously and only when the test case is to be evaluated. For instance, it is recommended
that a function under test _not_ be executed during _test definition_, and requisite systems _not_ be
configured during _test definition_: both of these things should be encapsulated inside functions
passed to `given` and `when` so that they only occur as part of test evaluation.

If a provided function returns a `null` or `undefined` value, the value is ignored. Similarly, if
a function returns a promise that fulfills with `null` or `undefined`, the value is ignored. In both
cases, the test variables are left unchanged.

On the other hand, if a function returns a non-thennable value that is not of type "object" or "undefined",
or if the function returns a promise that fulfills with such a value, the test-case will be marked as
failing setup. Likewise, if a function returns a promise that rejects or timesout, the test-case will
fail.

Using an object is definitely a simple solution for defining test variables, but you need to be careful
about leaking references to this variable that could allow it to be modified. Likewise with the values
of the variables it defines. Using Object literals without assigning them to variables will aid in this.
Note that have a function that returns an Object that is otherwise accessible will not solve the problem.
The goal is to make sure that test variables are never modified or mutated outside of a `setup` step.

As with `ContextAPI::given`, the `TestAPI::given` has an attached `pure` method that can be used
to mark the setup step as a pure step. It also retuns an object that has a `taken` method for cleanup.

### `TestAPI::when(exerciser)`

```javascript
when((Object) => anything);
when((Object) => Promise<anything>);
```

This is where you define what actions you're actually testing. E.g., you would typically invoke your function
under test here.

Pass a function that will exercise your unit under test or perform whatever other actions you want to test.
Any value returned other than a thennable will be captured as the result value, which can subsequently be
inspected and asserted on in calls to `oneMay`. If the provided function returns a thennable, then whatever
value it fulfills with will be used as the result value.

If your unit under test is expected to return a thennable and you want to actually inspect the thennable, as opposed
to the settled state of the thennable, you'll need to wrap it inside an Object before returning it from the
provided function.

Note that if the provided function fails, or a returned thennable rejects, the test is _not automatically failed_.
A result object is created that encapsulates the results of your function, whether it failed or not. This is
the primary conceptual difference between `given` and `when` (functionally they have different signatures as well).

The result object is the one that is passed
to your `oneMay` inspectors. This provides an easy way to test failure cases. Similarly, if the thennable returned
by your `when` function rejects, the test is not automatically failed, but the information about the rejection is
captured in the result object for inspection.

You can only call `when` _once_ per test case. Calling it more than once will result in an error _during test definition_.

Like `TestAPI::given`, this function has an attached `pure` method that can be used to mark the step as pure.

### `TestAPI::oneMay(inspector)`

```javascript
oneMay((result, Object) => anything);
oneMay((result, Object) => Promise<anything>);
```

This is where you inspect the results of your `when` function and decide if your test passed or failed.

The provided function will be invoked during test evaluation _after_ all test setup and _after_ your exerciser (if any)
is settled. To fail the test, throw an Error from within your `inpsector` function, or return a thennable that rejects.
If the return thennable timesout according to a preconfigured max timeout, the test will also fail.

Your `inspector` is invoked with two arguments: the first is the result object generated by your `when` exerciser;
the second is the object of test variables setup for your test case. If not `when` is used for the test case,
then the first argument, `result`, will be null. If no `given`'s are used to prepare test variables, then
the second argument will be an empty object.

The fulfillment value of a returned thenable doesn't matter and will be ignored.

You can have as many `oneMay`'s in you test as you like, they will be run in sequence (unless marked as _pure_), and if
any one results in a failure as described above, then the entire test case fails. It is generally preferable to have
a small number of `oneMay`'s in each test case, and use multiple test cases to test multiple things.

Like `given` and `when`, this function has an attached `pure` method that is used to mark it as a pure step.
