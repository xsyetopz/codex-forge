# How does 5.5 stack up against Luna, Terra, Sol? [Visit](https://www.reddit.com/r/codex/comments/1v1lxzk/how_does_55_stack_up_against_luna_terra_sol/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [HelloBello30](https://www.reddit.com/user/HelloBello30/)

### **Vote:** 31

---

Let's say we are comparing Extra High reasoning on all 4. How does 5.5 hold up against each? Is even Luna notably superior to 5.5?
---

## Comments 51

- by [unknown](#) **&#x21C5; 30**
  <br/> [](https://preview.redd.it/how-does-5-5-stack-up-against-luna-terra-sol-v0-yxvuiwbv3eeh1.png?width=1200&format=png&auto=webp&s=ae7e0da89d861e704811c617bc0e4e1d346e0858)

    Sol medium is really good for the cost imho, I used to use 5.5 high for almost everything, now just use sol medium for implementation agegents with sol xhigh as the orchestrator. Sol Xhigh can actually drift because it overthinks on implementation tasks.

- by [unknown](#) **&#x21C5; 2**
  <br/> I’ve started using Luna for orchestration. I find Sol overcomplicating things as an orchestrator. I don’t want my orchestrator to plan, implement or review anything.

- by [unknown](#) **&#x21C5; 2**
  <br/> Might be a good idea, I think we are all feeling this stuff out for our own usage.

- by [unknown](#) **&#x21C5; 1**
  <br/> this is interesting. So we have Luna and Terra with lower intelligence than 5.5. I guess the only benefit of using them is saving on tokens?

- by [unknown](#) **&#x21C5; 2**
  <br/> Wall time mi amigo.  YOUR time has value.

- by [unknown](#) **&#x21C5; 1**
  <br/> You're saving Usage/Cost, not tokens.

- by [unknown](#) **&#x21C5; 0**
  <br/> Aqui o mesmo, Sol avança tanto, que cria situações que o fazem perder a direção, e isso é frustrante

- by [unknown](#) **&#x21C5; 1**
  <br/> Totally same except I use High for planning not xHigh

- by [unknown](#) **&#x21C5; 1**
  <br/> why xhigh ad orchestrator? or do you mean you are making it make architecture design decisions? For me in my workflow blueprint architect and orchestrator are different.

- by [unknown](#) **&#x21C5; 2**
  <br/> In my experience using an orchestrator is the same reason you hire a seasoned veteran .. such as myself.. to do a 20 million dollar ERP implementation.  Is it because you want me in there doing diagrams, and slinging code?  Hell no, you want me because I know that shit is getting out of line, and will call it out, and hit the reset button and make a course correction before we roll out the door with a disaster.  Think of it as the insurance policy.

For a long time I tried to use a weaker model to do the orchestration, and it works right up until something gets batshit insane, then there is no correction, just a mess.

- by [unknown](#) **&#x21C5; 30**
  <br/> 5.6 Sol high oversteps boundaries 5.5 xhigh never did. It edits repositories I tell it to inspect, it creates systemd units unprompted, it does way more than is appropriate.

- by [unknown](#) **&#x21C5; 3**
  <br/> This has been my experience too.

I've had to create a git backed monitoring tool so it doesn't fuck with project/repo setup.

Very unimpressed with 5.6. I've knocked back my sub to the x5, and I'll figure out what else I'll end up using.

- by [unknown](#) **&#x21C5; 2**
  <br/> Could this be solved via another agent that tells it to stick to the plan???

- by [unknown](#) **&#x21C5; 2**
  <br/> Not even that, just add a rule against what you don't like within Codex's rules manager. It's really good at following rules, even those that break its initial system prompt.

- by [unknown](#) **&#x21C5; 1**
  <br/> I didn't like this at first. But now I'm like "aww it's such an eager puppy it just wants to work". Your agents file can reign it in, and/or you just use plan mode more strictly.

5.5 hallucinates even worse and I hate it for that. I only tried it briefly and couldn't stand it.

- by [unknown](#) **&#x21C5; 1**
  <br/> 5.5 overdid a lot of times, especially in the 2 to 3 weeks before 5.6.There were many times where I asked it to change some UI on one element, and it did that plus proactively removing a firewall feature, rate limit or similar stuff, that had nothing to do with the UI itself.

- by [unknown](#) **&#x21C5; 1**
  <br/> [https://github.com/davhau/sbox](https://github.com/davhau/sbox)

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh, FFS.

- by [unknown](#) **&#x21C5; 5**
  <br/> I've started using Fable to orchestrate my codex sol 5.6 xhigh agents. It keeps them in line. Sol does like to overstep. It also follows directives to the letter, sometimes at the detriment of the project. So, with Fable 5 orchestrating it instead of stupid me, It  gives clear instructions and keeps it in check. I've also encouraged Sol to say when the instructions aren't right instead of just following them.  Medium sometimes says it's done something when it hadn't

- by [unknown](#) **&#x21C5; 2**
  <br/> I've started using Fable to orchestrate my codex sol 5.6 xhigh agents.

    Sounds like silly levels of expensive...

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah, definitely. At the moment it's serving a useful purpose because I'm collecting a lot of data on token consumption versus output quality. Moving from medium to xhigh increased token usage by about 2.5×, but on average it reduced the number of adversarial review rounds needed to complete a task by six, so the overall token cost actually ends up being lower.

For the adversarial review panel I use Antigravity Gemini 3.1 Pro and 3.5 Flash, ChatGPT Pro (browser), Gemini 3.1 Pro (browser), Codex, Claude Opus, Grok 4.5, and Qwen 3.8 Max. I've just added Qwen so no idea how good it is. I'll know in 24 hrs though once a/b testing has been done.

I've got more than enough tokens to support that workflow, and every model consistently finds things the others have missed or identifies areas that still need fixing. It's fully automated via a orchestration broker I built. Still collecting data with A/B testing, so effort levels will likely changed based on task classification.

UPDATE: A/B testing supports moving back down to medium for 5.6 SOL at 40% the cost of xhigh

- by [unknown](#) **&#x21C5; 2**
  <br/> Fable orchestrator with pre-canned prompts for multi-agent orchestration (Max doesn't burn that much at all when it knows how to delegate). This is a *must* for using /codex dispatches; tell it to keep a Haiku poll-watcher. It's cheap as shit, and weirdly more reliable than the current monitors. Codex likes to... take its time.

But Fable -> Sol 5.6 Ultra (with dispatch governance) reviews etc. is near permanent for my personal work. $400-1200 is nothing compared to the engineering automation you're getting on that (4x Fable accounts and 2x Codex here, and it's literally cognitive load that's the bottleneck at the moment). Worth every single dollar.

Sol-Ultra with bounded product separations is ironically a godsend, it's neuro-divergent fixation on polishing and re-re-re-reviewing its work is fantastic for hunting down edge-cases or finding deeply hidden bugs (instead of waiting for a ticket). But on a repo-wide task? Expect rabbit holes. The lad needs a train-set and a hobby room, not unsupervised access to a shopping mall.

- by [unknown](#) **&#x21C5; 1**
  <br/> haha. That's pretty bang on. SOL has autistic interest level focus.  I found it going round in circles working 24/7 since 5.6 came out. Now I've put Fable in front of it, they're actually getting somewhere. My daily fable use is around 15% of the fable weekly (x20) so it's not that bad at all. Most of the actual work is farmed out to SOL at the moment.

- by [unknown](#) **&#x21C5; 4**
  <br/> luna max now.

- by [unknown](#) **&#x21C5; 3**
  <br/> 5.6 sol is a major disappointment, it overengineers and turns simple problems into complex monstrosities.

Terra is basically not a model that’s ever worth using on any effort level.

Luna max may be usable as an implementer but it’s very token hungry.

All in all, I think 5.6 is a massive regression from 5.5, and I’ve personally went back to using 5.5 exclusively

- by [unknown](#) **&#x21C5; 4**
  <br/> Let me guess you're using custom instructions and skill frameworks like Superpowers? If yes that's your problem. Once I dropped all the Skills and just used vanilla Codex even running 5.6 Sol Ultra for hours wasn't a problem regardless if planning or implementing a simple or complex task.

- by [unknown](#) **&#x21C5; 3**
  <br/> The number of people complaining about 5.6 Sol but then sharing their bloated crap - Superpowers, Ponytail, RTK, etc etc etc and wonder what might be the issue...lol

I've built multiple legit full-stack (auth, APIs, payments, custom integrations etc) and never once have I used anything but the vanilla experience.

- by [unknown](#) **&#x21C5; 1**
  <br/> 100% this DO NOT USE SUPERPOWERS for Sol. It is fundamentally breaking the model entirely. I only use Sol 5.6 Ultra with just a dispatch-governance prompt in a notepad text file and it's been incredible.  It doesn't eat much usage because it's delegating the work and using async dispatch waiting to just sit there, exactly like Fable, but the return reviews are critical because you sure as shit do not want smaller models making calls on the fly.

The difference was night and day. I thought Sol was completely bugged until removing it.

- by [unknown](#) **&#x21C5; 5**
  <br/> Sol Medium or Luna Max. Both incredible

- by [unknown](#) **&#x21C5; 1**
  <br/> Has luna max been less token hungry in your experience? I usually use 5.5 medium, high if need be. A graph someone posted here said luna max is half price of 5.5 med and slightly better. what has your experience been?

- by [unknown](#) **&#x21C5; 1**
  <br/> I would say so. Its thinking more but its still cheaper overall even with lont thinking. I only use sol if genuinely see luna run circles for too long. I have a set rule in agents md to try 3 times aame thing before stopping and letting me know the issue. Then i swap to sol and get ir cracked

- by [unknown](#) **&#x21C5; 1**
  <br/> I think so, it thinks alot (max reasoning) but it' still cheaper than sol at least in my usecase

- by [unknown](#) **&#x21C5; 1**
  <br/> Are you talking about token hungry or usage hungry?

- by [unknown](#) **&#x21C5; 1**
  <br/> Hey, I'm in the same case as you, always been satisfied with 5.5 high, and I've just now become aware that Luna max and Sol medium could have comparable performance with equal or less usage. Have you found that to be true in the past month?

- by [unknown](#) **&#x21C5; 6**
  <br/> That's the part I hate more than the "get a little bit, more, or a lot of usage" pricing - they release 12 new models without communicating how they differ from one another or from the previous ones.

- by [unknown](#) **&#x21C5; 5**
  <br/> They actually did communicate it.

[https://openai.com/index/gpt-5-6/](https://openai.com/index/gpt-5-6/)

- by [unknown](#) **&#x21C5; 4**
  <br/> From these docs, can you explain the difference between Luna xHigh and Sol Light? And how are they different from 5.5 xHigh?

- by [unknown](#) **&#x21C5; 3**
  <br/> I believe Luna costs more than 5.4 mini did, meaning they effectively get to raise prices every time they phase out old models

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is $6/Mtok output, 5.4-mini is $4.50 so yes

Though I'm very certain Luna is more capable.

- by [unknown](#) **&#x21C5; 0**
  <br/> I tried to get Luna to do i18n frontend translations, and it refused saying it was too much work to do at once. Didn't use to have this problem with 5.4 mini.

Sometimes I want a dumb model that will actually do dumb busy work, without burning up the weekly quota.

- by [unknown](#) **&#x21C5; 1**
  <br/> Its a bit of a workaround, but perhaps you could ask Codex to use OpenCode (or Pi) with DeepSeek or whatever cheap, but capable model you want?

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm not allowed to use Chinese models where I work, but yeah for other cases, that would be a workaround

- by [unknown](#) **&#x21C5; 2**
  <br/> 5.6非常非常厉害 就是高峰期时间有点慢

- by [unknown](#) **&#x21C5; 2**
  <br/> Sol checks itself with multiple agents compared to 5.5. The difference is significant since you have to babysit it way less.

- by [unknown](#) **&#x21C5; 1**
  <br/> Unpopular opinion, with Luna Max i'm getting pretty much the similar outcome as the 5.5 xhigh (though it will take some more time due to its occasional fuk ups). and w/ Luna it consumes very little.  Maybe i've just gone mad and Lunatic

- by [unknown](#) **&#x21C5; 1**
  <br/> mad and lunatic?  oh so no different from everyone else :D

- by [unknown](#) **&#x21C5; 1**
  <br/> I still use 5.5 High for most of my work. 5.6 still has teething problems, and burns through tokens faster. Also since it's the new default it has some availability issues.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol is a significantly better model in comparison. You can use Light and medium perfectly fine. I daily drive High.

If you happen to use anything over high, you need to be VERY precise though otherwise it'll waste tokens trying to figure out what your vague ass wants.
