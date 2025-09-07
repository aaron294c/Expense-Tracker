<html><head>
<meta charset="utf-8"/>
<meta charset="utf-8"/>
<link crossorigin="" href="https://fonts.gstatic.com/" rel="preconnect"/>
<link as="style" href="https://fonts.googleapis.com/css2?display=swap&amp;family=SF+Pro+Display:wght@400;500;700;900&amp;family=SF+Pro+Text:wght@400;500;600;700" onload="this.rel='stylesheet'" rel="stylesheet"/>
<title>Stitch Design</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<style type="text/tailwindcss">
    :root {
      --chart-color-1: #007AFF;
      --chart-color-2: #34C759;
      --chart-color-3: #FF9500;
      --chart-color-4: #AF52DE;
      --chart-color-5: #FF453A;
    }
    body {
      background-color: #FFFFFF;
      font-family: 'SF Pro Display', 'SF Pro Text', sans-serif;
    }
    .clean-shadow {
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
    }
    @keyframes donut-chart-animation {
      from {
        stroke-dashoffset: 251.2;
      }
    }
    .animate-donut-chart {
      animation: donut-chart-animation 1.5s ease-out forwards;
    }
  </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }
  </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-white">
<div class="relative flex size-full min-h-screen flex-col justify-between group/design-root">
<div class="flex-grow">
<header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
<div class="flex items-center p-4 pb-2 justify-between">
<button class="text-gray-800 flex size-10 shrink-0 items-center justify-center rounded-full">
<span class="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
</button>
<h1 class="text-gray-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Insights</h1>
</div>
<div class="flex px-4 py-3">
<div class="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-100 p-1">
<label class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-3 has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-black text-gray-500 text-sm font-semibold">
<span class="truncate">You</span>
<input class="invisible w-0" name="account-type" type="radio" value="You"/>
</label>
<label class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-3 has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-black text-gray-500 text-sm font-semibold">
<span class="truncate">Household</span>
<input checked="" class="invisible w-0" name="account-type" type="radio" value="Household"/>
</label>
</div>
</div>
</header>
<main class="px-4 pb-4">
<section class="mb-6">
<h2 class="text-black text-[22px] font-bold tracking-[-0.4px] px-2 pb-3">Category Breakdown</h2>
<div class="rounded-[20px] bg-white clean-shadow">
<div class="relative h-56 flex items-center justify-center p-6 z-1 overflow-hidden">
<svg class="absolute size-full" viewBox="0 0 100 100">
<circle class="stroke-gray-100" cx="50" cy="50" fill="none" r="40" stroke-width="10"></circle>
<circle class="animate-donut-chart origin-center -rotate-90 stroke-[var(--chart-color-1)] cursor-pointer hover:stroke-[var(--chart-color-1)] hover:opacity-80 transition-opacity" cx="50" cy="50" fill="none" r="40" stroke-dasharray="251.2" stroke-dashoffset="175.84" stroke-width="10" style="stroke-dashoffset: 175.84;"></circle>
<circle class="animate-donut-chart origin-center -rotate-90 stroke-[var(--chart-color-2)] cursor-pointer hover:stroke-[var(--chart-color-2)] hover:opacity-80 transition-opacity" cx="50" cy="50" fill="none" r="40" stroke-dasharray="251.2" stroke-dashoffset="113.04" stroke-width="10" style="transition-delay: 100ms; stroke-dashoffset: 113.04;"></circle>
<circle class="animate-donut-chart origin-center -rotate-90 stroke-[var(--chart-color-3)] cursor-pointer hover:stroke-[var(--chart-color-3)] hover:opacity-80 transition-opacity" cx="50" cy="50" fill="none" r="40" stroke-dasharray="251.2" stroke-dashoffset="75.36" stroke-width="10" style="transition-delay: 200ms; stroke-dashoffset: 75.36;"></circle>
<circle class="animate-donut-chart origin-center -rotate-90 stroke-[var(--chart-color-4)] cursor-pointer hover:stroke-[var(--chart-color-4)] hover:opacity-80 transition-opacity" cx="50" cy="50" fill="none" r="40" stroke-dasharray="251.2" stroke-dashoffset="37.68" stroke-width="10" style="transition-delay: 300ms; stroke-dashoffset: 37.68;"></circle>
<circle class="animate-donut-chart origin-center -rotate-90 stroke-[var(--chart-color-5)] cursor-pointer hover:stroke-[var(--chart-color-5)] hover:opacity-80 transition-opacity" cx="50" cy="50" fill="none" r="40" stroke-dasharray="251.2" stroke-dashoffset="0" stroke-width="10" style="transition-delay: 400ms; stroke-dashoffset: 0;"></circle>
</svg>
<div class="text-center">
<p class="text-black tracking-tight text-[36px] font-bold truncate">$2,450.00</p>
<p class="text-gray-500 text-sm font-medium">This Month vs Last Month</p>
<div class="flex gap-1 items-center justify-center text-red-500 text-sm font-medium">
<span class="material-symbols-outlined text-base">arrow_upward</span>
<span>5.2% vs last month</span>
</div>
</div>
</div>
<div class="relative z-10 p-6 pt-0 mt-6 space-y-5">
<a class="flex items-center gap-4 cursor-pointer group p-2 -m-2 rounded-lg" href="#">
<div class="flex size-10 items-center justify-center rounded-full shrink-0" style="background-color: #EBF5FF; color: #007AFF;">
<span class="material-symbols-outlined text-xl">shopping_bag</span>
</div>
<div class="flex-1 overflow-hidden">
<div class="flex justify-between items-center mb-1">
<p class="text-black font-semibold">Groceries</p>
<div class="flex items-center gap-2">
<p class="text-sm text-green-600 font-medium">30%</p>
<span class="material-symbols-outlined text-base text-green-500">trending_up</span>
<p class="text-black font-semibold">$750</p>
</div>
</div>
<div class="h-2 rounded-full bg-gray-200 w-full overflow-hidden">
<div class="h-full rounded-full bg-[var(--chart-color-1)]" style="width: 83.33%; max-width: 100%;"></div>
</div>
<div class="flex justify-between items-center mt-1">
<p class="text-xs text-gray-500">$750 / $900</p>
</div>
</div>
</a>
<a class="flex items-center gap-4 cursor-pointer group p-2 -m-2 rounded-lg" href="#">
<div class="flex size-10 items-center justify-center rounded-full shrink-0" style="background-color: #E5F8E9; color: #34C759;">
<span class="material-symbols-outlined text-xl">restaurant</span>
</div>
<div class="flex-1 overflow-hidden">
<div class="flex justify-between items-center mb-1">
<p class="text-black font-semibold">Dining Out</p>
<div class="flex items-center gap-2">
<p class="text-sm text-red-600 font-medium">20%</p>
<span class="material-symbols-outlined text-base text-red-500">trending_down</span>
<p class="text-black font-semibold">$500</p>
</div>
</div>
<div class="h-2 rounded-full bg-gray-200 w-full overflow-hidden">
<div class="h-full rounded-full bg-[var(--chart-color-2)]" style="width: 125%; max-width: 100%;"></div>
</div>
<div class="flex justify-between items-center mt-1">
<p class="text-xs text-red-500">$500 / $400 (Over by $100)</p>
</div>
</div>
</a>
<a class="flex items-center gap-4 cursor-pointer group p-2 -m-2 rounded-lg" href="#">
<div class="flex size-10 items-center justify-center rounded-full shrink-0" style="background-color: #FFF8E6; color: #FF9500;">
<span class="material-symbols-outlined text-xl">directions_car</span>
</div>
<div class="flex-1 overflow-hidden">
<div class="flex justify-between items-center mb-1">
<p class="text-black font-semibold">Transport</p>
<div class="flex items-center gap-2">
<p class="text-sm text-gray-600 font-medium">15%</p>
<span class="material-symbols-outlined text-base text-gray-500">trending_flat</span>
<p class="text-black font-semibold">$350</p>
</div>
</div>
<div class="h-2 rounded-full bg-gray-200 w-full overflow-hidden">
<div class="h-full rounded-full bg-[var(--chart-color-3)]" style="width: 70%; max-width: 100%;"></div>
</div>
<div class="flex justify-between items-center mt-1">
<p class="text-xs text-gray-500">$350 / $500</p>
</div>
</div>
</a>
</div>
</div>
</section>
<section class="mb-8" style="margin-bottom: 32px;">
<h2 class="text-black text-[22px] font-bold tracking-[-0.4px] px-2 pb-3">Quick Insights</h2>
<div class="space-y-4">
<div class="rounded-[20px] bg-white p-6 clean-shadow" style="padding: 24px;">
<div class="flex items-start gap-4">
<div class="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 shrink-0">
<span class="material-symbols-outlined text-xl">speed</span>
</div>
<div>
<p class="font-semibold text-black">Spending Velocity</p>
<p class="text-sm text-gray-500">You're spending 15% faster this month. Be mindful of your 'Dining Out' category.</p>
</div>
</div>
</div>
<div class="rounded-[20px] bg-white p-6 clean-shadow" style="padding: 24px;">
<div class="flex items-start gap-4">
<div class="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-500 shrink-0">
<span class="material-symbols-outlined text-xl">lightbulb</span>
</div>
<div>
<p class="font-semibold text-black">Smart Suggestion</p>
<p class="text-sm text-gray-500">You've saved $150 on groceries. Consider moving that to your savings goal!</p>
</div>
</div>
</div>
</div>
</section>
<section>
<h2 class="text-black text-[22px] font-bold tracking-[-0.4px] px-2 pb-3">Achievements</h2>
<div class="grid grid-cols-3 gap-4">
<div class="flex flex-col items-center text-center p-3 rounded-[20px] bg-white clean-shadow transform transition-transform hover:scale-105">
<div class="relative mb-2">
<img class="h-10 w-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBabZ7OmFg_Q1oBOGj1w3UHbQFNkaSCt5a5v4xxbH-OwiYKFe0oCqGH4kdbWc9OCbcDnUXIta0Tt-XULUJo25vqIuO3u70lxyLgNLyu69rIoZ6DB9dsF4krLR_OCWZO33cY1QNrwmzhyuK4aOt7xNMGmwnJlH1HTGpnM69gcNCzjl_-STGkrpgmqg-OE4F25J0z3sOwMktZgnjdq72BgtAvmlwTGekmD9EO73YZSo9gHMUfH1o65CNMrBj2fWtAIoGVQhuWpw0sLe0"/>
</div>
<p class="font-bold text-sm text-black leading-tight">Budget Master</p>
<p class="text-xs text-gray-500 mt-1">3 months in a row!</p>
</div>
<div class="flex flex-col items-center text-center p-3 rounded-[20px] bg-white clean-shadow">
<div class="relative mb-2 size-10">
<svg class="absolute size-full" viewBox="0 0 36 36">
<circle class="stroke-gray-200" cx="18" cy="18" fill="none" r="16" stroke-width="3.5"></circle>
<circle class="origin-center -rotate-90 stroke-current text-blue-500" cx="18" cy="18" fill="none" r="16" stroke-dasharray="100" stroke-dashoffset="25" stroke-width="3.5" style="transition: stroke-dashoffset 0.5s ease-in-out;"></circle>
</svg>
<span class="material-symbols-outlined text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">savings</span>
</div>
<p class="font-bold text-sm text-black leading-tight">Saving Streak</p>
<p class="text-xs text-gray-500 mt-1">Save $500 to unlock</p>
<div class="w-full bg-gray-200 rounded-full h-1 mt-2 overflow-hidden">
<div class="bg-blue-500 h-1 rounded-full" style="width: 75%; max-width: 100%;"></div>
</div>
</div>
<div class="flex flex-col items-center text-center p-3 rounded-[20px] bg-gray-100">
<div class="relative mb-2">
<span class="material-symbols-outlined text-4xl text-gray-400">lock</span>
</div>
<p class="font-bold text-sm text-gray-500 leading-tight">Investor</p>
<p class="text-xs text-gray-500 mt-1">Make 5 investments.</p>
</div>
</div>
</section>
</main>
</div>
<footer class="sticky bottom-0 bg-white/95 backdrop-blur-md safe-area-bottom">
<div class="relative border-t border-gray-200/80">
<nav class="flex justify-around items-center h-16 px-4">
<a class="flex flex-col items-center justify-center gap-1 text-gray-500 w-16 h-16" href="#">
<span class="material-symbols-outlined text-2xl">home</span>
<p class="text-xs font-medium">Home</p>
</a>
<a class="flex flex-col items-center justify-center gap-1 text-blue-600 w-16 h-16" href="#">
<span class="material-symbols-outlined text-2xl">bar_chart</span>
<p class="text-xs font-bold">Insights</p>
</a>
<div class="w-16 h-16 flex items-center justify-center">
<a class="flex items-center justify-center size-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200" href="#">
<span class="material-symbols-outlined text-3xl">add</span>
</a>
</div>
<a class="flex flex-col items-center justify-center gap-1 text-gray-500 w-16 h-16" href="#">
<span class="material-symbols-outlined text-2xl">credit_card</span>
<p class="text-xs font-medium">Accounts</p>
</a>
<a class="flex flex-col items-center justify-center gap-1 text-gray-500 w-16 h-16" href="#">
<span class="material-symbols-outlined text-2xl">settings</span>
<p class="text-xs font-medium">Settings</p>
</a>
</nav>
</div>
</footer>
</div>
</body></html>