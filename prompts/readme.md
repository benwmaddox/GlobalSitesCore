Using prompts work well with a chatbot. I've used the cursor IDE, referencing a prompt file to make a new page. For example, I could write this:

Using @detailPage.md, write a triangle calculator page.

This was last tested on 6/22/2024 with Claude 3.5 Sonnet.

---

For translations, if you use Manual as the translation option:

1. Go to each the translation file
2. In cursor, chat and just enter something like this for the de language in the chat. (Replace de as needed)
   @translateManualFile.md de language
3. It should do the translations for you. As of 6/24/2024, it seems to work best with gpt-4o.

This might not work if you have a large number of translations. The fallback is to use one of the API approaches.

- Ben Maddox
