<script lang="ts">
  import dayjs from "dayjs";
  import { formatDuration } from "../../utils/duration-field-transformation";
  const remoteUrl = process.env["SVELTE_APP_REMOTE_URL"];
  import("App/Rapport").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("rapport"),
      layout: "auto",
      props: {
        dateFormat: "DD.MM.YYYY",
        layout: "auto",
        quickFilters: [
          {
            label: "Last Month",
            filter: {
              and: [
                {
                  datum: {
                    lt: dayjs()
                      .endOf("month")
                      .subtract(1, "month")
                      .endOf("month"),
                  },
                },
                {
                  datum: {
                    gt: dayjs().startOf("month").subtract(1, "month"),
                  },
                },
              ],
            },
          },
          {
            label: "This Month",
            filter: {
              and: [
                {
                  datum: {
                    lt: dayjs().endOf("month"),
                  },
                },
                {
                  datum: {
                    gt: dayjs().startOf("month"),
                  },
                },
              ],
            },
          },
          {
            label: "Last 30 days",
            filter: {
              and: [
                {
                  datum: {
                    lt: dayjs().format(),
                  },
                },
                {
                  datum: {
                    gt: dayjs().subtract(1, "month").format(),
                  },
                },
              ],
            },
          },
          {
            label: "Last 90 days",
            filter: {
              and: [
                {
                  datum: {
                    lt: dayjs().format(),
                  },
                },
                {
                  datum: {
                    gt: dayjs().subtract(3, "month").format(),
                  },
                },
              ],
            },
          },
        ],
        defaultFilter: {
          datum: {
            lt: dayjs().format(),
            gt: dayjs().startOf("month").subtract(2, "month").format(),
          },
        },
        schema: {
          "field-properties": {
            "field-transformation": [
              {
                name: "trainingsdauer",
                transformation: formatDuration,
              },
            ],
            "boolean-fields": ["probetraining", "nachholtermin", "archived"],
            "auto-generated-fields": ["id"],
            "field-order": [
              "datum",
              "startzeit",
              "trainingsdauer",
              "trainer",
              "platz",
              "trainingType",
              "kunde",
              "kundes",
              "kundeIds",
              "gruppe",
              "notizen",
              "nachholtermin",
              "probetraining",
              "archived",
              "invoicedIn",
              "invoiceJson",
            ],
            "date-fields": [
              {
                name: "datum",
                type: "date",
              },
              {
                name: "startzeit",
                type: "time",
              },
            ],
            "dropdown-fields": [
              {
                name: "trainingsdauer",
                default: {
                  label: "90min",
                  value: "01:30:00",
                },
                options: [
                  {
                    label: "60min",
                    value: "01:00:00",
                  },
                  {
                    label: "90min",
                    value: "01:30:00",
                  },
                  {
                    label: "30min",
                    value: "00:30:00",
                  },
                  {
                    label: "120min",
                    value: "02:00:00",
                  },
                ],
              },
            ],
            "textarea-fields": ["notizen"],
            "default-values": [
              {
                name: "trainingType",
              },
              {
                name: "invoicedIn",
                value: null,
              },
            ],
            "relational-fields": [
              {
                name: "kundeIds",
                type: "FAVORITE",
                editable: true,
                columns: ["id", "name", "vorname", "geburtstag", "notizen"],
              },
              {
                name: "trainer",
                editable: true,
                columns: ["id", "vorname", "name", "email"],
                dropDownFilter: {
                  aktiv: true,
                },
              },
            ],
          },
        },
        archiveTable: "ArchivedRapport",
      },
    });
  });
</script>

<div id="rapport" />
