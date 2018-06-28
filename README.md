# Unnamed Javascript Test Framework

## Design

I wanted to clearly define the three stages of a test: setup, exercise, and examine.
Each of these stages gets it's own API function to define it. This forces the test
author to put each piece of test code into one of these three stages, coercing them
into thinking about their test in terms of these stages.

The purpose of using a `given` step is to avoid using global variables in tests.
Global variables that can be reassigned or mutated can cause a lot of problems with
tests leaking into one another. By _encouraging_ the use of the `given` stage to provide
setup vars, we decrease the liklihood of this happening. However, it doesn't prevent
someone from using global vars in the `when` stage, and it also doesn't prevent test
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
  api.that(somethingIsTrue)
  api.when(somethingHappens)
  api.given(someSetup)
})
```

The reason for the descriptor function design is so that it's clear when the test is
fully defined: when the descriptor function completes, the test is fully defined. With
the fluent API, each step returns the test object again: after any method, you could
either run the test as is, or define it further. You could even, theoretically at least,
run a test and _then_ define it more. What would that even mean? The design is too
ambiguous, whatever choice was made to resolve sticky situations like this, some user
would expect the opposite.
