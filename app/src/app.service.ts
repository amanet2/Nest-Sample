import { Injectable } from '@nestjs/common';
import {
  Product,
  ReceivingArea,
  StorageArea,
  pickTask,
  Order,
  logLevel,
} from './app.classes';
import { Queue } from './app.queue';

@Injectable()
export class AppService {
  readonly products = {};
  readonly receivingLocations = {};
  readonly storageLocations = {};

  readonly history: string[] = []; // TODO: make a protected/private member and FORCE use of logging to modify
  readonly pickTaskQueue: Queue = new Queue();

  getStatus(): string {
    return JSON.stringify({
      products: this.products,
      receivingLocations: this.receivingLocations,
      storageLocations: this.storageLocations,
    });
  }

  getHistory(): string {
    return this.history.toString();
  }

  createProduct(name: string, sku: string) {
    let success = false;
    let message = `Product sku ${sku} already exists`;

    if (!(sku in this.products)) {
      this.products[sku] = new Product(name, sku);
      success = true;
      message = `Created new product SKU ${sku} w/ name ${name}`;
      this.logMessage(logLevel.INFO, message);
    }

    return { success: success, message: message };
  }

  createReceivingLocation(name: string) {
    let success = false;
    let message = `Receiving area ${name} already exists`;

    if (!(name in this.receivingLocations)) {
      this.receivingLocations[name] = new ReceivingArea(name);
      success = true;
      message = `Created new receiving location ${name}`;
      this.logMessage(logLevel.INFO, message);
    }

    return { success: success, message: message };
  }

  createStorageLocation(name: string) {
    let success = false;
    let message = `Storage area ${name} already exists`;

    if (!(name in this.storageLocations)) {
      this.storageLocations[name] = new StorageArea(name);
      success = true;
      message = `Created new storage location ${name}`;
      this.logMessage(logLevel.INFO, message);
    }

    return { success: success, message: message };
  }

  getInventoryBySku(sku: string): number {
    let totalQuantity = 0;

    for (const receivingLocationKey of Object.keys(this.receivingLocations)) {
      if (sku in this.receivingLocations[receivingLocationKey].products)
        totalQuantity +=
          this.receivingLocations[receivingLocationKey].products[sku].quantity;
    }

    for (const storageLocationKey of Object.keys(this.storageLocations)) {
      if (sku in this.storageLocations[storageLocationKey].products)
        totalQuantity +=
          this.storageLocations[storageLocationKey].products[sku].quantity;
    }

    return totalQuantity;
  }

  getInventoryByReceivingArea(sku: string, receivingAreaName: string): number {
    if (
      receivingAreaName in this.receivingLocations &&
      sku in this.receivingLocations[receivingAreaName].products
    )
      return this.receivingLocations[receivingAreaName].products[sku].quantity;

    return 0;
  }

  getInventoryByStorageArea(sku: string, storageAreaName: string): number {
    if (
      storageAreaName in this.storageLocations &&
      sku in this.storageLocations[storageAreaName].products
    )
      return this.storageLocations[storageAreaName].products[sku].quantity;

    return 0;
  }

  receiveProduct(
    receivingAreaName: string,
    productSku: string,
    productQuantity: number,
  ) {
    if (!(receivingAreaName in this.receivingLocations))
      return {
        success: false,
        message: `Receiving Area does not exist: ${receivingAreaName}`,
      };

    const receivingLocation = this.receivingLocations[receivingAreaName];

    if (!(productSku in receivingLocation.products))
      receivingLocation.products[productSku] = {
        sku: productSku,
        quantity: productQuantity,
      };
    else receivingLocation.products[productSku].quantity += productQuantity;

    const successMessage = `received ${productQuantity} units of product ${productSku} into receiving area ${receivingAreaName}`;
    this.logMessage(logLevel.INFO, successMessage);

    return { success: true, message: successMessage };
  }

  putawayProduct(
    receivingAreaName: string,
    storageAreaName: string,
    productSku: string,
    productQuantity: number,
  ) {
    if (!(receivingAreaName in this.receivingLocations))
      return {
        success: false,
        message: `Receiving Area does not exist: ${receivingAreaName}`,
      };

    if (!(storageAreaName in this.storageLocations))
      return {
        success: false,
        message: `Storage Area does not exist: ${storageAreaName}`,
      };

    const receivingLocation = this.receivingLocations[receivingAreaName];
    const storageLocation = this.storageLocations[storageAreaName];

    if (!(productSku in receivingLocation.products))
      return {
        success: false,
        message: `Product sku ${productSku} does not exist in receiving area ${receivingAreaName}`,
      };

    const receivingLocationProductQuantity = this.getInventoryByReceivingArea(
      productSku,
      receivingAreaName,
    );

    if (productQuantity > receivingLocationProductQuantity)
      return {
        success: false,
        message:
          `Insufficient quantity to putaway sku ${productSku} from receiving area ` +
          `${receivingAreaName} into storage area ${storageAreaName}. Requested: ${productQuantity}, Available: ${receivingLocationProductQuantity}`,
      };

    if (!(productSku in storageLocation.products))
      storageLocation.products[productSku] = {
        sku: productSku,
        quantity: productQuantity,
      };
    else storageLocation.products[productSku].quantity += productQuantity;

    receivingLocation.products[productSku].quantity -= productQuantity;

    const successMessage = `put away ${productQuantity} units of product ${productSku} from receiving area ${receivingAreaName} into storage area ${storageAreaName}`;

    this.logMessage(logLevel.INFO, successMessage);
    return { success: true, message: successMessage };
  }

  orderProduct(productSku: string, productQuantity: number) {
    const newOrder = new Order();
    newOrder.placeOrder();
    newOrder.confirmOrder();

    const newTask = new pickTask(productSku, productQuantity);

    this.pickTaskQueue.push(newTask);

    // TODO: asynchronously handle pick tasks

    const todoTask = this.pickTaskQueue.dequeue();

    const pickResult = this.pickProduct(todoTask.sku, todoTask.qty);

    if (pickResult.success) {
      newOrder.pickOrder();
      newOrder.shipOrder();
      return {
        success: true,
        message: `Successfully ordered ${productQuantity} units of sku ${productSku}, shipped!`,
      };
    } else return pickResult;
  }

  getLowestInventoryStorageArea(
    productSku: string,
    productQuantity: number,
  ): StorageArea | undefined {
    let lowestInventoryStorageLocation = undefined;
    let lowestQty = -1;

    for (const storageLocationKey of Object.keys(this.storageLocations)) {
      if (
        productSku in this.storageLocations[storageLocationKey].products &&
        productQuantity <=
          this.getInventoryByStorageArea(productSku, storageLocationKey)
      ) {
        const storageLocation = this.storageLocations[storageLocationKey];
        const storageLocationQty = this.getInventoryByStorageArea(
          productSku,
          storageLocationKey,
        );

        if (lowestInventoryStorageLocation === undefined) {
          lowestInventoryStorageLocation = storageLocation;
          lowestQty = storageLocationQty;
        } else if (storageLocationQty < lowestQty) {
          lowestInventoryStorageLocation = storageLocation;
          lowestQty = storageLocationQty;
        }
      }
    }

    return lowestInventoryStorageLocation;
  }

  pickProduct(productSku: string, productQuantity: number) {
    const pickedStorageLocation = this.getLowestInventoryStorageArea(
      productSku,
      productQuantity,
    );
    if (pickedStorageLocation !== undefined) {
      pickedStorageLocation.products[productSku].quantity -= productQuantity;

      const successMessage = `picked ${productQuantity} units of product ${productSku} from storage area ${pickedStorageLocation.name}`;

      this.logMessage(logLevel.INFO, successMessage);
      return { success: true, message: successMessage };
    }
    return {
      success: false,
      message: `Failed to pick ${productQuantity} units of sku ${productSku}, ensure sufficient inventory`,
    };
  }

  logMessage(level: logLevel, message: string): void {
    // TODO: implement real logging with library of your choice
    this.history.push(
      `${new Date().toISOString()} - [${logLevel.toString(level)}] - ${message}`,
    );
  }
}
