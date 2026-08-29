# Does Sol planning and Luna implementing really works? [Visit](https://www.reddit.com/r/codex/comments/1vrnau6/does_sol_planning_and_luna_implementing_really/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Cold_Produce2256](https://www.reddit.com/user/Cold_Produce2256/)

### **Vote:** 86

---

I deal with real production systems hosting 25k users
And for complex stuff or important stuff that I dont wanna mess up
I choose plan mode with sol extra high
And because I am worried about the production
So I implement it using sol High
But that ofc eats away my usage
So is Luna really safe for complex implementation
---

## Comments 105

- by [unknown](#) **&#x21C5; 102**
  <br/> Sol high/xhigh:

"Plan this feature carefully and comprehensively. No over-engineering, premature abstractions or scope-creep! Once the plan is set, orchestrate Luna xhigh subagents for implementation, and provide them detailed implementation instructions. Luna subagents never review their own work. You, the orchestrator, are responsible for review and acceptance. If review blocks acceptance, provide detailed instructions back to the Luna subagents until the your last review accepts the work"

Works great for me.

Keep in mind that Luna on xhigh/max is VERY SLOW!

- by [unknown](#) **&#x21C5; 43**
  <br/> "I ignored your direction to not over engineer, scope creep or prematurely abstract ideas."

- by [unknown](#) **&#x21C5; 26**
  <br/> You are right, that was my mistake and I burned 70% of your tokens.  Suck it.

- by [unknown](#) **&#x21C5; 4**
  <br/> "now stop crying & go buy another plan"

- by [unknown](#) **&#x21C5; 12**
  <br/> Your code will now survive a nuclear strike. Do you want me to harden anything else?

- by [unknown](#) **&#x21C5; 1**
  <br/> No, thanks, I’m good.

Wait… my wife has a request….

- by [unknown](#) **&#x21C5; 8**
  <br/> Do you get the orchestration glitch where Sol just sends out other Sol high/xhigh subagents through this prompt and eats through all your usage?

- by [unknown](#) **&#x21C5; 6**
  <br/> If the agent overloads one agent it can just make it loop forever, getting it to properly scope the task is the difficult part..

- by [unknown](#) **&#x21C5; 4**
  <br/> I’ve had to pull the emergency brake a couple of times. If Luna hasn’t made good progress in 20 minutes it’s worth stopping it and checking if it is ok.

- by [unknown](#) **&#x21C5; 1**
  <br/> I don’t think I ever encountered that, at least not consciously. But I might still have the pre-native Luna subagent workaround active…

- by [unknown](#) **&#x21C5; 3**
  <br/> Dont over engineer works like a charm for me. Giving specific instructions yo luna is really the moat here.

- by [unknown](#) **&#x21C5; 2**
  <br/> Sounds good, in practice output tokens are what's expensive, and workflows like this makes sol output massive amount of output tokens for the "detailed instructions" to the point it's often not cheaper while using lesser models.

"No over-engineering" also has zero chance to work

- by [unknown](#) **&#x21C5; 1**
  <br/> In my limited experience, you can save meaningful limits with this, but I don’t have scientific tests to back that up. Sure, it might be wishful thinking… I think you might underestimate how dirt cheap Luna is, though.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is freeSol output tokens are not

       [](https://preview.redd.it/does-sol-planning-and-luna-implementing-really-works-v0-w5sw8i8uu5kh1.png?width=529&format=png&auto=webp&s=062568d9271c7fffcb2b20f2d5dd5515b1a3fb2d)

    It scales similarly in term of usage in codex.

Basically you're forcing it to do only output tokens, and massive amount of itUnless the implementation is really lengthy, you're probably using more than you save

I also don't know wether you are feeding it luna summaries for reviews, or asking it to re read the whole scope of the current task, but you're probably losing sol's cache due to inactivity by the time Luna finish

- by [unknown](#) **&#x21C5; 1**
  <br/> This is definitely a thing. With the proper inputs the LLM itself may be of help.

When it asks me if I would like subagent-driven or inline execution, I usually just ask which one would save me money, and link it to the current price list.

I haven’t done proper controlled experiments. But it consistently chooses “inline execution” for smaller or very linear (non-parallelizable) plans, giving me the rationale that the token overhead incurred by handing things off to subagents would eclipse the potential savings.

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh really? Slow? How come Artificial Analysis puts LUNA Max as fast?

- by [unknown](#) **&#x21C5; 4**
  <br/> Probably because it is fast in token generation. It is so dumb on its own that it generates a massive amount of tokens, even to solve pretty basic stuff. That overcompensates its intrinsic speed dramatically.

- by [unknown](#) **&#x21C5; 2**
  <br/> Got it. Yea, I haven't had much luck with Luna. I prefer Sol High or Medium...

- by [unknown](#) **&#x21C5; 1**
  <br/> Be aware there is a “bug” that prevents sol spawning Luna agents. It will silently spawn Sol agents and nail your costs.

- by [unknown](#) **&#x21C5; 1**
  <br/> One thing you are missing out is that you will get a lot better performance from the smaller models, if the orchestrator model actually does the first successfull step of the of the implementation. Through this way, the smaller models get more useful and concise information and grounded into action immediately instead of spending tokens on reviewing the plan. It's also more token efficient.

- by [unknown](#) **&#x21C5; 1**
  <br/> I do similar but tell Sol to divide it up so Luna agents can work in parallel. Then they get it done both faster and for less than 1/3rd the tokens than if Sol did it all. Also increase the Luna context limits to 870k I think it is.

The biggest thing that's massively saved me tokens though on a large repo is .md instructions to always use Luna agents for reading whole files if grep/glob etc. miss and to only pass the relevant information that was searched for to the original agent from the explorer(s). Keeps Sol (and I have Claude do the same) context lower.

- by [unknown](#) **&#x21C5; 0**
  <br/> No over-engineering

    lol

- by [unknown](#) **&#x21C5; 0**
  <br/> I used to use subagents at xhigh, but I am much happier starting with medium and having it escalate according. Doesn’t codex also extend thinking automatically when it thinks it is necessary?

- by [unknown](#) **&#x21C5; 2**
  <br/> Use Luna xHigh or Max subagents, not Sol Medium, for coding.

- by [unknown](#) **&#x21C5; 21**
  <br/> It does but you have to be really careful. I let sol plan the project, swt the tickets and every ticket has strict definition of whatvis to be done, it has rules and guardrails for every ticket. And a list of what NOT to do.

Yesterday i implemented some tickets with luna max and took 6 hours to do the same work that terra does in 45 minutes. Aftert the 6 hours I realized that it applied all the schema updates to the postres of a completely different project. It blew my fuse and I almost threw my laptop at the wall. I had to discard all of yesterdays work and then redid every again today, but this time I specified which docker container to work with and I only set the effort to High, it did all the work correctly and in under 1 hour.

I never had this issue once with opus, fable, sol, terra, deepseek. Luna is probably the most moronic model that also gets the work done.

- by [unknown](#) **&#x21C5; 6**
  <br/> No it does not.

Sol needs to review all of the crap and fix all of the mistakes that luna creates... it's actually MORE EXPENSIVE.

- by [unknown](#) **&#x21C5; 4**
  <br/> If sol mentions exactly what to do in the tickets then luna can implement it as sol would. Then I just have sol do a code review after implementation and leave them as comments under the same tickets. Luna then takes care of them. If youre not getting quality output from luna then youre not fully utilizing sols capabilities to the fullest.

- by [unknown](#) **&#x21C5; 2**
  <br/> This was my experience.  And then when I asked codex about it, it more or less confirmed that the context switching and back and forth made the process less efficient overall.  Of course, that could vary from one code base to the next.

- by [unknown](#) **&#x21C5; 1**
  <br/> Do you have a skill or instruction to have sol orchestrate these things automatically without me having to say it in detail?

- by [unknown](#) **&#x21C5; 2**
  <br/> I use spec-kit in some projects and the matt-pocock skills in others. But theyre used for completely different workflows. And ive modified my own workflow that involves sol write the specs without spec-kit but implement them using the matt pocock skills. Depends on the project and also my interest in how much effort I want to put in a project.

I'd suggest watching some youtube videos, its mostly just prompting and validating until youre happy with the plans specs and the tickets. Then have them implemented one by one or in groups.

- by [unknown](#) **&#x21C5; 1**
  <br/> Tell it to write the instruction for your repo and read it when it's relevant.

- by [unknown](#) **&#x21C5; 8**
  <br/> No, when I actually benchmarked Luna I found it was costing me more due to it spending more tokens to figure out what was going on and fixing its mistakes. Sol medium or terra high was the sweet spot for cost for most stuff while sol high with sol medium reviewer gave better quality.

I keep Luna for simple LLM tasks like normalizing text before it goes into a graph database so the graph is better.

- by [unknown](#) **&#x21C5; 4**
  <br/> yes, as i have tested it and it works for me. if you skeptical of the work of luna you can always ask sol to review the work of luna.

- by [unknown](#) **&#x21C5; 4**
  <br/> For me no, but what I do find it good at is being used as a context enhancer, a way for Sol to probe the bigger picture and understand how different things gonna affect what he's try to implement and solve problems with less rakes along the way.

- by [unknown](#) **&#x21C5; 1**
  <br/> Can you explain?

- by [unknown](#) **&#x21C5; 3**
  <br/> Use luna sub-agents for research task I suppose.

- by [unknown](#) **&#x21C5; 2**
  <br/> Sol has very little context and I want him to look over the parts in my repo that will be affected by his changes to prevent slop.

- by [unknown](#) **&#x21C5; 1**
  <br/> From my experience, Luna as assistant on routine/admin tasks works pretty good under Sol supervision.

I'm thinking of testing Grok 4.6 via Cursor as main worker (tier above assistant so to speak) agent under Sol supervision.

- by [unknown](#) **&#x21C5; 1**
  <br/> how will you cursor and codex to work with each other? or will you use Sol from Cursor itself?

- by [unknown](#) **&#x21C5; 1**
  <br/> I use tmux windows and let agents steer another tmux window to coordinate

- by [unknown](#) **&#x21C5; 1**
  <br/> Never seen anybody doing that. But it definitely is an interesting concept.

- by [unknown](#) **&#x21C5; 4**
  <br/> Yes. And even if it messes up, it can run five times for the same cost of sol. Let sol police the Luna results, and send corrections.

If you are getting soul to plan and transferring the plan to Luna yourself, you are almost there.

Almost to the point of configuring codex to use a Luna army of sub agents, with sol commanding the field.

- by [unknown](#) **&#x21C5; 3**
  <br/> I have been using agents for software dev since early last year. I have seen them go from shitty VSC extensions to what they are today.

You should always use the smarted and most capable model for the job. What you don't pay for tokens, you'll pay in time and nerves for regression and edge case fixing, failed implementations etc.

Sol XHigh or bust. Turn on Ultra for really, really tough research tasks like obscure bug discovery, super complex planning etc.

Even if I have to buy 2 Pro plans (I don't) it's orders of magnitude cheaper than hiring even a single senior was only a year ago.

- by [unknown](#) **&#x21C5; 1**
  <br/> I think I agree with you most out of everyone Yes it could be expensive but to be honest its rare when it misses any thing So it saves me a headache (I have 2 20 dollar plan) But one of them is for job searching and automatic my new fiverr account

- by [unknown](#) **&#x21C5; 1**
  <br/> Alright yeah that workload is fine. Especially on the $20 plans. I was thinking like hardcore research and/or software engineering.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes, you just have to have a proper custom sdlc, where Sol does all architect/principal engineer work, then passes architecture to Luna, then another Luna does validation and tests, then Sol does final check and sign off.

Whats important is proper atomization of tasks. SolShould split everything into sufficiently small tasks, that can be properly tested.

- by [unknown](#) **&#x21C5; 2**
  <br/> nope i use it with terra getting much more tasks done since terra is so much faster

- by [unknown](#) **&#x21C5; 1**
  <br/> I think this is where I am going next. Sol x Luna was working ok but it has slowed down a lot and Luna keeps getting stuck. I’m hoping a Sol x Terra will work better, even with Terra on medium.

- by [unknown](#) **&#x21C5; 1**
  <br/> How does the code quality and efficiency compare to just using Sol?

- by [unknown](#) **&#x21C5; 3**
  <br/> It’s way faster than just using sol and it’s even more accurate than sol and Luna max I use sol high and Terra high,sol low now since Luna max is slower and still dumber than those 2

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks!  Will try it out once my reset comes back!  (my 100 dollar plan ran out in 1.5 days of work ><)

- by [unknown](#) **&#x21C5; 2**
  <br/> I have always used Sol, but I'm at 4% for the week and have about 80% of a 20 max plan worth of work.

Had Claude reformat the prompts slightly and gave fable orchestration.

Fable used 24% of my weekly use, 1% of my Chatgpt 20x plan by using Luna, and Fable even said it was well worth it and considered the Luna output to be very good and it didn't need to put a ton of effort in to fix.

So, Luna good.

- by [unknown](#) **&#x21C5; 1**
  <br/> Have you asked Sol high/xhigh to review what fable has implemented for the given prompt? Fable hallucinates alot when you do actual work that has Jira Ticket, Confluence, some Screenshots. Plus, you have to deal with understanding Fable's cryptic output. I had to ask at least 2-3 follow-up questions to understand what it means. I get brain fog whenever I use Fable or Opus 5 as main daily driver.

- by [unknown](#) **&#x21C5; 2**
  <br/> Luna extra high has worked great for me. I have sol give explicit instructions then get sol to review with PASS/BLOCKED statements - this saves a tonne on usage as sol isn’t doing the implementing, it just gives instruction, and reviews

- by [unknown](#) **&#x21C5; 2**
  <br/> > planning> So is Luna really safe for complex implementation

IME if the plan is good enough: absolutely.

“Planning” isn’t a generic term, so, this discussion is not useful without talking about what kind of planning.

I work in a big Rails monolith and I use the Superpowers skill w/ Sol which creates very detailed plans that includes all the architectural decisions and a lot of actual code. Sometimes, it’s almost like an entire untested first draft of the code. (I don’t know if this is the best way, it’s just my current mode of working…)

With that kind of a plan, even smaller/dumber models can execute it successfully.

And Luna xhigh/max is far from dumb. You can even use Luna xhigh/max for a lot of complex planning; you just have to vet the plans more carefully… but you should be vetting them anyway even if you’re using Sol or something even better.

For example, Superpowers uses a `design plan -> implementation plan ->  implementation -> verification` workflow, with human verification of the design and implementation plans before proceeding. You can do as many revisions at the planning stages as needed. It will not proceed to the next step until it has your explicit approval of the plans.

Of course it also depends on the domain. There are a zillion Rails apps and it’s a very mature framework and it’s all mostly CRUD anyway so LLMs handle it well. If you’re doing more niche stuff, where the LLM is going to have to do a lot of trial and error at the implementation stage (if you’re writing, I don’t know, hardware drivers for poorly documented hardware?) then maybe you need beefier planners AND implementors….

- by [unknown](#) **&#x21C5; 1**
  <br/> yes

- by [unknown](#) **&#x21C5; 1**
  <br/> for me yes and saves a bunch of tokens.

I think having different models with different perdspectives/contexts are always better than only 1 and self review.

Just make sol review everything luna does and fix until sol passes it. There is no downside.

Also make sure before  you start luna to have sol do the architecture and design and not make luna do that. Luna literally is an implementer not a thinker.

- by [unknown](#) **&#x21C5; 1**
  <br/> I find as long as sol scopes the tasks narrowly for a "weaker" model and you have a sol medium/high reviewer after each one, it works just fine. Saves tokens

- by [unknown](#) **&#x21C5; 1**
  <br/> Depends on what you’re doing. If it’s UI, 100% no.If it’s something simple, good idea to save on tokens

- by [unknown](#) **&#x21C5; 1**
  <br/> I created a skill so that it plans with Sol xhigh then implement with Luna max. I thought my usage would barely move now but for some reason it's only about 30% less than my previous usage when I was using Sol medium as implementer

- by [unknown](#) **&#x21C5; 1**
  <br/> Let Sol control Luna and review it. Chat with Sol; Sol calls another Codex CLI session with Terra/Luna Max for implementation. Sol independently checks and reviews Terra/Luna's work.

- by [unknown](#) **&#x21C5; 1**
  <br/> I generally use sol xhigh with Luna medium/high. I do see a cost reduction but with the giant caveat that it depends on the feature and you keep the sol/luna boundaries very strict. I’m not sure if the usage reduction fully justifies not just using xhigh in my case though. Still experimenting with the orchestrator if I have spare usage

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol needs to review all of the crap and fix all of the mistakes that luna creates... it's actually MORE EXPENSIVE.

- by [unknown](#) **&#x21C5; 1**
  <br/> I found it helped a little to give Sol some license to fix small problems in Luna’s work by itself. Otherwise I was getting multiple loops with lots of context being passed around. It’s a bit like a senior dev spotting a small mistake and just pushing their own fix rather than throwing it back to the intern.

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm not so sure anymore. For about a week I was testing Sol planning + Sol-low orchestration with luna-high implementation + Sol-low review. For explicitly scoped tasks, I found that luna consistently drifted and had to be corrected by Sol.

I then switched with Sol-low orchestration with Sol-low implementors + reviewers and found the work to speed up dramatically with less rounds of review and remediation.

I would love to use luna-high as a default implementer, but its not there yet for me.

- by [unknown](#) **&#x21C5; 1**
  <br/> I just run Sol / High. I feel like you get better results planning and executing on the same context.

People very much over complicate things.

The most important part is just to keep overall scope narrow per task.

- by [unknown](#) **&#x21C5; 1**
  <br/> Try luna on xhigh. Dont go with benchmark scores ( on deepswe it is 67 vs 60), test for yourself and then decide. For me xhigh/luna works

- by [unknown](#) **&#x21C5; 1**
  <br/> For me, Luna works quite well and is much cheaper than Sol. Sol consumed my quota way too fast. I often use Luna high or xhigh for normal tasks, and it seems to work better than Terra. I still use Sol for planning, verifying, and reviewing the jobs done by Luna. You can even spawn multiple Luna agents, one as executor and another as validator, and that works well for me. I use Sol as the controller to decide whether the work is acceptable and meets the target

- by [unknown](#) **&#x21C5; 1**
  <br/> Get money use sol all the time

- by [unknown](#) **&#x21C5; 1**
  <br/> Terra or Luna for planning. If it's a simple , existing concept, just use Luna

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna non thinking with Sol Max as subagents is 🔥

- by [unknown](#) **&#x21C5; 1**
  <br/> From my experience, this type of workflow results in a slight increase in quality, but does NOT save usage quota. Implementing a pipeline is a quality initiative more than a cost one.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yup or for even cheaper can run hermes and something free like Nvidia 550b models for tasks and sol as orchestrair etc

- by [unknown](#) **&#x21C5; 1**
  <br/> It can work ONLY if you do a lot of code review. So let Luna implement, then make one or more other Luna agents review the code.

But be on the lookout for scope creep as the review agents will always flag *something*

- by [unknown](#) **&#x21C5; 1**
  <br/> I use Luna Max for implementation, it costs 1/10th of Sol Medium.  Then review with Sol, then fix with Luna Max again.  Luna uses massive amount of tokens, but it doesn't matter because it's dirt cheap.

- by [unknown](#) **&#x21C5; 1**
  <br/> For me no, or at least not on the projects I worked so far, Luna is insanely dumb. Even with extremely organized and detailed prompts from Sol, Luna will still half ass it and literally just ignore some of the stuff asked.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, it certainly does.

My main implementer is Luna Medium and it smashes it out. Have a terra reviewer and sol medium orchestrator. Luna doesn't need to be smart to implement a well-defined & planned out task.

- by [unknown](#) **&#x21C5; 1**
  <br/> I am deeply impressed by the results of Luna. Been using it even for planning. And I am using it from medium to xhigh. There are definitely glitches here and there,and speed is not amazing. But it’s a really good model for a lot of tasks.

- by [unknown](#) **&#x21C5; 1**
  <br/> I would be very surprised. In my experience I was very bad at guessing what model would work best. Things were always more complicated than I expected. Sticking to the best model is much simpler.

- by [unknown](#) **&#x21C5; 1**
  <br/> I been using chatgpt sol to plan the high level stuff with sol for free without giving it the code. Then giving that to luna, good results most of the time even for a huge instruction list, but not good enough that you can get by without testing it.

- by [unknown](#) **&#x21C5; 1**
  <br/> I have sol ultra as the higher up and it spawns in 1 terra high and two Luna max

Luna for its intelligence and cheapness and terra to essentially use the tools FOR Luna max since it suffers a 3 minute penalty on tool use

So my work is significantly faster while still not going crazy on my limits

- by [unknown](#) **&#x21C5; 1**
  <br/> I couldn't get sol to ever be happy with anything Luna did

- by [unknown](#) **&#x21C5; 1**
  <br/> Sounds good in theory but in practice I ended up with so much mess that I ended up just having to go back to sol on Ultra and just unfuck everything

- by [unknown](#) **&#x21C5; 1**
  <br/> Only good use case I have found for luna is to scout the repo and provide a list of files of interest to sol, that way it saves a lot of context of junk results from rg/search tool calls

- by [unknown](#) **&#x21C5; 1**
  <br/> role separation matters more than the model pairing. implementer never reviews its own work, reviewer gets fresh context, tasks small enough to actually review. get that right and you can swap models per role on budget. the schema-in-wrong-project story above is an isolation problem not a Luna problem.

- by [unknown](#) **&#x21C5; 1**
  <br/> I feel the same, Luna tends to be super dumb unless given an extremely clear plan. Also drifts during longer tasks unless constantly kept in check.My go to is Sol high/xhigh for planning, Luna xhigh for simple, short implementation that doesn't span modules.That's where found place for Terra high/med: module-crossing/longer implementation.Sol medium for cross-system integration, ci work, experiments or implementation tasks where expect some unknows/blockers show up during the process that need ingenuity on the fly.

- by [unknown](#) **&#x21C5; 1**
  <br/> I migrated a small supabase backend to fastapi with sol light and luna. Full token is spend in about 5hours. Extra items like a folder of docs, and 3 others which are not necessary was introduced. I later deleted it (3x tokens are spend for nothing). And no APIs were working. Then I used claude to review. Then fixed it. Then with sol light (next week)... fixed it. Then again with claude.... Then I understood, review always find something, so I stopped at 3rd round. Then I asked claude to check each api and fix it and it fixed all this time. (Maybe if I asked luna to test it and fix it, it might fix it the same way claude does). I think Terra or claude sonnet is way better than sol+luna. Too tight on tokens? Then sol+luna is ok but then another iteration of testing and fixing is needed. Multiple regression tests with luna will not cost much anyway.

- by [unknown](#) **&#x21C5; 1**
  <br/> Honestly, what I’ve done is use Claude as my designer/planner and Codex as my workhorse. These tools know each other well and when you ask for opinion on how to do X with this other tool, they give you all the insight like a school girl inside a high school bathroom talking to her best friends.

I do the same for Codex when asking it to write a prompt for Claude or Gemini.

- by [unknown](#) **&#x21C5; 1**
  <br/> Why do you want a smart planner and dumb implementer? Would you hire a smart planner and a dumb builder if you were building a skyscraper?

- by [unknown](#) **&#x21C5; 1**
  <br/> I use sonnet as orchestrator and Haiku as implementer.Sol and Opus Plan iterative usually 5-10 rounds, make super small Haiku batches and sonnet orchestrates the implementieren, very fast.I use GLM 5.3 as a/b reviewer for every batch.

- by [unknown](#) **&#x21C5; 1**
  <br/> Didn't work well for me but maybe I could do it better... Idk... Having sol implement it's own plans is not that expensive. it's the plan itself that costs the most.

- by [unknown](#) **&#x21C5; 1**
  <br/> Why are we not using Terra? Luna handles web searches and minor implantations for me. Sol is the brain, Terra is the workhorse. I see a lot of people using Luna for their main workhorse, just curious as to why?

- by [unknown](#) **&#x21C5; 1**
  <br/> Terra can’t orchestrate.

- by [unknown](#) **&#x21C5; 1**
  <br/> Multi-agent workflow has never worked for me. It sounds great in theory. In practice, for me it usually leads to worse outcomes that using a single agent to do everything. In practice, planner-implementer setup leads to excessive work and overengineering. For the kinds of projects I work on, it is usually easier to do a short informal  planning step and then to just run the code and debug it from there. Planner-implementer workflow usually leads to waterfallish polished product/designed doc - implementation setup. Especially given Sol's propensity to overengineer, this so far for me leads to higher costs due to 1. Sol doing way more planning than needed 2. codebase becoming overengineered and unnecessarily complex.

Given that current usage limits make Sol-Medium not really usable on Plus sub, my current approach is to use Luna-xHigh as the only agent and supervise it carefully. The only other agents I use are occasional Sol-Med/High reviewer agents.

- by [unknown](#) **&#x21C5; 1**
  <br/> Personally, I'm not a fan of this set up for any coding tasks.Having dumb little sub agents buzzing around, passing information back and forth to the orchestrator - the whole thing feels like theatre.

"Oh, is that sub agent still running? Why is it using so many tokens? Wtf is it doing?"

I would rather just have a single agent handle the work unless the task in genuinely massive and requires extensive scouting or is a research/audit style job where Luna's can do dumb grunt work that would be genuinely wasteful for Sol as it requires no judgement at all.

- by [unknown](#) **&#x21C5; 0**
  <br/> NoI tired this and I tried ChatGPT pro with GitHub planning with terra/luna coderPrompt engineering is a waste of time and deadMaybe I fucked it up but I’m back to vibe coding raw and I’m way more productive

- by [unknown](#) **&#x21C5; 0**
  <br/> Yeah, I like it. I actually built a free Codex plugin that handles this automatically.

[https://flowwweb.com/swarm](https://flowwweb.com/swarm)

At 25k users, the trick is to use an independent agent review process in the loop too, preferably at Sol level. SWARM handles that for you automatically.

Give it a spin. Would genuinely love to hear what you think, especially anything you’d change or improve. 🐙

- by [unknown](#) **&#x21C5; 2**
  <br/> Have you compared yours to any of the other master/subagent plugins out there? If so - what does yours do different/better?

- by [unknown](#) **&#x21C5; 2**
  <br/> Certainly. The ones I've tested have had a few fundamental design flaws in the routing that just didn't work particularly well for my use cases. I wanted a single control that follows subtractive engineering principles, avoids the overhead that comes with delegating work, keeps the shell lightweight, follows core graph engineering principles, has an independent review process, and makes a decent effort to counter some of the bigger problems with 5.6 models, particularly overengineering, nitpicking, and design drift.

I ran a few blind head-to-head tests against other orchestrator plugins using fairly simple tasks, like building a landing page, with an independent review agent scoring the results. SWARM came out ahead each time, but the process was useful in its own right because it exposed weaknesses and helped me improve the plugin further.

One of the latest additions I'm experimenting with is a setting that routes some usage through ChatGPT. In practice, that means you can save a fair bit of Codex usage by offloading work to ChatGPT, either locally with file access or in the cloud, where it doesn't put any extra load on your machine.

Overall, I'm quite pleased with how the parallel lanes are working. I'm running five Pro subscriptions at the moment and trying to squeeze every last drop of value out of them, which is what led me to build SWARM in the first place.

There's something rather satisfying about controlling an army of agents from a single interface and having the whole thing work reasonably well without needing to constantly babysit it. And I've already built a few rather interesting projects with it. Quite excited to see where they lead.

- by [unknown](#) **&#x21C5; 2**
  <br/> One of the latest additions I'm experimenting with is a setting that routes some usage through ChatGPT. In practice, that means you can save a fair bit of Codex usage by offloading work to ChatGPT, either locally with file access or in the cloud, where it doesn't put any extra load on your machine.

    This is what ive been looking for.
