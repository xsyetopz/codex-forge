# Testing 5.6 Luna vs Terra medium vs Sol medium for implementation only [Visit](https://www.reddit.com/r/codex/comments/1vembjz/testing_56_luna_vs_terra_medium_vs_sol_medium_for/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Diwoto](https://www.reddit.com/user/Diwoto/)

### **Vote:** 54

---
Just sharing some of my own testing. For work, I use an orchestrator workflow (eg. script launches codex exec) where planning (stored as .md files), implementation, code review, validation etc each have their own session (not subagents). This lets me swap between harnesses, like Cursor or Codex, and also the model and reasoning level for each phase or function.
The task was a feature across two repos, Java and TypeScript services with an internal API contract between them. Each model received the same 3,378 word implementation plan, which included 11 stories with acceptance criteria, dependencies, code anchors and verification work.
Note: The models only implemented the plan, they did not have to create it. My orchestrated tasks are always broken down into epics (representing PRs) and verifiable stories.
I ran three trials for each configuration:
Model
Defect-free trials
Checks
Expected behaviors
Avg Cost
Luna Medium
0/3
12/15
14/15
$0.1412
Luna High
1/3
13/15
13/15
$0.4685
Luna XHigh
3/3
15/15
15/15
$0.5917
Luna Max
3/3
15/15
15/15
$0.8199
Terra Medium
0/3
12/15
12/15
$1.0594
Sol Medium
0/3
12/15
12/15
$11.0130
**What I saw:**

- Luna XHigh consistently delivered the best result for this task relative to price, matching Luna Max on all quality measures, while Luna Max costs more and took about 40% longer per trial.
- Luna Medium was a lot cheaper but just not reliable enough. Luna High was closer, but two trials still implemented the routing contract incorrectly.
- The detailed plan really matters. In my earlier testing with a much shorter and less detailed plan, no Luna configuration produced three defect‑free trials. With the detailed plan, Luna XHigh and Max both achieved 3/3.

---

## Comments 24

- by [unknown](#) **&#x21C5; 32**
  <br/> It’s honestly hard to believe Sol Medium can’t produce a solid result after three attempts. Either the prompt is bad, the codebase is a mess, or it’s a skill issue. Sure, the first attempt might not be completely defect free, but three failures in a row? Come on.

I’m getting incredible results with Luna Max, but for my use cases, Sol Medium is absurdly more precise and effective. It’s not even close.

The only "tiny catch" is that it costs 10x more.

- by [unknown](#) **&#x21C5; 4**
  <br/> Sol Medium will give up early on a long task though I think you can fix that by setting a goal.

- by [unknown](#) **&#x21C5; 2**
  <br/> My thoughts: This workflow uses a very detailed, specific implementation plan. It can cater to models that are less prone to overthinking/overengineering and simply follow instructions. I built my orchestrator to be able to swap in cheaper implementation models where I can like GLM, like composer and even grok. This is all meant to be done non-interactively.

Sol and Terra show consistency in their defect, which is a good thing in itself. Having a model that's consistent is useful even if it interprets a requirement differently. Every defect here would be caught in code review and fixed regardless. This doesn't mean they're bad. It just means they did something different than what was expected.

- by [unknown](#) **&#x21C5; 3**
  <br/> Indeed with a lot of implementation details Sol has a tendency to get stuck in validation loops and overengineers like crazy. It also has the tendency to ignore direct requests. People keep downvoting but don't measure and test properly.

- by [unknown](#) **&#x21C5; 0**
  <br/> it can do it but just not these workflows. It's not that it's an incompetent model, just bad at following instructions. This is why I benchmark, to tweak the system to the model.

img

Also next time read the text. Sol medium alone was not even on there...

Benchmarks were validating orchestration and impact after price discounts.

- by [unknown](#) **&#x21C5; 4**
  <br/> Im just doing everything with Sol Light. I feel like development gets very slow if you use higher reasoning levels. I rather reiterate slightly faulty implementation quickly than wait 20 minutes for task to complete in high reasoning mode.

Basically:- Sol Very High for architecture- Sol Light for iteration- Tera Light for subagents. Would probably use Luna if it actually worked.

So far this has been working with for me with 200e plan and getting resets constantly.

- by [unknown](#) **&#x21C5; 2**
  <br/> luna xhigh is good but it's so slow.

- by [unknown](#) **&#x21C5; 2**
  <br/> [](https://preview.redd.it/testing-5-6-luna-vs-terra-medium-vs-sol-medium-for-v0-xeaokq80r7hh1.jpeg?width=4284&format=pjpg&auto=webp&s=49ea0f6a7ddcd7e74b56a418bcd7dc485921f43a)

    Also doing some benchmarks and from cost time performance orchestration to multiple different models is actually not cheaper and as good at the same time. Most of the time use sol medium for everything is fast, relatively cheap and reliable. The test case is a full feature vertical slice with Blazor Wasm UI +.NET 10 backend + bluetooth protocol implementation.

- by [unknown](#) **&#x21C5; 2**
  <br/> great data! I wonder if luna xhigh coder with terra high direct review-repair would beat all of those, or if luna as a coder just isn't good enough for difficult tasks

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes, I am interesting in the same. I am using the same config Terra High with Luna Xhigh, if possible please make the tests.

- by [unknown](#) **&#x21C5; 1**
  <br/> Your trial implies Xhigh is better than Max, but how do you feel about Max vs xhigh with regular use or informal testing?

- by [unknown](#) **&#x21C5; 4**
  <br/> Xhigh is definitely better than Max. Max sees regression in most tasks i gave it. It overthinks wrong solutions.

- by [unknown](#) **&#x21C5; 2**
  <br/> Do you mean max even overthinks on well defined tasks?

- by [unknown](#) **&#x21C5; 5**
  <br/> Yes.. the context grows so much that it has memory losses related to long context retrieval. In my testing the reasoning tokens made up 97% of the output. And it had incorrectly populated some dates that were for something else entirely.

- by [unknown](#) **&#x21C5; 3**
  <br/> Thanks, I'll try Luna XHigh. Max is not just a token sink but a time sink. I've found Luna High isn't good enough, and Max aces my tests but takes forever. Sounds like XHigh is the sweet spot

- by [unknown](#) **&#x21C5; 2**
  <br/> Ok thanks, will give a try to xhigh

- by [unknown](#) **&#x21C5; 2**
  <br/> Better to use xHigh and have another agent double check after than use Max in my experience.

- by [unknown](#) **&#x21C5; 3**
  <br/> yeah I think luna xhigh with ANYTHING as a code reviewer will be better than luna max without a coder reviewer... 100% of the time

- by [unknown](#) **&#x21C5; 1**
  <br/> The medium effort is very lazy on tasks require multiple turn, even for smarter models

- by [unknown](#) **&#x21C5; 3**
  <br/> this is way more interesting than the other 50% of the sub begging for resets. So I would encourage it. But I'm also mostly wondering what ppl are even building here lol.

- by [unknown](#) **&#x21C5; 1**
  <br/> Wannabe 🙋 You wouldn’t believe how pathetic I am.
