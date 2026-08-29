# Codex Orchestrator stopping subagents based on arbitrary time limit [Visit](https://www.reddit.com/r/codex/comments/1vzoblg/codex_orchestrator_stopping_subagents_based_on/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Techngro](https://www.reddit.com/user/Techngro/)

### **Vote:** 2

---

I use a loop workflow where Luna Max implements and Sol Xhigh reviews, then back to Luna for remediation, etc. based on a detailed plan prompt. I've been doing this for a couple of weeks now and it seems to be working well, but I was watching the output and just noticed that the orchestrator is stopping the subagents based on an artificial time limit (i.e. not letting the subagent complete the task). Has anyone else experienced this or know why this is happening? It's definitely not something I've included in the prompt.
[](https://preview.redd.it/codex-orchestrator-stopping-subagents-based-on-arbitrary-v0-l8f8e7axqvlh1.png?width=865&format=png&auto=webp&s=73e992ef0ea9e6f4dcdebd58d928aa62e4cb6ced)
---

## Comments 3

- by [unknown](#) **&#x21C5; 4**
  <br/> It's not just with agents. Sol (maybe others too) has brought me tons of trouble after it suddenly started to hallucinate timeouts and other gates on absolutely everything. It broke a ton of business logica by inventing these mechanisms without actually gathering the context for it. This is a huge problem on top of the over engineering. I now have to add this to every prompt to not Invent hallucinated timeouts, limits, or other gates that prevent the application from functioning.

- by [unknown](#) **&#x21C5; 3**
  <br/> It did that for me too when using Claude CLI or Ox Alpha as part of agent orchestration. Just tell it to let it go until completion even if it takes long. Emphasise it.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah, I stopped the task and created a new prompt with explicit instructions to just let the subagents finish naturally.

Sometimes these agents are too smart (or dumb, considering how you look at it) for their own good.
