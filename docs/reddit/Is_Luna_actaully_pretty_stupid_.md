# Is Luna actaully pretty stupid? [Visit](https://www.reddit.com/r/codex/comments/1vbndoa/is_luna_actaully_pretty_stupid/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Fluffy-Ad5630](https://www.reddit.com/user/Fluffy-Ad5630/)

### **Vote:** 100

---

So I've tried Luna-max since the cost reduction.
It's pretty bad at making decisions and it goes to wrong directions all the time. Is it actually useful for anything complex for you?
---

## Comments 137

- by [unknown](#) **&#x21C5; 44**
  <br/> Still better than Google's so called frontier models.

- by [unknown](#) **&#x21C5; 55**
  <br/> You structure workflows differently for cheaper models.

For example, atomic tasks with adversarial review.

Sol/Opus can handle ambiguity better, but it's better still if you can remove ambiguity.

If you have a good review cycle your sol workflow will also be better, but it is unlikely to be MUCH better than the Luna workflow, especially when you're talking costs.

I use Sol for planning and high value review and Luna for basically everything else.  And now with the price changes, this makes even more sense

- by [unknown](#) **&#x21C5; 8**
  <br/> I love my "bro explain what I'm doing and what I forgot to address and give me directions I should take based on project state and targets I must hit by next meeting" models

- by [unknown](#) **&#x21C5; 9**
  <br/> I asked my system to look at the code I was working and to tell me where it failed using my most hostile reviewer skills.

I still haven't recovered

- by [unknown](#) **&#x21C5; 1**
  <br/> XDDD

I'd need those skills tho

- by [unknown](#) **&#x21C5; 2**
  <br/> Saving this prompt, lol

- by [unknown](#) **&#x21C5; 1**
  <br/> On a more serious note I told it I have important meeting and I can't fuck it up so we have to do deep audit if we really covered issue uncovering and it worked more than a hour and half. Actually produced some good findings, but Ive included to write temporary and probe code under different subdir so we could experiment easier.

- by [unknown](#) **&#x21C5; 2**
  <br/> Are we back to the "I have an important meeting" "my job is on the line" "my kids are gonna starve" "a guy here will cut off my feet if there are any mistakes" style of prompting?

- by [unknown](#) **&#x21C5; 1**
  <br/> Unfortunately yes

- by [unknown](#) **&#x21C5; 1**
  <br/> Could you give more detail about the workflows and review cycles you like or point me to where to read more

- by [unknown](#) **&#x21C5; 1**
  <br/> You'll want to look at codex documentation about agent orchestration.  But I did expand more on my workflow here.  [https://www.reddit.com/r/codex/s/BFTOjjAvPI](https://www.reddit.com/r/codex/s/BFTOjjAvPI)

- by [unknown](#) **&#x21C5; 1**
  <br/> Hey sorry bro can you more elaborate the workflow im trying to understand on how to work properly

- by [unknown](#) **&#x21C5; 19**
  <br/> I'll try! As a warning this is something that works for me and so what works for you will likely be different.

So the first step is you need a plan. The plan is what you want to build.  The goal is to turn this into a prd.  I have a system I made that helps try and look for flaws in my plan and make them better, but there's stuff out there that's public (matt pocock grill me with docs/wayfarer or polytoken plan mode being examples)

The goal is you want to have something that breaks down step by step what you need to build and what good looks like.  My system has a subagent that just looks for flaws, another that flips any assumptions it has on head to see if concept holds, one that tries to find the best version of a concept, etc.  once they agree, that's when it builds a plan.

This is your PRD. (Product requirements doc). This is your Bible and so stuff isn't complete unless you fulfill what is in the document.

Then you need to have this split into tasks.  Sol/opus can do this natively if you ask them to create a task list with tasks small enough for a cheap model in one context window. I have a system that does this for me because of how my environment is built, but creating a task list file is how I started.

After the list is built, have another agent perform an adversarial review of the document (a different lab model is best but if you don't have this, tell your model a different lab model made it.. they all hate copilot fwiw). Ask the model to verify the plan against the prd to make sure it's not missing anything and that it's building in the right order

Then you spin up a new agent (higher context window is better). Tell it it's an orchestrator. Give it the path to the plan and tell it to look at the first task, spin up a subagent an assign that task to them.

Once the subagent returns the orchestrator should compare their output to the task and if it matches it marks it complete in the task list and sends on the next agent for the new task. If it. Doesn't it sends the task to a fresh agent again to try.

When the orchestrator runs out of context, you just clear context and you tell the orchestrator to look at the task list and start the process from the most recent uncompleted task.

I want to be very clear that this system will probably not work for you the first time you run it. However when you see where it fails, ask questions about why it's failing. Start developing skills and workflows to compensate for those. How you prompt is going to be different than how I prompt and that's going to change how the system responds.

But plan review execute verify is a really potent workflow once you dial it in.

Let me know if that helps

- by [unknown](#) **&#x21C5; 3**
  <br/> Nice to see I am not the only one using this workflow. With nearly exactly the same steps, to be honest.

To automate this and make this more durable than markdown files, I am currently building my own hub/app where all this lives. Tasks, plans, goals, agents with runs, authorization, review workflow, etc.

The biggest improvement in any local workflow are two things you mentioned. First, the orchestrator. The role that actually does no coding, and mostly no planning. But it *owns* everything, and makes the decisions. It delegates, creates detailed kickoffs for the Luna agents implementing the small bundles. Deciding what gets a direct review, what gets an integration slice review.And the second thing is adversial audits. Especially for the plans. But also for the code later. Let a different model (or pretend-different) look at it and fight it for gaps and errors.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yep! My current system keeps tasks in postgres as tickets and then plans as markdown as the source of truth with dedicated skills for each area. I'm in process of tuning it more but it is still the basic flow above, just with my own start of a harness around it.

- by [unknown](#) **&#x21C5; 1**
  <br/> I was thinking about something like this, but looks like a big token/cost hungry workflow. Do you use it only for big refactor or big features?

- by [unknown](#) **&#x21C5; 2**
  <br/> This is why you use small models. Doing this pre-work means you can use cheap stuff to execute and so the cost is substantially less than just trying to brute force on sol or opus.

I don't do this for stuff like a simple "hey I want to add a new model to the API caller" style tasks. But anything that's multi session it is almost always worth it to me to do this kinda flow.

I can do all of this except for orchestrator using Luna, and could use Luna for orchestrator if I can work around the context issue

- by [unknown](#) **&#x21C5; 1**
  <br/> You do this inside codex with luna then? I'm used to do something similar (more simple to be honest, just simple plans) in the chatgpt app with github plugin, then use the plan that i get from chatgpt in codex in plan mode (using sol high) and finally implement (using sol medium or high depending on task)

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah one thing that can be easily observed: Leave any coordination work  to a good high model, and let it call smaller sub agents and decide how to review that work.

Luna and terrible are quite terrible for coordinating work even if your plan is explicit, but for performing simple tasks they can be fast and efficient

- by [unknown](#) **&#x21C5; 3**
  <br/> I think they’re talking about orchestration: [https://developers.openai.com/api/docs/guides/agents/orchestration](https://developers.openai.com/api/docs/guides/agents/orchestration)

Simpler models need a bit more of that to keep them on track. You plan your work out in detail with the best model, sic the Luna agents on coding it then bring in progressively smarter models for code reviews. You can also set it up so that if reviews fail too many times the orchestrator will bring in an architect to figure out why.

- by [unknown](#) **&#x21C5; 40**
  <br/> No. It's nowhere near Fable or Sol. You need to compare within its reasonable price bracket competitors.

- by [unknown](#) **&#x21C5; 10**
  <br/> yeah it's insane if you compare it to like DeepSeek or similar models. It's not a sol level model but it's great for example pair programming with it together.

- by [unknown](#) **&#x21C5; 6**
  <br/> DeepSeek just released a new V4 Flash model, which as per benchmarks is better and cheaper than Luna xhigh

- by [unknown](#) **&#x21C5; 3**
  <br/> If we're going by API costs, then on OpenRouter, Luna has another 50% off the 80% from OpenAI so...

If we're talking about practical use by consumers, then Luna within the subscription should be way cheaper than separate API charge for DeepSeek

- by [unknown](#) **&#x21C5; 2**
  <br/> It's great if you already have a plan and give it clear instructions what you want done

- by [unknown](#) **&#x21C5; 1**
  <br/> Err it IS comparable to DeepseekV4 pro. I love open source models but get your facts right.

- by [unknown](#) **&#x21C5; 1**
  <br/> it's not, on benchmarks yes. But have you tried using DeepSeek, its just not as efficient and doesn't write as clean code as Luna does.

- by [unknown](#) **&#x21C5; 2**
  <br/> Ah, I understood your previous comment the other way, that Luna was inferior to DS. Luna is amazing.

- by [unknown](#) **&#x21C5; 1**
  <br/> You know, people say it's not comparable to fable or Sol, but it's comparable to kimi k3....

Which is constantly compared to Sol and fable. So idk what to think.

- by [unknown](#) **&#x21C5; 1**
  <br/> people who compare kimi to fable are idiots. or more likely, bots

- by [unknown](#) **&#x21C5; 6**
  <br/> Think of it like this, if you use Sol on a high reasoning level you are outsourcing a lot of thinking work to Sol and you may even be more likely to be able to one-shot  a task.

Luna-max is ridiculously cheap, but the trade off is that you can’t outsource that thinking and it’s more a case of you need to be very specific about what you want and why. You’ll likely have a few rounds of back and forth to get it right.

My workflow is: I use 5.6-Sol-High in Chat mode to work back and forth on what the Epic is going to contain, the goal is to really lock down a great design document. I’ll then create a detailed implementation plan, that is then broken down into multiple PR sized increments of work. Then for each increment I’ll get it to create an execution contract that is very specific about the scope, what existing files it can READ/WRITE, verification steps, what good and bad looks like etc. Those are then raised as GitHub Issues, a parent epic and then child-issues in dependency order.

I then pass all the work over to Luna-Max to implement and then Sol-Low acts as the PR reviewer of the work. Any remediations needed then go onto the PR ticket as comments with again, an executor contract specifying how they should be fixed. It works really well, especially if you started a greenfield project and have been practicing test driven development, building up your test suites to protect against regression.

So yeah, you can work like this and get really good output, it requires more effort from you, but it’s CHEAP.

If you don’t want to put in the effort you’ll probably get poor outcomes using Luna High or you simply will need to pay more, use Sol and expend less of your own effort. I would argue though, what I’ve described above is what people should be doing even if they are using the best frontier burn your cash model available. Just because Sol-Max or Fable 5 can one-shot something with amazing code, doesn’t mean it’s going to deliver what you actually want for your project if you aren’t specific.

- by [unknown](#) **&#x21C5; 1**
  <br/> “My workflow is: I use 5.6-Sol-High in Chat mode”

What do you mean by Chat mode? Is this Plan mode or something else? Thanks

- by [unknown](#) **&#x21C5; 5**
  <br/> So I swap between the ChatGPT app (where I have a Project per repo). I then use 5.6-Sol-High in Chat mode (not Work as that uses your Codex quota) and then I’ll swap to Codex for the actual implementation.

If you specify your repo in your ChatGPT Project, you can also use the GitHub app to open GitHub issues and do PR reviews. If you have skills in your repo you can even utilise them within your chats in the ChatGPT app too. So I use “grill-with-docs” and “to-issues” skills to create my design/implementation docs and then “to-issues” to get them raised as Issues in GitHub.

Because I put a lot of effort into my implementation plans and the executor contracts in the GitHub issues with Sol-High, I don’t want Luna to try and re-plan in Codex.

- by [unknown](#) **&#x21C5; 1**
  <br/> Bro i follow your workflow its really amazing thanks for sharing its really great idea and save lot of usage

- by [unknown](#) **&#x21C5; 1**
  <br/> Just want to say that this workflow is looking really promising on my end. Much slower than just hammering it in with Codex and blasting through 20% of my weekly tokens in an hour, but it's done some pretty hefty revisions and additions at about 1/5th the cost so far!

- by [unknown](#) **&#x21C5; 1**
  <br/> Glad you’re finding it helpful!

- by [unknown](#) **&#x21C5; 5**
  <br/> That's why is cheap. :)

- by [unknown](#) **&#x21C5; 5**
  <br/> With every model AI companies release I see people complaining about how stupid the model is. In 99.99999% of cases it is the author of the post and not the model.

- by [unknown](#) **&#x21C5; 13**
  <br/> people really need to stop considering it as a "super cheap Sol that's slightly worse"spiritually Luna is a nano-family model, Terra is Mini and Sol is the regular. if you want to reduce your usage bill, run Terra on High/xHigh, no less.use cases where Luna can shine :

  - classification (which is why it's now behind Codex Auto-Review)
  - translation (as long as it's not too complex)
  - glorified autocomplete
  - codebase search (crazy efficient as a subagent)
  - web search (same)
  - terminal commands suggestion
  - code explainer
  - summarizer
  - …

- by [unknown](#) **&#x21C5; 2**
  <br/> I just implemented with Luna Max a small Dev UI that runs our custom Migrations in the system and even Publishes items according to conventions. It investigated how Migrations are done and even showed their list. It even used ILSpy to decompile the code and check which parameter fits my use-case. Yes, i had to do more adjustments (unlike Sol or Opus 4.8 would surely be one-shotting it), but not much. So i'd say it's more than autocomplete or codebase searcher, it's capable, but with a bit more babysitting.

- by [unknown](#) **&#x21C5; 1**
  <br/> yeah it's indeed a pretty capable model.basically 5.4 intelligence at 13× less the cost. tho you need to heavily direct it (which is why it's so good as a subagent and not as the main model you use, or for one-off tasks). it might not one-shot stuff but it's good enough for most simple tasks.however you can clearly see it's pretty quirky. ex my laptop language is set to French but Codex is in English, just like my prompts and codebase. despite that when it spawns as a subagent it speaks in French lol

- by [unknown](#) **&#x21C5; 1**
  <br/> Do you have some instructions in your [agents.md](http://agents.md) that tell codex to use it for parts of the plan that do these actions?

I can imagine this could significantly reduce token usage. Sol would basically do the hard thinking parts and writing of the code.

- by [unknown](#) **&#x21C5; 1**
  <br/> yeah you can indeed specify global rules to "force" some models for subagents based on task complexity. however note that Codex currently can't use Luna directly as a subagent, workaround here : [https://www.reddit.com/r/codex/comments/1vb7led/how_to_use_luna_56_subagents/](https://www.reddit.com/r/codex/comments/1vb7led/how_to_use_luna_56_subagents/)

- by [unknown](#) **&#x21C5; 4**
  <br/> No way it is difficult to drink with a fork.But seriously, every task has its own tool. Luna is good at getting simple things done, e.g. replace css classes, find info, refactor simple functions. Terra is for tasks of medium difficulty. Sol good at planning and building architecture. Why even I write this, this is obvious

- by [unknown](#) **&#x21C5; 4**
  <br/> Everyone saying Sol over-engineers, Terra should never be used for optimal value, and now Luna is dumb.

It's almost like each tier serves a purpose. Using Artificial Analysis as the sole source of determining your model doesn't seem like the smartest idea, yet the subreddit keeps showing that same graph with the same conclusions.

- by [unknown](#) **&#x21C5; 3**
  <br/> Is there any benchmark that is good at estimating these kind of intelligence differences?

- by [unknown](#) **&#x21C5; 14**
  <br/> Your own real world tasks. It quickly becomes apparent how the models perform when you use them for real.

- by [unknown](#) **&#x21C5; 4**
  <br/> Agreed. Benchmarks are pretty much useless to me.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes, but it takes some time to see how a model performs as nothing is static. Codebase is evolving, tasks and prompts are changing, etc. And there's a huge amount of models. They are being upgraded every few months and tweaked all the time. And each model has around 5 reasoning levels. And it's not about intelligence in isolation, but intelligence/cost and intelligence/time. And then there's randomness, so a single test is meaningless. Manual real world reviews also take time. I would rather spent all this time working with optimal model.

- by [unknown](#) **&#x21C5; 2**
  <br/> There's a massive amount of models but there's only a few competing at the very top. Those are the ones you want to choose from. Currently codex offers the most performance for the least money. That could change at any time.

- by [unknown](#) **&#x21C5; 2**
  <br/> How do you know that only a few are competing at the top, if benchmarks are useless? ;)

- by [unknown](#) **&#x21C5; 3**
  <br/> You can't use Luna like you use sol.

Plan with Sol in chat. Give Luna a bounded, simple task after the reasoning is finished with Sol. Provide Luna with the roadmap, any information it might need, and then use it.

Terra is your average workhorse model. Sol for high reasoning.

- by [unknown](#) **&#x21C5; 2**
  <br/> « It’s pretty bad at making decisions »It is NOT his job, you cannot prompt Luna like you would do Sol and expect it to perform. Luna will shine at following a well prepared and detailed plan and implementing the code.

- by [unknown](#) **&#x21C5; 2**
  <br/> Depends on what the complex task ig

- by [unknown](#) **&#x21C5; 2**
  <br/> It's very good for debug and coding. If you have a problem that is reproducible, it can analyze and solve it very effectively, kind of like DSv4 Flash. It is not a problem-solver/not vibe-able in the sense that you cannot give it a vague prompt then it will go figuring out and give you proposal by itself, and you only have to say yes. That's Sol/Fable territory, they are more vibe-able.

- by [unknown](#) **&#x21C5; 1**
  <br/> I agree, for me it's very good for debugging work, analysing logs, making kubectl calls across different services, etc.

- by [unknown](#) **&#x21C5; 1**
  <br/> I’m going to try it today I’ve used Terra a bunch that was pretty good too

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna can’t even speak my native language, making constant grammar errors and hallucinating extra letters in the words it’s outputting. So yeah

- by [unknown](#) **&#x21C5; 1**
  <br/> Only.good for small tasks since you have to use xhigh or max, it gets stuck in a loop of losing its context, kind of like 5.3 spark but not as bad.

- by [unknown](#) **&#x21C5; 1**
  <br/> Spend some tokens with Sol to produce a solid documentation and roadmap with milestones and tasks and handle them to Luna-ExtraHigh. Works great

- by [unknown](#) **&#x21C5; 1**
  <br/> It's super amazing on xhigh if you have strong patterns and work in a framework and you tell it implement X and follow the codebase convention. I do the first correct pattern on sol high and careful review process and then Luna xhigh for same same but different

- by [unknown](#) **&#x21C5; 1**
  <br/> [https://www.reddit.com/r/codex/comments/1vbp9tx/deepseek_v4_flash_0731_fights_back_to_luna_new/](https://www.reddit.com/r/codex/comments/1vbp9tx/deepseek_v4_flash_0731_fights_back_to_luna_new/) DeepSeek said hello!

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes did a lot today and very bad experience

- by [unknown](#) **&#x21C5; 1**
  <br/> After the price reduction, I had to turn to Sol several times for minor tweaks to my apps. With Luna, I had to explain exactly how every tiny detail was supposed to work, or it got everything wrong.

Sol figures things out on its own without needing every detail explained.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is not very good at making decisions. I recommend Terra or Sol, or some other provider if you can't sustain usages. Luna is good at findings things, and doing tasks where there isn't too much semantics or decision-making involved. It is good at finding edge cases and reviewing your code though. But in having 'foresight' it is not great.

- by [unknown](#) **&#x21C5; 1**
  <br/> Just compare it to mini models but a bit more intelligent

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s not a vibe model and it’s doing ok for Hermes imho, better than DS v4 flash.  Seems cost is good so far, but one thing it’s doing amazing for me is esp32 work using Hermes and Luna max as the model.  I made a profile called esp32 and use Luna as the model.  It connects to my com ports, using all the tools and mcp and skills amazingly and honestly it has been great

- by [unknown](#) **&#x21C5; 1**
  <br/> sol cannot make decisions completely right, so you evaluate whether the left ok (as luna will fix these or run into something strange using extra turns (aka your tokens) nevertheless)luna most times make decision wrong at first time, but you can correct it and get the work done. looks like the RL trained like so.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna isn't for complex problems...

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol builds the pipes, Luna is the gravity which lets the data flow

- by [unknown](#) **&#x21C5; 1**
  <br/> Idk what people in this thread are feeding their AI but Luna is my default model and it's been amazing. Feels just as good as 5.5.

Maybe my workflow just doesn't leave a lot of room for ambiguity so I don't see what everyone else is saying. But I've written thousands of lines of code this month with it and every time I'm like 'Luna what are you doing' I dig into it and realize 'oh actually that's a good point, carry on'.

The only thing Ive learned to absolutely not use Luna for is PRs. It misses a lot on that front, versus Sol. Haven't compared it to 5.5 so can't speak to that.

Edit: just realized you said Luna Max. I use Luna xhigh. I could see it going sideways when subagents get involved.

- by [unknown](#) **&#x21C5; 1**
  <br/> For me it misses things, like update this variable, and it misses the help file, and sol xhigh decides to create an extra readme file for that help file...

- by [unknown](#) **&#x21C5; 1**
  <br/> My setup is currently fable orchestrating a bunch of Luna:med sub agents. Works surprisingly well. Fable does pretty well with the dumber models

- by [unknown](#) **&#x21C5; 1**
  <br/> You dont use luna or haiku for decision making.

- by [unknown](#) **&#x21C5; 1**
  <br/> this is my experiment result last night

[I am not using luna max on an existing codebase ever again](https://old.reddit.com/r/codex/comments/1vbfcdo/wtf_no_palpable_difference_between_sol_medium_and/)

new project i want quickly scaffolded? absolutely.

- by [unknown](#) **&#x21C5; 1**
  <br/> It is gemini flash level

- by [unknown](#) **&#x21C5; 1**
  <br/> You're 100% right but also wrong I sent Luna a screenshot in that screenshot were the instructions to send an email from me to someone else.

Luna repeatedly tried to send the email from me to me repeatedly it took me laying down the instructions verbosely before it did it, so it's capable but it needs your full attention and you definitely can't vibe with it as well as SOL

- by [unknown](#) **&#x21C5; 1**
  <br/> Use Sol to plan, Luna Max to implement.

- by [unknown](#) **&#x21C5; 1**
  <br/> I use Luna for simple automations where it just needs to follow instructions and not make many decisions

- by [unknown](#) **&#x21C5; 1**
  <br/> How good is it for information retrieval tasks?

Like, i need 10 specific infos on this entitiy. Find them on this page and enter them accordingly?

- by [unknown](#) **&#x21C5; 1**
  <br/> Don't use Luna for any "thinking" or decision making. Use Sol for that and for steps to give to Luna or Terra to complete the task you want to get done, and then have Sol review the result.

- by [unknown](#) **&#x21C5; 1**
  <br/> Use Luna for pure research, documentation, small code adjustments.

- by [unknown](#) **&#x21C5; 1**
  <br/> In complex problems requiring creativity it needs structure. Guidance. So better to plan with a stronger model and implement with Luna.

- by [unknown](#) **&#x21C5; 1**
  <br/> I don't use it much for code but it's way smarter than 5.5 was as my voice assistant. Feels faster and more natural too. I switched my home assistant voice to it last week

- by [unknown](#) **&#x21C5; 1**
  <br/> Had the same experience with both Luna and Terra.

Tried to use them for some automations and even the simplest instructions possible they would mess up

- by [unknown](#) **&#x21C5; 1**
  <br/> It depends on what it is your need tbh

- by [unknown](#) **&#x21C5; 1**
  <br/> If you rely on models to make decisions for you then it usually won’t align with what you want anyways. No matter how detailed your spec is.

- by [unknown](#) **&#x21C5; 1**
  <br/> With enough skill, guidelines and good MCP it's great.

Not great for one short end to end delivery without the above like the bigger models.

- by [unknown](#) **&#x21C5; 1**
  <br/> Qwen 3.6 35B is superior.

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ll try it. Been using deep seek - it’s cheap.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is only good for looking at small section of a script. I wouldn't use it to implament or create anything.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol -- planning and orchestration Terra -- writing tests Luna -- implementing

- by [unknown](#) **&#x21C5; 1**
  <br/> Use Sol High to create a work package and a prompt for Luna for whatever it is you’re trying to do, start a new task with Luna, attach that. Verify results yourself/with Sol/with scripts. Enjoy. Sol can’t create Luna subagents without workarounds but it’s just a couple of clicks. Also, can attach the session id to your Sol thread, Sol can read the chat with Luna if needed for clarification.

- by [unknown](#) **&#x21C5; 1**
  <br/> Codex kept on opening new chats in luna and even changing existing chats to luna, I've changed my .codex file now to always open on Sol medium and if i need i can change it but Luna is unusable for me.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna max and chill all day bro

- by [unknown](#) **&#x21C5; 0**
  <br/> No idea. I only use sol.

I simply can't risk using anything less than frontier intelligence for the work I do.

- by [unknown](#) **&#x21C5; 17**
  <br/> Cool story bro

- by [unknown](#) **&#x21C5; 11**
  <br/> So you were not able to work 6 months ago?

Must be high classified ai slop

- by [unknown](#) **&#x21C5; 6**
  <br/> This guy works

- by [unknown](#) **&#x21C5; 1**
  <br/> I tried it as a replacement for Sol-high. It's very slow, and the result was so poor that I had to restart everything in Sol-high. It wasted a day of my time.
