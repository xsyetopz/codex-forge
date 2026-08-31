#Codex stuck in a 5-step "thinking" loop every single prompt. Anyone else? ​ [Visit](https://www.reddit.com/r/OpenaiCodex/comments/1w24mxa/codex_stuck_in_a_5step_thinking_loop_every_single/)
### **Subreddit:** [r/OpenaiCodex](https://www.reddit.com/r/OpenaiCodex)
### **Author:** [Party-Change3075](https://www.reddit.com/user/Party-Change3075/)
### **Vote:** 2
---
Hey everyone,
​For the past few hours, every time I run a prompt, Codex gets stuck in a loop—it goes through roughly 5 cycles of "thinking/reasoning" before either failing, timing out, or spitting out a generic response.
​Symptom: Constant multi-stage thinking loop (repeats ~5 times).
​What I've tried: Restarting the session, clearing cache, shortening prompt length.
​Is this a known bug with current server loads, or is there a workaround/setting to bypass this loop? Any insight is appreciated!
---
## Comments 6

- by [unknown](#) **&#x21C5; 1**
  <br/> Change you custom instructions to force logical progression also structure your prompts that way too. Variable Unchanged retry: false variable changed retry: true maximum number of retries without variable change: 3

- by [unknown](#) **&#x21C5; 1**
  <br/> What model/effort ?

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ve had this happen a couple times in the past week.  When I asked it what the hell it was doing it apologized and said it was overthinking the problem and the finished.  Weird

- by [unknown](#) **&#x21C5; 1**
  <br/> When you say you tried restarting the session, do you mean you closed the session, and resumed the same session?

How much context window were you using up?

Which model and reasoning level?

- by [unknown](#) **&#x21C5; 1**
  <br/> Is the loop the same five thoughts with zero tool calls? If yes, open a brand new session (not a resume) and strip custom instructions for one prompt. Instruction loops and fat resumed context both recreate that pattern.
