<script>
  import("App/Kunde").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("kunde"),
      props: {
        dateFormat: "DD.MM.YYYY - HH:mm",
        filter: {
          order: ["name ASC", "vorname ASC", "ort ASC"],
          limit: 50,
        },
        schema: {
          visibility: {
            readOnly: true,
            message: "Bitte Kunden-Daten in Bexio bearbeiten.",
          },
        },
      },
    });
  });
</script>

<div id="kunde" />
