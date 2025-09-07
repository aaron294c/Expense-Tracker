<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Stitch Design</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=SF+Pro+Text:wght@400;600&amp;family=SF+Pro+Display:wght@300;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
    :root {
      --ios-blue: #007AFF;
      --ios-light-gray: #F2F2F7;
      --ios-black: #000000;
      --ios-dark-gray: #8E8E93;
    }
    body {
      font-family: "SF Pro Text", sans-serif;
    }
    .hero-input {
      font-family: "SF Pro Display", sans-serif;
    }
    .material-symbols-outlined {
      font-variation-settings:
      'FILL' 0,
      'wght' 300,
      'GRAD' 0,
      'opsz' 24
    }
  </style>
<style>
    body {
      min-height: max(884px, 100dvh);
      background-color: #E5E5EA;
    }
    .modal-enter {
      animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slide-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
  </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-gray-200">
<div class="relative flex size-full min-h-screen flex-col justify-end bg-black/30">
<div class="relative flex flex-col rounded-t-[28px] bg-white pb-6 pt-4 shadow-[0_2px_20px_rgba(0,0,0,0.08)] modal-enter">
<div class="flex h-5 w-full items-center justify-center">
<div class="h-1.5 w-10 rounded-full bg-gray-300"></div>
</div>
<div class="flex-1 px-4 pt-6">
<div class="px-2">
<div class="relative flex items-center justify-center">
<span class="text-4xl font-light text-gray-400 self-start pt-1.5 pr-1">$</span>
<input class="hero-input form-input h-auto w-full border-none bg-transparent p-0 text-center text-[56px] font-light text-black placeholder:text-gray-400 focus:outline-none focus:ring-0" placeholder="0" type="text" value="125.50"/>
</div>
</div>
<div class="mt-6 flex items-center justify-center gap-2">
<button class="rounded-full bg-[var(--ios-light-gray)] px-4 py-2 text-sm font-semibold text-[var(--ios-black)] transition-transform hover:scale-105 active:scale-95">$5</button>
<button class="rounded-full bg-[var(--ios-light-gray)] px-4 py-2 text-sm font-semibold text-[var(--ios-black)] transition-transform hover:scale-105 active:scale-95">$10</button>
<button class="rounded-full bg-[var(--ios-light-gray)] px-4 py-2 text-sm font-semibold text-[var(--ios-black)] transition-transform hover:scale-105 active:scale-95">$25</button>
<button class="rounded-full bg-[var(--ios-light-gray)] px-4 py-2 text-sm font-semibold text-[var(--ios-black)] transition-transform hover:scale-105 active:scale-95">$50</button>
</div>
<div class="mt-6 px-2">
<div class="relative">
<input class="form-input w-full rounded-xl border-none bg-[var(--ios-light-gray)] py-3.5 pl-4 pr-12 text-base text-[var(--ios-black)] placeholder:text-[var(--ios-dark-gray)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--ios-blue)]" placeholder="Note (e.g., Starbucks coffee)" type="text" value="Starbucks coffee"/>
<button class="absolute inset-y-0 right-0 flex items-center pr-3.5 transition-transform active:scale-90">
<span class="material-symbols-outlined text-[var(--ios-dark-gray)]">mic</span>
</button>
</div>
</div>
<div class="mt-6 px-2">
<h3 class="text-base font-semibold tracking-tight text-gray-500 uppercase">CATEGORIES</h3>
<div class="mt-4 grid grid-cols-3 gap-3">
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">shopping_cart</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Groceries</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[rgba(0,122,255,0.1)] ring-2 ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-blue)]" style="font-variation-settings: 'FILL' 1;">restaurant</span>
<p class="text-xs font-semibold text-[var(--ios-blue)]">Dining Out</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">lightbulb</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Utilities</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">home</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Rent</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">directions_car</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Transport</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">movie</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Entertainment</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">receipt_long</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Bills</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">shopping_bag</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Shopping</p>
</button>
<button class="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-[var(--ios-light-gray)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<span class="material-symbols-outlined text-3xl text-[var(--ios-dark-gray)]">add</span>
<p class="text-xs font-medium text-[var(--ios-dark-gray)]">Add</p>
</button>
</div>
</div>
<div class="mt-8 px-2">
<h3 class="text-base font-semibold tracking-tight text-gray-500 uppercase">SUGGESTIONS</h3>
<div class="mt-4">
<button class="flex w-full items-center gap-x-4 rounded-xl bg-[var(--ios-light-gray)] p-3 transition-colors hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]">
<div class="flex size-10 items-center justify-center rounded-full bg-[rgba(0,122,255,0.15)]">
<span class="material-symbols-outlined text-[var(--ios-blue)]">local_cafe</span>
</div>
<div class="text-left">
<p class="font-semibold text-[var(--ios-black)]">Dining Out</p>
<p class="text-sm text-[var(--ios-dark-gray)]">Based on "Starbucks"</p>
</div>
<span class="material-symbols-outlined ml-auto text-gray-300">chevron_right</span>
</button>
</div>
</div>
</div>
<div class="mt-8 px-6 pb-2">
<button class="flex w-full cursor-pointer items-center justify-center rounded-full bg-[var(--ios-blue)] py-4 text-lg font-bold text-white shadow-[0_4px_14px_rgba(0,122,255,0.3)] transition-transform active:scale-95 active:bg-blue-600">
          Add Expense
        </button>
</div>
</div>
</div>

</body></html>