<script>
  import("App/Trainer").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("trainer"),
      props: {
        dateFormat: "DD.MM.YYYY - HH:mm",
        translation: {
          token: "Unique URL",
        },
        defaultFilter: {
          and: [
            {
              aktiv: {
                eq: 1,
              },
            },
          ],
        },
        schema: {
          "field-properties": {
            "boolean-fields": ["aktiv"],
            "color-fields": [
              {
                field: "color",
                showOn: "background",
              },
              {
                field: "colorFont",
                showOn: "font",
              },
            ],
            "default-values": [
              {
                name: "aktiv",
                value: 1,
              },
            ],
            "auto-generated-fields": ["token"],
            "field-transformation": [
              // transform token to current url as a query
              {
                name: "token",
                transformation: (value) => {
                  return window.location.origin + "?token=" + value;
                },
              },
            ],
          },
        },
      },
    });
  });
</script>

<div id="trainer" />
