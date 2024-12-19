<script>
  import("App/Platz").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("platz"),
      props: {
        dateFormat: "DD.MM.YYYY - HH:mm",
      },
    });
  });
</script>

<div id="platz" />
