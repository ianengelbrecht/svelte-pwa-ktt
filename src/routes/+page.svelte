<script>
  import "../app.css";
  import db from '../db.js'

  const record = {
    passportId: null,
    firstName: null,
    lastName: null,
    age: null
  }

  const saveRecord = async ev => {
    try {
      await db.humans.insert(record)
    }
    catch(err) {
      alert('Error saving record: ' + err.message)
    }
    
  }
</script>


<div class="w-full max-w-xs content-center">
  <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="firstName">
        First Name
      </label>
      <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="firstNamne" type="text" bind:value={record.firstName}>
    </div>
    <div class="mb-6">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="lastName">
        Last Name
      </label>
      <input class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="lastName" type="text" bind:value={record.lastName}>
    </div>
    <div class="flex items-center justify-between">
      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" on:click={saveRecord}>
        Submit
      </button>
    </div>
  </form>
  <p class="text-center text-gray-500 text-xs">
    &copy;2020 Acme Corp. All rights reserved.
  </p>
</div>
