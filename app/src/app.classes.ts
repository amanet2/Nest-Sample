export class Product {
  name: string;
  sku: string;

  constructor(name: string, sku: string) {
    this.name = name;
    this.sku = sku;
  }
}

export class ReceivingArea {
  name: string;
  products: {};

  constructor(name: string) {
    this.name = name;
    this.products = {};
  }
}

export class StorageArea {
  name: string;
  products: {};

  constructor(name: string) {
    this.name = name;
    this.products = {};
  }
}

export class pickTask {
  sku: string;
  qty: number;

  constructor(sku: string, qty: number) {
    this.sku = sku;
    this.qty = qty;
  }
}

export class Order {
  state: orderState;

  placeOrder() {
    this.state = orderState.PLACED;
  }

  confirmOrder() {
    this.state = orderState.CONFIRMED;
  }

  pickOrder() {
    // TODO: picking logic here or in AppService, backorder, offer cancellation if picking failure

    this.state = orderState.PICKED;
  }

  shipOrder() {
    this.state = orderState.SHIPPED;
  }

  cancelOrder() {
    this.state = orderState.CANCELED;
  }
}

export enum orderState {
  PLACED,
  CONFIRMED,
  PICKING,
  PICKED,
  SHIPPED,
  IN_TRANSIT,
  OUT_FOR_DELIVERY,
  DELIVERED,
  CANCELED,
  FAILED,
}

export namespace logLevel {
  export function toString(level: logLevel): string {
    return logLevel[level];
  }
}

export enum logLevel {
  INFO,
  DEBUG,
  WARNING,
  ERROR,
}
