<script>
  import Grid from "../../../assets/icons/grid.svg.svelte";
  import MapPin from "../../../assets/icons/map-pin.svg.svelte";
  import PersonBadge from "../../../assets/icons/person-badge.svg.svelte";
  import Receipt from "../../../assets/icons/receipt.svg.svelte";
  import User from "../../../assets/icons/user.svg.svelte";
  import Users from "../../../assets/icons/users.svg.svelte";
  import { Link, useLocation } from "svelte-navigator";
  import Repeat from "../../../assets/icons/repeat.svg.svelte";
  import CheckSquare from "../../../assets/icons/check-square.svg.svelte";

  import Logo from "../../../assets/images/logo.png";
  import SmallLogo from "../../../assets/images/jcs-logo.png";
  import Box from "../../../assets/icons/box.svg.svelte";
  import Octagon from "../../../assets/icons/octagon.svg.svelte";
  import Archived from "../../../assets/icons/archived.svelte";
  import Gear from "../../../assets/icons/gear.svelte";
  const location = useLocation();
</script>

<div
  class="nav-container max-w-xs min-h-screen h-screen flex flex-col flex-grow border-r border-gray-200 sm:pt-5 sm:pb-4 bg-white overflow-auto"
>
  <div class="flex items-center flex-shrink-0 px-4 space-y-5">
    <Link to="/admin" title="Admin">
      <img class="h-10 w-auto hide-header-logo" src={Logo} alt="JCS" />
      <img class="h-6 sm:h-10 w-auto lg:hidden" src={SmallLogo} alt="JCS" />
    </Link>
  </div>
  <div class=" sm:mt-5 flex-grow flex flex-col">
    <nav class="nav-items flex-1 bg-white sm:space-y-3" aria-label="Sidebar">
      <Link
        title="Trainings"
        class="{$location.pathname === '/admin'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
        to=""
      >
        <Repeat class=" text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">Trainings</span>
      </Link>
      <Link
        title="Gruppe"
        class="{$location.pathname === '/admin/gruppe'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
        to="gruppe"
      >
        <Users class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">Gruppe</span>
      </Link>

      <Link
        title="Kunde"
        to="kunde"
        class="{$location.pathname === '/admin/kunde'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <User class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">Kunde</span>
      </Link>

      <Link
        title="Product"
        to="product"
        class="{$location.pathname === '/admin/product'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <Box class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">Product</span>
      </Link>

      <Link
        title="Platz"
        to="platz"
        class="{$location.pathname === '/admin/platz'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <MapPin class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">Platz</span>
      </Link>

      <Link
        title="Rapport"
        to="rapport"
        class="{$location.pathname === '/admin/rapport'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <Grid class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">Rapport</span>
      </Link>

      <Link
        title="Trainer"
        to="trainer"
        class="{$location.pathname === '/admin/trainer'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <PersonBadge class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6 " />
        <span class="hidden hide-nav-item">Trainer</span>
      </Link>
      <Link
        title="Invoice"
        to="invoice"
        class="{$location.pathname === '/admin/invoice'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <Receipt class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6 " />
        <span class="hidden hide-nav-item">Create Invoices</span>
      </Link>
      <Link
        title="Invoiced-rapports"
        to="invoiced-rapports"
        class="{$location.pathname === '/admin/invoiced-rapports'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <CheckSquare class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6 " />
        <span class="hidden hide-nav-item">Invoiced Rapports</span>
      </Link>

      <Link
        title="Archived-rapports"
        to="archived-rapports"
        class="{$location.pathname === '/admin/archived-rapports'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <Archived class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6 " />
        <span class="hidden hide-nav-item">Archived Rapports</span>
      </Link>

      <Link
        title="invoice-config"
        to="invoice-config"
        class="{$location.pathname === '/admin/invoice-config'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <Gear class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6 " />
        <span class="hidden hide-nav-item"
          >Invoice Generation Configuration</span
        >
      </Link>

      <!-- kundetrough currently disabled -->
      <!-- <Link
        title="KundeThrough"
        to="kundeThrough"
        class="{$location.pathname === '/admin/kundeThrough'
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}  group flex justify-center lg:!justify-start items-center px-3 py-2 text-sm font-medium border-t-4 sm:border-l-4 sm:border-t-0 flex-1"
      >
        <Octagon class="text-primary-500 lg:mr-3 flex-shrink-0 h-6 w-6" />
        <span class="hidden hide-nav-item">KundeThrough</span>
      </Link> -->
    </nav>
  </div>
</div>

<style lang="postcss">
  .hide-header-logo {
    display: none;
  }

  @media (max-width: 640px) {
    .nav-container {
      position: fixed;
      bottom: 0;
      flex-direction: row;
      z-index: 999;

      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.85);

      max-width: 100%;
      width: 100%;
      margin: 0 auto;
      min-height: 50px;
      height: 50px;
    }
    .nav-items {
      flex-direction: row;
      display: flex;
      flex: 1 1 0%;
      margin-top: 0;
    }
  }

  @media (min-width: 1024px) {
    .hide-header-logo {
      display: block;
    }
    .hide-nav-item {
      display: block;
    }
  }
</style>
