# Case Study: Combining GPT-5.6 Luna and Sol for Cost-Efficient AI [Visit](https://www.reddit.com/r/AI_Agents/comments/1vx8om3/case_study_combining_gpt56_luna_and_sol_for/)

### **Subreddit:** [r/AI_Agents](https://www.reddit.com/r/AI_Agents)

### **Author:** [TheArtificalQ](https://www.reddit.com/user/TheArtificalQ/)

### **Vote:** 3

---
I wanted to test whether I could combine Luna and Sol so that Luna would start working on a task and automatically hand it over to Sol when it recognized that the problem was beyond its capabilities. My hope was to get Sol-level performance at a fraction of the cost.
I added a simple tool to my test harness that Luna could call when it decided that continuing on its own was no longer productive and that a more capable model (Sol) should take over the investigation.
It didn't quite get Sol performance, but the results were still interesting. In terms of performance, Luna + Sol performed much better than Luna alone, but slightly worse than Sol:

- Luna alone: **31.6%**
- Luna + Sol: **74.5%**
- Sol alone: **87.2%**
Regarding the median cost per challenge, it was **$0.07** with Luna + Sol, compared with **$0.29** for Sol alone.
So the combined approach didn't quite reach Sol's performance, but it was close enough, and the cost savings were substantial.

---

## Comments 8

- by [unknown](#) **&#x21C5; 1**
  <br/> Thank you for your submission, for any questions regarding AI, please check out our wiki at [https://www.reddit.com/r/ai_agents/wiki](https://www.reddit.com/r/ai_agents/wiki) (this is currently in test and we are actively adding to the wiki)

*I am a bot, and this action was performed automatically. Please *[*contact the moderators of this subreddit*](/message/compose/?to=/r/AI_Agents)* if you have any questions or concerns.*

- by [unknown](#) **&#x21C5; 1**
  <br/> The handover mechanism between Luna and Sol was really simple, and I described it here along with the full benchmark results if you're interested in the details: [https://theaq.blog/2026/08/24/case-study-combining-gpt-5.6-luna-and-sol-for-cost-efficient-ai.html](https://theaq.blog/2026/08/24/case-study-combining-gpt-5.6-luna-and-sol-for-cost-efficient-ai.html)

- by [unknown](#) **&#x21C5; 1**
  <br/> 75% of the performance for a quarter of the price is a tradeoff most people would take in a heartbeat. Curious if the handover ever triggers too early or too late though, like Luna bailing on stuff it couldve handled

- by [unknown](#) **&#x21C5; 1**
  <br/> I bet more detailed instructions could help Luna get closer to the sweet spot between continuing the investigation on its own and handing it over to a more capable model. My goal was more about testing the concept than building a fine-tuned solution, so I’m sure there’s plenty of room for improvement.

- by [unknown](#) **&#x21C5; 1**
  <br/> This is excellent work! Thank you for sharing.Are you willing to share the tools/skills you wrote for implementing this?

- by [unknown](#) **&#x21C5; 2**
  <br/> To be honest, I don’t want to make my harness public. It’s very simple, but still quite effective at solving Hack The Box challenges, and I don’t want to contribute to spoiling the competition there. I use it exclusively to test the cybersecurity capabilities of different LLMs on a separate account from my own :-) Anyway, if you’re interested in any specific aspects of it, feel free to DM me.

- by [unknown](#) **&#x21C5; 1**
  <br/> do you have a breakdown of how often Luna decided to escalate vs handle it alone? that ratio probably matters a lot for understanding where the remaining 12.7% gap lives

- by [unknown](#) **&#x21C5; 1**
  <br/> This is a very good question. I should probably do a deeper analysis of the data. But it’s not only about the number of handovers. The final score also has an “effectiveness” component based on the number of steps it takes to solve a particular challenge. That will definitely be lower when I start with a weaker model and let it work until it escalates the task to a stronger one.
