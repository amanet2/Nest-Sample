export class Queue {
  private elements: any[] = [];

  push(item: any): void {
    this.elements.push(item);
  }

  dequeue(): any {
    if (this.isEmpty()) return undefined;
    return this.elements.shift();
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }
}
