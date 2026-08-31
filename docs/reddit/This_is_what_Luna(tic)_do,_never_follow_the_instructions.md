#This is what Luna(tic) do, never follow the instructions [Visit](https://www.reddit.com/r/OpenaiCodex/comments/1w2d3gl/this_is_what_lunatic_do_never_follow_the/)
### **Subreddit:** [r/OpenaiCodex](https://www.reddit.com/r/OpenaiCodex)
### **Author:** [alexanderbeatson](https://www.reddit.com/user/alexanderbeatson/)
### **Vote:** 0
---
Prompt to analyze and report the context of the database with explicit ***Do not implement anything***. Run that prompt on Max Luna, and then it *make changes on the other files* than the report md.
I have to revert to the last commit, and the biggest hassle is that there are uncommitted changes before I prompt with Luna. Yes, I cannot make commit for every sessions and I never use Luna for real implementation as it is sensitive healthcare app. So, I lost all my uncommitted Sol implementations before this.
People say Luna needs a lot of instructions. It is understandable for such cheap model.
But, NO. The main issue is that Luna **never** follows the instructions. Yesterday, I told it to change swappiness from 60 to 20, but it changed to 10. In **every** sessions (for other projects), I told it not to request access outside of the present directory, but keep requesting access to my whole workspace directory, and now make changes I explicitly tell not to do.
I have never experienced those things in DS4F/P, Q3.8Max, G5.2. And, I won't trust a single bit of Luna for not following the simplest instructions let alone the complex ones.
---
## Comments 8

- by [unknown](#) **&#x21C5; 1**
  <br/> My observations match. Gpt 5.6 models maybe more intelligent but they've failed to follow the instructions I've given too many times now that I've been using 5.5 instead and getting reliable outputs.

- by [unknown](#) **&#x21C5; 2**
  <br/> I would give it 0 intelligence if it cannot follow the simple instructions.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna does whatever it wants. The other day it worked for 16 hours to implement a plan, then 6 hours to fix several warnings the reviewer found, doing a complete refactor of what it had done before. It couldn't finish it, so I told Sol low to fix what remains to be done, and it did so in 5 minutes... Then another 30 minutes on refactoring the mess of code Luna spilled.

I'm not using Luna for anything but trivial stuff anymore.

- by [unknown](#) **&#x21C5; 1**
  <br/> Don’t worry sol isn’t much better I scrapped 5 out of 5 projects this week

- by [unknown](#) **&#x21C5; 1**
  <br/> Honestly, this never happened to me with Luna XHigh

- by [unknown](#) **&#x21C5; 1**
  <br/> Never have had this kind of issue, when it doesn't follow implicit instructions in a specific instance I just tell it to update skills/instructions so it doesn't happen again and test it.

- by [unknown](#) **&#x21C5; 0**
  <br/> I will say time and time again: it down matter the model, but how you structure harness + context + gates + CoA’s.

You can get tasks done perfectly with 35b agents locally granted that you have given them the proper context and instructions.

This old “x is so bad and y is so good” for output performance is as outdated as Windows XP.

Case studies:

[https://arxiv.org/abs/2608.26218](https://arxiv.org/abs/2608.26218) - **Same Model, Different Harness: Different Coding-Agent Results**

[**https://aclanthology.org/2026.acl-long.269/**](https://aclanthology.org/2026.acl-long.269/)** -** [OctoBench: Benchmarking Scaffold-Aware Instruction Following in Repository-Grounded Agentic Coding](https://aclanthology.org/2026.acl-long.269.pdf)

- by [unknown](#) **&#x21C5; 1**
  <br/> Out of plain model, there are many things 35b cannot do, so far I have tested. “More parameters, more intelligence” isn’t just marketing stunt.

And, of course, there are many variables and parameters you have to manage to make it the most out of it. But still, best Luna can do will not be the best Sol can do. That is “Luna is so bad and Sol is so good”.

There is a time trade off to configure your harness+instruction. If you need need to give every single little detail, it is easier to write it all by yourself.

See my examples, they are the basic ones, Luna just hallucinate and failed the task.
