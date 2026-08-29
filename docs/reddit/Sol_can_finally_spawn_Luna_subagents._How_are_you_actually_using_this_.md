# Sol can finally spawn Luna subagents. How are you actually using this? [Visit](https://www.reddit.com/r/codex/comments/1vp0rig/sol_can_finally_spawn_luna_subagents_how_are_you/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [alexmuc92](https://www.reddit.com/user/alexmuc92/)

### **Vote:** 68

---

Now that Sol can finally spawn Luna subagents in the Codex app, I’m curious how people are actually using this in practice.
I know this has been working in the CLI for a while, but now it made it into the Mac app, so I am trying to figure out how to set this up correctly.
One of the main reasons I’m interested is token usage. Sol is great, but using it for every little task feels like a waste when Luna could probably handle a lot of the smaller work. Especially right now as the token resets are happening less frequently and my weekly usage is getting used faster week after week..
Do you tell Sol to delegate as much as possible to Luna? Let it decide on its own? Have you added anything to your custom instructions or AGENTS.md to make it use Luna more often?
Would love to see the actual instructions people are using, especially if you’ve found a setup that noticeably cuts down Sol usage.
**EDIT for clarification since there seems to be some confusion:**
Sol/Terra use Multi-Agent V2, while Luna is still V1. Previously, V2 parents couldn’t spawn V1 models directly, so Sol → Luna would fail with Unknown model gpt-5.6-luna.
That’s why people built custom-agent workarounds.PR #36892 changed this by allowing V2 agents to spawn V1 models like Luna as **leaf workers**. Luna stays V1, but Sol can now delegate tasks to it directly.
This has worked in the standalone CLI since **0.147.0**, but the Mac app was behind. With the latest Mac app update, Sol → Luna now works there too
---

## Comments 37

- by [unknown](#) **&#x21C5; 15**
  <br/> I’ve made a benchmark with Sol for this where Sol performed varied tasks against Sol orchestrating to Luna.

It’s not much difference, sometimes Luna delegated tasks even got higher.

The orchestration and post task checks eat up the savings.

- by [unknown](#) **&#x21C5; 1**
  <br/> Wow really need to start using Luna more, I feel like terra myself is terrible. I could be wrong and using it wrong as I’m not as experienced as some of you. Everytime I used terra I end up changing back to sol

- by [unknown](#) **&#x21C5; 1**
  <br/> What effort level do you use with terra?

- by [unknown](#) **&#x21C5; 1**
  <br/> Mainly on max but just not doing it for me even on very specific prompts feels like a lot of roundabout and slow

- by [unknown](#) **&#x21C5; 1**
  <br/> Terra Max is honestly useless. If using terra, only ever really use ultra. Sol high outscores Terra Max whilst costing about 10% less, using ~37% the amount of tokens, ~40% the amount of agent steps.

- by [unknown](#) **&#x21C5; 1**
  <br/> Can you share this benchmark please? Artificialanalysis benchmark says Terra Max and Sol high score the same while Terra Max is 2.5x cheaper on the same task.

- by [unknown](#) **&#x21C5; 2**
  <br/> DeepSWE. Are my findings correct or was I tripping

- by [unknown](#) **&#x21C5; 1**
  <br/> Yep, found it and it looks like you’re right.

- by [unknown](#) **&#x21C5; 1**
  <br/> NM, found it!

- by [unknown](#) **&#x21C5; 19**
  <br/> [agents]# Enable multi-agent capabilitiesenabled = true

# All spawned subagents default to a lighter, faster model unless overriddendefault_subagent_model = "gpt-5.6-luna"default_subagent_reasoning_effort = "high"max_concurrent_threads_per_session = 6

- by [unknown](#) **&#x21C5; 1**
  <br/> Why 6 ? :)

- by [unknown](#) **&#x21C5; 7**
  <br/> Because I copied it from the official documentation.

- by [unknown](#) **&#x21C5; 5**
  <br/> Go ChatGPT Web High/Extra High (to save usage)Ask it to explain you in what situations it’s worth it spawning sub agents, particularily with a Parent/Luna logicExplain your usage (coding, automation or whatever business you got going, helping you for your job… whatever), your workflows, tasks….Mention to take in count token usage mainly, but also time (you don’t want a 20mins task to take 4h I think ? Anyways, tweak what i say based on your priorities)And just go back and forth with it it’ll help you, then you can feed it your Agent.md and ask it to modify it based on what you determined was the best while chattingI’m not a very technical user at all, but everything it told me seemed to make sense and it seems to work fine for me

- by [unknown](#) **&#x21C5; 3**
  <br/> I don't think there's a good answer, and it really depends on each case and the reasoning level, as well.

I'm currently using chatGPT to brainstorm approaches, review what others are doing, and test various implementations. The right sketch we've landed on is reserving Sol for high ambiguity planning and such, and using Luna for well defined implementation. The key is that instead of optimizing for task, optimize for cognitive difficulty.

- by [unknown](#) **&#x21C5; 2**
  <br/> Through a workaround or officially?

- by [unknown](#) **&#x21C5; -2**
  <br/> What’s the benefit of a workaround instead of using the official way?

- by [unknown](#) **&#x21C5; 2**
  <br/> I’m asking do you mean you can do it through the workaround or does it officially support luna agents now?

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes, officially now. No workaround needed.

The issue was that Sol uses Multi-Agent V2 while Luna is V1, so Sol couldn’t spawn Luna directly before.

It was fixed in the CLI with v147, and with the latest Mac app update it works now too. So Sol can now officially spawn Luna directly instead of silently falling back to Terra or requiring custom-agent workarounds.

- by [unknown](#) **&#x21C5; 1**
  <br/> I don't have Luna available naturally yet. I've been using a skill to gett around it.

- by [unknown](#) **&#x21C5; 0**
  <br/> Well, it lies that it's Luna, it's actually Terra agents haha... Maybe it was fixed?

- by [unknown](#) **&#x21C5; 1**
  <br/> lol it is already fixed, you can just ask codex what model available through spawn_agent tool. previously only terra and sol is exposed through this.

- by [unknown](#) **&#x21C5; 2**
  <br/> yea i have adopted this new changes i have been waiting for so long. previously my workaround is using the create_thread instead of the spawn_agent bcs it is not supported. so right now, i have remove my old workflow and running this new one smoothly and created all three researcher, qa, and writer role using luna xhigh fast. everything is pretty amazing right now

- by [unknown](#) **&#x21C5; 2**
  <br/> Is there anything to set up to get this to work now or can you just tell sol to spawn luna subagents and it will work?

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes, it just works now.

- by [unknown](#) **&#x21C5; 3**
  <br/> Luna sucks. Tried to get luna to implement plans from sol, had to do 4 rounds of correction after review by sol.

Everything take twice as long and end up costing the same.

- by [unknown](#) **&#x21C5; 1**
  <br/> I dont remember what model i used but i remember asking to spawn Luna Extra High for some tasks and it put Sol High subagents in lol

- by [unknown](#) **&#x21C5; 1**
  <br/> As much as I am have sol manage my Luna agents, still feels like I am burning through tokens a lot quicker, I wonder if minimizing agent spin off would help, I think I saw like 50 with 25 working :)

- by [unknown](#) **&#x21C5; 1**
  <br/> Can it really now? On Claude code using ultra mode it spawns haiku and whatever it thinks it’s suitable by itself. Can sol actually do that now I just use entirely Sol very high atm does it do automatically in ultra or does it need to be specified in prompt to use Luna agents. Ultra code for me kills my 20x too much so I been breaking down tasks and doing In high/very high. How would you recommend to do this?

- by [unknown](#) **&#x21C5; 2**
  <br/> ultra spawns as many agents as possible basically and is not proven to be worth it

just say you want xyz done with subagents on abc model(s)

- by [unknown](#) **&#x21C5; 1**
  <br/> I have been using sol high to create a plan and then making a new Luna xhigh chat. Then telling sol to act as a guide and delegate implementation to Luna by giving it the chat name. It checks Luna work and seems to use far less tokens. From there I test the output and tweak things with just Luna xhigh or sol medium if there are issues depending on the type of bug.

Not sure if this is the best method but it has worked better than I thought it would. You just have to watch sol as it might start bullying luna.

- by [unknown](#) **&#x21C5; 1**
  <br/> literally just tell sol to use a luna xhigh subagent with isolated context

- by [unknown](#) **&#x21C5; 1**
  <br/> The original fix was to start the session with a prompt in Luna, then switch to Sol,  then you were able to run Luna agents without any problems.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is a good deal for the price but too slow, DeepSeek V4 Flash subagents via an opencode go sub work mostly the same but at least x2 faster. I use this for basically everything. Custom harness: [https://github.com/S1gil0/lookingglass](https://github.com/S1gil0/lookingglass)

- by [unknown](#) **&#x21C5; 1**
  <br/> I tried sol plans and orchestrates on caveman and ponytail skill and Luna as coder and it seems to eat same or more tokens. I think skill may be needed to not verify full work of Luna but just bits and has to prepare those bits and questions or make it indexed and searchable . It ate tokens like crazy but I don't know how hard task was. And probably if you have auto review it has another model checking one that works to approve review actions spawns a lot but hard to say if it uses a lot of usage

- by [unknown](#) **&#x21C5; 1**
  <br/> It would be interesting if sol 5.6 can orchestrate and use deepseek v4 flash / pro for execution as an alternative to gpt 5.6 luna

- by [unknown](#) **&#x21C5; 1**
  <br/> Type this next time you are trying to implement something:

"You are Sol, senior engineer and orchestrator, you do not code, you plan, review and verify. Use Luna subagents as your executor and coder. Implement the plan: "

You can improve on this prompt, but this will give you an idea of how the flow can work

- by [unknown](#) **&#x21C5; -1**
  <br/> Das kann er doch schon die ganze Zeit? Habe das schon wochenlang so gemacht. Hab ihn halt gefragt ob. SoL nutzt bei mir Luna und spark
