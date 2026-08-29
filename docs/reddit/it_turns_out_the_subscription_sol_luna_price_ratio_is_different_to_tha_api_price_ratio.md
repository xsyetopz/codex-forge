# it turns out the subscription sol/luna price ratio is different to tha api price ratio [Visit](https://www.reddit.com/r/codex/comments/1vt7t2c/it_turns_out_the_subscription_solluna_price_ratio/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Emu-001](https://www.reddit.com/user/Emu-001/)

### **Vote:** 6

---
**TLDR**: You get 1.7–1.8× more API-dollar-equivalent allowance when using Sol than when using Luna.
Just like others, I have tried to see how much value my plus sub is giving me a week. I have find that luna and sol have a different price ratio or price cap than the API price. I have come to a surprise that per week wise, sol will give approx 1.7-1.8x API$ value than luna.
So for the first part of this reset cycle, I was only using luna. I realize that i could use this opportunity to test how much $ value i could get from luna and sol, since the weekly limit precentage was luna only.
I have came to this by go throuth logs and check % limit used. luna here account for 19% weekly. which estimate $68.9 weekly limit.**Luna cost** ($0.20/M input · $0.02/M cached · $1.20/M output)

- Uncached input: 19.84M × $0.20 = $3.97
- Cached input: 297.7M × $0.02 = $5.95
- Output: 2.64M × $1.20 = $3.17
- **Total: $13.09**
I have then move to use sol only for a bit to burn some limt. Which accounts to 16% weekly. This gives estimate $124 weekly limit.
**Sol cost** ($5/M input · $0.50/M cached · $30/M output)
- Uncached input: 0.88M × $5 = $4.38
- Cached input: 21.26M × $0.50 = $10.63
- Output: 0.16M × $30 = $4.83
- **Total: $19.84**
This is interesting finding as 124/68.9 = **1.8x weekly cap**.
I have then used a mixture of sol and luna for the rest of my weekly limte. Then final API $price i got is. for 100% weekly.
- Sol: $89.69 (914 requests)
- Luna: $23.19 (5,309 requests)
and use previous sol/luna weekly estimate to calculate precentage useage backward gets.
Sol: $89.69/$124 = 72.3%
luna: $23.19/$68.9 = 33.6%
72.3% + 33.6% = 105.9%
This is not 100% accurate but quite telling!
but even we do 100%/105.9% * 1.8 = 1.7x
So the in subscription price ratio between sol/luna is different to the API listed price, by a factor of 1.7 - 1.8x.
Would be interested to see other's results.
Note: the log was obtained throuth opencodex, so it should be reasonably good.
Edit: add TLDR

---

## Comments 8

- by [unknown](#) **&#x21C5; 2**
  <br/> Makes sense. The whole reason there’s so much ink spilled about subscription value is because with a flagship closed source model on API pricing, you can burn through $20 in like… 20 minutes

- by [unknown](#) **&#x21C5; 2**
  <br/> New result after reset**gpt-5.6-luna — 266 requests**

              Token type

              Tokens

              Rate (/1M)

              Cost








                Uncached input

                2,704,962

                $0.20

                $0.54



                Cached (read) input

                26,501,632

                $0.02

                $0.53



                Output

                213,736

                $1.20

                $0.26



                **Total**

                **29.2M in / 0.21M out**



                **$1.33**

    **Weekly cap if $1.33 = 2% used → ~$66.38.**

- by [unknown](#) **&#x21C5; 2**
  <br/> you're right about the price ratio discrepancy, the 1.7-1.8x gap between sol and luna allowances hit me last tuesday when i switched mid-cycle. watched my weekly limit percentage drop from 19% to 16% while supposedly using more expensive tokens. did you test this across different api endpoints or just the main dashboard?

- by [unknown](#) **&#x21C5; 1**
  <br/> Good to know. I used to use deepseek flash as builder, but shifted to luna recently. May need to try Gemini later to maximise the value of openai subscription. Thanks for the test

- by [unknown](#) **&#x21C5; 1**
  <br/> Yeah I came to the same conclusion, Luna's "credits" in subscription are worth less than Sol's "credits", or in other words considering API pricing you get less value on your subscription using Luna than using Sol. But what I did not do and what you did, was to put specific number on this.

- by [unknown](#) **&#x21C5; 1**
  <br/> What the fuck did I just read?

- by [unknown](#) **&#x21C5; 2**
  <br/> A post, on reddit, on the web.

- by [unknown](#) **&#x21C5; 1**
  <br/> Basically you can get 1.7–1.8× more API-dollar-equivalent allowance when using Sol than when using Luna.This hidden factor might be why everyone report differnet $value.
