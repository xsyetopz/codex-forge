# How do you guys handoff work between Agents? [Visit](https://www.reddit.com/r/codex/comments/1v852jd/how_do_you_guys_handoff_work_between_agents/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [ToxicFlames](https://www.reddit.com/user/ToxicFlames/)

### **Vote:** 8

---

I have been using Codex to great success, but I don't think I am using this software to it's fullest potential. I hear a lot of stories of people using like 5 agents at once to work on a project, and I am not sure how to do that myself.
Here is my current strategy: After using 1 agent for a while to get the project 'spun up,' I have it create a 'documentation.md' file containing information about what the project is and how it works, and then I update agents.md to reference that file. Agents.md contains instructions to read the documentation when first starting up. I also create a local git repository for the project to track changes, and update agents.md so 'all changes will be commited to the repo according to git best practices.' I also include language in agents.md to update the documentation when changes are made.
Whenever my context size gets too large, or want to do a new 'thing' with the project, I open a new chat and type the prompt 'read documentation and initialize.' From there the agent usually reads the 'documentation.md' file, and gains the context needed to meaningfully contribute.
This works for me but it feels kind of like a hacky workaround. This also doesn't allow for multiple agents to do work at once, only letting me spin up a new agent once the context bloat of the last agent gets too severe. Whenever I try to use multiple agents they just end up trampling on each others half finished work.
What is the best way to set things up so I can get multiple agents working autonomosly at the same time? And what is the best way to get new agents up to speed with the project and contributing quickly?
---

## Comments 13

- by [unknown](#) **&#x21C5; 3**
  <br/> We use git worktrees. Different agents work on different worktrees and branches to implement different features onto the same codebase.I guess the secret here is not to look at your project as one project, but as a combination of features that can be done in parallel.

But this also depends on how much control and understanding you want to have over your project. Due to work requirements I am basically forced to run parallel agents, but on my personal project where I want to understand and dictate every mechanism, I choose to use 1 agent only, and write a lot of docs. There is obviously a trade off - the more autonomous your work is, the less you are aware of the actual implementation.

- by [unknown](#) **&#x21C5; 2**
  <br/> Your project needs an operational architecture. Treat every agent as a new onboarding and the agents.md is the map to help it gather the right context at the right time for the right operation

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, on top of gut I have project templates for all projects:  agents.md describing interdependencies, tools, skills, credentials; plan.md which is the plan of the whole projects with goals for each part, as well as a wishlist of ideas for later; state.md which is where the last agent got to.

- by [unknown](#) **&#x21C5; 1**
  <br/> I generally write a master prompt, within the master prompt, I’ll invoke subagents loaded with the house agent’s profile. I also instruct them to work independently while the master agent adjudicate, and resolve conflicts before presenting the conclusion, proposal, or next action.I also use a proposal structure, which is great for keeping up with task, and handoff instructions. This coupled with a maintenance repo scheduled agent memory sync, and consistency helps me train my responses within the project.

- by [unknown](#) **&#x21C5; 1**
  <br/> Different agents for different roles and then a backlog with tickets that each contain the requirements. Each agent takes its turn to update the plan in the ticket, coordinated by a Producer agent that uses the thread IDs to trigger the next agent.

Having one common source of truth for each task is the key.

- by [unknown](#) **&#x21C5; 1**
  <br/> I use mem Palace and I have an index of all the planning docs that separate what's completed, current, postponed

- by [unknown](#) **&#x21C5; 1**
  <br/> I just use superpowers, does it all for me. I'm also a dotnet developer so I made a console app that lets the agent query the solution over MCP, essentially giving it intellisense so it doesn't need to trawl every file like it's a story with all it's paragraphs jumbled up.

It can query where a method lives, all it's inheritance properties, overloads, etc... basically gives it the same map a compiler uses to compile the code.

- by [unknown](#) **&#x21C5; 1**
  <br/> 35 page system prompt to control 17 specialised workers. (About 18k tokens for system prompt)

Parent system prompt being the orchestrator with a state machine and versioned contracts between agents.

Agents all share a common MCP policy use skill and a common contracts skill to define how different agents can pass work to other agents via the parent with a separate skill per sub agent for it to act out its duty.

It's basically like any software system, system prompt is like the program.cs, sub agents are interfaces and skills are the implementations of those interfaces with shared common models, rules, guidelines

- by [unknown](#) **&#x21C5; 1**
  <br/> I literally have an orchestrator chat/task/agent per project, and it can spin up more tasks/agents/chats for different tasks and then monitor them so they’re coming to fruition. Look up thread tools.

- by [unknown](#) **&#x21C5; 1**
  <br/> I had claude and codex write a development framework. Projects/tasks are created, code and acceptance gates that must be satisfied, pytest/uat/qa cycles, and it hooks into Hermes via webhook to verify all requirements were met before Task/Project/QA closout.

Be careful, if you let codex design it, it will overcomplicate it and create a bloated, slow process that results in all agentic dev/qa work getting consistently stuck in the mud with what I call 'artificial blockers'. Codex is tactical, not strategic, and doesn't really understand the idea of creating efficient long term solutions. Mine started out as a general Project Management suite and ended up over a serious of refinements becoming a Dev suite, so when it got to a point it was taking 24 hours to do basic deployments I had Fable design a agentic-driven dev suite from scratch using Superpowers ([https://github.com/obra/superpowers](https://github.com/obra/superpowers)) and that is working pretty well now.

- by [unknown](#) **&#x21C5; 1**
  <br/> disclosure i work on kandev ([https://github.com/kdlbs/kandev](https://github.com/kdlbs/kandev) + [https://kandev.ai](https://kandev.ai), self-hosted kanban over coding-agent sessions). we do not make agents chat each other. each agent owns a card/worktree, writes a short handoff, and the next agent only starts after a review gate.

- by [unknown](#) **&#x21C5; 1**
  <br/> I just use [https://capacitor.kurrent.io/multi-player](https://capacitor.kurrent.io/multi-player) it stores complete sessions (uncompacted) and you can basically recap from any other coding agent for free

- by [unknown](#) **&#x21C5; 1**
  <br/> I think there are actually two separate problems here.

For agents trampling over each other's code, I'd keep solving that at the Git level — separate branches/worktrees and give each agent a clearly bounded piece of work.

The bit we stopped keeping in the repo was the changing state of the work itself.

We started out pretty similarly to you with docs that new agents were told to read, but once there were multiple pieces of work happening it got awkward. The docs are good for explaining how the system works, but not so good for constantly changing things like what we're building next, what's already been decided, what's blocked, acceptance criteria, or what another agent just finished.

We use WithNettle for that now. The product/features/tasks form a tree, and each task carries its own context, decisions, status, blockers etc. Claude/Codex can read and update the same information through MCP, so a new agent can pick up the relevant branch of work instead of having to reconstruct the whole project from documentation.md.

Git still owns the code and technical docs. WithNettle is basically the shared state of the work.

That's been the useful separation for us, rather than trying to make one giant project document keep everybody in sync.
