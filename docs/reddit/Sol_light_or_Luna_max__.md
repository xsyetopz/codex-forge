# Sol light or Luna max ? [Visit](https://www.reddit.com/r/codex/comments/1vlxhis/sol_light_or_luna_max/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Owdez](https://www.reddit.com/user/Owdez/)

### **Vote:** 5

---

I’m trying to understand the difference between Luna and Sol when Luna is set to Max reasoning. Luna is really cheap and mostly does the job well, but would switching to Sol on Light or Medium reasoning benefit me, especially for coding? I’m thinking about saving tokens
---

## Comments 29

- by [unknown](#) **&#x21C5; 10**
  <br/> Sol is wiser and better for long running tasks.  Luna is more efficient but use it with a good spec or something that’s not too complex.

- by [unknown](#) **&#x21C5; 19**
  <br/> Luna Max is an incredibly capable model for coding. Think of it as a team of senior devs that  code super, super fast.

Sol is a genius at building projects. It can do the job of several senior devs + the ui manager + the analytics expert etc, in one prompt

If you know what your product should look like and want to build it, use Luna

If you just have a vague idea of what you want, better call Sol

- by [unknown](#) **&#x21C5; 10**
  <br/> I saw what you did there .

- by [unknown](#) **&#x21C5; 2**
  <br/> Sol light cant even handle long context windows 😭

- by [unknown](#) **&#x21C5; 3**
  <br/> I literally chill on Luna medium

- by [unknown](#) **&#x21C5; 5**
  <br/> Luna will be enough for 80-90% of tasks, I would not use Sol unless you're facing a blocker due to it's tendency to spawn sub-agents for everything.

- by [unknown](#) **&#x21C5; 2**
  <br/> On xhigh it doesnt spawn subagents really ever if not explicitly instructed to do so.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thank you, will try this on Sol xHigh.

Another theory I've yet to test myself is telling it to use Luna as a sub-agent, in my use case I found it was spawning 10+ agents for each data analysis run that just called Python.

Ultra being suited for longer running tasks (think 3-4 hours) would absolutely require the task being split into smaller chunks for agents to handle as opposed to the traditional conversation compacted -> move onto next task flow.

- by [unknown](#) **&#x21C5; 2**
  <br/> That wont work unfortunately. The subagent implementation in codex doesn’t allow the agent to change the model/thinking effort. Sol xhigh can only spawn sol xhigh subagents to my knowledge (if they havent fixed that yet)

- by [unknown](#) **&#x21C5; 2**
  <br/> You can tell Sol or Terra to spawn a separate Codex task using Luna with whatever thinking level you want (I currently use xhigh) and it will report back to the parent Codex task. I use a 3 level system currently, Sol as architect/project task, spawns a numbered phase task pinned to Terra - xhigh, Terra then implements phase objectives by spawning named tasks using Luna - xhigh, which report back to the parent phase task which does the review before accepting or rejecting the work. If accepted it reports back to the project task and you only really interact with the project task. I have it all documented in workspace rules (the various markdown files used by Codex) and even specify the sub-tasks are limited to 2 tries before escalating up the chain.

Edit: with my workspace rules I don't have to tell Codex to follow these rules all the time. I had to check it once when I first implemented it, and since then it's been good. I do sometimes explicitly allow the project level Sol agent to spawn subagents within it's own task if needed when I'm trying to speed things up and have usage left I can burn.

- by [unknown](#) **&#x21C5; 1**
  <br/> You must have a noisy context or agents.md.

In my 3 accounts that I use .. in none of them SOL will spawn agents unless I ask.

- by [unknown](#) **&#x21C5; 0**
  <br/> [](https://preview.redd.it/sol-light-or-luna-max-v0-k5f0q7s7hxih1.png?width=315&format=png&auto=webp&s=04f5a88ee8d048e36b3d5a9d3f968c587e525c3d)

    Just basic data analysis, not a lot of context/or even context switching but we're talking logs that are 100MB+. I'm sure you could get it to not spawn/or only on request/even use Luna for sub-agents for peak efficiency.

I don't think you need an agent for everything so would make sense to be selective about it.

I've yet to reach any limits, never been a problem but I find between Luna for daily driving + Sol as my problem solver to be the sweet spot.

- by [unknown](#) **&#x21C5; 0**
  <br/> No clue what are you talking about now.

But what you said about Sol “tendency” is not true

- by [unknown](#) **&#x21C5; 0**
  <br/> You suggested I had a noisy context or agents[.]md file - I clarified my task was to do with large chunks of data, but still just basic data analysis so spinning up 53 agents could be considered excessive.

That might be your experience, when using Ultra it tends to spin up more agents than I personally think is needed for the task. Luna did not exhibit the same behavior.

- by [unknown](#) **&#x21C5; 0**
  <br/> 53 concurrent subagents and using Ultra?

Ugh bro… your context must be so stinky that you will be burning tokens like crazy. Don’t do that.

- by [unknown](#) **&#x21C5; 2**
  <br/> I feel no Luna is good enough for any Sol, that’s my take based on what I use

However, Sol medium and Terra max are my 2 common use, Luna max only for very simple task

- by [unknown](#) **&#x21C5; 1**
  <br/> whats the sol equivalent for terra max in your opinion

- by [unknown](#) **&#x21C5; 1**
  <br/> I was pretty happy with 5.5 before 5.6 public, and I think Terra high/max is kind similar as 5.5, which I was very okay with, I do like Sol, but I try to keep it balance with my limited funds

- by [unknown](#) **&#x21C5; 1**
  <br/> Don't switch from Luna to Sol mid-task, Luna already gets bad enough and forgetful towards the end of the context window from my experience then you're just going to make it worse with switching models

If you're trying to save tokens make chatgpt save the task as a markdown file then put it into chatgpt Web chat with all your sources and files since it uses Sol High for no token cost and build a plan there, Luna is good with following instructions but not the best planner

- by [unknown](#) **&#x21C5; 1**
  <br/> terra high 速度快，价格便宜 准确率也不错

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm currently redevelop and migrate classic asp project to modern laravel, using 5.6 Sol Medium is greater than 5.5 medium. however I still keep sol than other.

- by [unknown](#) **&#x21C5; 1**
  <br/> I refer to this graph daily when considering scope / difficulty of tasks. My answer is actually Both sol and Luna for a task!

[https://artificialanalysis.ai/articles/gpt-5-6-intelligence-vs-cost-across-sol-terra-luna](https://artificialanalysis.ai/articles/gpt-5-6-intelligence-vs-cost-across-sol-terra-luna)

Recently  started using codex_workflows heavy which uses Sol as the orchestrator and breaks everything down into Luna xhigh subagents. Seeming to take a very long time because it chunks it out into so many subprocesses, but it had upwards of 15 Luna subagents running in parallel and it was barely sapping my usage limits. In fact doing the Sol xhigh planning with spec kit used way more than implementation has so far, so I might look into a way to trim that down.

I planned with spec kit, and made a bridge to take the docs after analyze step to prep it for workflows

- by [unknown](#) **&#x21C5; 1**
  <br/> If u can wait, luna max is gonna outscale sol low in both cost and code quality

- by [unknown](#) **&#x21C5; 0**
  <br/> Sol light reasons similarly to Luna max, but is faster and uses more tokens

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol Light does absolutely not use more tokens than Luna Max?

It's token usage, and therefore filling up it's own context window, is one of the primary downsides of Luna Max.

- by [unknown](#) **&#x21C5; -5**
  <br/> Neither.

- by [unknown](#) **&#x21C5; -3**
  <br/> You're being downvoted but you might be right. Luna burns through the context window too fast. It's chaining autocompacts. Sol can easily slip into over engineering.

Terra on medium is dumb as bricks and often makes mistakes. I assumed Terra high would be like medium but just bashing its head against a brick wall more. Turns out Terra high is quite good. OP - try it.

- by [unknown](#) **&#x21C5; 0**
  <br/> Terra high/xhigh is similar to 5.3 so it's good enough to evaluate tasks as orchestrator.
