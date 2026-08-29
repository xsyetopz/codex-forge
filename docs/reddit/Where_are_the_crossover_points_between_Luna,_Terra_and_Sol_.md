# Where are the crossover points between Luna, Terra and Sol? [Visit](https://www.reddit.com/r/codex/comments/1vzezmo/where_are_the_crossover_points_between_luna_terra/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [The1KrisRoB](https://www.reddit.com/user/The1KrisRoB/)

### **Vote:** 0

---

If you look at the [Artificial Analysis](https://artificialanalysis.ai/?models=gpt-5-6-sol%2Cgpt-5-6-terra%2Cgpt-5-6-luna%2Cgpt-5-6-sol-xhigh%2Cgpt-5-6-sol-high%2Cgpt-5-6-sol-medium%2Cgpt-5-6-terra-xhigh%2Cgpt-5-6-sol-low%2Cgpt-5-6-terra-high%2Cgpt-5-6-luna-xhigh%2Cgpt-5-6-luna-high%2Cgpt-5-6-terra-medium%2Cgpt-5-6-terra-low%2Cgpt-5-6-luna-medium%2Cgpt-5-6-sol-non-reasoning%2Cgpt-5-6-terra-non-reasoning%2Cgpt-5-6-luna-low%2Cgpt-5-6-luna-non-reasoning) scores is there any reason to use Terra (high) or even Sol (low) when Luna (max) out scores them and is substantially cheaper?
Like what is the point of Sol set to low?
I mean looking at those intelligence scores I can't see any reason to not just use the 3 max versions. eg Terra (xHigh) is slightly better than Luna (max) but barely worth the price increase until you hit Terra (max) and the same from Terra to Sol
Or am I (quite likely) missing something obvious here?
---

## Comments 39

- by [unknown](#) **&#x21C5; 7**
  <br/> Luna/max fails for many many many tasks. Use it for most things, but when it fails try a bigger model.

- by [unknown](#) **&#x21C5; 1**
  <br/> I've not had that experience, but I always use Sol to write a plan and Luna to execute the plan

- by [unknown](#) **&#x21C5; 0**
  <br/> It will happen as your repo size increases

- by [unknown](#) **&#x21C5; 2**
  <br/> What makes you say that?

If you believe the benchmarks (and I know they're not everything)

Luna (max) scores the same as Sol (max) on AA-LCR which is long context work

- by [unknown](#) **&#x21C5; 1**
  <br/> Benchmark is a benchmark, they aren’t lying. For certain tasks in the benchmark it works. It’s not representative of everything that happens in the real world.

- by [unknown](#) **&#x21C5; 1**
  <br/> How big do you feel it needs to be to get to that point?

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s not about size. It’s about complexity. It happens after you iterate on it a few times.

- by [unknown](#) **&#x21C5; 1**
  <br/> Give it metrics it can run on its own to verify correctness, see if that goes away.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah you're basically reading it right.

The main thing you're missing is that reasoning level is also a latency knob, not just an intelligence knob.

Luna max looks absurdly good on intelligence/$, but it gets there by thinking for a long time. Sol low is almost the opposite idea: you still get Sol, but with a tiny reasoning budget, so it starts working almost immediately. So the point of Sol low isn't really "be smarter than Luna max", it's "give me Sol's behavior/capabilities without waiting 2+ minutes for it to think."

Also the AA intelligence score is an aggregate. A model that's 1-2 points lower overall can still be better for a specific workload, especially coding/agentic stuff.

That said, I mostly agree with you on Terra. It's kind of the awkward middle child here. If I was choosing purely from the AA numbers, I'd probably think of the ladder more like:

Luna max = cheap deep workSol low/medium = when I specifically want Sol but don't need a huge reasoning budgetSol high/max = hard stuff where the extra compute is actually justified

Terra only really makes sense to me if you already know it performs especially well for your particular workload.

- by [unknown](#) **&#x21C5; 1**
  <br/> I suppose it comes down to how much stock you place in the benchmarks, because I look at that and see Luna on max is going to give me practically the same if not better intelligence as Sol low AND cost me less.

Speed could be a factor, but if I'm working on some code I don't really care if the AI is 10x faster or 20x faster than I would be :)

Sure business I could see it, but I don't know, it's a hard argument for me to make taking Sol (low) over Luna (max). BUT to caveat that I will say for a while now I've been on the bandwagon that says AI is "good enough" for 90% of most peoples usage and what really counts now is value for money as a consumer.

So my views are tainted by that philosophy.

- by [unknown](#) **&#x21C5; 1**
  <br/> i completely agree with this take

- by [unknown](#) **&#x21C5; 2**
  <br/> When costs are similar or close you start to look at world knowledge, a smaller model is going to reach more and have less nuance, this is why sol low maybe be the right choice for the task over Luna Max or Terra. Some of this stuff is really feels based and you as the overlord of the agent need to sus out what you’re prompt is asking of agent before you set the reasoning and model and a lot of that is learning about the domain you’re working in so you can at least at some level have an opinion on the topic

Sol low is in my repertoire but I use it where it fits my prompt and usually not on a crazy architecture plan more like broad understanding type analysis or when I have really constrained my ask so as to give it a clear ask that doesn’t require burning reasoning because the request is laid out plainly enough

- by [unknown](#) **&#x21C5; 1**
  <br/> I guess that was the point of the post.

How much of this is just "vibes" when you look at the benchmarks and see Luna (max) matches Sol (low) in intelligence, and comes in at 1/4 the cost per task.

I can't see the need for all these selections, and I kind of wonder if OpenAI (and other companies) count on FOMO to have people using more expensive models than they really need to??

- by [unknown](#) **&#x21C5; 1**
  <br/> I definitely think the paradigm of multiple models/reasoning you move between will eventually streamline they’ll figure out some way to get them to reason for an appropriate time and that’ll just be how it works someday.

But I kind of feel like the “vibes” portion of your post is the creative portion of coding with ai, benchmarks only tell you half the story and serve as a baseline.

You’ll see a SWE get much further on a lower cost model because they can see the hallucinations in the work they can direct and prompt with clarity of what they want, the model needs to infer less to get from A to B and that’s where the optimization really starts to show over a non-technical user.

When a person who knows what they want to see visually but can’t articulate in prompting the right language, more reasoning can help that person significantly more than it would the SWE.

- by [unknown](#) **&#x21C5; 1**
  <br/> There's a few things benchmarks don't show. The bigger models have more knowledge, so for tasks that they already "know" about, they'll do a lot better, while a model like Luna will need to iterate, fail, iterate, until it succeeds.

While there's some benchmarks that show "time to task completion", they tend not to do a great job at correlating with quality of output and success. So if you want to get stuff done "fast", sometimes something like Terra or Sol Low is a better proposition. Luna Max is SLOOOOOOOW. Another time when it matters is when you are providing a highly interactive experience, like a customer facing AI feature. Tasks may be simple but need to be done fast. Even Luna medium might be a good choice there, but Terra is often faster. You need to use evals to figure out the best options.

And efforts are provided because they can. Not every permutation of models and effort levels are useful. To me, Sol xhigh/max have (almost!) zero use. Slow as hell, rarely give better results.

but yes, Luna is an amazing model for the cost, there's no argument there.

- by [unknown](#) **&#x21C5; 0**
  <br/> None of the models have knowledge of context whatsoever. In fact they don't even have memory of context or previous prompts. Each time you prompt the models knows nothing whatsoever about the previous prompts. It's all stored in kv caches and intelligent prompt injections are what allows the model to gain context awareness. Just saying, you might think it's just terminology but it still matters.

- by [unknown](#) **&#x21C5; 2**
  <br/> The knowledge of LLMs is encoded into their weights

- by [unknown](#) **&#x21C5; 1**
  <br/> Nobody claimed otherwise. I referenced context awareness and knowledge of codebases and other context such as information from web searches

- by [unknown](#) **&#x21C5; 1**
  <br/> Each time you prompt the models knows nothing whatsoever about the previous prompts

    By knowledge here, I main the data used to train their weights. As in, if I ask the model to give me a list of all the operations on a dictionary in Kotlin, can it accurately list them (for something that simple all of these models will be able to, but Sol is a much bigger model than Luna and has a lot more data to tap into)

Nothing related to their statefulness, prompts or context.

I believe the technical term is parametric knowledge.

- by [unknown](#) **&#x21C5; 1**
  <br/> I agree with that. But that's not the issue at hand I think in the context of which model to choose. The different openai tiers exhibit different eagerness to enrich their existing knowledge base that is baked into their weights through tool usage and context awareness. Luna knows essentially everything there is about python, for example, sol does not have any inherent advantage over Luna in that regard. What makes sol a better planning tool is the increased eagerness for exploration and to think about injected additional information (=context) not the larger number of weights.

- by [unknown](#) **&#x21C5; 1**
  <br/> They are asking if there's any reasons to use one model over the other. The smaller models have to use tools or iterate to make up for parametric knowledge they don't have. The bigger tools just have it. That changes how many turns it takes to do tasks, as well as the likelihood to succeed on more obscure tasks or tasks that require knowledge that isn't part of the weights. Its a crapshot if benchmarks have tasks that catch that, and the usual agent terminal type benchmarks often don't, and no one looks at the knowledge benchmarks that would.

The large number of weights absolutely matter. Its why Fable still has plenty of things its WAY better when coding even though the typical benchmarks don't show it.

- by [unknown](#) **&#x21C5; 1**
  <br/> No, have to strongly disagree here. The higher tier models xdespite knowing more, engage in more tool usage, not less. That is why they consume significantly more time to get work done, not less. A 27 billion weight model can be significantly better than a 1 trillion weight model when it comes to planning for code related tasks and for the implentation as well if the 27b model is equipped with better tool usage and more intelligent context handling. This proves that a larger model is never automatically better.

- by [unknown](#) **&#x21C5; 1**
  <br/> Larger models are not automatically better, which is why some small models today are better than large models from a year ago. Better training techniques made sure of that.

But in the case of Sol, Terra and Luna, which are on the same foundation, coupled with what many of us have found running extensive suites of evals on real world products and systems, thats what we found, and is in line with what OpenAI says, and benchmarks (the right ones) show.

Heck, its why you have to push Luna to max to get those results. Effort is just the model generating more tokens, so it ends up double checking and correcting itself more, where the bigger models need to do that less for the same result.

- by [unknown](#) **&#x21C5; 1**
  <br/> ...which is the precise definition of tool usage and the employment of subagents. That is all external non-model related orchestration. Models themselves don't consume more token by their own choice, it's because an external harness feeds them with more tokens.

- by [unknown](#) **&#x21C5; 1**
  <br/> You're looking at some abstract benchmarks instead of how you use them in your context. Sol Low is the Sol model with least orchestration shit, the higher you go, the more tool calls, verifying, over-engineering while getting same/similar results to Sol Low. Luna Max will get there slower, with more tool calls, and more back and forth. Test it yourself, give exactly the same task to Sol Light, Luna Max, and Terra xHigh, compare the time/tool calls/skills used, the output. You'll have your answer.

- by [unknown](#) **&#x21C5; 1**
  <br/> Maybe I'm over simplifying it but why do I care how many tool calls it makes.

Cost per task Luna (max) comes in pretty much 1/4 the cost of Sol (low) if I can get the same if not more intelligence for 1/4 the cost per task then I find it hard to justify using Sol (low)

(again unless I'm missing something and assuming the benchmarks reflect the real world)

- by [unknown](#) **&#x21C5; 1**
  <br/> You're not getting "more intelligence". If you care about tool calls, Luna will make more tools calls than Sol Low. Test it, why are you talking to me here? See for yourself. Same prompt for Luna whatever effort and for Sol Low, and see the difference.

- by [unknown](#) **&#x21C5; 1**
  <br/> Ok so I guess your point of view is that the intelligence benchmarks are meaningless?

- by [unknown](#) **&#x21C5; 1**
  <br/> I use sol extra high reasoning. And the reason for that is even just being 2% more accurate is worth it to me in the long run because it adds up overtime. I am hearing good things about Luna and I think it’s something I should try at some point in the future, but I’m just happy with my set up now.

- by [unknown](#) **&#x21C5; 1**
  <br/> I guess I'm the opposite, I'm of the opinion the models are good enough for 90% of peoples use cases, and the real importance is value for money.

I can't justify paying 10+ x the cost for say 2% the improvement.

- by [unknown](#) **&#x21C5; 1**
  <br/> I hear you. I spend the $200 a month for ChatGPT pro and I just prefer to have the absolute best accuracy as I work on code for a product that involves financial transactions.

- by [unknown](#) **&#x21C5; 1**
  <br/> Ok to play devils advocate, why aren't you using Claude considering it consistently out benchmarks GPT5.6?

Personally given the closed nature of these models I think FOMO does play a lot into people's usage.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is dumb without proper instructions and  makes mistakes that terra would not have made.

Eg: Luna without proper instructions won't do discovery firsts and does not reason/think about what it's doing before doing it, it just does it. Feels like a single tread process that just motors on.

Terra in this same case as above feels like it will inspect what it's doing, reason a little about what it's doing and avoid breaking things, act and behaves better. Feels like it's multiple reasoning agents, multitasking self evals a little but can get lazy without proper instructions and will take shortcuts without those instructions.

Sol is terra on steroids. We know from what the release notes tells us that it's reasoning mode levels spins up 8-16 PhD level world knowledge experts, so you can think about Terra's improved way of reasoning but by a group of 8 to 16 PhD level experts to constantly argue and reason about the best outcomes for a task.

- by [unknown](#) **&#x21C5; 1**
  <br/> [](https://preview.redd.it/where-are-the-crossover-points-between-luna-terra-and-sol-v0-5vrilnga80mh1.png?width=2356&format=png&auto=webp&s=7667e2a316d33e349a686995ac815fb5e506214b)

    look at the time vs AAI as well

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah I guess I never really consider time, because most of the time I'm using AI it's doing things for me, faster than I would ever be able to do them.

Plus with OpenAI bringing back the 5 hour window for $20 subs speed becomes even less of a problem for people on that tier :)

- by [unknown](#) **&#x21C5; 0**
  <br/> Probably the best usage of Luna is as subagent . Use Sol as orchestrator and tell it to use Luna Max subagent for dumb and straightforward tasks. I found it quite helpful

- by [unknown](#) **&#x21C5; 1**
  <br/> That's how I've been using it, I have Sol write the tasks out and specify that I'm hanging it off to a cheaper model. Seems to work out ok

- by [unknown](#) **&#x21C5; 1**
  <br/> Yo uso luna xhigh o max para planear y me ha ido bastante bien. No he probado sol pero no le veo aún la necesidad
