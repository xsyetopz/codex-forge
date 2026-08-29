# I got codex do some digging on logs regarding the usage drain. here is what it found. [Visit](https://www.reddit.com/r/codex/comments/1vv5lc7/i_got_codex_do_some_digging_on_logs_regarding_the/)

### **Subreddit:** [r/codex](https://www.reddit.com/r/codex)

### **Author:** [Gloomy-Scarcity-2336](https://www.reddit.com/user/Gloomy-Scarcity-2336/)

### **Vote:** 27

---

I have pro (x5) subscription, for the kind of tasks I do normally I use it every week on working all day, and I get about 10%~5% on the last day before rest.
this time for some reason its at 50% only after 2 days. I noticed the really fast drain on first day, so I though its something related to model cache, so I changed my pattern from changing model depending on task to open multi threads each one to stay in one model and one effort only.
so now when there is enough data I asked codex to analyze it.
[](https://preview.redd.it/i-got-codex-do-some-digging-on-logs-regarding-the-usage-v0-h52tlfqtlvkh1.jpg?width=456&format=pjpg&auto=webp&s=02fd69862a29ab2bda154cde2c3dce6a9998b454)
so it worked, I got cache hits improvement, but, the usage drain problem still insane. and every one of us have the prove in our logs. I asked codex to analyze the usage and here the results.
[](https://preview.redd.it/i-got-codex-do-some-digging-on-logs-regarding-the-usage-v0-x6godqrkmvkh1.jpg?width=1570&format=pjpg&auto=webp&s=7508f4e5ff4a915972fcdac97954455414481e10)
so what Tibo saying that they suspect the cache hit is the problem doesn't look to be it.
also I dont and I never use any additional plugins or skills, I only work on official codex cli all the time.
[](https://preview.redd.it/i-got-codex-do-some-digging-on-logs-regarding-the-usage-v0-cjz44a1ymvkh1.jpg?width=634&format=pjpg&auto=webp&s=62878c560ee50e5cd85b885798f505568470e7c7)
.. I'm not some one who blame or be aggressive through OpenAI I actually believe in them and I trust them, I don't even try other models when I hear there is something strong, trusting that OpenAI will release the strongest.
I believe that this is some serious problem and I hope they can find a fix
---

## Comments 6

- by [unknown](#) **&#x21C5; 7**
  <br/> I think Tibo unintentionally Told us why in another tweet - the new total of 20 mill subscribers. There's only so much to go round, there's too many people trying to drink the cool aid at once.

- by [unknown](#) **&#x21C5; 1**
  <br/> He said 20 million users of the Codex/Work platform. It is fakish/exaggerated. Free users can use work too

- by [unknown](#) **&#x21C5; 5**
  <br/> Here's my own Pro 5x data. My usage is like 97% cache hits and inferred capacity is still going down nearly every reset. There's no way this is some "cache problem".

Codex `plan_type=prolite` reset-window data
Snapshot: 2026-08-22 13:41 UTC

Reset: 2026-08-13 21:36 UTC
Status: 100% used — Plus trial
Fresh input: 11.344M tokens
Cache hits: 448.122M tokens
Output: 1.778M tokens
Inferred capacity: 6,461 credits

Reset: 2026-08-17 10:20 UTC
Status: 100% used
Fresh input: 27.044M tokens
Cache hits: 984.068M tokens
Output: 4.752M tokens
Inferred capacity: 15,525 credits

Reset: 2026-08-18 04:04 UTC
Status: 100% used
Fresh input: 33.902M tokens
Cache hits: 1,118.657M tokens
Output: 5.511M tokens
Inferred capacity: 15,255 credits

Reset: 2026-08-20 08:44 UTC
Status: 100% used
Fresh input: 30.259M tokens
Cache hits: 825.795M tokens
Output: 3.855M tokens
Inferred capacity: 12,533 credits

Reset: 2026-08-27 08:45 UTC
Status: 100% used
Fresh input: 24.470M tokens
Cache hits: 787.131M tokens
Output: 4.002M tokens
Inferred capacity: 11,402 credits

Reset: 2026-08-29 03:09 UTC
Status: 77% used — active window
Fresh input: 16.277M tokens
Cache hits: 624.465M tokens
Output: 2.604M tokens
Inferred capacity: 11,805 creditsInferred capacity is calculated by counting all tokens in local sessions and applying API rates: fresh input + cached input + output, all with model specific multipliers.

- Earlier stable range: 15.3–15.5k
- Transitional window: 12.5k
- New range: 11.4–11.8k
- Reduction: approximately 24–27%

- by [unknown](#) **&#x21C5; 4**
  <br/> We've also tested 16 - 21 using few x5 and x20 subscriptions with different harnesseses (Pi, OC, Codex) and we've had problems with cache hits, sometimes dropping to unreasonable levels mid session which persists till now. You can notice some lag between thinking and output right before this happens.

I'm not sure this affects everyone, but it is more than possible that issue exists.

- by [unknown](#) **&#x21C5; 1**
  <br/> Try dsh for cache hit

- by [unknown](#) **&#x21C5; 3**
  <br/> i also saw that , thanks for sharing your insights
