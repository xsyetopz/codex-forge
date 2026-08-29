# How you decide which model to use? [Visit](https://www.reddit.com/r/codex/comments/1vthusu/how_you_decide_which_model_to_use/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Isedo_m](https://www.reddit.com/user/Isedo_m/)

### **Vote:** 11

---

Hi folks, how you decide when use SOL, Luna or Terra? And when use light, medium or high?
---

## Comments 18

- by [unknown](#) **&#x21C5; 7**
  <br/> I only use 2 models. Luna Max and Sol High. Nothing more.

Reason is simple. Luna Max is so cheap and very close to Sol Medium in coding. So because of price and capabilities I use Luna Max as the default subagent.

Overall my default model is Sol High.

If I need fewer capabilities then Luna Max does the work. If I need more capabilities then I use Sol High.

I do not go above High on Sol because the cost gets way too high. The difference between High and Max is not even around 5% from the official benchmarks and also from my own personal benchmarks. So for me the extra cost is not worth it.

How I use them is simple.

Sol High is the default orchestrator. It writes the plan, decides what needs to be done and reviews the work.

Luna Max is the default subagent. It writes the code and does most of the actual work.

If Luna Max is not doing the work well enough and the task needs Sol High level quality, then Sol High as the orchestrator creates a new Sol High subagent for that specific work. That subagent does the task, Sol High reviews it and then it is gone.

All of this happens automatically. I do not manually tell it which model to use every time because I already explained all of this in detail in my [AGENTS.md](http://AGENTS.md) files.

Why not Terra?

Honestly when I compare price and quality I do not really have a good place for Terra in my system. It is a great model but there is just no room for it in my workflow because Luna Max is very underrated and kind of a beast for the price.

- by [unknown](#) **&#x21C5; 5**
  <br/> I agree, I always use Sol for design and luna for implementation. But I am not sure who should write implementation plans, any suggestions?

- by [unknown](#) **&#x21C5; 2**
  <br/> I personnaly use Chatgpt Pro for that

- by [unknown](#) **&#x21C5; 1**
  <br/> This is the way.

- by [unknown](#) **&#x21C5; 2**
  <br/> Fair Question!.

I think about it in 2 parts. The model itself and how much usage it takes.

Sol is the best OpenAI model for me, but it also takes a good amount of weekly usage.

But best does not mean we should use it for everything.

Luna is actually very good too. Think about it like cars. You can buy a good car that takes you from A to B perfectly fine, or you can buy the most expensive car in the world that does the same thing with more comfort and extra features.

Luna can already do most things very well, and when you look at usage it is extremely cheap.

Now think about what takes most of your usage when doing a task.

It is usually the actual coding.

So what I recommend is simple. Let Luna handle coding and the other usage heavy implementation work.

For everything else I use Sol. Planning, implementation plans, documentation, reviews and orchestration.

Those things use much less compared to writing all the code, so you get the better model there without really feeling it much in your weekly usage.

In my global files I also tell Sol that Luna Max is the default subagent. Sol High should only create another Sol High subagent when Luna is struggling or the task really needs it.

I have been using it this way and honestly it works really well for me. Quality stays good and I do not really run into usage problems.

- by [unknown](#) **&#x21C5; 1**
  <br/> Can you share the relevant parts of your agents.md file to decide which model it goes to and to make sure subagents are actually being used?

- by [unknown](#) **&#x21C5; 1**
  <br/> Thanks for all of your answers guys. The method described here actually feels to me like the right setup.

May I ask how you tell Codex to use sol for thinking and lune for coding?

- by [unknown](#) **&#x21C5; 1**
  <br/> Talk with Sol about this problem and the proposed solution. I want this added to the global files.

Share this content with Sol, and if needed, also share my first and second messages with Codex using Sol High. It should handle everything, write the global instructions into the AGENTS.md file, then read the file back and verify that everything is correct.

One more thing to add, there should be a limit on how many subagents can run at the same time. The default should be Luna Max, with a maximum of 2 subagents running concurrently. This prevents it from launching something like 20 subagents at once.

You use your default Sol on High

- by [unknown](#) **&#x21C5; 2**
  <br/> Yo uso Sol - Medio o ALto todo el tiempo, cada vez que intento Luna para algo, termina fallando, y Terra me ha dejado tirado varias vecs, Sol hace el trabajo bien el 90% de las veces. Uso Luna para subidas a git, generar instaladores, pedir que me instale la ultima version en el smartphone etc.. cosas sencillas.

- by [unknown](#) **&#x21C5; 1**
  <br/> Mostly use Sol low. I feel it overengineers way less this way. Ocassionally i switch to Sol medium for more complex bugs. I dont use Terra at all. For basic tasks I use Luna High

- by [unknown](#) **&#x21C5; 1**
  <br/> easy. i only use sol high

- by [unknown](#) **&#x21C5; 1**
  <br/> I always use Sol and I play with the reasoning level between medium-high-xhigh depending on the task: medium for isolated or mechanical changes, high for design/architecture/implementations from scratch, xhigh when I need to work in a large repo or when the task is very difficult and requires analysis and research.

I work in a single agent in short iterations most of the time. Occasionally I tried more elaborate constructs with Sol xhigh to orchestrate and review a couple of Sol medium or Luna max agents but I just don’t like the workflow and I prefer shorter loops and small increments I can review and steer.

- by [unknown](#) **&#x21C5; 1**
  <br/> Better ask Sol

- by [unknown](#) **&#x21C5; 1**
  <br/> Ahhahahahah

- by [unknown](#) **&#x21C5; 1**
  <br/> terra medium

- by [unknown](#) **&#x21C5; 1**
  <br/> Just pick one and play. You’ll develop a feel based on your usage, limits, and what tasks you want to give t. Honestly, playing around with it is gonna give you much more than whatever someone on internet will tell you BUT other opinions will help you identify your own observations.

For example, i think Sol is a really good model but its the one I use least, because it tends to over engineer tasks. When using it to review existing work or define high over achitecture, Sol is amazing. But even for regular orchestration i dont like it. + it consumes the most tokens. Terra + luna is my sweet spot.

- by [unknown](#) **&#x21C5; 0**
  <br/> i use sol max or ultra, no point in dicking around with getting something half-working with a lower model and having to give feedback to the model and it doing more work will probably even out the amount of usage anyway when you factor in fixes.
