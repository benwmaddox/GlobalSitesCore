export class TupleSet {
  private set: Set<string>;
  private tupleList: [string, string, string][]; // Store tuples for retrieval

  constructor() {
    this.set = new Set<string>();
    this.tupleList = [];
  }

  add(tuple: [string, string, string]): void {
    const key = JSON.stringify(tuple);
    if (!this.set.has(key)) {
      this.set.add(key);
      this.tupleList.push(tuple); // Only add to the list if it's unique
    }
  }

  has(tuple: [string, string, string]): boolean {
    const key = JSON.stringify(tuple);
    return this.set.has(key);
  }

  delete(tuple: [string, string, string]): boolean {
    const key = JSON.stringify(tuple);
    if (this.set.has(key)) {
      this.set.delete(key);
      // Remove from tupleList
      this.tupleList = this.tupleList.filter((t) => JSON.stringify(t) !== key);
      return true;
    }
    return false;
  }

  getUniqueTuples(): [string, string, string][] {
    return this.tupleList;
  }
}
