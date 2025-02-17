<script lang="ts">
  import dayjs from "dayjs";
  import duration from "dayjs/plugin/duration";
  dayjs.extend(duration);
  import("App/archivedTrainings").then((m) => {
    let module = m.default;
    new module({
      target: document.getElementById("calendar"),
      props: {
        dateFormat: "DD.MM.YYYY",
        layout: "auto",
        schema: {
          actions: {
            edit: {
              removable: true,
              "with-confirmation": true,
            },
          },
          "field-properties": {
            "boolean-fields": ["probetraining", "nachholtermin", "archived"],
            "hidden-fields": ["id", "token"],
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
                  {
                    label: "Fitness Tennis",
                    value: "fitness_tennis",
                  },
                  {
                    label: "Morning Treff",
                    value: "morning_treff",
                  },
                  {
                    label: "After Work",
                    value: "after_work",
                  },
                  {
                    label: "Mittags Treff",
                    value: "mittags_treff",
                  },
                ],
              },
              {
                name: "trainingsdauer",
                default: {
                  label: "60min",
                  value: `01:00:00`,
                },
                options: [
                  {
                    label: "45min",
                    value: "00:45:00",
                  },
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
            "field-transformation": [
              {
                name: "trainingsdauer",
                transformation: (value: string) => {
                  const checkValue =
                    /^\d{2}:\d{2}$|^\d+m$|(\d+h|\d+h\d+m?)$|^\d*\.\d+h$|^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(
                      value
                    );

                  if (!checkValue) {
                    throw new Error(
                      `Please enter a valid duration. Valid duration formats are: "1:30:00", "1h", "45m", "1h15m", "1.25h", ".5h" or "hh:mm:ss"`
                    );
                  }

                  let regex1 =
                    /(^([0-1]?[0-9]|2[0-3]):)?[0-5][0-9](:[0-5][0-9])?$/;
                  let regex2 = /(\d+h|\d+h\d+m?)$/;
                  let regex3 = /^\d*\.\d+h$/;
                  let regex4 = /^\d+m$/;

                  if (regex1.test(value)) {
                    let x = value.split(":");
                    if (x.length === 2) {
                      value = dayjs
                        .duration(Number(x[0]), "minutes")
                        .add(Number(x[1]), "seconds")
                        .format("HH:mm:ss");
                    } else {
                      value = dayjs
                        .duration(Number(x[0]), "hours")
                        .add(Number(x[1]), "minutes")
                        .add(Number(x[2]), "seconds")
                        .format("HH:mm:ss");
                    }
                  } else if (regex4.test(value)) {
                    let min = value.replace("m", "");
                    value = dayjs
                      .duration(Number(min), "minutes")
                      .format("HH:mm:ss");
                  } else if (regex3.test(value)) {
                    let x = value.split(".");
                    if (x[0] === "") {
                      let pointHr = Number("0." + x[1].replace("h", "")) * 60;
                      value = dayjs
                        .duration(pointHr, "minutes")
                        .format("HH:mm:ss");
                    } else {
                      let pointHr =
                        Number(x[0] + "." + x[1].replace("h", "")) * 60;
                      value = dayjs
                        .duration(pointHr, "minutes")
                        .format("HH:mm:ss");
                    }
                  } else if (regex2.test(value)) {
                    let hrMatch = value.match(/^\d+h/);
                    let hr = hrMatch ? hrMatch[0].replace("h", "") : "00";
                    let minMatch = value.match(/\d+m/);
                    let min = minMatch ? minMatch[0].replace("m", "") : "00";
                    value = dayjs
                      .duration(Number(hr), "hours")
                      .add(Number(min), "minutes")
                      .format("HH:mm:ss");
                  }
                  return value;
                },
              },
            ],
            // add favorite boolean field to relational fields
            "relational-fields": [
              {
                name: "kundeIds",
                type: "FAVORITE",
                editable: true,
                columns: [
                  "name",
                  "vorname",
                  "geburtstag",
                  "ort",
                  "id",
                  "bexioId",
                ],
              },
            ],
          },
        },
      },
    });
  });
</script>

<div id="calendar" />
