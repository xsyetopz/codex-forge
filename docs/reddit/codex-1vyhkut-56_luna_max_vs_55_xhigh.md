5.6 luna Max vs 5.5 xhigh

I often see mixed opinion about Luna. While it's true it's nowhere nere compare to Sol, but how good/bad it really is? Specially when we compare with last gen model.

Is it equivalent to 5.5 xhigh or worse?

— **Initial_Question3869** · 3 points · 2026-08-26 03:28:38

---

> **SocketByte** · 28 points · 2026-08-26 03:36:19
> Luna is like a pretty smart kid with a major reading comprehension disability.

> > **epicskyes** · 4 points · 2026-08-26 04:30:51
> > That’s because the writing you give it to read looks like a doctor’s prescription signature. If you give Luna highly structured input to follow it can comprehend just as well as SOL for 80% less cost. SOL is good for reading and following messy instructions.

> > > **Australasian25** · 3 points · 2026-08-26 04:54:14
> > > Exactly.
> > >
> > > Not, luna, get the important bits out.
> > >
> > > But, Luna, extract all sentences relating to x. And the sentence before and after all sentences relating to x. For each extraction, label what page and line number you got them from. If unsure, place confidence level between 0 to 10 for each extracted sentence. 0 fo low confidence and 10 for high confidence.
> > >
> > >

> > > > **epicskyes** · 2 points · 2026-08-26 05:24:40
> > > > I give Luna premade json modules it just reads those and writes the code they specify

> > > **stopstopstoptopopp** · 0 points · 2026-08-26 05:11:25
> > > This is very true. Luna can be only as good as you.

> > **Dangerous_Bid2935** · 3 points · 2026-08-26 03:53:20
> > Really a great way to put it

> > **scaledev** · 1 points · 2026-08-26 19:58:15
> > It reads well, it's just that it doesn't know a lot of things, and it hasn't experienced a lot of things (if it were a human).
> >
> > Because of this, it doesn't know obscure programming languages, nor does it know how to see things "from above", or to expand its narrow view. It is smart, it notices a lot of things, but this lack of 'experience' as if it were a person, and 'maturity' to see things from above, makes it see with horse blinders, and sometimes create brittle architecture.
> >
> > Otherwise, it is pretty good.

> > > **SocketByte** · 1 points · 2026-08-26 21:03:53
> > > I mean sure, but there were so many instances of it totally misunderstanding my prompt which wasn't even that vague. "Use X library to implement this" feels like a realistic, understandable prompt, but Luna shat itself and started to rewrite that library from scratch. Or asking it to add a feature, and it now deletes half of my product because it thought that I wanted only that feature to exist. Many such examples. Obviously Sol doesn't have this issue, but Deepseek Flash doesn't either, and it's the same pricepoint. For me Luna is good as a subworker that gets prompted by the orchestrator with super well defined tasks, but nothing else really.

> > > > **scaledev** · 1 points · 2026-08-26 22:08:06
> > > > I've never had such issues with Luna. but then again I haven't used it that extensively for code implementation. which reasoning did you use it? typically anything below xhigh is not worth it. I start with high on the most trivial things but I use it for web Dev only for xhigh to Max .

> > > > > **SocketByte** · 1 points · 2026-08-26 22:22:00
> > > > > I only used Max, but I can believe that you never had those issues. This is a model that works until it doesn't. Very hit or miss. I just don't want to play russian roulette every time I send a prompt lol

> > > > > > **scaledev** · 1 points · 2026-08-26 22:33:25
> > > > > > You can mitigate some of this by having auto-reviewers after every implementation. In the past, I've always used the best models for implementation, but recently been switching to Luna max to save on tokens..experimenting a lot to see if I actually can do with good quality if I just plan with Sol and have Luna max implement everything, including call the reviewers and deal with after-fixes.
> > > > > >
> > > > > > The only unanswered question is whether I need to include Terra/Sol for review as well. Luna max is the default reviewer.

> **Acrobatic_Feel** · 13 points · 2026-08-26 03:46:38
> My experience with Luna is that it writes code, but the code has issues. You will need Sol to go back over it. When Sol reads it line by line and troubleshoots the issue, you used more tokens than just having Sol write it initially.

> > **scaledev** · 1 points · 2026-08-26 08:10:42
> > This has always been a tradeoff. I have always had Sol do it, but am for the first time experimenting with having Sol/Terra write handoff and having Luna implement. Did a small trivial frontend fix that went well.

> > **retteh** · 1 points · 2026-08-26 03:48:32
> > Sol tokens are like 20x more expensive though. Even if Luna uses double it wouldn't be close in cost.

> > > **Acrobatic_Feel** · 4 points · 2026-08-26 03:58:34
> > > I’m speaking from a Pro plan perspective

> > > > **Confident-Deal-912** · 0 points · 2026-08-26 04:06:35
> > > > Ok I'll speak from mine on pro lite
> > > > I can run 50x luna xhigh agents in my harness use about 1%-2% over a hour
> > > > A sol high agent can use the same in a hour or less
> > > > I use code rabbit on prs
> > > > Sorts the issues very well
> > > > Alot more work gets done compared to sol

> > > > **retteh** · -1 points · 2026-08-26 04:38:06
> > > > I'm on 20x. Sol is still expensive.

> > > **doodad_ounao** · 2 points · 2026-08-26 04:10:13
> > > It's more optimized to let Luna write it and Sol read it because input tokens are cheaper than output tokens, but the cost saving is nowhere near what the 20x more expensive tokens make it sound like.
> > >
> > > As u/Acrobatic_Feel said, you *will* need Sol to go back over what Luna wrote. (I mean, you won't NEED it need it, you can just accept the lower quality of Luna's code, of course; but yeah, it has issues)

> > > **ogaat** · 1 points · 2026-08-26 06:38:59
> > > My problem is with the time. It is too slow.
> > >
> > > I use Luna for overnight batch jobs or background tasks where I am not babysitting or waiting on the model. It can ping me when it is ready.

> > > **BingGongTing** · 1 points · 2026-08-26 17:41:57
> > > Since I started using Sol to Plan/Review and Luna to orchestrate/execute I've cut API cost by nearly 90%. Can now work on multiple projects with goals running 24/7 on $200 plan and not hit weekly.

> **LOTRslaytracker** · 5 points · 2026-08-26 03:55:47
> I still use 5.5 xhigh tbh tried the frontier models and they incredible….
>
> At over engineering even with custom skill guidance and harnessing

> > **xoStardustt** · 2 points · 2026-08-26 05:21:09
> > Yep 5.5 is where it peaked. All the 5.6 models are experts at over engineering cancer

> **CalligrapherFar7833** · 2 points · 2026-08-26 04:24:10
> 5.5 xhigh doesnt need babysitting by an oracle model

> **Tudragon123456** · 2 points · 2026-08-26 05:17:04
> No where near 5.5 xhigh

> **innociv** · 2 points · 2026-08-26 05:36:39
> Why in the world would you compare these when 5.5 is 25x more expensive?
>
> Anyway, Luna is better at agentic coding and narrowly scoped tasks but worse at big picture.

> **scaledev** · 2 points · 2026-08-26 08:07:51
> Luna is a much smaller model than 5.5. It will always be narrower and less knowledgeable. It is decent at things, but it has been stripped down of a lot, and it sucks at writing instructions for your harness.
>
> In a nutshell: it is good, but needs overseeing and rechecking.

> **TraditionalFig7377** · 2 points · 2026-08-26 08:15:19
> much worse

> **im-cringing-rightnow** · 2 points · 2026-08-26 09:51:38
> Luna constantly goes on a tangent, then in a loop, and then I have to stop it and steer in the right direction again. It's pretty stupid. But it's dirt cheap and it can do boilerplate pretty nicely. Just don't expect it to solve complex problems.
>
> 5.5 xhigh was miles ahead in my opinion, but can you really compare those considering the price?

> **Spiritedbong** · 4 points · 2026-08-26 03:41:19
> Luna Max is garbage for coding. The code runs, but that's about it. The quality is nowhere near Sol's, so just use Sol.

> > **Jeferson9** · -1 points · 2026-08-26 04:02:16
> > Sol writes terrible code

> > > **TwisTz_** · 1 points · 2026-08-26 04:25:27
> > > These statements are way too broad. I use Luna Max for mostly web dev/JS stuff and don't have any issues whatsoever.

> > > > **scaledev** · 2 points · 2026-08-26 08:13:26
> > > > Issues no, but seems like Luna still doesn't write elegant code. Even though I have instructions, for elegance and modularity, it makes a mistake when it comes to elegance and architecture. I'm working on mitigating this through reviewers and extra guidelines.

> > > > > **Rungekkkuta** · 1 points · 2026-08-26 19:32:27
> > > > > At least for my workflow, luna writing code ir way cheaper than running sol at different reasoning levels. Even using Luna max.
> > > > >
> > > > > Indeed it's not perfect, but it's what I can afford

> > > > > > **scaledev** · 1 points · 2026-08-26 19:52:32
> > > > > > It is what I can afford as well. But it's more about not wasting my money when I have such a good and cheap model at my hands. I was a bit harsh above. I dind't mean it writes ugly code constantly, but sometimes it has a narrow view, and may make a mistake at choosing brittle architecture.
> > > > > >
> > > > > > But I am trying to mitigate this through having Sol High/xhigh or Terra xhigh/Max plan, and write a handoff doc with everything defined in it, though I allow some flexibility for Luna as well to choose. I never did things this way - I would always use the strongest model to plan as well as implement code - but I am now forced to do this. Also, I think Luna xhigh/max is pretty smart as well.
> > > > > >
> > > > > > I already did two implementations as real-world tests: one was a trivial fix using Sol/Terra as a planner, creating a handoff brief where I would start a new session with luna and paste that entire thing into it. I've chosen this as it seemed better than having Sol/Terra delegate it. The other one was a bit more complex, and I had luna max do it all (explore, plan, implement). First one went perfectly (though it could be because it was a trivial one). 2nd one went also well, where luna max did it all. It was valid and correct. However, I value elegance and maintainability highly, and here is where I noticed brittle code, basically violating my fullstack guidelines it was supposed to follow. But overall it was not bad at all. I flagged it to luna, it immediately agreed, fixed it rather fast, and that's it. Still, I would prefer not to have to review my code at all. I know it sounds crazy, but I have intelligence to do this for me, and I have better things to do than look into syntax and loops to see if it is right. Even architecture is something I wish not to have to fix myself.
> > > > > >
> > > > > > I also have reviewers for post-implementation, as well as post-merge reviewers. Luna max does those as well.

> > > > > > > **Rungekkkuta** · 2 points · 2026-08-26 21:14:56
> > > > > > > At first I was under the impression that I was using Luna Max more than you, but now with more context I think you are using Lua more than me because I have a similar flow to yours but I always use Sol extra high for planing due to its intelligence and efficiency. basically the price per task of sol xhigh is optimal for my needs.
> > > > > > >
> > > > > > > But I also had a similar experience where Luna would get things done but suboptimally so what would use Sol for reviewing and improving the implementation.
> > > > > > >
> > > > > > > And I completely agree with you where we can't beat llms in terms of time to implementation. They can gather context, plan and implement a lot faster than, at least, I would be able to do as a human. And then I focus on gathering requirements, planning architecture and the things that they can't do yet as good as I can do, or as good as a human can do.
> > > > > > >
> > > > > > > I attached to this comment the latest plot I have access to avoid LLM price per Intelligence index. I don't think it's the best because these thinks are pretty hard to measure. I believe we as humanity are still unsure about how to measure this but it is the best I have right now for reference
> > > > > > >
> > > > > > > Edit: By the way, thank you very much for the in-depth comment you made which really enriches this sub and people in general
> > > > > > >
> > > > > > > <https://preview.redd.it/vw63wbxegrlh1.jpeg?width=3069&format=pjpg&auto=webp&s=0b5587df45e45d34479255da53867c4ad4914059>

> > > > > > > > **scaledev** · 1 points · 2026-08-26 22:25:41
> > > > > > > > Appreciate the kind words. And same to you!
> > > > > > > >
> > > > > > > > Indeed, Sol is the best, and xHigh seems exceptional. I've been trying out High reasoning as well, and it also seems fine.
> > > > > > > >
> > > > > > > > Yes I wanted to share that experience as it seemed useful. But I'm nowhere near close to figuring out how good Luna really is (or is not). I'm also constantly questioning how good Luna max is as a reviewer and whether Sol is needed for this. But I've had so many tests with Luna max by now, and it seems exceptional as a reviewer. For example, it blows Gemini Flash 3.5/3.6/3.7 out of the water, but only on Max. It beats gemini on xhigh as well, but not so exceptionally as it does on Max.
> > > > > > > >
> > > > > > > > But even though it is so good, I question maybe I still need to have Sol review things as well. But then this defeats the purpose of saving on tokens. Or does it? Sol would already need to have read the files to plan and give a handoff prompt to Luna, therefore it already knows the context. All it would need is to read the diffs.
> > > > > > > >
> > > > > > > > And yes, I do use GPTs a lot. Whether I use it more than you I can't say. I have been using them nonstop almost every single day since gpt 3. I've built my software using them, since gpt 4, my prototype. Since then, lots of refactors. And I think we are in such a great time for anyone who is a builder at heart. BTW do you use Hermes cli? Got some great free models on openrouter and Nous portal. Good for saving on tokens for trivial tasks.
> > > > > > > >
> > > > > > > > And the graph is very helpful. Luna is a game changer.

> **dark0mania** · 1 points · 2026-08-26 10:38:18
> Just use Sol Medium/High

> **jrockowitz** · 1 points · 2026-08-26 13:23:17
> From experience, don’t assume Luna Max compared to Luna Default is better.  I found Luna Max to be overkill, to take longer, and to write subpar code. The simplest test I've found is to run the identical prompt in plan mode with multiple models and compare speed, cost, and quality.
>
> On a similar note, I find Terra a reasonable and cheaper option compared to Sol.

> **Dangerous_Bid2935** · 1 points · 2026-08-26 03:52:51
> I honestly use Luna more than any other AI model. It definitely cannot do everything on its own like Sol can but it is perfectly capable of simpler/more boilerplate tasks and as long as it has a detailed handoff from Sol is can write code perfectly fine. I use Luna Max fast all day and night now and only switch to Sol for planning and review and have functionally unlimited usage out of the $20 plan.
