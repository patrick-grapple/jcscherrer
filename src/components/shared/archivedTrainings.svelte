<script lang="ts">
  import FullCalendar, {
    CalendarOptions,
    DayCellContentArg,
    ViewApi,
  } from "svelte-fullcalendar";

  import daygridPlugin from "@fullcalendar/daygrid";
  import interactionPlugin from "@fullcalendar/interaction"; // for selectable
  import Global from "../components/global.svelte";
  Global;
  import { onMount, tick } from "svelte";
  import dayjs from "dayjs";
  import SingleDay from "./singleDay.svelte";
  import TrainerDropDown from "./trainerDropDown.svelte";
  import CreateEvent from "./createEvent.svelte";
  import UpdateEvent from "./updateEvent.svelte";
  import { addMessages, init } from "svelte-i18n";
  import en from "../../i18n/translation.json";

  import ToastsComponent from "../components/toasts-component.svelte";
  import { clearAllToasts } from "../stores/toasts";

  import SimpleDismissModal from "../components/_shared/modal/simple-dismiss-modal.svelte";

  clearAllToasts();

  addMessages("en", en);

  init({
    fallbackLocale: "en",
    initialLocale: "en",
  });

  let innerWidth = window.innerWidth;
  let events: { start: string }[] = [];
  let selectedRapports: any = [];
  let selectedDate: string = dayjs().format();
  let rapportToUpdateId: string = "";

  let options: CalendarOptions = {
    initialView: "dayGridMonth",
    plugins: [daygridPlugin, interactionPlugin],
    firstDay: 1,
    height: "100%",
  };

  //   export let schema: any = {};

  // change showCal value based on window size and rerender calendar
  $: if (innerWidth > 768) {
    showCal = true;
  }
  $: if (innerWidth < 768) {
    showCal = false;
  }

  // on innerWidth change, change options and rerender calendar
  $: {
    innerWidth;
    options = {
      ...options,
    };
  }
  $: {
    showCal;
    options = {
      ...options,
    };
  }

  let showCreateForm = false;
  let showEditForm = false;
  let showCal = false;
  let selectedDuration: string = "";
  let showViewFrom = false;

  let selectedTrainer: any = "";

  let URL = `${process.env.SVELTE_APP_REMOTE_URL}/api/archived-rapports?filter={"include":["trainer","platz","kundes","gruppe"]}`;

  let updateRapports = async () => {
    // get the list of rapports for the selected trainer
    localStorage.setItem("trainer", JSON.stringify(selectedTrainer));

    if (selectedTrainer?.value) {
      URL = `${process.env.SVELTE_APP_REMOTE_URL}/api/archived-rapports?filter={"include":["trainer","platz","kundes","gruppe"],"where":{"trainerId":${selectedTrainer.value}}}`;
    } else {
      URL = `${process.env.SVELTE_APP_REMOTE_URL}/api/archived-rapports?filter={"include":["trainer","platz","kundes","gruppe"]}`;
    }

    let rapports = await fetch(URL);

    const data = await rapports.json();

    events = data.map((r: any) => ({
      start: dayjs(r.datum).format("YYYY-MM-DD"),
      display: "background",
      backgroundColor: "#fa7252",
    }));

    // update calendar options to render the updated events
    options = {
      ...options,
      events: events,
    };

    if (selectedDate) {
      selectedRapports = data.filter((r: any) => {
        return (
          dayjs(r.datum).format("YYYY-MM-DD") ==
          dayjs(selectedDate).format("YYYY-MM-DD")
        );
      });
      selectedRapports = selectedRapports;
    }
  };

  let fetchRapport = async () => {
    // request for the list of raports for that month populate it in the calendar
    let savedTrainer: {
      value: number;
      label: string;
    } = JSON.parse(localStorage.getItem("trainer") || "{}");

    if (savedTrainer?.value) {
      URL = `${process.env.SVELTE_APP_REMOTE_URL}/api/archived-rapports?filter={"include":["trainer","platz","kundes","gruppe"],"where":{"trainerId":${savedTrainer.value}}}`;
    } else {
      URL = `${process.env.SVELTE_APP_REMOTE_URL}/api/archived-rapports?filter={"include":["trainer","platz","kundes","gruppe"]}`;
    }

    let rapports = await fetch(URL);
    await tick();

    const data = await rapports.json();

    events = data.map((r: any) => ({
      start: dayjs(r.datum).format("YYYY-MM-DD"),
      display: "background",
      backgroundColor: "#fa7252", //accent color for the calendar
    }));

    selectedRapports = data.filter((r: any) => {
      return (
        dayjs(r.datum).format("YYYY-MM-DD") ==
        dayjs(selectedDate).format("YYYY-MM-DD")
      );
    });

    options = {
      ...options,
      events: events,
      //   eventClick: async function (info: any) {
      //     selectedDate = dayjs(info.event.start).format("YYYY-MM-DD");
      //     await updateRapports();
      //     // hide the calendar
      //     showCal = false;
      //   },
      dateClick: function (info: any) {
        selectedDate = dayjs(info.dateStr).format("YYYY-MM-DD");
        showCal = false;
      },
      dayCellClassNames: (arg: DayCellContentArg) => {
        if (
          dayjs(selectedDate).format("YYYY-MM-DD") ===
          dayjs(arg.date).format("YYYY-MM-DD")
        ) {
          return ["selected-day-cell"];
        }
        return "";
      },
      firstDay: 1,

      windowResize: (info: { view: ViewApi }) => {
        info.view.calendar.updateSize();
      },
      handleWindowResize: true,
    };
  };
  $: {
    selectedDate;
    fetchRapport();
  }
  onMount(() => {
    fetchRapport();
    fetchTrainerFromToken();
  });

  // re-execute the fetchRapport function every time showCreateForm and showEditForm is false
  $: {
    if (
      showCreateForm === false &&
      showEditForm === false &&
      showCreateForm === false
    ) {
      fetchRapport();
    }
  }

  let closeConfirmation = false;

  let unsavedChanges = false;

  let escFunction = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (unsavedChanges) {
        closeConfirmation = true;
      } else {
        showCreateForm = false;
        showEditForm = false;
      }
    }
  };

  // listen for any input changes and set the unsavedChanges to true if there are any changes
  window.addEventListener("input", () => {
    unsavedChanges = true;
  });

  // listen for any select options change and set the unsavedChanges to true if there are any changes
  window.addEventListener("change", () => {
    unsavedChanges = true;
  });

  $: {
    const selects = document.getElementsByTagName("select");

    for (let select of selects) {
      select.addEventListener("change", () => {
        unsavedChanges = true;
      });
    }
  }

  // listen for any submit changes and set the unsavedChanges to false
  window.addEventListener("submit", () => {
    unsavedChanges = false;
  });

  // listen for esc key press and close the confirmation modal
  window.addEventListener("keydown", escFunction, false);

  /**
   * selected trainer contains value and label of the selected trainer
   * **/

  // check if the current url is in the /admin path and if it is then show the admin menu
  // TODO: add a proper check for the admin user
  let isAdmin = false;
  $: {
    if (window.location.pathname.includes("/admin")) {
      isAdmin = true;
    }
  }

  //  get the current url search query and check for trainer and trainerName query strings

  let trainerId: string | undefined = undefined;
  let trainerName: string | undefined = undefined;
  // get token from local storage
  // let token = localStorage.getItem("token");
  // then fetch trainer data where token is equal to the token in the local storage
  const fetchTrainerFromToken = async () => {
    let token = localStorage.getItem("token");
    let trainer = await fetch(
      `${process.env.SVELTE_APP_REMOTE_URL}/api/trainers?filter={"where":{"token":"${token}"}}`
    );
    await tick();

    const data = await trainer.json();

    if (data.length > 0) {
      trainerId = data[0].id;
      trainerName = data[0].name;
    }
  };

  $: {
    if (trainerId && trainerName) {
      selectedTrainer = {
        value: trainerId,
        label: trainerName,
      };
      updateRapports();
    }
  }
  async function checkIfTrainingEditable(
    trainingDate: Date,
    isAdmin: boolean,
    isArchived?: boolean,
    invoicedIn?: boolean
  ): Promise<boolean> {
    const currentDate = new Date();
    const deadline = new Date(trainingDate);
    deadline.setDate(trainingDate.getDate() + 1);
    deadline.setHours(14, 0, 0, 0);

    if (isAdmin) {
      if (isArchived || invoicedIn) {
        /**
         * fetch the data from /api/invoice-generation-configs/3
         * check if data.configValue is true or false and return the value
         * this is to check if history is editable for the admin
         * new history should not be editable
         **/
        const response = await fetch(
          `${process.env.SVELTE_APP_REMOTE_URL}/api/invoice-generation-configs/3`
        );
        const data = await response.json();

        return data.configValue === "true" ? false : true;
      } else {
        return true;
      }
    } else {
      return currentDate < deadline;
    }
  }
</script>

<svelte:window bind:innerWidth />

<!-- {#if closeConfirmation && (showCreateForm || showEditForm || showViewFrom)}
  <SimpleDismissModal
    on:close={() => (closeConfirmation = false)}
    on:secondary={() => (closeConfirmation = false)}
    on:active={() => {
      closeConfirmation = false;
      showCreateForm = false;
      showEditForm = false;
      showViewFrom = false;
      unsavedChanges = false;
    }}
  />
{/if} -->
<!-- 
{#if showEditForm || showViewFrom}
  <div
    class="fixed w-full h-screen z-10 flex justify-center items-center inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
  >
    <UpdateEvent
      {schema}
      id={rapportToUpdateId}
      on:deleted={() => {
        showEditForm = false;
      }}
      closePopup={() => {
        if (unsavedChanges) {
          closeConfirmation = true;
        } else {
          showEditForm = false;
          showViewFrom = false;
        }
      }}
      isViewOnly={showViewFrom}
    />
  </div>
{/if} -->

<div class="grid grid-cols-2 p-4 bg-primary-50">
  <div>
    <!-- on mobile view if user is not admin and trainer and trainerName are set hide the vide -->
    {#if isAdmin}
      <TrainerDropDown
        bind:selectedValue={selectedTrainer}
        on:updateTrainer={updateRapports}
      />
    {/if}
  </div>
</div>

<div class="max-w-7xl mx-auto relative">
  <div class="grid md:grid-cols-2 relative">
    {#if !showCal}
      <div
        class="md:hidden px-4 mx-auto mt-4 w-full flex-col flex flex-wrap space-y-4"
      >
        <button
          class="fc-today-button text-white px-4 self-center py-2 rounded"
          on:click={() => {
            // set selectedDate to today
            selectedDate = dayjs().format("YYYY-MM-DD");
          }}>Today</button
        >
        <div
          class="flex-1 flex flex-wrap justify-center items-center space-x-2"
        >
          <button
            on:click={() => {
              selectedDate = dayjs(selectedDate)
                .subtract(2, "day")
                .format("YYYY-MM-DD");
            }}
            class="rounded-full bg-primary-50 p-3 text-primary-500"
            title="-2 days "
          >
            <svg
              width="20"
              height="20"
              fill="currentColor"
              class="bi bi-chevron-double-left"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
              <path
                fill-rule="evenodd"
                d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
            </svg>
          </button>
          <button
            on:click={() => {
              selectedDate = dayjs(selectedDate)
                .subtract(1, "day")
                .format("YYYY-MM-DD");
            }}
            class="rounded-full bg-primary-50 p-3 text-primary-500"
            title="previous day"
          >
            <svg
              width="20"
              height="20"
              fill="currentColor"
              class="bi bi-chevron-left"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
            </svg>
          </button>
          <button
            on:click={() => {
              showCal = !showCal;
            }}
            class="rounded p-4 border-2"
          >
            {dayjs(selectedDate).format("DD.MM.YYYY")}
          </button>
          <button
            on:click={() => {
              selectedDate = dayjs(selectedDate)
                .add(1, "day")
                .format("YYYY-MM-DD");
            }}
            class="rounded-full bg-primary-50 p-3 text-primary-500"
            title="next day"
          >
            <svg
              width="20"
              height="20"
              fill="currentColor"
              class="bi bi-chevron-right"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
          <button
            on:click={() => {
              selectedDate = dayjs(selectedDate)
                .add(2, "day")
                .format("YYYY-MM-DD");
            }}
            class="rounded-full bg-primary-50 p-3 text-primary-500"
            title="+2 days"
          >
            <svg
              width="20"
              height="20"
              fill="bg-primary-500"
              class="fill-current"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708z"
              />
              <path
                fill-rule="evenodd"
                d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <div class=" {showCal ? 'block' : 'hidden'} md:block h-[calc(100vh-74px)]">
      <div
        class="absolute top-0 right-0 left-0 bottom-0 sm:visible sm:mt-0 md:relative"
      >
        <FullCalendar
          {options}
          class="p-4 max-w-screen-lg md:mx-auto min-h-full"
        />
      </div>
    </div>

    <div
      class="{selectedDate && !showCal
        ? 'block'
        : 'hidden'} md:block md:h-[calc(100vh-200px)] h-[calc(100vh-150px)]"
    >
      <SingleDay
        bind:raports={selectedRapports}
        bind:selectedDate
        bind:selectedTrainer
        on:eventClicked={async (info) => {
          console.log(info);
          //   const currentDate =
          //     info.detail.event._def.extendedProps.rapport.datum;
          //   const trainingDate = new Date(currentDate);
          //   const isEditable = await checkIfTrainingEditable(
          //     trainingDate,
          //     isAdmin,
          //     !!info.detail.event._def.extendedProps.rapport.archived,
          //     !!info.detail.event._def.extendedProps.rapport.invoicedIn
          //   );
          //   if (isEditable) {
          //     showEditForm = true;
          //   } else {
          //     showViewFrom = true;
          //   }
          //   // @ts-ignore
          //   rapportToUpdateId = info.detail.event._def.extendedProps.rapport.id;
        }}
        on:dateSelected={(info) => {
          let timeDiff = dayjs(info.detail.end).diff(
            dayjs(info.detail.start),
            "minute"
          );

          // selectedDuration should only be 30, 60, 90, 120 only approximate it
          if (timeDiff < 75) {
            timeDiff = 60;
          } else if (timeDiff < 105) {
            timeDiff = 90;
          } else {
            timeDiff = 120;
          }

          // format timeDiff to format 'hh:mm:ss'
          selectedDuration = dayjs()
            .hour(0)
            .minute(timeDiff)
            .second(0)
            .format("HH:mm:ss");
          // @ts-ignore

          showCreateForm = true;
          // todo auto fill the start date and duration by calculating the duration with start and end date
        }}
      />
    </div>
  </div>
</div>

<ToastsComponent />

<style>
  /* details > summary {
    list-style: none;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }

  details[open] summary ~ * {
    animation: sweep 0.25s ease-in-out;
  }

  @keyframes sweep {
    0% {
      opacity: 0;
      margin-top: -10px;
    }
    100% {
      opacity: 1;
      margin-top: 0px;
    }
  } */
</style>
