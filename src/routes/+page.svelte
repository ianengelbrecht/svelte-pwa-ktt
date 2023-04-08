<script>
  import {onMount} from 'svelte'
  import { customAlphabet  } from 'nanoid'
  import "../app.css";
  import { getRecordCount, getRecordAtIndex, addNewRecord, updateRecord,  deleteRecordAtIndex, getBackup, query} from '../dbhumans.js'
  
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5)

  let locsFileInput
  let searchVal

  let formData = {
    passportId: null,
    firstName: null,
    lastName: null,
    age: null, 
    timestampCreated: null
  }

  let currentRecord = null //for storing the current record from the db
  let recordCount = null
  let currentRecordIndex = null

  onMount(async _ => {
    recordCount = await getRecordCount()
    if (recordCount > 0) {
      currentRecordIndex = 0
      currentRecord = await getRecordAtIndex(currentRecordIndex)
      mapCurrentRecordToFormData()
    }
  })

  function mapCurrentRecordToFormData(){
    if(currentRecord) {
      for (const key of Object.keys(formData)) {
        if(currentRecord.hasOwnProperty(key)) {
          formData[key] = currentRecord[key]
        }
        else {
          formData[key] = null
        }
      }
    }
  }

  //this is backup stuff...
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

  const saveBackupJSON = async _ => {
    const handle = await getNewFileHandle()
    let allData = await getBackup()
    await writeFile(handle, JSON.stringify(allData, null, 2))
    alert('backup saved')
  }

  const toPreviousRecord = async ev => {
    if(currentRecordIndex != null) {
      if (currentRecordIndex > 0) {
        currentRecordIndex--
        currentRecord = await getRecordAtIndex(currentRecordIndex)
        mapCurrentRecordToFormData()
      }
      //also do nothing
    }
    else {
      currentRecordIndex = recordCount -1
      currentRecord = await getRecordAtIndex(currentRecordIndex)
      mapCurrentRecordToFormData()
    }
  }

  const toNextRecord = async _ => {
    if (currentRecordIndex != null) {
      if (currentRecordIndex < recordCount - 1) {
        currentRecordIndex++
        currentRecord = await getRecordAtIndex(currentRecordIndex)
        mapCurrentRecordToFormData()
      }
      else {
        createBlankRecord() //we want a new empty record
        currentRecordIndex = null
      }
    }
    //else do nothing
  }

  const createBlankRecord = _ => {
    currentRecord = null
    for (const key of Object.keys(formData)){
      formData[key] = null
    }
    document.getElementById('passport').focus()
  }

  const toFirstRecord = async _ => {
    if (recordCount > 0) {
      currentRecordIndex = 0
      currentRecord = await getRecordAtIndex(currentRecordIndex)
      mapCurrentRecordToFormData()
    }
  }

  const toLastRecord = async _ => {
    if(recordCount > 0) {
      currentRecordIndex = recordCount - 1
      currentRecord = await getRecordAtIndex(currentRecordIndex)
      mapCurrentRecordToFormData()
    }
  }

  const handleFormWheelEvent = ev => {
    if (ev.deltaY < 0) {
      toPreviousRecord()
    }
    else if (ev.deltaY > 0) {
      toNextRecord()
    }
  }

  const dataHasChanged = _ => {
    if (currentRecord != null){
      for (const key of Object.keys(formData)) {
        if(formData[key] != null && !currentRecord.hasOwnProperty(key)){
          console.log('record does not have key', key)
          return true
        }
        if(currentRecord[key] != formData[key]){
          console.log('values do not match for', key)
          return true
        }
      }
    }
    return false
  }

  const saveRecord = async _ => {
    if(dataHasChanged()) {
      if(currentRecordIndex != null) {
        console.log('data has changed...')
        try{
          currentRecord = await updateRecord(formData)
          //nothing else changes
        }
        catch(err){
          console.error(err)
          alert('error saving record, see console...')
          return
        }
      }
      else {
        try{
          currentRecord = await addNewRecord(formData)
          recordCount = await getRecordCount()
          createBlankRecord()
          //currentRecordIndex stays null
        }
        catch(err){
          console.error(err)
          alert('error saving record, see console...')
          return
        }
      }
    }
    else {
      console.log('data has NOT changed...')
    }
  }

  const handleOnEnter = async ev => {
    if (ev.key == 'Enter'){
      if(ev.target.tagName.toLowerCase() == 'input') {
        ev.preventDefault()
        try{
          await saveRecord(formData)
        }
        catch(err){
          console.error(err)
          alert('error saving record, see console...')
        }
      }
    }
  }

  //handler for add record button
  const addRecord = _ => {
    if(recordCount > 0) {
      currentRecordIndex = null
      createBlankRecord()
    }
    //else the form will be blank already
  }

  const deleteRecord = async _ => {
    if(currentRecordIndex != null){
      try {
        await deleteRecordAtIndex(currentRecordIndex)
        recordCount = await getRecordCount()
        if(recordCount > 0) {
          if(currentRecordIndex == recordCount) {
            currentRecordIndex--
          }
          currentRecord = await getRecordAtIndex(currentRecordIndex)
          mapCurrentRecordToFormData()
        }
        else {
          currentRecordIndex = null
          currentRecord = null
          createBlankRecord()
        }
      }
      catch(err) {
        console.error(err)
        alert('error deleting record, see console')
      }
    }
  }

  const handleLoadLocalities = async _ => {
    if (locsFileInput.files.length) {
      const reader = new FileReader()
      reader.addEventListener("load", async _ => {
        // this will then display a text file
        let fileJSON = reader.result;
        let localities = JSON.parse(fileJSON)
        let error = false
        if(localities.length){
          for (const locality of localities) {
            locality.originalLocalityID = locality.localityID 
            locality.originalHabitatAreaID = locality.habitatAreaID 
            locality.localityID = nanoid()
            delete locality.habitatAreaID
            try {
              await db.localities.insert(locality)
            }
            catch(err) {
              console.log('error loading localities:')
              console.error(err)
              return
            }

          }
        }
      }, false);

      reader.readAsText(locsFileInput.files[0]); //there can only be one!
    }
  }

  const showSearchCount = async ev => {
    if (ev.key == 'Enter' && searchVal != null && searchVal != '') {
      try {
        let searchResults = await query(searchVal)
        alert(`People named ${searchVal}: ${searchResults.length}\r\n${searchResults.map(x => x.firstName + ' '+ x.lastName).join('\r\n')}`)
      }
      catch(err) {
        console.error(err)
        alert('error running query, see console')
      }     
    }
    
  }


</script>

<div class="container mx-auto px-4">
  <div class="p-4">
    Record count: {recordCount}
    <button class="btn btn-utility" type="button" on:click={saveBackupJSON}>
      Download
    </button>
  </div>
  <div class="p-4">
    <input
      type="file"
      accept="application/json"
      style="display:none" 
      bind:this={locsFileInput}
      on:change={handleLoadLocalities}/>
    <button class="btn btn-utility" type="button" on:click={_ => locsFileInput.click()}>Load localities</button>
  </div>
  <input class="input-std my-5" type="text" bind:value={searchVal} placeholder="Search..." on:keypress={showSearchCount}/>
  <form id="personform" class="form-std max-w-xs" on:wheel={handleFormWheelEvent} on:keypress={handleOnEnter}>
    <div class="mb-4">
      <!-- add and delete buttons -->
      <div class="absolute top-6 right-8">
        <button class="hidden" on:click|preventDefault></button> <!-- We need this hidden button so that enter keypress does not trigger first button below!!! -->
        <button class="btn-icon hover:border-green-200 hover:text-green-400" title="New record" on:click|preventDefault={addRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button class="btn-icon hover:border-red-200 hover:text-red-400" title="Delete record" tabindex="-1" on:click|preventDefault={deleteRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>    
        </button>
      </div>
      <!-- form fields -->
      <label class="form-label" for="passport">
        Passport ID
        <input class="input-std" required id="passport" type="text" bind:value={formData.passportId}>
      </label>
      <label class="form-label" for="firstName">
        First Name
        <input class="input-std" id="firstNamne" type="text" bind:value={formData.firstName}>
      </label>
      <label class="form-label" for="lastname">
        Last Name
        <input class="input-std" id="lastname" type="text" bind:value={formData.lastName}>
      </label>
      <label class="form-label" for="age">
        Age
        <input class="input-std" id="age" type="number" bind:value={formData.age}>
      </label>
    </div>
    <!-- bottom buttons -->
    <div id="buttons" class="flex items-center justify-between">
      <div class="flex items-center">
        <button id="allbackbutton" class="w-8 bg-blue-500 hover:bg-blue-700 focus:bg-blue-700 focus:shadow-md text-white font-bold py-2 px-2 ml-1 rounded focus:outline-none" on:click|preventDefault={toFirstRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>
        <button id="backbutton" class="btn-datanav btn-primary" on:click|preventDefault={toPreviousRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>          
        </button>
        <div class="inline-block w-10 text-center">{currentRecordIndex == null? '-' : currentRecordIndex + 1}</div>
        <button id="forwardbutton" class="btn-datanav btn-primary" on:click|preventDefault={toNextRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <button id="allforwardbutton" class="btn-datanav btn-primary" on:click|preventDefault={toLastRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <div>
        <button class="btn btn-primary" type="button" on:click={saveRecord}>
          Save
        </button>
      </div>
    </div>
  </form>
  <!-- form footer -->
  <p class="text-center text-gray-500 text-xs">
    &copy;2020 Acme Corp. All rights reserved.
  </p>
</div>
