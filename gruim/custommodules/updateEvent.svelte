<script lang="ts">
  import UpdateEvent from "../sections/Update-One-View.svelte";
  import SingleView from "../sections/Single-View.svelte";
  import { onMount } from "svelte";

  export let closePopup = () => {};
  export let schema: any = {};
  export let id: any = "";

  export let formData: any = {};

  $: console.log({ formData });

  // check if the schema is view only or editable
  // this is based on the checkIfTrainingEditable function in the src/components/shared/calendar.svelte file
  // which checks if the training rapport is editable based on the history and the date of the training for the trainer
  export let isViewOnly = false;

  let loading = false;

  onMount(async () => {
    loading = true;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    let kundeIds = document.querySelector('div[placeholder="kundes"]');
    kundeIds?.click();

    if (kundeIds) {
      // Create a MutationObserver instance
      const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              console.log("Child added:", node);
            });
            mutation.removedNodes.forEach((node) => {
              console.log("Child removed:", node);
            });
          }
          if (mutation.type === "characterData") {
            // check formdata.kundeIds.length and if more than 1, set trainingType to gruppe and if it is 1 and the previous value was gruppe, set it to private
            if (formData.kundeIds.length > 1) {
              formData.trainingType = "gruppe";
            } else if (
              formData.kundeIds.length === 1 &&
              formData.trainingType === "gruppe"
            ) {
              formData.trainingType = "private";
            }
          }
        });
      });

      // Set the observer options
      const observerConfig = {
        childList: true, // Listen for child nodes added or removed
        subtree: true, // Observe all descendants of the target
        characterData: true, // Listen for text content changes in text nodes
      };

      // Start observing
      observer.observe(kundeIds, observerConfig);
    }

    loading = false;
  });

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
          name: "kundeIds",
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

      "dropdown-fields": [
        {
          name: "trainingType",
          default: {
            label: "private",
            value: "private",
          },
          options: [
            {
              label: "private",
              value: "private",
            },
            {
              label: "gruppe (spontan)",
              value: "gruppe",
            },
            {
              label: "Mannschaftstraining (ohne Platzmiete)",
              value: "mannschaft",
            },
            {
              label: "Mannschaftstraining (inkl. Platzmiete)",
              value: "mannschaft_platz",
            },
            {
              label: "Aufschlagtraining",
              value: "aufschlag",
            },
          ],
        },
      ],
    },
  };
</script>

{#if loading}
  <div
    class="fixed z-10 inset-0 overflow-y-auto bg-black bg-opacity-50"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex justify-center items-center h-[70vh]">
      <div
        class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"
      ></div>
    </div>
  </div>
{/if}

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
        bind:formData
      />
    {:else}
      <SingleView operationId="RapportController.findById" {id} {schema} />
    {/if}
  </div>
</div>
