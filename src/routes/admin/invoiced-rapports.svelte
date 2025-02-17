<script lang="ts">
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import InvoiceSample from "../../components/invoice/invoice-sample.svelte";
  import JSONTree from "svelte-json-tree";
  import { formatDuration } from "../../utils/duration-field-transformation";

  const remoteUrl = process.env["SVELTE_APP_REMOTE_URL"];
  let bexioProfile = "";
  let disable_history = false;

  let showInvoice = false;
  let value: {
    array: any[];
  } = {
    array: [],
  };

  onMount(async () => {
    const response = await fetch(`${remoteUrl}/api/bexio-info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      bexioProfile = "default";
    } else {
      const bexioInfo = await response.json();
      bexioProfile = bexioInfo.bexioProfile;
    }

    document.addEventListener("click", async (e) => {
      console.log(e);
      if ((e.target as HTMLElement)?.classList.contains("invoicePreview")) {
        e.preventDefault();
        const rapportId = (e.target as HTMLElement)?.getAttribute("data-id");
        console.log({ rapportId });
        // fire an event with showInvoice with an id in the data
        const event = new CustomEvent("showInvoice", {
          detail: {
            id: rapportId,
          },
        });
        document.dispatchEvent(event);
      }
    });

    document.addEventListener("showInvoice", async (e) => {
      showInvoice = true;
      const rapportId = e.detail?.id;
      console.log({ rapportId });
      const response = await fetch(
        `${remoteUrl}/api/rapports/${rapportId}?filter={"include": [{"relation": "trainer","scope": {"include": [{"relation": "SummerRateBefore"},{"relation":"SummerRateAfter"},{"relation":"WinterRateAfter"},{"relation":"WinterRateBefore"},{"relation":"ClubRate"}]}},{"relation": "kundes","scope": {"include": [{"relation": "KUNDE"}]}}, "platz","gruppe", "invoices"]}`,
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
          throw new Error(`Error: Failed with status ${response.status}`);
        }
      }

      const rapport = await response.json();

      let allRapports = [];
      // get all related rapports if the response has an invoice
      if (rapport.invoices) {
        // use filter id in rapport.invoices.map((invoice) => invoice.relatedRapportId)

        let relatedRapports = [
          ...rapport.invoices.map((invoice) => invoice.relatedRapportId),
          rapport.id,
        ];

        const response = await fetch(
          `${remoteUrl}/api/rapports?filter={"where":{"id":{"inq":[${relatedRapports}]}}, "include": [{"relation": "trainer","scope": {"include": [{"relation": "SummerRateBefore"},{"relation":"SummerRateAfter"},{"relation":"WinterRateAfter"},{"relation":"WinterRateBefore"},{"relation":"ClubRate"}]}},{"relation": "kundes","scope": {"include": [{"relation": "KUNDE"}]}}, "platz","gruppe", "invoices"]}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        allRapports = await response.json();
      }

      let groupedRapports: {
        kunde: any;
        rapports: any[];
      }[] = [];

      console.log({ rapport, allRapports });

      console.log(allRapports.find((r) => r.kundes?.map((k) => k.KUNDE)));
      let parent = allRapports.find(
        (r) => r.kundes.map((k) => k.KUNDE)?.KUNDE
      )?.kundes;
      console.log({ parent });

      groupedRapports.push({
        kunde: parent ? parent : rapport.kunde,
        rapports: allRapports,
      });

      console.log({ groupedRapports });

      groupedRapports.map(async (group) => {
        // get group.rapports and find the date range for all the rapports
        let minDate = group.rapports.reduce(
          (min, p) => (p.datum < min ? p.date : min),
          group.rapports[0].datum
        );
        // round minDate to the beginning of the month
        minDate = dayjs(minDate).startOf("month").format("YYYY-MM-DD");

        let maxDate = group.rapports.reduce(
          (max, p) => (p.date > max ? p.datum : max),
          group.rapports[0].datum
        );
        // round maxDate to the end of the month
        maxDate = dayjs(maxDate).endOf("month").format("YYYY-MM-DD");

        // year-month(from)-month(to) (in German) - contact name (Vorname and Name from Kunde table)
        const invoiceTitleDate = `${dayjs(minDate)
          .locale("de")
          .format("YYYY")}-${dayjs(minDate).format("MMMM")}${
          dayjs(minDate).format("MMMM") !== dayjs(maxDate).format("MMMM")
            ? `-${dayjs(maxDate).locale("de").format("MMMM")}`
            : ""
        }`;

        console.log({ invoiceTitleDate });

        value.array[0] = {
          invoiceTitleDate: invoiceTitleDate,
          group: group,
          minDate: minDate,
          maxDate: maxDate,
        };
        console.log({ value });
      });
    });
  });

  // fetch config from remoteUrl/api/invoice-generation-configs/{id} and check if configValue is true or false and set it to disable_history
  fetch(`${remoteUrl}/api/invoice-generation-configs/3`)
    .then((response) => response.json())
    .then((data) => {
      disable_history = data.configValue === "true" ? true : false;

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
                        gt: dayjs().subtract(30, "day").format(),
                      },
                    },
                  ],
                },
              },
              {
                label: "Last 60 days",
                filter: {
                  and: [
                    {
                      datum: {
                        lt: dayjs().format(),
                      },
                    },
                    {
                      datum: {
                        gt: dayjs().subtract(60, "day").format(),
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
                        gt: dayjs().subtract(90, "day").format(),
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
            filter: {
              where: {
                and: [
                  {
                    and: [
                      {
                        invoicedIn: { neq: "" },
                      },
                      {
                        invoicedIn: { neq: null },
                      },
                    ],
                  },
                  {
                    or: [
                      {
                        archived: { eq: false },
                      },
                      {
                        archived: { eq: null },
                      },
                    ],
                  },
                ],
              },
              order: ["id DESC"],
            },
            schema: {
              visibility: {
                readOnly: disable_history,
              },
              "custom-bulk-actions": [
                {
                  action: "Unlink Invoice",
                  bulkFn: async (ids: string[]): Promise<Promise<any>[]> => {
                    // unlink invoices
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
                              invoicedIn: null,
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
                          invoicedIn: null,
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
                    toast("Successfully Unlinked Invoice");
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
                          `${remoteUrl}/api/rapports/${id}?filter={"include":["trainer","platz","kundes","gruppe"]}`,
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
                        const deletedInvoice = await response.json();
                        console.log({ deletedInvoice });
                        if (!response.ok) {
                          if (
                            bexioProfile === "nop" ||
                            bexioProfile === "default"
                          ) {
                            ids.map(async (id) => {
                              const response = await fetch(
                                `${remoteUrl}/api/rapports/${id}`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    invoicedIn: "",
                                    invoiceJson: null,
                                  }),
                                }
                              );
                            });
                          }

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
                  singleFn: async (
                    row: any,
                    toast: any,
                    err: any
                  ): Promise<any> => {
                    // delete invoices
                    const response = await fetch(
                      `${remoteUrl}/api/rapports/${row.id}?filter={"include":["trainer","platz","kundes","gruppe"]}`,
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

                    const rapports = await response.json();

                    console.log({ rapports });

                    let groupedRapports: {
                      kunde: any;
                      rapports: any[];
                    }[] = [];

                    const index = groupedRapports.findIndex(
                      (group) => group.kunde.id === rapports.kunde.id
                    );

                    if (index === -1) {
                      groupedRapports.push({
                        kunde: rapports.kunde,
                        rapports: [rapports],
                      });
                    } else {
                      groupedRapports[index].rapports.push(rapports);
                    }

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
                        const deletedInvoice = await response.json();
                        console.log({ deletedInvoice });
                        if (!response.ok) {
                          if (
                            bexioProfile === "nop" ||
                            bexioProfile === "default"
                          ) {
                            await fetch(`${remoteUrl}/api/rapports/${row.id}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                invoicedIn: "",
                                invoiceJson: null,
                              }),
                            });
                          }

                          err(new Error("Failed to Delete Invoice"));
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
                          } else {
                            toast("Successfully Deleted Invoice");
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
                    transformation: (value: string, row: any) => {
                      return value === "" ||
                        value === null ||
                        value === undefined ||
                        value === "null" ||
                        value == "devInvoice"
                        ? `<span title=""    class="flex items-center space-x-2 text-primary underline hover:text-primary-800 visited:text-purple-600 invoicePreview"  target="_blank" rel="no-referrer" data-id=${row.id} >
                      <span class='invoicePreview' data-id=${row.id}>Open invoice</span>
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
                      </span>`
                        : `<a title="" class="flex items-center space-x-2 text-primary underline hover:text-primary-800 visited:text-purple-600" href="https://office.bexio.com/index.php/kb_invoice/show/id/${value
                            .split("-")[2]
                            ?.trim()}" target="_blank" rel="no-referrer">
                      <span>Open invoice - ${value
                        .split("-")
                        ?.slice(0, -1)
                        .join("-")
                        .trim()}</span>
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
                "boolean-fields": ["probetraining", "nachholtermin"],
                "hidden-fields": ["archived"],
                "auto-generated-fields": ["id"],
                "field-order": [
                  "datum",
                  "invoicedIn",
                  "startzeit",
                  "trainingsdauer",
                  "trainer",
                  "platz",
                  "trainingType",
                  "kundes",
                  "kundeIds",
                  "gruppe",
                  "notizen",
                  "nachholtermin",
                  "probetraining",
                  "invoiceJson",
                  "id",
                ],
                "default-values": [
                  // {
                  //   name: "trainingType",
                  //   value: "private",
                  // },
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
                  {
                    name: "kundes",
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
    });
</script>

<div id="rapport" />

{#if showInvoice}
  <div id="myModal" class="modal">
    <!-- Modal content -->
    <div class="modal-content">
      <div class="modal-header">
        <span class="close"
          ><button
            on:click={() => {
              showInvoice = false;
              value.array = [];
            }}
            ><svg
              style="color: white"
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
                fill="white"
              />
            </svg>
          </button></span
        >
        <h3>Create Invoice Request</h3>
      </div>
      <div class="modal-body h-full">
        <div class="flex h-full">
          <div class="flex-1">
            <JSONTree {value} defaultExpandedLevel={5} />
          </div>
          <div class="flex-1 overflow-y-scroll">
            <InvoiceSample info={value.array[0]} />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div class="footer" />
      </div>
    </div>
  </div>
{/if}

<style>
  /* The Modal (background) */
  .modal {
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    padding-top: 100px; /* Location of the box */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow-y: auto; /* Enable scroll if needed */
    background-color: rgb(0, 0, 0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
  }

  /* Modal Content */
  .modal-content {
    position: relative;
    background-color: #fefefe;
    margin: auto;
    padding: 0;
    border: 1px solid #888;
    border-radius: 10px;
    width: 80%;
    min-height: 50%;
    box-shadow:
      0 4px 8px 0 rgba(0, 0, 0, 0.2),
      0 6px 20px 0 rgba(0, 0, 0, 0.19);
    -webkit-animation-name: animatetop;
    -webkit-animation-duration: 0.4s;
    animation-name: animatetop;
    animation-duration: 0.4s;
  }

  /* Add Animation */
  @-webkit-keyframes animatetop {
    from {
      top: -300px;
      opacity: 0;
    }
    to {
      top: 0;
      opacity: 1;
    }
  }

  @keyframes animatetop {
    from {
      top: -300px;
      opacity: 0;
    }
    to {
      top: 0;
      opacity: 1;
    }
  }

  /* The Close Button */
  .close {
    color: white;
    float: right;
    font-size: 28px;
    font-weight: bold;
  }

  .close:hover,
  .close:focus {
    color: #000;
    text-decoration: none;
    cursor: pointer;
  }

  .modal-header {
    padding: 2px 16px;
    font-size: 22px;
    background-color: #044c9c;
    color: white;
  }

  .modal-body {
    padding: 5px 16px;
    min-height: 50%;
  }

  .modal-footer {
    padding: 10px 16px;
    background-color: #044c9c;
    color: white;
  }
</style>
