// @ts-nocheck
// Uncomment these imports to begin using these cool features!

import { inject } from "@loopback/core";
import { repository } from "@loopback/repository";

import dayjs from "dayjs";

import {
  HttpErrors,
  post,
  get,
  Request,
  requestBody,
  RestBindings,
  param,
} from "@loopback/rest";

const https = require("https");

const bexioToken = process.env["BEXIO_TOKEN"] || "";
const bexioProfile = process.env["BEXIO_PROFILE"] || "default";
const bexioUrl = process.env["BEXIO_API_URL"] || "https://api.bexio.com/2.0";
const bexioSpec = {
  responses: {
    "200": {
      description: "bexio profile and api url",
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    },
  },
};
async function postRequest(url, data) {
  const dataString = JSON.stringify(data);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
      Authorization: `Bearer ${bexioToken}`,
    },
    timeout: 0, // in ms
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject({ statusCode: res.statusCode, message: "error" });
      }

      const body = [];
      res.on("data", (chunk) => body.push(chunk));
      res.on("end", () => {
        const resString = Buffer.concat(body).toString();
        resolve(resString);
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request time out"));
    });

    req.write(dataString);
    req.end();
  });
}

async function deleteRequest(url) {
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bexioToken}`,
    },
    timeout: 0, // in ms
  };
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject({ statusCode: res.statusCode, message: "error" });
      }

      const body = [];
      res.on("data", (chunk) => body.push(chunk));
      res.on("end", () => {
        const resString = Buffer.concat(body).toString();
        resolve(resString);
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request time out"));
    });

    req.write("");
    req.end();
  });
}

export class BexioController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @repository.getter("InvoiceGenerationConfigRepository")
    protected InvoiceGenerationConfig: () => Promise<any>,
    @repository.getter("RapportRepository")
    protected Rapport: () => Promise<any>,
    @repository.getter("ProductRepository")
    protected Product: () => Promise<any>
  ) { }

  // Map to `post /create-bexio-invoice`
  @post("/create-bexio-invoice")
  // @response(200, PING_RESPONSE)
  async createBexioInvoice(
    @requestBody() BexioBody: any,
    @param.header.string("content-type") contentType: string
  ): Promise<object> {
    console.log("Request called at:", new Date().toISOString());
    console.log("in request");
    console.log({ contentType });
    console.log({ BexioBody });

    type KundeType = {
      bexioId: string;
      geburtstag: string | null;
      id: number;
      land: string;
      mail: string;
      mail2: string;
      name: string;
      notizen: string;
      ort: string;
      phone: string;
      phone2: string;
      phoneMobile: string;
      plz: string;
      strasse: string;
      vorname: string;
    };

    type GruppeType = {
      id: number;
      gruppentyp: string;
      gruppenname: string;
    };
    type PlatzType = {
      id: number;
      tenniscourt: "Club" | "Normal" | "Mini-Court" | "Poly";
    };

    type TrainerType = {
      SummerRateBeforeId: number;
      aktiv: boolean;
      email: string;
      id: number;
      name: string;
      notizen: string;
      summerRateAfterId: number;
      clubRateId: number;
      token: string;
      vorname: string;
      winterRateAfterId: number;
      winterRateBeforeId: number;
      SummerRateAfter: {
        articlegroupid: string;
        bexioId: string;
        id: number;
        interncode: string;
        interndescription: string;
        internname: string;
        saleprice: number;
        taxid: string;
      };
      SummerRateBefore: {
        articlegroupid: string;
        bexioId: string;
        id: number;
        interncode: string;
        interndescription: string;
        internname: string;
        saleprice: number;
        taxid: string;
      };
      WinterRateAfter: {
        articlegroupid: string;
        bexioId: string;
        id: number;
        interncode: string;
        interndescription: string;
        internname: string;
        saleprice: number;
        taxid: string;
      };
      WinterRateBefore: {
        articlegroupid: string;
        bexioId: string;
        id: number;
        interncode: string;
        interndescription: string;
        internname: string;
        saleprice: number;
        taxid: string;
      };
      ClubRate: {
        articlegroupid: string;
        bexioId: string;
        id: number;
        interncode: string;
        interndescription: string;
        internname: string;
        saleprice: number;
        taxid: string;
      };
    };

    type RapportType = {
      archived: boolean;
      datum: string;
      gruppe: GruppeType;
      gruppeId: number;
      invoicedIn: string | null;
      kunde: KundeType;
      kundeId: number;
      nachholtermin: string | null;
      notizen: string;
      platz: PlatzType;
      platzId: number;
      probetraining: boolean;
      startzeit: string | Date;
      trainer: TrainerType;
      trainerId: number;
      trainingType: string;
      trainingsdauer: string;
    };

    const groupInvoicesByTrainer = (
      invoices: RapportType[]
    ): { [trainerName: string]: RapportType[] } => {
      // group the array of invoices by trainer and return it
      const groupedInvoices: { [trainerName: string]: RapportType[] } = {};

      for (const invoice of invoices) {
        const trainerName = invoice.trainer.name;
        if (groupedInvoices[trainerName]) {
          groupedInvoices[trainerName].push(invoice);
        } else {
          groupedInvoices[trainerName] = [invoice];
        }
      }
      return groupedInvoices;
    };

    const groupTrainerRapportsByTime = async (
      invoices: RapportType[]
    ): { [productType: string]: RapportType[] } => {
      const invoiceGenerationConfig = await this.InvoiceGenerationConfig();

      let season = (await invoiceGenerationConfig.findById(1)).configValue;
      let time = (await invoiceGenerationConfig.findById(2)).configValue || 17;

      console.log({ season });

      let isSummer = season === "summer" ? true : false;
      let DayEndHour = dayjs().hour(time).minute(0).second(0);

      let groupedInvoices: { [productType: string]: RapportType[] } = {
        SummerRateAfter: [],
        SummerRateBefore: [],
        WinterRateAfter: [],
        WinterRateBefore: [],
        ClubRate: [],
      };

      // Group rapports by training session to determine group size
      const rapportsBySession: { [key: string]: RapportType[] } = {};
      invoices.forEach(rapport => {
        const sessionKey = `${rapport.datum}-${rapport.startzeit}-${rapport.trainerId}`;
        if (!rapportsBySession[sessionKey]) {
          rapportsBySession[sessionKey] = [];
        }
        rapportsBySession[sessionKey].push(rapport);
      });

      invoices.map((rapport) => {
        // Handle special training types and group trainings
        if (rapport.trainingType === "gruppe" ||
          rapport.trainingType === "mannschaft" ||
          rapport.trainingType === "mannschaft_platz" ||
          rapport.trainingType === "aufschlag") {

          const sessionKey = `${rapport.datum}-${rapport.startzeit}-${rapport.trainerId}`;
          const groupSize = rapportsBySession[sessionKey].length;
          const isFixplatz = rapport.platzId === 2;

          // Get the appropriate product code
          const productCode = getGroupProductCode(rapport.trainingType, groupSize, rapport.kunde, isFixplatz, isSummer);

          // Add to a new group for this product code if it doesn't exist
          if (!groupedInvoices[productCode]) {
            groupedInvoices[productCode] = [];
          }
          groupedInvoices[productCode].push(rapport);
          return;
        }

        // Handle regular private lessons as before
        if (rapport.platzId === 2) {
          groupedInvoices.ClubRate.push(rapport);
          return;
        }

        // rapport.startzeit is in format 13:00:00
        let rapportTimeStart = dayjs()
          .hour(rapport.startzeit.split(":")[0])
          .minute(rapport.startzeit.split(":")[1])
          .second(rapport.startzeit.split(":")[2]);

        let rapportTimeEnd = dayjs()
          .hour(rapport.startzeit.split(":")[0])
          .minute(rapport.startzeit.split(":")[1])
          .second(rapport.startzeit.split(":")[2])
          .add(returnTrainingDurationInHours(rapport.trainingsdauer), "hour");

        console.log({ rapportTimeStart, rapportTimeEnd, rapport });

        // if rapportTimeStart is before time and rapportTimeEnd is after time then it is a split invoice
        if (
          rapportTimeStart.isBefore(DayEndHour, "minute") &&
          rapportTimeEnd.isAfter(DayEndHour, "minute")
        ) {
          // split the invoice into two
          let rapport1 = { ...rapport };
          let rapport2 = { ...rapport };

          let duration1 = Math.ceil(
            DayEndHour.diff(rapportTimeStart, "minute")
          );
          let duration2 = Math.ceil(rapportTimeEnd.diff(DayEndHour, "minute"));

          // approximate it to the nearest 30 minutes except if it is less than 45 minutes but more than 30 minutes then set it to 45 minutes
          if (duration1 < 45 && duration1 > 30) duration1 = 45;
          else {
            duration1 = Math.ceil(duration1 / 30) * 30;
          }
          if (duration2 < 45 && duration2 > 30) duration2 = 45;
          else {
            duration2 = Math.ceil(duration2 / 30) * 30;
          }

          console.log({ duration1, duration2 });

          duration1 = `${Math.floor(duration1 / 60)}:${duration1 % 60}`;
          duration2 = `${Math.floor(duration2 / 60)}:${duration2 % 60}`;

          console.log({
            duration1,
            duration2,
          });

          rapport1.trainingsdauer = duration1;
          rapport2.trainingsdauer = duration2;

          if (isSummer) {
            // if the rapports startzeit is before 17:00 then it is a SummerRateBefore
            groupedInvoices.SummerRateBefore.push(rapport1);
            groupedInvoices.SummerRateAfter.push(rapport2);
          } else {
            groupedInvoices.WinterRateBefore.push(rapport1);
            groupedInvoices.WinterRateAfter.push(rapport2);
          }
          return;
        }

        if (isSummer) {
          // if the rapports startzeit is before 17:00 then it is a SummerRateBefore
          if (rapportTimeStart.isBefore(DayEndHour, "hour")) {
            groupedInvoices.SummerRateBefore.push(rapport);
          } else {
            groupedInvoices.SummerRateAfter.push(rapport);
          }
        } else {
          if (rapportTimeStart.isBefore(DayEndHour, "hour")) {
            groupedInvoices.WinterRateBefore.push(rapport);
          } else {
            groupedInvoices.WinterRateAfter.push(rapport);
          }
        }
      });

      for (let key in groupedInvoices) {
        if (groupedInvoices[key].length === 0) {
          delete groupedInvoices[key];
        }
      }

      // if the productId is the same then merge one into the other
      if (
        groupedInvoices?.SummerRateBefore &&
        groupedInvoices?.SummerRateAfter &&
        groupedInvoices?.SummerRateBefore?.[0].trainer.SummerRateBefore.id ===
        groupedInvoices?.SummerRateAfter?.[0].trainer.SummerRateAfter.id
      ) {
        groupedInvoices.SummerRateBefore =
          groupedInvoices.SummerRateBefore?.concat(
            groupedInvoices.SummerRateAfter
          );
        delete groupedInvoices.SummerRateAfter;
      }

      if (
        groupedInvoices?.WinterRateBefore &&
        groupedInvoices?.WinterRateAfter &&
        groupedInvoices?.WinterRateBefore?.[0].trainer.WinterRateBefore.id ===
        groupedInvoices?.WinterRateAfter?.[0].trainer.WinterRateAfter.id
      ) {
        groupedInvoices.WinterRateBefore =
          groupedInvoices.WinterRateBefore?.concat(
            groupedInvoices.WinterRateAfter
          );
        delete groupedInvoices.WinterRateAfter;
      }

      console.log({ groupedInvoices });
      return groupedInvoices;
    };

    const updateRapportWithInvoiceId = async (rapportId, invoicedIn) => {
      const rapport = await this.Rapport();

      await rapport.updateById(rapportId, {
        invoicedIn,
      });
    };

    const returnTrainingDurationInHours = (duration) => {
      // the duration is in format 00:30:00 and we want to return 0.5
      let hours = duration.split(":")[0];
      let minutes = duration.split(":")[1];

      return parseInt(hours) + parseInt(minutes) / 60;
    };

    const isAdult = (kunde: KundeType) => {
      if (!kunde.geburtstag) return true;
      const age = dayjs().diff(dayjs(kunde.geburtstag), 'year');
      return age >= 18;
    };

    const getProductInfo = async (productCode: string) => {
      const Product = await this.Product();
      const product = await Product.findOne({
        where: {
          bexioId: productCode
        }
      });

      if (!product) {
        throw new Error(`Product with code ${productCode} not found`);
      }

      return product;
    };

    const getGroupProductCode = (trainingType: string, groupSize: number, kunde: KundeType, isFixplatz: boolean, isSummer: boolean) => {
      // Handle fixplatz case first
      if (isFixplatz) {
        switch (groupSize) {
          case 2: return "2060";
          case 3: return "2070";
          case 4: return "2080";
          default: return "2080"; // Default to group of 4 for larger groups
        }
      }


      if (trainingType === "mannschaft") {
        return "2090"; // Mannschaftstraining ohne Platzmiete
      }
      if (trainingType === "mannschaft_platz") {
        return "2095"; // Mannschaftstraining inkl. Platzmiete
      }
      if (trainingType === "aufschlag") {
        return groupSize >= 5 ? "4510" : "4500";
      }

      // Handle regular group trainings
      const isAdultParticipant = isAdult(kunde);

      if (isSummer) {
        if (isAdultParticipant) {
          switch (groupSize) {
            case 2: return "2520";
            case 3: return "2530";
            case 4: return "2540";
            default: return "2550"; // 5 or 6
          }
        } else {
          switch (groupSize) {
            case 2: return "3520";
            case 3: return "3530";
            case 4: return "3540";
            default: return "3540"; // Default to group of 4 for larger groups
          }
        }
      } else {
        if (isAdultParticipant) {
          switch (groupSize) {
            case 2: return "2020";
            case 3: return "2030";
            case 4: return "2040";
            default: return "2050"; // 5 or 6
          }
        } else {
          switch (groupSize) {
            case 2: return "3020";
            case 3: return "3030";
            case 4: return "3040";
            default: return "3040"; // Default to group of 4 for larger groups
          }
        }
      }
    };

    const formatDuration = (duration) => {
      console.log({ duration });
      let hours = duration.split(":")[0];
      let minutes = duration.split(":")[1];

      // change to minutes
      minutes = parseInt(hours) * 60 + parseInt(minutes);

      if (minutes < 45) {
        minutes = 30;
      } else if (minutes < 60) {
        minutes = 45;
      } else if (minutes < 75) {
        minutes = 60;
      } else if (minutes < 105) {
        minutes = 90;
      } else {
        minutes = 120;
      }
      return minutes + " min";
    };

    // Reply with a greeting, the current time, the url, and request headers
    const { invoiceTitleDate, group, minDate, maxDate } = BexioBody as {
      invoiceTitleDate: string;
      minDate: string;
      maxDate: string;
      group: {
        kunde: KundeType;
        rapports: RapportType[];
      };
    };

    // let rapportsGroupedByTrainer = groupInvoicesByTrainer(group.rapports);
    let childrenRapports = {};
    let parentRapports = [];

    for (let rapport of group.rapports) {
      if (rapport.kundeId === group.kunde.id) {
        parentRapports.push(rapport);
        continue;
      }

      if (childrenRapports[`${rapport.kunde.vorname} ${rapport.kunde.name}`]) {
        childrenRapports[`${rapport.kunde.vorname} ${rapport.kunde.name}`].push(
          rapport
        );
      } else {
        childrenRapports[`${rapport.kunde.vorname} ${rapport.kunde.name}`] = [
          rapport,
        ];
      }
    }

    let positions = [];

    if (parentRapports.length > 0) {
      let parentName = group.kunde.vorname + " " + group.kunde.name;
      positions.push({
        text: `${parentName} <br/> `,
        type: "KbPositionText",
      });
      let rapportsGroupedByTrainer = groupInvoicesByTrainer(parentRapports);

      for (let trainer in rapportsGroupedByTrainer) {
        let rapportsGroupedByTime = await groupTrainerRapportsByTime(
          rapportsGroupedByTrainer[trainer]
        );

        let trainerName = rapportsGroupedByTrainer[trainer][0].trainer.name;

        for (let productType in rapportsGroupedByTime) {
          let product;
          if (productType.match(/^\d{4}$/)) {
            // If productType is a 4-digit code, it's one of our special product codes
            product = await getProductInfo(productType);
          } else {
            // Otherwise use the existing trainer rate logic
            product = rapportsGroupedByTime[productType][0].trainer[productType];
          }

          let positionText = `${product.internname} <br/>`;

          let amount = 0;
          rapportsGroupedByTime[productType]
            .sort((a, b) => (dayjs(a.datum).isAfter(dayjs(b.datum)) ? 1 : -1))
            .forEach((rapport, i) => {
              if (i === rapportsGroupedByTime[productType].length - 1)
                positionText += `${dayjs(rapport.datum).format(
                  "DD.MM.YYYY"
                )} ${trainerName} ${formatDuration(rapport.trainingsdauer)}`;
              else
                positionText += `${dayjs(rapport.datum).format(
                  "DD.MM.YYYY"
                )} ${trainerName} ${formatDuration(
                  rapport.trainingsdauer
                )}<br/> `;

              amount += returnTrainingDurationInHours(rapport.trainingsdauer);
            });
          positions.push({
            amount: amount,
            tax_id: product.taxid,
            text: positionText,
            unit_price: product.saleprice,
            article_id: product.bexioId,
            type: "KbPositionArticle",
          });
        }
      }
    }

    for (let kundeName of Object.keys(childrenRapports)) {
      let rapports = childrenRapports[kundeName];

      positions.push({
        text: `${kundeName} <br/> `,
        type: "KbPositionText",
      });
      let rapportsGroupedByTrainer = groupInvoicesByTrainer(rapports);

      for (let trainer in rapportsGroupedByTrainer) {
        let rapportsGroupedByTime = await groupTrainerRapportsByTime(
          rapportsGroupedByTrainer[trainer]
        );

        let trainerName = rapportsGroupedByTrainer[trainer][0].trainer.name;

        for (let productType in rapportsGroupedByTime) {
          let product;
          if (productType.match(/^\d{4}$/)) {
            // If productType is a 4-digit code, it's one of our special product codes
            product = await getProductInfo(productType);
          } else {
            // Otherwise use the existing trainer rate logic
            product = rapportsGroupedByTime[productType][0].trainer[productType];
          }

          let positionText = `${product.internname} <br/>`;

          let amount = 0;
          rapportsGroupedByTime[productType]
            .sort((a, b) => (dayjs(a.datum).isAfter(dayjs(b.datum)) ? 1 : -1))
            .forEach((rapport, i) => {
              if (i === rapportsGroupedByTime[productType].length - 1)
                positionText += `${dayjs(rapport.datum).format(
                  "DD.MM.YYYY"
                )} ${trainerName} ${formatDuration(rapport.trainingsdauer)}`;
              else
                positionText += `${dayjs(rapport.datum).format(
                  "DD.MM.YYYY"
                )} ${trainerName} ${formatDuration(
                  rapport.trainingsdauer
                )}<br/> `;

              amount += returnTrainingDurationInHours(rapport.trainingsdauer);
            });
          positions.push({
            amount: amount,
            tax_id: product.taxid,
            text: positionText,
            unit_price: product.saleprice,
            article_id: product.bexioId,
            type: "KbPositionArticle",
          });
        }
      }
    }

    console.log({ positions });
    const reqBody = {
      // title: `${invoiceTitleDate}-${group.kunde.vorname} ${group.kunde.name}`,
      title: `${invoiceTitleDate}`,
      contact_id: bexioProfile === "nop" ? 2 : group.kunde.bexioId,
      user_id: bexioProfile === "nop" ? 1 : 9,
      bank_account_id: 7,
      header:
        "Sehr geehrte Damen und Herren<br /><br />Wir erlauben uns, Ihnen wie folgt in Rechnung zu stellen:",
      footer:
        "PRIVATLEKTIONEN:<br />Bei Verhinderung bitten wir um eine schriftliche Absage per Mail (keine SMS!) mindestens 24h im voraus an: school@jcscherrer.com. Wird dies nicht ber&uuml;cksichtigt, wird der gebuchte Tennisunterricht in Rechnung gestellt. <br /><br /><br />Freundliche Gr&uuml;sse",
      mwst_type: 2,
      mwst_is_net: true,
      show_position_taxes: false,
      is_valid_from: dayjs().format("YYYY-MM-DD"),
      is_valid_to: dayjs().endOf("month").format("YYYY-MM-DD"),
      positions,
    };
    console.log(JSON.stringify(reqBody, null, 2));

    const searchInvoice = async (title: string) => {
      try {
        const searchUrl = `${bexioUrl}/kb_invoice/search`;
        const searchBody = [
          {
            field: "title",
            value: title,
            criteria: "=",
          },
        ];
        let res = await postRequest(searchUrl, searchBody);
        res = JSON.parse(res);
        return res.length > 0 ? res[0] : null;
      } catch (e) {
        console.log("Error searching for invoice:", e);
        return null;
      }
    };

    try {
      let res = await postRequest(`${bexioUrl}/kb_invoice`, reqBody);
      res = JSON.parse(res);

      await Promise.all(
        group.rapports.map(async (rapport) => {
          await updateRapportWithInvoiceId(
            rapport.id,
            `${res.document_nr} - ${res.id}`
          );
        })
      );

      console.log({ res });
      return { success: true, data: res, reqbody: reqBody } as any;
    } catch (e) {
      if (e.statusCode === 429) {
        console.log("error is 429");
        const existingInvoice = await searchInvoice(reqBody.title);
        if (existingInvoice) {
          console.log("Invoice already exists:", existingInvoice);
          await Promise.all(
            group.rapports.map(async (rapport) => {
              await updateRapportWithInvoiceId(
                rapport.id,
                `${existingInvoice.document_nr} - ${existingInvoice.id}`
              );
            })
          );
          return { success: true, data: existingInvoice, reqbody: reqBody } as any;
        }

        // retry every 3 seconds until it works
        const intervalId = setInterval(async () => {
          try {
            console.log("trying one more time");

            let res = await postRequest(`${bexioUrl}/kb_invoice`, reqBody);

            res = JSON.parse(res);
            console.log({ res });
            clearInterval(intervalId);

            await Promise.all(
              group.rapports.map(async (rapport) => {
                await updateRapportWithInvoiceId(
                  rapport.id,
                  `${res.document_nr} - ${res.id}`
                );
              })
            );
            return { success: true, data: res, reqbody: reqBody } as any;
          } catch (e) {
            console.log("error is 429 in retry");
            if (e.statusCode !== 429) {
              console.log(JSON.stringify(e, null, 2));
              clearInterval(intervalId);
              return { success: false, error: e, reqbody: reqBody };
            }
          }
        }, 3000);
      } else {
        console.log(JSON.stringify(e, null, 2));
        return { success: false, error: e, reqbody: reqBody };
      }
    }
  }

  // Map to `post /delete-bexio-invoice`
  @post("/delete-bexio-invoice")
  // @response(200, PING_RESPONSE)
  async deleteBexioInvoice(@requestBody() BexioBody: any): Promise<object> {
    console.log("in request");
    console.log({ BexioBody });
    // Reply with a greeting, the current time, the url, and request headers
    const { invoiceId } = BexioBody;

    try {
      let res = await deleteRequest(`${bexioUrl}/kb_invoice/${invoiceId}`);
      console.log(res);
      return res;
    } catch (e) {
      if (e.statusCode === 429) {
        console.log("error is 429");
        // retry every 3 seconds until it works
        const intervalId = setInterval(async () => {
          try {
            console.log("trying one more time");

            let res = await deleteRequest(
              `${bexioUrl}/kb_invoice/${invoiceId}`
            );

            res = JSON.parse(res);
            console.log({ res });
            clearInterval(intervalId);

            return res;
          } catch (e) {
            console.log("error is 429 in retry");
            if (e.statusCode !== 429) {
              console.log(JSON.stringify(e, null, 2));
              clearInterval(intervalId);
              return { success: false, error: e };
            }
          }
        }, 3000);
      } else {
        console.log(JSON.stringify(e, null, 2));
        return { success: false, error: e };
      }
    }
  }

  @get("/bexio-info", bexioSpec)
  async getBexioInfo(): Promise<object> {
    try {
      const bexioProfile = process.env["BEXIO_PROFILE"] || "default";
      const bexioApiUrl = process.env["BEXIO_API_URL"] || "default";
      return {
        bexioProfile,
        bexioApiUrl,
      };
    } catch (e) {
      console.log(e);
      throw new HttpErrors[e.statusCode]("");
    }
  }
}
