<script lang="ts">
  import UpdateEvent from "../sections/Update-One-View.svelte";
  import SingleView from "../sections/Single-View.svelte";

  export let closePopup = () => {};
  export let schema: any = {};
  export let id: any = "";

  // check if the schema is view only or editable
  // this is based on the checkIfTrainingEditable function in the src/components/shared/calendar.svelte file
  // which checks if the training rapport is editable based on the history and the date of the training for the trainer
  export let isViewOnly = false;

  // check if user is a trainer
  const isUserTrainer = () => {
    // TODO: send a request to the backend to verify if the token is valid
    return (
      localStorage.getItem("token") || window.location.search.includes("token")
    );
  };

  schema = {
    ...schema,
    "field-properties": {
      ...schema["field-properties"],
      "hidden-fields": ["invoicedIn", "invoiceJson", "archived"],
      "readonly-fields": isUserTrainer() ? ["trainer", "id"] : ["id"],
      "field-order": [
        "datum",
        "startzeit",
        "trainingsdauer",
        "trainer",
        "platz",
        "trainingType",
        "kunde",
        "gruppe",
        "notizen",
        "nachholtermin",
        "probetraining",
        "archived",
        "invoicedIn",
        "invoiceJson",
      ],
      "boolean-fields": ["probetraining", "nachholtermin", "archived"],
      "relational-fields": [
        {
          name: "kundeId",
          type: "FAVORITE",
          editable: true,
          columns: [
            "bexioId",
            "name",
            "vorname",
            "plz",
            "ort",
            "mail",
            "strasse",
            "land",
            "geburtstag",
            "mail2",
            "phone",
            "phone2",
            "phoneMobile",
            "notizen",
            "id",
          ],
        },
        {
          name: "trainer",
          editable: !isUserTrainer(),
          // columns: ["id", "name", "vorname", "email", "notizen"],
          columns: ["id", "name", "vorname", "email"],
        },
      ],
      "custom-validations": isUserTrainer()
        ? [
            {
              field: "trainingsdauer",
              validation: {
                message: "Trainingsdauer can't be empty",
                regex: ".*\\S.*",
              },
            },
            {
              field: "trainer",
              validation: {
                message: "Trainer can't be empty",
                regex: ".*\\S.*",
              },
            },
          ]
        : [
            {
              field: "trainer",
              validation: {
                message: "Trainer can't be empty",
                regex: ".*\\S.*",
              },
            },
          ],
    },
  };
</script>

<div class="bg-white p-4 w-[95%] rounded-sm">
  <div class="text-right pb-4">
    <button
      class="text-center py-3 px-6 shadow-sm border border-gray-200 hover:shadow-md transition-all font-semibold rounded-full h-8 w-8 !p-0 text-lg"
      on:click={closePopup}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5 inline-block"
        ><line x1="18" y1="6" x2="6" y2="18" /><line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
        /></svg
      >
    </button>
  </div>
  <div class="overflow-auto max-h-[70%]">
    {#if !isViewOnly}
      <UpdateEvent
        on:update={closePopup}
        on:deleted={closePopup}
        operationId="RapportController.updateById"
        {id}
        {schema}
      />
    {:else}
      <SingleView operationId="RapportController.findById" {id} {schema} />
    {/if}
  </div>
</div>
