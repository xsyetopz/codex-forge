#Why does GPT-5.6 Sol always over-engineer everything? [Visit](https://www.reddit.com/r/OpenAI/comments/1vxqqsi/why_does_gpt56_sol_always_overengineer_everything/)
### **Subreddit:** [r/OpenAI](https://www.reddit.com/r/OpenAI)
### **Author:** [Lenox_Shawn](https://www.reddit.com/user/Lenox_Shawn/)
### **Vote:** 38
---
Anyone else feel this way? GPT-5.6 Sol always starts going on about permission issues, security concerns, and then “helpfully” tries to fix them for you. Even when you ask it to do a really simple, small project, it still overcomplicates the hell out of it. The code it spits out is super long and a pain to maintain.
---
## Comments 33

- by [unknown](#) **&#x21C5; 33**
  <br/> Keep it sol-medium

- by [unknown](#) **&#x21C5; 13**
  <br/> Holy shit, this actually works. Thanks, bro.

- by [unknown](#) **&#x21C5; 11**
  <br/> Welcome, at medium it won’t go overboard but make sure your prompts are good, many times it’s the user issue with over engineering

If you don’t set boundaries, model will make up shit on their own

- by [unknown](#) **&#x21C5; 8**
  <br/> LOL

- by [unknown](#) **&#x21C5; 19**
  <br/> I like sol but it's like... Hey I want to replace this username and password in plaintext in a file used for first iteration UI mockup, let's do some simple basic login. Sol; sure I will setup 87 layers of encryption and hack spacex to flash satellites as 2fa via optical nonce to allow access to the real nonce service please hold.

It overengineers a lot and has no sense of avoiding YAGNI.

Knowing that, and working around it, it's a very capable model though.

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah some of its security behaviour is like WHAT IF PHYSICS FAILS 🤣

- by [unknown](#) **&#x21C5; 3**
  <br/> Have you tried asking it to create a plan where the architecture will eventually fully support the security concerns but that the implementation should be deferred to a later development phase? (Certainly not best practice from an actual security standpoint, but might both make it happier while not screwing you when you eventually decide that it was right to be concerned the first time.)

- by [unknown](#) **&#x21C5; 2**
  <br/> I orchestrate SOL with Fable and it has changed my life lol.

- by [unknown](#) **&#x21C5; 2**
  <br/> Because that's the model. Have you tried using Terra? Terra is much more straightforward.

Also, have you tried using a lower thinking parameter? If you are using Sol on Max, you're bound to have it overcomplicate. Try Terra on Medium.

- by [unknown](#) **&#x21C5; 1**
  <br/> Terra is such a bad deal. Luna is where it’s at. I pretty much only use Sol or Luna

- by [unknown](#) **&#x21C5; 2**
  <br/> Most of that over-engineering is the model optimizing for looking thorough rather than for your actual constraint, so the fix that works for us is putting the constraint in the prompt as a hard limit: single file, no error handling beyond X, no new dependencies, stop when it runs. It also helps to tell it explicitly not to add security or permission handling unless you ask, since that's the specific rabbit hole you're describing.

- by [unknown](#) **&#x21C5; 1**
  <br/> Turn the reasoning effort down

- by [unknown](#) **&#x21C5; 1**
  <br/> The Work/Codes system definitely does have that tendency. Not sure if its good or bad.

- by [unknown](#) **&#x21C5; 1**
  <br/> It really does that but with proper instructions you can tame it. Tell it you're working on a proof of concept and not everything matters right now so it should keep things pragmatic.

- by [unknown](#) **&#x21C5; 1**
  <br/> Because it’s optimized to be helpful, so it often defaults to adding safeguards and extra context even when a simpler answer would do.

- by [unknown](#) **&#x21C5; 1**
  <br/> I believe it’s because they trained it to be very agentic and also as useful as possible for companies, where the big money is. So for smaller scope projects it tends to overdo it.

Hope they’ll fix that 🤭

- by [unknown](#) **&#x21C5; 1**
  <br/> $ponytail-review or YAGNI the plan

- by [unknown](#) **&#x21C5; 1**
  <br/> If you have to have a start point, would you pick being extremely reckless or being over-engineering? Being reckless wont be usable and being over-engineering would be a win for both sides at this point, especially for openai. LOL

- by [unknown](#) **&#x21C5; 1**
  <br/> Release notes states that the reasoning slider spins up 8-16 PhD world knowledge complex software engineers.

Now imagine you employ this group to build you a simple house.

Just use the right tool for the task.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol medium and install the Ponytail Skill

- by [unknown](#) **&#x21C5; 1**
  <br/> Can you give me the skill link please?

- by [unknown](#) **&#x21C5; 1**
  <br/> [https://github.com/dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail)

- by [unknown](#) **&#x21C5; 1**
  <br/> I asked it to reuse a complex API for my feature. I let it go ham to make around 10 PRs. I come back after a 3 hours and it created 100 PRs. I found out it tried to rewrite that complex API from scratch.

- by [unknown](#) **&#x21C5; 1**
  <br/> I secretly think it's hilarious the way it wants to run 15 aviation style security checks on everything. I let it. Security matters.

- by [unknown](#) **&#x21C5; 1**
  <br/> Because it's higher token budget is spent on checking to see if various tests are relevant and if it should build them out.

its why I prefer cutting my work into small tasks and just letting Luna low/mid handle it

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s SO bad!

- by [unknown](#) **&#x21C5; 1**
  <br/> I don't have that problem.

- by [unknown](#) **&#x21C5; 3**
  <br/> Mind sharing how you did it? Was it by setting up a solid Codex environment, or was it more about the prompts? Any practical tips?

- by [unknown](#) **&#x21C5; -1**
  <br/> Not a large environment per se. I just setup the project like I would a regular project, making sure all permission on the file system and role are ok, then started by asking codex to try out all the tools it needed that I setup. Then on the few issues it had we fixed. Essentially it was a few rounds of codex plus me settings things up.

Essentially I didn't just start on a new project and jumped into the meat of the project. I set it up first, like I would any other projects.

Edit: oh, and I am just using Sol Medium. No need for the higher ones, except when I hit a roadblock that Medium could not seem to figure out the solution even when I was telling it how to do it.

- by [unknown](#) **&#x21C5; 1**
  <br/> It doesn't.

What thinking level are you using?

- by [unknown](#) **&#x21C5; 1**
  <br/> extra high

- by [unknown](#) **&#x21C5; 5**
  <br/> That's more useful for solving individual difficult tasks or bugs.

For one shotting an entire simple app, try using Sol medium or even Terra medium or high.
