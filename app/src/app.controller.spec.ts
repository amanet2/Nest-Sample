import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('basic acceptance criteria', () => {
    it('should create products and areas', () => {
      // Create product A ( sku=A123 ).
      expect(
        appController.createProduct({ name: 'foobar', sku: 'A123' }).success,
      ).toBeTruthy();

      // Create locations R1 (receiving) and S1 (storage).
      expect(
        appController.createReceivingArea({ name: 'R1' }).success,
      ).toBeTruthy();
      expect(
        appController.createStorageArea({ name: 'S1' }).success,
      ).toBeTruthy();

      // Receive 10 units of A into R1.
      expect(
        appController.receiveProduct({ area: 'R1', sku: 'A123', qty: 10 })
          .success,
      ).toBeTruthy();
      expect(
        JSON.parse(appController.getStatus()).receivingLocations['R1'].products[
          'A123'
        ].quantity,
      ).toBe(10);

      // Putaway 8 units from R1 → S1.
      expect(
        appController.putawayProduct({
          receivingArea: 'R1',
          storageArea: 'S1',
          sku: 'A123',
          qty: 8,
        }).success,
      ).toBeTruthy();
      expect(
        JSON.parse(appController.getStatus()).receivingLocations['R1'].products[
          'A123'
        ].quantity,
      ).toBe(2);
      expect(
        JSON.parse(appController.getStatus()).storageLocations['S1'].products[
          'A123'
        ].quantity,
      ).toBe(8);

      // Ensure no negative inventory
      expect(
        appController.putawayProduct({
          receivingArea: 'R1',
          storageArea: 'S1',
          sku: 'A123',
          qty: 8,
        }).success,
      ).toBeFalsy();
      expect(
        JSON.parse(appController.getStatus()).receivingLocations['R1'].products[
          'A123'
        ].quantity,
      ).toBe(2);
      expect(
        JSON.parse(appController.getStatus()).storageLocations['S1'].products[
          'A123'
        ].quantity,
      ).toBe(8);

      // Create an order for 5 units of A and pick it. Should remove stock from the storage area S1
      expect(
        appController.pickProduct({ sku: 'A123', qty: 5 }).success,
      ).toBeTruthy();
      expect(
        JSON.parse(appController.getStatus()).receivingLocations['R1'].products[
          'A123'
        ].quantity,
      ).toBe(2);
      expect(
        JSON.parse(appController.getStatus()).storageLocations['S1'].products[
          'A123'
        ].quantity,
      ).toBe(3);

      // Ensure no negative inventory
      expect(
        appController.pickProduct({ sku: 'A123', qty: 5 }).success,
      ).toBeFalsy();
      expect(
        JSON.parse(appController.getStatus()).receivingLocations['R1'].products[
          'A123'
        ].quantity,
      ).toBe(2);
      expect(
        JSON.parse(appController.getStatus()).storageLocations['S1'].products[
          'A123'
        ].quantity,
      ).toBe(3);
    });
  });
});
