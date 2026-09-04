# A 3-Tier GPT-5.6 Workflow I’ve Been Using for a While [Visit](https://www.reddit.com/r/codex/comments/1w5d1r0/a_3tier_gpt56_workflow_ive_been_using_for_a_while/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [irons163](https://www.reddit.com/user/irons163/)

### **Vote:** 2

---
Skill: [https://github.com/irons163/orchestrate-sol-terra-luna](https://github.com/irons163/orchestrate-sol-terra-luna)
Sharing my own skill. I’ve been using it for quite a while now.
The idea is to split the workflow into 3 tiers to balance cost and intelligence:

- **GPT-5.6 Sol** — understands the goal, breaks down tasks, makes architectural decisions, checks results, and integrates the final output.
- **GPT-5.6 Terra Max** — handles difficult but well-bounded analysis, implementation, deep code reviews, and complex debugging.
- **GPT-5.6 Luna Max** — handles clear, repeatable, and easy-to-verify tasks such as search, testing, reproduction, mechanical edits, and summarization.
If you’re on **Plus**, I’d keep the main reasoning level at around **Sol Mid** or **Terra Max**. I wouldn’t push it much higher, since it can burn through the 5-hour limit very quickly.

---

## Comments 6

- by [unknown](#) **&#x21C5; 2**
  <br/> Can you use it alongside other orchestrators like Superpowers?

- by [unknown](#) **&#x21C5; 2**
  <br/> I don’t have direct experience combining them, but you can try:

$superpowers$sol-terra-luna-symphony

Superpowers owns planning and workflow.sol-terra-luna-symphony owns task routing and final integration.

- by [unknown](#) **&#x21C5; 2**
  <br/> Can Sol delegate to Luna without hacking around in the codex settings now?

(I think this doesn't use the subagents v2 so my question is moot)

- by [unknown](#) **&#x21C5; 1**
  <br/> I've already hacking around in the codex settings a while ago.

But there are lines in my skill:If Luna and Max are available to the account but no dedicated subagent has been defined, instruct the user to create `~/.codex/agents/luna-max.toml` (personal) or `.codex/agents/luna-max.toml` (project) with the following content: ......

So, I think if subagents v2 work well, then this part would be skip.

- by [unknown](#) **&#x21C5; 1**
  <br/> Never use Terra.

Sol + Luna are the only models to ever use of the 5.6 line

- by [unknown](#) **&#x21C5; 1**
  <br/> [](https://preview.redd.it/a-3-tier-gpt-5-6-workflow-ive-been-using-for-a-while-v0-y89cj8as95nh1.png?width=1159&format=png&auto=webp&s=d05c644d6690949f8afa8a6173ace1dd6d1e3051)

    [https://artificialanalysis.ai/?models=gpt-5-6-terra%2Cgpt-5-6-sol-high%2Cgpt-5-6-sol-xhigh#intelligence](https://artificialanalysis.ai/?models=gpt-5-6-terra%2Cgpt-5-6-sol-high%2Cgpt-5-6-sol-xhigh#intelligence)

Not sure why you'd reach for Terra Max over Sol High. It's better for all of what you listed: "well-bounded analysis, implementation, deep code reviews, and complex debugging.". It has higher intelligence, all around benchmarks, and costs you less per tasks than Terra Max.

You could also spend a little bit more per task for another step up for Sol Xhigh. But for your word, Sol High would handle that range better and cheaper than Terra Max.

If you're being frugal on Plus stick to Luna Xhigh/Max + Sol Low/Med. High only for truly difficult work. For that range I'd just stick with Luna Max or Sol Medium. Luna Max if you are okay sinking more time in to save usage (you'll have more remediation of your work too, but at Lunas pricing it still comes out far less than any of the other options).
