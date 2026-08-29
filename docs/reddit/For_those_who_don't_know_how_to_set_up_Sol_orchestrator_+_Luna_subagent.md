# For those who don't know how to set up Sol orchestrator + Luna subagent [Visit](https://www.reddit.com/r/codex/comments/1vcrwsi/for_those_who_dont_know_how_to_set_up_sol/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Otherwise-Sir7359](https://www.reddit.com/user/Otherwise-Sir7359/)

### **Vote:** 366

---

This repo was previously posted in one of my comments, I'm reposting it here if anyone finds it useful.
[https://github.com/viettran-edgeAI/codex_workflow](https://github.com/viettran-edgeAI/codex_workflow)
Been building this since 5.6 dropped with optimizing token usage as the ultimate goal, and tweaking it pretty much every day since. Luna got way cheaper recently and more ppl started wanting to use it as a subagents, so I bundled everything up with a guide so Codex can set it all up for you automatically.
Tried to keep the whole thing as simple as possible
--------------------------------------------------------------

Edir : a bit more explain before I go to bed - it’s 3 AM in my timezone:

- For lightweight tasks, Q&A, it won’t overdo things.  `light route` is default route in this workflow. No subagent, no complex worflow, minimal context.
- Sol handles context, planning, task splitting, and supervision, while Luna subagents do the implementation. Each task is packaged into a small, self-contained work package with clear scope, context, and expected output, so each subagent only gets what it needs.
- Sol still reads the main documentations and the important parts of the codebase - that’s the manager’s job. An `explorer` subagent helps reduce that load by looking into tools, dependencies, external libraries, etc. The goal is to minimize Sol’s token usage and keep it focused on the important stuff.
- For really hard tasks, `executor_luna` can get stuck. In that case, Sol can spawn an `executor_sol` as a fallback, or use it from the start. Right now, the workflow limits this to max 1 `executor_sol`.
- For handoff between sessions, `project_progress.md` and `latest_session_work.md` are managed by Sol as part of the main documentation structure. They keep long implementation plans moving smoothly across multiple sessions.
...... etc.......

---

## Comments 126

- by [unknown](#) **&#x21C5; 23**
  <br/> Found your comment with this workflow yesterday and tried it today, during the day. Yes, I almost used all the weekly limit today, but the amount of work done is increddible. Thank you for this, it works well

- by [unknown](#) **&#x21C5; 12**
  <br/> thanks, very happy to hear that. but u should add the following to ~/.codex/config.toml:

[features.multi_agent_v2]

hide_spawn_agent_metadata = false

tool_namespace = "agents"

. This is the method I used to fix the issue that not being able to call the Luna subagent in multi_agent_v2, but yesterday I forgot to add it to the codex's automatic setup guide file ;((

- by [unknown](#) **&#x21C5; 2**
  <br/> Thanks I've updated. Actully the workflow worked well in more than 90% cases, but this improvement definitelly improves it

- by [unknown](#) **&#x21C5; 1**
  <br/> this method does not work for me. sol can only run subagent sol/terra

- by [unknown](#) **&#x21C5; 1**
  <br/> Did you manually configure  subagents with the toml files?

- by [unknown](#) **&#x21C5; 9**
  <br/> I go around the limitations of the subagent system by telling codex to launch new sessions instead.

- by [unknown](#) **&#x21C5; 3**
  <br/> How does that work?

- by [unknown](#) **&#x21C5; 8**
  <br/> In Codex, individual chats (sessions) can talk to each other, and AI can even spawn new chats. So I tell it to do that. Sometimes I divide work manually, giving different chats different jobs and informing one chat what the other is doing. GPT is smart enough to deal with all that.

- by [unknown](#) **&#x21C5; 3**
  <br/> Are there any tradeoffs to consider with this approach vs using subagents?

- by [unknown](#) **&#x21C5; 4**
  <br/> It's harder to manage things when the task is large, and the Codex cli doesn't support threads

- by [unknown](#) **&#x21C5; 1**
  <br/> Big plus is that you and other agents from other sessions also can communicate with sub-session (my term for this approach), it's a normal chat. With sub-agent you can't.

Because of this feature ATM I prefer Codex over Claude and VS Code.

- by [unknown](#) **&#x21C5; 2**
  <br/> Wow, I didn't know that, this is huge, I like the way I can see them actually talking to each other. Kudos

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh you do that in the native application? I usually work in codex cli for some reason..

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes. Not sure if the CLI can do that but I don’t see why not.

- by [unknown](#) **&#x21C5; 1**
  <br/> Okay so native app, and then what instruction lets him spawn these sub-sessions? You actually see new chat windows appear configured for Luna if I understand correctly? You have like a standard generic prompt to do this you can share?

- by [unknown](#) **&#x21C5; 1**
  <br/> In Codex glossary a chat is called a "thread". You can prompt it with something like "Do it in a new thread" or "Start a new thread and do it there". Yes, you will see thread appear in the sidebar, you will also see messages sent to it by Codex itself marked as something like "Sent by Codex from other thread".

Codex achieves it by its own tool calls. For me it's one the best features of Codex. I don't know why other agentic tools didn't implement this "MCP to itself" concept yet.

Oh, you can not only create threads but tell Codex to send messages to it after the thread is created. You can even tell Codex to create a thread and instruct the thread to respond back to your "main" thread. It's like subagents but without the "sub" part - meaning the spawned threads are not automatically closed and you can proceed with conversation there, even after the initial task is completed.

- by [unknown](#) **&#x21C5; 1**
  <br/> You can also try automating that with some instructions in a AGENTS.md file. Tell it to divide tasks into separate chats and choose the models and effort depending on the task.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah. I don’t do that anymore for two reasons. The first is that I don’t do that many projects and the second is that they keep changing stuff in the harness and I tend to forget what input into AGENTS.md and sometimes my old instructions would clash with reality (like I only noticed a month after 5.3 was discontinued that my AGENTS.md told Codex to use it for subagents).

- by [unknown](#) **&#x21C5; 2**
  <br/> I agree, it could get outdated fast and needs some micro management with the file. I try to keep the instructions very general and short.

- by [unknown](#) **&#x21C5; 3**
  <br/> Samsies as well. It’s also more efficient to build out the subagents in the SDK.Sol can invoke a lot of terminals and “sessions” on its own. Just have to be ultra specific in the prompt.

- by [unknown](#) **&#x21C5; 2**
  <br/> Samsies

- by [unknown](#) **&#x21C5; 1**
  <br/> Interesting. Could you point me in the right direction on how?

- by [unknown](#) **&#x21C5; 1**
  <br/> In the Codex app, tell it something like „delegate simpler tasks to Luna in a new session”

- by [unknown](#) **&#x21C5; 8**
  <br/> Is this better than switching from sol to Luna once sol has made a plan?

- by [unknown](#) **&#x21C5; 2**
  <br/> That method works fine for minor tasks, but it's very time-consuming and difficult to manage when undertaking heavy tasks, such as ensuring continuity ,  implementing necessary tests, etc.

- by [unknown](#) **&#x21C5; 17**
  <br/> Just ask Sol to change this for you.. it’s like 2 lines simple edit in config.toml

- by [unknown](#) **&#x21C5; 17**
  <br/> There's a bug unfortunately where Luna is not a registered model for the v2 subagents or something

Even if you change the config.toml, it may still spawn sol or terra subagents. Source: got this issue this morning. There are workarounds though.

[https://github.com/openai/codex/issues/31814](https://github.com/openai/codex/issues/31814)

- by [unknown](#) **&#x21C5; 12**
  <br/> yes, add the following to  /.codex/config.toml:

[features.multi_agent_v2]

hide_spawn_agent_metadata = false

tool_namespace = "agents"

------

I've been using this method since version 5.6 was released. I asked Sol to test calling two Luna subagents in my workflow (`executor_luna)`to confirm.

Codex stores rollout records under:

~/.codex/sessions/YYYY/MM/DD/I first found the recently modified session files:

find ~/.codex/sessions \
  -type f -name '*.jsonl' -mmin -15 \
  -printf '%T@ %p\n' |
sort -nr |
head -20This produced three sessions:

- One parent Sol session.
- Two newly created Luna child sessions.

A basic search showed the separation clearly:

Parent session:
  executor_luna occurrences: 16
  gpt-5.6-sol: present
  gpt-5.6-luna: absent

Child session 1:
  executor_luna occurrences: 3
  gpt-5.6-luna: present
  gpt-5.6-sol: absent

Child session 2:
  executor_luna occurrences: 3
  gpt-5.6-luna: present
  gpt-5.6-sol: absentI then extracted every model and token-related field from both child JSONL files:

for f in "$F2" "$F3"; do
    echo
    echo "========== $(basename "$f") =========="

    jq -r '
      paths(scalars) as $p
      | select(
          (($p[-1] | tostring) == "model")
          or (($p[-1] | tostring) | test("token"; "i"))
      )
      | "\($p | map(tostring) | join(".")) = \(getpath($p))"
    ' "$f" 2>/dev/null
doneThe first child session reported:

payload.state.model = gpt-5.6-luna
payload.state.personality.model = gpt-5.6-luna
payload.model = gpt-5.6-luna
payload.collaboration_mode.settings.model = gpt-5.6-luna

payload.info.total_token_usage.input_tokens = 17743
payload.info.total_token_usage.cached_input_tokens = 17152
payload.info.total_token_usage.output_tokens = 298
payload.info.total_token_usage.reasoning_output_tokens = 243
payload.info.total_token_usage.total_tokens = 18041

payload.time_to_first_token_ms = 9270The second child session reported:

payload.state.model = gpt-5.6-luna
payload.state.personality.model = gpt-5.6-luna
payload.model = gpt-5.6-luna
payload.collaboration_mode.settings.model = gpt-5.6-luna

payload.info.total_token_usage.input_tokens = 17749
payload.info.total_token_usage.cached_input_tokens = 0
payload.info.total_token_usage.output_tokens = 436
payload.info.total_token_usage.reasoning_output_tokens = 372
payload.info.total_token_usage.total_tokens = 18185

payload.time_to_first_token_ms = 10675This proves that the Luna subagents have been initialized and successfully invoked. However, the Codex statistics page still doesn't show Luna usage figures; it seems there's some kind of error with that page.

- by [unknown](#) **&#x21C5; 1**
  <br/> Good info

- by [unknown](#) **&#x21C5; 1**
  <br/> note: this only works reliably on CLI. The app does something different and cannot spawn luna agents from sol still.

- by [unknown](#) **&#x21C5; 3**
  <br/> Nice setup. One thing that helped me: give Luna tiny single-purpose prompts instead of one big "do this project" prompt. The orchestrator keeps the context, and when each subagent stays small the token burn drops a lot. Pin reasoning to medium for the subagents unless they actually need max, because that's where the time goes.

- by [unknown](#) **&#x21C5; 3**
  <br/> Yes, this workflow has always worked that way: Sol breaks down the task and packages it into work packages: task, context needed for the task, goal... before assigning it to Luna subagents. Luna has a nearly vertical performance curve and it's very cheap, so I'm setting it to xhigh/max for the important subagents.

- by [unknown](#) **&#x21C5; 2**
  <br/> I just built a skill for it with sol, and it will orchestrate parts of a bigger task depending on the part Terra and Luna can play. Lowered my usage significantly

- by [unknown](#) **&#x21C5; 2**
  <br/> can you share the skill?

- by [unknown](#) **&#x21C5; 2**
  <br/> Please share the skill

- by [unknown](#) **&#x21C5; 2**
  <br/> Thank you! I will try to adapt to my actual workflow, I was looking for it 😃👍

- by [unknown](#) **&#x21C5; 2**
  <br/> Using luna as subagents, won’t it keep failing Sol’s reviews? I tried using Terra low, medium and high, and they kept failing reviews.

Haven’t tried Luna due to not knowing about the workaround.

- by [unknown](#) **&#x21C5; 2**
  <br/> It has never failed or gotten stuck. I have designed `executor_sol` as a fallback for those cases, but it's almost never called during my usage. Sol's job is to break down the plan and package it into manageable tasks for Luna, including goals, context, etc., so Luna is rarely distracted.

- by [unknown](#) **&#x21C5; 2**
  <br/> Thank you for sharing this. I look forward to more efficient usage of the plan.

Just resuming (by reading docs it generated) already took up 10% usage. The other 90% needs to be better used, hopefully your project helps.

- by [unknown](#) **&#x21C5; 2**
  <br/> Thank you. Successfully mod intel display driver to use with my modded miniled. I replace my legion 7 screen with miniled from asus 2024, so there's weird bug when using hdr / sdr. You have helped me a lot

- by [unknown](#) **&#x21C5; 1**
  <br/> glad to hear that

- by [unknown](#) **&#x21C5; 2**
  <br/> I’ve got a few personalization and configurations in codex’s global agents.md. It basically tells it to keep my custom inventory system updated and to use it to search for tools or projects so I don’t have to open codex in a specific workspace. Does it override the agents.md or does it just load up both and keep it in memory?

- by [unknown](#) **&#x21C5; 1**
  <br/> The global AGENTS.md file in ~/.codex will not be overwritten; it and local AGENTS.md file in current project will be loaded sequentially by Codex.

- by [unknown](#) **&#x21C5; 1**
  <br/> Damn that’s awesome. Appreciate the fast response and thanks for sharing!

- by [unknown](#) **&#x21C5; 1**
  <br/> Haha, it’s the weekend! I basically spent all day yesterday and today finishing up this repo for everyone.

- by [unknown](#) **&#x21C5; 2**
  <br/> I’m sure they’ll have a statue made for you somewhere

- by [unknown](#) **&#x21C5; 1**
  <br/> lol, that too much !

- by [unknown](#) **&#x21C5; 2**
  <br/> Can i set all the agetns and settings at project level, also i have been using graphify u think it can integrate and will work with this workflow or should be tuned ?

- by [unknown](#) **&#x21C5; 2**
  <br/> Yep, the workflow is already project-level. During setup, just tell Codex to update `heavy_route.md` and [`AGENTS.md`](http://AGENTS.md) to use Graphify instead of `project_structure.md` for codebase structure/navigation.

- by [unknown](#) **&#x21C5; 2**
  <br/> U are the best i m literally trying It now and with Just the agents.md seems to work and call graphify i Will ask codex to make this change and Will retry. Do i just need to change the heavy-route?

- by [unknown](#) **&#x21C5; 2**
  <br/> This is amazing. As a quick benchmark, I asked it to build a chess engine from scratch in C++. I used Sol XHigh as the orchestrator and, of course, the heavy route.

After about 1 hour and 20 minutes, it gave me a complete chess engine with more than 2,700 lines of organized C++ code, and it only used 4% of my weekly limit. I’m on the $20 plan.

The drop in usage is honestly insane. Over an hour of work, thousands of lines of code, and only 4% usage.

Next, I’m going to have it run the engine against some other chess engines and try to estimate its Elo. I’ll post an update when I have the results.

- by [unknown](#) **&#x21C5; 2**
  <br/> Really glad to hear that. Optimizing token usage was actually the original goal of this workflow, so seeing results like this is exactly what I was hoping for.

- by [unknown](#) **&#x21C5; 2**
  <br/> The results just came back, and the engine’s Elo is around 1786. I don’t know that much about chess, but that seems pretty good for only 4% usage on a $20 plan.

Amazing work on the token optimization, man. This probably would’ve taken multiple resets without this workflow.

- by [unknown](#) **&#x21C5; 2**
  <br/> Hh, letting Sol write the code itself would probably push the Elo a bit higher — but the weekly limit might evaporate a large amount. Also, for extremely critical parts that require very strong reasoning, u can tell Codex to use `executor_sol` for that specific part.

- by [unknown](#) **&#x21C5; 1**
  <br/> Would you describe your process for setting this up?

- by [unknown](#) **&#x21C5; 2**
  <br/> Will try this.

- by [unknown](#) **&#x21C5; 1**
  <br/> For what type of work is this stup generally advised and when is it overkill? Does it still generate value when, for example, building a data layer setup with many API calls and caching or is it more for fullstack stuff?

- by [unknown](#) **&#x21C5; 1**
  <br/> It has 3 routes, and defaults to the lightest route, so normally nothing needs to be done.

When you need to deploy heavy tasks or resume a heavy task that was previously paused or in a previous session, just tell Codex to switch to the heavy route, and it will automatically activate the full workflow, load the system context, automatically dispatch the subagents...etc.

- by [unknown](#) **&#x21C5; 1**
  <br/> This is just for one subagent?

- by [unknown](#) **&#x21C5; 3**
  <br/> multi

- by [unknown](#) **&#x21C5; 2**
  <br/> I have a question that might be better in another post but why choose Luna to implement instead of Terra or Sol itself?

- by [unknown](#) **&#x21C5; 4**
  <br/> Luna Max is really strong when Sol gives it well-defined work packages, and it’s super cheap. The main goal here is to optimize token usage.

I also added a fallback `executor_sol` subagent for the really hard stuff. If you’re on the 20x plan, you can just use Sol or Terra as your implementation subagents instead.

- by [unknown](#) **&#x21C5; 2**
  <br/> Okay. I'll try it like this. I have x5 plan. Thanks ☺️

- by [unknown](#) **&#x21C5; 1**
  <br/> Nice, I’ll check it out.

I built my own orchestrator framework on my gh called Agent System.

Seems this is the new community project lol

- by [unknown](#) **&#x21C5; 1**
  <br/> Is it possible to run a setup like this on opencode?

- by [unknown](#) **&#x21C5; 1**
  <br/> Appreciate this

- by [unknown](#) **&#x21C5; 1**
  <br/> My Luna every time acts as orchestrator and runs sol spawns

- by [unknown](#) **&#x21C5; 1**
  <br/> Sounds quite rebellious

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, but the Sol every time tell me that he can’t run the Lunas, only other sols or terras 😅

- by [unknown](#) **&#x21C5; 1**
  <br/> My workflow already fixed it.  or, u can add the following to ~/.codex/config.toml:

[features.multi_agent_v2]

hide_spawn_agent_metadata = false

tool_namespace = "agents"

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks, will try that. I find Luna very well working on tasks if they are specific enough.

- by [unknown](#) **&#x21C5; 1**
  <br/> Divides entre sol y luna. No vendría bien tener también Terra?

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah, any model can be used as an orchestrator. Sol is just the recommended model.

- by [unknown](#) **&#x21C5; 1**
  <br/> Si, como orquestador quiero sol pero puedo invocar sub agentes sol y luna solamente o Terra también ?

- by [unknown](#) **&#x21C5; 1**
  <br/> Ah, got it. Right now the subagents are using Luna. You can manually edit files like `executor_luna.toml`, `tester.toml`, etc. before installing the workflow and change the model to:

`model = "gpt-5.6-terra"`

- by [unknown](#) **&#x21C5; 1**
  <br/> Can it set the Luna effort level?

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes, during the workflow setup process, Codex will ask if you want to enable maximum reasoning effort instead of the default xhigh. Respond with the reasoning level you want, or you can manually edit the `model_reasoning_effort` parameter in the toml files.

- by [unknown](#) **&#x21C5; 1**
  <br/> Nice thanks! I'm hoping to try it on the next reset

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh man, I’ve replied to so many people today that I somehow became a “Top 1% Commenter” lol.

- by [unknown](#) **&#x21C5; 1**
  <br/> I've been using the v1 subagents instead of v2. Does v1 have the same issue with spawning Luna as a subagent?

- by [unknown](#) **&#x21C5; 1**
  <br/> I haven't tested v1 extensively, so can't give you a definitive answer. However, others say v1 works well when using Luna as a subagent.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks for the reply! Hopefully I won't have to use a workaround to spawn a Luna subagent in V1.

Is there any advantage in using V2 over V1, given the lack of stability?

- by [unknown](#) **&#x21C5; 1**
  <br/> agree, v2 still have quite alot of issues. v2 pushes orchestration deeper into the runtime/model tool surface. `spawn_agent` supports parameters like `task_name`, `message`, `fork_turns`, etc., I think it’s designed to work efficently with Sol.

- by [unknown](#) **&#x21C5; 1**
  <br/> just ask sol(orqustrator) to manage in-tree separate threads with luna. he can talkk directly to other sessions and controlls them

- by [unknown](#) **&#x21C5; 1**
  <br/> I worked on two Medium sized tasks and told the agent to track the implementation detail, Luna is good model but it requires more rounds of implementation review and fixes so eventually it becomes more expensive.

       [](https://preview.redd.it/for-those-who-dont-know-how-to-set-up-sol-orchestrator-luna-v0-8uifjuia40hh1.png?width=1197&format=png&auto=webp&s=6c15a3219ba186d7fcc37f9a45ae7c76bbfe0ff3)

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks for sharing feedback. This workflow can’t be optimal for every type of task.U could write an additional `executor_terra` and tell Codex to implement it into workflow to optimize for your works

- by [unknown](#) **&#x21C5; 1**
  <br/> Hey there! when everyone speaking about Luna `Max` does they mean `Extra High` or am I missing smth?

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, max isnt xhigh and higher than xhigh.

- by [unknown](#) **&#x21C5; 1**
  <br/> Got it, thxSeems it's not available for Plus users. In this case, will be your workflow works with xHigh if I haven't Max?

- by [unknown](#) **&#x21C5; 1**
  <br/> Max available for Plus users. You can use Luna max in my codex workflow. Im plus user too

- by [unknown](#) **&#x21C5; 1**
  <br/> Hmm, okay, thx againbut apparently I can't see it in Effort section

- by [unknown](#) **&#x21C5; 2**
  <br/> lol, it was simply turned off, sorry

- by [unknown](#) **&#x21C5; 2**
  <br/> **Settings → General → Model features**. find **Available reasoning efforts**, turn on Max. But my codex_workflow has already automatically activated Max effort for the subagents in toml files.

- by [unknown](#) **&#x21C5; 1**
  <br/> Btw, is there a way to "uninstall" it, just in case? I mean your `codex_workflow`

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm creating a completely new version with all the necessary commands for installation, updating, disabling, etc. The current version, which I created over the weekend, doesn't have an uninstall command yet. To uninstall manually, simply delete the [AGENTS.md](http://AGENTS.md) file and the agent_docs/ folder in your project directory.

- by [unknown](#) **&#x21C5; 2**
  <br/> I’ll be waiting for new version, thx

- by [unknown](#) **&#x21C5; 1**
  <br/> Can you explain what you mean exactly with the supervision step done by Sol? Is it a proper review of the Luna subagent output followed by a feedback to perform changes/improvements ?

- by [unknown](#) **&#x21C5; 1**
  <br/> A wwork package assigned by Sol to `executor_luna` will include a goal, and it will have to execute until that goal is achieved. A tester will be attached if needed. If more than two rounds of testing fail to achieve the goal, it will be considered stuck and replaced by another `executor_luna` or a more intelligent `executor_sol` as fallback.

- by [unknown](#) **&#x21C5; 1**
  <br/> I’m not extremely familiar with the /goal tool. What is the difference between that and sharing a detailed instructions to Luna to be performed? I mean if Luna performs the coding based on a plan shared by Sol, it is not 100% sure that the way Luna coded the solution is optimal, does Sol or the /goal allow to review the Luna output and suggest optimizations ?

- by [unknown](#) **&#x21C5; 1**
  <br/> The goal of the task assigned to Luna isn't the `/goal` tool; it's simply the objective of that task package. You're right to be curious: Luna's solution might not be the most optimal compared to Sol's, and that's a trade-off. Therefore, right from the task breakdown and packaging stage, Sol must consider dividing tasks into sufficiently small parts, providing the necessary context, and defining the objective of that task package for `executor_luna`. Multiple `executor_luna` instances can run simultaneously. Sol also won't read everything Luna has done, as that would be very token-intensive; it will only read a short report (150 words for the event and 250 words for the final) to determine whether the objective of that task package has been completed or failed.
