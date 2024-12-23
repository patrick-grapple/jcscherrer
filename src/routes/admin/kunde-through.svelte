<script>
  import("App/KundeThrough").then((m) => {
    let module = m.default;

    new module({
      target: document.getElementById("kundeThrough"),
      props: {
        schema: {
          visibility: {
            readOnly: true,
          },
        },
      },
    });
  });
</script>

<div id="kundeThrough" />
