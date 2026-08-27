Luna is a lunatic and I don’t understand how y’all trust it with real work

**TL;DR:** Luna sucks at any remotely complex coding tasks for me. People who use it for 90% of their coding… what are you actually doing with it? What makes you successful with it?

\---

Excuse the rant but I keep seeing people here recommend Luna as the solution to Codex usage limits: *it’s dirt cheap, I use it for 90% of my coding tasks, Luna Max is surprisingly good at coding, I use Sol as the coordinator and Luna Max subagents, etc.*

I’ve tried... repeatedly. And I genuinely, painstakingly,  don’t understand how people are getting any good coding results from it.

On anything remotely complex **it’s just bad**. Sure it’ll implement something that “works”. But that's not the bar is it?

For me it’s always either  
\- implementation is subtly wrong  
\- it stops just short of solving the actual problem  
\- it found a workaround instead of fixing the underlying issue  
\- it follow the plan superficially while missing important implications

Very rarely do I give it a non superficial coding task and get back an implementation I’d actually want to keep.

It feels like GitHub copilot circa 2024

I work in fairly large codebases and changes tend to cross multiple architectural layers… but I kinda feel like that’s just normal software engineering? Maybe it’s not what people mean when they say Luna handles 90% of their coding. I feel like I may be missing something obvious here.

For context I use codex rather autonomously. I'll plan for a feature/refactor for a while via chat at first. I’ll then either create a plan, typically a persistent plan broken down in smaller slices of work, if the work is involved enough to require it, or a basic codex plan otherwise. Then I’ll review and adjust the plan. Then I'll typically set a goal and launch a self validating loop of some sort. Giving codex the ability to confirm whether it’s own work meets the expectations functionally, architecturally, and ui-wise Then I'll usually launch a coordinator agent and instruct it to parallelize tasks as possible (I generally have some sort of DAG figured out).

One task might run autonomously for anywhere from 2-18 hours depending on complexity..

For people who swear by Luna: **what are you actually giving it?**

Are we talking small, tightly scoped changes where the architecture where the solution are already decided?

Or are people genuinely handing it involved features/refactors and getting good implementations?

Every time I try to “save tokens” with Luna I end up wishing I’d just used Sol from the beginning. Except Sol absolutely devours weekly allowances… and also has a tendency to over engineer.

Because of this, my current go to for long running tasks is Claude. Generally Opus 5 seems like the sweet spot. It’s rather accurate and  it doesn’t over engineer. Limits are generousI, it can run for 12h for maybe 10-15% of my weekly allowance, including parallelized work using sub agents/teams. An equivalent session in Codex consumes \~40%+ of my weekly allowance in Sol.

So I’d love to figure out how y’all are saving usage with Luna.

— **somuchecho** · 102 points · 2026-08-27 08:44:06

---

> **laxika** · 42 points · 2026-08-27 09:02:32
> I do not use it for 
> any remotely complex coding tasks. Only for quite trivial ones. I have a lot of those.

> > **CryinHeronMMerica** · 5 points · 2026-08-27 18:34:32
> > Center that div!

> **Right_Simple_6813** · 32 points · 2026-08-27 09:02:32
> Pretty much what you said. Small, tightly scoped changes where everything is already decided.

> **Cute-Air2742** · 29 points · 2026-08-27 09:11:23
> For me, Luna is great model for general work. It's reliable, cheap and consistent. The higher ones tend to overthink. Plan using higher models, then get Luna to implement

> > **buttfarts7** · 13 points · 2026-08-27 11:26:25
> > Luna with a tight contract is an excellent builder.  Its only inadequate if you need it to resolve ambiguities while it implements.
> > 
> > Give it coherent well scoped instructions and its great

> > > **ElNeuroquila** · 4 points · 2026-08-27 15:29:48
> > > this right here. the (single) contract is the issue or solution depending on one views things.   
> > >   
> > > I experimented with "chorus" and the constant back and forth between reviewer and luna made things ... completely unreliable. Luna requires a task and that task must be fenced and tightly designed. then you let it write code, then you review and let it code again with a new contract - my mistake was being foolish to think that it could work in the context it had but no - that's not what luna is made for and this cost me a looot of tokens and my own skills to fix.... 

> **Schneeflocke667** · 16 points · 2026-08-27 09:02:31
> Luna is great and does the majority of my coding.
> 
> My projects are documented well with an index page full of techdoc and resesearch links.
> 
> Its linked to github where it can review the branches and changes.
> 
> I have a good structure of epics, inside an epic are user stories.
> 
> Each user Story has tasks that can be marked a done.
> 
> Sol wrote them with me in conjunction in Detail. Luna has the job to first plan then implement a story. Every task thats done must be marked. Sol is doing a code review, the 2 or 3 findings are done by luna again. You must be precice and know what you want.
> 
> And I only need Luna High for 90% of the work that way.
> 
> Of course there are lots of unit tests, workflow tests and integreation test it must pass.

> > **PracticalStack** · 2 points · 2026-08-27 14:58:32
> > This is how I use it as well.  Luna does make a few bugs but it's worth it, imo.  I plan with SOL, code with Luna and usually bug-fix with SOL.  

> **YourAsphyxia** · 8 points · 2026-08-27 09:16:26
> I'm writing embedded hardware firmware with only Luna max, never had a problem.

> > **somuchecho** · 1 points · 2026-08-27 19:24:27
> > What are you writing? C? Maybe it's better at older stacks because it has more training data

> **ResponsibleTruck4717** · 7 points · 2026-08-27 09:11:32
> you need to be very specific with luna, strict scope, exactly what to do.

> **Historical_Ad_481** · 7 points · 2026-08-27 10:17:20
> I don’t trust it to make decisions for itself. The implementation plan basically is: stick this piece of code here etc. the plan is at a level of detail where it can’t possibly fck it up. I use Sol at various stages of the plan to adversarially review and ensure it stays on track.
> 
> And that’s in a 700K LOC Rust codebase.
> 
> Try this.
> 
> Use superpowers plugin skills brainstorming and then writing-plans for spec and planning. I always adversially review both spec and plan before they are committed. Then switch to Luna to implement.

> **Late_Appointment425** · 3 points · 2026-08-27 12:33:12
> Luna is lunatic 🤣. Has to be the top 10 opening lines in this sub's history 

> > **somuchecho** · 2 points · 2026-08-27 18:05:20
> > Haha thanks I thought it had a nice ring to it 😄

> **cuberhino** · 10 points · 2026-08-27 08:59:24
> The model is only as good as its orchestration. I use Luna max for 99% of tasks 

> > **somuchecho** · 4 points · 2026-08-27 09:30:58
> > Would love for you to expand on how you've gotten success with it. What kind of orchestration are you referring to? What are the most impactful things you implemented to make this work well, etc 

> > **Bananenklaus** · 2 points · 2026-08-27 10:05:26
> > but what's the usecase here
> > 
> > using Luna for 99% of SaaS frontend development is a different ballpark than using Luna fpr 99% of c++ backend code

> > > **ValenciaTangerine** · 7 points · 2026-08-27 10:32:07
> > > This is what most people miss. It doesnt work very well for something that isnt basic scripting or a ts/js or python CRUD app. 
> > > 
> > > I tried the recommended approaches on a large rust codebase and it set me back weeks. Maybe a skill issue on my part but no amount of detail spec saves it. It get it 50% of the time and can go to 80-90% with multiple attempts/ code reviews. But at this point the 90% cheaper argument goes through the door.

> > > > **Bananenklaus** · 6 points · 2026-08-27 10:53:48
> > > > yeah i feel exactly the same and my stack isn't even as complex as yours (java springboot with htmx). I mean yeah, it's serviceable but i wouldn't ever trust it to do anything other than implementing very detailed instructions in very small chunks.
> > > > 
> > > > Most People that do 99% of their work with Luna gotta be either pure SaaSlopers or have no clue about Architecture and Security at all, change my mind.
> > > > 
> > > > 

> > > > **cuberhino** · 2 points · 2026-08-27 10:43:48
> > > > Try orchestrating your project in chatpro on pro/xhigh, then using Luna max as your implementation lane. Can even split sections of your project into as many sub orchestrated tasks as possible. 

> > > > **Huge-Turnover-3749** · 2 points · 2026-08-27 11:41:52
> > > > If there is an issue with Luna, I doubt it is dependent on language or type of application. I've produced lots of Rust code with Luna that works perfectly fine. I'm more inclined to think it is dependent on the "large codebase" part of your scenario - Luna conceivably is worse at estimating when it has a good enough understanding of the codebase to begin modifying or adding to it.

> **stopstopstoptopopp** · 4 points · 2026-08-27 08:51:39
> It’s good for non complex tasks only. 

> **JonaOnRed** · 2 points · 2026-08-27 09:28:36
> 2-18 hours? In my experience that's the issue
> 
> I'm still of the belief that fast tight iterations are provide better results - like in the good old days when we used to code by hand. My tasks will generally run an hour *at most* and event that's quite rare. Usually it's more like 5-15 minutes. Sol high/low that spins up subagents and then watches over them. 
> 
> I also plan, and for bigger plans I break things up to smaller phases. Works really well for me

> **Zealousideal-Alps-71** · 2 points · 2026-08-27 09:32:54
> You are right, I also wouldn't dare to let Luna do any big changes to my code. I am using Luna Max for running research, executing cli / tasks that not involve much coding small config changes that can easily be reviewed for that its perfect and cheap. Minimum for me is Sol Medium for changes and Sol xhigh or max for developing new apps.

> **lyfelager** · 2 points · 2026-08-27 09:33:53
> When writing refactorings I have Sol plan and specify the task and recommend whether the task is more suitable for Terra or Luna; handing the impl to Luna for straightforward tasks.  Similar for unit tests. 

> **Sleepywalker69** · 2 points · 2026-08-27 10:24:42
> I don't use it for coding, I use it for multi-agent inspection/project research

> **AweVR** · 2 points · 2026-08-27 10:34:46
> You have to think of Luna Max as a programmer who has put a lot of cocaine, caffeine and benzodiazepines into it at the same time even though he is very good at programming. Sol you use it to create a work plan very divided into efficient tasks, and then you put Luna Max to leave life in it.

> **Ok_ninysheedle** · 2 points · 2026-08-27 11:06:29
> the people who say it's good have never had a frontier model examine the work lol

> **Substantial_Hat2149** · 2 points · 2026-08-27 12:13:49
> Ahh this wall of text. I understand the pain behind this user 

> **EyesOfAzula** · 2 points · 2026-08-27 14:57:03
> If you have a smarter model like GPT 5.6 Sol, have it use luna subagents and then adversarial review of what luna does.
> 
> That way Sol writes the very specific prompts for Luna instead of you.

> **Frusch** · 2 points · 2026-08-27 17:09:19
> Had identical thoughts to this lately. Designed a moderately complex feature at work. Gave my first pass design to Sol to hammer out some kinks. Eventually used subagent-driven-development to implement the whole body of work. Got halfway through reading the first file in the PR before I had to go back and have Sol refactor everything. 
> 
> Working in Go and the thing wrote three separate generator functions for the same struct all right next to each other... Literally three separate functions that take the same exact arguments and return an instance of the same struct, one after the other in the same file. 
> 
> Mind-blowing stuff.

> **orblabs** · 2 points · 2026-08-27 17:29:49
> Similar experience. I thought it was a good model at first, it apparently did the work, tests would pass, it was cheap, leaned heavily into it. Then problems started showing up and after a deeper analysis it turns out it cheats, hallucinates and makes up stuff a lot, in very scoped tasks it would work on the wrong files under absurd assumptions etc. Incredibly the tasks it turns out it failed hard where the same that DS4 flash would complete with absolutely no issues.  It got me because i simply couldn't believe it could be so bad in 2026 from such a big company. 

> **23eriben2** · 2 points · 2026-08-27 19:07:25
> I think it's fine for me I use it very differently than some
> 
> 
> Here is what I said in another post:
> 
> 
> 200mo user here.
> 
> I typically do use sol ultra but not a single one of the subagents is sol.
> 
> Luna Max for high reasoning tasks with terra high doing everything tool related so Luna doesn't suffer that 3 minute penalty for tool calling and I have Luna actually do all the coding
> 
> Sol will review terra and Luna's work and maybe occasionally do stuff but that's pretty nuch it
> 
> Sol ultra: planning and review and occasional fixes
> 
> Terra high: speed and tool usage for Luna
> 
> Luna max: actual coding
> 
> Typically 1 terra and 2 Luna
> 
> So yes even I agree even on my current plan I'm not just throwing sol max reasoning at everything
> 
> Another note I do use the gpt daybreak blue for cyber security and even that is just the same place as sol in the flow with terra and Luna still with their roles

> **Tiny-Design4701** · 2 points · 2026-08-27 21:07:14
> Luna is worse than sol by far, but its usually "good enough"
> 
> - can answer basic questions about codebase for dirt cheap and fast.
> 
> - can implement simple and well defined tasks for cheap
> 
> I also use it as a chatbot for my complex reporting application, it can write sql to access a limited set of read only views allowing users to  receive custom reports. With proper system prompt its doing really well.
> 
> I use sol medium as my main driver because my apps are complex,  but Luna high is really good for simple stuff

> **Proxiconn** · 6 points · 2026-08-27 08:52:38
> The open ai release notes for gpt5.6 only lists terra and sol for coding. 
> 
> Luna is ret@rded yes I agree, it feels like a slightly better gpt-5-mini which was useless. 
> 
> Luna is okay as sub agents for mundane task distribution provided that the main orchestration model created the discovery planning and handoff for Luna. 
> 
> I never use Luna for anything, I use sol for planning and Terra for implementation on my ever growing codebase. 
> 
> I tried to use Luna for infra tasks like managing my home lab proxmox cluster and it kept screwing things up, I only use terra+ now for this not Luna. 
> 
> Not really found a use case I can trust Luna with, maybe document summerizing and writing but that taking that is screwed up all other areas I tested it I'm not sure I trust it for document writing either.

> **No_Vermicelli_3574** · 5 points · 2026-08-27 08:50:21
> And your sol auditing tools aren't able to detect the faulty code for re implementation? I haven't had the problem, but I'm just making kids games rather than anything truly complex 

> > **somuchecho** · 10 points · 2026-08-27 08:53:53
> > Yea eventually Sol will catch the errors but then it ends up spending so much of it's time asking Luna for corrections that it's more cost-efficient to ask Sol to write the code in the first place

> > > **daddywookie** · 3 points · 2026-08-27 09:05:45
> > > I had some success with allowing the Sol reviewer to make small quick fixes itself. Anything larger goes back to Luna with a clear fix plan. If it still isn’t working after two loops it comes back to me via the orchestrator to make a decision on where to go next.
> > > 
> > > At the moment though, Sol is passing more to Terra Medium and it appears to be working better. Luna is in reserve for simpler admin tasks.

> > > **No_Vermicelli_3574** · 6 points · 2026-08-27 08:57:12
> > > I have very much not found what you said to be true, with token consumption 3-5x in some cases 

> > > > **somuchecho** · 3 points · 2026-08-27 09:08:48
> > > > Fair. I haven't measured this in any empirical way I'm just telling you how it feels. But it's also the mental burden of knowing that for every so many changes Sol finds some important issues. The next question is what did Sol miss.
> > > > 
> > > > I've had to throw away a few implementations from Sol/Luna pair, because it was just cognitively easier to redo it the right way with Sol then to fix Luna's slop

> > > > **laxika** · 3 points · 2026-08-27 09:03:49
> > > > Yes, this. It might work well for 90% of the cases, so Sol only needs to fix the 10% that actually fails.

> > > **Professional_Gur8385** · 1 points · 2026-08-27 10:37:28
> > > 100% this
> > > 
> > > I used to juggle between the two but now I just ask the model to tell me when to switch to luna for the final tasks/implementation, ie it has the plan, orchestration and most of the code done and luna can finish it off
> > > 
> > > if you do 95% with luna, you'll be rewriting it again anyway
> > > 
> > > there are some specific workloads which you can hand off to Luna, find out what they are and save all those tasks in a handover.md
> > > 
> > > do you work with sol or whatever model of your choosing and then finish off with the handover.md and luna high overnight, works wonders

> > **Bananer_spleet** · 2 points · 2026-08-27 09:00:27
> > It catches most, but not all.

> > > **somuchecho** · 2 points · 2026-08-27 09:09:22
> > > This, exactly 

> **Keep-Darwin-Going** · 2 points · 2026-08-27 08:56:51
> Luna is a “dumber” model means it does not know all the stuff in the world. But when it come to coding it does not have any issue. People who can use Luna probably are giving very specific instruction and not being vague in the requirement, sol is great at understanding vague requirement thus the plan with sol write with Luna. But the saving is crap if your requirements is simple or short. 

> **andreagrandi** · 2 points · 2026-08-27 09:14:29
> Using Sol for everything is like hiring 10 engineers to build a house instead of 1 engineer and 10 construction workers 

> > **Tiny-Design4701** · 1 points · 2026-08-27 21:18:23
> > Pretty good analogy when you consider how low quality most homes built by construction workers are.
> > 
> > Sol creates a good plan, then luna botches the implementation.

> **idkwtftbhmeh** · 1 points · 2026-08-27 08:51:49
> are you on max?

> **Spiritedbong** · 1 points · 2026-08-27 09:02:20
> Luna is perfectly fine for simple, well-defined tasks, but it falls apart pretty hard once you get into stuff like this. Sol is a completely different beast.
> 
> So yeah, it's not surprising that Luna tends to produce lower-quality code, miss subtle issues, or come up with implementations that technically work but aren't really the right way to do it.
> 
> 1. Keeping track of obscure API quirks and library behavior
> 
> 2. Recognizing patterns across a large amount of code
> 
> 3. Telling good design patterns from anti-patterns
> 
> 4. Recognizing rare or non-obvious bug patterns
> 
> 5. Keeping multiple constraints in mind at the same time
> 
> 6. Working through dozens of possible causes and narrowing them down to the most likely one
> 
> 7. Judging whether a change makes sense for the system as a whole, rather than just whether the local code looks correct
> 
> 

> **dwayne___** · 1 points · 2026-08-27 09:25:17
> I would say your biggest mistake is leaving it to run autonomously. If you want the best outcomes, oversea the work as it progress. Nothing beats a good human verification in the loop. That’s how I get the best results. 
> 
> Leaving things to interpretation will always result in some variations or undesired outcomes. Best to keep a finger on the pulse. 

> **Intelligent_Ant_608** · 1 points · 2026-08-27 09:51:06
> In same category currently glm 5.3 flash and dsf vision are vastly better

> **arelath** · 1 points · 2026-08-27 09:53:32
> I rarely use Luna for coding. Luna is used for code searches and general code research, building, running tests and a general tasks without coding.
> 
> Sol or Opus 5 are the code architects. Sol does the implementation. For code review of the change, Sol does a great job. Luna isn't good at code reviews, but it's good enough to catch obvious mistakes. So I use Luna for an initial code review pass, then run sol if I think it might have a big effect on the final outcome.
> 
> Overall, this saves a ton of tokens with pretty much no drop in quality.

> **PhilosophyforOne** · 1 points · 2026-08-27 09:59:51
> Yeah. I’ve tried Luna a bunch of times and always find it so error-prone that it’s nigh-unusable for most stuff.
> 
> I guess if you’re making tight, scoped and constrained changes it can be good, but..

> **Novel_Law4469** · 1 points · 2026-08-27 10:09:11
> Luna Max ? 
> 
> cos if its Luna Low, then please close this thread.
> 
> But yes, to some extent i'm agreeing with you...even Luna Max has been misbehaving for a couple weeks now. But then again, so were Sol and Terra too. Last 2 weeks have been horribly bad with Codex.

> > **somuchecho** · 1 points · 2026-08-27 18:02:21
> > Yes Luna Max. So it's also slow as an added bonus

> **ObligationHuge9868** · 1 points · 2026-08-27 11:07:46
> Build a custom skill & workflow and she'll be right on Luna.

> > **somuchecho** · 1 points · 2026-08-27 18:04:02
> > We have dozens of skills, hooks, optimized instruction files, specialized agents, etc.. that we constantly update and evolve, built specifically for our projects... she is not even close to being right on

> **Remarkable_Drama6086** · 1 points · 2026-08-27 11:31:28
> I do not use Luna before I worked out a strict plan it can follow. That means I have atomic criteria that I worked out, wrote a plan/let Sol write it and prompt is with a clear structure of how to do what and when. I do not vove code though, I always supervise every bitbthat gets coded, because otherwise it does not matter what LLM you use – you will end up with useless slop eventually.
> 
> My prompts are often ~30.000 characters long and the plans are not smaller than that with clear goals, non-goals, a scope that defined completeness and for bugs a clear reproduction path with evidence and error findings and a full analysis. The repo always has an AGENTS.md which is specificly designed for that repo, as well as README documents for more context (The prompts give the LLM more awareness of the overall structure and these documents as well).
> 
> For me Luna is able to implement everything I ask it to implement at the very first try without halluzinations, goal-oriented without any sidequests it tries to solve and an output that perfectly summarizes the reasoning flow, evaluations and validations between each implementation step.
> 
> If you vibe code: Do not use Luna to have something decent. But be aware that you will nlt be able to seriously publish your "work" as it will have horrible data security, as well as a lot of leaks and bugs. As a hobby for yourself it is fine though. But if you use any AI correctly as a tool that you guide yourself, Luna is oerfectly fine.

> **nxy7** · 1 points · 2026-08-27 11:31:42
> It's good for regular work, bad for vibe coding. 

> **PastaFartDust** · 1 points · 2026-08-27 11:34:22
> its okay at code review but new code it struggles. 

> **Even_Ask_2577** · 1 points · 2026-08-27 12:19:55
> My flow: Claude or gpt sol planning - generates scoped fix prompt with code snippets - luna cheap implementation.
> 
> Haven't encountered problems with luna yet. If anyone is at fault its the planner.
> 
> Idk if this is the most efficient way but it helps me keep track of what is going on.

> **milos201** · 1 points · 2026-08-27 12:26:44
> I asked it to commit stuff for me often, and it sometimes fails at that.
> 
> When I first tried it out it kept doing in a loop exactly what I asked you to be careful not to. So yeah, your title really hits the spot for me.

> **Syzygy___** · 1 points · 2026-08-27 12:54:39
> If I give luna two tasks, it only finishes one of them. So I only give it one task at a time.

> **sickfar** · 1 points · 2026-08-27 12:58:29
> Review cycle. I have 8 dimensions in my cycle - correctness, testability, performance and more and more. I have a rule to run review-fix cycle until there are no crits and warns in result (or 15 times max).  
> So I just let Luna do its bullshit overnight, review will catch it. For review I use pi with free models (used ox alpha while it lasted, now nemotron), sometimes switch to deepseek or sol. Trust me, after 15 rounds of automated review from more capable model, the quality is outstanding, the price is cheap. The only thing here is time, but I just sleep, enjoy time with family, etc.

> **Broccolisha** · 1 points · 2026-08-27 13:05:05
> I am coding in a large code base too, and Luna and Terra will consistently fail when I need to make changes that implicate multiple interacting systems. Even when I tightly scope their work, their own audits will fail because they’ll falsely flag their task as solved or complete when they’re not. Switching to Sol Medium or High becomes necessary in those situations. It all comes down to the complexity of the task and the precision of the code that you need. If you just need something to work, Luna and Terra can complete the task, but if other systems, or performance, rely on that work being “correct” and rigorous, don’t reach for those models.

> **spoupervisor** · 1 points · 2026-08-27 14:02:44
> When you're reviewing or adjusting the plan, do you have a skill that \*explicitly\* audits it from the perspective of what a cheap/low reasoning model can do? 
> 
> I have a pretty strict review cycle that looks for gaps and errors and potential security issues, etc. It won't present the plan for me to review until after it passes through this. This loop is updated whenever I run into consistent patterns. 
> 
> It takes awhile. 
> 
> Then, once I approve the plan, I have a skill system that splits the plan into discrete tasks. The PRDs are structures in a way that 90% of what you see below can be processed deterministically (Python/rust) with only the wiring requiring agents. I say this to say that the plans being structured help a LOT.
> 
> These tasks are designed with the idea that a small agent needs to complete them within a single context window. If it is larger or more complex than that, it splits them into smaller tasks. Included are strict boundaries and instructions to use Test Driven Development. 
> 
> Then the system looks at tasks and orders them. It creates dependency lists so that it never has 2 agents touching the same file (or ones that interact) at the same time. I use parallel streams, but only if it's safe to do so. Finally, it wires in review loops and code gates where I have specific skills trigger after X number of code edits or if I am touching something important (for example, anything that touches an API key triggers a specific security skill to look for how it handles it). 
> 
> This task list is then handed off to my job system (I have something I made here, but used this process back when it was just creating \[plan name\]\_tasks.md. The orchestrator is pointed at that file and told to execute. 
> 
> The orchestrator just has to send out new tasks and mark the completed ones complete. It sends out the review agents when they have to go. And it processes. 
> 
> The execute agent is Luna. 
> 
> If A review agent finds an issue, it's added to the task list using the same skill building loop. and then orchestrator continues.
> 
> Luna is so cheap that adding in review loops is trivial and even when you do call in the big boys (Sol on a security audit for example) it's a fraction of the spend it would cost if you had sol running. And importantly: The review loop would make sol code better anyway too, because it's the process and harness that drive quality for agents of this level.

> **projct** · 1 points · 2026-08-27 14:18:22
> I've used it to build real, fast, complex software.  
> \- a high speed network app proxy that is way faster than it's competitors with more features and instrumentation etc.  
> \- improvements to complex existing software including ones that parse and transform ASTs, that millions of people interact with daily.  
> \- embedded devices that people ride.
> 
> and a lot more I didn't list.
> 
> you need to give it much clearer instructions and a feedback loop with extremely good tests, guardrails that make most problems a compilation error, etc.
> 
> clearer means: more specificity, less scope, easily verified by running some code or a test harness, etc. pass/fail must obvious and trivially testable.many many many tiny units of work.
> 
> encode your invariants in the type system.  
> make it refactor multiple times as part of the solution to every prompt.  give it an issue tracker that you hand review regularly. it always needs a way to actually verify the acceptance criteria programmatically.
> 
> if it can't verify acceptance programmatically bc it needs an external service or something, go build a simulator of that service it can talk to.
> 
> just like all other programming: it's a discipline. it's a tool. find the limitations, engineer around them.

> **Kind_Silver_1921** · 1 points · 2026-08-27 14:30:44
> I don't trust anything for real work.
> 
> Yesterday my Sol Extra high re-launched 40x Terra Medium agents randomly that had previously finished a project I was working on before. The agents sat there thinking for an hour and wasted 10% of my weekly usage without me knowing.
> 
> I was so mad

> **cs_cast_away_boi** · 1 points · 2026-08-27 14:35:15
> it’s gotten dumber since the price drop. Told literally everyone this would happen and they called me a conspiracy theorist. The thread I made about it was that same day

> **P1zz4-T0nn0** · 1 points · 2026-08-27 14:37:28
> I just use it as a subagent for trivial and well defined implementation or code discovery. That works quite well. Max effort of course. Sol orchestrates and validates the output.

> **ChallengeTiny874** · 1 points · 2026-08-27 15:13:55
> I  use it as a coordinator. I let it call sol low for any coding work, and then go through sol high to review. luna handles the back and forth.

> **PineappleLemur** · 1 points · 2026-08-27 15:31:12
> You use sol to plan a very detailed and organized plan. Then you make it bite sized (phases) and get Luna to implement.

> **Latter-Block132** · 1 points · 2026-08-27 16:23:33
> I create a very detailed plan, break everything down into easy to manage bite size chunks, ensure luna doesn't have to make any assumptions, choices or guesses for anything. Ensure its scope is limited and explained clearly. Ensure the files its supposed to be working in is explained and listed clearly for every bite sized step. Ensure it has strict passing requirements for every bite sized step. I provide strict engineering rules so it knows it knows my expectations in that regard. I also have a task Ledger that luna updates when its done. 
> 
> Then once luna is done with every bite sized chunk, I have Terra on high review its work. Terra checks against the ledger to see what luna said it did, then checks against the original plan doc to ensure nothing in the original doc was missed. Then I have Terra do a bunch of tests. I use the skil that has TDD so it automatically performs the red/green tests, adversial testing ect, but i also list specific functionality tests that must be run before the chunk can be considered passed. Once terra is done it updates the ledger as well, and produces a report for luna. Luna fixes whatever issues are present then Terra reviews again. And I ensure terra has a strict breakdown of how to decide what needs to be fixed, so its not just finding everything it possibly can. This way I ensure it doesn't sit there for hours spinning in circles finding and fixing unlikely edge case scenarios like it will do if you dont give it clear boundaries. 
> 
> Then when Terra approves the chunk, I have sol light perform a final review/verification against the docs, another round of quality gates, etc. before dispatching the agents for the next chunk. I also switch chats frequently to prevent context drift

> **Unapologetic_Polite** · 1 points · 2026-08-27 16:28:32
> Why are you using Luna for complex coding tasks?
> 
> I use Sol as an orchestrator - It takes Lunas work, and finds problems with it, sends it back, and tada.
> 
> The code is also cleaner, and a lot easier to read when it comes from Luna versus Sol.

> **Creepy-Doughnut-5054** · 1 points · 2026-08-27 16:33:19
> skill issue
> 
> 

> **soggy_mattress** · 1 points · 2026-08-27 17:03:21
> People use shitty models all the time and tell me they're getting "real work" done. I just don't believe them usually, or figure their tolerance for garbage is a lot higher than my own.

> **ExoneratedPhoenix** · 1 points · 2026-08-27 17:08:04
> Firstly, Sol thinks very well, always make a plan/architecture documents with Sol and instruct it to make sure everything is modular. Make sure every part of the repo sticks in its own lane.
> 
> Luna is then used iteratively, i.e. give it 1-2-3 tasks, tell it to look at the reference architecture, and ensure it doesn't spaghettifi the code, it will do this. Then give it the next 1-2-3 tasks.
> 
> If you give a model like Luna Low "now make the whole repo for this entire software from scratch" of course it will fail...
> 
>   
> Entire repo start to finish - Sol needed, and it will EAT compute.
> 
> Modular parts and getting the agent to do step by step with documents to keep it true - Luna/Terra Medium.
> 
> 

> **VictorBuildsDev** · 1 points · 2026-08-27 17:14:23
> I think "90% of my coding" is often a task-count claim, not a complexity or value claim. A repo can have dozens of cheap leaf changes around one architectural decision; Luna may do most of the patches while a stronger model does the small number of decisions that determine whether they are right.
> 
>   
> I'd route by acceptance surface, not by size: use Luna when the contract is explicit, the blast radius is local, tests are decisive, and rollback is cheap. Escalate when requirements are ambiguous, changes cross architectural boundaries, or review requires reconstructing intent. Then measure accepted patches without rework, not tasks attempted. If Luna needs repeated rescue, it did not save usage - it only moved the cost into review and repair.

> **IndependenceSudden47** · 1 points · 2026-08-27 17:41:51
> If you guide it well, it perform extremly well at executing a plan even on large scale project and big task. The issue is when you use luna to execute and do the plan.

> **FinancialBandicoot75** · 1 points · 2026-08-27 17:42:14
> Luna has been amazing, coding, home server changes (yes, I love it) and common stuff
> 
> There is a prerequisite for using it effectively, planning.  I use sol, opus or Fable to plan it, but not a simple plan, but a required completion.  Using this process, it makes sure there is a completed process.  Once it completes, I use opus, sol, or Fable to validate.
> 
> If you are using Terra or Luna for one-shots or actual tasks without a plan, it’s useless.
> 
> Think of it as if you hand work to a junior or entry level developer, with a precise plan, they are coding junkies, if you tell them, make a website, they will look at you like they have bad gas or flip you off.

> **MastodonCurious4347** · 1 points · 2026-08-27 17:55:32
> I use sol max without agents. Way more disciplined provided you don't expect it to read your mind.

> **megad00die** · 1 points · 2026-08-27 18:00:45
> Testing, HTML 5 and documentation that’s all I ever use it for. 

> **mrdarknezz1** · 1 points · 2026-08-27 18:07:39
> Yeah I just use it for small tasks. Big tasks get sol or Claude 

> **leonbollerup** · 1 points · 2026-08-27 18:15:52
> We don’t 

> **korino11** · 1 points · 2026-08-27 18:17:56
> One word dude - Orchestration!

> **ChaosCCUM** · 1 points · 2026-08-27 18:24:23
> I asked luna once to put a toggle to switch some plots for linear to log(x) (you could change the x) and what ot ended up doing is shrinking the 3 plots 10% each time tou clicked the tick box.

> **zarafff69** · 1 points · 2026-08-27 18:26:01
> Or probably also depends on your project / task. 
> 
> If you want to create an entirely new project from scratch; that’s pretty hard, and the AI has a lot more freedom to do dumb shit.
> 
> But if you already have a good project, with good tests, good code, good structure, good documentation, etc. And the task is not super big, then simpler models can get the job done, by just following the existing structure. 

> **Aromatic-Educator105** · 1 points · 2026-08-27 18:37:07
> In my experience you need Sol to scan and figure out logical linkage across different parts of repo or multiple repos, then have Sol giving explicit pointers to Luna how these are tied and what you want to achieve. Sol also needs to check the work (not full code review which costs too much token, just for completeness and high level accuracy). It has worked for me quite well so far

> **ManagementKey1338** · 1 points · 2026-08-27 18:40:03
> What do you expect? The model is named Luna

> **malcxxlm** · 1 points · 2026-08-27 19:47:54
> For me, Luna is great for using tools, searching stuff, and answering quickly. It can be used orchestrated by a bigger model for small tasks, but I don’t think I’d give it complex multi-step tasks 

> **-LightHeaven-** · 1 points · 2026-08-27 20:24:51
> My experience with Luna and Terra were pretty bad right of the bat too. Sol was amazing, but it's been around 3 weeks since it started "I'll just ignore everything you tell me and make up my own rules" mode.
> 
>   
> So I'm actually back to 5.5. After 3 weeks without doing any real progress because all the work as going towards fighting the model, I was able to push over 15 PRs this week, and went back to the throttling of my workflow being my capacity to review the work

> **ninernetneepneep** · 1 points · 2026-08-27 20:36:16
> THANK YOU.  I thought I might be crazy.  Glad I'm not alone.  Never realized my work was more complicated than the average bear.

> **Owdez** · 1 points · 2026-08-27 21:35:50
> give it a smaller task each time and it will get it done perfectly on max reasoning level 

> **InviteQueasy3739** · 1 points · 2026-08-27 22:25:02
> I like to use Luna to complain about Sol's execution, verifying whether the implementation complies with the specification.
> 
> If I want to use Luna for an implementation, I simply guide it with specific instructions.

> **not420guilty** · 1 points · 2026-08-27 22:28:57
> Smaller scope prompts.  Tell it exactly what you want 

> > > **cuberhino** · 1 points · 2026-08-27 10:46:20
> > > Any use case, try orchestrating in chatpro, using Luna as implementer. Possibly a reset tomorrow tho so burning in sol max over night 

> > > > **Bananenklaus** · 1 points · 2026-08-27 10:49:58
> > > > No, i'm asking you specifically. What's the techstack that you personally have success with with luna.
> > > > 
> > > > 

> > > > > **cuberhino** · 1 points · 2026-08-27 10:53:08
> > > > > Have built 5 apps now on rust for private use. A plex replacement, Spotify replacement, agentic harness aka codex replacement, a 3d model optimizer and configurator, a local finance app, a dev workplane for these apps as well. All done within my first month of codex 200 plan, all done within this orchestration technique. Technically it’s not just Luna, it’s strong reasoning from chatpro. I also use Luna Max on my Hermes agent as a research tool as well which it’s freaking fantastic at with 900k context. Great for repo review 

> > > > > > **somuchecho** · 1 points · 2026-08-27 17:58:38
> > > > > > I think you’re actually highlighting the difference here. I might be assuming too much, but it sounds like you don’t build software professionally? Have you shipped software to paying customers using a similar approach?
> > > > > > 
> > > > > > If you're working exclusively on your own apps/projects, then yeah… it makes more sense. The cost of something breaking is basically you having to go fix it.
> > > > > > 
> > > > > > I work on enterprise software. There can literally be millions of dollars on the line, plus my reputation as an engineer. “It works now and if it breaks I’ll fix it” isn’t really an acceptable standard.
> > > > > > 
> > > > > > We have to build the happy paths but the challenge lies in thinking through the not-so-happy paths before they happen. How does this interact with the rest of the system, what happens under weird conditions, what assumptions are we introducing, will this still make sense 2 years from now, etc.
> > > > > > 
> > > > > > And that’s kinda my issue with Luna. It’ll very often produce something that *works*. That’s not the same thing as producing software I’d be comfortable shipping

> > > > > **cuberhino** · 1 points · 2026-08-27 10:55:17
> > > > > I want to be clear, I have no idea if it will work with your specific workflow. But use codexradar en, plug that into your orchestrator data, have it auto select and optimize tasks Luna can work against. It’s drastically cheaper than SOL, 10+ passes of Luna are still cheaper than 1 pass of sol xhigh

> > > > **ValenciaTangerine** · 1 points · 2026-08-27 11:04:53
> > > > Ive done all that. I have a skill that can review plans with the web chatgpt 5.6 sol pro. Run it between sol pro and fable 5 multi turn with very well defined spec/acceptance criteria. 
> > > > 
> > > > My codebase is also large. From your comment it seems youve done 5projects in 1 month. So not sure the size and interdependcy etc. It could be that. 
> > > > 
> > > > Ive built a few basic rust/go helper clis. greenfield projects and luna xhigh is pretty good at it. 

> > > > > **cuberhino** · 1 points · 2026-08-27 12:56:15
> > > > > Send 10 passes of Luna max over your project to help compartmentalize any of the code, to find any issues maybe. seems you probably have way more dev experience than me. I’m only a web designer for the past decade or so and only in the past 6 months started messing with ai coding. I think Luna on max is my favorite model so far. It reminds me of when I used to do Claude opus planning and sonnet implementation a few cycles ago. I’m really surprised at what it’s capable of 

> > > **cuberhino** · 1 points · 2026-08-27 10:47:58
> > > Orchestrate in chatpro on xhigh or pro, even instant I’ve orchestrated whole builds with. Or you can use Claude for your orchestration if you have both. Then use Luna max as your implementation lanes. I’ve done up to 20 Luna max lanes overnight with minimal burn if orchestration is on point. Less model thinking if good guide is in place. Don’t let it think too much 

> > > **Ok_ninysheedle** · 1 points · 2026-08-27 11:07:28
> > > this

> > > **Expensive_East_6762** · 1 points · 2026-08-27 18:34:37
> > > Would you say terra is terrific then? 😆

> > > **Necessary_Pudding454** · 1 points · 2026-08-27 18:39:29
> > > I got plan prompt to specifically make all the major decisions during planning phase 

> > > **Techngro** · 1 points · 2026-08-27 19:29:41
> > > I do the same. I do my planning with ChatGPT web and Claude Web. Once I have a plan. Then I make sure that the prompt has agent routing and tells whatever agent I'm using to have the cheaper model do the implementation (e.g. Luna Max) and the more expensive model to only do planning/review (e.g. Sol Xhigh). And I use a loop workflow. The orchestrator (usually Luna Max) begins the task by reading the prompt/plan and then calling the implementation subagent, once that agent is done, the orchestrator calls the review subagent, once that is done, and if there are changes/fixes required, the orchestrator calls the implementation agent again to remediate, and so on until the task is complete and fully passes review. I allow it to do 3-5 reviw passes before stopping if it hasn't completed the task.
> > > 
> > > I find it to be a really efficient way of completing tasks. And not having to use Sol for everything saves tokens. Last might my agent spent about 3 hours on one complex task and it only used about 10% of my usage limit. 

> > > > > **cuberhino** · 1 points · 2026-08-27 13:01:16
> > > > > Yeah I would never use it alone to understand a large repo in a single pass. But what I’ve found it excels at is multi pass. I’ve been linting about 1 year of ChatGPT communications with it(about 2tb of chats, projects, business interactions) from an export. Each pass I’ve been learning more and more about its capabilities and how to graph out large chunks of data. I think I’m on about pass 7 by now. I’m sure it’s missing stuff but on the 200 sub I can run Luna max agents all night with minimal burn on research and review tasks.
> > > > > 
> > > > > It also runs my Hermes brain that helps review and ingest Reddit and other social media content I consume to surface research artifacts in a loop. It’s basically free I ran 12 instances the other night and only consumed 1% of my weekly. As I give it more and more capability in slowly letting it do more and more complicated tasks, all while reviewing it with SOL xhigh and ChatGPT pro in a triad

> **alexanderbeatson** · 1 points · 2026-08-27 09:11:16
> No. I don’t trust it at all. Both luna and terra are worse than DS4F in my serious use cases (HIPAA, and hypervisor) totally unusable even when Sol go through implementation steps. 
> 
> Sol is on par with Qwen 3.8 max and good for both planning and implementation, but my poor ass can’t afford. 
> 
> Use Luna(tic) for side projects, DS4F for serious projects for me. 

> **Funny-Blueberry-2630** · 1 points · 2026-08-27 14:24:57
> not reading all that. nobody trusts it.

> > **somuchecho** · 1 points · 2026-08-27 09:02:27
> > Ahh that makes sense. Good to know I’m not crazy lol What effort level have you found is the sweet spot using Terra ?

> > > **Proxiconn** · 2 points · 2026-08-27 10:20:43
> > > Depends on the use case. 
> > > 
> > > For boilerplating medium-high works fine for what I do (c#, backend, API and some frontend)
> > > 
> > > But for complex implementations high-extrahigh with planning & handoff from sol (distributed cluster sharding, time sensative grpc between systems)
> > > 
> > > I would have really liked to have Luna swarms implementing stuff all over the show as lower cost driven by terra or sol. But. Luna is not that model. 

> > **Tank_Gloomy** · 1 points · 2026-08-27 19:07:38
> > OP wrote a post, passed it through an AI to polish the writing style, realized they replied to their own question and then still posted it. 
> > 
> > Amazing. 

> > > **somuchecho** · 1 points · 2026-08-27 19:21:43
> > > Why would you assume I already have the answer lol I am still genuinely hoping that someone will give me the secret sauce to save my codex limits.
> > > 
> > > I am starting to see a pattern from the answers though..

> > > > **Tank_Gloomy** · 5 points · 2026-08-27 19:31:05
> > > > >Luna sucks at any remotely complex coding tasks for me.
> > > > 
> > > > Well, that's it. You don't use it for anything complex, you use it to answer random facts about the codebase, gather optimization opportunities, change a quick color or theme preset JSON, etc., all the stuff you could definitely do yourself (and maybe even faster) but it's not even worth your time.

> **theWiseTiger** · 0 points · 2026-08-27 09:10:21
> 1 word: harness.

> > **somuchecho** · 1 points · 2026-08-27 09:38:05
> > Harness as in the context, agents instructions, skills, hooks, etc? If that's what you mean then that's not the issue. We've put a good amount of effort in developing a solid harness for our our projects, stacks, and methodologies 

> > > **somuchecho** · 1 points · 2026-08-27 09:41:27
> > > Would love for you to expand on your harness and how it's helped though

> > > > **theWiseTiger** · 1 points · 2026-08-27 11:15:59
> > > > Looking at the votes on my first reply, everyone here is not ready for my answer. 
> > > > 
> > > > Luna as it is, difficult to use. But I found the right harness and I use exclusively Luna now. Still taking 20% quota per day, but managable.

> **xxcxcxc** · 0 points · 2026-08-27 14:06:37
> Bro if you write a spec that’s extremely detailed and a tasks file with incremental stages and test driven development and locked in guard rails Luna Extra High seems to perform the same as SOL Light. Maybe a little more remediation needed after…

> **Inevitable_Toe6648** · -3 points · 2026-08-27 09:04:35
> Most are vibecoders and dont know the bs luna spits out and oversells it to other people.

> **nouser1993** · -1 points · 2026-08-27 09:57:06
> I just use Sol Xhigh for everything. It gives me the best result without losing time with 3/4 prompts

> > **somuchecho** · 1 points · 2026-08-27 18:06:45
> > How does that work with the current limits? Do you only code one day per week? 🤔 

> > **somuchecho** · -1 points · 2026-08-27 08:54:51
> > Yes I'm on max 20x for Codex and Claude 

> > > **idkwtftbhmeh** · 5 points · 2026-08-27 09:10:58
> > > ...reasoning

> > > > **somuchecho** · 0 points · 2026-08-27 09:17:13
> > > > Ah yes max reasoning.. so it's slow as an added bonus 

> > > > > **cuberhino** · -2 points · 2026-08-27 12:58:25
> > > > > Point me in the direction of how to structure advanced architecture and security. I’ve built everything using Luna and Sol without ever inspecting a codebase. 

