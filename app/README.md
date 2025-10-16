## Description

A simple API with the ability to:
* Create products, receiving, and storage areas
* Receive products into a receiving area
* Putaway product from receiving into storage
* Order an item (pick item from storage)
* View inventory of item by location and/or product
* Show movement history (logs)

## Design Considerations
* Because of the limited timebox:
  * data is retained in-memory
  * Orders are limited to one sku per order
* Blocks are in place to avoid a situation of negative inventory
* I implemented a strategy for picking, which will search for the storage area with the lowest quantity of the sku to fulfill the order.
* A simple logging strategy was implemented where relevant operations are stored in history w/ timestamp and log level.
* I left TODOs for several considerations that should be implemented
  * With a pick-task queue, I would create a separate service for handling this queue
  * Pick-tasks would be enqueues by the WMS, and dequeued by another scheduled service
    * This would ensure orders are processed on a first-come first-serve basis and avoid race conditions

* Future features I would add to bring this to MVP:
  * The aforementioned queuing and multi-service architecture
  * A real logging library
  * Storing movement history in a DB or other off-memory location
  * Multiple skus in an order
  * Integration tests, not just unit tests
  * Fix linting issues, stronger typing/usage of interfaces

## Project setup
### Manually
```bash
$ cd app/
$ npm install
```
### Or use script:
```bash
cd scripts/
run.bat
```

## Compile and run the project

```bash
# development
$ npm run start
```

## Run tests

```bash
# unit tests
$ npm run test
```
## Batch scripts
I have included several windows batch scripts in the `scripts/` directory for convenience

### start the npm server and populate products/areas
```batch
run.bat
create_setup.bat
```

### receive 10 units of A123 into R1
```batch
receive_product.bat
```

### putaway 8 units of A123 from R1 to S1
```batch
putaway_product.bat
```

### order (and pick) 5 units of A123
```batch
order_product.bat
```

### show movement history (logs)
```batch
get_history.bat
```

### show inventory of sku A123
```batch
curl localhost:3000/inventory?sku=A123
curl localhost:3000/inventory?sku=A123&receivingArea=R1
curl localhost:3000/inventory?sku=A123&storageArea=S1
```

## Sample output
```
C:\Code\training-nest\scripts>create_setup.bat

C:\Code\training-nest\scripts>call create_product.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"name\": \"A\", \"sku\": \"A123\"}" localhost:3000/create-product

{"success":true,"message":"Created new product SKU A123 w/ name A"}

C:\Code\training-nest\scripts>call create_receiving_area.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"name\": \"R1\"}" localhost:3000/create-receiving-area

{"success":true,"message":"Created new receiving location R1"}

C:\Code\training-nest\scripts>call create_storage_area.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"name\": \"S1\"}" localhost:3000/create-storage-area

{"success":true,"message":"Created new storage location S1"}

C:\Code\training-nest\scripts>receive_product.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"area\": \"R1\", \"sku\": \"A123\", \"qty\": 10}" localhost:3000/receive-product

{"success":true,"message":"received 10 units of product A123 into receiving area R1"}

C:\Code\training-nest\scripts>putaway_product.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"receivingArea\": \"R1\", \"storageArea\": \"S1\", \"sku\": \"A123\", \"qty\": 8}" localhost:3000/putaway-product

{"success":true,"message":"put away 8 units of product A123 from receiving area R1 into storage area S1"}

C:\Code\training-nest\scripts>order_product.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"sku\": \"A123\", \"qty\": 5}" localhost:3000/order-product

{"success":true,"message":"Successfully ordered 5 units of sku A123, shipped!"}

C:\Code\training-nest\scripts>order_product.bat

C:\Code\training-nest\scripts>curl -X POST -H "Content-Type: application/json" -d "{\"sku\": \"A123\", \"qty\": 5}" localhost:3000/order-product

{"success":false,"message":"Failed to pick 5 units of sku A123, ensure sufficient inventory"}

C:\Code\training-nest\scripts>get_history.bat

C:\Code\training-nest\scripts>curl localhost:3000/history

2025-10-14T20:32:14.831Z - [INFO] - Created new product SKU A123 w/ name A,2025-10-14T20:32:14.857Z - [INFO] - Created new receiving location R1,2025-10-14T20:32:14.866Z - [INFO] - Created new storage location S1,2025-10-14T20:32:17.489Z - [INFO] - received 10 units of product A123 into receiving area R1,2025-10-14T20:32:19.152Z - [INFO] - put away 8 units of product A123 from receiving area R1 into storage area S1,2025-10-14T20:32:23.632Z - [INFO] - picked 5 units of product A123 from storage area S1

C:\Code\training-nest\scripts>
```