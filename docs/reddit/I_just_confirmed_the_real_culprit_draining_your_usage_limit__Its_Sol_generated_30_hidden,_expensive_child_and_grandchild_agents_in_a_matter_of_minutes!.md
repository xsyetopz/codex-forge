# I just confirmed the real culprit draining your usage limit: Its Sol generated 30 hidden, expensive child and grandchild agents in a matter of minutes! [Visit](https://www.reddit.com/r/codex/comments/1vv1qoc/i_just_confirmed_the_real_culprit_draining_your/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Stunning-Angle-9239](https://www.reddit.com/user/Stunning-Angle-9239/)

### **Vote:** 5

---

**TLDR:** I found another **culprit** behind my **rapid usage-limit drain**. It is a feature OpenAI introduced in March called **Multi-Agent v2**. This feature allows Codex to create **unlimited child and grandchild agents**, purposely to help complete your task. But it turns out that this child consuming far more expensive tokens than it should.
Over the weekend, I examined the Codex runtime and logs more closely to understand why the usage limit was draining so quickly. My findings point to Multi-Agent v2 as a main culprit.
**You can read** [**here**](https://github.com/openai/codex/commit/79ad7b247bb6805853b00f55d2e992810ce949ea) **and** [**here**](https://github.com/openai/codex/commit/b00c9b2e16ccdbf2c7c8d58a590e0fc2ca97573b)**.**
**WHAT IS THAT?**
**Multi-Agent v2** allows Sol to create child agents that help complete your current task. Sol can **summon** **a child** agent, and that child can also summon its **own child**. This creates a **parent, child, and grandchild** agent system, which turn out to be **very expensive**.
**Why does it consume so much usage?**
From my logs, every child and grandchild agent created by the parent appears to **inherit the parent’s model.** For example, if the parent is using **GPT-5.6 Sol with xhigh**, the **child** agents will also use **GPT-5.6 Sol with xhigh**. In one of my logs, the parent created **more than five child agents**, all using the **expensive** Sol xhigh model, just to find **an article** on the web!
**IS THIS REAL?**
Yes, and I found that this child and grandchild agents also inherit the parent’s entire conversation context too. This is called **fork turns.**
Meaning, if the parent has input of **50 million tokens**, that context will be **passed to each of the child** , causing your usage to **increase very quickly**.
Evidence: [here](https://github.com/openai/codex/pull/12499) and [here](https://github.com/openai/codex/commit/d3603ae5d38ab3addbf995ee8c51a22ceb068872)
**BUT WHY NOW? WHY NOT BACK IN MARCH?**
Because when **SOL** was released publicly on **July 9**, it was programmed to use only **Multi-Agent v2**, including the **fork-turns** feature.
**SO, CAN I TURN IT OFF?**
Yes. **First**, you must explicitly tell **Codex** not to pass the full conversation history to its child or grandchild. In **Codex** (or ChatGPT), go to **Settings** → **Personalization** → **Custom Instructions**, then copy and paste the prompt below:
When you spawn a sub-agent with spawn_agent, always pass an explicit
fork_turns="none" so the sub-agent does not inherit the full parent conversation.This makes the parent model **pass only the task**, **without** including the **full conversation context**.
**Second**, tell Codex to only spawn **as** **few child as possible** and we want those agents to always use **Luna with Low reasoning**, which is very cheap model. In **Codex**, go to **Configuration** and then open **config.toml** from the **top-right** corner. Copy and paste the configuration below:
[agents]
enabled = true
max_concurrent_threads_per_session = 2
default_subagent_model = "gpt-5.6-luna"
default_subagent_reasoning_effort = "low"This limits the **maximum number** of spawned children to **2** and makes **Luna Low** their default model.
Changes this now ! I hope your **Codex usage** will then **return to normal, like its should be**
---

![r/codex - I just confirmed the real culprit draining your usage limit: Its Sol generated 30 hidden, expensive child and grandchild agents in a matter of minutes!](https://preview.redd.it/i-just-confirmed-the-real-culprit-draining-your-usage-limit-v0-gq1crit8mukh1.png?width=640&crop=smart&auto=webp&s=37277ffb5c399be3485a78a7f6aac25c347a3068)
---

![r/codex - I just confirmed the real culprit draining your usage limit: Its Sol generated 30 hidden, expensive child and grandchild agents in a matter of minutes!](https://preview.redd.it/i-just-confirmed-the-real-culprit-draining-your-usage-limit-v0-lhh8n7kamukh1.png?width=640&crop=smart&auto=webp&s=f43a4197aa377446f79862007d1ad8c1ec4a2384)
---

![r/codex - I just confirmed the real culprit draining your usage limit: Its Sol generated 30 hidden, expensive child and grandchild agents in a matter of minutes!](https://preview.redd.it/i-just-confirmed-the-real-culprit-draining-your-usage-limit-v0-nc6rht1bmukh1.png?width=550&format=png&auto=webp&s=eea69c077ecae49d43d7895cef1cf3e986f06aad)
---

![r/codex - I just confirmed the real culprit draining your usage limit: Its Sol generated 30 hidden, expensive child and grandchild agents in a matter of minutes!](https://preview.redd.it/i-just-confirmed-the-real-culprit-draining-your-usage-limit-v0-g7ifym3fmukh1.png?width=640&crop=smart&auto=webp&s=5f026fd20d1f4341800f827838acbf6a7fcdff4c)
---

## Comments 13

- by [unknown](#) **&#x21C5; 7**
  <br/> Instruct codex to always spawn agents using Luna and you won’t drain it

- by [unknown](#) **&#x21C5; 3**
  <br/> Copy and paste the configuration below:

      [agents]enabled = truemax_concurrent_threads_per_session = 2default_subagent_model = "gpt-5.6-luna"default_subagent_reasoning_effort = "low"



      This limits the maximum number of spawned children to 2 and makes Luna Low their default model.

- by [unknown](#) **&#x21C5; 1**
  <br/> As I know Sol and Terra can't spawn Luna subagent. Because they use differrent versions

- by [unknown](#) **&#x21C5; 1**
  <br/> Caveat, it spawns Luna subagents with 1.5 speed boost, draining it even faster, so take care.

- by [unknown](#) **&#x21C5; 1**
  <br/> lol

- by [unknown](#) **&#x21C5; 3**
  <br/> Yeah I noticed this and started using Terra on high or xhigh and getting better results for most coding tasks

- by [unknown](#) **&#x21C5; 3**
  <br/> J’ai des agents uniquement quand je lance codex en ULTRA jamais avec les raisonnements inférieur c’est normal ?

- by [unknown](#) **&#x21C5; 3**
  <br/> Sol found out 2 days ago that any session or agent spawn is default, so same as main agent, and with fork on. The agent making it won't know this fact after creation, and the child won't be able to tell him either.

- by [unknown](#) **&#x21C5; 5**
  <br/> water is wet

- by [unknown](#) **&#x21C5; 2**
  <br/> Einstein is nowhere near Einstein

- by [unknown](#) **&#x21C5; 2**
  <br/> I just realized it but it's too late. drained my entire week in a day again. fak!!!

- by [unknown](#) **&#x21C5; 2**
  <br/> Amazing discovery...

- by [unknown](#) **&#x21C5; 0**
  <br/> Stop trying to save OpenAI; we know they’re throttling usage rates themselves—and doing it to boost profits. Whatever amount of money you’re getting from OpenAI, we’ll pay you that instead—so just f**off out of here, alright?
