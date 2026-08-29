# Sol low > Luna max: agree/disagree? [Visit](https://www.reddit.com/r/codex/comments/1uvnei2/sol_low_luna_max_agreedisagree/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [petburiraja](https://www.reddit.com/user/petburiraja/)

### **Vote:** 16

---

Testing 5.6 models and effort variants through my workloads so far, I concluded that Sol medium/high is best for me as main Codex agent, while Sol XHigh/Max are best as subagent advisors, which are applied sparingly on key/strategic items.
While main subagent implementation variant which delivered best results was Sol Low, not any of Luna variants.
I also suppose, that each model Max variant is not optimal for many cases, since it is usually significantly slower for marginal gains.
Another interesting thing, that in my setup there is still a role for GPT Mini, which serves as helper subagent to perform routines and simplest volume loads.
Curious, what other people experience and models/variants stacks have arrived at for main agent/advisor/subagent worker roles?
---

## Comments 17

- by [unknown](#) **&#x21C5; 5**
  <br/> I also have found that a big model that thinks less is better than a small model that thinks more.

Yes the smaller model, benchmark wise might perform better in intelligence or coding by a bit but sol low will not full up the context window, will answer faster and will hallucinate less than luna.

Then again it depends on what kind of work you do.

- by [unknown](#) **&#x21C5; 3**
  <br/> I'm all about those hallucinating models. Shows character

- by [unknown](#) **&#x21C5; 3**
  <br/> imagine a low iq money trying to think big vs an intelligent ape that thinks low

- by [unknown](#) **&#x21C5; 6**
  <br/> Sol Low as your best subagent worker aligns with my testing too. The models that think less often produce cleaner execution on repetitive volume tasks without burning token budget.

- by [unknown](#) **&#x21C5; 6**
  <br/> Sol low is insane. At first I thought it was better than 5.5 medium but now I'm thinking it's better than 5.5 high.

Saying that, Sol is still dumb af when it comes to the big picture. It's not as good as Fable (when Fable works, which is almost never)

I don't think I'll bother with Terra or Luna. Small models are dumb no matter how you pimp them out.

I don't trust OpenAI's subagent v2 system that they released with 5.6 so I don't use subagents any more. I'm getting more usage this way. I've seen people posting stories of unshared cache, subagent sessions being dropped prematurely, too many subagents, subagents being called using fast mode by accident... it's just one big red flag. No thanks.

- by [unknown](#) **&#x21C5; 3**
  <br/> Depending on your workflow, luna can be significantly cheaper than sol due to much lower token costs.

Just loading the system prompt alone will be much cheaper with luna.

Also if your workflow is heavy on ingesting data. Luna can be great.

- by [unknown](#) **&#x21C5; 3**
  <br/> Luna is very good at simple task execution and very fast

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes for very simple stuff luna is the way. I use luna for searching, for running tests and reporting back warnings/errors, stuff like that that would just junk up Sol context. Basically a great subagent utility for real agents.

- by [unknown](#) **&#x21C5; 2**
  <br/> I found that Sol is better for inferring user intent then Luna. But do we need that in subagent?

- by [unknown](#) **&#x21C5; 2**
  <br/> Actually, you need to distinguish between two things: model intelligence and depth of thought. If the task you are handling does not require much knowledge reserve but is merely tedious, you can achieve your goal by using a smaller model paired with a deeper level of thought. If the task itself has a high requirement for knowledge reserve, then you will need a more intelligent model.

- by [unknown](#) **&#x21C5; 2**
  <br/> [](https://preview.redd.it/sol-low-luna-max-agree-disagree-v0-tigoc9xcsfeh1.png?width=1391&format=png&auto=webp&s=6305cd954eaa1741eee89ea97606818c3a70bc39)

    voilà your answer :)

Luna Xhigh is just as smart as Sol Low (overall; for details, you need to look at individual benchmarks), but it costs $0.15 instead of $0.20 for Sol Low.

- by [unknown](#) **&#x21C5; 1**
  <br/> I do a openquestion self compile Q&A thing with low reasining sol. it follows the task instructions and just things done for most task. it's pretty neat.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol on Low reasoning is easy on my Plus sub limits, and way faster than Luna and Terra on High. I may use Terra on medium for very simple tasks.

- by [unknown](#) **&#x21C5; 1**
  <br/> According to DeepSWE, Sol low is about the same as Luna High.

Considering benchmarks are not perfect, and what you do with it could impact it, it wouldn't be too weird if Sol Low performed better than xhigh or max for you. Its close-ish even in benchmarks.

Sol low seem to be about 1/3rd of the price as Luna Max too for the same tasks, so you come up way ahead there.

Personally I have Sol Medium as my threshold before I drop to Luna Max or xhigh, but your millage will vary when things are this close.

- by [unknown](#) **&#x21C5; 3**
  <br/> The biggest bench difference in those is Omniscience Index.

AA-Omniscience Index Sol-low 18 Luna-max -11 (xhigh is -12 and it just gets worse from there)

That's a spread of 29 points, which is large.

This is a rating of how reliable they are with information. Meaning, you don't want Luna for real tasks. It's great at "go get this for me real quick" or "watch this test", but it will make stuff up if it doesn't know the answer.

- by [unknown](#) **&#x21C5; 1**
  <br/> fair. Probably why I have so much success with it, as I use these "Flash" models mostly for orchestration and not for coding or to get info (beyond fetching it and summarizing a web page)
