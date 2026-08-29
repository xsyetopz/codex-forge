# Sol vs Terra vs Luna: What Actually Worked for Me [Visit](https://www.reddit.com/r/codex/comments/1uz7pua/sol_vs_terra_vs_luna_what_actually_worked_for_me/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [gorgono95](https://www.reddit.com/user/gorgono95/)

### **Vote:** 71

---
I tested GPT-5.6 Sol, Terra, and Luna across real tasks in a large TypeScript monorepo with a frontend, backend, desktop and mobile apps, CI/CD, release tooling, and thousands of source files.
This is not a scientific benchmark ... just what consistently worked for me and hopefully can help you out to choose which model/effort to use for your projects:
**What I use**:

- **Sol high:** Best default for serious implementation. Strong at following changes across packages, writing tests, handling tooling, and catching platform-specific details.
- **Sol xhigh:** Use for architecture, security, migrations, CI/release workflows, and final reviews. Better judgment, but usually unnecessary for routine implementation.
- **Sol medium:** Good for small, clearly bounded fixes.
- **Luna high:** Surprisingly good for documentation, issue writing, repository navigation, and evidence gathering. It occasionally matched or beat Sol medium there. I would not use it for cross-platform or high-risk implementation because it missed operational details that Sol caught consistently.
**What I usually avoid**:
- **Terra:** Mixed results. Terra xhigh did very well on one narrow UI task, but the advantage was small. On a more demanding high-risk task, Terra max failed to complete reliably. I now avoid Terra for critical or cross-cutting work.
- **Max/ultra effort:** Usually not worth it. High is my normal sweet spot, with xhigh reserved for decisions where mistakes are expensive.
My biggest lesson: **reasoning effort does not replace model capability.** Luna xhigh does not automatically become Sol high ... also, a cheaper model can use more tokens or require more correction, so cheaper per token does not always mean cheaper per completed task.
My current default is **Sol high**, one well-bounded phase at a time.

---

## Comments 36

- by [unknown](#) **&#x21C5; 10**
  <br/> Similar here. I don’t use terra at all. Mostly Sol high but a lot of Luna xhigh. Luna xhigh and max are slow compared to terra but more token efficient overall it seems.

- by [unknown](#) **&#x21C5; 8**
  <br/> ChatGPT " hey write me a plan for this based on <include a small dump of the area of code > to do X, hand that off to Luna High or Very High, let it do whatever, have Sol High in a DIFFERENT CHAT (so you dont lose your cache-key) review the current diff changes

The trick is using Luna High/Very High for the bulk of work and leaving Sol to the planning and review, then take those changes back to luna.

I say to use chatgpt Sol High because it doesnt (currently) eat into limits i think, and it alows me to have some back and forth to discuss the change ideas without burning unreal amouints of usage

Your think about Luna XHigh not becoming sol high, is right... but Luna XHigh/Max does compete well with terra high and Sol Med and 5.5 XHigh

- by [unknown](#) **&#x21C5; 1**
  <br/> How you are handing over to Luna? Currently if you are on Sol you cant start a subagent with Luna due to their new implementation of sub-agents. You just switch models?

- by [unknown](#) **&#x21C5; 3**
  <br/> Tell it to create tasks for the plan with clear boundaries e.g. Task 1,2,3 etc… and then with each phase, ask it to delegate each task/phase to a new chat session with Luna as model, and within each sub chat session, Luna can run and spawn its own sub agents. When the task is done, the initial Sol chat can then review it and continuously push it back to those specific chats if something still needs to be fixed.

- by [unknown](#) **&#x21C5; 1**
  <br/> Ah, I see. I've been doing exactly that, just code review was happening with separate sub-agent. Thanks for idea.

- by [unknown](#) **&#x21C5; 1**
  <br/> Is the tokendraining bug still there? Why must you do it in different chat

- by [unknown](#) **&#x21C5; 7**
  <br/> Take a long task then make detailed plan using SOL high and write in a markdown. Then use Luna high to implement. And then review the work using SOL high.

It works really well.

- by [unknown](#) **&#x21C5; 7**
  <br/> Or just give the entire thing to sol high to implement. You're done 3x faster and with almost the same tokens spent 🤣

- by [unknown](#) **&#x21C5; 2**
  <br/> Big key thing here is you can make use of chatgpt web with sol high since it’s separate from codex usage

- by [unknown](#) **&#x21C5; 1**
  <br/> True but it doesn't see your project like codex does no?

- by [unknown](#) **&#x21C5; 2**
  <br/> You can have Chat also scaffold the project, download the project, git init, and open the project in Codex. I use that workflow all of the time.

Separately, in the new ChatGPT Desktop app, with Codex mode selected, you can reference a ChatGPT Chat in a Codex task. That also works quite well.

- by [unknown](#) **&#x21C5; 1**
  <br/> you can attach your github throuhg a connector, dont think tis quite the same though but for some things it coudl work

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah unfortunately not, but a lot of times for larger stuff, I will add a zip of the relevant files for my project and will attach it as a source to gpt and have it review / plan accordingly

- by [unknown](#) **&#x21C5; 1**
  <br/> And it can access your repo to review code

- by [unknown](#) **&#x21C5; 2**
  <br/> i always get confused on this.  if the higher model has all the context loaded isnt it cheaper to work it with that model vs delegating down.   sometimes i delegate down and need a smarter input and switching just doubles token use because i had to have the model read it again.  i still dont have it completely down.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes it is. Everyone keeps saying plan with a high model then execute with cheap one but all they are doing is wasting time and tokens. 5.6 is so good that terra high or sol medium one shots almost everything. The only time you want to plan with a higher model is If you're writing a whole app or the feature is actually huge

- by [unknown](#) **&#x21C5; 1**
  <br/> the problem is when there are a ton of files to read. Sol will burn through usage

- by [unknown](#) **&#x21C5; 1**
  <br/> Completely agree, Luna High is a great workhorse and super cheap usage wise.

- by [unknown](#) **&#x21C5; 2**
  <br/> I actually use 90% of the times Luna ,mid/high/xhigh . It's more than enough for implementations bug fixings documentations, analysis, but also planning if the task is moderately difficult.

The remaining 10% or less I use 5.6.Sol for architecture or complex decisions and plans.

- by [unknown](#) **&#x21C5; 1**
  <br/> Terra is actually really good at read/test only git diff review, because it's smarter than Luna, but it's not almost overly persistent like Sol. I find it useless for writing code. It's neither an economic enough writer nor persistent enough for agentic implementation, but genuinely, as a reviewer it's worth a second look. I think it's the best at this out of all 3 models.

- by [unknown](#) **&#x21C5; 1**
  <br/> Especially for multilingual tasks or front-end work, Terra (high) reaches the goal much faster than Luna (max).

- by [unknown](#) **&#x21C5; 1**
  <br/> I dont know why but Luna xhigh overthinks a lot, luna medium only does part of the plan then say he's done... Luna high seems to be perfect.

- by [unknown](#) **&#x21C5; 1**
  <br/> Wow, interesting

I find sol high and above overkill for the work I’m doing atm

Medium for planning and low for implementation. Xhigh feels hallucination territory (or at least overthinking to the point of detriment) within serious projects (so far) but good for building one shot “show off” greenfield things I’ve found.

- by [unknown](#) **&#x21C5; 1**
  <br/> I don't really like any of the new models. Sticking with 5.5 High it does what I want most of the time and does not leave behind completely unrelated fresh ideas. At least that was my experience with Sol. Not saying it's bad, but I felt out of control.

- by [unknown](#) **&#x21C5; 1**
  <br/> I love Terra (high) - read more here: [https://www.reddit.com/r/codex/comments/1vfd4ey/how_closely_does_this_chart_match_the_usage_limit/](https://www.reddit.com/r/codex/comments/1vfd4ey/how_closely_does_this_chart_match_the_usage_limit/) and [https://www.reddit.com/r/codex/comments/1vcyjho/why_are_luna_benchmarks_like_deepswe_so_good_i/](https://www.reddit.com/r/codex/comments/1vcyjho/why_are_luna_benchmarks_like_deepswe_so_good_i/)

- by [unknown](#) **&#x21C5; -1**
  <br/> LOL if you've got endless budget sure or are working on small scale changes and small codebases sure but when your doing big refactors its a LOT more budgetable to use Luna High/Xhigh and let Sol plan and review the diff onces things are done and feed that back to luna.

- by [unknown](#) **&#x21C5; 4**
  <br/> You think luna x high ismore performant per task then sol low? Not sure if you're paying  more with sol low but you're still getting a big model thinking of the task

- by [unknown](#) **&#x21C5; 5**
  <br/> The benchmarks clearly show it is. [https://cdn.sanity.io/images/6vfeftx9/articles/5b9d20f2489ad000ea4135f99f08feb6fd4ff33a-4640x2656.png?w=1200&auto=format](https://cdn.sanity.io/images/6vfeftx9/articles/5b9d20f2489ad000ea4135f99f08feb6fd4ff33a-4640x2656.png?w=1200&auto=format)

Luna Max is often basically a better Sol low *unless* you care about task speed. You could argue that the slightly less performance of Sol low is worse the better speed or that Sol medium is worth costing 2x for much better speed and also often slightly better performance.

What I've found to be best is plans made with Fable+Sol and implemented by a Terra med orchestrator, with Fable/Opus/Sol advisor, orchestrating Luna xHigh and Luna med subagents.  Plans get generated fast. Terra, while it would usually have mixed results, get harnessed well by the plans. xHigh Luna subagents are slow, but when orchestrated in parallel they go fast. Since Luna is doing the vast majority of work, cost is low.I don't have actual benchmark tests, but in the work I've done the past week (~300k lines of code written/changed) in many different languages, my gut feeling is that this is giving like +/- 100% the performance of fable at 25-30% the cost. I would have hit my limits using Fable and Sol more heavily, and both have glazed the results in reviews and my own review glazes it. I say +/- 100% the performance of Fable because I think Luna writes incredibly good code, often better than Sol and Fable, so I think the result is better than if Fable or Sol just did it top to bottom.

- by [unknown](#) **&#x21C5; 4**
  <br/> The benchmarks don't reflect big model thinking. Use them as rough guidelines, not rulebooks.

- by [unknown](#) **&#x21C5; 2**
  <br/> Ok. *Without* going by benchmarks, my experience is that Luna xHigh and Max are both far better than Sol Low for agentic coding.

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm more concerned about logic fallacies than coding strength at this point. Sol low hasn't made any coding mistakes for me yet.

- by [unknown](#) **&#x21C5; 2**
  <br/> Sol writes way too much code which adds more debt that you'll pay down the line.

- by [unknown](#) **&#x21C5; 1**
  <br/> Then how come Luna scores better on high effort? I think benchmark matters because its solving those issues differently at high effort but not efficient on token usage and time.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah i've seen this chart. Even though it apparently does better (slightly) i agree that you have to give it a detailed plan before letting it work on the task.  The downside is that plans arent specd out perfectly upfront so a bigger model is useful to understand the intent behind the task. So if you're paying similar amounts for sol low vs luna max at the similar performance might as well use sol low subagents.

- by [unknown](#) **&#x21C5; 1**
  <br/> Okay, well.I don't do prompting except to write, review, revise plan, and implement plan. So I don't have this issue and Luna sips tokens while implementing a ton well.When the plan changes in the middle, the plan gets revised and they're told to make the code match the revised plan.

People using Sol for everything are probably more vibe coding, and aren't hitting their usage limits, or they're not paying for API tokens themselves and don't care. I want to get lots of work out of my 20x sub so I do it optimally to save on tokens and to get high quality per token.
