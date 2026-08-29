# “Sol for planning, Luna for execution”, Is this really the best strategy? [Visit](https://www.reddit.com/r/codex/comments/1vxbuf2/sol_for_planning_luna_for_execution_is_this/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [EspressoPeter71](https://www.reddit.com/user/EspressoPeter71/)

### **Vote:** 129

---

I always did that. A big model writes a blueprint for the smaller one to execute. But I started noticing that, to get a reliable implementation, Sol spends a lot of tokens on the blueprint and the final review. I’m wondering if it wouldn’t be more efficient to just ask it to code directly.
What you guys think?
---

## Comments 141

- by [unknown](#) **&#x21C5; 96**
  <br/> Sol in Chat GPT Project can plan, read your GitHub repo and keep the whole scope of the project in one place, and create detailed prompts and .md for codex to execute… and it does it for free , no token burn. Don’t see the advantage of the agent doing any planning

- by [unknown](#) **&#x21C5; 34**
  <br/> Don't stop there. Ask ChatGPT to cite the model and level of thinking that should be used for each implementation milestone.

My pattern is typically:

- LunaXHigh
- SolHigh(review)
- SolMedium(review feedback fix)

Anyways, ChatGPT knows the nature of a task, and can basically warn you to use ScootyPuffJr versus ScootyPuffSr

- by [unknown](#) **&#x21C5; 25**
  <br/> I take it a step further and have the plan documented in Jira tickets for Codex to read from. And I have a separate ChatGPT Sol model acts as a TPM to plan out larger epics and broader scope with. And after everything is executed, I have a separate GPT that reviews Jira comment history and PRs to update product documentation in confluence to ensure that all new features are designed consistently with the most up to date architecture.

- by [unknown](#) **&#x21C5; 10**
  <br/> There we go, this dude gets it. Even better, create a scoped execution JIRA / GitHub issue containing a contract that specifies the files to be read and written, test logic etc etc.

- by [unknown](#) **&#x21C5; 1**
  <br/> i’ve been doing this with a lot of success.  basically using linear instead of beads since i’m working on a code base with another person.  i’ve gotten it set up tight enough so that i got him able to contribute despite not being an engineer at all.  He’s design mostly but it saves me an assload of time not having to go in and do UI tweaks.  basically any time it gets too far beyond simple frontend stuff i have him flag me and write a ticket in linear.

this also lets him meaningfully contribute to project management as well

- by [unknown](#) **&#x21C5; 1**
  <br/> Wait till you guys find out about linear.

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ve tried it a couple of times but it’s just not gelled for me yet. I know I need to spend some more time with it as I feel like I’m on another plateau. E.g I need to evolve my workflow as I’m feeling like there could be an easier way.

- by [unknown](#) **&#x21C5; 1**
  <br/> It's jira with GitHub integrated. You can ride your so directly in the app or use your own harness on the side.

- by [unknown](#) **&#x21C5; 1**
  <br/> Same here, but not with jira. Have a proprietary system for tickets

- by [unknown](#) **&#x21C5; 1**
  <br/> this is a goated comment

- by [unknown](#) **&#x21C5; 1**
  <br/> That’s money…thanks! 👏🏽

- by [unknown](#) **&#x21C5; 1**
  <br/> I love this idea and can’t believe I didn’t think of it,

- by [unknown](#) **&#x21C5; 7**
  <br/> That works until it doesn’t.  I just had to rebuild a project when ChatGPT suddenly lost the thread, and that was its conclusion, as in, ChatGPT said that relying on ChatGPT in that role was the problem.  I recovered it by reviewing the whole project with several different models using opencode, and ChatGPT, then through the consensus reached there, and a more rigorous method of following the guidance documents, it came back together.  I’m not much of a programmer but as a mechanical engineer that can direct an AI, I finally stoped relying on the models to build it right and really dig in to what issues were, and gave an outline for a more solid way forward that sidestepped the over engineered mess codex/chatgpt (both using Sol) produced.

- by [unknown](#) **&#x21C5; 8**
  <br/> You had to rebuild a project in GPT because GPT lost the thread? A project in ChatGPT is a folder with a series of conversations in it, if it lost the thread in one of those conversations just delete the conversation. It has a source folder where you can keep sources of truth for the whole project, each conversation can be about various features or portions of the project. One of those conversations that goes awry it doesn’t spoil the whole project folder..

- by [unknown](#) **&#x21C5; 4**
  <br/> I use github projects to setup a canban board which can then be used to scope each piece of work. I then have a local runner for tests and get it to regression test each ticket and implement it's own code review

- by [unknown](#) **&#x21C5; 2**
  <br/> Had a similar issue last week that after a while on multiple projects, it would start to a hallucinate and the contradict prior code and decisions as well as making a total mess of my github repos with tons of branches and commits where they shouldn't be. I then spent the next few days creating a repo just for AI instructions, guidelines and standards for all my projects and a list of required files. First and AGENT.md file with the basic repo instruction purpose, architecture, workflow, testing and non-negotiable rules. BRANCHES.md to keep track of all branches and their purpose. DEPENDANCIES.md to define any outside dependancies that need to be considered prior to any commits. RELEASE.md for release procedures and validation gates. CHANGELOG.md to track changes. And what I have found to be the most important is DECISIONS.md.

The DECISIONS.md file is derived from conversation and design decision and creates a logic flow that can be followed for all future decision so that new work doesn't contradict any old work. As part of the workflow, no commit can be made without ChatGPT giving me a Q&A to resolve any ambiguity for work that is being commited. Also, it is a hard gate that no commit can happen without review of all these files and conflicts be resolved.

It has taken some tweaking to the rules, however now I am finding that in areas where it seems like it is about to hallucinate, it runs a review and then asks me questions. I have found that ChatGPT is not very good at keeping track and working from chat history and takes asking it over and over again to actually do it. So now, my chat history is not needed because all of the logic is in the DECISIONS.md file.

- by [unknown](#) **&#x21C5; 2**
  <br/> It might completely ex-filtrate all of your files though as you are giving them full repo access.

- by [unknown](#) **&#x21C5; 2**
  <br/> How does ChatGPT author documents on your machine?

- by [unknown](#) **&#x21C5; 5**
  <br/> I tell it to make the plan we have been discussing into a downloadable markdown file… and it does. And I download it

       [](https://preview.redd.it/sol-for-planning-luna-for-execution-is-this-really-the-best-v0-y4rzf22btdlh1.jpeg?width=1206&format=pjpg&auto=webp&s=676b8984b76b39fabd261745c6729b9d4c033e42)

- by [unknown](#) **&#x21C5; 2**
  <br/> OK, yes, I do that too, but I did make an MCP at one point so it could save but I haven't been able to get it working agin. The space between ChatGPT and ChatGPT Work will probably close soon

- by [unknown](#) **&#x21C5; 3**
  <br/> 🤫

- by [unknown](#) **&#x21C5; 1**
  <br/> Yup they broke it on and off again enough for me to give up and just cop the usage

- by [unknown](#) **&#x21C5; 2**
  <br/> Somehow I am getting a bad feeling that this "free" usage will be removed in the future too. Especially that claude is doing the same way.

- by [unknown](#) **&#x21C5; 1**
  <br/> Well…. I’m paying for Plus, so it’s not all free, but yea, if enough people start doing mad GitHub / Planning with chat…. They might get wise

- by [unknown](#) **&#x21C5; 2**
  <br/> It was all fun till you see that chat also has message limit but still it save tonnes of tokens this way , also you can ask it you give manual terminal task if you wanna save more tokens

- by [unknown](#) **&#x21C5; 1**
  <br/> That’s how I do it, and was wondering if others were chatting through codex via sol and then switching models to implement

- by [unknown](#) **&#x21C5; 4**
  <br/> Sorry No, I plan on the ChatGPT window where I have a project with a dozen plus conversations all about that particular app we are building, plus the built-in source document feature and then I just take the markdown files or copy paste prompts from those conversations over to VS code to give to Codex

- by [unknown](#) **&#x21C5; 1**
  <br/> Came here to say this

- by [unknown](#) **&#x21C5; 1**
  <br/> free?!

- by [unknown](#) **&#x21C5; 1**
  <br/> In as much as it does not eat up your usage that you pay for with plus or pro

- by [unknown](#) **&#x21C5; 1**
  <br/> I just wish I could have it point to my local repo instead, this is why I just eat the token cost to run it via codex instead

- by [unknown](#) **&#x21C5; 1**
  <br/> I agree.... but i mean, I'm pushing updates to github every 4-6 commits anyway, so it's never too far behind.

- by [unknown](#) **&#x21C5; 1**
  <br/> Why is it free?

- by [unknown](#) **&#x21C5; 1**
  <br/> I mean, No codex usage is consumed

- by [unknown](#) **&#x21C5; 1**
  <br/> Sorry, I don't understand: why Chat GPT doesn't consume AI credits in this case? And what is the difference between Codex and ChatGPT? For me on desktop it looks like this is one app now. Could you elaborate please

- by [unknown](#) **&#x21C5; 1**
  <br/> He demonstrates in [THIS VIDEO](https://youtu.be/XRxEey9kDY0)

- by [unknown](#) **&#x21C5; 1**
  <br/> Are we assuming OP is using Codex via API when consuming tokens, and you are suggesting they use ChatGPT subscription for planning?

Codex can also use subscriptions so no need to do the planning in ChatGPT, OP can do it in Codex subscription.

- by [unknown](#) **&#x21C5; 32**
  <br/> I’m using Sol for everything because Tibo always gives us a reset.

- by [unknown](#) **&#x21C5; 4**
  <br/> Another reason to use Sol for everything is because switching to Luna will invalidate your cache, so it might actually eat limits faster.

- by [unknown](#) **&#x21C5; 5**
  <br/> Use subagents, then you don't compact nearly as much.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah, people that don't understand proper orchestration are burning context for no reason.

- by [unknown](#) **&#x21C5; 14**
  <br/> Sol is too expensive to implement with, even on a 5x plan. I use sol to plan, create all the tasks, then either have terra or luna implement them. Luna on max takes too long, like a 45 minute task for terra can take up to 2 or 3 hours for luna on max to implement. Luna works best on extra high, terra on high.

- by [unknown](#) **&#x21C5; 8**
  <br/> I’ve been testing and benchmarking this and the answer so far is - it depends.

Straight Sol uses less weekly usage if it’s relatively simple issue because then no architecture and back and forth burn. Argument could be made in that case then that one could just use terra or naked Luna.

Dynamic orchestrator plus Luna uses 66% less weekly usage in my most recent benchmark for more complex, multi step process than just Sol. But that’s when controlling for a very tiny Sol step at the start, and then having communication taken over by Terra and implementation by Luna.

I’m working on making more effective benchmark suites for this as I iterate on a personal agent operating system and as soon as they’re consistent and not complete dog shit I’ll release them publicly. I’m not a coder so I’m super slow at this stuff.

But I am finding that with a super streamlined instruction set there ARE cases where multi agent execution is explicitly cheaper without compromising output quality. It’s definitely not every situation though, at least not for me who is reliant on codex’s brain since I can’t write code.

- by [unknown](#) **&#x21C5; 28**
  <br/> I rather have everything done by the same model to get the best solution possible

- by [unknown](#) **&#x21C5; 6**
  <br/> Not always the case. I find reviewing with model from different provider (e.g. implement opus, review sol) to be more effective. After all humans also delegate code reviews to someone else.

- by [unknown](#) **&#x21C5; 6**
  <br/> I tried this, but Luna Max took ages to complete and it needed a lot of corrections after.

What I do now :Planning on Sol Extra High or Opus 5 MaxExecution on Sol HighAudit + Correction on Sol Extra High

Overall works best for me. Faster and less things to correct at the end, hence less usage needed.

- by [unknown](#) **&#x21C5; 2**
  <br/> Have you ever used Terra max instead of Sol high? Genuine question because benchmarks put them at the same level with Terra max being slightly cheaper. But I haven't genuinely tried them against each other in practice

- by [unknown](#) **&#x21C5; 2**
  <br/> Actually no. I’ve never tried Terra in fact.

No particular reason. Let me know if you ended up testing it lol.

- by [unknown](#) **&#x21C5; 2**
  <br/> Switching reasoning levels mid task will invalidate your cache, eating limits faster. Have you tried just using xhigh for everything?

- by [unknown](#) **&#x21C5; 2**
  <br/> Switching reasoning levels mid task invalidates the cache, as you said.

What I do is at least 3 separate sessions (as described) above. Keeping them all in one session Extra High made it go all over the place in my case and never yielded any good result, except for very simple tasks.

Moreover, Sol Extra High tends to overcomplicate things when executing by itself. It doesn’t strictly follow its own plan by adding many things and tests that I never asked for. I prefer Sol High as it tends to be less “adventurous” then I get Extra High on the last separate session just to check and fix it without inventing or doing unnecessary things. It’s better anyway having a new session to audit the work, to avoid its own bias.

Works well for me, but probably not the same case for everyone.

Do you do one session with Extra? Are you happy with the result and usage?

- by [unknown](#) **&#x21C5; 1**
  <br/> I do the same but one reasoning level lower. Sol high plans, medium executes, high reviews and refines

- by [unknown](#) **&#x21C5; 5**
  <br/> This is one of the thing that people do, but no one stopped to ask if it's efficient/correct or not. In my opinion, planing is not that important, implementation requires more thought and precision. Also the difference between planning and implementation is not as big as people thought. You'll need to start implementing to notice something is missing to revise your plan. That's why if you just as the AI model to make a plan, it'll spend a lot of time to just find all the edge cases and make a perfect plan. In the end I'm not sure if it's even cheaper to do so. For me I always use sol for everything. It's better to change the thinking budget than to the model.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yep, many irrelevant edge cases that require human interaction to silence

- by [unknown](#) **&#x21C5; 4**
  <br/> Sol low for everything. Get it right first time, fast because fewer tokens.

- by [unknown](#) **&#x21C5; 6**
  <br/> No, Luna is barely as thorough as Sol. I only use Luna for very deterministic simple jobs. It is terrible at complexity

- by [unknown](#) **&#x21C5; 3**
  <br/> Smaller models think less during implementation, meaning they tend to follow the plan more closely and don't make big turns right in the middle of if because their loop logic suddenly decides that this plan is no good anymore.

It's faster and costs less too.

- by [unknown](#) **&#x21C5; 5**
  <br/> I let SOl make the plan, and even let it monitor Luna so it can steer it if it drifts :D

- by [unknown](#) **&#x21C5; 1**
  <br/> Wouldn't that eat your limits faster than just using Sol? Cache hits must be low with this method.

- by [unknown](#) **&#x21C5; 1**
  <br/> So far it seems to work nicely.Sol is not reading every thought and message, just checks every now and then to see how it goes.When it thinks it needs to steer, it reads the code changes and corrects Luna.

- by [unknown](#) **&#x21C5; 7**
  <br/> I wouldn't trust coding tasks to Luna. Luna is good Linux administrator, but not smart enough to be a dev. Sol would probably end up spending as much tokens fixing mistakes as it would use directly implementing the code.

Of course this is my opinion only. Some people even use Qwen 27b or smth for implantation. It is better not to look into such code. Lol.

- by [unknown](#) **&#x21C5; 4**
  <br/> That's been my experience with it too. I use Sol medium for most tasks.

- by [unknown](#) **&#x21C5; 1**
  <br/> I really don't agree.

Luna does narrowly scoped code better than Sol since Sol overengineers and if you tell Sol to not overengineer it just does the same thing as Sol but at 15x higher cost. Have Sol review it afterwards, use linters etc, and you're going to get the same result for all the "intelligent enough" agents and the difference is just cost.

What I found Luna really sucks at is documentation.

- by [unknown](#) **&#x21C5; 2**
  <br/> Is the one I can afford XD

- by [unknown](#) **&#x21C5; 2**
  <br/> I’ve been “building” something I am calling task ledger. I have sol as the orchestrator, and 2 available subagents defined in the toml files so they can be configured by the consumer.

The first is “worker_complex” which is Terra, and “worker_routine” which is Luna. I have sol break the spec down into tasks, and write them durably to a SQLite ledger. SOL starts, and decides which version of the sub agent to give which task and whether things can be parallelized. It spawns the corresponding sub agent, which works in a git work tree. When the subagent is done, SOL does a code review of sorts. If it’s good, it gets merged in. This is repeated for the number of tasks

It’s working pretty well. I tried lots of variations and have been using sol to analyze all the threads to measure token usage and try to optimize.

- by [unknown](#) **&#x21C5; 2**
  <br/> I do it all on Luna XHigh because my Plus goes out real fast.

- by [unknown](#) **&#x21C5; 2**
  <br/> When u get splurge money it’s sol for planning and execution. Objectively speaking you should never use a less intelligent model

- by [unknown](#) **&#x21C5; 3**
  <br/> I would never in a million years ask Luna to code anything. I can barely stomach what Sol/xhigh produces.

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s okay. I use it but I have to manually review its output. Works for me. Will work against vibecoders.

- by [unknown](#) **&#x21C5; 2**
  <br/> Especially after the latest price cuts, after planning I let it make the first one shot implementation to have a solid foundation. Then I use Luna to iterate on the easier details.

- by [unknown](#) **&#x21C5; 4**
  <br/> The price cuts don’t affect the subscription allowances.

- by [unknown](#) **&#x21C5; 1**
  <br/> I still have some tasks that I will need a step up from Sol to solve. I guess it depends on what you are doing.

- by [unknown](#) **&#x21C5; 1**
  <br/> No

- by [unknown](#) **&#x21C5; 1**
  <br/> I honestly feel like the error from Luna Max sometime cost me extra time to QA and eventually need to have Terra Max to fix it, or even Sol high to fix it just In case

I am currently at Sol med/high and Terra Max back and forth with only simple task assign to Luna Max

- by [unknown](#) **&#x21C5; 1**
  <br/> i use sol ultra for managing + plan + validation, terra max for execution + a separate sol max critic (also sometimes fable/opus for extra validation)

- by [unknown](#) **&#x21C5; 1**
  <br/> What kind of work do you do where Sol Ultra works well as the main designer and orchestrator?

I find that Sol Ultra and Fable have a tendency to make even the smallest of tasks into a whole day's work and tens of thousands of lines of code.

Sol xhigh works best for me for both planning, implementation and review, provided I keep it on a very short leash during the planning phase, and don't allow it to postpone the actual work with excuses of required preparation, frameworks and foundations.

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm just having Sol do everything. Not really seeing the usage issues other are seeing, so I suppose it depends on your workflow

- by [unknown](#) **&#x21C5; 1**
  <br/> I make the primary agent implement and hand off acceptance to a subagent. Both running Sol. The inverse approach (primary orchestrates and reviews, subagent codes) takes an average of a whole hour and is slow as balls. I gave up on that approach.

- by [unknown](#) **&#x21C5; 1**
  <br/> I’m actually using Luna Max for everything now, but all commits that affect backend are automatically reviewed by Sol High.If it passes - ok. But most of the time it finds some issues, main agent fixes them and sends for another read-only review

- by [unknown](#) **&#x21C5; 1**
  <br/> The beauty of coding agents is that you can ask it to do an eval for you. Tell it what to compare and suggest what to compare and do it, and most importantly, read the findings yourself.  Don’t trust its conclusion entirely.

- by [unknown](#) **&#x21C5; 1**
  <br/> depends what you value more. time or quota consumption. For me its time.

I use sol max and chatgpt pro to plan and then sol max to execute. Why? because strategic way to use most of the quota then maybe a reset may happen.

When i get to last 5% weekly left i switch to chatgpt pro and luna max to execute. Execute with luna is alot of back and forth though. i usually just do basic UI/UX clean up for this.

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ve been using Sol Medium for audits and brainstorming, writing specs and tasks files and then handing off to Sol Light. Works well!

- by [unknown](#) **&#x21C5; 1**
  <br/> I find this approach a bit problematic despite it being recommended.

Firstly there's context loss if you change model reasoning which destroys your usage. But I imagine you can get around that with "Spawn a Luna Agent for implementation", I've been too dry on usage with a migration to really take any chances on that.

I have found genuine safe havens with higher models doing implementations though, contradictions they'll spot and so on, however the best compromise is what another comment already said, get ChatGPT (Website on High) to access your repo in a read only state (Its CI Access is incredibly unreliable for me) and get it a basic workflow of, "You make the docs/plans and audit what the agent just did in its latest checkpoint, then hand me back an updated complete plan md and relevant repo doc changes in a zip and a modest prompt"

This is amazing if you're patient enough for it. The audits are sol high (and you can go a step further and ask for technical decompositions of the plans too) and usually pin point the problems very well for correction. Use this and you can get away with cheap models or lower reasoning a lot more often.

Running Sol Ultra for a full new shitty widget is still a guilty pleasure of mine though.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna for orchestration, and let it pick the right model for the task in other threads

- by [unknown](#) **&#x21C5; 1**
  <br/> I tried but never work for me. Maybe my projects are mostly not software engineering but it rarely works for me.

- by [unknown](#) **&#x21C5; 1**
  <br/> Why not use terra ??

- by [unknown](#) **&#x21C5; 1**
  <br/> No. Sol for both with safe guards. Can’t knew it.

- by [unknown](#) **&#x21C5; 1**
  <br/> I never let luna code anything important - it's just to stupid to look beyond the immediate code.

- by [unknown](#) **&#x21C5; 1**
  <br/> Fable for orchestration, Sol high/xhigh for work

- by [unknown](#) **&#x21C5; 1**
  <br/> I let Sol plan and design UI/UX stuff. Terra implements, reviews and does triage. I also implement Sol medium as the escalation focal point because even Terra xhigh is sometimes completely clueless. Luna writes code through strict instructions from Terra (and sometimes Sol directly) and then the feedback loop starts where Luna makes mistakes, Terra spots them, Luna corrects, Terra spots more mistakes, ... until finally the end result is working. This sounds wasteful at first glance but it isn't. If you would put Sol and Terra only on a task, it will burn through the allowance at an alarming rate. It's far cheaper to have Luna just pile up code, let Terra review and implement and let Sol step in when Terra runs repeatedly at a wall.

- by [unknown](#) **&#x21C5; 1**
  <br/> I use Opus Plan / Opus Implementation / Opus Review. It takes a lot of time. Since Sol is so much more efficient (can't use it though - my company only allows Anthropic models), using Sol for everything should be quite quick and with high quality. Is it even necessary to switch to Luna for implementation?

- by [unknown](#) **&#x21C5; 1**
  <br/> It depends. SOL Ultra for investigation and planning is perfect. Then if it is a simple implementation you can use Luna Max without problems. But if you need something that have to work with external services is better to use SOL medium/high to take decisions every time.

Plan: UltraWill u use external services? Medium/HighIs it a local project? Luna Max

- by [unknown](#) **&#x21C5; 1**
  <br/> Personally I plan with sol (sometimes I use the ChatGPT app to produce a PRD based on the GitHub code and my requirements).

Then I move to opencode to Craft an implementation plan using my local plugins etc... (With sol)

I then build with 5.5 which I find very effective

- by [unknown](#) **&#x21C5; 1**
  <br/> Am I the only one who would rather implement with deepseek v4 flash than with luna? I don't know why, but flash just seems to do a better job once a good plan is written.

- by [unknown](#) **&#x21C5; 1**
  <br/> Tenho escolhido o sol high ou superior pra Orchestrar e criar o plano, e peço a ele pra usar subagentes no nível de raciocínio necessário por tarefa, sem comprometer a qualidade do código,  e tem dado certo por aqui.

Ele dispara em media 2 a 3 subagentes luna, realiza as tarefas com velocidade,  e sem custo excessivo, e já revisa no fim. Tem sido um caminho sólido aqui.

- by [unknown](#) **&#x21C5; 1**
  <br/> Just setup DeepSeek Harness at this point for querrry work it's excellent. I have burned over 20 millions tokens in last 24 hours and it costed me 2.21$. It is very good dual setup for me as I need to go through massive amount of data for my research. The final check comes with soul so it can operate over filtered work and not indulge in querry work too much. This is the single culprit of running out of quota

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol ultra to start then sol high for everything, pro x5 user

- by [unknown](#) **&#x21C5; 1**
  <br/> Beter Call Sol

- by [unknown](#) **&#x21C5; 1**
  <br/> If you habe enough tokens, there is no reason to switch to Luna.

It depends on many variables.

- by [unknown](#) **&#x21C5; 3**
  <br/> If you have enough money, you don’t even need to use Codex just hire programmers.

- by [unknown](#) **&#x21C5; 2**
  <br/> Who will probably use codex hehe
