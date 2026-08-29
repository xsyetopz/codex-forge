# Token Arbitrage: Use Sol for coding, Luna for compaction, save 84% [Visit](https://www.reddit.com/r/codex/comments/1vec9bj/token_arbitrage_use_sol_for_coding_luna_for/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Comfortable-Rock-498](https://www.reddit.com/user/Comfortable-Rock-498/)

### **Vote:** 26

---

This is one of the unlocks from recent Luna price drops.
Suppose you are running a fairly long agentic loop with a compaction threshold around 200k tokens, and compaction triggers five times during the full loop. Each time, say the compaction generates roughly 10k tokens—a 20:1 compaction ratio. Somewhere between 8% and 12% of the total cost of such a loop will be solely from compaction, easily making it the most expensive tool call per invocation, largely due to the large token output that necessarily has to be generated each time.
Condense operations are essentially summarization operations with some trivial constraints. They primarily need to preserve task state: the objective, repository findings, files changed, commands and tests run, failures encountered, decisions made, and unresolved work. Once a model reliably extracts those fields, additional general reasoning capability is unlikely to produce any measurable improvement in the summary. ([Source: arXiv 2606.02875](https://arxiv.org/html/2606.02875v1) and many similar results.)
**Scenario A: Sol condenses its own context**
200k × $0.50/M (cached input price) + 10k × $30/M (output + reasoning tokens emitted for condense) = $0.10 + $0.30 = $0.40**Scenario B:** The harness detects the condense threshold and hands the work over to Luna.
200k × $0.25/M (cache write price; Luna does not benefit from read cache) + 10k × $1.20/M (output + reasoning tokens emitted for condense) = $0.05 + $0.012 = $0.062Compared to Sol, just swapping in Luna for compaction saves:
1 − ($0.062 / $0.40) = 84.5%This is a comparison solely between Sol and Luna; if you use something like DeepSeek V4 Flash, the savings would be even larger.
If you work exclusively in long-context loops, assuming context compaction is a 10% overhead cost, this change alone saves usage limit by 8.4% with no regressions.
I added the support for this in Dirac - try it `npm install -g dirac-cli` or [VSCode](https://marketplace.visualstudio.com/items?itemName=dirac-run.dirac)
**If you want to push it to the limits**
Notice that we used the $0.25/M input price earlier for Luna, which is a cache-write price. This content is strictly one-off, so it can be called with cache writes disabled, saving you one whole cent per call
---

## Comments 31

- by [unknown](#) **&#x21C5; 26**
  <br/> I’ve begun to notice that more token usage ≠ better. Spent a whole day trying to get Sol to direct Luna to do something, ended up burning a healthy chunk of my usage with no results to show for it. Then I switched to just using Sol High and it nailed it first shot in half the time using only 1% usage. Pick your poison 🤷‍♂️

- by [unknown](#) **&#x21C5; 3**
  <br/> The sweet spot is:

- Sol Ultra for anything that isn’t one straightforward step.

- Sol High for everything else.

- Luna Max (equivalent to Sol Light, but cheaper) for “data processing” type stuff, where it’s a lot of context but the intelligence almost doesn’t matter, like committing or summarizing or giving updates about the status of active threads.

Ultra handles planning, implementation, and adversarial review all-in-one. High is the best intelligence/capability value.

I would recommend Luna Max or Sol High ultra modes if they existed, instead of Sol Ultra which uses all max main/sub agents—the worst of all possible value propositions. I suspect the quality would be very good for radically less usage. Sol high ultra mode, in particular, would be nearly indistinguishable in quality, but much faster and like half the usage.

- by [unknown](#) **&#x21C5; 2**
  <br/> Being an unworthy Plus user, I fear that if I touch anything beyond Sol High, my face might melt off like Raiders of the Lost Ark.

- by [unknown](#) **&#x21C5; 1**
  <br/> Disgusting.

Not your face melting off. Plus users 🙅‍♂️

- by [unknown](#) **&#x21C5; 2**
  <br/> This!!!! If Sol High have to review Luna work all over, why don just let Sol High do the work. Not to mention the back and forth Sol High has to tell Luna Max to fix thing and review it again.

Only if Luna Max is good enough for almost everytime 1 shot in that case let Sol manager Luna is best option. For now absolutely not!

- by [unknown](#) **&#x21C5; 3**
  <br/> I've heard, though only anecdotally, that moving to a different class model invalidates the cache so you end up paying for the cache write twice and effectively make this less of an value improvement in the end.edit: actually it looks like you account for the addition cache write price. Interesting, thanks :)

- by [unknown](#) **&#x21C5; 3**
  <br/> Generally yes, but the compaction is the last act of a transcript, there is no cache to preserve at this point since it starts over with the compacted summary

- by [unknown](#) **&#x21C5; 3**
  <br/> Sol cached tokens cost 25 cents per million get your cache rate past 97% and your used tokens drop dramatically lowering your cost dramatically. Structure your system properly and you can run SOL max with 9 agents 24/7 for 200$ a month if you have the 20x pro 200$ per month plan.  This isn’t theoretical I do it

- by [unknown](#) **&#x21C5; 12**
  <br/> Structure your system properly and you can run SOL max with 9 agents 24/7 for 200$ a month if you have the 20x pro 200$ per month plan.

    Anyone using Pro knows this is bullshit but feel free to share your proof and methodology to prove us all wrong.

- by [unknown](#) **&#x21C5; 1**
  <br/> Not gonna happen every time I post it gets copied I see the shares on my dashboard and with 1k plus shares I’m done giving away even my sanitized methods

- by [unknown](#) **&#x21C5; 3**
  <br/> Care to elaborate how you improved the cache rate? Thanks!

- by [unknown](#) **&#x21C5; 9**
  <br/> Yeah you’re bullshitting. “Very complex architecture” lmfao

- by [unknown](#) **&#x21C5; 1**
  <br/> You’re highly regarded

- by [unknown](#) **&#x21C5; 4**
  <br/> and this is supposed to prove what? you are full of shit

- by [unknown](#) **&#x21C5; 1**
  <br/> FYI this is info from the other day I already improved my rate to 148 hours per week in I made that optimization in 48 hours and up to 25 agents deterministically dynamically orchestrated each agent has its own tracking telemetry the main agent must prove when and why each and every agent should be spawned and when and why each and  every agent should be closed every decision is logged for reproducibility . Eat shit loser

- by [unknown](#) **&#x21C5; 2**
  <br/> No, they cost 50 cents a million [https://developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing)

- by [unknown](#) **&#x21C5; -2**
  <br/> However, gpt-5.6 models introduce a distinct two-part structure for prompt caching—charging separately for reading a cache versus writing to it—and the rates vary significantly depending on the context length and processing mode: [[1](https://artificialanalysis.ai/articles/gpt-5-6-has-landed), [2](https://community.openai.com/t/question-about-gpt-5-6-api-cache-read-write-token-billing/1386256), [3](https://www.reddit.com/r/codex/comments/1usqm8a/gpt56_subagents_may_be_burning_usage_by_creating/), [4](https://developers.openai.com/api/docs/pricing), [5](https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/)]

You are wrong they costv50 cents when you’re inefficient. Do your research. I don’t use long context I use state so mine always cost 25 cents

- by [unknown](#) **&#x21C5; 1**
  <br/> It clearly says short context is 50 cents and long context is $1. Also, I'm pretty sure codex subs don't even get access to long context.

- by [unknown](#) **&#x21C5; -5**
  <br/> Bro just get good that means measure everything and make your system efficient and accurate and stop wasting money on mistakes

- by [unknown](#) **&#x21C5; -5**
  <br/> I agree. I can never understand all this Chinese propaganda ‘usage limits have decreased’ lol. It’s all user error. The $200 plan is unlimited. Almost nobody is doing anything that needs frontier intelligence assuming one plans appropriately.

I’ve been saying that for literally over a year now. Less than 1% of people are working in frontier environments even back with gpt-4. With a good plan, Luna is all you need for implementation with Sol validation/testing. It’s insane. People are the problem. Let the robots take over!

- by [unknown](#) **&#x21C5; 3**
  <br/> I'm on board with this 100% i've made so many posts trying to guide users to take a look at their codex setup but most of them honestly just don't have a clue and I mean that with no disrespect, they just prompt the chatbot, install everything that comes with recommendations don't tailor their workloads to the difficulty of the task, have spaghetti repos that force agents to explore more for the same work value if it was organized right. An experienced architect/engineer would notice.

It's no-ones fault but i'm getting tired of the ignorance and 'usage is fucked' posts with no evidence, put up your evidence or shut up saying i lost 40% on one prompt means literally nothing without the task, the token input/output the model reasoning level the subagents called in the task, cache hit rate etc etc.

- by [unknown](#) **&#x21C5; 3**
  <br/> I’m just not posting anymore because everyone is pretty closed minded and people like us are at a much higher level and these closed minded vibe coders can’t comprehend what we do so when we try to help them they just hate what they can’t comprehend

- by [unknown](#) **&#x21C5; 2**
  <br/> Ridiculous part is that I didn’t even code or use codex until this year. I spent last year building my computer from scratch and I had never built a computer before. I think people just can’t comprehend fresh minds with no bias look at things a different way because we never were told how to do something.

- by [unknown](#) **&#x21C5; 1**
  <br/> Partition work into atomic, verifier-backed outcomes; count pass, fail, and error without dropping expensive failures.

    true

- by [unknown](#) **&#x21C5; 2**
  <br/> You’re alright. I’m glad you understand

- by [unknown](#) **&#x21C5; 1**
  <br/> This is interesting, is there a subsequent drop in quality by having Luna perform it instead?

- by [unknown](#) **&#x21C5; 2**
  <br/> Not really. Because the coding agent and coding in general is the most densely trained domain for these things. I did some A/B tests and it was impossible to tell which summary was generated by which model

- by [unknown](#) **&#x21C5; 2**
  <br/> I'm going to try this thanks!

- by [unknown](#) **&#x21C5; 0**
  <br/> The part I'd check before trusting the 84% is what the cheaper compaction does to the rest of the loop. Compaction output isn't a deliverable, it's the next context window, so if the summary drops a constraint the agent re-derives it and you pay for a couple more turns of full price coding tokens. Reading two summaries side by side and not being able to tell them apart doesn't test that, a summary can read fine and still be missing the one line that mattered.

Cheap way to actually measure it: take a long task you already finished, replay the whole thing twice at the same compaction threshold, once with Sol compacting and once with Luna, and compare total spend at the point it passes your tests. By your own numbers compaction is 8-12% of the loop, so one extra iteration eats the entire saving.

- by [unknown](#) **&#x21C5; 1**
  <br/> this is so AI written
