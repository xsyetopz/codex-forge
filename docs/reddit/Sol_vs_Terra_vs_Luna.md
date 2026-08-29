# Sol vs Terra vs Luna [Visit](https://www.reddit.com/r/codex/comments/1w0p6vv/sol_vs_terra_vs_luna/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Anxious-Priority-430](https://www.reddit.com/user/Anxious-Priority-430/)

### **Vote:** 1

---

Using Sol, I never have weird issues with the agent forgetting things, but with Luna and Terra...pretty often. It's so bad that I pretty much have to use Sol for anything complicated, especially if I'm working on more than one thing at once (like while this is compiling, let's work on some other aspect of the project). Sol handles that amazingly well, but the others, even on xhigh, fail miserably. It's the way they fail that causes me to think it might be due to K/V cache quantization and possibly model quantization. They may even be using rope scaling for K/V or something because after compaction I had a strange issue with Terra interpreting an old message as a stop command. Again, I never have any of these strange issues with Sol, but with Terra and Luna, at least once with a "5 hour" (10 minute) session
---

## Comments 11

- by [unknown](#) **&#x21C5; 1**
  <br/> Have you ever asked chatgpt it self to make you a recepit on which model to use on what? I did, and I thought I had it saved, but I can't find it at the moment. And it was very clear to me that if I was going to do more complex things which is for example using multiple files at one task, it was to use SOL.

- by [unknown](#) **&#x21C5; 1**
  <br/> No. It's not so much the issue that I find surprising, it's that I don't see it ever on Sol, but often on Terra, and even more often on Luna. My post was treated as a complaint, but it's really just a discussion about what OpenAI might be doing under the hood to cause this behavior. My guess is aggressive quantization.

- by [unknown](#) **&#x21C5; 1**
  <br/> To be honest, I don't understand you. All these models are different for a reason, right? To put it in perspective, you don't send a water problem in your house to a man who works with electricity?

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm not really complaining...sheesh. It's more of wondering WHY.

- by [unknown](#) **&#x21C5; 1**
  <br/> Do you mean why as in deeper than the answer "They are buildt differently"? IF so, you won't find exactly out why. Cus then you need to see their code.

- by [unknown](#) **&#x21C5; 1**
  <br/> Not necessarily. My guess is they aren't built all that differently, and that what I'm seeing are more symptoms of quantization of the model and/or KV cache. I run models locally, but usually at BF16, so I couldn't really say if this is a symptom of quanting, which is why I am looking for those who have run say GLM at quant 2, or KV cache at Q4, to chime in.

- by [unknown](#) **&#x21C5; 1**
  <br/> I use different context for different things and models. I have one chat about UI stuff and another for making small changes in logic. I use Luna on medium for both. Similar logic with other projects. Luna hasn't "forgotten" anything, yet. Not sure how you are using it if you're doing other things "while it's compiling" -- as that should not impact LLM at all..?

- by [unknown](#) **&#x21C5; 1**
  <br/> I never have issues. Are you using orchestration out of the box? You should have an operations watcher to ensure context is maintaining through the process and receipt hand-off from context scout to other agents.

- by [unknown](#) **&#x21C5; 1**
  <br/> I'm using the Codex CLI. My guess is that the way I am using it is too much for them, but it's odd that they fail in the same way (whereas Sol has yet to do so). I'm not really trying to fix the issue, more thinking about why they fail in this particular way. It's very weird...like they just easily lose track of things and/or become confused (due to losing track of things). Maybe switching between models in the same session, dunno.

- by [unknown](#) **&#x21C5; 1**
  <br/> Sol is really good, it depends on what you do to know what fits you the most , I personaly use 5.6 Sol Ultra for everything , from building an entire tool to asking to resume an email, almost never have any issues

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, I've never had issues with Sol.
