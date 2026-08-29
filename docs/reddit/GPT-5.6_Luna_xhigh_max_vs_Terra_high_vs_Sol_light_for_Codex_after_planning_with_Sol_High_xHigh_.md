# GPT-5.6 Luna xhigh/max vs Terra high vs Sol light for Codex after planning with Sol High/xHigh? [Visit](https://www.reddit.com/r/codex/comments/1vhw0iw/gpt56_luna_xhighmax_vs_terra_high_vs_sol_light/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [BeautifulWestern7736](https://www.reddit.com/user/BeautifulWestern7736/)

### **Vote:** 5

---

Hi guys, I’m on a ChatGPT Business plan and I’m trying to optimize my Codex workflow for both cost and performance.
My current idea is to use **GPT-5.6 Sol high/xhigh for planning**, then switch to a cheaper model for the actual implementation/build.
For those who have tested this workflow: after planning with Sol high/xhigh, are you getting better results implementing with **Luna xhigh/max, Terra high or Sol light**?
Since Luna’s recent price reduction, its benchmark results seem surprisingly close to Terra/Sol while the cost per task is dramatically lower.
Basically, I’m trying to understand whether **Sol high/xhigh → Luna xhigh/max** is now the sweet spot, or whether **Terra high** is still worth the extra cost for implementation.
If you’ve tested both on real repositories, I’d be interested to hear what worked better for you
---

## Comments 13

- by [unknown](#) **&#x21C5; 5**
  <br/> What I prefer is to have a clever model cutting down the big task into subtasks, and the subtasks get different models assigned to. Very simple stuff like running automated tests or exploring repo is Luna, standard development tasks Terra (because in comparison I find it faster than Luna) and Sol for the very complicated tasks, or when Terra keeps failing. It is possible in the whole plan there is only one subtask which is a bit more complicated, you don't want to botch that. (but to be honest I can do this only with OpenCode, couldn't figure out how to set this up with codex)

I found that Luna is slower, maybe not in the tokens per minute stat, but it generates more tokens and more steps to complete a task compared to Terra.

- by [unknown](#) **&#x21C5; 2**
  <br/> So, basically... you want Codex to detect which model fits the best for a specific subtask ? That is never gonna happen.. Too many models and i'm pretty sure most are overrated, fake benchmarks

- by [unknown](#) **&#x21C5; 1**
  <br/> It is already happening with my opencode orchestration, i was just lazy to figure out how to make it with codex

- by [unknown](#) **&#x21C5; 1**
  <br/> And how are you sure that the selected model is the best fit ? How do you know the result provided is not the one expected in comparison with a better model, even when both models as comparison gives the same result ? Does the lower cost model implemented something that thr higher cost couldn't or otherwise ? You simply cannot know if the selected model is the best fit, you must take in consideration many many factors

- by [unknown](#) **&#x21C5; 1**
  <br/> Ok, I don't overcomplicate it this much. Basically I just choose between terra high, sol high or luna medium, and at home I add Kimi K3 to the mix, and at office I add Opus 5 to the mix. It is a really simple instruction, basically like this. (And I have similar instructions for dispatching testing - reviewing subagents as well). The goal is rather -> you don't have to choose one LLM to implement the whole thing with, you can mix them depending on the subtask.

- Route UI/UX, visual, responsive, layout, interaction, and design-polish tasks to the `designer` subagent.
- Choose the cheapest coder likely to complete the task reliably:
  - `coder-luna`: narrow repository exploration that needs delegation, read-only Git or shell inspection, and Git operations such as status, diff, commit, and push. Keep implementation work on Terra unless it is truly trivial.
  - `coder-terra`: the default for straightforward, well-scoped coding, localized bug fixes, routine refactors, configuration, documentation, and mechanical changes.
  - `coder-sol`: complex or high-risk work involving architecture, subtle debugging, security, concurrency, performance, broad cross-cutting changes, or recovery after Terra cannot solve the task.
- Use `coder-kimi` only when a plan supplied as input or loaded from a saved plan explicitly assigns work to `coder-kimi`.
- When complexity is uncertain, start with `coder-terra`; do not use Sol merely because it is available. Escalate to Sol when the task itself or concrete evidence justifies it.

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm just gonna say something short : For something efficient, in your case results because everyone whats the best model by cost/performance you need to overthink and overcomplicate things. There is nothing simple related to AI, specially when you deal with many models.

- by [unknown](#) **&#x21C5; 1**
  <br/> Interesting, thanks. When you say Terra feels faster than Luna, do you also find that Terra has a noticeably better first-pass success rate on standard coding tasks, or is the main difference just fewer tokens/steps and lower wall-clock time? Also, which Luna effort level were you mostly comparing against Terra?

- by [unknown](#) **&#x21C5; 1**
  <br/> I think i used xhigh with both, and when terra was finished in 48 sec luna needed a bit above 3 mins. They both completed the task well though. But I am on the 5x sub so i prefer finishing faster; it matters if something gets finished in 20 mins vs an hour

- by [unknown](#) **&#x21C5; 4**
  <br/> Sol high/xhigh for planning? I'm on the £20 plan, I don't have that many tokens! I use Sol low or medium for planning.

Luna is terrible, I tried it, can't really trust it, even if it's given step by step detailed instructions by Sol.

Terra high is basically the same price as Sol low, and Sol low does a far better job regardless of what benchmarks say. So the only value you get is by using Terra on medium, which is about half the cost of Sol low. Unless it repeatedly fails, in which case just hand over control back to Sol low and be done with it.

tl;dr on £20 plan, Sol low or Terra on medium are the only viable models. Sol medium for extra extensive planning.

- by [unknown](#) **&#x21C5; 1**
  <br/> Simple answer: use luna max for implementing

- by [unknown](#) **&#x21C5; 1**
  <br/> why max and not high or xhigh? I'm new to codex

- by [unknown](#) **&#x21C5; 1**
  <br/> from my experience, each luna reasoning level add a lot more intelligence. Luna Max is kind of the sweet spot if you don't have the money for Sol. I would never use Terra high over Luna max.
