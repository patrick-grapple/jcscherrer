<script lang="ts">
  import dayjs from "dayjs";
  import CreateEvent from "../../modules/Rapport/create.svelte";
  import { onMount } from "svelte";
  let savedTrainer: {
    value: number;
    label: string;
  } = JSON.parse(localStorage.getItem("trainer") || "{}");
  export let closePopup = () => {};
  export let schema: any = {};

  export let selectedDate: string = dayjs().format("YYYY-MM-DD");
  export let selectedStartTime: string = dayjs().format("HH:mm");
  export let selectedDuration: string = "01:00:00";

  let loading = false;

  onMount(async () => {
    loading = true;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    let kundeInput = document
      .querySelector('input[placeholder="kunde"]')
      ?.closest(".svelte-select");

    let evt = new PointerEvent("pointerup");
    kundeInput?.dispatchEvent(evt);
    loading = false;
  });

  const isUserTrainer = () => {
    // TODO: send a request to the backend to verify if the token is valid
    return (
      localStorage.getItem("token") || window.location.search.includes("token")
    );
  };

  $: schema = {
    ...schema,
    "field-properties": {
      ...schema["field-properties"],
      "hidden-fields": ["invoicedIn", "invoiceJson", "archived"],
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

      "default-values": [
        {
          name: "invoicedIn",
          value: null,
        },
        {
          name: "trainerId",
          value: savedTrainer.value,
        },
        {
          name: "datum",
          value: dayjs(selectedDate).format("YYYY-MM-DD").substr(0, 10),
        },
        {
          name: "startzeit",
          value: dayjs(selectedStartTime).isValid()
            ? dayjs(selectedStartTime).format("HH:mm")
            : dayjs().format("HH") + ":00",
        },
        {
          name: "trainingsdauer",
          value: selectedDuration,
        },
        {
          name: "trainingType",
          value: "private",
        },
        {
          name: "platzId",
          value: 1, //preselect platz field with one of the values
        },
      ],
      "relational-fields": [
        {
          name: "kunde",
          type: "FAVORITE",
          editable: true,
          useFuzzySearch: true,
          columns: [
            "id",
            "bexioId",
            "name",
            "vorname",
            "ort",
            "geburtstag",
            "phone",
            "phoneMobile",
            "notizen",
          ],
        },
        {
          name: "trainer",
          editable: !isUserTrainer(),
          columns: ["id", "name", "vorname", "email"],
          dropDownFilter: {
            aktiv: true,
          },
        },
      ],
      //readonly and custom-validation apply if the user is a trainer
      "readonly-fields": isUserTrainer() ? ["trainer"] : [],
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
    <CreateEvent {schema} onSuccess={closePopup} />
  </div>
</div>
