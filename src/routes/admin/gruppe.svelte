<script>
  import("App/Gruppe").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("gruppe"),
      props: {
        dateFormat: "DD.MM.YYYY - HH:mm",
      },
    });
    console.log(m);
  });
</script>

<div id="gruppe" />
