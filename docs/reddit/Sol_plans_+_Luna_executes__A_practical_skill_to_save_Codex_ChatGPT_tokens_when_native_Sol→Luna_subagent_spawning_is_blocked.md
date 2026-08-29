# Sol plans + Luna executes: A practical skill to save Codex/ChatGPT tokens when native Sol→Luna subagent spawning is blocked [Visit](https://www.reddit.com/r/codex/comments/1vezss6/sol_plans_luna_executes_a_practical_skill_to_save/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Fun_Nebula_9682](https://www.reddit.com/user/Fun_Nebula_9682/)

### **Vote:** 9

---
There’s a useful pattern a lot of people want with GPT-5.6 in Codex:

- **Sol** does the planning, decomposition, decision-making, and final review/acceptance
- **Luna Max** does the actual implementation, searches, edits, and testing
This is attractive because Luna is significantly cheaper on tokens/usage than Sol, especially on longer coding sessions. problem is that you currently **cannot** achieve this cleanly through Codex config or native spawn_agent.
Why native spawning failsSol and Luna are currently on different Multi-Agent protocol versions inside Codex:
- Sol → multi-agent **v2** (task-tree oriented: paths like /root/fix_login/review, fork_turns, send_message, followup_task, list_agents…)
- Luna → multi-agent **v1** (Agent-ID oriented: random IDs + send_input / wait_agent / resume_agent / close_agent)
When a v2 parent (Sol) tries to spawn sub-agents, Codex filters the candidate list and only allows models that are also marked as v2. Luna is filtered out.
Relevant references from the Codex source:
- Sol marked v2 and Luna marked v1 in models.json
- The filter logic lives in the multi-agent handler
Config alone cannot bridge this gap right now.
The skill I builtI made a skill that works around the limitation by treating Sol as the **commander + reviewer** and launching a **separate Luna Max Codex CLI session** as the implementation worker.
Repo:[https://github.com/majiayu000/spellbook/tree/main/skills/sol-luna-router](https://github.com/majiayu000/spellbook/tree/main/skills/sol-luna-router)
**High-level flow the skill enforces:**
- Sol stays in the current thread and is not allowed to edit product files itself.
- Sol writes a tightly scoped task packet (objective, allowed files, constraints, done-when conditions, verification commands).
- A bundled Python runner starts (or resumes) a dedicated gpt-5.6-luna session with model_reasoning_effort="max" and the correct sandbox.
- Sol inspects the actual diff, re-runs the project’s own verification/tests, and either accepts or sends a precise correction back to the same Luna thread.
- After three failed correction cycles on the same root cause, Sol is forced to reassess instead of looping.
The runner disables native multi-agent tools on the Luna side and returns structured JSON (thread id, final response, usage, repo metadata) so Sol can reliably continue the loop.
Usage
- Install the skill into your Codex environment (or copy the folder).
- Tell Codex something like: “Use the sol-luna-router skill to implement X. Sol handles planning and acceptance; Luna Max does the implementation.”
- Sol will take over the routing and verification.
This is intentionally stricter than free-form agent spawning: explicit file ownership, one write-capable worker at a time (or isolated worktrees), mandatory verification from the Sol session, and no silent permission escalation.
Notes / limitations- This is a practical workaround, not a permanent architecture fix. If OpenAI later unifies the multi-agent versions or relaxes the filter, native spawning becomes preferable.
- Still consumes tokens on the Luna side (and the runner itself), so it is not “unlimited” — just much more efficient than keeping everything on Sol.
- Works best when you can give clean, bounded task packets.
If you’re hitting the same Sol→Luna spawn wall, this might save you some quota. Feedback and improvements welcome.

---

## Comments 15

- by [unknown](#) **&#x21C5; 4**
  <br/> Is there really a wall? I have set up custom subagents with model model = "gpt-5.6-luna", and when I ask sol to spawn a subagent with the name of the custom agent, it gets spawned as luna.

- by [unknown](#) **&#x21C5; 1**
  <br/> you are right. I tried and your way is more easy and useful.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yea if you prompt it specifically it will work. The apis are different.

If you use the native orchestration  it defaults to v2 blocking luna unless prompted specifically for how to use that model usage

- by [unknown](#) **&#x21C5; 1**
  <br/> This didn't work for me. It saw the custom subagent but turns out it was spawning as 5.6 Sol xhigh fast mode, ouch!

- by [unknown](#) **&#x21C5; 1**
  <br/> Are you sure that it is Luna subagent and not a sol agent named Luna?  Maybe something changed, but about two weeks ago, when I was testing subagents, this was the problem I had, all my "luna" subagents were sol subagents named luna.

- by [unknown](#) **&#x21C5; 1**
  <br/> Pretty sure, I checked the footer when I switched agent or something.

- by [unknown](#) **&#x21C5; 2**
  <br/> This should be native on major CLI's to mix models and providers.

I'm using a custom CLI:/agent on/off/model/reasoning/agentmodel/agentreasoning

[https://github.com/S1gil0/lookingglass](https://github.com/S1gil0/lookingglass)

- by [unknown](#) **&#x21C5; 1**
  <br/> I use Terra xhigh to plan for Luna high when developing a mobile game, and the tokens usage is so low while maintaining huge and accurate results

- by [unknown](#) **&#x21C5; 2**
  <br/> good choice. But I almost not use terra. I will have a try later

- by [unknown](#) **&#x21C5; 1**
  <br/> dont know. i did sol high planner reviewer + luna max implementation and it works like shit for godot development. constantly falling into eternal loops of tests and attempts to fit the code to actually satisfy those tests. any prompts or rules in [agents.md](http://agents.md) cant prevent this degradation after several compacts. its useless. claude works just fine on the same project and roughly same structure of fable high as planner/reviewer + opus/sonnet subagents as actual workers. same prompts, same rules but codex just eating tokens without any good results. it was good initially but later they change something and now its broken.

- by [unknown](#) **&#x21C5; 2**
  <br/> i'm having the same problems. the codex usage is really good right now, but its a net negative bc i have to have opus fix all of codexes slop. opus just seems to immediately understand godot. im using godot mcp and awesome-game-dev managed skills

- by [unknown](#) **&#x21C5; 1**
  <br/> I see this every single morning just different flavour. I feel like its just bots spaming sol and luna where this is common knowledge by now

- by [unknown](#) **&#x21C5; 1**
  <br/> if there is a way to save token. Why dont we use this method.

- by [unknown](#) **&#x21C5; 2**
  <br/> How did you measure what you saved? Did you try different ways? Whay was the difference in execution time and quality?

Just asking because there is way too much bro science going on on these threads.

Curious how any downvotes I will get this time for forcing a conversation with knowledge and proof...

- by [unknown](#) **&#x21C5; 1**
  <br/> Workaround until they fix it. Start a chat with Luna (any reasoning level) and say, "Hi!". This forces it to V1 subagent api. Then switch to your model of choice (Sol xhigh/high/medium, Terra xhigh, etc), and give it your prompt and subagent rules. It can spawn Luna max or xhigh with `service_tier: priority` (fast mode) even.
