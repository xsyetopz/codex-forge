# Made my Codex limits last ~60% longer by offloading search to Luna [Visit](https://www.reddit.com/r/codex/comments/1vy1aiu/made_my_codex_limits_last_60_longer_by_offloading/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [MohamedTrfhgx](https://www.reddit.com/user/MohamedTrfhgx/)

### **Vote:** 18

---

With the 5h limits back on plus accounts Codex is about to become a lot harder to use. I saw this coming though.
3 weeks ago I found this Microsoft paper called [FastContext](https://arxiv.org/abs/2606.14066v3), the idea is you let a cheaper model do the repo searching instead of Sol. Sol is amazing at editing code but every grep-read-grep-read cycle is burning your limit on search work that Luna can do.
So I built my own implementation. Been using it for 3 weeks and my limits felt like they lasted way longer but that's a feeling not a benchmark. So I ran actual benchmarks on real project prompts and SWE tasks, same prompt same repo same model, Luna's cost counted with Sol.
62.7% cheaper on a real bug fix. ~40% median across repeats and around ~20-30% faster .
Unlike some context tools where over long runs they actually increase your total cost, this measures the whole task from start to finish with multiple rounds.
[https://github.com/repotracer/repotracer](https://github.com/repotracer/repotracer)
---

## Comments 20

- by [unknown](#) **&#x21C5; 5**
  <br/> Couldn't you instruct Codex to do this itself without using a separate tool/MCP? I've been thinking of ways to get Codex to reliably offload "busy" work to Luna subagents.

- by [unknown](#) **&#x21C5; 1**
  <br/> tried that before building this. instructions aren't guaranteed to do anything and even when they work you haven't actually reduced what Sol processes. I had to tune this thing for weeks before the benchmarks showed any improvements,  a naive approach will most likely cost you more not lessTldr MCP is needed to make the approach structured and more deterministic and from my testing it yielded much better results

- by [unknown](#) **&#x21C5; 1**
  <br/> They definitely work, Sol never spawns non-Luna explore agents here. If it does for you, you must be prompting wrong.

- by [unknown](#) **&#x21C5; 3**
  <br/> Yeah, I just have one line in my agents.md to offload exploration, mechanical, and easy stuff to a luna subagent.

- by [unknown](#) **&#x21C5; 2**
  <br/> How are you wording it in your agents.md? I've been thinking of doing the same

- by [unknown](#) **&#x21C5; 2**
  <br/> tried that, subagents inherit the entire conversation context and in the end actually ends up costing much more if you just used sol alone, had to fine-tune the too to make it cost-saving with no quality loss, so no one line is probably costing you more without you knowing

- by [unknown](#) **&#x21C5; 1**
  <br/> By default. You can ask  for "no context" subagent.

- by [unknown](#) **&#x21C5; 1**
  <br/> You would still have the problem of Luna's unpredictable and inconsistent output. Then you'd have to test your approach and benchmark it and finetune it over and over, and you would end up recreating RepoTracer ;)

One setup command that takes 3 seconds will save you days to weeks. and a lot of usage!

- by [unknown](#) **&#x21C5; 2**
  <br/> Ya, this might be a thing of the past... after the reset, now when you tell it to do it with LUNA instead of starting a luna agent, it searches the web on how to start one...

> do it using luna medium agent
• Confirmed. I’ll use the OpenAI Docs-verified event semantics and have the existing Luna medium agent apply the full two-file diff with the revised timers: current-turn elapsed while orange, latest-turn duration while dim.

  1. Luna applies the confirmed watcher and status-row changes -> verify exact changed sections
  2. Run Node and Bash syntax checks -> verify both scripts parse
  3. Replay main/working/idle agent fixtures -> verify counts, colors, Fast labels, and timer semantics
• Explored
  └ Read SKILL.md (openai-docs skill)
• Searching the web
• Searched the web for site:learn.chatgpt.com/docs Codex subagents Fast mode service_tier
• Searching the web
• Searched the web for <https://learn.chatgpt.com/docs/agent-configuration/subagents>
• Interacted with `/root/apply_agent_status_fields`
• Waiting for agents

- by [unknown](#) **&#x21C5; 1**
  <br/> this is exactly the problem. Sol doesn't reliably follow "use Luna" instructions, it interprets it however it wants. an MCP tool call is deterministic, Sol calls the tool and gets back structured citations which actually makes it work from my benchmarks run

- by [unknown](#) **&#x21C5; 1**
  <br/> This is brilliant and solves several problems, thanks for sharing!

- by [unknown](#) **&#x21C5; 1**
  <br/> Do you also have tools to let luna do the work and keep sol as orchestrator?

- by [unknown](#) **&#x21C5; 2**
  <br/> No, Luna is only used for search for now. Execution is better handled by Sol, though I will build in the very near future a better implementation for task-specific worker subagents :)Because as it stands now using luna subagents for execution is hit or miss.

- by [unknown](#) **&#x21C5; 2**
  <br/> Noted. Will follow your project for any update!

- by [unknown](#) **&#x21C5; 1**
  <br/> Tried it and I got a message saying Repotracer internal execution failed to obtain read access to the repository and went with allowed fallback. What should I do? Seems linked to this: [https://github.com/openai/codex/issues/23965](https://github.com/openai/codex/issues/23965)

- by [unknown](#) **&#x21C5; 1**
  <br/> Hi thanks for the report :), fixed in 0.1.6. run npx repotracer@latest setup and pick "Update the configuration" then restart Codex. updates are automatic after this but you still need to restart Codex when they land. if it's still acting up open an issue on github with the detailsmany more optimizations coming soon!

- by [unknown](#) **&#x21C5; 2**
  <br/> Can confirm it works, thanks!

- by [unknown](#) **&#x21C5; 1**
  <br/> I just use Luna for almost everything. It's highly underrated.

- by [unknown](#) **&#x21C5; 1**
  <br/> Your own repo disagrees with what you're saying.  Did you just vibecode this without even bothering to check your results?
