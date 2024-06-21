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
  return originalText.replaceOnce(searchText, replacementText);
}

if (!String.prototype.replaceOnce) {
  String.prototype.replaceOnce = function (searchText, replacementText) {
    const occurrences = this.split(searchText).length - 1;
    if (occurrences !== 1) {
      throw new Error(
        `Translation with value "${searchText}" appears ${occurrences} times in ${this}. Expected exactly once. Check the src/locale files to see if the translation should be fixed.`
      );
    }
    return this.replace(searchText, replacementText);
  };
}
