# Check your Codex usage because auto review can go completely insane [Visit](https://www.reddit.com/r/codex/comments/1vqn523/check_your_codex_usage_because_auto_review_can_go/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Outside-Necessary476](https://www.reddit.com/user/Outside-Necessary476/)

### **Vote:** 49

---

I checked my usage and saw 1600 turns from codex auto review, compared to 135 Sol, 17 Luna, and 2 Terra.
Basically my permissions did not match how I actually worked. Codex kept creating worktrees, databases, builds, and evidence in a separate Codex folder outside the active project root. Every normal command crossed the sandbox boundary and triggered another reviewer turn.
I also had old multi agent configuration from when Luna was not properly supported as a subagent. That workaround became stale, so Sol was doing nearly everything while Luna and Terra barely got used.
If your usage looks completely fucked, check your permission roots, old agent configuration, and whether your agents are actually being delegated work. Do not just assume the reviewer usage is normal.
[](https://preview.redd.it/check-your-codex-usage-because-auto-review-can-go-v0-yiv6p4aviwjh1.png?width=1792&format=png&auto=webp&s=97ac6bfdccd5991876f0c54f458f459630f47377)
---

## Comments 16

- by [unknown](#) **&#x21C5; 7**
  <br/> Completely forgot about this. Mine wasn't anywhere as bad as yours, but there were still excess reviews that can be cut down by some 60-80%. Thanks for the heads up!

- by [unknown](#) **&#x21C5; 6**
  <br/> 1600 reviewer turns for 154 turns of actual work. thats not a config issue thats middle management

- by [unknown](#) **&#x21C5; 2**
  <br/> [](https://preview.redd.it/check-your-codex-usage-because-auto-review-can-go-v0-ze4ahod5a0kh1.png?width=199&format=png&auto=webp&s=1cd19d7be874fbef2642cf524b99ad3e99908f3d)

- by [unknown](#) **&#x21C5; 3**
  <br/> [](https://preview.redd.it/check-your-codex-usage-because-auto-review-can-go-v0-sz05hvvy2yjh1.png?width=1866&format=png&auto=webp&s=dce3b7d8842d34aa6dd2d8da6e312f551313636e)

    I am having this exact same issue! Can you please explain what you mean by having proper permissions / Codex was building things in a separate folder outside the active project root? How should I fix this? Should I just use "Full Access"?

- by [unknown](#) **&#x21C5; 1**
  <br/> your codex will explain it better then me, just give it this post

- by [unknown](#) **&#x21C5; 5**
  <br/> How did you check this.  My usage is completely fucked.

- by [unknown](#) **&#x21C5; 5**
  <br/> [https://chatgpt.com/codex/cloud/settings/analytics#usage](https://chatgpt.com/codex/cloud/settings/analytics#usage)

- by [unknown](#) **&#x21C5; 5**
  <br/> WTF. Thanks for noticing this. Mine is way worse than yours.

On Aug 9 alone:

- codex-auto-review: 5,435
- gpt-5.6-sol: 44
- gpt-5.6-luna: 28
- gpt-5.6-terra: 48

I totally have to fix that 😅

For today, you are my hero!

- by [unknown](#) **&#x21C5; 3**
  <br/> Thanks. Unfortunately I can’t blame auto review, I’m just fucked.

- by [unknown](#) **&#x21C5; 2**
  <br/> This chart is fine? Thats why it's running stuff for double time? I mean the tasks take more time than ~1 months ago, but maybe its just nerfed lol

       [](https://preview.redd.it/check-your-codex-usage-because-auto-review-can-go-v0-gzdek4yrcyjh1.jpeg?width=1220&format=pjpg&auto=webp&s=5739d821105cb5c5c21ff5b38511275a5e52bf49)

- by [unknown](#) **&#x21C5; 1**
  <br/> I don’t know about the desktop app or CLI… but in VS Code … if you turn off “**Approve for me”** this goes away…… auto review is it reviewing its own requests to run commands , etc.

I turned it off and manually approved all actions…. and it’s saving me so much %. Or give it full access not needing approval… either way

- by [unknown](#) **&#x21C5; 1**
  <br/> Which makes this great combination as it just tells users to give models full access and that's not recipe for a disaster with casual users that don't have proper backups (backing up things to multiple places). I'm of course being a rather sarcastic. They really should just make it so that tokens used by auto review aren't counted against the weekly usage limit.

Auto review system takes quite a bit of tokens even when working correctly and since those are also counted against usage there is simply not much justification to keep using it over a setup that takes account they might mess up and just let them have their own work environment over the automatic review system. However for casual users that don't really know much about computers in general they probably don't have precautions against AI makes a mistake and deletes their local files that are not within scope and cause a system crash. Then they are like "why my computer doesn't boot to Windows?"

- by [unknown](#) **&#x21C5; 1**
  <br/> Mine were 90% of turns, so I disabled it.

- by [unknown](#) **&#x21C5; 1**
  <br/> I dont understand the graphic Shows for me like 80% Interactions for Auto Code Review. But when I Go to Settings it says Auto Code Review is Not activ

- by [unknown](#) **&#x21C5; 3**
  <br/> same, they turned it on by default

- by [unknown](#) **&#x21C5; 1**
  <br/> Damn, 15,515 turns this month. Over 7,000 on one day. Thanks for bringing this up
