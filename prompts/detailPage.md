To create a new page using the current static site generator code:

1. Create a new TypeScript file in the `src/pages` directory, e.g., `NewPage.ts`. List the name before the contents of the file.

2. Import necessary modules:

```TypeScript
import i18next from "../GlobalSitesCore/i18n";
import { Layout } from "../Layout";
import { RenderProps, renderLanguageFiles } from "../GlobalSitesCore/languages";
import { FileResult } from "../GlobalSitesCore/FileResult";
```

3. Define an async function to generate pages for all languages. If the page needs more than one file per language, add a loop for rendering and return all the resulting files.

```TypeScript
export async function NewPagePages(): Promise<FileResult[]> {
  return renderLanguageFiles({
    subDirectoryInEnglish: undefined,
    fileNameInEnglish: "new-page",
    includeInSitemap: true,
    render: (props) => NewPage(props),
  });
}
```

For page-specific details, use props like this:

```TypeScript
export async function NewPagePages(): Promise<FileResult[]> {
  var newPageProps = {
     name: 'example',
     phone: '555-444-3333'
  };
  return renderLanguageFiles({
    subDirectoryInEnglish: undefined,
    fileNameInEnglish: "new-page",
    includeInSitemap: true,
    render: (renderProps) => NewPage(renderProps, newPageProps),
  });
}
```

4. Create an interface for the page props:

```TypeScript
interface NewPageProps extends RenderProps {}
```

5. Implement the main render function:

```TypeScript
export function NewPage(props: NewPageProps): string {
  var title = i18next.t(`New Page Title`);
  var metaDescription = i18next.t(`New Page Description`);

  return Layout({
    lang: props.option.code,
    title: title,
    description: metaDescription,
    languageOptions: props.allOptions,
    content: /* HTML */ `
      <!-- Your page content here -->
      <h1>${title}</h1>
      <p>${metaDescription}</p>
      <!-- Add more content as needed -->
    `,
  });
}
```

6. Use i18next.t() for translatable text and follow the patterns in @Index.ts for handling dynamic content, pluralization, and date formatting. As much wording as possible should be translated at compile time.

7. All JavaScript should be inline. Number calculations should be localized,

8. Include a description section that briefly says how to use the tool.

9. Add an article section on the page that provides detailed context on the tool. It should include where this kind of tool would be used, any restrictions on the calculations. Use a professional but friendly tone.

10. Update the main application file @build.ts to include the new page in the site generation process.

It will likely include adding a new item to the files array like this:

```TypeScript
await NewPagePages(),
```

It will also likely need to add an import like this:

```Typescript
import { NewPagePages } from "./pages/NewPage";
```

11. Run `npm run dev` to get the translation process running.
