<script lang="ts">
  import FullCalendar, { CalendarOptions, ViewApi } from "svelte-fullcalendar";
  import timegridPlugin from "@fullcalendar/timegrid";
  import dayjs from "dayjs";
  import interactionPlugin from "@fullcalendar/interaction"; // for selectable
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  let eventGuid = 0;
  let innerWidth = window.innerWidth;

  let trainers: any = [];

  onMount(async function () {
    let rapports = await fetch(
      `${process.env.SVELTE_APP_REMOTE_URL}/api/trainers?filter={"order":"id","where":{"aktiv":true}}`
    );
    trainers = await rapports.json();
  });

  export let raports: {
    datum: any;
    startzeit: any;
    trainingsdauer: any;
    kunde: any;
    gruppe: any;
    platz: any;
    trainer: any;
    notizen?: string;
    kundes?: any;
  }[] = [];
  export let selectedDate = "";
  export let selectedTrainer: any;

  let calendarRef: any;
  function set() {
    if (calendarRef) {
      const calendarApi = calendarRef.getAPI();
      calendarApi.gotoDate(selectedDate);
    }
  }

  $: {
    let showedDate = selectedDate;

    set();
    console.log(showedDate);
  }

  function createEventId() {
    return String(eventGuid++);
  }
  let options: CalendarOptions = {
    headerToolbar: false,
    initialDate: selectedDate,
    initialView: "timeGridDay",
    plugins: [timegridPlugin, interactionPlugin],
    slotMinTime: "06:00:00",
    slotMaxTime: "22:00:00",
    selectable: true,
    height: "100%",
    handleWindowResize: true,
  };

  $: {
    innerWidth;
    options = {
      ...options,
    };
  }

  $: {
    options = {
      headerToolbar: false,
      initialDate: selectedDate,
      initialView: "timeGridDay",
      plugins: [timegridPlugin, interactionPlugin],
      slotEventOverlap: false,

      eventContent: (args: any) => {
        let difference = dayjs(args.event._instance.range.end).diff(
          dayjs(args.event._instance.range.start),
          "minute"
        );
        let title = args.event._def.title;
        let platz = args.event._def.extendedProps.platz;
        let timeText = args.timeText;
        let notizen = args.event._def.extendedProps.notizen;

        let availableRows = difference / 30;
        if (availableRows >= 4) {
          return {
            html: `<div class="cursor-pointer" title="${title} ${platz} ${notizen}" >
            <p class="truncate text-sm">${timeText}</p>
            <p class="truncate text-sm">${title}</p>
            <p class="truncate text-sm">${platz}</p>
            <p class="truncate text-sm">${notizen}</p>
           </div>`,
          };
        } else if (availableRows >= 3) {
          return {
            html: `<div class="cursor-pointer" title="${title} ${platz} ${notizen}" >
            <p class="truncate text-sm">${timeText}</p>
            <p class="truncate text-sm">${title}</p>
            <p class="truncate text-sm">${platz ? `| ${platz}` : ""} ${
              notizen ? `| ${notizen}` : ""
            }</p>
           </div>`,
          };
        } else if (availableRows >= 2) {
          return {
            html: `<div class="cursor-pointer" title="${title} ${platz} ${notizen}" >
              <p class="truncate text-sm">${timeText}</p>
              <p class="truncate text-sm">${title} ${
                platz ? `| ${platz}` : ""
              } ${notizen ? `| ${notizen}` : ""}</p>
             </div>`,
          };
        } else {
          return {
            html: `<div class="cursor-pointer" title="${title} ${platz} ${notizen}" >
              <p class="truncate text-sm">${timeText} | ${title} ${
                platz ? `| ${platz}` : ""
              } ${notizen ? `| ${notizen}` : ""}</p>
             </div>`,
          };
        }
      },
      events: raports.map((r) => {
        let name = "";

        let kundes =
          r.kundes.length > 0
            ? `Kundes: ${r.kundes.map((k: any) => `${k.name} ${k.vorname}`).join(", ")}`
            : "";

        if (kundes) {
          name = kundes;
        } else {
          name = r.kunde
            ? `Kunde: ${r.kunde?.name}, ${r.kunde?.vorname}`
            : r.gruppe
              ? `Gruppe: ${r.gruppe?.gruppentyp} - ${r.gruppe?.gruppenname}`
              : "";
        }

        return {
          id: createEventId(),
          title: `${name} ${kundes ? `| ${kundes}` : ""}`,
          platz: `${r.platz?.tenniscourt || ""}`,
          notizen: `${r.notizen || ""}`,
          backgroundColor: ` ${
            selectedTrainer?.value
              ? r.kunde
                ? "#1a5ca3"
                : "#fed5cb"
              : r?.trainer?.color || "#1a5ca3"
          }  `,
          textColor: `${r?.trainer?.colorFont || "#000"}`,
          borderColor: `${r.kunde ? "#fff" : "#fa7252"}`,
          className: `single-day-event-style ${
            r.trainingsdauer ? "" : "dotted-dashed"
          } `,
          start: new Date(
            dayjs(r.datum)
              .set("hour", r.startzeit.split(":")[0])
              .set("minute", r.startzeit.split(":")[1])
              .format()
          ),
          end: new Date(
            dayjs(r.datum)
              .set("hour", r.startzeit.split(":")[0])
              .set("minute", r.startzeit.split(":")[1])
              .add(r.trainingsdauer?.split(":")[0] || 1, "hour")
              .add(r.trainingsdauer?.split(":")[1] || 0, "minute")
              .format()
          ),
          rapport: r,
        };
      }),
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
      selectable: true,
      select: function (info: any) {
        dispatch("dateSelected", info);

        // show create form with the start date and duration(end date - start date) pre filled
      },

      eventClick: function (info: any) {
        dispatch("eventClicked", info);
      },

      dateClick: function (info: any) {
        dispatch("dateSelected", info);
      },
      businessHours: {
        // days of week. an array of zero-based day of week integers (0=Sunday)
        daysOfWeek: [1, 2, 3, 4, 5], // Monday - Thursday
        startTime: "06:00", // a start time (10am in this example)
        endTime: "22:00", // an end time (6pm in this example)
      },
      slotLabelFormat: {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      },
      height: "100%",
      handleWindowResize: true,
      windowResize: function (arg: { view: ViewApi }) {
        arg.view.calendar.updateSize();
      },
    };
  }
</script>

<svelte:window bind:innerWidth />
<FullCalendar
  bind:this={calendarRef}
  {options}
  class="pt-4 max-w-screen-lg mx-auto min-h-full"
/>
<div>
  {#if trainers.length > 0}
    <div class="flex flex-wrap mt-4 gap-4 justify-between">
      {#each trainers as trainer}
        <div class="flex items-center gap-[0.1rem]">
          <div
            class="w-4 h-4 rounded-full mr-2"
            style="background-color: {trainer.color}"
          ></div>
          <p>{trainer.name}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>
