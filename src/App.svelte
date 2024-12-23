<script lang="ts">
  import { Router, Route } from "svelte-navigator";
  import Header from "./components/shared/header/header.svelte";
  import Admin from "./routes/admin/index.svelte";
  import Gruppe from "./routes/admin/gruppe.svelte";
  import Kunde from "./routes/admin/kunde.svelte";
  import Platz from "./routes/admin/platz.svelte";
  import Rapport from "./routes/admin/rapport.svelte";
  import Trainer from "./routes/admin/trainer.svelte";
  import Invoice from "./routes/admin/invoice.svelte";
  import InvoicedRapport from "./routes/admin/invoiced-rapports.svelte";
  import Index from "./routes/index.svelte";
  import Auth from "./components/auth/auth.svelte";
  import Product from "./routes/admin/product.svelte";
  import KundeThrough from "./routes/admin/kunde-through.svelte";
  import ArchivedRapports from "./routes/admin/archived-rapports.svelte";
  import InvoiceConfig from "./routes/admin/invoice-config.svelte";

  // get authed from localstorage
  let authed: string | boolean | null = localStorage.getItem("auth");

  if (authed) {
    authed = true;
  }
</script>

<Router primary={false}>
  <Route path="/" component={Index} />

  <Route path="admin/*">
    {#if !authed}
      <Auth />
    {:else}
      <div class="flex">
        <div class="flex-shrink-0">
          <Header />
        </div>
        <div class="flex-1 p-4 md:p-6 pb-16">
          <Route path="">
            <Admin />
          </Route>
          <Route path="gruppe" component={Gruppe} />
          <Route path="kunde" component={Kunde} />
          <Route path="product" component={Product} />
          <Route path="platz" component={Platz} />
          <Route path="rapport" component={Rapport} />
          <Route path="trainer" component={Trainer} />
          <Route path="invoice" component={Invoice} />
          <Route path="invoiced-rapports" component={InvoicedRapport} />
          <Route path="kundeThrough" component={KundeThrough} />
          <Route path="archived-rapports" component={ArchivedRapports} />
          <Route path="invoice-config" component={InvoiceConfig} />
        </div>
      </div>
    {/if}
  </Route>
</Router>
