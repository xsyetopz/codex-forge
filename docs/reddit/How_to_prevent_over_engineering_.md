# How to prevent over engineering? [Visit](https://www.reddit.com/r/codex/comments/1vyy7ys/how_to_prevent_over_engineering/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [ChronoVice](https://www.reddit.com/user/ChronoVice/)

### **Vote:** 3

---

I've noticed ever since 5.6 came out my effectiveness with chatgpt/codex seems to have declined..I'm spending more time on projects and running into more issues. I think 5.6 sol is over engineering everything. I've tried xhigh, high, and medium, and it's still happening. I'm thinking I should just move back to 5.5 as I was accomplishing more.
I see a lot of people of this subreddit mention 5.6 all medium and luna xhigh for codex implementation, but that hasn't helped my problems either.
Does anyone have any advice for balancing task completion without over engineering?
---

## Comments 13

- by [unknown](#) **&#x21C5; 3**
  <br/> 5.5 high as your coder with 5.6 reviews possibly? Same feeling here, was a lot more productive with 5.5

- by [unknown](#) **&#x21C5; 1**
  <br/> I mostly have used sol medium as the coder.

- by [unknown](#) **&#x21C5; 2**
  <br/> I've created a specific project "development standards" where I spend considerable time centralising the development standards rules for AI and CI related tool enforcement. This is then shared as a dev dependency via package management for all projects (I have lots of component libraries).

Any new code then has an acceptance gate in the prompt that specifically needs to validated and check the standard/rules are respected. The great thing about this is that you can have some fairly non-deterministic design rules that AI can understand that would otherwise be very difficult to assert with standard code tooling.

Every time I see the AI go in a direction that I think is too far I can create either a global share rule or project specific one to rein it in and align with what I want. It's been working really well.

- by [unknown](#) **&#x21C5; 2**
  <br/> Put 5.6 Sol on medium. It thinks much less and just starts putting out work. Only crank up the dial when the task is hard to solve. Your meter goes down a lot slower too.

- by [unknown](#) **&#x21C5; 2**
  <br/> Js tell it not to over engineer

- by [unknown](#) **&#x21C5; 2**
  <br/> Yeah I've done this several times over multiple projects. Recently I've been giving it a goal of parsimony which seems to help more than "don't over engineer"

- by [unknown](#) **&#x21C5; 2**
  <br/> "Don't overengineer!"

- by [unknown](#) **&#x21C5; 2**
  <br/> It finds edge cases that it should just use input validation to solve rather than programmatically dealing with bad input. It also solves edge cases that wouldn’t actually occur during use. It hardens everything against a security breach even if the software isn’t critical code infrastructure. I don’t need my paint program hardened against attacks. I just want it to work efficiently for my specified use case.

- by [unknown](#) **&#x21C5; 1**
  <br/> Try a different harness or a different system prompt.

- by [unknown](#) **&#x21C5; 1**
  <br/> For sol I've just been letting it implement what it thinks first, then do a review using interrogating language, asking it to assess if we're over designed, we're efficient, being smart, and "we have minimum viable product for success metrics", or like "are we working with what we have or unnecessarily inventing"

If you think about it from a human perspective, we all tend to over-engineer things first, before refining it down. So I'm not sure if it's a bad thing per se.

- by [unknown](#) **&#x21C5; 1**
  <br/> /unslop look at pstack skills and mattpocock skills

- by [unknown](#) **&#x21C5; 1**
  <br/> I’ve gotten to the point where I feel the need to handhold anything > low. The tendency to rathole and build disproportionate fixes to edge cases is a real problem with Sol. Amazing it finds issues but I have no trust in its solutions.

My concern is that this tendency is both great for benchmarks and terrible for everyday use (for me). If they’re pushing out more intelligent models with this tendency baked into training, I can see even “low” being a problem
