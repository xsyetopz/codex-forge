# Why is Codex Sol still eating up tokens like no tomorrow? [Visit](https://www.reddit.com/r/codex/comments/1vfy1ie/why_is_codex_sol_still_eating_up_tokens_like_no/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [nouzer_noname](https://www.reddit.com/user/nouzer_noname/)

### **Vote:** 142

---

I’m grateful for all the resets, Tibo, but Codex is burning through them at a much faster rate than you’re replenishing them, which rather defeats the purpose.
This is not the usual ‘give us more’ rant, I’m genuinely asking for consistency - GPT 5.5 felt like it achieved a lot more using fewer resources than GPT Sol.
Not entirely convinced this Sol/Luna, etc. Claude-esque named model iteration is OpenAI’s best work, yet I’m happy to be corrected
---

## Comments 97

- by [unknown](#) **&#x21C5; 31**
  <br/> I have the same issue (5x sub) 5.3 or 5.5 was using around 10% per day of my weekly quota with my usual workflow, now it's 25% with SOL xHIGH as planner and Luna MAX sub-agents as implementer.

- by [unknown](#) **&#x21C5; 3**
  <br/> Can you make Sol spawn Luna subagents or you just prompt Luna with Sol's plan?

- by [unknown](#) **&#x21C5; 1**
  <br/> I define my implementation agent in a .toml file and set the model and effort. I want to believe it's using the right model, XD. When I approve a plan it automatically calls the implementer, I can see it in the running thread in the codex desktop app

Additionally to the agent definition I also update my [agents.md](http://agents.md) file with something like:

Use the project custom agent `implementation-agent` to execute concrete implementation plans after the user approves or explicitly requests their execution.

This is an example (not my real instructions) saved in the .codex/agents/implementation-agent.md file inside my project folder

name = "implementation-agent"
description = "Executes approved implementation contracts and returns validation evidence."
model = "gpt-5.6-luna"
model_reasoning_effort = "xhigh"

developer_instructions = """
You are the implementation owner.

- Execute only a self-contained, approved contract.
- Follow repository rules and preserve unrelated changes.
- Stop when decisions are missing or requirements conflict.
- Make focused changes and run the required validation.
- Do not commit, push, or perform external actions without authorization.
- Return CODE COMPLETE with changed files, test evidence, risks, and pending checks.
"""

- by [unknown](#) **&#x21C5; 1**
  <br/> Why do you not use 5.5 anymore?

- by [unknown](#) **&#x21C5; 3**
  <br/> I tested again last week, but 5.6 is more consistent for me

- by [unknown](#) **&#x21C5; 1**
  <br/> Well it's one of the best AI models out there (so far) and you're using it on xhigh. I'm not surprised it costs more. If you want cheaper then well, 5.5 is still out there. Can't have it all.

- by [unknown](#) **&#x21C5; 4**
  <br/> The thing is 5.5 was also the best at that time

- by [unknown](#) **&#x21C5; 0**
  <br/> Yeah, and it's more expensive than 5.4. And 5.4 is more expensive than 5.3...and so on and on.That's why 5.6 luna is an interesting case - potentially as good as 5.4 (though who knows at this point), but cheaper

- by [unknown](#) **&#x21C5; 14**
  <br/> I suspect it's because sol is more than happy to spawn subagents as Sol-max reasoning. Even when that's not required. There's a workaround for making it recognise Luna as a valid subagent by editing the config.toml but all that does is let sol access Luna, it doesn't necessarily discourage it from boiling an ocean to move a button

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah I had to create the custom toml agents with Luna and give very explicit instructions to use only those agents. I wonder why the new v2 subagents framework defaults to all subagents being the same model as the parent agent?

- by [unknown](#) **&#x21C5; 5**
  <br/> When will this subreddit stop complaining and see that it’s by design. Good ol Tibo is not your mate. These resets and “bonuses” are not a gesture of goodwill. Usage is like this purposely

- by [unknown](#) **&#x21C5; 2**
  <br/> How would good ol’ Tibo know things are messed up if vox populi remains quiet ;)

- by [unknown](#) **&#x21C5; 5**
  <br/> Today I found that if I ask 'run luna subagent to do ...' it will run subagent called 'Luna' using gpt5.6-sol high model.

Face.

Palm.

Literally.

- by [unknown](#) **&#x21C5; 2**
  <br/> Ask it to "start a Luna x-high thread or threads and monitor them as part of a goal". That basically does the same thing as agents.

- by [unknown](#) **&#x21C5; 18**
  <br/> Not a problem for me. I recommend you check what junk is getting sent to OpenAI. I once had over 10,000 characters of text being sent to OpenAI from previously approved content for the auto-approve system which absolutely destroyed my context. After I cleared that, problem gone.

And don't use all those shit plugins people tell you to use like Caveman or Rtk. They will reduce the agent's ability to work efficiently which increases longterm token usage

- by [unknown](#) **&#x21C5; 5**
  <br/> hoe did you solved this issue? Did you added smth to your prompts?

- by [unknown](#) **&#x21C5; 4**
  <br/> Damn chill

- by [unknown](#) **&#x21C5; 4**
  <br/> No, I don't use external plugins, but you have a good point - I was running a large project in a single chat with regular /compact yet it turns out I was doing it wrong. For my use case, where I have a very thorough review process, it recommended this:

       [](https://preview.redd.it/why-is-codex-sol-still-eating-up-tokens-like-no-tomorrow-v0-95q2luqeyhhh1.png?width=2072&format=png&auto=webp&s=509ce250914b00dad0eea1e59aad0fb9ad4a0313)

- by [unknown](#) **&#x21C5; 1**
  <br/> Woah that is interesting. I wonder if it's just better to iterate that way? Like force an orchestrator to enforce that rule on sub agents until the task is complete. Did you end up trying this?

- by [unknown](#) **&#x21C5; 1**
  <br/> Yep, I tried it, but instead of forcing the orchestrator or subagents to restart on every loop, I added a lightweight hook that watches Auto-review context growth and compactions. When things get heavy, it waits for a clean stopping point and creates a tiny verified handoff for a fresh chat, so the work continues without dragging all the accumulated context along.

- by [unknown](#) **&#x21C5; 1**
  <br/> How does it work, how is it doing? Did you make a tool or a skill or something ?

- by [unknown](#) **&#x21C5; 3**
  <br/> It’s a small local Codex skill with two optional hooks: one watches Auto-review context growth at permission requests, and the other counts /compact events. It stays silent while things look healthy, then suggests a fresh chat at a clean stopping point and creates a tiny verified handoff instead of copying the whole transcript. It’s working well so far, and because it only reads numeric token/session metadata, the monitor itself adds almost no context.

- by [unknown](#) **&#x21C5; 1**
  <br/> don't use all those shit plugins people tell you to use like Caveman or Rtk. They will reduce the agent's ability to work efficiently which increases longterm token usage

    Really? How is that? I will try it without rtk to see if I notice a difference in efficiency because I haven't noticed any disadvantage yet

- by [unknown](#) **&#x21C5; 11**
  <br/> It's been mostly proven that they are not effective or really not as much as announced by them.

[https://blog.jetbrains.com/ai/2026/07/rtk-claude-code-token-savings/](https://blog.jetbrains.com/ai/2026/07/rtk-claude-code-token-savings/)

- by [unknown](#) **&#x21C5; 1**
  <br/> I'll read that later.Thanks a lot for the link!

- by [unknown](#) **&#x21C5; 4**
  <br/> I’m grateful for all the resets, Tibo, but Codex is burning through them at a much faster rate than you’re replenishing them, which rather defeats the purpose.

    Uhm, I don't think the purpose is to reset codex every 2 days for essentially unlimited usage

I would rather they give us some banked resets so i can use it when required.

- by [unknown](#) **&#x21C5; 3**
  <br/> That's exactly my point, boss. Better yet, why don't they use their 'most-advanced-ever' model like I'd imagine they use it unleashed in the office and just make a single-named model that efficiently saves tokens per ad-hoc user needs, hence no need to switch between models like there's nothing better to do and bitch on reddit like a snitch...and...thus no need of resets. Voila.

- by [unknown](#) **&#x21C5; 3**
  <br/> Tibo, can you repair Sol in the sub Pro??? We are spending a lot of token...Normal day for me was 3% or 5% in de bad situations.Today with the same work 20% ?????????????????????????????????? WTFFFFFFFFFFFF

- by [unknown](#) **&#x21C5; 1**
  <br/> Same brother, hence my post :)

- by [unknown](#) **&#x21C5; 2**
  <br/> My weekly limit ran out and I literally watched Sol burn through $30 of extra usage in about 6 minutes.

That was my emergency reserve but the task was complex and long enough that stopping it near the end and starting a new session with fresh context later would have likely yielded different results, which is not what I wanted to risk.

- by [unknown](#) **&#x21C5; 2**
  <br/> Sol is using more tokens because it's doing way more stuff. Creating tests, running them in the background, validating everything again and again. If you don't need that, then use Terra.

- by [unknown](#) **&#x21C5; 2**
  <br/> There is no tomorrow

- by [unknown](#) **&#x21C5; 1**
  <br/> Note to self: don’t post half-asleep, semi-half-arsed rants about shabby Codex performance. Reddit’s proofreaders never sleep. Excuse me, sir, do you know where they keep the title edit button?

- by [unknown](#) **&#x21C5; 2**
  <br/> You seem to misunderstand my comment :D I'm just ranting about the current situation of the world. It feels like it's going towards the end. "There is no tomorrow" was more like "the world is ending".

Sorry for the confusion my pessimism caused. Your title reads fine.

- by [unknown](#) **&#x21C5; 2**
  <br/> Ah fella, I'm with you - apologies, my own title has been bugging me all day, and for some reason you can do pretty much anything on Reddit but edit titles. Shock, horror!

Now for the most important bit: The fact that you took the time to clear up my misunderstanding is itself a tiny argument against the world ending - there are still thoughtful people in it, mate 👍

- by [unknown](#) **&#x21C5; 2**
  <br/> My workflow is exactly the same and it's ripping through tokens. And no, it's not spawning trillions of sub agents.

I really like Sol but it's insane how much it burns. It feels like it's way more than before too.

- by [unknown](#) **&#x21C5; 1**
  <br/> Exactly right.

- by [unknown](#) **&#x21C5; 2**
  <br/> I’m probably in the minority here, but I care less about how many resets we get and more about how much *useful work* each token actually does 😅.

That's actually one of the reasons I'm building **Marginal**: [https://github.com/SignalLayerLabs/Marginal](https://github.com/SignalLayerLabs/Marginal).

The core idea is that agents shouldn't be optimized for generating *more* tokens, but for making *better decisions per token*. If an email can be solved in 200 tokens, spending 2,000 to produce a beautifully formatted novella isn't necessarily intelligence... it's just expensive enthusiasm. 😂

My next step is a direct integration layer for **Codex**, where Marginal can influence planning and action selection before the model starts chewing through context. Unfortunately, developing that currently costs me the same thing it costs everyone else: **tokens and time**. So that's still a few weeks away while I slowly fund the training process with my own quota. 😅

GPT-5.5 felt efficient because it often seemed to have a better *signal-to-token ratio*. Whether Sol/Luna ends up being better long-term will depend less on raw capability and more on whether they can deliver the same outcome with fewer inference steps.

At some point, the winning model won't be the one that writes the longest answer. It'll be the one that lets you say, "Thanks, we're done here," the fastest. 🚀

- by [unknown](#) **&#x21C5; 2**
  <br/> I have the same issue also. For some reason, my weekly limit feels like my 5h limit now.

- by [unknown](#) **&#x21C5; 3**
  <br/> you are probably using Sol where its overkill. Like I have agents in multiple projects writing lots of rs code perfectly fine set to Luna (max effort since its so cheap let it overthink). I use Sol for architecture plans and reviews (reviews of significant work not backseat coding subagent delegation) but Luna is reasonably close in quality at implementation to Sol and definitely better than old codex versions. Even codebases solving hard problems are still almost all plumbing code if you really need Sol on a couple things just do that. This is best done through actual session controls (use codex app server which makes this easy not the cli or gui app) and not routers or subagents since being cache friendly is important.

- by [unknown](#) **&#x21C5; 1**
  <br/> Have you used claude opus? How its comparable to sol?

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks! Yh, I'm doing a major frontend refactor of a 1M+ LoC codebase so apart from using it during the planning phase, I also kept it for the implementation and reviews. Despite frequent context compact, my mistake was letting a single convo run for too long, but now have automated a monitoring-and-control process to avoid this happening again.

- by [unknown](#) **&#x21C5; 3**
  <br/> because you're supposed to use Sol - medium to make a plan, and Luna for execution, and it will last 10 times more.

Executing plans with Sol, or using Sol-high and above for planning is for specific use cases which I doubt 95% of us here belong in it

- by [unknown](#) **&#x21C5; 6**
  <br/> I tried exactly what you're suggesting with Sol Med and Luna Max for a few days, and honestly between the setup and testing, the verification by Sol, Luna's long runs and mistakes (which means another handoff), it's literally cheaper for me to just use Sol High.

- by [unknown](#) **&#x21C5; 1**
  <br/> Right. Using Luna Max and then doing 1 review with Sol Ultra at the end just to make sure everything is in order is the same as just using Sol Ultra from the beginning.

- by [unknown](#) **&#x21C5; 4**
  <br/> Yh, this is partly the problem perhaps, but is also what gets me - they could've automated this process entirely and spared us the whole 'use X when Y' bollocks; maybe they could've even wrapped all these Sol, Luna, Mars permutations under one hat. This would've been a real differentiator. Or, if they're so lazily inclined, could've just named them GPT Plan, GPT Execute, etc. and not simply follow what Claude's been doing in their branding.

- by [unknown](#) **&#x21C5; -1**
  <br/> no its not "partly" the problem - it's absolutely your whole problem. Changing execution to luna high/xhigh will make your limits 10x and I'm not even exaggerating

- by [unknown](#) **&#x21C5; 1**
  <br/> Quality of work tradeoff?

- by [unknown](#) **&#x21C5; 2**
  <br/> If you’re using Luna subagents that follow the directions of an orchestrator like Sol, then the difference in work quality between Max and xHigh on Luna is minimal. Both are capable of following directions.

xHigh also uses like ~40% less tokens while performing the same work.

Now if you’re running Luna as a solo implementer without an orchestrator also running, then Max will be noticeably better in that scenario.

Luna is cheap regardless, but if you’re running tasks at scale then that token usage difference will actually matter.

- by [unknown](#) **&#x21C5; 1**
  <br/> time to first answer on luna max is about 2minutes

- by [unknown](#) **&#x21C5; 1**
  <br/> why not Luna Max?

- by [unknown](#) **&#x21C5; 3**
  <br/> Luna Max uses like ~70% more tokens than xHigh on the same work.

Luna is very cheap regardless, but if you’re working at scale that difference will actually matter. Max isn’t really necessary if you’re using Sol as an orchestrator anyway.

Basically, Luna xHigh performs a bit worse on its own but is substantially more efficient and just as capable at following directions.

- by [unknown](#) **&#x21C5; 1**
  <br/> Isn't this a weird incentive problem? If a model burns through your allowance faster, it also pushes users toward higher tiers or waiting for resets. That doesn't create much pressure to optimize token efficiency. Cursor seems to have put a lot more effort into squeezing more work out of the same budget/model

- by [unknown](#) **&#x21C5; 3**
  <br/> Customers are attracted to models/harnesses that are token efficient. I ditched Claude specifically because it wasn't. If Codex starts intentionally wasting tokens, users will smell it and jump ship as soon as the competition provides a better alternative.

- by [unknown](#) **&#x21C5; 1**
  <br/> Isn't it already?My monthly $20 Codex plan allows me 5.5B tokens/month (in/out), with another 7.1B(cache) - bloated due to the resets we had$60 cursor (used till the very last drop) - 2.1B tokens in total, and I got so much more work done.

- by [unknown](#) **&#x21C5; 1**
  <br/> It's been a while since I've tried Cursor (6+ months, which is like centuries in AI years), but I was not impressed with the quality of their in-house model at the time. I may give it another shot if you're saying it compares favorably now.

- by [unknown](#) **&#x21C5; 1**
  <br/> Take a look here: if using sol your subagents might not be luna at all (but rather also sol, which burns tokens like mad)[https://www.reddit.com/r/codex/comments/1vfbgtp/if_you_experience_extensive_token_burn_and_use/](https://www.reddit.com/r/codex/comments/1vfbgtp/if_you_experience_extensive_token_burn_and_use/)

- by [unknown](#) **&#x21C5; 1**
  <br/> start a new chat in codex. what the chat gets too large it has to go through all the data on every turn so just tell it you want to start a new chat and give me a prompt to carry on where i left off in this chat

- by [unknown](#) **&#x21C5; 1**
  <br/> Still waiting for magic resets that popped up during the night to see the next morning that I had a reset, its a great feelingLove Sol xhigh but if it can consume as Luna that would be perfect. (x5 Codex here)

- by [unknown](#) **&#x21C5; 1**
  <br/> ab testing

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, Sol is not viable for x1 and x5 sub.

- by [unknown](#) **&#x21C5; 2**
  <br/> what if I told you 200$ pro plan also not enough for 5.6 sol medium?

- by [unknown](#) **&#x21C5; 1**
  <br/> shit barely get by with 2 $200 on sol med

- by [unknown](#) **&#x21C5; 1**
  <br/> Same here. I don’t mind having limits, but it’s hard to plan when similar tasks seem to use completely different amounts.

- by [unknown](#) **&#x21C5; 1**
  <br/> There is no tomorrow for him 😭

- by [unknown](#) **&#x21C5; 1**
  <br/> If you don't have predefined agents configured, I suggest doing so. I have gotten absolutely insane usage out of 5.6 ever since I created my own agents. By default, even if your main chat is on Luna-High, it can and will spawn agents on Sol of any reasoning level, which is rarely necessary. I only use Sol for planning and reviewing now with Luna on almost everything else. I get better, faster results at a fraction of the cost now.

- by [unknown](#) **&#x21C5; 1**
  <br/> I think the problem is that codes doesn't give enough clarity on how much any given action is using. If codex had better analytics built in we could all get better at being more effecient with our tokens.

- by [unknown](#) **&#x21C5; 1**
  <br/> Well, I still feel that creating some automation/self-optimising model (even if all 3 are wrapped into 1) must be a walk in the park for the mighty boffins there at OpenAI. Begs the question if there’s an incentive not to, especially if skinning alive charging API users brings in more cash.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol is a much bigger model... Terra is on the level of 5.5, both of which are bigger than GPT 5 and 5.1 era models were. They really tried the VFM path and it didn't work. Even Sol is too dumb to settle with. And people are willing to pay way way more money.

- by [unknown](#) **&#x21C5; 1**
  <br/> For what it’s worth, Sol 5.6 is usable for me now. It no longer burns through my token allowance like it did during the first 2-3 weeks. They’ve definitely fixed the excessive token consumption on my end....for now 🤣

I’m using Sol High on the Codex X20 plan.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks mate, same here - x20 plan

- by [unknown](#) **&#x21C5; 1**
  <br/> Plan with Sol, execute with Luna (Max). I only learned this the hard way after exhausting my weekly quota in 6 hours by just using Sol (High) in goal mode. I am on the $100 plan.

- by [unknown](#) **&#x21C5; 1**
  <br/> The truth is, OpenAI have no real handle on usage, and the 'resets' are a cop out.

- by [unknown](#) **&#x21C5; 1**
  <br/> I thought Luna max supposed to be 5.5 replacement but even cheaper

But once I go sol, I can’t go back, I find myself constantly switch from Luna to Sol

- by [unknown](#) **&#x21C5; 1**
  <br/> > GPT 5.5 felt like it achieved a lot more using fewer resources than GPT Sol.

Everyone still have access to gpt 5.5? If it *feels* that way you can just keep using 5.5. Why you using sol if it doesn't give you the results you want?

- by [unknown](#) **&#x21C5; 1**
  <br/> but we're paying to use the 'latest and greatest', no?

- by [unknown](#) **&#x21C5; 1**
  <br/> From one point of veiw, you got better and cheaper models (ot at least that is what we've been told) and from another, 5.5 is not performing (token efficiency) as it was a month ago. There IS proven general reduction for the total tokens available in the paid accounts, something that OpenAI are free to change at any moment.

- by [unknown](#) **&#x21C5; -1**
  <br/> Sounds like a you problem. Check your doc files, complexity of functions. Do a refactor.

- by [unknown](#) **&#x21C5; 0**
  <br/> I appreciate you're missing context, but this is too generic an advice. The basics have been covered, yet more is to be desired from the models :)

- by [unknown](#) **&#x21C5; 0**
  <br/> 1 Dont use Sol over medium

2 Try different harness with codex oath, like OMP

- by [unknown](#) **&#x21C5; 0**
  <br/> From what I understand and see they seem to have fixed the usage for plus plan, but not on both pro plan (don't ask me why😂 idk) which doesn't make sense. Many users on plus have reported their usage being fixed and lasting longer

- by [unknown](#) **&#x21C5; -2**
  <br/> I think some of you expect 4 million lines of code to be written for 4 million tokens or $120.

GPT models empirically use the least tokens/turns per task but you still constantly complain about it. Your prompts and expectations are the problem. Or most likely: you have too much unorganized junk that it has to read, and haven't instructed it to ignore certain files.

- by [unknown](#) **&#x21C5; 1**
  <br/> So what do you think my prompt and expectations were?

- by [unknown](#) **&#x21C5; 2**
  <br/> Don’t use Sol Max, use Sol High

- by [unknown](#) **&#x21C5; 4**
  <br/> Actually, I've just discovered that staying in a single chat on a long-running project is what's burning up a lot more tokens since your auto-review file grows substantially. Best practice per OpenAI's own docs is:

- First time the main context reaches 50%: run /compact.

- Second time it reaches 50% in the same conversation: create a handoff and run /new.

- Regardless of the context meter: run /new after five Auto-reviews.

- by [unknown](#) **&#x21C5; 2**
  <br/> Turn off auto review. Add a list of safe commands to the allowlist.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks, I still want to use auto-review so I figured if I create a repo-specific skill that protects long-running work from avoidable reviewer/context growth while preserving the facts a new conversation needs will do the trick.

- by [unknown](#) **&#x21C5; 2**
  <br/> per Tibo tweet: if you want max intelligence use one worker many compacts on long running tasks

- by [unknown](#) **&#x21C5; 2**
  <br/> Literally was compacting every time the bugger reached 50% - not working in a long chat/project, per their own documentation.

       [](https://preview.redd.it/why-is-codex-sol-still-eating-up-tokens-like-no-tomorrow-v0-i2zctr9k1ihh1.png?width=2052&format=png&auto=webp&s=f11ff2da99544c1591a827537d041486edd5d575)

    I'd automate this for my workflow by creating a global hook plus a small handoff skill

- by [unknown](#) **&#x21C5; 1**
  <br/> He didn’t mean do all your work in a single chat.

- by [unknown](#) **&#x21C5; 1**
  <br/> Tens of thousands of changed LoC doesn’t address the issue since LoC isn’t what drives context usage. The relevant factors are how many Auto-reviews occur and how much conversation/tool history each reviewer receives. In my traced session, one reviewer chain grew from 7,054 to 95,915 input tokens across 11 reviews. Are you using approvals_reviewer ="auto_review" and checking the guardian-session token logs?
