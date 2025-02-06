<script lang="ts">
  import dayjs from "dayjs";
  import { formatDuration } from "../../utils/duration-field-transformation";

  const remoteUrl = process.env["SVELTE_APP_REMOTE_URL"];
  let disable_history = false;

  // fetch config from remoteUrl/api/invoice-generation-configs/{id} and check if configValue is true or false and set it to disable_history
  fetch(`${remoteUrl}/api/invoice-generation-configs/3`)
    .then((response) => response.json())
    .then((data) => {
      disable_history = data.configValue === "true" ? true : false;

      import("App/ArchivedRapport").then((m) => {
        let module = m.default;

        new module({
          target: document.getElementById("rapport"),
          layout: "auto",
          props: {
            dateFormat: "DD.MM.YYYY",
            layout: "auto",
            quickFilters: [
              {
                label: "This Year",
                filter: {
                  and: [
                    {
                      datum: {
                        lt: dayjs().endOf("year"),
                      },
                    },
                    {
                      datum: {
                        gt: dayjs().startOf("year"),
                      },
                    },
                  ],
                },
              },
              {
                label: "Last Year",
                filter: {
                  and: [
                    {
                      datum: {
                        lt: dayjs()
                          .endOf("year")
                          .subtract(1, "year")
                          .endOf("year"),
                      },
                    },
                    {
                      datum: {
                        gt: dayjs().startOf("year").subtract(1, "year"),
                      },
                    },
                  ],
                },
              },
              {
                label: "The Year before the last",
                filter: {
                  and: [
                    {
                      datum: {
                        lt: dayjs()
                          .endOf("year")
                          .subtract(2, "year")
                          .endOf("year"),
                      },
                    },
                    {
                      datum: {
                        gt: dayjs().startOf("year").subtract(2, "year"),
                      },
                    },
                  ],
                },
              },
            ],
            defaultFilter: {
              datum: {
                lt: dayjs().format(),
                gt: dayjs().startOf("month").subtract(6, "month").format(),
              },
            },
            filter: {
              /* disabled by Patrick on 24.05.2024 - I think that doesn't make any sense anymore as we are now using the archived-rapports table
              where: {
                archived: { eq: true },
              },
              */
              order: ["id DESC"],
            },
            schema: {
              visibility: {
                readOnly: disable_history,
              },
              "custom-bulk-actions": [
                {
                  action: "Unarchive Invoice",
                  bulkFn: async (ids: string[]): Promise<Promise<any>[]> => {
                    const result = await Promise.all(
                      ids.map(async (id) => {
                        console.log(remoteUrl);
                        const response = await fetch(
                          `${remoteUrl}/api/rapports?where={"id":{"eq":"${id}"}}`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              archived: 0,
                            }),
                          }
                        );
                        if (!response.ok) {
                          try {
                            let data = await response.json();
                            if (data.error) {
                              throw new Error(data.error);
                            }
                          } catch {
                            throw new Error(
                              `Error: Failed with status ${response.status}`
                            );
                          }
                        }
                        return response.json();
                      })
                    );
                    return result;
                  },
                  singleFn: async (
                    row: any,
                    toast: any,
                    err: any
                  ): Promise<any> => {
                    const response = await fetch(
                      `${remoteUrl}/api/rapports?where={"id":{"eq":"${row.id}"}}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          archived: 0,
                        }),
                      }
                    );
                    if (!response.ok) {
                      try {
                        let data = await response.json();

                        if (data.error) {
                          throw new Error(data.error);
                        }
                      } catch {
                        throw new Error(
                          `Error: Failed with status ${response.status}`
                        );
                      }
                    }
                    toast("Successfully Unarchived Invoice");
                    return response.json();
                  },
                },
                {
                  action: "Delete Invoice",
                  generateSuccessMessage: (result: any) => {
                    return `Successfully deleted invoices for ${result} records`;
                  },
                  bulkFn: async (ids: string[]): Promise<Promise<any>[]> => {
                    // delete invoices
                    const rapports = await Promise.all(
                      ids.map(async (id) => {
                        const response = await fetch(
                          `${remoteUrl}/api/rapports/${id}?filter={"include":["trainer","platz","kunde","gruppe"]}`,
                          {
                            method: "GET",
                            headers: {
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        if (!response.ok) {
                          try {
                            let data = await response.json();
                            if (data.error) {
                              throw new Error(data.error);
                            }
                          } catch {
                            throw new Error(
                              `Error: Failed with status ${response.status}`
                            );
                          }
                        }

                        return response.json();
                      })
                    );
                    console.log({ rapports });

                    let groupedRapports: {
                      kunde: any;
                      rapports: any[];
                    }[] = [];

                    rapports.forEach((rapport) => {
                      const index = groupedRapports.findIndex(
                        (group) => group.kunde.id === rapport.kunde.id
                      );

                      if (index === -1) {
                        groupedRapports.push({
                          kunde: rapport.kunde,
                          rapports: [rapport],
                        });
                      } else {
                        groupedRapports[index].rapports.push(rapport);
                      }
                    });

                    console.log({ groupedRapports });

                    let deletedInvoiceIds = groupedRapports.map(
                      async (group) => {
                        const response = await fetch(
                          `${remoteUrl}/api/delete-bexio-invoice`,
                          {
                            method: "POST",
                            headers: {
                              Accept: "application/json",
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              invoiceId: group.rapports[0].invoicedIn
                                .split("-")[2]
                                .trim(),
                            }),
                          }
                        );

                        console.log("delete invoice response", response);

                        const deletedInvoice = await response.json();
                        console.log({ deletedInvoice });
                        if (!response.ok) {
                          if (deletedInvoice.error) {
                            throw new Error(
                              `${deletedInvoice.error.name || ""} ${
                                deletedInvoice.error.statusCode
                              }`
                            );
                          } else {
                            throw new Error(
                              `Error: Failed with status ${response.status}`
                            );
                          }
                        } else {
                          // update invoice id to "" in rapports with same invoice id
                          const response = await fetch(
                            `${remoteUrl}/api/rapports?where={"invoicedIn":{"eq":"${group.rapports[0].invoicedIn}"}}`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                invoicedIn: "",
                              }),
                            }
                          );

                          if (!response.ok) {
                            throw new Error(
                              `Error: Failed with status ${response.status}`
                            );
                          }
                        }
                      }
                    );

                    return deletedInvoiceIds;
                  },
                },
              ],
              "field-properties": {
                "field-transformation": [
                  {
                    name: "invoicedIn",
                    transformation: (value: string) => {
                      return value === "" ||
                        value === null ||
                        value === undefined
                        ? ""
                        : `<a title=""  class="flex items-center space-x-2 text-primary underline hover:text-primary-800 visited:text-purple-600" href="https://office.bexio.com/index.php/kb_invoice/show/id/${value}" target="_blank" rel="no-referrer">
                      <span>Open invoice</span>
                      <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"

                            ><path
                              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                            /><polyline points="15 3 21 3 21 9" /><line
                              x1="10"
                              y1="14"
                              x2="21"
                              y2="3"
                            /></svg
                          >
                      </a>`;
                    },
                  },
                  {
                    name: "trainingsdauer",
                    transformation: (value: string) => {
                      return formatDuration(value);
                    },
                  },
                ],
                "boolean-fields": [
                  "probetraining",
                  "nachholtermin",
                  "archived",
                ],
                "hidden-fields": ["token", "invoicedIn", "invoiceJson"],
                "auto-generated-fields": ["id"],
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
                  "id",
                ],
                "default-values": [
                  {
                    name: "trainingType",
                  },
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
              },
            },
          },
        });
      });
    });
</script>

<div id="rapport" />
