import db from './db.js'
import { addRxPlugin } from 'rxdb';
import { replicateFirestore  } from 'rxdb/plugins/replication-firestore';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
addRxPlugin(RxDBJsonDumpPlugin);

import { collection } from 'firebase/firestore';
import {db as firestore, projectID} from './firestore.js'


export const getRecordCount = async _ => {
  let recordCount = null
  try {
    recordCount = await db.humans.count().exec()
  }
  catch(err) {
    alert('Error counting records: ' + err.message)
  }

  return recordCount
}

export const getRecordAtIndex = async index => {
  try {
    let rawRecord = await getRawRecordAtIndex(index)
    return rawRecord.toJSON()
  }
  catch(err) {
    throw err
  }
}

export const addNewRecord = async recordData => {
  try {
    recordData.timestampCreated = Date.now()
    let dbRecord = await db.humans.insert(recordData)
    return dbRecord
  }
  catch(err) {
    throw(err)
  }
}

export const updateRecord = async (recordData, recordIndex) => {
  try {
    let rawRecord = await getRawRecordAtIndex(recordIndex)
    let updatedRecord = await rawRecord.patch(recordData) //note we might have to refetch the record from the database after the patch...
    return updatedRecord
  }
  catch(err) {
    throw(err)
  }
}

export const deleteRecordAtIndex = async index => {
  try {
    const record = await getRawRecordAtIndex(index)
    return await record.remove()
  }
  catch(err) {
    throw err
  }
}

export const getBackup = async _ => {
  return db.humans.exportJSON()
}

export const query = async qryVal => {
  try{
    let results = await db.humans.find({
      selector: {
        firstName: {
          $regex: `^${qryVal}`,
          $options: 'i'
        }
      }
    }).exec()
  
    return results
  }
  catch(err) {
    throw(err)
  }
}

async function getRawRecordAtIndex(index) {
  try {
    const dbRecords = await db.humans.find({
      skip: index,
      limit: 1,
      sort:[{timestampCreated: 'asc'}]
    }).exec()

    if(dbRecords.length > 0) {
      return dbRecords[0]
    }
    else {
      return null
    }
  }
  catch(err) {
    throw err
  }
}

export const syncCollection = _ => {
  const coll = collection(firestore, 'demopeople')
  try {

    const replicationState = replicateFirestore(
      {
        collection: db.humans,
        firestore: {
            projectId: projectID,
            database: firestore,
            collection: coll
        },
        pull: { },
        push: { },
        /**
         * Either do a live or a one-time replication
         * [default=true]
         */
        live: true,
        /**
         * (optional) likely you should just use the default.
         *
         * In firestore it is not possible to read out
         * the internally used write timestamp of a document.
         * Even if we could read it out, it is not indexed which
         * is required for fetch 'changes-since-x'.
         * So instead we have to rely on a custom user defined field
         * that contains the server time which is set by firestore via serverTimestamp()
         * IMPORTANT: The serverTimestampField MUST NOT be part of the collections RxJsonSchema!
         * [default='serverTimestamp']
         */
        serverTimestampField: 'serverTimestamp'
      }
    );

    return replicationState

  }
  catch(err) {
    console.log('there was an error with sync')
    console.error(err)
  }

}