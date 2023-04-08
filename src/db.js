import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { addRxPlugin } from 'rxdb';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';

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

const localitySchema = {
  title: 'locality schema',
  version: 3,
  primaryKey: 'localityID',
  type: 'object',
  properties: {
    localityID: {
      type: 'string'
    },
    originalLocalityID: {
      description: 'The ID from the original database (just integers)',
      type: 'number'
    },
    originalHabitatAreaID: {
      description: 'The ID of the habitat area from the original database (just integers)',
      type: 'number'
    },
    country: {
      type: 'string'
    },
    stateProvince: {
      type: 'string'
    },
    locality: {
      type: 'string'
    },
    verbatimLatitude: {
      type: 'string'
    },
    verbatimLongitude: {
      type: 'string'
    },
    decimalLatitude: {
      type: 'number'
    },
    decimalLongitude: {
      type: 'number'
    },
    decimalCoordinates: {
      type: 'string'
    },
    coordsSource: {
      description: 'How the original coordinates were obtained, different to dwc:georeferenceSources',
      type: 'string'
    },
    geodeticDatum: {
      type: 'string'
    },
    uncertainty: {
      type: 'number'
    },
    uncertaintyUnit: {
      type: 'string'
    },
    verbatimElevation: {
      type: 'string'
    },
    habitat: {
      type: 'string'
    },
    createdBy: {
      type: 'string'
    },
    timestampCreated: {
      description: 'The time the record was created, used for sorting later',
      type: 'number',
      minimum: 1678651018000, //now
      maximum: 4108564614000, //12 March 2100
      multipleOf: 1,
    },
    modifiedBy: {
      type: 'string'
    },
    timestampModified: {
      description: 'The time the record was modified, used for sorting later',
      type: 'number',
      minimum: 1678651018000, //now
      maximum: 4108564614000, //12 March 2100
      multipleOf: 1
    }
  }
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
  localities: {
    schema: localitySchema,
    migrationStrategies: {
      1: function(oldDoc){
        return oldDoc
      },
      2: function(oldDoc){
        return oldDoc
      },
      3: function(oldDoc){
        oldDoc.timestampCreated = Date.now()
        return oldDoc
      }
    }
  }
});

export default myDatabase
