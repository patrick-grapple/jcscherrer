<script>
  export let total = 100;
  export let completed = 0;

  $: percentage = (completed / total) * 100;
</script>

<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
  <div
    class="bg-primary text-xs font-medium text-blue-100 text-center p-0.3 leading-none rounded-full transition-all duration-300 ease-in-out"
    style="width: {percentage}%;"
  >
    {percentage.toFixed()}%
  </div>
</div>
