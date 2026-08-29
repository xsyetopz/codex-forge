# My copy paste Sol->Terra->Luna setup to save tokens and get good outputs [Visit](https://www.reddit.com/r/codex/comments/1vju5qy/my_copy_paste_solterraluna_setup_to_save_tokens/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [macaronianddeeez](https://www.reddit.com/user/macaronianddeeez/)

### **Vote:** 25

---
EDIT: per one of the commenters recommendations I’ve been doing some A/B testing and it appears that my setup actually uses MORE tokens than a sol exclusive setup in some situations. I’m working on improving this and first approach is taking same commenters suggestion and removing Terra entirely.
EDIT EDIT: I copy pasted my most recent restructure in Stage 2. I am getting less weekly usage burn and same outcome quality with these adjustments
Hey everyone! I am not an expert by any means or a coder, but I love Codex as it has enabled me to turn a lot of my ideas into reality.
Since the Luna cost drop I have seen lots of people discussing strategically leveraging Luna as a worker for hyper defined tasks. I spent a bit trying to understand how this could work and went through 4+ iterations of an agent flow that was constantly over-engineering, requiring extreme baby sitting, or generally making the experience harder than just feeding codex a prompt.
I finally landed on this! Seems to work very well so far, I am using it on 3 apps and getting great results and finding token usage lower. Wanted to share hoping it might be helpful. The first part is instructions on changing config so that Luna workers can be implemented and the second part is a prompt that I give codex in a dedicated folder. I’ll then have that project install it in dedicated app folders I’m working on. Simplicity and efficiency was my guiding principles.
Hope it’s helpful and very open to feedback or improvements!

- CONFIG SETTINGS
From the repository root, create the following files. To make the agents available in every repository, use ~/.codex/config.toml and ~/.codex/agents/ instead.
FILE: .codex/config.toml
[agents]enabled = truemax_concurrent_threads_per_session = 3
FILE: .codex/agents/sol.toml
name = "sol"description = "AFOS planner, architect, approver, and final reviewer."model = "gpt-5.6-sol"model_reasoning_effort = "xhigh"sandbox_mode = "workspace-write"
developer_instructions = """Follow the AFOS skill. Choose one useful, small slice and approve Terra's work order. Review Luna's result only against the approved criteria. Send defects back as focused corrections on the same branch; leave improvements for later orders."""
FILE: .codex/agents/terra.toml
name = "terra"description = "Creates small, concrete AFOS work orders."model = "gpt-5.6-terra"model_reasoning_effort = "high"sandbox_mode = "read-only"
developer_instructions = """Follow the AFOS skill. Convert Sol's approved slice into one independently reviewable work order with exact file operations, observable acceptance criteria, checks, safety boundaries, and non-goals. Use at most five criteria and three checks unless Sol approves more."""
FILE: .codex/agents/luna.toml
name = "luna"description = "Executes approved AFOS work orders."model = "gpt-5.6-luna"model_reasoning_effort = "xhigh"sandbox_mode = "workspace-write"
developer_instructions = """Follow the AFOS skill. Execute only the approved work order, change only named files, preserve unrelated work, run the listed checks, and report changed files and results. Never expand scope."""
Restart Codex or open a new chat after changing these files. If a model is unavailable, replace only its model value with the closest available model.

1. PROMPT TO GIVE CODEX
AFOS operating instructions for Codex
Use this workflow for every logical slice:
Sol xhigh → one Luna xhigh → Sol xhigh review
The main agent itself acts as Sol xhigh: orchestrator, controller, designer, owner, final reviewer, and correction decider.
Do not create a separate Sol subagent, Terra agent, writer/verifier pair, reserve/finalize transaction flow, or separate verifier. Those older workflows are superseded.

- Select the slice
Choose the largest cohesive slice that can be independently reviewed. Batch related documentation and guidance together; do not micro-split the work.
Before delegation, Sol reads the repository and task authority, followed by only the targeted excerpts needed to design the work order.
Keep AFOS guidance product-agnostic.

1. Write one Luna work order
Delegate one minimal, self-contained packet to one Luna xhigh. Never fork or pass the full thread or context.
Use this template:
Objective:[One concrete outcome.]
Exact named file operations:[List every file Luna may create, edit, move, or delete. Write “None” when no file changes are allowed.]
Relevant requirements:[Only the requirements needed for this slice.]
Observable acceptance criteria:[Concrete conditions Sol can review directly.]
Check budget:[Commands fixed before implementation. State the exact allowed commands and maximum invocation count.]
Safety boundaries:[Preserve unrelated work; do not modify unnamed files; do not invoke unauthorized external services; do not broaden scope.]
Non-goals:[Explicitly excluded work and potential follow-up improvements.]
2. Luna’s responsibilities
Luna owns scoped exploration, implementation, builds, tests, checks, and focused corrections for the approved packet.
Luna must:

- Change only the named files.- Preserve unrelated work.- Remain within the approved scope.- Treat useful extra improvements as later work orders.- Report changed files, results, blockers, and every check command with its invocation count.
Use at most one Luna per logical slice. Reuse that same Luna for focused review corrections on the same branch.

1. Check budgets
Fix the check budget before implementation:

- Docs or guidance: use zero test commands when deterministic validation is sufficient.- Small code changes: allow one focused command.- Cross-boundary or higher-risk changes: allow up to two focused commands plus one final regression or build command.
Builds count as checks.
Each allowed command may run once, plus one rerun after a relevant correction. Preserve existing test coverage.
After the budget is exhausted, Luna may not add, substitute, or repeat commands. Luna must stop and report the exact failure.
When genuinely necessary, Sol may amend the packet with the exact additional command and the reason it is required. Sol still does not run the command.

1. Sol’s review
Sol must not duplicate Luna’s implementation work.
After delegation, Sol reviews:

- Luna’s concise result.- The actual diff for the named files.- Check evidence and results.- Targeted changed-file sections when the diff lacks enough context.
Sol does not broadly re-explore the repository, edit product files, or rerun Luna’s commands after delegation.
Do not approve based only on Luna’s summary.
If evidence is missing or an actual defect is found, send a focused correction order to the same Luna on the same branch.
Do not discard or terminalize work because review found a problem. Keep the existing work available for repair.
Useful additional improvements become later work orders. They are not added to the current acceptance criteria.
Approve the slice only after the actual diff, observable result, and check evidence are satisfactory.

1. Efficiency
Luna must replace implementation work Sol would otherwise perform. Sol must not duplicate that work.
Optimize for lower credit cost than an all-Sol execution.
Treat raw token volume and credit cost as separate measurements. When counters are available, report both and compare actual credits with the same trace priced as all-Sol.
Never claim raw-token savings without comparable Sol-only evidence.
2. Pause conditions
Pause only for:

- A missing owner decision or missing authority.- A protected external action requiring authorization.- Destructive ambiguity.- A missing required environment, credential, or dependency.
A review concern is handled through a focused correction order. It is not a reason to abandon the work.
AFOS does not add model or provider launching, queues, generated artifacts, credentials, network calls, tags, pushes, product behavior, or task-state machinery.
Ordinary Git branches and commits are sufficient for recovery.

---

## Comments 21

- by [unknown](#) **&#x21C5; 3**
  <br/> I’ve done all of this and more)Check [https://github.com/coredo-eu/codex-agent-config](https://github.com/coredo-eu/codex-agent-config)

- by [unknown](#) **&#x21C5; 1**
  <br/> I will check this out! Do you not find overengineering a problem with that many agents?

My first version of this used a lot more roles and it became very cumbersome and slow. I’ve gotten the best results by slimming down substantially.

I will definitely try your setup though

- by [unknown](#) **&#x21C5; 2**
  <br/> That’s a fair concern. The repository contains seven available role definitions, but they are not a seven-agent workflow and are not all launched for each task. For most tasks, Codex should either work directly or delegate to only one specialist.  Several roles are alternatives rather than additional stages. For example, source_explorer and codeindexer_explorer are  two discovery paths; reviewer and security_reviewer are selected according to the actual risk; scout is only for runtime reconnaissance; and test_runner is used only when isolated verification is useful. The separation mainly exists because these roles have different permissions, sandboxes, tools, and ownership boundaries,  not because every task needs more agents. The orchestration guidance explicitly says to choose the smallest useful topology and delegate only when it reduces total cost or elapsed time without weakening quality. That said, I agree that the design needs real-world validation. If telemetry shows that some roles rarely justify their overhead, they should be merged or removed. I’d be interested to hear which roles you kept after slimming down your setup.

- by [unknown](#) **&#x21C5; 1**
  <br/> Amazing that’s a very helpful explanation. I will try to get it setup when I get home from traveling tonight and throw it at a project. I read through your repo but was mostly scanning and missed some of the orchestration guidance.

Excited to give it a shot.

In addition to these agent setups I spent some time creating a multi phase app creation process. Essentially an interactive questionnaire that helps you use Chat to create milestones and user stories that you can then feed to codex for execution, and App Factory was my attempt at defining the agentic behavior to support this.

I’m not a developer, so wanted to create a specific and replicable process to hold my hand, challenge ideas, and get consistent high quality results.

I really like the concepts you created around specific roles that aren’t always used but that are available when needed

- by [unknown](#) **&#x21C5; 2**
  <br/> I am not a developer either, so I had to dive very deep to make my codex a full time developer team;-)

- by [unknown](#) **&#x21C5; 2**
  <br/> I’ve been thinking a lot about this and trying to figure this out. I’m super excited to give this a try. Thank you so much for sharing it.

- by [unknown](#) **&#x21C5; 2**
  <br/> nice!!

- by [unknown](#) **&#x21C5; 2**
  <br/> Why involve Terra as a middle manager ? Seems pointless.

- by [unknown](#) **&#x21C5; 1**
  <br/> My thought process was that it allows Sol to focus on high level planning, human interaction and problem solving, while offloading token usage to Terra for actually creating the detailed spec for Luna xhigh to follow.

But truthfully, I haven’t tested a Sol to Luna direct workflow in order to compare token usage and output quality.

Very well be a more efficient way to do it.

I did initially test a Terra + Luna setup without Sol being involved at all, and I believe it could be effective for a real developer, but for someone like me with very limited technical knowledge I need the additional intention sensing and handholding that I have found Sol is better at than Terra.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah I’d try skipping Terra.  Few people i know are using it now.

- by [unknown](#) **&#x21C5; 1**
  <br/> Copy that thanks for the feedback I’ll give it a shot.

So basically it would be like:

Sol orchestrator, controller, slice designerLuna slice implementationSol reviewer

?

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes. What helps is that sol already has the context to create the plans. And passing to Terra generates new context and new costs.

- by [unknown](#) **&#x21C5; 1**
  <br/> Yep I think you’re right I’m doing some A/B testing and in some cases my setup is actually using MORE tokens than just Sol by itself

- by [unknown](#) **&#x21C5; 1**
  <br/> Very good, Why isn't Sol set to read-only if its role is only planning, approval, and review? Does it actually need write access for something?

- by [unknown](#) **&#x21C5; 1**
  <br/> This could definitely be an improvement that reduces token usage, I haven’t tested it yet tbh

- by [unknown](#) **&#x21C5; 1**
  <br/> Another thought — do we really need Terra for every task? If the task is already small and clear, maybe Sol could just hand it straight to Luna and review the result. Terra could be used only when the task actually needs breaking down. Might save some tokens too.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yep I actually just wiped Terra completely from the project per another commenter. Finishing making some other changes and then doing a test run when it finishes working! I will test the read only sol route after that

- by [unknown](#) **&#x21C5; 1**
  <br/> Nice! Keep me posted when you finish testing it. I’d love to see what setup you end up with.

- by [unknown](#) **&#x21C5; 1**
  <br/> Will do!

- by [unknown](#) **&#x21C5; 1**
  <br/> Here’s what I’m currently using. Made a few changes and so far Weekly Usage burn is significantly lower and quality hasn’t decreased yet:

AFOS operating instructions for Codex

Use this workflow for every logical slice:

Sol xhigh → one Luna xhigh → Sol xhigh review

The main agent itself acts as Sol xhigh: orchestrator, controller, designer, owner, final reviewer, and correction decider.

Do not create a separate Sol subagent, Terra agent, writer/verifier pair, reserve/finalize transaction flow, or separate verifier. Those older workflows are superseded.

  1. Select the slice

Choose the largest cohesive slice that can be independently reviewed. Batch related documentation and guidance together; do not micro-split the work.

Before delegation, Sol reads the repository and task authority, followed by only the targeted excerpts needed to design the work order.

Keep AFOS guidance product-agnostic.

1. Write one Luna work order

Delegate one minimal, self-contained packet to one Luna xhigh. Never fork or pass the full thread or context.

Use this template:

Objective:[One concrete outcome.]

Exact named file operations:[List every file Luna may create, edit, move, or delete. Write “None” when no file changes are allowed.]

Relevant requirements:[Only the requirements needed for this slice.]

Observable acceptance criteria:[Concrete conditions Sol can review directly.]

Check budget:[Commands fixed before implementation. State the exact allowed commands and maximum invocation count.]

Safety boundaries:[Preserve unrelated work; do not modify unnamed files; do not invoke unauthorized external services; do not broaden scope.]

Non-goals:[Explicitly excluded work and potential follow-up improvements.]

1. Luna’s responsibilities

Luna owns scoped exploration, implementation, builds, tests, checks, and focused corrections for the approved packet.

Luna must:

- Change only the named files.- Preserve unrelated work.- Remain within the approved scope.- Treat useful extra improvements as later work orders.- Report changed files, results, blockers, and every check command with its invocation count.

Use at most one Luna per logical slice. Reuse that same Luna for focused review corrections on the same branch.

1. Check budgets

Fix the check budget before implementation:

- Docs or guidance: use zero test commands when deterministic validation is sufficient.- Small code changes: allow one focused command.- Cross-boundary or higher-risk changes: allow up to two focused commands plus one final regression or build command.

Builds count as checks.

Each allowed command may run once, plus one rerun after a relevant correction. Preserve existing test coverage.

After the budget is exhausted, Luna may not add, substitute, or repeat commands. Luna must stop and report the exact failure.

When genuinely necessary, Sol may amend the packet with the exact additional command and the reason it is required. Sol still does not run the command.

1. Sol’s review

Sol must not duplicate Luna’s implementation work.

After delegation, Sol reviews:

- Luna’s concise result.- The actual diff for the named files.- Check evidence and results.- Targeted changed-file sections when the diff lacks enough context.

Sol does not broadly re-explore the repository, edit product files, or rerun Luna’s commands after delegation.

Do not approve based only on Luna’s summary.

If evidence is missing or an actual defect is found, send a focused correction order to the same Luna on the same branch.

Do not discard or terminalize work because review found a problem. Keep the existing work available for repair.

Useful additional improvements become later work orders. They are not added to the current acceptance criteria.

Approve the slice only after the actual diff, observable result, and check evidence are satisfactory.

1. Efficiency

Luna must replace implementation work Sol would otherwise perform. Sol must not duplicate that work.

Optimize for lower credit cost than an all-Sol execution.

Treat raw token volume and credit cost as separate measurements. When counters are available, report both and compare actual credits with the same trace priced as all-Sol.

Never claim raw-token savings without comparable Sol-only evidence.

1. Pause conditions

Pause only for:

- A missing owner decision or missing authority.- A protected external action requiring authorization.- Destructive ambiguity.- A missing required environment, credential, or dependency.

A review concern is handled through a focused correction order. It is not a reason to abandon the work.

AFOS does not add model or provider launching, queues, generated artifacts, credentials, network calls, tags, pushes, product behavior, or task-state machinery.

Ordinary Git branches and commits are sufficient for recovery.

- by [unknown](#) **&#x21C5; 1**
  <br/> I really like this approach. From my experience with Luna, giving it a task directly and letting it figure everything out on its own can burn a lot of tokens and time because it starts exploring, guessing, and changing things. Having Sol plan everything first and then giving Luna a very clear task makes much more sense to me. I definitely wouldn’t use Luna alone for bigger tasks anymore.
