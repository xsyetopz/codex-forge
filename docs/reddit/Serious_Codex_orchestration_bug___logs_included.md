# Serious Codex orchestration bug / logs included [Visit](https://www.reddit.com/r/codex/comments/1w29kpe/serious_codex_orchestration_bug_logs_included/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Character_Novel_2592](https://www.reddit.com/user/Character_Novel_2592/)

### **Vote:** 5

---

Caught what looks like a pretty serious bug in Codex CLI 0.151.0.
While Codex was waiting on the same long-running process, it kept calling `write_stdin`, going back through the model with a huge context, then deciding to wait another 30 seconds.
UTC
Cumulative input
Last model call
Weekly usage
04:22:47
224,402,675
326,342
82%
04:24:01
225,717,943
332,924
82%
04:25:10
226,391,971
338,315
82%
04:28:43
229,543,938
357,668
83%
That's around 5.14M additional input tokens in under 6 minutes.
I also confirmed 3 consecutive `write_stdin` waits on the same process:
332,924 + 335,713 + 338,315 = 1,006,952 input tokens
All 3 were above the 272K threshold, so the documented 2x usage rate may have applied.
But the 2x isn't the bug.
The bug is Codex making a massive 330K+ model call just to decide “wait another 30 seconds”, then doing the same thing again on the same process.
`still running → 330K+ model call → wait 30s → still running → another 330K+ call → repeat`
I also found later `followup_task` / subagent continuations around 356K–358K, so this might not be limited to `write_stdin`.
I have the full JSONL with timestamps, token counts and tool calls. Support is already looking into it and checking whether the >272K multiplier was applied.
If your Codex usage has been disappearing way faster than usual, especially while it's sitting there “waiting” on tests or builds, I'd check your logs. Also worth running `codex doctor` and making sure your connections/runtime look normal.
Curious if anyone else can find the same `wait` / `write_stdin` pattern. This definitely wasn't happening to me like this before
---

## Comments 3

- by [unknown](#) **&#x21C5; 1**
  <br/> This is how its meant to work, it does not "check if its done" ids reading the buffer.

I have no idea how you were thinking kr wound check if the rest of the thread were not included, it would just result in tve modem having no clue why it received a running command randomly.

Same with the subagent,

Again how would you want it to work?

- by [unknown](#) **&#x21C5; 1**
  <br/> You're mixing up two different things.

Yes, Codex needs to read the output from a running process. That's not the issue.

The issue is that every time it checked the same process, it was going back through the model with ~333k, ~336k and ~338k input tokens just to decide to wait again.

Keeping track of a running process shouldn't require another 330k+ model call every 30 seconds.

So the problem is basically:

process still running -> 330k+ model call -> wait -> process still running -> another 330k+ model call

Call it a bug, bad orchestration or a design flaw, but that's the behavior I'm pointing out.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes it needs that, otherwise the model would have no clue what that process is, why its running etc. I

Its just another turn in the thread.

And its not just "checking if its running" as in codex checks if the process is running. The model are checking the status.

If you really wanted to squeeze and optimize this further than it is, you would want to separate child processes that the model need to wait until exited or timed out, and ones that work like it does now.

If so add a extra argument to the tool.

But you would risk giving it tol many options
