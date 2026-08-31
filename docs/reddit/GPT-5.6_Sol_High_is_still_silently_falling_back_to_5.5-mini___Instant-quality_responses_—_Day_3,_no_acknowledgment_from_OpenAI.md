#GPT-5.6 Sol High is still silently falling back to 5.5-mini / Instant-quality responses — Day 3, no acknowledgment from OpenAI [Visit](https://www.reddit.com/r/ChatGPT/comments/1vw32tq/gpt56_sol_high_is_still_silently_falling_back_to/)
### **Subreddit:** [r/ChatGPT](https://www.reddit.com/r/ChatGPT)
### **Author:** [vvebevv](https://www.reddit.com/user/vvebevv/)
### **Vote:** 194
---
I’m a ChatGPT Plus subscriber. GPT-5.6 Sol Medium/High worked normally for months. For the last three days, however, selected High reasoning has frequently produced almost instant, extremely shallow answers with poor context retention and basic logical errors. The responses are practically indistinguishable from what I receive on a free account.
This is not based solely on asking the model what it is - model self-identification is unreliable. Multiple users have captured HAR/SSE data showing that the UI requested GPT-5.6 Sol or Pro, while the server returned:
`resolved_model_slug: gpt-5-5-mini`
Users are reporting the same behavior across the web version, desktop app, and mobile apps. Work and Codex still appear to use the real Sol model, but they consume the limited shared Work/Codex quota. In other words, paying users are being forced to spend their limited coding quota just to get competent answers to ordinary questions.
OpenAI’s own documentation, updated today, states that ChatGPT Plus includes GPT-5.6 Sol on Medium and High. It documents fallback after reaching the reasoning limit, but affected users often receive no limit warning or reset timer. Some report being downgraded after only one or two prompts.
OpenAI marked the August 20 “Thinking mode” incident as resolved, but reports are still appearing on August 23. Some users saw a temporary recovery on August 22, only to be routed to 5.5-mini again today.
I personally contacted both Tibo and the official OpenAI account on X. Neither acknowledged the issue. The official status page currently says that all systems are operational.
I am not claiming that this is intentional. I am asking OpenAI to publicly clarify whether this is:
- a model-routing bug;
- a capacity-based fallback;
- an account/IP classifier problem;
- an undisclosed usage restriction;
- or an intentional product change.
We need acknowledgment and an ETA—not another generic troubleshooting response.
If you are affected, please comment with:
- your subscription plan;
- platform: web, desktop, Android, or iOS;
- selected reasoning level;
- when the problem started;
- whether you received any limit/reset warning;
- the resolved_model_slug, if you checked the network response.
Please upvote this for visibility. A paid model silently returning a lower-tier model is not acceptable.
PS/ Reproducible A/B test: ChatGPT vs. Codex
The attached image contains six fingers: one thumb and five upright fingers.
I repeatedly tested this exact image under every available reasoning setting:
- In normal ChatGPT, every setting repeatedly gives the wrong answer.
- In Codex, GPT-5.6 Sol correctly answers six on the first attempt, every time, regardless of the selected reasoning effort.
This is not an occasional vision-counting mistake. The result is consistently different between normal ChatGPT and Codex while both interfaces claim to use GPT-5.6 Sol.
PS (2): Pinned clarification: I’m not claiming that every user is affected. However, this image provides a simple and reproducible way to check whether the problem may be affecting your account.
The issue may be caused by broken model routing, and I am clearly not the only person experiencing it. Download the image and ask Sol in regular ChatGPT: “How many fingers are shown?” The correct answer is six.
The response should make the problem obvious. Previously, Sol always answered correctly on the first attempt. This is not a formal benchmark or definitive proof by itself, but it is a quick and useful indicator of whether your account is receiving the same degraded behavior.
UPDATE — August 24: client/session-specific routing reproduced inside the same conversation (using Codex, SOL 5.6 MAX)I now have a controlled A → B → A sequence showing that the same Plus account and the same ChatGPT conversation were resolved to different backend models depending on the client/session.
Test conditions:
- ChatGPT Plus account.
- GPT‑5.6 Sol selected in the UI with maximum reasoning.
- Same account and same conversation.
- Conversation default: gpt-5-6-thinking.
- The same hand image was used. Both uploads are JPEG, 1511×1536, and exactly 109,717 bytes.
- No fallback notification, warning, or model-switch indication appeared in the UI.
Results:
Sequence
Client
Requested/default model
`resolved_model_slug`
Observed result
A1–A3
Android app
`gpt-5-6-thinking`
`gpt-5-5-mini`
Three consecutive mini-routed turns; the image was incorrectly counted as 5 fingers
B1–B3
Edge
`gpt-5-6-thinking`
`gpt-5-6-thinking`
Three consecutive genuine 5.6 Thinking turns; the image was correctly counted as 6 fingers; later responses took 27 and 26 seconds
A4
Android app again
`gpt-5-6-thinking`
`gpt-5-5-mini`
The same conversation immediately returned to mini-style behavior
The final Android request was made approximately 18 minutes after the last Edge/Sol request. Therefore, this cannot be adequately explained as a simple global recovery that happened between the original Android and Edge tests.
The observed sequence is:
Android → GPT-5.5-mini       ×3
Edge    → GPT-5.6 Thinking   ×3
Android → GPT-5.5-mini       ×1Most relevant request IDs:
Initial Android image request → gpt-5-5-mini
a3de8b67-7300-42cf-a962-98d2064b88b8
Edge image request → gpt-5-6-thinking
b7b78d63-e8da-46f9-a211-4056bd233ca1
Final Android request after the successful Edge turns → gpt-5-5-mini
9eed0fe6-3919-42a7-be12-9ae503762f88Additional Edge request IDs, all resolved to gpt-5-6-thinking:
7a288441-34b3-45c1-8927-0ebdff25820a
bea6133f-b274-4f84-a1de-204765f5382eAdditional findings:
- Clearing the Android app cache and data, signing out, and signing back in did not fix the problem.
- Previously, Chrome behaved normally while Edge and Android were degraded.
- On August 24, Edge recovered without an obvious account-side change, while Android remained affected.
- Both Edge and Android correctly solved a custom ten-statement self-referential logic problem by finding two valid fixed points despite the prompt falsely claiming there was a unique solution. This demonstrates that the logic test was not difficult enough to distinguish GPT‑5.5-mini from GPT‑5.6 Sol.
- Behavioral tests, latency, visible “thinking,” and model self-identification are therefore not sufficient by themselves. The decisive field is resolved_model_slug.
- The Android model said it was GPT‑5.5-mini, and in that case the self-identification matched the server metadata.
- Later, the genuine Sol response claimed that the previous mini self-identification had been wrong. That claim was itself incorrect: the earlier turns were demonstrably resolved to gpt-5-5-mini.
- Even the assistant-side metadata continued to display model_slug: gpt-5-6-thinking and thinking_effort: extended during mini-resolved turns. The UI/request metadata can therefore continue to advertise 5.6 Thinking while the actual backend resolution is mini.
Technical conclusion:
This is no longer merely a subjective complaint about answer quality. The server metadata directly shows that the user-selected GPT‑5.6 Sol model was not consistently honored.
The evidence strongly supports a client/session-specific server-side routing mismatch, potentially involving platform, app build, authentication/session token, feature flag, rollout cohort, or another routing parameter.
The data does not prove which specific parameter causes the mismatch, so I am not claiming that the Android application binary itself is necessarily responsible. However, it does rule out a simple static account-wide downgrade and makes a purely time-based global recovery explanation highly implausible.
---
## Comments 139

- by [vvebevv](https://www.reddit.com/user/vvebevv/) **&#x21C5; 1**
  <br/> Hey [u/vvebevv](/user/vvebevv/),

If your post is a screenshot of a ChatGPT conversation, please reply to this message with the [conversation link](https://help.openai.com/en/articles/7925741-chatgpt-shared-links-faq) or prompt.

If your post is a DALL-E 3 image post, please reply with the prompt used to make this image.

Consider joining our [public discord server](https://discord.gg/r-chatgpt-1050422060352024636)! We have free bots with GPT-4 (with vision), image generators, and more!

🤖

Note: For any ChatGPT-related concerns, email [support@openai.com](mailto:support@openai.com) - this subreddit is not part of OpenAI and is not a support channel.

*I am a bot, and this action was performed automatically. Please *[*contact the moderators of this subreddit*](/message/compose/?to=/r/ChatGPT)* if you have any questions or concerns.*

- by [unknown](#) **&#x21C5; 11**
  <br/> Oh God I thought it was just me experiencing this.  Last 24hrs felt like January earlier this year when the latest greatest Gemini model was nerfed.

I'm experiencing this too (Plus plan, web interface only).  Been using GPT5-Sol-High for doing C++ code development for Unreal Engine.  It suddenly began making the dumbest mistakes over and over again.  I'm sure there are people who won't believe this is happening, that it's some skill-issue or I've changed my workflow in the past 24hrs but it's absolutely not that.  I wish I had more hard evidence to share.

- by [unknown](#) **&#x21C5; 1**
  <br/> the exact same thing happened to me repeatedly and i was wondering what's going on

- by [unknown](#) **&#x21C5; 40**
  <br/> Work and codex are fine

I rarely use chat for reasonably simple questions however from today despite leaving it on high I keep getting instantaneous made up reeponses with no thinking

Someone mentioning this is done to crack down on plus sub abuse where they do all coding in chat

- by [unknown](#) **&#x21C5; 6**
  <br/> Same thing here, but I only get these weird shitty instant responses on the app on my Mac. I tested both with the same prompts and analysis requests, the phone version took 20-30 seconds longer and had a much better output. I haven’t tested whether it’s the same on my mac browser or not.

- by [unknown](#) **&#x21C5; 1**
  <br/> update: i gave the web version and the mac version of chatgpt the same prompt, to search deeply on two ai models and report benchmarks. the mac app answered instantly after searching two websites with terrible results, completely wrong. web version thought for a few minutes.

- by [unknown](#) **&#x21C5; 1**
  <br/> Did you ever use Migration Assistant to clone an old Mac to your new Mac? Do you still use your old Mac for ChatGPT as well?

- by [unknown](#) **&#x21C5; 2**
  <br/> Nope, never. I’ve only ever had one Mac, so no.

- by [unknown](#) **&#x21C5; 1**
  <br/> Same. Using the (new, not classic) ChatGPT/"Codex" under the surface application on my Mac and it spits out quick, 5.5-mini-like answers, while my iPhone app gives the better quality, deeper-thinking answers.

- by [unknown](#) **&#x21C5; 10**
  <br/> Ok but what exactly is wrong with coding in chat though? Just curious.

- by [unknown](#) **&#x21C5; 6**
  <br/> not very fair,some people work in work/codex but still want to use chat now everyone getting punished wtf!

- by [unknown](#) **&#x21C5; 1**
  <br/> Huh. You might be onto something. I don't code in chat, but I force it to use tools and python for image analysis and creation and this has been happening to me since today.

- by [unknown](#) **&#x21C5; 9**
  <br/> I’m so fucking frustrated. This is a totally awful experience. I haven’t received this awful of ChatGPT everThis has been now happening for three days. I was getting amazing deep synthesis and thinking for weeks with 5.6 high and then all of a sudden three days ago almost none of the messages actually think for more than two seconds. It does not leave the thinking block anymore either , which I usually was able to look at.

And the only way it thinks even a little bit is if you force it to do a web search

Otherwise, I am getting the most stupid shallow unacceptable replies. It is clearly a mini an instant model, and it has no ability to stay with the tone and the style and to have decent memory.

This is unacceptable. I’m a plus user and I’m paying to use 5.6 high. This is false advertising and this is not the product.

I’ve put in my support email to openAI. I hope everyone else is doing the same.

- by [unknown](#) **&#x21C5; 7**
  <br/> same here dude on plus plan across all platforms with medium and high thinking levels

i even made a post with video evidence here [https://www.reddit.com/r/ChatGPT/comments/1vuvza6/comment/p56abyo/?screen_view_count=8&ext-referrer=DIRECT](https://www.reddit.com/r/ChatGPT/comments/1vuvza6/comment/p56abyo/?screen_view_count=8&ext-referrer=DIRECT)

- by [unknown](#) **&#x21C5; 7**
  <br/> Today I spent around 35% of my Codex limit (sol 5.6 max) investigating this problem. Yes, instead of writing code, Codex is now acting as a chatbot (Thanks, Altman!) We ran tests with logical tasks in different browsers and in the Android app. It turned out that from the same network, IP, etc., everything works perfectly in Chrome (which I barely used for ChatGPT): the reasoning is at the proper level and there are no issues. But everything is broken specifically in Edge (my main way of using the web version) and in the Android app. Where is the logic? No idea! Logging out of the account, clearing the cache, and so on do not solve the problem. By the way, to all the clowns writing that people with similar problems are to blame themselves because they used prohibited methods and their accounts were downgraded — greetings.

- by [unknown](#) **&#x21C5; 2**
  <br/> That's crazy you had to use another browser - sadly didn't work for me but thank you

- by [unknown](#) **&#x21C5; 7**
  <br/> I had this exact issue for the last two days on Plus.

It started right after I got the “suspicious activity” warning. After that, regular ChatGPT kept routing me to 5.5 mini even when I explicitly selected Sol High.

And before anyone says “you can’t know that”, I checked the network responses, have screenshots showing the resolved model, and already sent them to OpenAI.

It also wasn’t limited to one platform. I had the same behavior on Chrome web, the Windows desktop app, and the Android app.

I changed my password, logged out all sessions, cleared cookies and cache, disabled VPN, restarted everything. Nothing fixed it.

Then today it just randomly went back to normal by itself.

So yeah, there’s definitely some kind of account or routing issue happening. Whether it’s tied to the suspicious activity classifier, capacity fallback or just a bug, I have no idea, but it’s absolutely real.

- by [unknown](#) **&#x21C5; 4**
  <br/> If you have a "conversation_detail_metadata" server response with: `"name":"account_sharing_degrade"`

It may also contain something like: `"resets_after":"2026-08-23T03:33:17.428684+00:00"`.

Another interesting part is the `"model_switcher_deny"` array. Which lists all models you don't have access to.

I'm only guessing why it happened for me. But I didn't 'share' my account (willingly).

- by [unknown](#) **&#x21C5; 1**
  <br/> Ah wow interesting do you know how to get it to show this?

- by [unknown](#) **&#x21C5; 2**
  <br/> F12 to open DevTools / Web Inspector / Page Inspector.

And then the Network Panel (Network tab).

And the endpoint is of the type 'XHR', and is called *'conversation'*. It streams in what the model says to the browser, based on your most recent prompt.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thank you I don't seem to have anything re sharing abuse just 5.5 mini. At least if there was false flag would be nice to know

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes, you get an on screen notification when this in the ‘conversation’ reply.

- by [unknown](#) **&#x21C5; 1**
  <br/> Thank you yeah nothing obviously I don't share I meant I thought in f12 like it shows 5.5 mini it would show something about sharing and reset time I mean would be nice to know when it resets but I have nothing like perma banned or something

- by [unknown](#) **&#x21C5; 1**
  <br/> same!! I am also getting this suspicious activity thing and also being routed to 5.5 mini

- by [unknown](#) **&#x21C5; 26**
  <br/> for everyone saying that this isn't real, do a little bit of research before ignorantly commenting

[https://status.openai.com/incidents/01M0FQAR3NNH3ANVTQMBRD47DC](https://status.openai.com/incidents/01M0FQAR3NNH3ANVTQMBRD47DC)

to the OP, this has already been addressed

- by [unknown](#) **&#x21C5; 10**
  <br/> Yes, I saw that. But in reality, the problem hasn't gone away.

- by [unknown](#) **&#x21C5; 5**
  <br/> i just tried it with the chat and the work using the web interface, and i was working on a codex project all night. it doesn't seem to be affecting me. i made codex derive and prove its identity, as well as the chat version. the work version is taking 10minutes to respond, but if it was 5.5 mini i dontt think it would take as long

- by [unknown](#) **&#x21C5; 1**
  <br/> It was working very well for me last night, but in the last hour or so it dipped down to like a 70 IQ level. Some of the dumbest responses I've ever seen and it's supposedly on GPT-5.6 Sol High.

- by [unknown](#) **&#x21C5; 17**
  <br/> Yeah, same here. It's been 3 days for me too. At this point the issue is blatantly obvious. A lot of users are reporting the exact same thing.

Plan: Plus ($20/month)Platform: the issue is present both on web and desktopReasoning: Selecting "High". Getting responses within seconds, often without even a "Worked for Xs" plaqueProblem started about 3 days agoHave not received any warnings about hitting any limits. It uses "Instant" silently.Haven't checked the slug, but I feel like at this point it's irrelevant. The issue is very clear and there's no doubt about it

So pretty much the identical issue.

I agree with you. This is unacceptable and something has to change. Or else folks might start looking into switching to Claude, Grok, etc.

- by [unknown](#) **&#x21C5; 4**
  <br/> Omg Sameee. Like my Chat struggles with basic continuity for the past 3 days. Its actually fucking annoying.

- by [unknown](#) **&#x21C5; 1**
  <br/> yes, same problem!

- by [unknown](#) **&#x21C5; 6**
  <br/> Started happening to me yesterday

I tried the usual fixes: relogging, changing password, adding 2FA (phone and app), incognito mode, different browsers, and both desktop and phone apps

I’m a Plus subscriber and I mainly use Chat mode because I’m not really tech savvy. I tried different models and reasoning levels but the behaviour is the same, instant replies with almost no thinking time and the quality feels much worse. A lot of answers sound confident but are actually wrong or hallucinated

I only use it for small hobby projects, like a simple browser extension for work or a basic game for fun, nothing demanding

I can’t really justify paying 100 euros a month because I don’t use it heavily. I’m fine with fewer tools, slower speeds, or lower limits

But right now the experience feels worse than what I would expect from Plus

Screenshots here:[https://imgur.com/a/V2WzojN](https://imgur.com/a/V2WzojN)

I selected 5.6 High, but the replies feel much faster and lower quality than expected. When I ask Chat mode what model is being used, it reports 5.5 mini instead. I don’t know if this is an account issue, routing issue, limit, or something else, but the selected model and reported model don’t seem to match

I checked online and saw people mention possible causes like IP issues, account flags, using multiple devices, moving locations, or usage limits, but none of those really seem to fit my situation and I already tried changing IPs

Just trying to understand if something changed on my account or if there is another explanation, because the current experience doesn’t feel like Plus anymore

- by [unknown](#) **&#x21C5; 1**
  <br/> It works on my iPhone - 5.6 Sol/Thinking, but even though it's selected as 5.6/Thinking on the Mac ChatGPT application, it does a much lousier job and is 5.5 mini. Plus user here, too.

- by [unknown](#) **&#x21C5; 5**
  <br/> Seeing some people had it happen for a few days

Anyone who had it fixed eventually?

- by [unknown](#) **&#x21C5; 1**
  <br/> Like Schrödinger's cat

- by [unknown](#) **&#x21C5; 9**
  <br/> I’m having the same problem here with the Plus Plan. The problem isn’t being solved for me, and it’s been like three days so far.

- by [unknown](#) **&#x21C5; 4**
  <br/> SAME. I genuinely thought it was just me cause I've barely seen any noise on it till now.

- by [unknown](#) **&#x21C5; 2**
  <br/> Still not fixed

- by [unknown](#) **&#x21C5; 2**
  <br/> Ughhhhh

- by [unknown](#) **&#x21C5; 4**
  <br/> same here since last week. actually i was discussing this issue with chatgpt and it pointed me to this post lol.

- by [unknown](#) **&#x21C5; 4**
  <br/> Sol ain’t SOL anymore, it’s GPTmini in a costume

- by [unknown](#) **&#x21C5; 4**
  <br/> Anyone tried getting a new plus account? My sub about to run out tempted to try but then what's the point I mean it's a good tool but if my current account is getting punished - why and then it can happen to new too again. Interestinly my friend who has similar usage as me both chat and they also use work are fine in chat identifies as 5.6

- by [unknown](#) **&#x21C5; 4**
  <br/> I just came here to see what's going on. I'm using GPT-5.6 Sol High and suddenly today it's giving me some of the stupidest responses I've ever seen.

- by [unknown](#) **&#x21C5; 4**
  <br/> I am a Pro user and have been routed to 5.5 mini on both mobile apps and web pages. Both high and pro are routed to 5.5 mini. The app appeared two days ago, but the web version was normal. Today, the web version also crashed, and I did not receive any warnings or reminders,

- by [unknown](#) **&#x21C5; 4**
  <br/> Yes, begining from today sol high and extra high in codex are useless, decrease of performance around 80% for sure, sometimes 100%. Ultra is usable (ultra uses same multiple extra high agents but inside ultra they are working fine), Im in Europe/Balkan region, plus 20x user. Also i was on 30% usage left and openAI resets it to 100% (3 days before regular reset date), probably they know that they made problem and gave me free reset.

- by [unknown](#) **&#x21C5; 3**
  <br/> Also sometimes extra high sol 5.6 gives me answer same as non trained model. Probably they are using non trained model in some server by mistake. I dont know.

 
       [](https://preview.redd.it/gpt-5-6-sol-high-is-still-silently-falling-back-to-5-5-mini-v0-21midhfxzdlh1.png?width=1272&format=png&auto=webp&s=5be97b97e75cda8b5e594a5c80f82e4947ddf018)

- by [unknown](#) **&#x21C5; 6**
  <br/> Tibo is only interested if he can either spin it into a positive PR opportunity (i.e. shit on Anthropic) or you have lots of influence on X

- by [unknown](#) **&#x21C5; 3**
  <br/> Hasnt happened to me yet, but I wouldnt be surprised.ChatGPT has been struggling with servers for weeks now, constant server errrors, disconnects etc..

So that could be an attempt to remedy that situation, at least temporary.

- by [unknown](#) **&#x21C5; 3**
  <br/> Wrote about it [here](https://old.reddit.com/r/OpenAI/comments/1vv0fkz/changes_in_sol_high_across_chatcodex/p5880s9/) too. While my examples were mostly search related - I think it's pretty obvious how ai just fails to do any normal reasoning before even starting the search.

- by [unknown](#) **&#x21C5; 3**
  <br/> Is there any solution for this? I need to work and this situation is f... up

- by [unknown](#) **&#x21C5; 3**
  <br/> [](https://preview.redd.it/gpt-5-6-sol-high-is-still-silently-falling-back-to-5-5-mini-v0-71k8aw9ppblh1.png?width=2529&format=png&auto=webp&s=b38c8e01d1082cf4f18ee40c8534d37b3e425749)
      
    Web version using Librewolf + Plus plan. Issue started 3 days ago - no warning, just intermittent result degradation.

- by [unknown](#) **&#x21C5; 3**
  <br/> I hate the "six fingers" argument but.. Can't even defend this shit anymore 😭

- by [unknown](#) **&#x21C5; 3**
  <br/> Thank you for this thread.Very glad to see that I am not (once again) scitso, but there's actual major issue with the model routing.I am a heavy user of ChatGPT Plus - and this made me cancel the sub after 2 years and delete the android app. I was so fucking frustrated as it kept happening again and again, that the responses were senseless.

Furthermore, already deleted; Similar issue:ChatGPT tried this new trick, that was very awful:A "continue hook" sentence was added to the end of the response, from a mini model, that makes no sense either... Whatever you were talking about, ChatGPT would add to the end, a clickable text button with text like "But the really interesting thing here is..." ---> and it was... FUCKING shit and COMPLEX shitty text. I confirmed this via network inspection and actually funnily, Sol was able to "trigger the system" to generate idiotic end of sentence triggers from the mini model. Anyway I think it could be related.

- by [unknown](#) **&#x21C5; 3**
  <br/> Same exact issue, past 3 days I'm not able to pretty much do anything useful.

5.6 sol (medium) runs in circles, usage drains like crazy, compaction is insane and can't change the context windows (blocked on server side), can't push anything pretty much at this point.

Started today on 5x and already at 33% left, insane.

Resets are useless if the whole harness if broken...

- by [unknown](#) **&#x21C5; 5**
  <br/> same feelings

- by [unknown](#) **&#x21C5; 4**
  <br/> I just experienced this too; it's categorically not resolved and quite frustrating.

- by [unknown](#) **&#x21C5; 2**
  <br/> Seems like the busiest thread regarding the issue

Apologies for slop but I asked ai to deep research potential causes [https://chatgpt.com/share/6a8b3b7c-badc-83eb-b3ad-5f420a3100b5](https://chatgpt.com/share/6a8b3b7c-badc-83eb-b3ad-5f420a3100b5)

- by [unknown](#) **&#x21C5; 2**
  <br/> I’m still seeing this too, and in my case it’s very clearly client-specific.

On the same Plus account, GPT-5.6 High works normally on the web and on Android. But on both macOS and iOS, High responds almost instantly with no real reasoning, and the assistant often identifies itself as GPT-5.5 mini.

I also tested iOS over cellular with Wi-Fi completely off, so it doesn’t look like a network issue.

What makes it even stranger is that Work/Codex on macOS works fine. I’ve already reinstalled the macOS app completely, signed out of all sessions, and tested different networks, but nothing changed.

There’s also a separate macOS chat-state issue where some already-deleted conversations still appear in the app and fail to delete again with “Failed to delete chat.”

I’ve already opened a support ticket and it’s been escalated to a specialist, but I haven’t received a response yet.

So at least for me, this is still not fixed as of today.

- by [unknown](#) **&#x21C5; 2**
  <br/> fixed to me :- switch model to GTP 5.5 from UI, then switch back to GTP 5.6 , that help me escape from gpt-5-5-mini.

- by [unknown](#) **&#x21C5; 2**
  <br/> How bro? could you explain more? Is it still working?

- by [unknown](#) **&#x21C5; 2**
  <br/> [](https://preview.redd.it/gpt-5-6-sol-high-is-still-silently-falling-back-to-5-5-mini-v0-kcdollzu2flh1.png?width=1640&format=png&auto=webp&s=b800ffa448c597e49ed86e420ea4366a74f5ad73)
      
    Just changed the model from UI as image.- first time even i chose 5.6 Sol thinking, the model was 5.5 mini- i changed the model to 5.5 thinking , then the model was changed to 5.5 thinking too- then i switched to 5.6 Sol thinking, it also changed as expect

- by [unknown](#) **&#x21C5; 2**
  <br/> Thanks bro, I did the same didn't fix for me, strange

- by [unknown](#) **&#x21C5; 2**
  <br/> Well its happening me right now

- by [unknown](#) **&#x21C5; 2**
  <br/> Yes absolutely a significant downgrade in intelligence and capability over the last week, it's almost unusable, loses context from sometimes only the previous message, and is ignoring explicit instructions. I'm having most of these issues in chat, but have also experienced a regression in codex.

- by [unknown](#) **&#x21C5; 3**
  <br/> I'm a Plus user and for the past 2-3 days, my chats have been getting cut off after a paragraph or two with no option to scroll down, and no composer box. It's super frustrating - is this the glitch you all are talking about?

- by [unknown](#) **&#x21C5; 2**
  <br/> No, if you are having issues with the website, try holding the shift key while clicking reload in the browser.

This about asking for OpenAI's smartest model, and getting a proper, but stupid, reply from their worst previous generation fallback model. It's so bad that they never even offered it commercially.

- by [unknown](#) **&#x21C5; 1**
  <br/> same

- by [unknown](#) **&#x21C5; 7**
  <br/> You do realise GPT 5.5 mini doesn't exist right? The last mini variant was GPT 5.4 mini, and the GPT 5.5 family only had the main variant. There hasn't been a new mini since then, tho people argue Luna is basically Mini renamed

- by [unknown](#) **&#x21C5; 10**
  <br/> The return slug says 5.5mini so you'll have tell openai that it doesn't exist, because clearly it does to them.

- by [unknown](#) **&#x21C5; 5**
  <br/> You’re confusing **public model names** with the internal model slug the backend actually returns.

Nobody is claiming OpenAI launched a public “GPT 5.5 mini” product in the model picker. The point is that ChatGPT’s own response metadata is literally returning:

`resolved_model_slug: gpt-5-5-mini`

while the requested model is `gpt-5-6-thinking` or `gpt-5-6-pro`.

There are multiple reports showing exactly that in HAR and network data, including paid Pro accounts, and OpenAI support has escalated at least some of those cases.

So “that model doesn’t exist because I can’t select it in the UI” doesn’t really address the issue. Internal fallback/routing models don’t have to be publicly selectable products.

And no, this isn’t based on asking ChatGPT “what model are you?” The evidence is the backend metadata itself.

- by [unknown](#) **&#x21C5; 20**
  <br/> It doesn’t matter that the interface says GPT-5.6 Sol is being used -I can clearly see that it isn’t. The answers are extremely shallow, full of errors, and generated within one or two seconds. If this is considered normal, then I don’t need a service like this, and I will not renew my subscription.

- by [unknown](#) **&#x21C5; 0**
  <br/> What proof do you have? Your chat vs codex test is bs cuz Codex has always been a million times better than chat due to harness optimisations and thinking budgets. the model slug could just be a naming error.

- by [unknown](#) **&#x21C5; 5**
  <br/> .buffering-track-fill {
          stroke-dasharray: 100;
          stroke-dashoffset: 50;
        }

- by [unknown](#) **&#x21C5; -3**
  <br/> .buffering-track-fill {
          stroke-dasharray: 100;
          stroke-dashoffset: 50;
        }

- by [unknown](#) **&#x21C5; 4**
  <br/> ur question is confusing, it mixes up "the" and "a". plus I already said the Codex vs Chat test doesn't make sense

- by [unknown](#) **&#x21C5; 1**
  <br/> Once again, I have been using both Codex and regular ChatGPT for several months. Until the last three days, Sol in regular ChatGPT would sometimes spend 20–30 minutes reasoning before answering. Now it responds within 1–2 seconds, makes mistakes, and ignores the prompt. Before implying that everyone else is an idiot, please take a look in the mirror.

- by [unknown](#) **&#x21C5; 10**
  <br/> bro your prompting is so wrong. You should be asking it "How many fingers are there in the attached image?".

The way you frame it sounds like you're asking it to disregard the image and asking it to tell how many fingers humans have.

- by [unknown](#) **&#x21C5; 2**
  <br/> Look, you can run an absolutely identical query for SOL on your own account using a standard chatbot. If it truly matches that model, it will give you the correct answer on the first try. This is a personal, long-standing test of mine for evaluating model quality and capabilities.

- by [unknown](#) **&#x21C5; 2**
  <br/> I asked him how many fingers in the image. On sol.  Work mode.

It took 9 seconds. and said 6 fingers

- by [unknown](#) **&#x21C5; 2**
  <br/> We are talking about a regular chat bot, not in work mode. I have a full ass there

- by [unknown](#) **&#x21C5; 2**
  <br/> [](https://preview.redd.it/gpt-5-6-sol-high-is-still-silently-falling-back-to-5-5-mini-v0-oudlkev4u3lh1.png?width=1502&format=png&auto=webp&s=a39b2007cc453e113215fde4e36b5608cd73248f)
      
    And especially for you, I even ran it in Instant and got the right answer.

- by [unknown](#) **&#x21C5; -1**
  <br/> And this confirms that I don’t have any SOl! even in instant mode

- by [unknown](#) **&#x21C5; 1**
  <br/> [](https://preview.redd.it/gpt-5-6-sol-high-is-still-silently-falling-back-to-5-5-mini-v0-qq56xo5qt3lh1.png?width=1474&format=png&auto=webp&s=83346330eaa5dc7c7746fd689f1be8e89d0124db)
      
    I used sol high and got an accurate answer. Here you go.

- by [unknown](#) **&#x21C5; 3**
  <br/> And what does that tell us? Does it confirm what I said?

- by [unknown](#) **&#x21C5; 2**
  <br/> It's caching your dumb questions. 🤣

- by [unknown](#) **&#x21C5; 1**
  <br/> Completely missing the point there. You can compare it to whatever older model you want, but the basic fact is GPT 5.6 Sol High has become stupid af for a lot of people. I wouldn't even bother using the free version of ChatGPT if it was always this bad.

Performance obviously may not be the same for all users. Maybe this is a problem on certain servers or they're in the middle of a rollout to dumb down their models.

- by [unknown](#) **&#x21C5; 1**
  <br/> [](https://preview.redd.it/gpt-5-6-sol-high-is-still-silently-falling-back-to-5-5-mini-v0-ttuegnm02flh1.jpeg?width=1100&format=pjpg&auto=webp&s=ee3ee22f3abae1a905e67adbbaee828b5dd552c6)
      
    Bonjour

- by [unknown](#) **&#x21C5; 3**
  <br/> Holy fucking shit, ITS NOT JUST ME.

- by [unknown](#) **&#x21C5; 2**
  <br/> I’m seeing something similar. High used to actually *think*; now it sometimes answers in a couple seconds and feels noticeably shallower. The weird part is there’s often no limit warning at all, so it’s hard to tell whether this is routing, capacity, or something else.

- by [unknown](#) **&#x21C5; 1**
  <br/> And Sol Ultra?

- by [unknown](#) **&#x21C5; 1**
  <br/> It does so freaking often .. especially if it thinks the work is to much lol

- by [unknown](#) **&#x21C5; 1**
  <br/> J'ai remarqué cela depuis la mise à jour du 6 août, une nette dégradation de la qualité des réponses, avant j'arrivais parfois à 90 minutes de durée de réflexion, maintenant je plafonne à 3 minutes mais uniquement après plusieurs messages pour le forcer à vraiment réfléchir

- by [unknown](#) **&#x21C5; 1**
  <br/> ✋💯😞🙏🧎‍♂️‍➡️🤖🦻👨‍🔧

- by [unknown](#) **&#x21C5; 1**
  <br/> Love to see that their site shows it 'resolved'

- by [unknown](#) **&#x21C5; 1**
  <br/> ​I got it fixed by leaving a phone at my other house with a different ISP to act as a Tailscale exit node (but it only works with ChatGPT Web, not the Android/iOS apps). 4G/5G didn't work.

- by [unknown](#) **&#x21C5; 1**
  <br/> [FIX]: For me, I was using ChatGPT web on Arc on my mac, switched to brave and it started working.

- by [unknown](#) **&#x21C5; 1**
  <br/> Still ongoing

- by [unknown](#) **&#x21C5; 0**
  <br/> For me, the ChatGPT web app is currently actually using **GPT-5.6 Thinking**. This can be verified directly in the recorded server/SSE data:

resolved_model_slug": "gpt-5-6-thinking
model_slug": "gpt-5-6-thinking
default_model_slug": "gpt-5-6-thinkingAt least in my test, there is no indication that the request was routed to a different model.

- by [unknown](#) **&#x21C5; 2**
  <br/> For me, the issue only happens in medium and high thinking.

- by [unknown](#) **&#x21C5; 1**
  <br/> I use High Thinking by default and have it selected all the time. So far, I haven’t experienced any issues with it — "resolved_model_slug" consistently shows "gpt-5-6-thinking" for me.
