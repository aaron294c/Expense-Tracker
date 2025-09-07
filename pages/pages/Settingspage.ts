<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<title>Stitch Design</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
      :root {
        --primary-color: #067bf9;
      }
      body {
        font-family: "SF Pro Display", sans-serif;
      }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-white">
<div class="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden">
<div class="flex flex-col">
<header class="sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
<div class="flex items-center p-4">
<h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900 flex-1">Settings</h1>
</div>
</header>
<main class="flex-1 overflow-y-auto px-4 py-6 space-y-8">
<section>
<h2 class="text-lg font-semibold text-gray-500 mb-2 px-4">Preferences</h2>
<div class="bg-white rounded-xl shadow-sm">
<a class="flex items-center justify-between p-4 border-b border-gray-100" href="#">
<p class="text-gray-900">Currency</p>
<div class="flex items-center space-x-2">
<span class="text-gray-500">USD</span>
<span class="material-symbols-outlined text-gray-400"> chevron_right </span>
</div>
</a>
<a class="flex items-center justify-between p-4 border-b border-gray-100" href="#">
<p class="text-gray-900">Date Format</p>
<div class="flex items-center space-x-2">
<span class="text-gray-500">MM/DD/YYYY</span>
<span class="material-symbols-outlined text-gray-400"> chevron_right </span>
</div>
</a>
<a class="flex items-center justify-between p-4" href="#">
<p class="text-gray-900">Time Format</p>
<div class="flex items-center space-x-2">
<span class="text-gray-500">12-hour</span>
<span class="material-symbols-outlined text-gray-400"> chevron_right </span>
</div>
</a>
</div>
</section>
<section>
<h2 class="text-lg font-semibold text-gray-500 mb-2 px-4">Notifications</h2>
<div class="bg-white rounded-xl shadow-sm">
<div class="flex items-center justify-between p-4 border-b border-gray-100">
<p class="text-gray-900">Push Notifications</p>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox" value=""/>
<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-[var(--primary-color)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
</label>
</div>
<div class="flex items-center justify-between p-4">
<p class="text-gray-900">Email Notifications</p>
<label class="relative inline-flex items-center cursor-pointer">
<input class="sr-only peer" type="checkbox" value=""/>
<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-[var(--primary-color)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
</label>
</div>
</div>
</section>
<section>
<h2 class="text-lg font-semibold text-gray-500 mb-2 px-4">Security</h2>
<div class="bg-white rounded-xl shadow-sm">
<div class="flex items-center justify-between p-4">
<p class="text-gray-900">Enable Face ID</p>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox" value=""/>
<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-[var(--primary-color)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
</label>
</div>
</div>
</section>
<section>
<h2 class="text-lg font-semibold text-gray-500 mb-2 px-4">App</h2>
<div class="bg-white rounded-xl shadow-sm">
<a class="flex items-center justify-between p-4 border-b border-gray-100" href="#">
<p class="text-gray-900">Privacy Policy</p>
<span class="material-symbols-outlined text-gray-400"> chevron_right </span>
</a>
<a class="flex items-center justify-between p-4 border-b border-gray-100" href="#">
<p class="text-gray-900">Terms of Service</p>
<span class="material-symbols-outlined text-gray-400"> chevron_right </span>
</a>
<div class="flex items-center justify-between p-4">
<p class="text-gray-900">App Version</p>
<span class="text-gray-500">1.0.0</span>
</div>
</div>
</section>
</main>
</div>
<footer class="sticky bottom-0 z-10 bg-white/90 backdrop-blur-sm border-t border-gray-100">
<nav class="flex justify-around items-center h-20">
<a class="flex flex-col items-center justify-center text-gray-500" href="#">
<span class="material-symbols-outlined"> home </span>
<span class="text-xs">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-gray-500" href="#">
<span class="material-symbols-outlined"> bar_chart </span>
<span class="text-xs">Insights</span>
</a>
<a class="flex items-center justify-center size-14 bg-[var(--primary-color)] text-white rounded-full shadow-lg -mt-8" href="#">
<span class="material-symbols-outlined text-3xl"> add </span>
</a>
<a class="flex flex-col items-center justify-center text-gray-500" href="#">
<span class="material-symbols-outlined"> account_balance_wallet </span>
<span class="text-xs">Accounts</span>
</a>
<a class="flex flex-col items-center justify-center text-[var(--primary-color)] font-medium" href="#">
<span class="material-symbols-outlined"> settings </span>
<span class="text-xs">Settings</span>
</a>
</nav>
<div class="h-safe-area-bottom"></div>
</footer>
</div>

</body></html>