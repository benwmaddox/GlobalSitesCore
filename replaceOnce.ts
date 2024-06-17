declare global {
  interface String {
    replaceOnce(searchText: string, replacementText: string): string;
  }
}

export function replaceOnce(
  originalText: string,
  searchText: string,
  replacementText: string
): string {
  const occurrences = originalText.split(searchText).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      //console.error(
      `The text "${searchText}" appears ${occurrences} times in the ${originalText}. Expected exactly once. Replacement text was "${replacementText}".`
    );
  }
  return originalText.replace(searchText, replacementText);
}
if (!String.prototype.replaceOnce) {
  String.prototype.replaceOnce = function (searchText, replacementText) {
    const occurrences = this.split(searchText).length - 1;
    if (occurrences !== 1) {
      throw new Error(
        //console.error(
        `The text "${searchText}" appears ${occurrences} times in the "${this}". Expected exactly once. Replacement text was "${replacementText}".`
      );
    }
    return this.replace(searchText, replacementText);
  };
}
