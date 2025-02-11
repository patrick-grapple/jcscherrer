<script lang="ts">
  import { onMount } from "svelte";
  import dayjs from "dayjs";
  import "dayjs/locale/de";

  import JSONTree from "svelte-json-tree";

  import InvoiceSample from "../../components/invoice/invoice-sample.svelte";
  import { formatDuration } from "../../utils/duration-field-transformation";
  import Progressbar from "../../components/shared/progressbar/progressbar.svelte";
  dayjs.locale("de-ch");
  //control request modal open and close
  let openRequestModel = false;
  let value: {
    array: any[];
  } = {
    array: [],
  };

  let totalInvoices = 0;
  let completedInvoices = 0;
  let showProgressBar = false;

  window.addEventListener("increase", (e) => {
    completedInvoices++;
    console.log({ completedInvoices });
  });

  function closeModal() {
    openRequestModel = false;
    value.array = [];
  }
  const remoteUrl = process.env["SVELTE_APP_REMOTE_URL"];
  let bexioProfile = "";
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
  });
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
        filter: {
          where: {
            and: [
              {
                or: [
                  {
                    invoicedIn: { eq: "" },
                  },
                  {
                    invoicedIn: { eq: null },
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
          "custom-bulk-actions": [
            {
              action: "Create Invoice",
              generateSuccessMessage: (result: any) => {
                return `Successfully created ${totalInvoices} invoices with a total of ${result} records`;
              },
              bulkFn: async (ids: string[]): Promise<Promise<any>[]> => {
                showProgressBar = true;
                totalInvoices = 100;
                completedInvoices = 0;

                const groupRapportsByParent = async (
                  groupedRapports: {
                    kunde: any;
                    rapports: any[];
                    currentKunde: any;
                  }[]
                ) => {
                  for (let i = 0; i < groupedRapports.length; i++) {
                    const group = groupedRapports[i];

                    console.log({ group });
                    if (group.kunde?.KUNDE?.length > 0) {
                      continue;
                    }
                    let found = false;
                    for (let j = 0; j < groupedRapports.length; j++) {
                      const otherGroup = groupedRapports[j];

                      if (
                        otherGroup.kunde?.KUNDE?.find(
                          (kunde: any) => kunde.id === group.kunde?.id
                        )
                      ) {
                        otherGroup.rapports.push(...group.rapports);
                        groupedRapports.splice(i, 1);
                        i--;
                        found = true;
                        break;
                      }
                    }

                    if (!found) {
                      let bexioId = group.kunde?.bexioId;
                      const response = await fetch(
                        `${remoteUrl}/api/kunde-throughs?filter={"where":{"contactSubId":${bexioId}}}`,
                        {
                          method: "GET",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      let data = await response.json();
                      if (data.length === 0) {
                        continue;
                      }
                      const response1 = await fetch(
                        `${remoteUrl}/api/kundes?filter={"where":{"bexioId":${data[0].contactId}},"include":["KUNDE"]}`,
                        {
                          method: "GET",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      let data1 = await response1.json();
                      group.kunde = data1[0];
                    }
                  }

                  console.log({ groupedRapports });

                  let mergedRapports: any[] = [...groupedRapports];

                  for (let i = 0; i < mergedRapports.length; i++) {
                    const group = mergedRapports[i];
                    for (let j = 0; j < mergedRapports.length; j++) {
                      const otherGroup = mergedRapports[j];
                      if (group.kunde?.id === otherGroup.kunde?.id) {
                        if (i !== j) {
                          otherGroup.rapports.push(...group.rapports);
                          mergedRapports.splice(i, 1);
                          i--;
                          break;
                        }
                      }
                    }
                  }
                  console.log({ mergedRapports });

                  return mergedRapports;
                };

                // should fetch all the rapports using fetch API
                const rapports = await Promise.all(
                  ids.map(async (id) => {
                    const response = await fetch(
                      `${remoteUrl}/api/rapports/${id}?filter={"include": [{"relation": "trainer","scope": {"include": [{"relation": "SummerRateBefore"},{"relation":"SummerRateAfter"},{"relation":"WinterRateAfter"},{"relation":"WinterRateBefore"},{"relation":"ClubRate"}]}},{"relation": "kundes","scope": {"include": [{"relation": "KUNDE"}]}}, "platz","gruppe"]}`,
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
                  currentKunde: any;
                }[] = [];

                rapports.forEach((rapport) => {
                  console.log({ rapport });
                  for (let i = 0; i < rapport.kundes.length; i++) {
                    const kunde = rapport.kundes[i];
                    console.log({ kunde });
                    const index = groupedRapports.findIndex(
                      (g) =>
                        g.kunde?.id === kunde.id &&
                        g.currentKunde?.id === kunde.id
                    );
                    if (index === -1) {
                      groupedRapports.push({
                        kunde: kunde,
                        rapports: [rapport],
                        currentKunde: kunde,
                      });
                    } else {
                      groupedRapports[index].rapports.push(rapport);
                    }
                  }

                  groupedRapports = groupedRapports;
                });

                const improvedGroupedRapports =
                  await groupRapportsByParent(groupedRapports);

                totalInvoices = improvedGroupedRapports.length;

                let invoices = improvedGroupedRapports.map(
                  async (group, index) => {
                    let minDate = group.rapports.reduce(
                      (min, p) => (p.datum < min ? p.datum : min),
                      group.rapports[0].datum
                    );
                    // round minDate to the beginning of the month
                    minDate = dayjs(minDate)
                      .startOf("month")
                      .format("YYYY-MM-DD");

                    let maxDate = group.rapports.reduce(
                      (max, p) => (p.datum > max ? p.datum : max),
                      group.rapports[0].datum
                    );
                    // round maxDate to the end of the month
                    maxDate = dayjs(maxDate)
                      .endOf("month")
                      .format("YYYY-MM-DD");

                    // year-month(from)-month(to) (in German) - contact name (Vorname and Name from Kunde table)
                    const invoiceTitleDate = `${dayjs(minDate)
                      .locale("de-ch")
                      .format("YYYY")}-${dayjs(minDate)
                      .locale("de-ch")
                      .format("MMMM")}${
                      dayjs(minDate).locale("de-ch").format("MMMM") !==
                      dayjs(maxDate).locale("de-ch").format("MMMM")
                        ? `-${dayjs(maxDate).locale("de-ch").format("MMMM")}`
                        : ""
                    }`;
                    console.log({ invoiceTitleDate });

                    await new Promise((resolve) =>
                      setTimeout(resolve, (index + 1) * 350)
                    );
                    //emit event to increase the completedInvoices
                    window.dispatchEvent(new Event("increase"));

                    const response = await fetch(
                      `${remoteUrl}/api/create-bexio-invoice`,
                      {
                        method: "POST",
                        headers: {
                          Accept: "application/json; charset=utf-8",
                          "Content-Type": "application/json; charset=utf-8",
                        },
                        body: JSON.stringify({
                          invoiceTitleDate: invoiceTitleDate,
                          group: group,
                          minDate: minDate,
                          maxDate: maxDate,
                        }),
                      }
                    );
                    let invoice = await response.json();

                    value.array[value.array.length] = {
                      invoiceTitleDate: invoiceTitleDate,
                      group: group,
                      minDate: minDate,
                      maxDate: maxDate,
                    };

                    if (bexioProfile === "default" || bexioProfile === "nop") {
                      for (let i = 0; i < group.rapports.length; i++) {
                        for (let j = 0; j < group.rapports.length; j++) {
                          const rapport = group.rapports[i];
                          const relatedRapport = group.rapports[j];
                          await fetch(`${remoteUrl}/api/invoices`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              rapportId: rapport.id,
                              relatedRapportId: relatedRapport.id,
                            }),
                          });
                        }
                      }
                    }

                    if (!invoice.success) {
                      // await Promise.all(
                      //   group.rapports.map(async (rapport) => {
                      //     const response = await fetch(
                      //       `${remoteUrl}/api/rapports/${rapport.id}`,
                      //       {
                      //         method: "PATCH",
                      //         headers: {
                      //           "Content-Type": "application/json",
                      //         },
                      //         body: JSON.stringify({
                      //           invoicedIn: `devInvoice`,
                      //           invoiceJson: JSON.stringify(invoice.reqbody),
                      //         }),
                      //       }
                      //     );
                      //     if (!response.ok) {
                      //       try {
                      //         let data = await response.json();
                      //         if (data.error) {
                      //           throw new Error(data.error);
                      //         }
                      //       } catch {
                      //         // TODO: remove the invoice if the rapport update fails
                      //         throw new Error(
                      //           `Error: Failed with status ${response.status}`
                      //         );
                      //       }
                      //     }
                      //   })
                      // );
                      if (
                        bexioProfile === "default" ||
                        bexioProfile === "nop"
                      ) {
                        openRequestModel = true;
                      } else {
                        openRequestModel = false;
                      }

                      if (invoice.error) {
                        throw new Error(
                          `${invoice.error.name || ""} ${
                            invoice.error.statusCode
                          }`
                        );
                      } else {
                        throw new Error(
                          `Error: Failed with status ${response.status}`
                        );
                      }
                    }
                    // else {
                    // const bexioInvoice = JSON.parse(invoice.data);
                    // update the rapports with the invoice id
                    // await Promise.all(
                    //   group.rapports.map(async (rapport) => {
                    //     const response = await fetch(
                    //       `${remoteUrl}/api/rapports/${rapport.id}`,
                    //       {
                    //         method: "PATCH",
                    //         headers: {
                    //           "Content-Type": "application/json",
                    //         },
                    //         body: JSON.stringify({
                    //           invoicedIn: `${bexioInvoice.document_nr} - ${bexioInvoice.id}`,
                    //         }),
                    //       }
                    //     );
                    //     // open request modal to show request send to bexio
                    //     if (!response.ok) {
                    //       try {
                    //         let data = await response.json();
                    //         if (data.error) {
                    //           throw new Error(data.error);
                    //         }
                    //       } catch {
                    //         // TODO: remove the invoice if the rapport update fails
                    //         throw new Error(
                    //           `Error: Failed with status ${response.status}`
                    //         );
                    //       }
                    //     }
                    //   })
                    // );
                    // }
                  }
                );
                // open request modal to show request send to bexio

                // loop over the rapports in each of the group and create the invoice entry for each rapport that relates one with another with rapportId and relatedRapportId

                // showProgressBar = false;
                return invoices;
              },
              singleFn: async (
                row: any,
                toast: any,
                err: any
              ): Promise<any> => {
                // should fetch all the rapports using fetch API
                const getParent = async (kunde) => {
                  if (kunde?.KUNDE?.length > 0) {
                    return kunde;
                  } else {
                    let bexioId = kunde?.bexioId;
                    const response = await fetch(
                      `${remoteUrl}/api/kunde-throughs?filter={"where":{"contactSubId":${bexioId}}}`,
                      {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    let data = await response.json();
                    if (data.length === 0) {
                      return kunde;
                    }
                    const response1 = await fetch(
                      `${remoteUrl}/api/kundes?filter={"where":{"bexioId":${data[0].contactId}}}`,
                      {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    let data1 = await response1.json();
                    return data1[0];
                  }
                };
                try {
                  const response = await fetch(
                    `${remoteUrl}/api/rapports/${row.id}?filter={"include": [{"relation": "trainer","scope": {"include": [{"relation": "SummerRateBefore"},{"relation":"SummerRateAfter"},{"relation":"WinterRateAfter"},{"relation":"WinterRateBefore"},{"relation":"ClubRate"}]}}, "platz","gruppe",{"relation": "kundes","scope": {"include": [{"relation": "KUNDE"}]}}]}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  const rapport = await response.json();
                  console.log({ rapport });

                  let groupedRapports: {
                    kunde: any;
                    rapports: any[];
                    currentKunde: any;
                  }[] = [];

                  for (let i = 0; i < rapport.kundes.length; i++) {
                    const kunde = rapport.kundes[i];
                    const index = groupedRapports.findIndex(
                      (g) =>
                        g.kunde?.id === kunde.id &&
                        g.currentKunde?.id === kunde.id
                    );
                    if (index === -1) {
                      groupedRapports.push({
                        kunde: await getParent(kunde),
                        rapports: [rapport],
                        currentKunde: kunde,
                      });
                    } else {
                      groupedRapports[index].rapports.push(rapport);
                    }
                  }

                  groupedRapports = groupedRapports;

                  console.log({ groupedRapports });

                  let invoices = groupedRapports.map(async (group) => {
                    try {
                      let minDate = group.rapports.reduce(
                        (min, p) => (p.datum < min ? p.datum : min),
                        group.rapports[0].datum
                      );
                      // round minDate to the beginning of the month
                      minDate = dayjs(minDate)
                        .startOf("month")
                        .format("YYYY-MM-DD");

                      let maxDate = group.rapports.reduce(
                        (max, p) => (p.datum > max ? p.datum : max),
                        group.rapports[0].datum
                      );
                      // round maxDate to the end of the month
                      maxDate = dayjs(maxDate)
                        .endOf("month")
                        .format("YYYY-MM-DD");

                      // year-month(from)-month(to) (in German) - contact name (Vorname and Name from Kunde table)
                      const invoiceTitleDate = `${dayjs(minDate)
                        .locale("de-ch")
                        .format("YYYY")}-${dayjs(minDate)
                        .locale("de-ch")
                        .format("MMMM")}${
                        dayjs(minDate).locale("de-ch").format("MMMM") !==
                        dayjs(maxDate).locale("de-ch").format("MMMM")
                          ? `-${dayjs(maxDate).locale("de-ch").format("MMMM")}`
                          : ""
                      }`;

                      console.log({ invoiceTitleDate });

                      // change rapport.datum to the format dd.mm.yyyy

                      const response = await fetch(
                        `http://localhost:8080/api/create-bexio-invoice`,
                        {
                          method: "POST",
                          headers: {
                            Accept: "application/json; charset=utf-8",
                            "Content-Type": "application/json; charset=utf-8",
                          },
                          body: JSON.stringify({
                            invoiceTitleDate: invoiceTitleDate,
                            group: group,
                            minDate: minDate,
                            maxDate: maxDate,
                          }),
                        }
                      );

                      const resObject = await response.json();
                      value.array[0] = {
                        invoiceTitleDate: invoiceTitleDate,
                        group: group,
                        minDate: minDate,
                        maxDate: maxDate,
                      };
                      // if response.status is not between 200 and 299, throw an error
                      if (!resObject.success) {
                        await Promise.all(
                          group.rapports.map(async (rapport) => {
                            await fetch(
                              `${remoteUrl}/api/rapports/${rapport.id}`,
                              {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  invoicedIn: `devInvoice`,
                                  invoiceJson: JSON.stringify(
                                    resObject.reqbody
                                  ),
                                }),
                              }
                            );
                          })
                        );
                        // open request modal to show request send to bexio
                        if (
                          bexioProfile === "default" ||
                          bexioProfile === "nop"
                        ) {
                          openRequestModel = true;
                        } else {
                          openRequestModel = false;
                        }
                        throw new Error(
                          `Error: Failed with status ${response.status}`
                        );
                      }

                      // const bexioInvoice = JSON.parse(resObject.data);
                      // // update the rapports with the invoice id
                      // await Promise.all(
                      //   group.rapports.map(async (rapport) => {
                      //     await fetch(
                      //       `${remoteUrl}/api/rapports/${rapport.id}`,
                      //       {
                      //         method: "PATCH",
                      //         headers: {
                      //           "Content-Type": "application/json",
                      //         },
                      //         body: JSON.stringify({
                      //           invoicedIn: `${bexioInvoice.document_nr} - ${bexioInvoice.id}`,
                      //         }),
                      //       }
                      //     );
                      //   })
                      // );

                      toast("Successfully Created Invoice");
                    } catch (e) {
                      console.log({ e });
                      err(new Error("Failed to create Invoice"));
                    }
                  });
                  // @ts-ignore

                  return invoices;
                } catch (e: any) {
                  // @ts-ignore
                  err(new Error("Failed to create Invoice"));
                }
              },
            },
          ],

          "field-properties": {
            "field-transformation": [
              {
                name: "trainingsdauer",
                transformation: formatDuration,
              },
            ],
            "boolean-fields": ["probetraining", "nachholtermin"],
            "hidden-fields": [
              "archived",
              "invoicedIn",
              "invoiceJson",
              "invoices",
            ],
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
            "relational-fields": [
              {
                name: "kundeIds",
                type: "FAVORITE",
                editable: true,
                columns: ["id", "name", "vorname", "geburtstag", "notizen"],
              },
              {
                name: "kundes",
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
            "textarea-fields": ["notizen"],
            " ": ["id DESC"],
          },
        },
        archiveTable: "ArchivedRapport",
      },
    });
  });
</script>

{#if showProgressBar}
  <Progressbar bind:completed={completedInvoices} bind:total={totalInvoices} />
{/if}

<div id="rapport" />
{#if openRequestModel}
  <div id="myModal" class="modal">
    <!-- Modal content -->
    <div class="modal-content">
      <div class="modal-header">
        <span class="close"
          ><button on:click={closeModal}
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
