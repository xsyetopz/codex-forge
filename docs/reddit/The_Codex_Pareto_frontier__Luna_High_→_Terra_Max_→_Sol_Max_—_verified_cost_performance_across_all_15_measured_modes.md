# The Codex Pareto frontier: Luna High → Terra Max → Sol Max — verified cost/performance across all 15 measured modes [Visit](https://www.reddit.com/r/codex/comments/1ut3bnp/the_codex_pareto_frontier_luna_high_terra_max_sol/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [stealthispost](https://www.reddit.com/user/stealthispost/)

### **Vote:** 235

---
I wanted to work out which combinations of GPT-5.6 model and reasoning effort provide the best coding performance for the quota they consume.
This graph plots all **15 quantitatively measured Luna, Terra and Sol configurations** using:

- **X-axis:** average quota-equivalent cost per task, normalized to Luna High
- **Y-axis:** CursorBench 3.2 coding-agent performance
- **Yellow circles:** the recommended above-floor progression
The resulting three-step ladder is:
Key figures:
- **Luna High:** 1.00× quota, 56.8%
- **Terra Max:** 3.52× quota, 64.9%
- **Sol Max:** 6.94× quota, 67.2%
That means:
- one Terra Max task costs approximately **3.52 Luna High tasks**
- one Sol Max task costs approximately **1.97 Terra Max tasks**
- Sol Max is the frontier edge, but nearly doubles Terra Max’s cost for only a modest additional benchmark gain
Ultra is excluded from the quantitative graph because it is a separate multi-agent mode and there is currently no directly comparable same-harness score-and-cost result for it.
**Correction and apology:** I previously posted an earlier version of this graphic containing several data-transcription and graphing errors. That was my mistake, and the earlier version should be disregarded. **Thanks to everyone who pointed out the problems—it helped me identify the errors and rebuild the analysis properly.**
This replacement was constructed from a verified spreadsheet, cross-checked against the current CursorBench 3.2 results and official OpenAI model documentation, and generated programmatically from the underlying data rather than reconstructed by an image model.
Note: max thinking mode is a hidden option in Codex that you have to enable, which is strange, considering that it's the Pareto-leading mode for two of the steps.

---

## Comments 67

- by [unknown](#) **&#x21C5; 82**
  <br/> A chart made to be read right-to-left. Great. As if the data wasn’t confusing enough.

- by [unknown](#) **&#x21C5; 11**
  <br/> IKR! Why this trend of having positive right axis values decrease to the right? Is it because they think people can't understand that smaller values (more left on standard axes) can mean better? 🧐

- by [unknown](#) **&#x21C5; 4**
  <br/> It’s just Cursor trying to be edgy but the rest of the industry is ignoring them. Glad OpenAI and Anthropic came out with normal graphs on their new model release posts.

- by [unknown](#) **&#x21C5; 1**
  <br/> openai and anthropic do the same lol

- by [unknown](#) **&#x21C5; 2**
  <br/> No they don’t.

[https://openai.com/index/gpt-5-6/](https://openai.com/index/gpt-5-6/)

[https://www.anthropic.com/news/claude-fable-5-mythos-5](https://www.anthropic.com/news/claude-fable-5-mythos-5)

There’s not a single graph on either of these with inverted cost on x axis.

- by [unknown](#) **&#x21C5; 1**
  <br/> look on their twitter accounts i see some openai employees posting these charts

- by [unknown](#) **&#x21C5; 1**
  <br/> based on openai chart, luna xHigh would be the best value?

- by [unknown](#) **&#x21C5; 4**
  <br/> It’s a Pareto frontier graph, the north east points of the graph optimise performance vs cost. It’s not that difficult and is actually a good representation

- by [unknown](#) **&#x21C5; 5**
  <br/> I disagree with that orientation too! It only hinders interpretability, without any benefit that I can imagine. That being said, thanks for sharing the name!

- by [unknown](#) **&#x21C5; 3**
  <br/> [https://en.wikipedia.org/wiki/Pareto_front](https://en.wikipedia.org/wiki/Pareto_front)

- by [unknown](#) **&#x21C5; 2**
  <br/> It isn't. Like most charts, up and to the right means good.

- by [unknown](#) **&#x21C5; 31**
  <br/> Interesting. I was comparing against DeepSWE 1.1 in terms of costs. I found literally walking up the Sol effort starting from medium made the most sense for us.

[https://openai.com/index/previewing-gpt-5-6-sol/](https://openai.com/index/previewing-gpt-5-6-sol/)

- by [unknown](#) **&#x21C5; 0**
  <br/> In Deepswe terra high is the best, followed by Sol medium

- by [unknown](#) **&#x21C5; 3**
  <br/> I’m looking at the DeepSWE website right now and I see Terra high at 54% at a cost of $1.13 whereas sol medium is at a 61% at a cost of $1.86.

I guess Terra high is one rung under sol medium.

- by [unknown](#) **&#x21C5; 3**
  <br/> No

       [](https://preview.redd.it/the-codex-pareto-frontier-luna-high-terra-max-sol-max-v0-654p1f99fkch1.jpeg?width=1440&format=pjpg&auto=webp&s=68566765c4cf10466c1b6d987f66a67916002735)

- by [unknown](#) **&#x21C5; 1**
  <br/> I guess that's if you don't value your time.

- by [unknown](#) **&#x21C5; 4**
  <br/> I'm talking value for money not absolute best score.

- by [unknown](#) **&#x21C5; 28**
  <br/> i would love to see the 5.5 version on there as well to compare

- by [unknown](#) **&#x21C5; -21**
  <br/> it's just worse, not super interesting

- by [unknown](#) **&#x21C5; 70**
  <br/> reference point that people are used to

- by [unknown](#) **&#x21C5; 17**
  <br/> Did I misunderstand? Is Luna High graphically better than Terra High?

- by [unknown](#) **&#x21C5; 8**
  <br/> Cursor’s official CursorBench 3.2 table really does report:

              Configuration

              Score

              Cost

              Tokens

              Steps








                **Luna High**

                **56.8%**

                **$0.82**

                15,141

                40



                Terra High

                54.2%

                $0.89

                9,468

                23

    So this was **not a transcription error**. But Cursor explicitly warns that small score differences may not be statistically meaningful.

How the inversion is possible“High” is not an equalized compute budget across the two models.

On CursorBench, Luna High used approximately:

- **1.60× as many tokens**
- **1.74× as many agent steps**

as Terra High. Because Luna tokens are cheaper, it still cost slightly less. The reasonable inference is that Luna compensated for its weaker base model by working substantially longer in that particular harness.

So the result is not:

    It is closer to:



    Artificial Analysis reverses the resultArtificial Analysis reports:





              Configuration

              AA Coding Agent Index








                **Terra High**

                **72**



                Luna High

                68



    Terra High also beats Luna High on DeepSWE and Terminal-Bench v2, while tying it on SWE-Atlas-QnA.

- by [unknown](#) **&#x21C5; 9**
  <br/> Thank you, excellent explanation. I suppose that the more complex the task, the more efficient it is to use Terra High. The problem is what we understand by a complex task.

- by [unknown](#) **&#x21C5; 7**
  <br/> what's crazy is that luna is the first model trained by an AI (sol). so it may behave more efficiently than terra

- by [unknown](#) **&#x21C5; 16**
  <br/> Why is this graph backwards :(

- by [unknown](#) **&#x21C5; -14**
  <br/> up and to the right is better. it's how graphs should be

- by [unknown](#) **&#x21C5; 12**
  <br/> "Guys I'm telling you, we should make the graphs go from right to left, it's much better."

       [](https://preview.redd.it/the-codex-pareto-frontier-luna-high-terra-max-sol-max-v0-y55mx84uyich1.jpeg?width=225&format=pjpg&auto=webp&s=e5018021c6b68ddcbd4f19c5f5404a17e2439bca)

- by [unknown](#) **&#x21C5; 2**
  <br/> Lmaoo ik it looks stupid but i believe having the apex on the right is standard for representing a pareto front, thus the need to flip the x axis in this case

- by [unknown](#) **&#x21C5; 3**
  <br/> You're getting downvoted because people can't read graphs lol.

Guys, the right side is the better side, OP can't help it if that's how the data looks when plotted.

- by [unknown](#) **&#x21C5; 12**
  <br/> basically

5.6 sol ultra has no 5.5 equivalent

5.5 pro extended -> 5.6 sol xhigh

5.5 pro -> 5.6 sol high

5.5 xhigh -> 5.6 sol med

5.5 high-> 5.5 sol low

5.5 med -> 5.5 luna high

absolutely crazy progress

- by [unknown](#) **&#x21C5; 2**
  <br/> 5.5 high -> 5.6 extra high

- by [unknown](#) **&#x21C5; 2**
  <br/> Would be interesting to see 5.5 added to the chart for comparison

- by [unknown](#) **&#x21C5; 2**
  <br/> Codex defaults to sol medium, which this chart says is one of the worst compromises

- by [unknown](#) **&#x21C5; 3**
  <br/> do we have any idea if API cost is remotely relevant to subscription based quotas? cant find anything regarding this from openai

- by [unknown](#) **&#x21C5; 2**
  <br/> yeah, AI seems to think that it's a fair comparison, but it's a great question

- by [unknown](#) **&#x21C5; 3**
  <br/> Until now, 5.5 High was my "sweet spot do everything" model.

So what is the better replacement now: Terra high or Sol medium?

- by [unknown](#) **&#x21C5; 6**
  <br/> Sol High

- by [unknown](#) **&#x21C5; 2**
  <br/> I’m a bit confused by this. Terra medium was already burning usage way faster than 5.5 high did. Does Sol medium perform the same but cheaper? More expensive?

- by [unknown](#) **&#x21C5; 3**
  <br/> I really cannot understand much the point of these tests and graphs when I constantly see people that burns while weekly limit in 2 prompts and in the same day people, that can go on all day with xhigh/Max without a single drama. Seem that even on standardised tests the results are EXTREMELY random and consumption vary based on weather and grandma's mood

- by [unknown](#) **&#x21C5; 2**
  <br/> nice! that aligns with what I figured out as well. thanks

- by [unknown](#) **&#x21C5; 2**
  <br/> reading that, it looks like terra max is the sweet spot?  it just depends on what the real difference in the 2.3% performance gap is. any more data out there to support this though?

- by [unknown](#) **&#x21C5; 2**
  <br/> I can't see Max on the Codex Desktop app. I'm on the plus plan. I can see Ultra, is that the same? And Lune doesn't have Ultra for me.

- by [unknown](#) **&#x21C5; 4**
  <br/> Max reasoning is pro, ultra is available because it's not more reasoning, it's 4 agents doing xhigh

- by [unknown](#) **&#x21C5; 3**
  <br/> Thanks for the reply but the Max is actually hidden in settings as another user explained. I didn't know ultra was actually 4 subagents.

- by [unknown](#) **&#x21C5; 2**
  <br/> thats nice then, but openai should really check their docs everything has blatant mistakes unless they are changing this, it even says plus wont be getting xhigh [https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt)

- by [unknown](#) **&#x21C5; 2**
  <br/> The docs are probably vibe coded.

- by [unknown](#) **&#x21C5; 1**
  <br/> 4 agents doing max*

- by [unknown](#) **&#x21C5; 1**
  <br/> I found in the IDE I had to go into the settings and enable "Max" as an option.  Likely the same issue you're having.  It's not enabled by default for whatever reason in the IDE.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thank you, I just enabled it. Why the hell did OpenAI had this hidden in settings? Gosh!

- by [unknown](#) **&#x21C5; 1**
  <br/> Where did you found that option? I was looking for it and wasn't succeeded

- by [unknown](#) **&#x21C5; 1**
  <br/> It's under Configuration/Model Features

- by [unknown](#) **&#x21C5; 1**
  <br/> Why wasn't using Luna Extra Alto considered the best option?

- by [unknown](#) **&#x21C5; 1**
  <br/> All the charts I see Terra seems to pretty much bear sol. Especially if you consider that you can run it twice for the same cost

- by [unknown](#) **&#x21C5; 1**
  <br/> Can cursor stop trying to push this dumb&ass graph layout.

- by [unknown](#) **&#x21C5; 1**
  <br/> Luna high being better than terra high makes this chart invalid.

- by [unknown](#) **&#x21C5; 1**
  <br/> Under no circumstances should you use anything but Sol Ultra. Always the best model!

- by [unknown](#) **&#x21C5; 1**
  <br/> I don’t see the point of upgrading from Luna High to Terra for just xhigh and max. At these effort levels, models tend to over think and take a lot of latency and extra time as well, since most tasks don’t need this much reasoning. Seems to me like it would make more sense to jump from Luna high to Sol medium / high.

- by [unknown](#) **&#x21C5; 1**
  <br/> Did anyone really use Terra and Luna before recommending them? In my short experience Sol on Low reasoning is smarter, faster and cheaper than Luna high or Terra medium for planning, but I should use both more before reaching a final conclusion. I am getting tired of influencers recommending AI models from a benchmark screenshot instead of a real review of the quality of the work of each model, the hype is out of control.

- by [unknown](#) **&#x21C5; 1**
  <br/> What was the TLDR of this? Best price to performance? Sorry, I’m an arts guy!!!

I was assuming Luna Extra High, but it is chewing… feel like at least 5.5 xh was predictable

- by [unknown](#) **&#x21C5; 1**
  <br/> This is the worst presented data visualization I’ve seen in a while, you should get a job in San Francisco

- by [unknown](#) **&#x21C5; 1**
  <br/> luna high is better than terra high??????

you sure about your benchmark bro?

otherwise it makes sense. luna till max is always better for every task than terra or sol. after that, sol high and onwards. at least based on oai benchmarks,

- by [unknown](#) **&#x21C5; 1**
  <br/> Everyone complaining about the x axis being the wrong way has clearly never worked with a Pareto curve before jfc

- by [unknown](#) **&#x21C5; 0**
  <br/> This is great info, thank you!

- by [unknown](#) **&#x21C5; -1**
  <br/> Cursor’s official CursorBench 3.2 table really does report:

              Configuration

              Score

              Cost

              Tokens

              Steps








                **Luna High**

                **56.8%**

                **$0.82**

                15,141

                40



                Terra High

                54.2%

                $0.89

                9,468

                23

    So this was **not a transcription error**. But Cursor explicitly warns that small score differences may not be statistically meaningful.

How the inversion is possible“High” is not an equalized compute budget across the two models.

On CursorBench, Luna High used approximately:

- **1.60× as many tokens**
- **1.74× as many agent steps**

as Terra High. Because Luna tokens are cheaper, it still cost slightly less. The reasonable inference is that Luna compensated for its weaker base model by working substantially longer in that particular harness.

So the result is not:

    It is closer to:



    Artificial Analysis reverses the resultArtificial Analysis reports:





              Configuration

              AA Coding Agent Index








                **Terra High**

                **72**



                Luna High

                68



    Terra High also beats Luna High on DeepSWE and Terminal-Bench v2, while tying it on SWE-Atlas-QnA.

- by [unknown](#) **&#x21C5; 2**
  <br/> it's Expected Value calculations
