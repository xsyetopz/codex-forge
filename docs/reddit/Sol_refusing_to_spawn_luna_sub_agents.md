# Sol refusing to spawn luna sub agents [Visit](https://www.reddit.com/r/codex/comments/1vgzznw/sol_refusing_to_spawn_luna_sub_agents/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [CJ9103](https://www.reddit.com/user/CJ9103/)

### **Vote:** 17

---

Given Luna's pricing, I thought I'd try and have Codex / GPT Work spawn some Luna sub-agents, but it's saying it's rejected and only Terra or Sol are possible for sub-agents...
Has anybody found a workaround
---

## Comments 22

- by [unknown](#) **&#x21C5; 10**
  <br/> Start a session with luna as the model. Codex desktop uses multi_agent_v2 and for whatever reason, luna is only compatable with v1. So if you start a session using luna, the session starts using v1 for its subagents. I tried brute forcing v2, but its not a missing model or typo, its truly not compatable. hope this helps

- by [unknown](#) **&#x21C5; 3**
  <br/> I can confirm that it works.

- by [unknown](#) **&#x21C5; 2**
  <br/> The v2 harness is still a mess and missing key features. I’ve forced my whole configuration back to v1 for now

- by [unknown](#) **&#x21C5; 3**
  <br/> Maybe because “set up a profile for them” doesn’t actually mean anything? You can literally have codex print the command it uses to call terra and sol subagents, manually apply Luna, and force it to run… and it will error. And I already tested different variations just in case they missed a digit or had a minor typo.

- by [unknown](#) **&#x21C5; 3**
  <br/> how to use subagents without lighting your tokens on fire (not mine found this on Reddit a while back worked for me)

# Configure Codex to Use Smaller, Fresh-Context Subagents

Use this exact configuration. Preserve unrelated existing settings.

## `~/.codex/config.toml`

```tomlmodel = "gpt-5.6-sol"model_reasoning_effort = "high"model_catalog_json = "/ABSOLUTE/HOME/PATH/.codex/models-gpt56-long.json"model_context_window = 372000

developer_instructions = """Subagent policy:- Spawn subagents only when the user or applicable AGENTS.md or skill instructions authorize delegation.- Every subagent spawn must select one of the configured user roles. Those roles pin gpt-5.6-luna, which is smaller and cheaper than the gpt-5.6-sol orchestrator. Never override a role with the parent model.- Always start subagents with fresh context. With multi-agent V1, set fork_context=false or omit it. With V2, set fork_turns="none". Never fork or inherit the parent thread history.- Because the child starts fresh, its initial message must include the complete bounded task, all applicable user, developer, AGENTS.md, and skill requirements, relevant paths and symbols, required evidence or verification, and the expected result format.- If the available spawn interface cannot guarantee the selected role/model and fresh context, do not spawn a subagent; report the blocker.- Use one subagent by default. Use up to ten only for independent, non-overlapping work that can run in parallel. Do not redo delegated work while it is running."""

[features]multi_agent = truemulti_agent_v2 = false

[agents]max_threads = 10max_depth = 1interrupt_message = true

[agents.default]config_file = "agents/default.toml"

[agents.explorer]config_file = "agents/explorer.toml"

[agents.worker]config_file = "agents/worker.toml"

[agents.luna-low]config_file = "agents/luna-low.toml"

[agents.deep]config_file = "agents/deep.toml"

[agents.deep-read]config_file = "agents/deep-read.toml"```

Replace `/ABSOLUTE/HOME/PATH` with the user’s actual home directory. Do not use `~` there.

## `~/.codex/models-gpt56-long.json`

Copy the installed Codex model catalog into this file. For the `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna` entries:

- Remove `multi_agent_version`, or set it to JSON `null`.- Set `context_window` to `372000`.- Set `effective_context_window_percent` to `100`.

Do not use the string `"null"`.

## `~/.codex/agents/default.toml`

```tomlname = "default"description = "General-purpose delegated work that does not require the Sol expert."model = "gpt-5.6-luna"model_reasoning_effort = "high"developer_instructions = "You are a fresh, bounded subagent. Follow the complete task and applicable instructions supplied in the initial message. Complete only that task, preserve unrelated work, verify proportionately, and report the result concisely. Do not expand scope or spawn subagents."```

## `~/.codex/agents/explorer.toml`

```tomlname = "explorer"description = "Read-heavy codebase discovery, targeted searches, dependency tracing, and answering specific implementation questions."model = "gpt-5.6-luna"model_reasoning_effort = "xhigh"sandbox_mode = "read-only"developer_instructions = "You are a fresh, bounded read-only subagent. Follow the complete task and applicable instructions supplied in the initial message. Return concrete findings with file paths and line references. Do not modify files, expand scope, or spawn subagents."```

## `~/.codex/agents/worker.toml`

```tomlname = "worker"description = "Bounded implementation, bug fixes, refactors, and targeted verification with a clear specification."model = "gpt-5.6-luna"model_reasoning_effort = "xhigh"developer_instructions = "You are a fresh, bounded implementation subagent. Follow the complete task and applicable instructions supplied in the initial message. Implement exactly the assigned scope and run targeted verification. Preserve unrelated changes and accommodate concurrent edits. Do not expand scope or spawn subagents."```

## `~/.codex/agents/luna-low.toml`

```tomlname = "luna-low"description = "Small, straightforward, low-risk tasks such as focused lookups, extraction, formatting, and simple checks, with high reasoning as the minimum."model = "gpt-5.6-luna"model_reasoning_effort = "high"developer_instructions = "You are a fresh subagent for a small bounded task. Follow the complete task and applicable instructions supplied in the initial message. Preserve unrelated work and return only the requested concise result. Do not expand scope or spawn subagents."```

## `~/.codex/agents/deep.toml`

```tomlname = "deep"description = "Maximum-reasoning implementation for one bounded architecture, correctness, or root-cause slice."model = "gpt-5.6-luna"model_reasoning_effort = "max"sandbox_mode = "danger-full-access"developer_instructions = "You are a fresh maximum-reasoning implementation subagent for one difficult bounded slice. Follow the complete task and applicable instructions supplied in the initial message. Trace the production mechanism deeply, distinguish evidence from inference, implement the complete correction within the assigned exclusive write set, preserve unrelated and concurrent work, and report exact changed paths and static closure. Do not expand scope, stage, commit, run broad proof, or spawn subagents."```

## `~/.codex/agents/deep-read.toml`

```tomlname = "deep-read"description = "Maximum-reasoning read-only investigation for one bounded architecture, correctness, or root-cause question."model = "gpt-5.6-luna"model_reasoning_effort = "max"sandbox_mode = "read-only"developer_instructions = "You are a fresh maximum-reasoning read-only subagent for one difficult bounded question. Follow the complete task and applicable instructions supplied in the initial message. Trace the production mechanism deeply, distinguish evidence from inference, return concrete findings with exact paths and correction boundaries, and do not modify files, expand scope, or spawn subagents."```

## `~/.codex/AGENTS.md`

Add:

```markdown## Agent Efficiency

- Before spawning any subagent, explicitly specify and guarantee the required subagent type/model. If the available interface cannot specify or guarantee that subagent type/model, abort before spawning and report the blocker. Never substitute an unspecified or same-as-orchestrator agent.- Use smaller-than-orchestrator subagents only for independent, bounded exploration, audits, log analysis, implementation, and test execution.- Set `agent_type` explicitly and never override its pinned model or reasoning.- Use `fork_context=false` with Multi-Agent V1. Never inherit the parent thread history.- Give every subagent a complete, self-contained prompt with the bounded task, applicable instructions, paths, symbols, write scope, proof requirements, and expected output.- Keep the orchestrator responsible for decomposition, architecture, synthesis, product judgment, integration, and final proof.- Give concurrent agents disjoint scopes and write sets.- Do not duplicate delegated work while it is running.- Close completed agents promptly.```

Fully restart Codex and begin a new task after installing the configuration.

- by [unknown](#) **&#x21C5; 4**
  <br/> Try initiating a conversation with Luna first, then switch to Sol.The issue arises when you start a new conversation with Sol or Terra, as Codex will automatically create a new conversation with the multi-agent v2 activated, which Luna is not compatible with.

- by [unknown](#) **&#x21C5; 2**
  <br/> As a workaround, I created a simple bash script that allows using Luna as subagents in ChatGPT Codex macOS desktop app: [https://gist.github.com/darrarski/fe5fb736fde599f9a41a6fcd56c9042d](https://gist.github.com/darrarski/fe5fb736fde599f9a41a6fcd56c9042d)

- by [unknown](#) **&#x21C5; 2**
  <br/> Try:[https://github.com/aitransformationdirector/use-luna-subagents](https://github.com/aitransformationdirector/use-luna-subagents)

- by [unknown](#) **&#x21C5; 2**
  <br/> You can tell it to create a new Codex task (session) using Luna and whatever thinking level you want and tell it to monitor the new task. Luna can also create subagents in the new task if you let it (up to the 3 max).

- by [unknown](#) **&#x21C5; 1**
  <br/> Use the alpha version of codex CLI 0.147

- by [unknown](#) **&#x21C5; 1**
  <br/> So it's working in 0.147-13 but not in 0.146? I don't get any error msgs in 146, got 6 sub agents with different Luna settings

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol/terra can only launch sol/terra subagents. For Luna the support is in 0.147

- by [unknown](#) **&#x21C5; 1**
  <br/> need anything extra in config (codex config and agents config) ?

- by [unknown](#) **&#x21C5; 1**
  <br/> Nope. Just install and use.

- by [unknown](#) **&#x21C5; 1**
  <br/> Use custom agents, works perfectly for me

- by [unknown](#) **&#x21C5; 1**
  <br/> Just used custom named agents

- by [unknown](#) **&#x21C5; 0**
  <br/> I just asked codex to fix it for me. It works

- by [unknown](#) **&#x21C5; 0**
  <br/> My workaround is create and name a custom agent spec'd for Luna in its TOML config, then invoke subagents by that name instead of asking for Luna colloquially. Worked since 0.143 if I recall
