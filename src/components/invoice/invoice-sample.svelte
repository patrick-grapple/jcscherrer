<script>
  import Logo from "../../assets/images/logo.png";
  import dayjs from "dayjs";
  const remoteUrl = process.env["SVELTE_APP_REMOTE_URL"];

  export let info;

  let previewPositions = [];

  const groupTrainerRapportsByTime = async (invoices) => {
    // fetch "/invoice-generation-configs"

    let seasonResponse = await fetch(
      `${remoteUrl}/api/invoice-generation-configs/1`
    );
    let season = (await seasonResponse.json()).configValue;

    let timeResponse = await fetch(
      `${remoteUrl}/api/invoice-generation-configs/2`
    );
    let time = (await timeResponse.json()).configValue || 17;

    console.log({ season, time });

    let isSummer = season === "summer" ? true : false;
    let DayEndHour = dayjs().hour(time).minute(0).second(0);

    let groupedInvoices = {
      SummerRateAfter: [],
      SummerRateBefore: [],
      WinterRateAfter: [],
      WinterRateBefore: [],
      ClubRate: [],
    };

    invoices.map((rapport) => {
      // if the platz is club(id=2) then the price should be clubRate.
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

      // if rapportTimeStart is before time and rapportTimeEnd is after time then it is a split invoice
      if (
        rapportTimeStart.isBefore(DayEndHour, "minute") &&
        rapportTimeEnd.isAfter(DayEndHour, "minute")
      ) {
        // split the invoice into two
        let rapport1 = { ...rapport };
        let rapport2 = { ...rapport };

        let duration1 = Math.ceil(DayEndHour.diff(rapportTimeStart, "minute"));
        let duration2 = Math.ceil(rapportTimeEnd.diff(DayEndHour, "minute"));

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
          console.log({ rapport1, rapport2 });
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
  const groupInvoicesByTrainer = (invoices) => {
    // group the array of invoices by trainer and return it
    const groupedInvoices = {};

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

  const returnTrainingDurationInHours = (duration) => {
    // the duration is in format 00:30:00 and we want to return 0.5
    let hours = duration.split(":")[0];
    let minutes = duration.split(":")[1];

    return parseInt(hours) + parseInt(minutes) / 60;
  };

  const formatDuration = (duration) => {
    let hours = duration.split(":")[0];
    let minutes = duration.split(":")[1];

    return `${parseInt(hours)}h ${parseInt(minutes)}min`;
  };

  const getListOfPositions = async (group) => {
    let childrenRapports = {};
    let parentRapports = [];

    for (let rapport of group.rapports) {
      if (rapport.kundeId === group.kunde.id) {
        parentRapports.push(rapport);
        continue;
      }

      if (childrenRapports[`${rapport.kunde.name} ${rapport.kunde.vorname}`]) {
        childrenRapports[`${rapport.kunde.name} ${rapport.kunde.vorname}`].push(
          rapport
        );
      } else {
        childrenRapports[`${rapport.kunde.name} ${rapport.kunde.vorname}`] = [
          rapport,
        ];
      }
    }

    let positions = [];

    if (parentRapports.length > 0) {
      let parentName = group.kunde.name + " " + group.kunde.vorname;
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
          let product =
            rapportsGroupedByTime[productType][0].trainer[productType];

          let positionText = `${product.internname} <br/>`;

          let amount = 0;
          rapportsGroupedByTime[productType].forEach((rapport, i) => {
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
            article_id: 1,
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
          let product =
            rapportsGroupedByTime[productType][0].trainer[productType];

          let positionText = `${product.internname} <br/>`;

          let amount = 0;
          rapportsGroupedByTime[productType].forEach((rapport, i) => {
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
            article_id: 1,
            type: "KbPositionArticle",
          });
        }
      }
    }

    console.log({ positions });

    return positions;
  };

  $: {
    if (info) {
      getListOfPositions(info.group).then((positions) => {
        console.log({ positions });
        previewPositions = positions;
      });
    }
  }

  $: {
    console.log({ previewPositions });
  }

  $: console.log({ info });

  $: user = info?.group?.kunde;
</script>

{#if info}
  <div class="flex flex-col h-full p-12 pt-0 gap-8">
    <div class="self-end">
      <div class="flex items-center flex-shrink-0 space-y-5">
        <img class="h-20 w-auto" src={Logo} alt="JCS" />
      </div>
      <div class="text-right text-gray-500 font-sans">
        Tennis-Academy JC Scherrer GmbH <br />Leuholz 2 <br />8855 Wangen SZ
        <br />Switzerland <br />T +4155 440 83 85<br /> school@jcscherrer.com
      </div>
    </div>

    <div>
      {user?.vorname}
      {user?.name}
      <br />
      {user?.strasse}
      <br />
      {user?.plz}
      {user?.ort}
      <br />
      {user?.land}
    </div>

    <div class="flex flex-col gap-2">
      <div>invoice: RE-06---</div>
      <div class="border-b border-black" />
      <div>Title</div>
      <div class="border-b border-black" />
      <div class="flex justify-between pl-0">
        <div class="p-2 flex flex-col pl-0">
          <div class="min-w-max">Datum: <br /> &nbsp</div>
          <div class="min-w-max">Zahlbar bis:</div>
        </div>
        <div class="p-2 flex flex-col pl-0">
          <div class="min-w-max">{info.minDate} <br /> &nbsp</div>
          <div class="min-w-max">{info.maxDate}</div>
        </div>
        <div class="p-2 flex flex-col pl-0">
          <div class="min-w-max">Ihr Ansprechpartner: <br /> &nbsp</div>
          <div class="min-w-max">Kundennummer:</div>
        </div>
        <div class="p-2 flex flex-col pl-0">
          <div class="min-w-max">JC-Scherrer GmbH Tennis <br />- Academy</div>
          <div class="min-w-max">000445</div>
        </div>
      </div>
      <div class="border-b border-black" />
    </div>

    <div class="flex flex-col gap-2">
      <div>Sehr geehrte Damen und Herren</div>

      <div>Wir erlauben uns, Ihnen wie folgt in Rechnung zu stellen:</div>
    </div>
    <div>
      <table class="table-auto border-spacing-4">
        <thead class="text-left border-b-2">
          <tr class="py-4">
            <th class="border-b border-slate-600 w-1/12">Pos.</th>
            <th class="border-b border-slate-600 w-1/2">Beschreibung</th>
            <th class="border-b border-slate-600">Menge</th>
            <th class="border-b border-slate-600">Einzelpreis</th>
            <th class="border-b border-slate-600">Preis in CHF</th>
          </tr>
        </thead>
        <tbody>
          {#each previewPositions as position, i}
            {#if position.type == "KbPositionText"}
              <tr class="border-b border-slate-600">
                <td class="py-4" colspan="3">
                  {position.text.replace("<br/>", "")}
                </td>
              </tr>
            {:else if position.type == "KbPositionArticle"}
              <tr class="border-b border-slate-600">
                <td
                  >{previewPositions
                    .filter((position) => position.type === "KbPositionArticle")
                    .indexOf(position) + 1}</td
                >
                <td class="py-4">
                  {@html position.text}
                </td>
                <td class="py-4">{position.amount}</td>
                <td class="py-4">{position.unit_price}</td>
                <td class="py-4">{position.amount * position.unit_price}</td>
              </tr>
            {/if}
          {/each}

          <tr class=" border-b border-slate-600">
            <td />
            <td class="py-4">Betrag (von Steuer befreit)</td>
            <td />
            <td />
            <td class="py-4">
              {previewPositions.reduce(
                (acc, curr) =>
                  curr.type === "KbPositionArticle"
                    ? acc + curr.amount * curr.unit_price
                    : acc,
                0
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div>PRIVATLEKTIONEN:</div>
      <div class="text-sm">
        Bei Verhinderung bitten wir um eine schriftliche Absage per Mail (keine
        SMS!) mindestens 24h im voraus an: school@jcscherrer.com. Wird dies
        nicht berücksichtigt, wird der gebuchte Tennisunterricht in Rechnung
        gestellt.
      </div>
    </div>
    <div>Freundliche Grüsse</div>
  </div>
{/if}
