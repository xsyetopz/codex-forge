# Sol to Luna, separate sessions or subagents? [Visit](https://www.reddit.com/r/codex/comments/1vupbyh/sol_to_luna_separate_sessions_or_subagents/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [zndr-cs](https://www.reddit.com/user/zndr-cs/)

### **Vote:** 2

---

So what is better/most token efficient? Having Sol write a good prompt and starting a fresh session on Luna to execute, post the result to the Sol session and let it finetune/correct (another send off to Luna)...
Or 1 session, asking Sol to divert the task to Luna subagents?
Or is the end result the same?
---

## Comments 11

- by [unknown](#) **&#x21C5; 2**
  <br/> This is what I've been doing with great results

  - Start a Sol chat specifically telling it to not make changes. Ask it to make an implementation plan and save it in a .md file (without toggling plan mode)
  - Switch to a new Luna chat just telling it to implement the plan in the file, spawning subagents if you think the task is too complex (Luna can spawn other Luna subagents).

What I usually prompt to Luna is something like "Implement </path/to/plan.md> using 1 or more luna medium subagents if necessary".

You could also prompt Sol to execute the plan with Luna subagents in the first chat, but it's gonna be more token heavy because Sol is still the final orchestrator and validator.

- by [unknown](#) **&#x21C5; 3**
  <br/> The most token efficient solution is to chat with Sol on the Chat, ask for a plan, then open a convo with Luna and asking it to implement directly.

- by [unknown](#) **&#x21C5; 4**
  <br/> It's certainly most token eff, but you may lose some important context that may not be contained in the plan.

I think there's no real answer that solves everything, each has it's own pros and cons

- by [unknown](#) **&#x21C5; 2**
  <br/> Oh yeah. It's not the best. But they did just ask for the most efficient. The harsh reality is that, as efficient and cheap as these models may be, you kind of have to use tokens for quality as well, not just volume.

- by [unknown](#) **&#x21C5; 1**
  <br/> Why not plan with sol, then ask to implement with Luna agent, and then recheck with sol?

- by [unknown](#) **&#x21C5; 1**
  <br/> First of all - for any subagent session to make sense you need a proper delegation skill, that ensures that subagent gets enough context. Default subagent delegation prompts made by main session agent results in either serious drift (which can be tackled with proper plan, spec etc) or with subagent spending too much tokens and time on discovering your repo. And tokens matter for your Luna subagent - this is a good worker model, but it is not a very smart model, so if you fill it's context with stuff it does not need it will do it's job slightly worse.

As for choice - I usually go with subagent approach but to make it efficient Sol becomes pure orchestrator - which means it does not review work of other agents, it uses subagents for that as well.

- by [unknown](#) **&#x21C5; 1**
  <br/> Threads

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ve been using Sol to plan and terra to implement seems to work well enough

- by [unknown](#) **&#x21C5; 1**
  <br/> I have been doing some testing yesterday, used a lot of un-ncessary token for that...

Used Sol in the model picker. Ask him for the plan in Plan mode. Ocne it was done, asked to not do the implementation himself but to spam subagent for it, while he review.Well... that didn't go well. Instead of having Sol do the work himself in 10 to 15min usually and use 5 to 10% usage (on PLUS plan) and everything is perfectly implemented... it took about 2h... The result were quite bad AND it took about 10% EXCLUDING the extra 5% i had to use again for SOL to correct everything hat was shit...

Now i change my workflow. I made skills. One is "small change" that is specific for SOL to make it himself, not run 100 test for a change of color and be done with it.One is for making [PLAN.MD](http://PLAN.MD) and then stopOne is to give to LUNA for implementation of PLAN and return with a [RESULT.MD](http://RESULT.MD) explaining what it didOne is for SOL to check [RESULT.MD](http://RESULT.MD) and then return [REVIEW.MD](http://REVIEW.MD)One is to give LUNA to check [REVIEW.MD](http://REVIEW.MD) and implement the fixes.

A bit overkill for small task but works great for feature implementation !
