#In your opinion, how good is GPT-5.6-Sol for front-end development compared to other AI models? Are the "xhigh" and "max" settings significantly better than "low" or "medium" in this context? [Visit](https://www.reddit.com/r/codex/comments/1vnv0uh/in_your_opinion_how_good_is_gpt56sol_for_frontend/)
### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)
### **Author:** [Prestigiouspite](https://www.reddit.com/user/Prestigiouspite/)
### **Vote:** 19
---
I feel that GPT-5.6-Sol (both low/medium) and -Terra (high-reasoning level) are extremely poor at implementing frontend development tasks. Even when using Vercels Agent Browser in OpenCode, I often have to point out the exact same issues repeatedly because the model implements things half-heartedly and prematurely claims to be finished. Perhaps it fixed one issue and insert two or three new ones.
What is your experience do higher reasoning levels work significantly better for frontend development tasks or is it time to replace the model? There are also alternative models like Kimi K3, Qwen 3.8, Grok 4.6, DeepSeek V4 Pro or Gemini 3.7 Flash, which are supposed to be very good at frontend dev - but API bidding is expensive (OpenRouter). So I'm debating whether to upgrade my OpenAI subscription or shift increasingly toward other models, as I just can't warm up to the GPT-5.6 series for frontend work, where there is a lot to do in the next few weeks.
That said, my impression was that GPT-5.6 was considerably better at launch in frontend dev topics than it seems to be recently. On top of that, rate limits burn through extremely fast—I exhausted my weekly limit in a single day on a Business plan, without even being able to use X-High or Max rly in daily practice.
Hence the interest of whether these reasons levels are so much better at frontend.
Is there a good leaderboard like DeepSWE for frontend development in HTML, CSS, and JavaScript, including reasoning levels and prices per task? Unfortunately, DeepSWE, particularly the Luna (max) result, isn't representative of my day-to-day work, nor is it representative of long-horizon and complex agentic backend development tasks with PHP, Go, etc. Arena often only shows the maximal reasoning level and not a cost per task value.
---
## Comments 54

- by [unknown](#) **&#x21C5; 21**
  <br/> Quite bad. Really bad without an existing design to imitateI kept my claude subscription for an extra month basically only because of front-end design (and subagent-heavy work).I can also say from experience that gemini sucks at frontend but that's not a shocker.Btw models don't get more creative with higher effort levels, only "smarter". It will help with more complex work

- by [unknown](#) **&#x21C5; 2**
  <br/> The last time I spent a significant amount of time working on front-end tasks, I also used Gemini 3.0 Pro and Flash a lot. I mean, both of them were actually very good in their own right. Back then, the only issue with the models was that they sometimes deleted code you still needed (messy replacements). Aside from that, though, it was actually always better than the GPT models. Unfortunately, I haven’t been able to try Flash 3.7 yet, since OpenRouter kept saying there was no capacity available.

- by [unknown](#) **&#x21C5; 12**
  <br/> GPT is terrible for anything UI unfortunately

- by [unknown](#) **&#x21C5; 1**
  <br/> Agreed, I’ll probably get a Claude base sub just for UI work at this point.Even with reference and detailed prompts, it’s not good.

- by [unknown](#) **&#x21C5; 7**
  <br/> Sorry, guys, but it's the wrong question.

Better models or even higher EFFORT will not make magic if the context, requirements, especially for UI/UX, are not clear.

That's why we have a lot of sites/UIs where your feeling pulses "this is AI made". Without context, the harness/models try to do their best, which is very standard :)

You need process, segmentation, and engineering.

I made a lot of experiments, and the best way is to define specialized roles and tasks for different agents.

Especially for UX/UI design, you need a global DESIGN.md-like, but more than that is about how you achieve that.

My minimum to create a UI/UX concept and rules:- I have an agent specialized in Art/UX (typography, scale, grid, colors, images, flow, effects, etc). This guy you can use Sol with high or xhigh if you are lazy;- UI/Frontend implementer - who will follow the tech UI rules, use the best libs, follow agreements of UI in general (resolution, responsive etc). This one, since you have defined the specs, you can use easily Terra/Sonnet etc.

I tested everything, Claude Design, Google Stitch, v0 etc... They have their value, but I proved that the local harness can also generate good UX/UI if well detailed. The point is if you are not investing 2-4h at least in specification, you are skipping steps and hoping for magic.

This one was my first website design using this approach: [https://agentkavor.com/](https://agentkavor.com/)

For my last one, I made a very interesting test. After defining a long Art/UI/UX concept, I implemented this one using Terra and Luna: [https://lenhamusic.com](https://lenhamusic.com)

We still need engineering guys.PS: I'm not a designer, but I think I have good taste lol

- by [unknown](#) **&#x21C5; 4**
  <br/> idk if it's my computer (i have a 3070) or maybe hardware acceleration being disabled, but all these AI sites have really bad performance for me. simple landing pages make scrolling stuttery and unbearable to look at. it's not as bad i've noticed even with heavy visual effects on websites on major companies (your site runs buttery smooth on my iphone tho) any idea what setting is causing this?

- by [unknown](#) **&#x21C5; 2**
  <br/> Try to ask your favorite local agent to benchmark your GPU - explain the problem

- by [unknown](#) **&#x21C5; 4**
  <br/> Still looks like AI bro

- by [unknown](#) **&#x21C5; 1**
  <br/> I have a live site that serves as a reference. I basically told them to recreate it exactly. The only difference is that the HTML structure shouldn’t be as cluttered as it was with the old PageBuilder it should be rebuilt using clean, modern HTML structures like Flexbox, Grid, etc. So, a visually exact match, technically clean, and high-performing, rebuilt with HTML and CSS. I even specified to use CSS variables to make it reusable, provided the hex color codes, and much more.

What’s happening: Some pages look completely messed up. Horizontal scrollbars. Links are a completely different color than on the live site. Just hundreds of things that don’t line up, and I’ve been working for hours trying to get everything to match. My test today with Sol (high) went much better. But it pushes the limits like nothing else. Certain sections, such as the featured alternative blog posts, were missing entirely.

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh, another important thing is the scope: bigger scope, less attention to detail - the agent will try to finish in one turn quickly, even with /goal, if the scope is too big, they mess up.

I prefer to break up the scope into a testable unit, like use case.

- by [unknown](#) **&#x21C5; 4**
  <br/> Since i am on PLUS, i use exclusively SOL medium. For me, it's actually quite good at front end, i like what it does. Of course it depend what you actually do. For personal project, i don't really care if it look "AI", I just want something pleasing to use.For Website development I have been doing for friends and family, it is also doing quite OK honestly, everybody has been happy with our work (Sol and me).

Having said that, it's been a LOT better since i installed IMPECCABLE skill. Sol calls its quite often and it drastically improved the front end.

- by [unknown](#) **&#x21C5; 2**
  <br/> With an e-commerce platform, there are always default styles that come with WooCommerce, for example. GPT-5.6-Sol really struggles with things like that. Or when it comes to overlays, more modern design transitions between content blocks etc.

Then it fixes the transition—you say the badge is cut off now (overflow:hidden;). It says it’s fixed that too, and then the badge no longer hangs off the edge of the header but sits right in the middle of the headline. This thing is just crazy and really frustrating. I used to develop all this stuff myself back in the day, and sometimes I think it would be cleaner and faster to maybe write it myself without AI, especially when it takes 4–10 rounds just to do something like this.

Thanks for the skill tip. I'll take a look at it tomorrow!

- by [unknown](#) **&#x21C5; 2**
  <br/> Design wise, it can clearly be a hit and miss ! I can't code at all unfortunately, so i can either learn to code and do the small changes myself (I won't) or learn to better articulate my idea.I think people who say AI is not good at front end are just people who expect AI to great something beautiful with "make it look nice" or "title not aligned, do better".I tend to expect AI to know exactly what i am talking about when i send a screenshot but i am pushing myself to really describe better my issue and try to have design idea myself.

- by [unknown](#) **&#x21C5; 2**
  <br/> Get a good frontend skill. That'll help.

- by [unknown](#) **&#x21C5; 1**
  <br/> Which one do you use, Claude's? To be honest, I just don't know if it helps with these problems. [https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/](https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/)

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah frontend-design , but there's others. Honestly, on reddit they talk about front end design like a monolith when that's hardly the case. A visual impressive site is cool for a benchmark but oft you want a functional, tasteful site thats suited for your use case.

- by [unknown](#) **&#x21C5; 2**
  <br/> It takes a lot of effort on your end to get good output from sol for frontend stuff. Claude models could cook better friend from a few exploratory prompts.

- by [unknown](#) **&#x21C5; 2**
  <br/> Do some looking around and research on UI skills.  It has taken me many months but I am finally getting really good front end design out of GPT (currently 5.6 Sol high)

- by [unknown](#) **&#x21C5; 1**
  <br/> Which one do you use, Claude's? To be honest, I just don't know if it helps with these problems. [https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/](https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/)

- by [unknown](#) **&#x21C5; 2**
  <br/> No.  I kind of Frankensteined a few together.  The Meta one they put out is really good.  Astryx I believe it is called.  There are others that drastically improved the UI/UX output of Codex.  I have it now to where it is pretty impressive.  Better than Claude (any model) stock.

- by [unknown](#) **&#x21C5; 1**
  <br/> mind sharing your skill file?

- by [unknown](#) **&#x21C5; 1**
  <br/> It's not really that simple.  Best bet is just do some research on GitHub.  That is where I got them all.  I basically combined 4 different skills.  I only remember the name of the Meta one, Astryx.  The other three I piecemealed them together.  You might even end up with something better than what I have.

The output is flat out amazing when done right.

I also cannot recommend Nvdia Skillspector enough.  Get it.  It's on GitHub.

- by [unknown](#) **&#x21C5; 1**
  <br/> bro i appreciate your intel and you answering and ill do the research fs i just dont really understand why its not that simple to share the skill (s) files or like the content of the skills, unless you wanna gatekeep but just say that haha

cheers tho

- by [unknown](#) **&#x21C5; 1**
  <br/> Because my skill file is a lot more than just those.  Meanwhile you accuse me of gatekeeping while I gave you a ton of info.  No good deed goes unpunished.

- by [unknown](#) **&#x21C5; 1**
  <br/> I had Codex look for the ones I started with before I Frankensteined them together.

Design-taste-frontend High-end-visual-design Minimalist-ui-design

Plus Meta Astryx

Just remember, you need to read through the docs and GitHub of each.  It's not as simple as just installing them.

The other reason you really need to fully understand what parts of which you are adding is because when you are calling them you need to understand how to prompt it right based on what each does and does not do.

- by [unknown](#) **&#x21C5; 1**
  <br/> I use Codex but I was trying Cursor for a month and thought I'd give Fable a go. I needed to make a menu for a Unity game, Fable did an excellent job and even generated an image for the background, I expected slop but actually looks really good. By contrast GPT generally gives more bland output, not great, not terrible. Shame that Claude are so stingey with the quotas.

- by [unknown](#) **&#x21C5; 1**
  <br/> Didnt read all of that. No. If you like generic then yes. If you first create a .md with the examples of the ui you want then its no different then codex has been since 2025

- by [unknown](#) **&#x21C5; 1**
  <br/> For frontend, it's bad. I never ask it to work on frontend without a screenshot or URL reference.

For logic, it's great. Especially with the in-app browser, it finds bugs and, with a proper plan, can implement a fully functioning feature in one go.

- by [unknown](#) **&#x21C5; 1**
  <br/> But even with an exact visual reference (URL), it still messes it up [https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/](https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/)

- by [unknown](#) **&#x21C5; 1**
  <br/> OpenAI models lack what I would describe as 'Visual Intelligence' compared to Opus/Fable and even Sonnet.

[Feel free to look these skills I use](https://github.com/RZRAA/visual-product-engineering-skills)

Actually now when I create a UI mockup and feed that to Luna-Xhigh actually spits out much better results.

- by [unknown](#) **&#x21C5; 1**
  <br/> Use a starting generated image you made in chat. Tell codex/work to keep the theme and give it that image. Then.give it the specific permission to generate assets that match quality of first image and UI elements.

Let it loose.

Nothing is as good as sol at work.

- by [unknown](#) **&#x21C5; 1**
  <br/> You don't need high reasoning for subjective things like UI design, because AI is not good at evaluating subjective things. The only benefit of higher reasoning is catching bugs with the code.

- by [unknown](#) **&#x21C5; 1**
  <br/> Based on my experience from today's tests, Sol (high) definitely implements the feedback more thoroughly and doesn't, like Terra (high), often declare it's done way too quickly. Sol also seems to find more errors in the image analysis when used as a reference, but there's still a lot of room for improvement, and of course it takes an extremely long time. That's why I'm going to test Gemini Flash 3.7 right away—I'm tired of this with GPT-5.6.

- by [unknown](#) **&#x21C5; 1**
  <br/> Just install frontend design skill from opendesign. It reaches 60-70% of what Claude Design does with GPT Sol 5.6 in my experience. It is enough for most things. Claude Design is overkill for moderate tasks. I only use Claude Design if the ChatGPT fails.

- by [unknown](#) **&#x21C5; 1**
  <br/> You mean this? [https://github.com/nexu-io/open-design/blob/main/skills/frontend-skill/SKILL.md](https://github.com/nexu-io/open-design/blob/main/skills/frontend-skill/SKILL.md)

- by [unknown](#) **&#x21C5; 1**
  <br/> Yes! Just ask Codex to install it for you

- by [unknown](#) **&#x21C5; 1**
  <br/> Even at ultra it sucks.

 
       [](https://preview.redd.it/in-your-opinion-how-good-is-gpt-5-6-sol-for-front-end-v0-5xbzr5q7qbjh1.jpeg?width=434&format=pjpg&auto=webp&s=dafff62bc138a47ca9cb77f15fda8fba424a70a7)

- by [unknown](#) **&#x21C5; 2**
  <br/> Kimi k3

 
       [](https://preview.redd.it/in-your-opinion-how-good-is-gpt-5-6-sol-for-front-end-v0-64007y1bqbjh1.jpeg?width=1308&format=pjpg&auto=webp&s=34256bdd7fce7772d5ab4ea5cb03c8205fed3272)

- by [unknown](#) **&#x21C5; 1**
  <br/> Have you tried Gemini Flash 3.7 yet? Kimi K3 is also pretty expensive right now via the API, isn't it?

- by [unknown](#) **&#x21C5; 1**
  <br/> Very expensive. Ate my half my opencode go month's usage + $10 api credits

For Gemini:

I have lost faith since the March AGY fuck up, and the terrible coding skills of gemini 3.5. 3.7 is at least better on benchmarks but the cost is Higher too

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ve been testing it for a few hours now. Unfortunately, it’s still making some very unnecessary errors. I’m not all that impressed yet. There isn’t much difference in performance between "high" and "medium" reasoning. But it is cheap.

- by [unknown](#) **&#x21C5; 1**
  <br/> Which model?

- by [unknown](#) **&#x21C5; 1**
  <br/> Oh sry Gemini 3.7 Flash. But it has also already solved a couple of problems where gpt-5.6-sol with reasoning high couldn't make any progress. And that for 1/3-1/6 of the price.

- by [unknown](#) **&#x21C5; 1**
  <br/> It is good enough if you give it a design system, otherwise it produces quite bootstrap-like UI.

- by [unknown](#) **&#x21C5; 1**
  <br/> For frontend - I've found I either need to get generated images from GPT images and reference that...

BUT.... also look into Manus... Manus 1.6 is pretty impressive with frontend design once you know how to push it.   I've done a few projects where Manus has designed front end, exported files and then I just imported into Codex project folder and GPT did all the backend work and linked it up.

- by [unknown](#) **&#x21C5; 1**
  <br/> It’s actually very good, but should promote and give it a role model.

It’s too conservative by default.

I’m doing some mobile first UIs and it gives great suggestions and implements them cleanly.

- by [unknown](#) **&#x21C5; 1**
  <br/> For me it is working better than Anthropic models.Do you use /frontend skill?

I love such workflow where I use image gen for some UI generations and then ask AI to implement this. Usually it is not that far off

- by [unknown](#) **&#x21C5; 1**
  <br/> This one? [https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) I just don't know if it helps with these problems. [https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/](https://www.reddit.com/r/codex/comments/1vnv0uh/comment/p3pg6bm/)

- by [unknown](#) **&#x21C5; 1**
  <br/> It's pretty awful for front end stuff.

- by [unknown](#) **&#x21C5; 1**
  <br/> Just the frontend skill.  It makes images for the UI which are pretty good out of the box.  Ensure to use Goal and to also match a desktop and mobile application.

- by [unknown](#) **&#x21C5; 3**
  <br/> Fable & 5.6 Sol collaborating with each other is the shit

- by [unknown](#) **&#x21C5; 2**
  <br/> What do you mean, you get more done with Sol? Anyway, when I had to fix something on the front end, Opus 5 cost me almost $13 per task via the OpenRouter API. But at least it got the job done. With Terra and Sol, I still hadn’t found a solution after five attempts. Or rather, it kept saying it was done too soon.

Things like comparing hero image positions against a live page as a reference, etc. This involves a template migration for one of my e-commerce stores with a new technology.

- by [unknown](#) **&#x21C5; 2**
  <br/> What I find that get better results is to prototype a lot before implementing. With impecable and also with the prototype skill from matt pocock
