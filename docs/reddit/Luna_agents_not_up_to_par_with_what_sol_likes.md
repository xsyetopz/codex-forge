# Luna agents not up to par with what sol likes [Visit](https://www.reddit.com/r/codex/comments/1vhis2q/luna_agents_not_up_to_par_with_what_sol_likes/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [No-Force546](https://www.reddit.com/user/No-Force546/)

### **Vote:** 24

---

Ive been messing around with luna max to do my coding but every time I have sol high review it. It finds something wrong. Has anyone else experienced this?
I get sick of switching back and forth and just have sol medium or high do it
---

## Comments 32

- by [unknown](#) **&#x21C5; 7**
  <br/> I tried using Luna Max for orchestration. I ended up with a useless codebase that was overengineered and nonsensical. The program runs, but no one has any idea what's going on. Started a greenfield rewrite with Sol High as the orchestrator, and trying to deliberately code in smaller chunks. So far it's progressing in a much more orderly fashion. I'm not sure what is just my own lessons learned about letting codex go without a planned staged project spec, and what is due to the model. But I think I'll keep sol high in play, even though it means I have to slow down the project. I think the overall quality improvement will be worth the slow down.

- by [unknown](#) **&#x21C5; 2**
  <br/> I tried using Luna Max for orchestration

    these terms are poorly defined. you are really talking about planning. orchestration is easy and can be done by a script.

if you have a dumb model write the plan as you go, you will get a dumb result. so you need to either change how you work and plan more with a smart model ahead of time until tasks are decomposed enough for a dumb model to execute without difficulty, or you need to just pay up and brute force everything with the smarter model on the fly.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah I think you are right just go slower and use the best model.

- by [unknown](#) **&#x21C5; 3**
  <br/> Same. Luna is cheap but it leaves lots of work behind and then needs a better model to clean it up. Just spent 1% of weekly letting Luna max do an update, it messed up a database migration, manually fixed it so the migration records were out of sync after that and then had 5.5 high fix it and burned 10% weekly.

On the other hand, I had Luna run benchmarks on some onnx models and it did an excellent job. It has to find the best quantization config and produce a quantized onnx model. It ran for an hour, created a dozen or so quantized models, benchmarked each and provided a really good report at the end with a clear winner.

I won't be using Luna for coding tasks anymore, but for repetitive tests or benchmark comparisons it's a great tool

- by [unknown](#) **&#x21C5; 3**
  <br/> You can have sol xhigh implement stuff and Luna will find something wrong with it.. theres always bugs you need to decide whats worth fixing and not.

- by [unknown](#) **&#x21C5; 3**
  <br/> From my experience with the AI tools I'm building, only Sol Extra High or Max can get the job done. I tried Luna Max on 1 simple task that was to add some extra buttons to my app and the regression hit so hard it set me back a week. Even Sol Max had a hard time and couldn't even perform a proper rollback. If you want the bones done quick and dirty, use the lower cheap models. If you are in polishing phase, use Sol Max or it will cost you.

- by [unknown](#) **&#x21C5; 2**
  <br/> Try Terra agents. Luna is a quite small model. It's good at very focused coding tasks but does not have a lot of general knowledge.

- by [unknown](#) **&#x21C5; 2**
  <br/> every time I have sol high review it. It finds something wrong

    the answer depends on what sol finds. sol is very smart and can find lots of inconsequential non-problems to change. but if it is finding serious problems, then you simply made a mistake giving luna a task that was too difficult for it. you need to decompose future tasks further with a smarter model until the tasks are within luna's capability, or you need to step your current tasks up to a smarter model to brute force them for you.

imagine you had a model that couldn't do 1+1=2. you would stop giving math to that model. there's no point using a model on a task if the reviews of it are always coming back with critical blocker issues.

also imagine how bad the code must be for a model from the same company to find blockers. similar training data and blind spots, and you presumably aren't using any advanced review process to enhance performance, and you probably aren't evaluating anything that is happening, like the effectiveness of your prompts. the code is probably really bad. this is why smart expensive models are a godsend to vibe coders, because you can spend money to just get better at everything.

- by [unknown](#) **&#x21C5; 2**
  <br/> Darf ich mal fragen wie dein setup so funktioniert? Sol verwendest du als planer zum Beispiel und wie klein würdest du die Aufgaben machen lassen bzw zerlegen, damit du luna erst ran lassen würdest? Bzw wie klar müsste der prompt sein, damit ein kleineres model wie Luna es schaffen würde.

Ich hab das Gefühl dass meine prompts am Ende für luna wahrscheinlich immer noch zu groß sind, bisher scheint alles zu funktionieren aber hab Respekt davor, dass man am Ende erst feststellt dass es einem was kaputt gemacht hat.

Vielen Dank und schöne Grüße :)

- by [unknown](#) **&#x21C5; 3**
  <br/> I think the most common problem for a model is having its context overloaded, and then it gets confused and misses things. it's less often a problem of its actual intelligence doing something wrong. so I think a heuristic for checking if the model is overloaded is by simply spawning a fresh session of the exact same model with the exact same thinking/effort level to review the code changes. if a model of the same intelligence finds an issue more severe than a "nit" or a low-priority non-blocker, that's a good sign that it was "out of its depth". of course it's possible for the reviewer to also get out of its depth and make mistakes during the review, so I like to visually confirm reviewer token usage doesn't go above 100 000. I think ideally harnesses would let us quit loops if too much context has been reached. as context usage goes up, model capability goes down. if the context is too high, you're not getting the intelligence you paid for, and you might wish you were on a smarter model to make up for it.

for static planning, if I'm just improvising the prompt myself, I like asking for slices of work that are scored for difficulty, where low difficulty is for a child or a student, high difficulty is for a professional, and medium difficulty is in between. then afterward I ask to reslice/decompose the high difficulty slices if possible into medium difficulty. note: AI models are terrible at estimating things like this (difficulty, time, etc), so professionals use stronger methods, like file complexity, symbol complexity, cyclomatic complexity, etc. but at least for for casual use I think we can trust a cutting-edge model like sol to figure out what we mean by difficulty.

there is a risk of "drift" between the implemented work, the plan, the design, and the user's feelings about it all. so technically you would benefit from auditing the forward plan (which is basically re-planning) frequently, but that also means a lot of extra token spend, so that review is more of a way to increase quality than save money.

more advanced tools would dynamically re-slice/re-plan each upcoming task. you might even do something tricky, like always sub-planning N+1 ahead and verifying sub-plan N, each iteration.

in the past, when AI models were dumber, people would use planning frameworks like SUPERPOWERS and GSD. these ask the AI model to create many files and folders specifying everything about the work so the implementing agent wouldn't get mixed up. the problem is that I and others have found their procedures to be "overwrought", meaning they are TOO detailed and will cost too much to write, and with any drift, huge amounts of documentation need to be re-written.

I think the proper solution to this is making the plan as detailed as you the human can personally handle. the more you put into the plan, the more you will get out. it should not be larger than you can review. then, when it comes time to implement, there should be a second phase of planning, "decomposition" or what a lot of people call orchestration, where the smart AI model now plans the whole current job for the coding AI model. exactly how deep this decomposition would ideally go would depend completely on the work load and the intelligence of both models involved; it would require evaluations, and businesses would be doing that right now because they have the money and time.

TLDR: ask your planner to slice tasks into smaller tasks until they are low enough difficulty to work for your coder. there's no way to know what this is until you try it. but I think it works to ask the planner to slice down to "medium" difficulty, and then if you use a smart orchestrator, ask that to slice down to "low" difficulty before giving work to the coder.

other options to investigate:

[https://github.com/generative-computing/mellea/tree/main/cli/decompose](https://github.com/generative-computing/mellea/tree/main/cli/decompose)

[https://github.com/Yeachan-Heo/gajae-code](https://github.com/Yeachan-Heo/gajae-code)

[https://github.com/prinwinter/cope](https://github.com/prinwinter/cope)

[https://github.com/ai-boost/awesome-harness-engineering#planning--task-decomposition](https://github.com/ai-boost/awesome-harness-engineering#planning--task-decomposition)

[https://arxiv.org/abs/2605.15425](https://arxiv.org/abs/2605.15425)

[https://arxiv.org/abs/2503.12483v2](https://arxiv.org/abs/2503.12483v2)

[https://arxiv.org/abs/2605.07320v1](https://arxiv.org/abs/2605.07320v1)

[https://arxiv.org/abs/2511.04064](https://arxiv.org/abs/2511.04064)

[https://arxiv.org/abs/2602.21611](https://arxiv.org/abs/2602.21611)

[https://arxiv.org/abs/2503.09572](https://arxiv.org/abs/2503.09572)

[https://arxiv.org/abs/2604.13120](https://arxiv.org/abs/2604.13120)

[https://arxiv.org/abs/2508.18905](https://arxiv.org/abs/2508.18905)

[https://arxiv.org/abs/2510.07772](https://arxiv.org/abs/2510.07772)

[https://arxiv.org/abs/2406.04604](https://arxiv.org/abs/2406.04604)

[https://arxiv.org/abs/2605.05657](https://arxiv.org/abs/2605.05657)

[https://github.com/yanweiyue/masrouter](https://github.com/yanweiyue/masrouter)

[https://github.com/dmae97/adaptorch](https://github.com/dmae97/adaptorch)

[https://github.com/flyersworder/agent-contracts](https://github.com/flyersworder/agent-contracts)

[https://github.com/FoundationAgents/AFlow](https://github.com/FoundationAgents/AFlow)

[https://github.com/metauto-ai/GPTSwarm](https://github.com/metauto-ai/GPTSwarm)

[https://github.com/nilesh2797/lattice](https://github.com/nilesh2797/lattice)

[https://github.com/Kohaku-Lab/KohakuRAG](https://github.com/Kohaku-Lab/KohakuRAG)

[https://github.com/ozyyshr/RepoGraph](https://github.com/ozyyshr/RepoGraph)

[https://github.com/NeerajBholani/self-healing-router](https://github.com/NeerajBholani/self-healing-router)

BONUS DECOMPOSITION PROMPT FROM A STUDY: [https://arxiv.org/abs/2602.16873v1](https://arxiv.org/abs/2602.16873v1)

You are a task decomposition specialist. Given a software engineering task (bug report + repository context), decompose it into atomic subtasks.
For each subtask, output JSON:
{
 "id": "v1",
 "description": "...",
 "depends_on": ["v0"],
 "coupling": "weak|strong|critical",
 "estimated_tokens": 500
}
Rules:

- Maximize parallelism: only add dependencies when semantically required
- Typical decomposition: [localize files, understand context, generate patch, verify patch]
- Coupling = strong when output of one subtask is direct input to another
- Coupling = weak when subtasks share domain knowledge but not data
Task: {task_description}
Repository: {repo_context}

- by [unknown](#) **&#x21C5; 2**
  <br/> That sounds about right. And she's pretty confident when she shouldn't be and can be stubborn too.

———

For example:

If you're trying to download a Reddit video that cannot simply be right clicked to Save As, if you give the prompt to even **Sol (Light)** to "download the video from the pasted link", Sol immediately preps the yt-dlp and if needed, ffmpeg too, grabs the video and it's saved.

**Luna (Light)** will get blocked by the Reddit site and give up. Unless you direct her to use yt-dlp. Even then, she'll struggle to set it up before getting the video.

**Luna (Max)** will also get blocked and doesn't give up. She'll fail several times before coming to the conclusion to use yt-dlp. She'll fumble with that for a bit and eventually get you the video.

———

But now, instead of a hard failure like getting blocked by Reddit or not being able to setup yt-dlp, it's your code she's responsible for. She codes, she tests, and if it passes, she's happy.

This next one, Luna doesn't actually make this mistake, but just as an example of what kind of mistake it could be if it were relevant to your code.

Say you're making a sign up page that has fields for date of birth, a phone number, and email address. Luna will notice she has a bunch of text fields to setup and just make them all text fields, test it with data, and it all checks out for her. And it still works, but there is more room for user error.

Sol takes a look at that work and wonders why there isn't input validation on date of birth, the email-address, or the phone number. And notices there isn't any information about required fields or error notifications when trying to submit a blank form or form with mistakes. If taken as is, somebody could type a phone number in the email field or type an email for their date of birth. And Sol isn't happy with that.

And something Sol does without having to be told, Luna (Max) may need to have a morning meeting first.

Those kinds of things, but more relevant to what you're doing.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol medium is also very picky . I’ve had best luck using Terra and then having SO review or using grok in cursor and letting sol review .

- by [unknown](#) **&#x21C5; 1**
  <br/> Can you explains what you app does? Im trying to understand why I can build large SaaS style applications with Luna Medium with no issues working bit by bit, first pass frame work, second part enrichments, iterate, maintain documentation, split chats into specific feature sets, where others struggle to choose a strategy to use.

- by [unknown](#) **&#x21C5; 1**
  <br/> Could you please clarify what exactly you mean by building a large SaaS? I often encounter such statements in my work, but in reality, these are simple services that have already been created thousands of times and are available on Git, in which case Luna will most likely cope.

However, if we're talking about a unique service, such as a billing service that involves the disparate import of big data, followed by processing, normalization, building a structure between them, optimization, and so on, then Luna, even with the most detailed and structured plans, cannot accomplish these tasks. Moreover, my experience working with SOL shows that SOL is only capable of this if it is carefully guided at every stage.

Therefore, you have to recognize that what you do is not the same as what others do, and what you consider difficult and big is not necessarily so.

- by [unknown](#) **&#x21C5; 1**
  <br/> Great detail I like that.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yea sol just is better

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm using Sol for creating architecture, a blueprint, if you like, which uses much less usage/tokens than as if it written all code by itself. Then I pass this architecture to Luna xHigh and it does great.

- by [unknown](#) **&#x21C5; 1**
  <br/> And people downvote me for using sol xhigh start to end

- by [unknown](#) **&#x21C5; 1**
  <br/> finding something wrong in a code review is not a problem, that's why you do code reviews. it could also be indicative of issues with the original plan

- by [unknown](#) **&#x21C5; 1**
  <br/> When I work with Luna workers, I usually create a plan beforehand and write it down in an MD file so the Luna and Sol agents share the same picture.AI is non-deterministic. If you don’t have a reference for the agents to follow, they might start finding issues or hallucinating implementation problems everywhere.

Also, what are your review criteria? If you just tell the agents to “find bugs” or “review the result,” the agent may come back with dozens of findings. That’s how they were trained: to keep you engaged in longer sessions.

You should be more specific with your review prompt and criteria so the agent can be more precise. For example, tell it to avoid nitpicking, modifying random documentation files unnecessarily, or flagging purely stylistic or formatting issues.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol always finds issues with the code Sol wrote… there is nothing Sol loves more than hardening the codebase to protect against absurd edge cases that would never actually arise in the real world

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna is not capable enough and is suitable for simpler tasks only, as much as deepseek flash or GLM is.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol xhigh to plan...... Luna Max to implement....... TypeScript project........ Very happy with results........

- by [unknown](#) **&#x21C5; 4**
  <br/> Yes that's what I've been doing sol give me a focused plan for Luna Max then you can review it. Doesn't work good for me. Does that work for you?

- by [unknown](#) **&#x21C5; 1**
  <br/> How u use luna max together with sol?

- by [unknown](#) **&#x21C5; 2**
  <br/> Better workflow is to use orchestor and reviewer with luna to maintain the code quality and to keep in the scope. But we are not able to use with sol. Terra is the only option with sol model.

- by [unknown](#) **&#x21C5; 1**
  <br/> That's not true, Sol spawns Luna just fine.

- by [unknown](#) **&#x21C5; 1**
  <br/> How you do that? Call luna first than switch to sol?
