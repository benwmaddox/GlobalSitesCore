export function titleCase(item: string) {
  // Copied from root beer text's convert case page
  let l = standardizeToSentenceCaseSingleLine(item);
  var title = l
    .split(" ")
    .map((w: string) => {
      // If all are uppercase, keep uppercase
      if (w === w.toUpperCase()) {
        return w;
      }
      return w.length > 1
        ? w[0].toUpperCase() + w.slice(1).toLowerCase()
        : w.toUpperCase();
    })
    .join(" ")
    // replace all double spaces with one space
    .replace(/\s\s+/g, " ");
  if (title.trim() === "") {
    console.trace(`Title is empty for ${item}. ${l} then ${title}`);
    //throw new Error(`Title is empty for ${item}. ${l} then ${title}`);
  }

  return title;
}

function standardizeToSentenceCaseSingleLine(str: string): any {
  // This regex pattern finds words in camelCase, PascalCase, snake_case, and kebab-case
  const words =
    str.match(
      /[A-ZωφεΔθλ]+(?=\s|$)|[a-zωφεΔθλ](?=\s|$)|[A-Za-zωφεΔθλ][a-z]+|[A-Z][a-zωφεΔθλ]+|[0-9]*/g
    ) || [];
  var result = words
    .map((word, index) => {
      // If all are uppercase, keep uppercase
      if (word === word.toUpperCase()) {
        return word;
      }
      // Lowercase all words, but uppercase the first letter of the first word in a sentence
      return index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase();
    })
    .join(" ")
    // replace all double spaces with one space
    .replace(/\s\s+/g, " ")
    .trim();

  if (result === "" && str !== "") {
    // console.log(
    //   `Title is empty for ${str}. ${result} in standardizeToSentenceCaseSingleLine. Using Default Title.`
    // );
    return str;
  }
  return result;
}
