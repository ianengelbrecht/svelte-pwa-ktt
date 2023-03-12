<script>
  import {onMount} from 'svelte'
  import "../app.css";
  import db from '../db.js'

  let formData = {
    passportId: null,
    firstName: null,
    lastName: null,
    age: null, 
    timestampCreated: null
  }

  let recordCount = 0
  let currentRecord = null
  let currentRecordIndex = 0

  onMount(async _ => {
    await getRecordCount()
    await getRecordAtIndex()
  })

  const dataHasChanged = _ => {
    const originalData = currentRecord.toJSON()
    console.log('original:')
    console.log(originalData)
    console.log('current')
    console.log(formData)
    for (const key of Object.keys(formData)){
      if(originalData.hasOwnProperty(key)){
        if (formData[key] != originalData[key]){
          return true
        }
      }
      else {
        return true
      }
    }
    return false
  }

  const saveRecord = async ev => {
    if (currentRecord == null) { //it's a new record
      try {
        formData.timestampCreated = Date.now()
        await db.humans.insert(formData)
        getRecordCount()
        clearRecordData()
      }
      catch(err) {
        console.error(err)
        alert('error saving record - see the console')
      }
    }
    else {
      if (dataHasChanged()){
        console.log('data has changed')
        try {
          console.log('patching record...')
          await currentRecord.patch(formData)
        }
        catch(err) {
          console.error(err)
          alert('error saving record - see the console')
        }
      }
      else {
        console.log('data has not changed')
      }
    }
  }

  const getRecordCount = async _ => {
    try {
      let records = await db.humans.find().exec()
      recordCount = records.length
    }
    catch(err) {
      alert('Error counting records: ' + err.message)
    }
  }

  async function getNewFileHandle() {
    const options = {
      types: [
        {
          description: 'Text Files',
          accept: {
            'text/plain': ['.txt'],
            'application/json': ['.json']
          },
        },
      ],
    };
    const handle = await window.showSaveFilePicker(options);
    return handle;
  }

  async function writeFile(fileHandle, contents) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
  }

  const saveJSON = async _ => {
    const handle = await getNewFileHandle()
    let allData = await db.exportJSON() //badly named function
    await writeFile(handle, JSON.stringify(allData, null, 2))
    alert('backup saved')
  }

  const getRecordAtIndex = async _ => {
    const dbRecords = await db.humans.find({
      skip:currentRecordIndex,
      limit: 1,
      sort:[{timestampCreated: 'asc'}]
    }).exec()

    currentRecord = dbRecords[0]
    formData = currentRecord.toJSON()
  }

  const toPreviousRecord = async ev => {
    if(currentRecordIndex != null) {
      if (currentRecordIndex > 0) {
        currentRecordIndex--
        await getRecordAtIndex()
      }
    }
    else {
      currentRecordIndex = recordCount - 1
      await getRecordAtIndex()
    }
  }

  const createBlankRecord = _ => {
    clearRecordData()
    currentRecordIndex = undefined
    currentRecord = null
  }

  const toNextRecord = async _ => {
    if (currentRecordIndex != null) {
      if (currentRecordIndex < recordCount - 1) {
        currentRecordIndex++
        await getRecordAtIndex()
      }
      else {
        createBlankRecord()
      }
    }
  }

  const toFirstRecord = async _ => {
    currentRecordIndex = 0
    await getRecordAtIndex()
  }

  const toLastRecord = async _ => {
    currentRecordIndex = recordCount - 1
    await getRecordAtIndex()
  }

  const clearRecordData = _ => {
    for (const key of Object.keys(formData)){
      formData[key] = null
    }
    document.getElementById('passport').focus()
  }

  const handleFormWheelEvent = ev => {
    if (ev.deltaY < 0) {
      toPreviousRecord()
    }
    else if (ev.deltaY > 0) {
      toNextRecord()
    }
  }

  const handleOnEnter = ev => {
    if (ev.key == 'Enter'){
      if(ev.target.id != 'backbutton' && ev.target.id != 'forwardbutton') {
        saveRecord()
      }
    }
  }

  const addRecord = _ => {
    createBlankRecord()
  }

  const deleteRecord = async _ => {
    await currentRecord.remove()
    await getRecordCount()
    await getRecordAtIndex()
  }


</script>

<div class="container mx-auto px-4">
  
  <div class="p-4">
    Record count: {recordCount}
    <button class="bg-green-500 hover:bg-green-700 focus:bg-green-700 focus:shadow-md text-white font-bold px-4 ml-2 rounded-xl focus:outline-none " type="button" on:click={saveJSON}>Save data</button>
  </div>
  <form class="relative max-w-xs mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" on:wheel={handleFormWheelEvent} on:keypress={handleOnEnter}>
    <div class="mb-4">
      <!-- add and delete buttons -->
      <div class="absolute top-6 right-8">
        <button class="w-6  text-gray-700 border-2 border-inherit rounded hover:border-green-400" tabindex="-1" on:click|preventDefault={addRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button class="w-6  text-gray-700 border-2 border-inherit rounded hover:border-red-400" on:click|preventDefault={deleteRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>    
        </button>
      </div>
      <!-- form fields -->
      <label class="block text-gray-700 text-sm font-bold mb-2" for="passport">
        Passport ID
        <input class="shadow appearance-none border rounded w-full py-2 px-3 mt-2 font-normal text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required id="passport" type="text" bind:value={formData.passportId}>
      </label>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="firstName">
        First Name
        <input class="shadow appearance-none border rounded w-full py-2 px-3 mt-2 font-normal text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="firstNamne" type="text" bind:value={formData.firstName}>
      </label>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="lastname">
        Last Name
        <input class="shadow appearance-none border rounded w-full py-2 px-3 mt-2 font-normal text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="lastname" type="text" bind:value={formData.lastName}>
      </label>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="age">
        Age
        <input class="shadow appearance-none border rounded w-full py-2 px-3 mt-2 mb-6 font-normal text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="age" type="number" bind:value={formData.age}>
      </label>
    </div>
    <!-- bottom buttons -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <button class="hidden" on:click|preventDefault></button> <!-- We need this hidden button so that enter keypress does not trigger first button below!!! -->
        <button id="allbackbutton" class="w-8 bg-blue-500 hover:bg-blue-700 focus:bg-blue-700 focus:shadow-md text-white font-bold py-2 px-2 ml-1 rounded focus:outline-none" on:click|preventDefault={toFirstRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>
        <button id="backbutton" class="w-8 bg-blue-500 hover:bg-blue-700 focus:bg-blue-700 focus:shadow-md text-white font-bold py-2 px-2 ml-1 rounded focus:outline-none" on:click|preventDefault={toPreviousRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>          
        </button>
        <div class="inline-block w-10 text-center">{currentRecordIndex == null? '-' : currentRecordIndex + 1}</div>
        <button id="forwardbutton" class="w-8 bg-blue-500 hover:bg-blue-700 focus:bg-blue-700 focus:shadow-md text-white font-bold py-2 px-2 ml-1 rounded focus:outline-none" on:click|preventDefault={toNextRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <button id="allforwardbutton" class="w-8 bg-blue-500 hover:bg-blue-700 focus:bg-blue-700 focus:shadow-md text-white font-bold py-2 px-2 ml-1 rounded focus:outline-none" on:click|preventDefault={toLastRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <div>
        <button class="bg-blue-500 hover:bg-blue-700 focus:bg-blue-700 focus:shadow-md text-white font-bold py-2 px-4 rounded focus:outline-none" type="button" on:click={saveRecord}>
          Save
        </button>
      </div>
    </div>
  </form>
  <p class="text-center text-gray-500 text-xs">
    &copy;2020 Acme Corp. All rights reserved.
  </p>
</div>
