# Sol 5.6 - how do you handle overengineering of SOL? [Visit](https://www.reddit.com/r/codex/comments/1w0re81/sol_56_how_do_you_handle_overengineering_of_sol/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [elCommendante](https://www.reddit.com/user/elCommendante/)

### **Vote:** 48

---

Hello guys,
Did anyone had this issue that SOL is overengineering things? How do you handle this?This model can't be left for 5 minutes alone.
I've been working (I mean SOL-medium) last two days on procedural errosion, did a full list of tasks end to end which needed to be done to make this work(very precise mathematical model, list of steps that need to be executed one after another etc etc). Also said that it needs to be done from scratch, new files everything etc. Model minced this for two days and did not do any of this. Absolutelly shocking, seems like relatively easy task to execute steb by step procedure.
I've looked at the conversation and what it did majority of time was calculating some fking SHA-265, ignoring requests of using vision (actually using it but ignoring?), mumbling about numbers, missing this incorrect that, moving sliders left and right. Instead as instructed, re-build from scratch(!) model even re-used some old files from not so well working errosion from couple of days ago, where specifically was instructed not to do so. I've stated step by step how to perform task and check debug logs and check if route of execution is actually being executed. Model also tends to jump off the instructed tasks, and forgets about the one he is on, he eventually get's back but does a lot of things that's not being asked.
I've had to turn off completely GOAL and tell him to shut up and do this, do that, and eventually in 45 minutes there was working prototype.
I don't know what to do, model doesn't follow plans, doesn't follow instructions it's over engineering things, adding unecessary steps, jumps on unrelated tasks and many others.
**How are you handling things? Maybe it's not good model to do this type of tasks, rather good for planing only? Maybe you got a trick how to handlethis, maybe I should use different model for execution. Please help.**
It's his statement I turned him off eventually, in reality that statement in full is 3x A3 pages of things that went wrong I just asked him to compact it to 10 sentences:
I failed to follow the clear instruction to rebuild Erosion from scratch.Instead, I reused old infrastructure and created a broken hybrid implementation.I overengineered buffers, routing, schedules, telemetry, and small tests before proving the full calculation worked.I ignored the required order: complete code, debug log, compile, then immediate GPU render.I did not treat the agreed plan as a strict execution sequence.I calculated and repeatedly mentioned SHA-256 hashes without being asked, even though they proved nothing about visual correctness.I mistook compilation, dispatch counts, and changed pixels for evidence that the erosion worked.An early 1500×1500 render would have immediately exposed that the pipeline flattened the terrain.I did not listen when the user repeatedly demanded a clean implementation and direct visual verification
---

## Comments 130

- by [unknown](#) **&#x21C5; 38**
  <br/> Oh my pi. Use Advisor and WATCHDOG.md to tell Sol to back off from common overengineering patterns you see.

Also not using Xhigh, Max, or Ultra effort.

- by [unknown](#) **&#x21C5; 4**
  <br/> I woke up to today having lost 35% of weekly usage on Daybreak blue on max, it made 44.000 new lines of code and I spend all day with claude trying to fix the garbage it made.Codex is great for very well aligned tasks but anything too broad you get the stuff I had just now.. it just keeps going

- by [unknown](#) **&#x21C5; 4**
  <br/> Thanks I will have a look into that. Never heard of this advisor/watchdog thing!

- by [unknown](#) **&#x21C5; 6**
  <br/> yeah its cool. It works like your agent.md, except its a secondary agent, running its own model and own context, and its ONLY task is to keep the main agent on track. So it reads everything happening (costs about 1/10 of the usage of the main agent, but you can use Terra or something to save costs if need be), and it goes "Hey main agent! The rules say not to do <overengineered pattern", fix it!. And the main agent will answer to it almost as if you had corrected it.

Since the supervisor has its own context, its a lot more accurate than the main agent trying to honor your rules on its own. Its really cool and I wish the mainstream harnesses all had that.

- by [unknown](#) **&#x21C5; 14**
  <br/> That watchdog seems like overengineering in itself.

- by [unknown](#) **&#x21C5; 6**
  <br/> Its the same thing as how auto-approval works in Codex and Claude Code, except asynchronous (so technically simpler) and general purpose.

Having agent watchers is really common in a lot of harnesses, including non-coding ones and supported by most frameworks to build agents. So not exactly special.

- by [unknown](#) **&#x21C5; 1**
  <br/> In my brain there is SOL working and the Watchdog (SOL) is looking at exorbitant komplex code just to shrug and say „meh, could be worse. I would do it the same way“ and just lets it through.

- by [unknown](#) **&#x21C5; 1**
  <br/> how do you enable and use it? I use OhMyPi and I’ve configured sol high as default, then I delegate tasks to luna xhigh. “smol” is on luna med and I do code review with sol xhigh, but I still can’t figure out 1) how and when to use the advisor 2) what is and what should I put into the whatchdog file

- by [unknown](#) **&#x21C5; 1**
  <br/> /advisor status /advisor on

In models there's the "Advisor" role you can configure (use at least Terra, go for Sol medium or something if you can afford it, it doesn't use that much tokens)

That will enable it. Then you create a WATCHDOG.md file in your .omp directory to add rules for it the same way you would an AGENT.md. You can use the model to recommend a default one for you or look the doc for a simple one.

- by [unknown](#) **&#x21C5; 2**
  <br/> found! It’s curious because I had a conversation with ChatGPT and it insisted to use Luna medium for the advisor, saying that the task it has (which is reminding the other model about not engineering) is pretty easy so you don’t need a smarter model. I’m giving it a try and results seem good. I will keep monitoring it

- by [unknown](#) **&#x21C5; 1**
  <br/> all 3 models are good at the end of the day, its probably not wrong about Luna here, but I didn't want to lead you in a direction I haven't tested myself.

- by [unknown](#) **&#x21C5; 1**
  <br/> Would you be able to recommend any instructions/repo with samples for this watchdog?

- by [unknown](#) **&#x21C5; 2**
  <br/> I honestly just asked the agent to write my WATCHDOG for me to ensure it doesn't overcomplicate things, don't write too many comments, follow my instructions, stay on track, etc, and it just did. I reviewed it, it looked good, it works well. Done.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yea that's what I done too and for now it's working and I'm getting ready to test first heavy plan of porting my erosion from test web environment to game engine. Problem is for some reason on Windows machine in powershell this OMP is lagging and eats RAM/CPU on my PC and I have really heavy powerhorse.

- by [unknown](#) **&#x21C5; 3**
  <br/> the curse of Windows. I haven't had issues but I run it in WSL most of the time when on Windows.

- by [unknown](#) **&#x21C5; 2**
  <br/> I didn't thought about that! Cheers!

- by [unknown](#) **&#x21C5; 2**
  <br/> high also overengineers

- by [unknown](#) **&#x21C5; 1**
  <br/> indeed

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh my pi uses your subscription and not the API tokens right?

- by [unknown](#) **&#x21C5; 2**
  <br/> It can use almost any method. But yes, Codex subscription is one of the options.

- by [unknown](#) **&#x21C5; 1**
  <br/> I beg to differ here, oh-my-pi advisor lately has increased over engineering for me because the advisor can be extremely nitpicky and issues everything as [BLOCKER]. I've had a scenario where the advisor and the agent spent hours refining a markdown file for something low risk instead of working on the next part of the plan.

- by [unknown](#) **&#x21C5; 1**
  <br/> You decide what it sets as what based on your watchdog rules.

- by [unknown](#) **&#x21C5; 71**
  <br/> gpt 5.6 sol does every side quest except the one you gave it. It's like calling an electrician to fix a light switch. You go out for a walk, come back two hours later, and the switch still doesn't work. But the wiring in the whole house has been checked, all the other switches work fine, there's now a fuse every meter of wiring just in case, and you're handed a stamped and signed certificate confirming the fuses are installed. The power company has also written back to the letter he sent them, saying there are no faults on their end. And when you ask him "so what about the switch?", he says he's about to get to it.

I can't steer this model. Doesn't matter how many rules I write or how precisely I put them in [AGENTS.md](http://AGENTS.md), it ignores them and does what it wants instead of what I need. The only thing that works is standing over it and kicking it until it does the job instead of screwing around.

- by [unknown](#) **&#x21C5; 6**
  <br/> I asked it to move my local repository to my nas…I am not exaggerating, it took it 9 days!  I let it do its thing so I could see what would happen, but it was wild.  And that was with my constantly yelling at it be doing checks and hashing and all kinds of things on repeat.  I was like, why didn’t you just copy the files to the nas?  It would say, yea I can do that it’s much faster, then proceed to do a million checks.

I’m fighting it now on two important threads…it’s driving me nuts.  But as you said, if it ever finishes, it’s usually pretty perfect.

- by [unknown](#) **&#x21C5; 4**
  <br/> GPT 5.6 High took an instruction to fix a feature and ended up auditing and editing **three unrelated projects** without fixing the fucking feature **in its own assigned project.**

GPT 5.6 Extra High - used accidentally - took a request to fix a visual style in a text chat app (a home-rolled alternative to the Codex app, specifically for coding projects) and went away for two hours, working with zero reporting. I noticed and stopped it and asked what it was working on. "Finishing implementing voice chat." *Voice chat?* For a fucking *Codex app?*

These high-effort models are feral. Not fit for any project.

- by [unknown](#) **&#x21C5; 5**
  <br/> You made me laugh! That's how I see it too! 😂

- by [unknown](#) **&#x21C5; 3**
  <br/> The soul mate of yak shaving.

- by [unknown](#) **&#x21C5; 5**
  <br/> I don't know why you got downvoted for that. Here's my experience:- 5.4 - most time spent being productive, supported by a little yak-shaving.- 5.5 - balanced productivity versus yak-shaving, but mostly because I opted to invest more in harness engineering during that period.- 5.6 - almost zero productivity. It's almost all yak-shaving, all the time, and it feels inescapable because 5.6 is so prone to ignoring guidance, forgetting requirements, inventing requirements, and over-complicating its work, all at the same time.

I finally broke down and returned to using 5.5 [for most work.] It makes mistakes often, but they're rarely as unpredictable, wasteful, or as hard to recover from as the crap that 5.6 pulls.

5.6 Sol is awesome for brainstorming, and its generally pretty solid at planning, but it is downright dangerous for anything else I need to do.

- by [unknown](#) **&#x21C5; 4**
  <br/> After a security review, Sol made it so I couldn't even build the project because it deemed my development PC an untrustworthy source of code. I had to have Claude sort that out. Part of that round was great, and I wanted to keep it, but it totally hosed the rest of it. It's great sometimes, but you have to watch it so that it doesn't over-engineer and go off into the weeds. These excursions seem to occur randomly.

- by [unknown](#) **&#x21C5; 1**
  <br/> I wonder if it's because of "memory"?

I don't have this issue with 5.6 SOL anymore, but I admit, the first time I used chatgpt (and 5.6 SOL High in chat), I once got into a loop where SOL refused to do any works and was just asking for questions over and over and over again for almost half an hour (less than 2minute task from SOL).

At some point I got mad an told him to stop and do the task I ordered to, which then, he apologized and continued again to ask and go on different ideas without doing any work, so I left the chat and opened another one and specifically explained that situation was unacceptable.

Since then, I never ever have experienced this issue again. Chat, codex or work, SOL always go straight to the point and do the task efficiently (and this, even though I set everything to be as detailed as possible, since I do a lot of reverse engineering on things like drivers, games and emulator). I have even a specific 5.6 SOL Max work (so not codex) with no clear instruction other than "recompile this game" and it literally split the project in different milestones and I just have to say "next milestone" after one is done and that's it, no blablabla, no questions, just pure output after output.

So I guess it must depend how you do interact with SOL and how it keep in memory the way you want things to move forward.

- by [unknown](#) **&#x21C5; 13**
  <br/> Agents.md with clear instruction about the scope of the project and the level of testing and validation I need.

Something like:

THIS IS A PERSONAL PROJECT NOT A BOEING AIRPLANE (so please check code quality and add some tests).🤣

- by [unknown](#) **&#x21C5; 1**
  <br/> OH and it will include the instructions given to it in README, that's fucking hilarious and extremely annoying.

- by [unknown](#) **&#x21C5; 11**
  <br/> I've discussed this extensively - check my post history.

The simple answer is: Use 5.6 Sol Medium for 90% of tasks. Use 5.6 High sparingly.

Everything above 5.6 High is feral and should be considered unsafe for any purpose, for the exact reason you stated.

These high-effort models vastly prioritize adding complexity to the point of fetishizing it. They will blow up one component into five with a complicated orchestrator. They will go totally fucking overboard with YAGNI features. They will imagine catastrophes that are *literally impossible* - like "the file on disk might change partway through a file read" **for a 10kb file** - and then design insanely overcomplicated machinery to prevent the impossible.

These high-effort models have no ability to stay within scope or follow rules. You tell it: "Work on feature A and nothing else." They start work on feature A and decide that they cannot fully implant feature A without working on feature B. And working on feature B requires changing feature C. And architectural modifications to feature C require implementing new feature D. Etc. It doesn't matter if feature D is wildly unrelated to feature A. It doesn't even matter if you specifically said: "DO NOT WORK ON ANY FEATURE EXCEPT FEATURE A, AND ESPECIALLY DO NOT MAKE ANY CHANGES TO FEATURE D." All of that context was lost in the course of 19 compactions over the past two hours.

These high-effort models have no sense of proportion. They will add enormous amounts of complexity for little or no value. The sad part is, they will admit that the complexity *doesn't even work* and was flawed from the start.

These high-effort models cannot stick to a plan. You ask them to generate a plan; they come up with an eight-phase plan, plus phase 0 to prep. If you walk them through it, phases 0-2 go fine, phase 3 takes four rounds to complete, phase 4 begins with discovering that phase 3 was incomplete and needs work, phase 5 breaks into phases 5A through E and also some added verification rounds... even if phase 8 ends up happening, the model will then recommend new phases 9-11 to fix unresolved shit. You will never see the end.

The kicker is, they can't even do it right. If a high-effort model "finishes" a feature and you audit it, it will find bugs, high severity. Audit again, more bugs, still high severity. Six audits later, still more bugs, high severity. Why? "I was auditing too narrowly." "I audited with a particular scope, which was wrong." So many excuses. No end to the bugs. When you ask why, GPT responds: "This plan was flawed from the start and should not be trusted. I recommend disposing of it and starting over." Start over... same result.

Do not use the high-effort models. They are sadness factories.

- by [unknown](#) **&#x21C5; 4**
  <br/> Fuck it is not everyday I’m part of such strong shared experience

- by [unknown](#) **&#x21C5; 2**
  <br/> What do you mean I cant make an edit to a line item in U7E of the sealed and hashed plan in arc 14 post mortem recovery r3?

- by [unknown](#) **&#x21C5; 1**
  <br/> Lol at "sealed and hashed", absolutely real experience with Sol.

- by [unknown](#) **&#x21C5; 1**
  <br/> I guess I understand where you going with this, however the object of the whole task wasn't that complicated, apart from 10 step calculation procedure, which was mainly described in mathematical form on the plan agent had a working platform he had only to do SLANG components that stick into CPP executor and wrapped in TS browser viewer, all was served to him on a plate. He mainly had to do GPU components and check if the routing is passing through via debug log. I've used SOL-medium for this task but will be trying to lower this further down to lowest value.

Also the thing is I use my several tricks to make it work, in GOAL there is request to follow top down the plan and tick [*] finished item, however this particular model doesn't really give a F about that instead just re-routing, doing other things apart from the task. It all worked until I started using SOL but I'm giving a bit up trying to resolve this so that's why I'm writing this post.

Don't get me wrong, if I tell him to do some browser shite, wrapper or something it's doing fine I think the issue might be there that it blows up the problem to enormous sizes as you stated yoursellf. Model starts checking, adding unecessary features, calculathing sha256 when it hears it's gotta work on more "responsible" stuff"

I'm currently trying oh-my-pi but it's still not great, I think maybe because I use terra as advisor and this advisor does fck all to be honest. Ponytail also installed will se how it goes. Seems you have similar issues and suggesting not to use high effort models, any other workarounds you might have found?

- by [unknown](#) **&#x21C5; 6**
  <br/> I'm struggling with it too. Just a simple task given - just clear up old zfs snapshots before our main goal, to free up space. All checked by me beforehand,  he had to just do it programatically and proceed. He started to: do gates, checks, preflight checks, detected some kind of failures not related, soft-shutdown services that gave him another inputs with error codes, he started to investigate, he did snapshots of whatever-the-fuck he wanted to snapshot, he inventarized something, scanned files, then He created backup policies etc. etc.reviewed zfs config and so on and so on....

It is like - your wife asks you to throw out thrash. You check weather, condition of your shoes, count keys, check keys to home if they fit, check space in the trash, measure the space, calculate the usage factor and increase factor function by date, you ask your wife and internet for thrash schedule twice. It will take you 45-50 minutes but you still didn't throw out that damn thrash....

I simple cancelled the subscription, as comparing to even Mimimax-M3 it is a pure waste of time and money. Mine and OpenAI.

- by [unknown](#) **&#x21C5; 1**
  <br/> Moreover, despite preparing everything in enormous number of phases, he is being "surprised" by his own preparations and mistakes, but the very very basic ones like wrong command, wrong use of quotations, wrong understanding of shell type (on which he worked for hours!) etc .etc. This model or models - are unusable. They are made for burning your money - without any delivery.

- by [unknown](#) **&#x21C5; 5**
  <br/> I just keep steering it when it starts doing dumb stuff

- by [unknown](#) **&#x21C5; 2**
  <br/> The whole point of a lot of this stuff is not to babysit it though. Sol is amazing for what it can do but personally I dont think it does it well.

- by [unknown](#) **&#x21C5; 5**
  <br/> I highly recommend you install Ponytail. It’s made a huge difference in reducing over engineering from Sol. [https://github.com/DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks I will review this! Very helpful! Other mate here mentioned "Oh my pi. Use Advisor and WATCHDOG.md", It seems this is not a new problem, did you managed to use this variation, do you have a comparasion ?

- by [unknown](#) **&#x21C5; 1**
  <br/> Ponytail is simpler and massively effective

- by [unknown](#) **&#x21C5; 1**
  <br/> Yepp I'm testing now all options suggested here by community cheers!

- by [unknown](#) **&#x21C5; 1**
  <br/> Im changing my main Model about once a month and ponytail and caveman have been in every installation.

Caveman to get rid of (for example) the yapping of Opus 5. Ponytail to get something useful out of GPT 5.6 Sol.

Idk but with those two I can run basically every model and it’s usually not annoying to use. Even switching is easy. Kimi K3 seems to behave the same as GPT and Claude with those installed. Can really recommend that combination.

I had some time without those where I was just yelling at my PC why the actual fuck something didn’t work. Even easy stuff seemed hard.

- by [unknown](#) **&#x21C5; 1**
  <br/> This made my sol very lazy. I asked to change x and it literally did x but not y and z releated end, it didn't care any consequences

- by [unknown](#) **&#x21C5; 4**
  <br/> Yeah sol is pretty difficult to work with. It spent days formulation a big execution plan that was just going around in circles. I ended up getting a claude max plan and use Fable as an orchestrator to keep sol in check. My big takeaway is that my directions are not specific away on my own and asking Sol to draft and execution plan just creates an onveregineered plan.

- by [unknown](#) **&#x21C5; 4**
  <br/> No handle. Embrace your new test library. Learn to love the smoke test.

- by [unknown](#) **&#x21C5; 4**
  <br/> I open my wallet and embrace it.

It can be somewhat reigned in with gated phased work logs and specs but even then it still will find and pull on threads sometimes..

After spending tens of thousands of agents hours, you definitely need to tell it when you don’t need things, e.g this is a greenfield project, we do not need a migration strategy, legacy support etc.

Fixes need to remain bounded and only to product impacting blockers, additional hardening may be documented but should not be automatically worked on.

Instructions should be set up front on the applications scope and footprint, this is a personal project made to run on my home server not exposed to the internet.

Oh and also please do not spend unnecessary time on one use harnesses or proof frameworks that will not be reused.

- by [unknown](#) **&#x21C5; 3**
  <br/> Parei de usar superpowers com ele, fazia testes do teste. Coloquei Ponytail e Caveman, também criei uma skill de orquestração para usar sub agentes. Melhorou muito.

- by [unknown](#) **&#x21C5; 3**
  <br/> Getting rid of superpowers has saved me a lot of time and grief.

- by [unknown](#) **&#x21C5; 2**
  <br/> Sim, ficava dando voltas

- by [unknown](#) **&#x21C5; 3**
  <br/> Depois que passei a orquestrar tudo em .md e executar com Lua extra alto, meu fluxo de trabalho melhorou muito. Sol drenava meu tempo e créditos executando tarefas desnecessárias e rodadas de validações excessivas. Após a implementação, aplico auditoria no Codex e Claude para que um encontre o ponto cego do outro.

- by [unknown](#) **&#x21C5; 2**
  <br/> Sol Medium for most tasks. Sol High when I face very difficult issues. Sol Xhigh very rarely.

- by [unknown](#) **&#x21C5; 2**
  <br/> I come up with a brief. I give the brief to sol. It does work. When it's done, I asked another agent if it followed the brief. Usually it needs corrections. I loop there until the other agent tells me it's all been implemented as expected. Then I do a round where we only remove code and scaffolding, it's important to remove that stuff explicitly. Also don't let it design contracts, it will spend most of its time designing and verifying those.

- by [unknown](#) **&#x21C5; 2**
  <br/> Use medium and have a normal convoDon’t use goals or prompt engineering or nothingWhen you’re at a decent check pointSwitch to ultra, can for a read only red team reviewSwitch back to medium, tell it to implement high confidence changesNext step is very importantStfu and keep vibing

- by [unknown](#) **&#x21C5; 2**
  <br/> I have a skill with short high level instructions, it works well. I just invoke it at the beginning of my convos

- by [unknown](#) **&#x21C5; 1**
  <br/> I got some instructions as well, mainly instructions how to design, what to do and what to do not. But it seems it's being neglected recently. Worked well with previous models now not so well, any cool ideas you want to share?

- by [unknown](#) **&#x21C5; 2**
  <br/> use ponytail

- by [unknown](#) **&#x21C5; 2**
  <br/> A way to solve this is to treat the thinking depth levels as overengineering levels. E.g. if you want ultra overengineering, you use sol ultra.

- by [unknown](#) **&#x21C5; 2**
  <br/> I use sol medium for practically everything. A mix of using in opencodr and codex extension.

I pretty much always ask for it to use a subagent to review the plan, especially for necessity amd overengineering.

Tends to always come back and trim down the plan.

You don't really need to use high reasoning either. Using multiple passes kinda acts like increasing reasoning. But you are using the reasoning to judge the plan.

- by [unknown](#) **&#x21C5; 3**
  <br/> USe chatgpt high as the architect /brain and codex high/extra high as the executor, give it a narrow window to move in, no other agent unless it can make a case of extrem advantage etc

- by [unknown](#) **&#x21C5; 4**
  <br/> Unfortunately the only solution to this problem is working in quite small, bite sized pieces and hand-reviewing and curating every line of code. While the models are quite powerful, they eventually always spiral into overengineered/weak architecture is inevitable with any complex project. I used to be very AI-pilled for a few months when the Opus 4.6 dropped, but over time I understood that vibe coding is only fine for very small stuff that don't evolve over time.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yea I know it's powerful, it helped me quite a lot in few difficult tasks. But sometimes it just drifts off so badly I need to step in and lead it by hand to get to the goal. It's quite unfortunate because you meant to take care of other tasks in meantime it's working. Like planning and designing, instead you have to get back on shop floor.

- by [unknown](#) **&#x21C5; 1**
  <br/> Hey bro, simplify that shit! Done.

- by [unknown](#) **&#x21C5; 1**
  <br/> Unfortunatelly errosion can't be done in one step 😄

- by [unknown](#) **&#x21C5; 2**
  <br/> Im kidding lol, only way is for you to be in the loop

- by [unknown](#) **&#x21C5; 1**
  <br/> I had to do a lot of updates in my files, each time I noticed waste/overengineering.

Main idea is: produce solution as simple as possible and as complex as necessary.

Hopefully Codex would be able to calibrate overengineering for next models. As if model is too smart so it overengineering a lot of stuff, it means a model can become even smarter and apply calibrated effort/complexity dictated by task itself.

- by [unknown](#) **&#x21C5; 1**
  <br/> Pretty easy - break your project into small milestones, so it can only do one well scooped thing at a time. Inspect the completed milestone, and don’t start the next until it’s reviewed and passing.

- by [unknown](#) **&#x21C5; 1**
  <br/> It was simple single processing formula, can't break it into smaller pieces. Anyway it was broken into smaller step by step tasks. I didn't ask to copy World Creator or Houdini.

That was 10 step 2-3k line process. Can't make it simplier than that.

- by [unknown](#) **&#x21C5; 1**
  <br/> Have it do 1 step at a time

- by [unknown](#) **&#x21C5; 1**
  <br/> Or I can do it myself 😀

- by [unknown](#) **&#x21C5; 1**
  <br/> put effort to light

when you need more complexity you increase the effort

- by [unknown](#) **&#x21C5; 1**
  <br/> get 20x pro and just let it cook 😭😭

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s real bad. I’ve been trying to set up local LLM agentic orchestration and the architecture just becomes so incremental in handoffs and create sealed certificates of this and highly locked down sandbox that’s air gapped for that without doing any real progress on orchestration. I’m just now on my third fresh attempt seeing real progress after carefully auditing every components I’m working on and having it adversarially review and whittle down its proposed architecture every single time

- by [unknown](#) **&#x21C5; 1**
  <br/> Use terra. Literally

- by [unknown](#) **&#x21C5; 1**
  <br/> I only use Sol Ultra on Fast mode, so far so good

- by [unknown](#) **&#x21C5; 1**
  <br/> Ask sop to estimate the amount of code it's going to generate. If it's too much say this and ask for a compact simple solution

It's going to over-engineer if you're saying yes to plans without reading then

- by [unknown](#) **&#x21C5; 1**
  <br/> I have something called a ten commandments in my agent MD define exactly what the minimal amount of engineering and I disallowed certain types of solutions from being implemented that Sol likes to use. For example, I explicitly disallowed the unnecessary use of hashing and a shot 256 some where it was inappropriate

- by [unknown](#) **&#x21C5; 1**
  <br/> Simple, avoid using it at all. I only use it to implement whatever I already figured out.

- by [unknown](#) **&#x21C5; 1**
  <br/> what has worked for me: let it over-engineer the shit out of it. and then do culling once i know most things are working. end result: 100k lines added then 90k lines removed.

obviously not ideal at all, but i have found no easier way without sacrificing velocity and lot of hand holding.

- by [unknown](#) **&#x21C5; 1**
  <br/> How do you remove the 90k lines without regressions?

- by [unknown](#) **&#x21C5; 1**
  <br/> Lot of it is just useless tests which are just not needed.

- by [unknown](#) **&#x21C5; 1**
  <br/> I explicitly tell to always spawn Luna high subagents.

- by [unknown](#) **&#x21C5; 1**
  <br/> I share the pain. It's a bad model that eventually after a lot of time spent, gazillions of tokens, may finally deliver something. Since it has been released I basically progressed nothing. Unfortunately for serious use cases right now we have nowhere to run, as Claude sucks big time unless you use Fable paying API prices. Sit tight and wait for a better model to be released, slow down development and be careful to not let any of these stupid models break whatever you have working today.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah, i got same problem. Asked to wire up some backend to create stripe checkout links and client portal from stripe. Then sol overengineered stupid exceptions like: what if stripe its down and we have a double click from user requesting payments and, at the same time, there is a pending subscription with payment in process… a completely absurd edge case that in my current project i coded myself 2 yeats ago never happened

I told him to dont assume scenarios and try solutions that are almost impossible to happen and tild him that i have customer support for this

I constantly make reviews of the code: duplicated methods, naming conventions, structure, overengineer,

I force the model to document things on linear and icepanel to keep track of progress. Also use gitnexus to help the model explore the project

But i find myself struggling to go straight to the point but at the same case dont over engineer while dont ignore reasonable cases y dont consider

At the end, goals and loops are not very usefull unless are very very defined. Also im experimenting with workflows to have subagents before starting a task to prevent absurd conclusions and other stack of subagents to reviews different parts of esch commit after developing something to avoid drifting

But at the moment i just can go one step at the time

What its clear its that the more “inteligent” the model is, the less common sense have so i find myself more comfortablr with lower reasoning efforts

- by [unknown](#) **&#x21C5; 1**
  <br/> tell it its a lazy programmer

- by [unknown](#) **&#x21C5; 1**
  <br/> not using it

- by [unknown](#) **&#x21C5; 1**
  <br/> Make a plan. Make sure your plans has steps with results you can check at every stage. Check results at every stage before committing and moving onto the next stage.

- by [unknown](#) **&#x21C5; 1**
  <br/> Plan , scaffold, execution, test, fix, test, (fix and test again if needed) , deploy and merge live to prod

- by [unknown](#) **&#x21C5; 1**
  <br/> One does not "handle" Sol 5.6 Ultra

- by [unknown](#) **&#x21C5; 1**
  <br/> Ponytail is a cool skill

- by [unknown](#) **&#x21C5; 1**
  <br/> I've found that it's generally not overengineering. TDD is good.

- by [unknown](#) **&#x21C5; 1**
  <br/> You have to break tasks into single actions. Not sure why so many people are trying 5 hour goals

- by [unknown](#) **&#x21C5; 1**
  <br/> Ponytail

- by [unknown](#) **&#x21C5; 1**
  <br/> I asked sol to write a test script. It came back with a 1000 line script.  I said are you serious write this in the simplest way the task requires. Then it was only 70 line after that and did the trick.

- by [unknown](#) **&#x21C5; 1**
  <br/> As others have said, I do small steps at a time, but I also use ponytail, which i hope actually helps along with instructions in my agents MD to always use ASD-STE100 simplified technical english, and expand on the specific rules for it. After I have some code written, i then ask sol to write narrative comment blocks explaining each part of the code and to create a mermaid diagram of the flow. If any of it makes no sense or is clearly redundant or superfluous, I call it out, but so far i haven't had to.

Additionally, if something seems complicated, I ask Sol to model that part of the code in assembly to see if there is a more efficient way to approach it.

- by [unknown](#) **&#x21C5; 1**
  <br/> When it start overengineering I tell it

      >:( Restoration Harness?

    Then it responds:

      "You are right, I did just turn a unit test into a 700 lines testing product. We don't need this ..."

    Then it rambles about some stuff so I hit escape and:

      "Straightforward pls"

    When I look back at the screen:

      "After reading project documentation I have reduced the test to a single cli call."

- by [unknown](#) **&#x21C5; 1**
  <br/> You’ve gotta have another agent check it.

“Open another thread with SOL Max to do xyz. Monitor its progress periodically and redirect it if it gets off track.”
