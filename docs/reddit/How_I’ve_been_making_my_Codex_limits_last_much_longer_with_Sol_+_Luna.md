# How I’ve been making my Codex limits last much longer with Sol + Luna [Visit](https://www.reddit.com/r/OpenaiCodex/comments/1w2aa7y/how_ive_been_making_my_codex_limits_last_much/)

### **Subreddit:** [r/OpenaiCodex](https://www.reddit.com/r/OpenaiCodex)

### **Author:** [IaryBreko](https://www.reddit.com/user/IaryBreko/)

### **Vote:** 45

---

I was burning through my Codex limits using Sol Medium/High for pretty much everything.
Recently I switched to using Sol mainly for planning/review and Luna for most of the actual implementation, with Terra only as a fallback for harder tasks.
The biggest thing that helped was forcing Sol to give Luna small, clear, self-contained tasks instead of broad instructions. It’s been noticeably better for both usage and consistency.
I put the setup here if anyone wants to try it or improve it:
[https://github.com/breko861-hash/sol-luna-codex-orchestrator](https://github.com/breko861-hash/sol-luna-codex-orchestrator)
Curious if anyone else is doing something similar
---

## Comments 35

- by [unknown](#) **&#x21C5; 7**
  <br/> I’m doing basically the same (sol high for orchestration, luna xhigh for implementation and sol xhigh for review) through OhMyPi and it works well, but my Pro 100 plan is still not enough for the whole week while before (one month ago) I had plenty left every week always using sol xhigh

- by [unknown](#) **&#x21C5; 11**
  <br/> I tried to have Luna implement via subagent when Sol was making the plan.Total bust for me... Using fictive numbers for the sake of explaining :

- Asking Sol to implement feature A, he would just do everything. In 30min, job done and 10% of my weekly was gone. Check the work, everything is perfect !vs- Asking Sol to plan the feature A, then asking to just coordinate LUNA as a subagent to do the coding. In 2h, job was done, totally crap and 10% of my weekly was gone. Then Asking SOL again to rework everything. Another 5% gone and everything was perfect !

Not doing that again for me.

Found another way that works better for me using multiple skills

- by [unknown](#) **&#x21C5; 1**
  <br/> Fair enough, I guess it depends a lot on what you’re building. I’ve found Luna works quite well when Sol gives it really strict, bite-sized instructions with clear scope and acceptance criteria. If the task is too broad, that’s usually when it starts going off track.

- by [unknown](#) **&#x21C5; 3**
  <br/> Agree. Not saying giving it to Luna is not good. But, for me, giving it to luna as a subagent on the same task when SOL is the orchestrator (model picked) wasn't good.

I have those skills now :

- Direct implementation : used when i don't want to got throught other model, self explinatory- Planning mode : In this, sol will make teh plan, extensive thinking but will not implement. It will make a [PLAN.MD](http://PLAN.MD) and stop there automatically- Implement plan : i use this on a different thread with luna or whatever other model i want. They will do the work and end with a [RESULT.MD](http://RESULT.MD) file that explain what has been done- Check the work : i use this back to SOL thread. It will read the RESULT/PLAN and review the code and end up with a [REVIEW.MD](http://REVIEW.MD) if there is issue to solve- Implement Review : back to LUNA thread, i will use this skill to read and implement what need to be done from [REVIEW.MD](http://REVIEW.MD) and rewite the [RESULT.MD](http://RESULT.MD)

I will do that back and forth until SOL write "PASS" in [RESULT.MD](http://RESULT.MD)

I mostly use direct implementation but the rest is working super well for me when it's long and hard task. Also, i use other model via opencode so it can be used cross harness.

- by [unknown](#) **&#x21C5; 2**
  <br/> Wont this take hella long or just a lottt of turns back n forth

- by [unknown](#) **&#x21C5; 0**
  <br/> Sol writes it in crayon for Luna. And leaves a bowl of lead paint chips at the end.

I’ve been doing that for a like bit now. And until this past week it worked great. Then all three decided the earth was flat and pants go on your head. The amount I’d stupid shit coming out of these models this week was astounding. Plans were always fine. Implementation… was not. To the point where after the fifth time of telling sol no I had an all caps “stop chugging the acetone” moment.

Also for all these one shot html/react uis, it’s goddamn retarded when it comes to anything dot net. Blazor included (600 character single lines with 7 objects in it, etc). Told it to make an input form. It did, but one text box was full with, next row had one 1/3 on the left, and 1/4 almost ask the way right. The rest of the fields looked like someone chucked Yahtzee dice across the room and that was the placement.

- by [unknown](#) **&#x21C5; 1**
  <br/> Lol that’s so true! The orchestrating workflow was just causingdouble or extra usage. Can u share what way u found that works better?? 🥺

- by [unknown](#) **&#x21C5; 1**
  <br/> I've had the same experience. So I use Sol for design and implementation, and Luna for running what Sol has built and collecting test results and benchmarking.

Then pass the results back to Sol for analysis and design refinement.

- by [unknown](#) **&#x21C5; 2**
  <br/> Idk how you are using sol as an orchestrator everytime I used Luna to execute Sol plan. It has to get the context and all the stuff seems like it was doing twice the job which make it super slow. So i often plan on high and execute on medium.

- by [unknown](#) **&#x21C5; 1**
  <br/> That’s exactly why I’m having Sol break the work into small self-contained packages rather than passing the whole plan/context to Luna. Luna only gets the context it actually needs for that specific task, implements it and reports back. Sol keeps the overall context and reviews/integrates the result. So Luna isn’t redoing Sol’s job or rereading the whole codebase every time.

- by [unknown](#) **&#x21C5; 2**
  <br/> Luna max is underrated people really dont know how great the model is.If you use sol for a task that luna can basically do then you just wasting tokensAnd sol will always over engineer tasks and break stuff more than lunaLuna can basically do everything sol is a debugger

- by [unknown](#) **&#x21C5; 1**
  <br/> Are you on Plus? If so, does it last you a month with the way you are describing? I am currently on OpenCode Go and have a very similar workflow to yours but am kinda getting tired of flipping through those models. So I was thinking to upgrade to something more reliable and now I am kinda torn between Codex and Cursor, not sure which to pick.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah I’m on Plus. It definitely doesn’t last me a month because I’m building something at the moment and using it pretty heavily, but this setup makes my limits last noticeably longer than using Sol for everything. Quality has been pretty comparable for me too, as long as Sol scopes the Luna tasks properly and reviews the output.

- by [unknown](#) **&#x21C5; 1**
  <br/> I run a similar protocol,  sometimes Luna, sometimes Deepseek.

[https://github.com/KrystalUnity/krystal-loop-protocol](https://github.com/KrystalUnity/krystal-loop-protocol)

- by [unknown](#) **&#x21C5; 1**
  <br/> I use SOL for planning and review and I have grok in cursor do all of the implementation. It works surprisingly well . I gave Sol the choice of working with Grok 4.6 or Luna and SOL chose Grok 4.6.

- by [unknown](#) **&#x21C5; 1**
  <br/> Hi , saw your repo , luna on max works much better than luna on high , with almost no cost increase.

       [](https://preview.redd.it/how-ive-been-making-my-codex-limits-last-much-longer-with-v0-uw499mq6ogmh1.png?width=1088&format=png&auto=webp&s=07d4b719a28bd5679a07a107b655d322dae3ecf5)

- by [unknown](#) **&#x21C5; 3**
  <br/> Yes, but a 20 minute task on high takes 2 hours on max. Nope

- by [unknown](#) **&#x21C5; 1**
  <br/> you can update luna-worker.toml to use max

- by [unknown](#) **&#x21C5; 4**
  <br/> I advise against using luna workers on max. While the cost difference might seem small since it's so cheap, it is actually 2x which basically means you get half the usage in the long run.The bigger issue is the token usage. Luna max uses over twice as many tokens as Luna high, so it starts compacting quicker. Luna being a very small model is bad at remembering details so this leads to overall worse experience and compacting turns Luna into a headless chicken.The benchmarks we see give it problems to solve which is where the extra thinking comes in handy. But as a worker, it just needs to implement the instructions provided by Sol. Luna high is plenty powerful for this usecase given that it's job is following detailed instructions.

- by [unknown](#) **&#x21C5; 1**
  <br/> I mean , the bench mark shows that it is so much more performant ?

Ie the slope is almost negligible , not like an opus-5 which just becomes insanely expensive for not much increase in intelligence.

Also having all your "context" in the models context window feels like bad context enginering. IT should always be in documented , and up to date project tracker. like gh issues +  gh projects or linear etc.

Treat luna like a dumb model that can look at a spec and implement it

- by [unknown](#) **&#x21C5; 1**
  <br/> I would take this graph with a pinch of salt.

Running Luna on max effort doesnt magically make it as good as Sol. It's inherently a dumber model, and running it for longer will just spin its wheels and get nowhere in my experience.

- by [unknown](#) **&#x21C5; 1**
  <br/> Hmm , i understand that its going to be near sol or opus 5 on raw intelligence.

But for adhereing to coding requirments , ( as what the test benchmars on ) , i feel like its not going differ that much. Ie if i tell you to implement this ticket with xyz acceptance criteria etc.

I want the model to be able to accurately implement it.

I use Sol / Terra to write the plans / devil's advocate my own written plans / prompts .

So i feel like it shuoldnt be an issue

- by [unknown](#) **&#x21C5; 1**
  <br/> Uso o Fable 5 ou Sol 5.6 para orquestrar e o Lua Extra alto para executar (Há rumores de que no Alto já é mais que suficiente e no extra alto pode até prejudicar o desempenho, vou testar ainda). Depois que passei a trabalhar dessa forma meus créditos estão durando muito mais. Tarefas que o Sol usaria 80% dos créditos de 5 horas, o Lua faz o mesmo trabalho por 3%, porém, as instruções para o Lua precisam estar extremamente bem definidas e desenhadas, pois as decisões do Lua são péssimas quando um obstáculo surge.

- by [unknown](#) **&#x21C5; 0**
  <br/> But if sol will do detailed plan....just let sol do it all.

- by [unknown](#) **&#x21C5; 1**
  <br/> No, because that defeats the whole point 😂 Sol doing the implementation is roughly 17-20x more expensive per token than Luna at the current rates.

If Sol does the planning and breaks the work into small, well-defined tasks, Luna is more than capable of executing most of them. So you keep Sol’s intelligence where it matters and save a ton of usage on the actual implementation.

- by [unknown](#) **&#x21C5; 0**
  <br/> I guess it depends on task. For 1 off small tasks, it would be cheaper to use Sol directly because the plan would already be detailed, and there is orchestration overhead too. But if its a repetitive set of tasks, Luna can save usage.

- by [unknown](#) **&#x21C5; 0**
  <br/> Luna is not reliable fr! It's cheap but when you review the code the mistakes are too much. Better to use sol medium or light

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna isn’t reliable if you just let it run rampant. What’s been working for me is having Sol break the work down into really simple, tightly scoped packages that Luna is more than capable of implementing. Then Sol reviews the work and sends it back with specific fixes if needed. That’s kind of the whole point of the setup.

- by [unknown](#) **&#x21C5; 1**
  <br/> That's exactly what I do, my prompts tell it what to touch, what not to touch. Where to work, it's detailed and tight but the code luna writes always comes back with some form of  fix, too many back and forth. Working on auth right now, don't want to mess it up and miss a bug

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah that’s fair, especially for auth. The setup isn’t really based on Luna being as reliable as Sol - it’s more about making the tasks simple enough that the cheaper worker is worth using while Sol still owns review/acceptance. But there’s obviously a point where too much back and forth kills the savings. For something sensitive like auth I’d probably escalate the harder parts to Terra/Sol rather than force Luna to do everything.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah! Wish I had a stash of money somewhere to work with some peace of mind. Squeezing everything in a 20 dollars plan is restraining. 😂I WANT TO RUN WILD AND BUILD

- by [unknown](#) **&#x21C5; 1**
  <br/> I even implement in small phases but it's just not reliable

- by [unknown](#) **&#x21C5; 0**
  <br/> Seeing how much worse Sol has become, I can't imagine Luna being useful at all.
