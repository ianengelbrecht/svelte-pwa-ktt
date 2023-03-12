import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { addRxPlugin } from 'rxdb';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBMigrationPlugin);

const myDatabase = await createRxDatabase({
  name: 'heroesdb',
  storage: getRxStorageDexie(),
  ignoreDuplicate: true
});

const humanSchema = {
  title: 'human schema',
  version: 1,
  primaryKey: 'passportId',
  type: 'object',
  properties: {
      passportId: {
          type: 'string',
          maxLength: 100 // <- the primary key must have set maxLength
      },
      firstName: {
          type: 'string'
      },
      lastName: {
          type: 'string'
      },
      age: {
          description: 'age in years',
          type: 'integer',

          // number fields that are used in an index, must have set minimum, maximum and multipleOf
          minimum: 0,
          maximum: 150,
          multipleOf: 1
      },
      timestampCreated: {
        description: 'The time the record was created, used for sorting later',
        type: 'number',
        minimum: 1678651018000, //now
        maximum: 4108564614000, //12 March 2100
        multipleOf: 1
      }
  },
  required: ['firstName', 'lastName', 'passportId'],
  indexes: ['age', 'timestampCreated']
}

await myDatabase.addCollections({
  humans: {
    schema: humanSchema,
    migrationStrategies: {
      1: function(oldDoc){
        oldDoc.timestampCreated = Date.now()
        return oldDoc
      }
    }
  },
});

export default myDatabase
