<script>
  import("App/Product").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("product"),
      props: {
        schema: {
          visibility: {
            readOnly: true,
            message: "Bitte Produkt-Daten in Bexio bearbeiten.",
          },
        },
      },
    });
  });
</script>

<div id="product" />
