import { Controller, Body, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): string {
    return 'OK';
  }

  @Get('status')
  getStatus(): string {
    return this.appService.getStatus();
  }

  @Get('history')
  getHistory(): string {
    return this.appService.getHistory();
  }

  @Get('inventory')
  getInventory(
    @Query('sku') sku: string,
    @Query('receivingArea') receivingArea?: string,
    @Query('storageArea') storageArea?: string,
  ): any {
    if (receivingArea)
      return this.appService.getInventoryByReceivingArea(sku, receivingArea);

    if (storageArea)
      return this.appService.getInventoryByStorageArea(sku, storageArea);

    return this.appService.getInventoryBySku(sku);
  }

  @Post('create-product')
  createProduct(@Body() data: any): any {
    return this.appService.createProduct(data.name, data.sku);
  }

  @Post('create-receiving-area')
  createReceivingArea(@Body() data: any): any {
    return this.appService.createReceivingLocation(data.name);
  }

  @Post('create-storage-area')
  createStorageArea(@Body() data: any): any {
    return this.appService.createStorageLocation(data.name);
  }

  @Post('receive-product')
  receiveProduct(@Body() data: any): any {
    return this.appService.receiveProduct(data.area, data.sku, data.qty);
  }

  @Post('putaway-product')
  putawayProduct(@Body() data: any): any {
    return this.appService.putawayProduct(
      data.receivingArea,
      data.storageArea,
      data.sku,
      data.qty,
    );
  }

  @Post('pick-product')
  pickProduct(@Body() data: any): any {
    return this.appService.pickProduct(data.sku, data.qty);
  }

  @Post('order-product')
  orderProduct(@Body() data: any): any {
    return this.appService.orderProduct(data.sku, data.qty);
  }
}
