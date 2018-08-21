# Unnamed Javascript Test Framework

## Design

I wanted to clearly define the three stages of a test: setup, exercise, and verify.
Each of these stages gets it's own API function to define it. This forces the test
author to put each piece of test code into one of these three stages, coercing them
into thinking about their test in terms of these stages.

The purpose of using a `setup` step is to avoid using global variables in tests.
Global variables that can be reassigned or mutated can cause a lot of problems with
tests leaking into one another. By _encouraging_ the use of the `setup` stage to provide
setup vars, we decrease the liklihood of this happening. However, it doesn't prevent
someone from using global vars in the `exercise` stage, and it also doesn't prevent tests
from putting a shared ("global") object in as a setup var and then mutating it.

A fluent API was considered:

```javascript
test()
  .that(somethingIsTrue)
  .when(somethingHappens)
  .given(someSetup)
```

Instead, the descriptor function design was chosen; a descriptor function is registered
to define a test, the descriptor function is invoked with an API for defining the
three stages of the test. It looks something like this (recommended practices not
used):

```javascript
test(api => {
  api.verify(somethingIsTrue)
  api.exercise(somethingHappens)
  api.setup(someSetup)
})
```

The reason for the descriptor function design is so that it's clear when the test is
fully defined: when the descriptor function completes, the test is fully defined. With
the fluent API, each step returns the test object again: after any method, you could
either run the test as is, or define it further. You could even, theoretically at least,
run a test and _then_ define it more. What would that even mean? The design is too
ambiguous, whatever choice was made to resolve sticky situations like this, some user
would expect the opposite.

Once the fluent API was abandoned, it made sense to get rid of the cutesy fluent names
("that", "when", "given"). Without a fluent API, these made less sense; worse, they might
encourage people to try to force their tests into a "sentence" structure which ultimately
distracts from the testing. Code, perhaps especially test code, will generally benefit
from "reading like a story", but that doesn't mean the story has to be in a natural human
language, and trying to make it can get in the way. Beyond that, it can also be a coercive
force on the developers, trying to force a fluent-reading API when it really doesn't make
sense and ultimately makes the interface worse.

An early plan was to have all results of the exerciser function captured into an object,
including any exceptions thrown or rejected promises. The verifiers could then inspect
the results and make, for instance, positive assertions about the presence of failures.

The downside of capturing all errors like this is that you then have to explicitly state
whether or not you expect them, i.e., whether or not the test should fail as a result of
them. This is easy enough for expected errors, errors that you're trying to test for.
But the unexpected errors are harder, errors that result from bad test logic, for instance.
If errors are captured, and you're not expecting there to be errors, then you're probably
not going to specify that they shouldn't have occurred.

So we need the test runner to fail a test when an error occurs, _unless_ specifically told
otherwise (i.e., that the error was expected).
