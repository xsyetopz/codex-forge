# Delegating tasks from Sol to Luna subagents is crazy [Visit](https://www.reddit.com/r/codex/comments/1veqtnq/delegating_tasks_from_sol_to_luna_subagents_is/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Erik-Pt](https://www.reddit.com/user/Erik-Pt/)

### **Vote:** 123

---

Recently, I tried working with Codex sub through CC harness (through CLI Proxy API), which  highly improved FE design output for me. However that setup quickly became token-hungry: using Terra high, I quickly started spending 7-8% of weekly quota just in one turn. With Codex, it was around 4-5% per turn.
After Luna pricing dropped, I decided it made sense to try implementing Luna subagents. Yes, I know that isn't very efficient due to v2 subagent limitation, but still I am astonished by result.
I gave Sol xhigh a task of implementing an FE project (account dashboard) from scratch, the only thing that was present - Next.js bootstrap and AGENTS.md. It has already been rolling for 2 hrs and 5 mins. It spent just 9% of weekly limit - a bit more than what was happening with relatively simple tasks earlier on.
I can highly recommend implementing (or at least testing) such setup, where Sol orchestrates stuff and Luna works on codebase research/implementation
---

## Comments 53

- by [unknown](#) **&#x21C5; 109**
  <br/> Tomorrow is my turn to post

- by [unknown](#) **&#x21C5; 28**
  <br/> You would think OpenAI would’ve already figured this out and I’ve made this a standard with these agents

- by [unknown](#) **&#x21C5; 10**
  <br/> Sol uses sub-agents a lot if asked right, even below Ultra. It can even spawn new tracked chat sessions that you can follow and communicate directly with them by messages as steering.

What exactly are you missing?

- by [unknown](#) **&#x21C5; 2**
  <br/> Can you see main agent communication with subagent in these chats?

- by [unknown](#) **&#x21C5; 4**
  <br/> Yes. It you instruct them this way that I mean, it's literal new chat session for the sub-agents, and both of them send normal steering messages inside the chat to each other. So you can read everything.

Assign them stable ids or real names (or let the orchestrator do it themselves) and let them prefix each message with that.

- by [unknown](#) **&#x21C5; 2**
  <br/> They’re separate chats / sessions / tasks, so they show up in your task list same as the main one, and yes you can see their chats.

- by [unknown](#) **&#x21C5; 0**
  <br/> It’s great, and you’re right, but I don’t want to have to ask it right. I want it to know already. Maybe I don’t know, what I don’t know. I need the agent fill that part in.

- by [unknown](#) **&#x21C5; 5**
  <br/> Then put it into your global instructions (AGENTS.md in global codex folder) or add it as a skill the model can call where the description explains when it should invoke it, and the skill itself is an instruction how to use sub-agents.

The tooling is there. You don't have to ask it right every time. Just set up once. You just have to understand how to setup up your agent environment.

- by [unknown](#) **&#x21C5; 2**
  <br/> >you just have to understand how to set up your subagent environment

Right.  By going “hey Codex, all these guys on Reddit are talking about using Sol with subagents to improve token efficiency.  Do some research on what people are using and what works best, then set up my machine that that that’s how we operate here!”

- by [unknown](#) **&#x21C5; 1**
  <br/> lol actually just copied and pasted that to Codex, will see what it does

- by [unknown](#) **&#x21C5; 2**
  <br/> > I’ll research the current Codex community patterns—especially Reddit, GitHub issues/discussions, and OpenAI guidance—then turn the useful parts into a practical machine-wide coordinator/subagent policy. I’m using the Codex documentation skill for current product facts and the Windows-management skill because this changes your machine-wide operating setup.

> Your current setup already has the right skeleton—coordinator-only primaries, narrow worker profiles, and lower-cost workers—but it doesn’t yet express a consistent “Sol plans/reviews, Terra executes routine slices” routing policy. I’m separating official capabilities from community folklore before changing defaults.

> The useful consensus is narrower than “spawn lots of Sol agents.” The efficient pattern is Sol Medium as the main coordinator, Sol High only for genuinely difficult planning/review, Terra Medium/Low for bounded workers, no Ultra, minimal inherited context, no nested fan-out, batched tool calls, and no repeated model-mediated polling. I’m applying that policy now; I’m deliberately not copying Reddit’s obsolete multi_agent_v2 setting because the current Codex manual uses the stable [agents] configuration instead.

“These guys were talking about Luna a lot, and the need to override to force Luna to V2 agents.  Make sure you consider that path too…”

> Good catch. Luna is the community’s preferred cheapest worker for highly mechanical slices, but the V2 routing bug matters: some Codex App builds ignore custom-agent model pins and silently inherit Sol. I’m checking the exact workaround against both your installed tool schema and the current Codex behavior before deciding whether Luna should be the default or a narrowly forced profile.

> I found an important version mismatch before proceeding: your installed Codex CLI is 0.144.4, while today’s manual documents the newer [agents] defaults schema. That new block is invalid on your installed build, so I’m removing it immediately and using only settings this build actually accepts. This is exactly why I’m not blindly applying the Luna catalog hack yet.

> Your installed catalog confirms the Reddit diagnosis exactly: Sol and Terra are V2; Luna is V1, and this session’s V2 spawn schema therefore exposes only Sol and Terra. I’m taking the reversible route people report working: preserve the complete catalog, change only Luna’s runtime marker to V2, point Codex at that private catalog, and pin only clear/repeatable workers to Luna while keeping Terra for exploratory/UI work and Sol High for deep review.

> The backup succeeded, but the catalog write hit Windows PowerShell 5.1’s older encoding enum before creating the override file. Nothing active was changed. I’m rerunning just the catalog generation with an explicit BOM-free UTF-8 encoder, then I’ll validate the actual model routing.

> The private catalog now resolves Sol, Terra, and Luna as V2, and the whole Codex configuration parses successfully. I’m doing one minimal read-only spawn probe next; the important check is not merely that a child starts, but that its recorded model is actually Luna rather than silently inherited Sol.

> The routing probe didn’t reach a model or spawn anything; Windows blocked the fresh CLI from opening Codex’s state database inside the restricted shell. I’m rerunning that one read-only probe with access to Codex’s own state directory—no repository or machine configuration mutation beyond normal ephemeral session bookkeeping.

> The live probe worked: a fresh V2 child recorded gpt-5.6-luna / high, and another coordinator’s newly spawned worker independently picked up Luna High while explorer remained Terra Low. One subtlety surfaced: this installed build reliably honors overrides on the built-in roles, but does not reliably bind arbitrary new role names, so I’m removing the unused custom scout/reviewer aliases and keeping the routing on the supported built-ins.

- by [unknown](#) **&#x21C5; 3**
  <br/> Configured machine-wide Sol orchestration with Luna workers.

- Primary: Sol Medium; Plan mode: High.- Routine implementation/default/GameChanger workers: Luna High.- Read-only exploration: Terra Low.- Browser/computer workers: Terra Medium.- Data analysis: Terra High.- Ultra remains forbidden.- Earlier compaction at 160k tokens and 12k per-tool output storage.- Default `fork_turns="none"`, no nested fan-out, no redundant review cycles, batched tool calls, and no repeated status polling.

Your Codex catalog had the exact community-reported incompatibility: Sol/Terra were V2 while Luna was V1. I created a complete private catalog changing only Luna to V2 and configured Codex to use it. A live probe confirmed a newly spawned child actually ran as `gpt-5.6-luna / high`, not inherited Sol.

The original configuration is backed up at [sol-luna-routing-20260803-222432](<C:\Users\Experimental01\.codex\backups\sol-luna-routing-20260803-222432>). The override is [models-luna-v2.json](C:\Users\Experimental01\.codex\models-luna-v2.json), and the operating rules are in [AGENTS.md](C:\Users\Experimental01\.codex\AGENTS.md).

This matches the strongest practical pattern I found: Sol coordinates and handles difficult synthesis; Luna handles clear implementation; Terra handles exploratory or tool-heavy work. Official guidance confirms that subagents help preserve main-thread context but inherently consume more tokens, while community reports consistently warn against Ultra, full-history forks, nested agents, and polling loops. [Official Codex subagent guidance]([https://learn.chatgpt.com/docs/agent-configuration/subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)), [Reddit model-routing discussion]([https://www.reddit.com/r/codex/comments/1utk1x1/how_to_use_gpt56_lineup_token_efficiently/](https://www.reddit.com/r/codex/comments/1utk1x1/how_to_use_gpt56_lineup_token_efficiently/)), [Luna V2 workaround discussion]([https://www.reddit.com/r/codex/comments/1v26ebx/56sol_unable_to_spawn_56luna_subagents/](https://www.reddit.com/r/codex/comments/1v26ebx/56sol_unable_to_spawn_56luna_subagents/)), [batching measurements]([https://www.reddit.com/r/codex/comments/1v4vcnr/possible_gpt56_sol_usage_workaround_explicit_tool/](https://www.reddit.com/r/codex/comments/1v4vcnr/possible_gpt56_sol_usage_workaround_explicit_tool/)), [Codex V2 routing issue]([https://github.com/openai/codex/issues/34700](https://github.com/openai/codex/issues/34700)).

The private catalog workaround is reversible and should be removed once OpenAI’s stock catalog exposes Luna to V2. Existing long-lived parent sessions may need the next normal Codex restart to refresh their displayed model choices, but fresh worker sessions are already routing to Luna correctly.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thank you

- by [unknown](#) **&#x21C5; 4**
  <br/> Claude do that by itself using Haiku for small task all the time.

Codex is very behind in a lot of places

- by [unknown](#) **&#x21C5; 13**
  <br/> Haiku is complete dogshit compared to Luna.

- by [unknown](#) **&#x21C5; 4**
  <br/> But for really simple tasks, its probably fine

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, I know that, but it works well to summarise part of the search.

However, Claude could do that months ago without any of your input when you were using models such as Sonnet 4.5, and here we are with GPT‑5.6 and it’s still not streamlined in any way...

OpenAI is working on great models, but they need to improve their harness because it is thoroughly behind in many ways. (I’m 99.99% sure it’s not linked to the model itself, but rather to the Claude Code vs Codex design.)

- by [unknown](#) **&#x21C5; 8**
  <br/> You can force them into v2 agents.

- by [unknown](#) **&#x21C5; 4**
  <br/> how come?

- by [unknown](#) **&#x21C5; 5**
  <br/> I can confirm it’s possible. There is a workaround. You need to patch models catalog and change multi_agent_version from V1 to V2 for Luna model. ChatGPT can give you exact steps, just ask for it. There are also open issues in Codex GitHub repo that explains the workaround. I tried it today and it works fine in both CLI and macOS desktop app.

- by [unknown](#) **&#x21C5; 1**
  <br/> fake

- by [unknown](#) **&#x21C5; 1**
  <br/> What’s fake about it?

- by [unknown](#) **&#x21C5; 5**
  <br/> Our of curiosity, what's your method of using both models in combination?

Using `Sol` with `/goal` and then have custom `AGENTS.md` say to spawn `Luna` subagents?

The classic `/plan` with `Sol` and then changing models after the plan is done?

Maybe making `Sol` write a handover `.md` file for `Luna` to pick up with a `/goal`?

Or something more complex?

- by [unknown](#) **&#x21C5; 6**
  <br/> I'm not sure you'll like my answer. I'm using T3 Code in Plan mode, then ask it to start the implementation according to the written plan. It then manages subagents on the fly (with CC harness)

- by [unknown](#) **&#x21C5; 2**
  <br/> How? I'm also using t3code..

- by [unknown](#) **&#x21C5; 5**
  <br/> The mechanical difference is what comes back. A subagent runs in its own window and only its summary lands in the parent, so the parent never carries all the files it read. A separate Luna thread you hand a prompt to pays the same context rebuild and the parent learns nothing from it.

That's also why people in here say it doesn't actually save tokens. If the subagent writes code, the parent can't see what it really did, so it re-reads everything to fix bugs and you pay twice. Research and review only, parent does every edit.

Cheap way to check on your own setup: take a task you already finished, run it both ways, and compare the parent session's token count at the end instead of the total.

- by [unknown](#) **&#x21C5; 1**
  <br/> +1 I use protocols that force exploration and visitation by agents configured in the code, while the main agent orchestrates and modifies the code.

- by [unknown](#) **&#x21C5; 1**
  <br/> This is exactly what Codex told me last week when I was about to implement this.

I held back until I understand better what use case goes where

- by [unknown](#) **&#x21C5; 3**
  <br/> Is there a mechanical difference between Sol as the orchestrator using Luna sub agents versus Sol as the orchestrator passing a prompt over to a Luna thread? Is there saved context or a more precise handover? I’m using the later and it works fine, but I’m burning through tokens.

- by [unknown](#) **&#x21C5; 0**
  <br/> There is actually an api difference in calling luna vs calling terra and sol apparently. My orchestration project actually had to add a bridge for it so we can use terra and luna consistently for their own use cases

- by [unknown](#) **&#x21C5; 6**
  <br/> Sol still needs to read/understand/and correct/send more agents to correct all of the fucking garbage that the luna agents end up creating... it does NOT save tokens.

Scam Altman is selling snakeoil ... AGAIN

- by [unknown](#) **&#x21C5; 5**
  <br/> I agree output with luna max is not as good as it would've been with Sol high. However Sol was acting as a relatively good Tech Lead for me in directing subagents. It's indeed slower, but the fact that I'm spending, I don't know, 10x less tokens now(?) makes this a much better solution for me personally

- by [unknown](#) **&#x21C5; 5**
  <br/> I think you are spending 10x more tokens, they just cost you 25x less :) it’s definitely slower, but cheaper.

- by [unknown](#) **&#x21C5; 3**
  <br/> I did some testing on a single, medium-size task, and the savings look like this:

- Sol Ultra: 45 minutes, 30% weekly usage- Sol High: 75 minutes, 15% weekly usage- Sol High + Luna Max subagents: 240 minutes, 4% weekly usage- Sol Hight + Terra XHigh: 120 minutes, 6% weekly usage

This is not representative, as it was just a single task, specific to my personal workflow. However, it should give some idea about the usage difference. All agents finished the task successfully, with a minimum (expected) guidance from me.

I was testing on a Pro 5x subscription.

- by [unknown](#) **&#x21C5; 1**
  <br/> yeah, fair point :)

- by [unknown](#) **&#x21C5; 2**
  <br/> Gotta be honest too - I’ve tried this on one semi-complex task and it still hasn’t got it right. Sol is doing well defining the problem and instructing Luna Max, but I’m on iteration five so far and it still needs to get it working properly. I’m about to hand it off to Claude to finish up.

- by [unknown](#) **&#x21C5; 2**
  <br/> I suggest you define some escalation process. So you benefits from cheap Luna when it works and when it fails a couple of times it would escalate to something more capable. Waiting 5 iterations to escalate is a waste of tokens IMHO

- by [unknown](#) **&#x21C5; 1**
  <br/> sol high with luna xhigh and sol only reading diffs and following a detailed plan (that sol xhigh wrote up and then adversarially reviewed against itself in new context) can get you a long way. you can use lower models for orchestrating and planning if the tasks are smaller or simpler

- by [unknown](#) **&#x21C5; 3**
  <br/> Sol is a piece of shit. It only works well if you treat it like shit.

Ultra is even worse. Their sub agents run around making a mess and burning a billion tokens to just hit a wall because they got in each others way and for some reason some multiple sub agents have write authority. Insane. You basically have to grab each sub agent and give them specific jobs. On the plus side after you do that it still works like shit.

- by [unknown](#) **&#x21C5; 1**
  <br/> i dunno i got a lot of mistakes in my code and had to fix patterns.

- by [unknown](#) **&#x21C5; 1**
  <br/> regarding the v2 limitation for luna model, i tried this [workaround](https://www.reddit.com/r/codex/comments/1vesxh4/comment/p1kf3p3/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)

- by [unknown](#) **&#x21C5; 1**
  <br/> I did similar with Sol Med delegating to Luna Xhigh and/or Terra high.  Had detailed parameters for parent and sub agents.  Absolute disaster.  After 10 min of seemingly going well, I let it do its thing on a relatively long but structured task.

Well, 2 hrs later and it literally didn’t make a single file edit.. using ~60% of my weekly usage.

Upon heavy interrogation, Sol apologized for not intervening sooner and said sub agents weren’t appropriate for the task (reversing its previous stance).  Too complicated it said.

- by [unknown](#) **&#x21C5; 1**
  <br/> Been running sol ultra with luna xhigh 14h now, 60% usage gone on x5 ... Experimenting to see what can it produce ...

- by [unknown](#) **&#x21C5; 1**
  <br/> I have experienced something similar. I use OpenCodex as proxy and there set the Luna Max as the only subagent. Works like a charm. The only difference is that I use Terra High as executioner of the plans and use Sol High only for planning.

- by [unknown](#) **&#x21C5; 1**
  <br/> Mi Sol no es capaz de invocar agentes luna… dice que no están disponibles

- by [unknown](#) **&#x21C5; 1**
  <br/> Is there any real differences with using luna threads instead of subagents?

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm getting an error saying that gpt-5.6-luna is not available. Only Sol and Terra. On the IDE. Is this for CLI only or something?

- by [unknown](#) **&#x21C5; 2**
  <br/> There's a hack around that.

  1. Copy ~/.codex/models_cache.json file somewhere
  2. Open this file, find object models[i].slug === 'gpt-5.6-luna'
  3. in this models[i] object, change multi_agent_version to 'v2'
  4. Save the file, write down its pwd
  5. Open ~/.codex/config.toml
  6. Add a line: `model_catalog_json = "/path/to/models_cache.json"`
  7. Save config.toml, restart codex
  8. Done

- by [unknown](#) **&#x21C5; 1**
  <br/> My hero

- by [unknown](#) **&#x21C5; 1**
  <br/> not working

- by [unknown](#) **&#x21C5; -7**
  <br/> I have a free orchestration project for use with primarily codex app.

Check it out on my website for the gh link
