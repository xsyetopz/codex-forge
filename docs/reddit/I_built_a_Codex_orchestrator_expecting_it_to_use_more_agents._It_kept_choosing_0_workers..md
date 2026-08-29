# I built a Codex orchestrator expecting it to use more agents. It kept choosing 0 workers. [Visit](https://www.reddit.com/r/codex/comments/1vw0zrs/i_built_a_codex_orchestrator_expecting_it_to_use/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [DickBrainTime](https://www.reddit.com/user/DickBrainTime/)

### **Vote:** 1

---

I built a Codex orchestrator expecting it to use more agents. It kept choosing 0 workers.
Been building this thing called Sol-Luna Orchestrator for Codex.
The basic idea was pretty simple: let the main Codex agent keep the actual problem/architecture, and delegate bounded work to cheaper Luna workers when it makes sense.
I originally assumed bigger tasks would naturally mean more workers.
Then I benchmarked it lol.
For smaller/tightly coupled work, delegation was mostly just extra coordination and latency. In a bunch of free-choice runs the parent straight up chose **0 workers**, and that ended up being the correct behavior instead of something I should try to “fix”.
So now 0 workers is a first-class decision. It can work solo, use one Luna worker, run dependent tasks sequentially, or parallelize actually independent work.
I also got a bit paranoid about workers confidently saying `PASS`, so the orchestrator doesn’t treat that as truth. It compares claimed vs observed file changes, checks scope, reruns verification where allowed, and gives the parent the evidence to judge.
Been dogfooding it on the repo itself and it’s been pretty interesting seeing when Codex decides delegation is actually worth the overhead.
Repo:[https://github.com/mahadansar/sol-luna-orchestrator](https://github.com/mahadansar/sol-luna-orchestrator)
npm:[https://www.npmjs.com/package/sol-luna-orchestrator](https://www.npmjs.com/package/sol-luna-orchestrator)
Curious how other people using Codex are handling delegation. Are you manually deciding when to spawn agents or just letting them go wild?
---

## Comments 3

- by [unknown](#) **&#x21C5; 2**
  <br/> openai symphony + linear

- by [unknown](#) **&#x21C5; 1**
  <br/> u can try to force models to do stuff, but when youre done doing tzhat, you will realize it can do what u want, but forgot everything else.

Multi agent MUST COME backed in.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah, that's a real problem. More agents != better if the orchestration itself eats the context.

I'm keeping the parent as the source of truth and giving workers bounded context/evidence rather than copying everything around. Context lifecycle/compaction is actually one of the next things I'm working on.

Native multi-agent support would definitely make parts of this cleaner though. (and there is support, just not "marketed" enough)
