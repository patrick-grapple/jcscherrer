<script lang="ts">
  let seasonConf: HTMLDivElement;
  let timeConf: HTMLDivElement;
  let disable_historyConfig: HTMLDivElement;
  import("App/InvoiceGenerationConfig/updateById").then((m) => {
    let module = m.default;
    new module({
      target: seasonConf,
      layout: "auto",
      props: {
        layout: "auto",
        id: "1",
        css: 'input[inputlabel~="configInformation"] { min-width: 500px; }',
        schema: {
          actions: {
            edit: {
              removable: false,
            },
          },
          "field-properties": {
            ["hidden-fields"]: ["id", "configName"],
            "dropdown-fields": [
              {
                name: "configValue",
                options: [
                  {
                    label: "Summer",
                    value: "summer",
                  },
                  {
                    label: "Winter",
                    value: "winter",
                  },
                ],
              },
            ],
          },
        },
      },
    });
  });

  import("App/InvoiceGenerationConfig/updateById").then((m) => {
    let module = m.default;
    new module({
      target: timeConf,
      layout: "auto",
      props: {
        layout: "auto",
        id: "2",
        css: 'input[inputlabel~="configInformation"] { min-width: 500px; }',
        schema: {
          actions: {
            edit: {
              removable: false,
            },
          },
          "field-properties": {
            ["hidden-fields"]: ["id", "configName"],
          },
        },
      },
    });
  });

  import("App/InvoiceGenerationConfig/updateById").then((m) => {
    let module = m.default;
    new module({
      target: disable_historyConfig,
      layout: "auto",
      props: {
        layout: "auto",
        id: "3",
        css: 'input[inputlabel~="configInformation"] { min-width: 500px; }',
        schema: {
          actions: {
            edit: {
              removable: false,
            },
          },
          "field-properties": {
            ["hidden-fields"]: ["id", "configName"],
            "boolean-fields": ["configValue"],
          },
        },
      },
    });
  });
</script>

<div class="flex w-full h-full justify-center">
  <div class="flex flex-col p-4 gap-4 w-1/2">
    <h1 class="text-3xl">Season</h1>
    <div bind:this={seasonConf} />
    <h1 class="text-3xl">Time</h1>
    <div bind:this={timeConf} />
    <h1 class="text-3xl">Lock history</h1>
    <div bind:this={disable_historyConfig} />
  </div>
</div>
