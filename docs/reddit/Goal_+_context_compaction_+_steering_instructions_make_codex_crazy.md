# Goal + context compaction + steering instructions make codex crazy [Visit](https://www.reddit.com/r/codex/comments/1w54sv2/goal_context_compaction_steering_instructions/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [sickfar](https://www.reddit.com/user/sickfar/)

### **Vote:** 3

---

It always takes my latest steering instruction after context comparison as primary and forgets that already did to follow it. And the same happens after stopping and continuing with a goal.For example, I have several review rounds and I told it not to run all tests between rounds but only affected. It did a review, ran tests, compacted context and said “hmm looks like it is going to be the first review round, I need to run all the tests before starting a review and not in between rounds”. Man, you just finished first round, wthAny workarounds here?
---

## Comments 8

- by [unknown](#) **&#x21C5; 1**
  <br/> Ask codex to create a checkpoint.md that isnt tracked.

To write into it after every milestone.

Items to include.

Work completed Items - do not read

Throw this into gpt with your own flavour so it spins up a concise prompt for you to put into agent.md

Either as raw lines, or to point in agent.md to a checkpointbehavior.md situation

My compaction doesnt affect my runs because it reads checkpoint and knows what has been done in detail.

- by [unknown](#) **&#x21C5; 1**
  <br/> Work completed Items - do not read

    How do you expect the "do not read" to work?

- by [unknown](#) **&#x21C5; 1**
  <br/> More so things that have been read and done. Do  not re attempt

- by [unknown](#) **&#x21C5; 1**
  <br/> Ok in this sense it kinda works. But it will obvious read them.

If I start someone that I anticipate will spawn more than a session I go with something like a situation.md and a dev_log.md, one is a photograph to keep updated, the other is the append log.

For proper projects there are docs and git commits ofc

- by [unknown](#) **&#x21C5; 1**
  <br/> You need a ledger of its ongoing long task so that even after further compaction it can check that ledger on where it is on its ongoing task.

- by [unknown](#) **&#x21C5; 1**
  <br/> This exact failure mode is one of the reasons I started building an experiment called **SAIPEN**.

I eventually stopped trusting the conversation context to be the authoritative record of where a long-running task actually is.

Compaction can preserve instructions surprisingly well while destroying temporal state: the model remembers *what it should do between review rounds*, but forgets that round 1 already happened.

So I started moving that state outside the session into persistent project files: current phase, completed work, pending work, audit rounds, decisions, acceptance criteria, etc. A fresh or compacted agent is expected to reconstruct its position from that state rather than infer it from conversation history.

The [checkpoint.md](http://checkpoint.md) / ledger suggestions here are basically the same direction, and in my experience that pattern scales much better than trying to engineer the perfect compaction prompt.

I'm increasingly thinking context should contain the working set, while the project itself should contain the memory.

- by [unknown](#) **&#x21C5; 2**
  <br/> You don't really need the memory in the project itself. In can be external to the project, but having an external context and memory vault for any project is sure to be a good idea.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, it can work really well. Noted.
