# I now officially hate test cases, all after codex [Visit](https://www.reddit.com/r/OpenaiCodex/comments/1w5eits/i_now_officially_hate_test_cases_all_after_codex/)

### **Subreddit:** [r/OpenaiCodex](https://www.reddit.com/r/OpenaiCodex)

### **Author:** [Euphoric_North_745](https://www.reddit.com/user/Euphoric_North_745/)

### **Vote:** 31

---

Before codex, test cases are not that important to me, I make a few playwright tests near the end of dev, other tests in important parts that finished and not under development, and that's it!!!!\
There are a few defects here and there, then qa does its job, defects go away, we fix them, and done. the shit works.
After codex, there is code, and there are tests, and there are tests to test the tests, and there is verification, qualification, centralization, asefication, magnification, bazingafication, shitivedatchion, shit!!!
I do not want a single test shit, development now is 100% slower and there are still defects, after all this shit there are defects the same as without it, so why is all this shit
---

## Comments 13

- by [unknown](#) **&#x21C5; 4**
  <br/> Hahahah, understandable. Try something like ponytail and see if that help. Also make sure that there is no directive somewhere to build your app using the TDD methodology.

- by [unknown](#) **&#x21C5; 5**
  <br/> Good tests can be very helpful but current models love doing shit like “assert timeout == 4” basically, where they just assert all these values are equal to whatever they were set to. Then when you end up tweaking the value now you need to change the test too which sucks.

- by [unknown](#) **&#x21C5; 3**
  <br/> I can completely relate.

No amount of instructions or constant explicit prompting was really fixing it for me. Sol especially wants to generate pointless tests, add production slop just to allow the tests to be written. One time because I said stop trying to implement large integration tests they must be pure unit and only test production code he decided that bootstrapping an in memory SQL lite database in the test case was suitable.

So, because it love to test so much, I gave up trying to overly prompt that out, instead I I've created a reusable component library which is basically all the non-deterministic "rules" that all the AI generated code should follow. That's one of the test conditions now.

I let it create all the shitty test coverage but it's not considered a pass until every rule is met. So not "don't do this" more "you haven't finished validating it yet".

It probably burns more tokens then if it just got it right first time, but at least the result is always very close to what I want.

- by [unknown](#) **&#x21C5; 1**
  <br/> i have now new tasks to delete test cases, adding goals to delete or reduce tests

- by [unknown](#) **&#x21C5; 2**
  <br/> Regression testing is the only thing I generally care about

- by [unknown](#) **&#x21C5; 2**
  <br/> It refuses to go straight to production and insists on a preview then the preview doesn’t work and just eats tokens.

- by [unknown](#) **&#x21C5; 2**
  <br/> You forgot to test the verifier of the test validation harness self-tests!

- by [unknown](#) **&#x21C5; 1**
  <br/> who knows, maybe it is now testing the test cases of the testing system

- by [unknown](#) **&#x21C5; 1**
  <br/> haha, change the deployment contract otherwise you'd be burning through CI usage like there's no tomorrow

- by [unknown](#) **&#x21C5; 1**
  <br/> Smoke test and Harness now carry 25% of a repo code these days.

- by [unknown](#) **&#x21C5; 2**
  <br/> mine 8s smoking some shit stuff, it needs a better smoke

- by [unknown](#) **&#x21C5; 1**
  <br/> Codex multiplies tests when the contract is just "make it verified". Pin it to one regression per bug it fixed, and reject asserts that echo the constant it just wrote. That cuts the magnification spiral without losing the useful checks.
