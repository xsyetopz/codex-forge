# Why we don’t have automatic reasoning level with Codex? [Visit](https://www.reddit.com/r/codex/comments/1vv6nx3/why_we_dont_have_automatic_reasoning_level_with/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [AweVR](https://www.reddit.com/user/AweVR/)

### **Vote:** 3

---

It’s something I don’t understand. I’m doing it semi-manually and with skills.
I asked Codex to create Skill for example to define 5 subagent roles. For complex tasks it throws them in SOL xhigh. For self-checking executions it uses Luna high. Etc...
At the same time I have another skill that analyzes the intellectual load of the main agent. When it is going to perform something very repetitive that will last many hours and he cannot use a subagent (because there is no system for the subagents to notify the main agent after 6 hours for example) then the main agent stops and expressly asks me to reduce or expand the model according to what he needs. If it feels that it cannot handle a task it asks me for more intelligence. If it feels that the task is self-verifiable or very easy to perform it asks me to go to Luna.
What I don’t understand is why Codex doesn’t already have this system integrated if ChatGPT web is supposed to have an AUTO mode.
I’ve seen people doing complete projects without changing the level of SOL even once. It’s like having a scientist thinking 10 minutes on a blackboard about a mathematical formula and then having him think 10 minutes about whether he should take a new chalk or not, another 10 thinking about the color, another 10 thinking about where they could be... it’s just that it doesn’t make sense directly. Or I don’t know if the xhigh thing is just a “maximum” and the model really decides how much to think about and then it would be even easier, since it’s just knowing what job the senior does and when to pass the job to the junior (Luna)
---

## Comments 11

- by [unknown](#) **&#x21C5; 2**
  <br/> Some people prefer a bit more control and people have different usage available. Also making a model guess what reasoning would be appropriate adds more overhead for the model. In every task, it’s not just thinking about solving the problem given, but also what reasoning level is most appropriate and how ‘complicated’ an issue is. Also what makes a task complicated?

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s possible. It just takes telemetry and infrastructure, which most people using stock Codex probably don’t have.

You also wouldn’t define fixed rules like “if X is complicated, use model Y.” You’d auto-route based on what actually works. Replay a bunch of prior runs, compare models and reasoning levels across different task types, and use that data to decide what gets routed where.

- by [unknown](#) **&#x21C5; 6**
  <br/> Any change in reasoning lvl kills cache hit. cache hit is 90% off. So usually better to keep the reasoning lvl and save some money.

- by [unknown](#) **&#x21C5; 1**
  <br/> As I read from OpenAI when you change level it doesn’t touch cache. Only when you change model. So my skill first calculate how much time/tokens requiere the task. If it is something of 1 minute then I still use SOL, but if it have to spend hours on this task then it recommends me to change to Luna Max.

Usually I was burning 10% in 2 hours. Now I can work for 10 hours and only burn 2% With the same effectiveness.

- by [unknown](#) **&#x21C5; 3**
  <br/> [https://developers.openai.com/cookbook/examples/prompt_caching_201](https://developers.openai.com/cookbook/examples/prompt_caching_201)

This says that changing reasoning efforts might mess with caching. So yes, it's true.

- by [unknown](#) **&#x21C5; 1**
  <br/> I am not pretending to be certain about this but this is where i got it from. so take it with a grain of salt: [https://www.reddit.com/r/codex/comments/1vribxz/didnt_realize_just_changing_reasoning_effort/](https://www.reddit.com/r/codex/comments/1vribxz/didnt_realize_just_changing_reasoning_effort/)

- by [unknown](#) **&#x21C5; 2**
  <br/> It affects caching in claude when i change effort levels, so probably the same here as well

- by [unknown](#) **&#x21C5; 2**
  <br/> if you don't know... everytime you change your reasoning with codex in a task, it kills your usage, has to re-read all the context

- by [unknown](#) **&#x21C5; 1**
  <br/> I have codex kick off a lot of extremely long running tasks and then analyze the results. You CAN tell it to use the scheduled tasks tools to kick off an agent at the expected completion time and then reattach to this same chat. This has saved me literally hundred of millions of (mostly cached) tokens that would have been spent polling. It lets me use high capacity models for the top top level chat.

- by [unknown](#) **&#x21C5; 1**
  <br/> Are they not banging your hard enough?
