# I find the differences between Sol, Terra and Luna not clear at all. [Visit](https://www.reddit.com/r/codex/comments/1v6nwfa/i_find_the_differences_between_sol_terra_and_luna/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Zestyclose_Bat8704](https://www.reddit.com/user/Zestyclose_Bat8704/)

### **Vote:** 72

---

Like I get it that Sol is more intelligent than Terra and Luna.
But what exactly does it mean? Why do we even need three levels of intelligence? Isn't the effort supposed to work as kind of an intelligence?
Is one model better for certain tasks and worse dor other tasks? If yes what tasks?
I always find very vague answers from OpenAI that do not go into specifics
---

## Comments 31

- by [unknown](#) **&#x21C5; 15**
  <br/> ChatGPT can answer this pretty well, but in general: the model type determines the upper limit of what it can do, reasoning effort is how much it tries. For example: will it do more checks on correctness or call it a day.

Luna is good at coding as long as you spec exactly what you want, and it’s very token efficient. Terra codes well and can review. Sol is excellent for planning, thinking outside the box. It is a waste to use it for coding as default.

Best is to use Sol to spec the prompt for Luna. This way you get Sol intelligence but you don’t waste Sol tokens on reading and writing code. Then review by Terra. Repeat.

Using all of them on medium is a very good default, use high if medium fails. If that still fails, move up a model.

- by [unknown](#) **&#x21C5; 21**
  <br/> I use codex for maintaining an community made SDK of a European brokerage. They don't provide an API themselves, so I use luna for one-off tasks like downloading the bundle of their website and diffing it with the local copy I already have.

I use terra for when things get stuck in CI/CD. If something of the code is broken, I give the output of Terra to Sol. I use exclusively SOL for the code of the SDK itself, because Sol understands my *intention* and the way a senior would architect the code more often than e.g. Terra.

I know it's hard to quantify, and this comment is anecdotal and not evidence, but iml Sol is for the big codebase picture, terra for some mid tasks, and Luna for some simple agent tasks. I've tried terra for using in the codebase, but it gets lost on the big picture quite a bit.

edit: id like to add that terra is terrific if you add detailed instructions. But terra understands my intention less than sol. If I made explicit specs, 5.5 and even 5.3 spark also still rocks. :) it's just more about "I type less, how much does the model understand my vision" (ignore this for frontend)

- by [unknown](#) **&#x21C5; 6**
  <br/> literally the best answer and the worst answer

- by [unknown](#) **&#x21C5; 1**
  <br/> How is this the worst answer?  It's the same with Anthropic models which have 3 levels: Haiku, Sonnet, and Opus (and now Fable).  Opus understands nuance, implication, metaphor, and subtext.  Sonnet understands instructions.  And Haiku is a reckless and insane.

- by [unknown](#) **&#x21C5; 8**
  <br/> There are 12 options for 5.6 alone. How is that user friendly?  just give us an execution mode and a thinking mode and make them as efficient as possible

- by [unknown](#) **&#x21C5; 1**
  <br/> They copied Anthropic, duh.

It might seem complex but it's not really.  There are 3 levels of intelligence.  And you can have them put in a little effort or a lot of effort or medium effort.  Don't need Einstein laser focused for every day work because it's slow and expensive.  but sometimes you do.  Some tasks are actually harder than other tasks and if that's not something you run into just use the cheap ones.

- by [unknown](#) **&#x21C5; 12**
  <br/> Sol:  Refactor this class to be multi-threaded, run side by side tests to measure the speed and ensure the results are still valid. Record all output values so we can validate the improvements, and then update the documentation.

Terra:  Rewrite this class to be more efficient.

Luna: What does this function do? Also, change this function to use the new input classes.

There's a whole lot of overlap, so try to use the minimum needed for what you want.

- by [unknown](#) **&#x21C5; 6**
  <br/> I use the different models like this:

Luna: DocsTerra: Bug fixesSol: New implementations

Extra high on all.

- by [unknown](#) **&#x21C5; 1**
  <br/> May I ask what does that look like? Do you just change the model on the selector next to the send button for each prompt, in the same conversation? Or always different conversations for each model?

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah. I'll just change it based on the context. Creating new projects, I'll run Deep Research + Pro, have it generate a prompt for me, submit it like one-shot with Sol Extra High, Plan mode and plugins.

When the architecture and quality gates are hardened, I'll tune it down to Terra to fix the remaining issues, then change it to Luna for documentation before I jump into a new conversation, as [AGENTS.md](http://AGENTS.md) will refer to rules, docs and I can easily use Terra to implement. (Always Sol for new and complex problems).

- by [unknown](#) **&#x21C5; 1**
  <br/> You definitely shouldn't do it mid-conversation as this is the least efficient way to use them.  It will burn up your limits faster because every time you change effort level or model you invalidate the prompt cache and you are paying for the entire conversation history to be read fresh by the new model.  You can if you want but you're wasting your money and/or limits, it's just kinda of a dumb way to use them.

- by [unknown](#) **&#x21C5; 1**
  <br/> Too expensive

- by [unknown](#) **&#x21C5; 5**
  <br/> The cost difference between them is huge as well.

I tried with writing. I gave the same outline I cooked up for a potential chapter in a short story I'm playing with. Same rules, same outline, same style guidelines.

Sol high nailed it. Took 43 minutes. But it was done perfectly and reviewed multiple times by agents compare against the guidelines. I was seriously impressed. Spent 6% of my week, on  pro 5x.

Terra high with sub agents, same rules and everything. Took 37 minutes, and only one or two things I prohibited Took place. (Not x but y) type shit. I fixed it and moved on. 2% of my week. Probably some fractions going on, so I'm estimating about half what sol did.

Wanted to see how Luna high did too, again, same rules stipulations, all Dat.

23 minutes. 1% of a week. But riddled with mistakes I had to fix. The second pass with fresh instructions on what needed to be fixed Took an additional 19 minutes. And the percent didn't move. But it was better.

I now think of them as students in my classroom. A, b, c grade levels. A, b+, and c level students on effort and results. Speed too. Fast kid turns it in, good enough. But he's got free time now, that's Luna.

Honors kids giving it his best from all angles..  thats sol. Ignores deadlines and is a perfectionist.

Terra is my favorite. Well balanced.

Just my anecdotal test. Hope its useful to someone.

- by [unknown](#) **&#x21C5; 2**
  <br/> Try not to overthink the whole "intelligence" thing. They are tools for jobs. All useful in the right context.

Luna sprints to the finish line, doesn't check twice and doesn't ponder the consequences. Use for small jobs that don't require much thinking.Terra reasons more, produces better quality work, takes longer. Good middle ground for most users for most use cases.Sol thinks very, very deeply over every conceivable detail of the request you gave it and will work for hours toward a single goal with relentless determination. You do not point a weapon of this caliber at a simple job unless you want a confusingly complicated result that takes ages. Wrong tool for the job, in the same way Terra is the wrong tool for the kind of complicated, difficult work you would give to Sol.

- by [unknown](#) **&#x21C5; 2**
  <br/> I use Luna max as a starting point. It's cheaper and smarter than many. If it struggles, I move to Sol high.

       [](https://preview.redd.it/i-find-the-differences-between-sol-terra-and-luna-not-clear-v0-bly0e3dt0ifh1.png?width=1080&format=png&auto=webp&s=f0758b0a47e4ce20603613b9a47205b875ebed55)

- by [unknown](#) **&#x21C5; 3**
  <br/> I find you have to put Luna Max on a really short leash else it can get very lost trying to complete a task. Small scope, clear boundaries on role, limits on number of attempts before failing back to the task author for more info.

I’m working out how to do a shoot out with Sol Low as the costs should be similar. The code quality should be easy to check but the token use is impossible to measure accurately.

- by [unknown](#) **&#x21C5; 1**
  <br/> Why would token use be impossible to measure?  It's literally stored directly in the session data for every single request like this:

{"timestamp":"2026-08-28T01:10:32.623Z","ordinal":18,"type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":28057,"cached_input_tokens":11008,"cache_write_input_tokens":0,"output_tokens":174,"reasoning_output_tokens":61,"total_tokens":28231},"last_token_usage":{"input_tokens":28057,"cached_input_tokens":11008,"cache_write_input_tokens":0,"output_tokens":174,"reasoning_output_tokens":61,"total_tokens":28231},"model_context_window":258400},"rate_limits":{"limit_id":"codex","limit_name":null,"primary":{"used_percent":0.0,"window_minutes":43200,"resets_at":1790471424},"secondary":null,"credits":{"has_credits":false,"unlimited":false,"balance":null},"individual_limit":null,"spend_control_reached":null,"plan_type":"free","rate_limit_reached_type":null}}}All of your sessions are stored in `~/.codex`.  Or if you're on windows you'll have to figure that part out yourself.

- by [unknown](#) **&#x21C5; 2**
  <br/> Since it seems like there are no comments on what you were wondering about, I'll leave what I know.

Although there is no public data, we can infer that Luna, Terra, and Sol likely have different parameters.

Let's put it this wayLuna is an exceptional high school student.Terra is an exceptional graduate student.Sol is an exceptional university professor.

The more you study, the easier it is to find ways to solve a problem even when looking at the same one.

When asked to solve the same difficult problem, if you give an exceptional high school student time and resources, they can ponder, put in effort, and solve it. That's Luna.

Sol would have very large parameters and would know the cause of a problem at a glance. It's just that to solve it definitively, it looks up all related materials and strives to give a sure result.

Parameters can be talked about as experience and seen in the category of intelligence, and reasoning effort can be explained as the level of effort for problem-solving.

Strictly speaking, the intelligence talked about in current AI industry is not true intelligence; it's 'problem-solving ability.'

When you look at models that show high problem-solving capability with fewer parameters, they really work hard. They re-examine even what they already know. That's how they were trained. Was this helpful?

- by [unknown](#) **&#x21C5; 1**
  <br/> I just use sol - various reasoning levels for everything besides tasks which you can not easily mess up.

- by [unknown](#) **&#x21C5; 1**
  <br/> sol - high level thinking, abstract stuff, big picture, exhaustive implementation, a lot of contextluna - a huge amount of simple tasks, implementing something that is REALLY PRECISELY specified and requires just "to be implemented"terra - probably something in between.

though in practice i use sol high for planning / complex tasks, sol medium for the average task and luna if i have to do a lot of simple things quickly.

- by [unknown](#) **&#x21C5; 1**
  <br/> It's no more complex than having GPT 4.1 nano, GPT 4.1 mini, and GPT 4.1, completely different models in the same family with different knowledge levels and price points.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol is very deep

- by [unknown](#) **&#x21C5; 1**
  <br/> Agreed. OpenAI has an UX problem with these models. It feels like they now discovered they can finetune models with AI but no-one stopped and asked: do we really need this?

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol is an absolute DOG

- by [unknown](#) **&#x21C5; 1**
  <br/> I pay the flat $20 per month and still have access to all of them, I'm making keyframe images only and it switched to sol but I put it back on 5.5 because it's way overkill and thinks way too much yet still gives the same result. Idk

- by [unknown](#) **&#x21C5; 1**
  <br/> So, I notice that complex code has fewer bugs / more bugs found in the end result with sol over the others. But I also notice sol will dick around on forums or try to watch YouTube video tutorials instead of work. I notice many users are concerned about usage but... Sol will sometimes completely DRAIN my usage in a single day and for some reason 2 days later I have 100 percent usage again. Happened over 10 times now

- by [unknown](#) **&#x21C5; 1**
  <br/> In marketing you use 3 choices 1 cheap for the poor 2 worse than average to push the people to the most expensive

- by [unknown](#) **&#x21C5; 2**
  <br/> it's a legitimate strategy

- by [unknown](#) **&#x21C5; 1**
  <br/> Agree. It should automatically dispatch the proper model with the proper intelligence it needs for the task at hand. User shouldn’t have to manage their credits efficiently or things like that, codex could and should be smart enough to manage models for us.

- by [unknown](#) **&#x21C5; 1**
  <br/> Then people will complain about Auto not getting the job done. Cursor  doubled the credit for Auto, but nobody use it for anything but docs and asking questions like what does this function do. People just use the best model they can get their hands on for actual coding.
