<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Stitch Design</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com/" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
        :root {
          --primary-color: #ea2a33;
        }
        body {
            font-family: 'SF Pro Display', sans-serif;
            background: linear-gradient(170deg, #F0F2F5 0%, #E6E9EF 100%);
        }
        .glassmorphism {
            background: rgba(255, 255, 255, 0.4);
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="min-h-screen flex flex-col items-center justify-center p-4">
<div class="w-full max-w-md mx-auto">
<div class="relative flex flex-col justify-between group/design-root overflow-hidden rounded-3xl">
<div class="absolute inset-0 z-0">
<div class="absolute -top-24 -left-24 w-72 h-72 bg-[var(--primary-color)]/20 rounded-full blur-3xl opacity-50"></div>
<div class="absolute -bottom-24 -right-24 w-72 h-72 bg-[#5D5FEF]/20 rounded-full blur-3xl opacity-50"></div>
</div>
<div class="relative z-10 p-6 space-y-8">
<div class="text-center">
<h1 class="text-3xl font-bold text-slate-800 tracking-tight">Account Setup</h1>
<p class="text-slate-500 mt-2">Let's get your budget set up.</p>
</div>
<div class="space-y-4">
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
<input class="form-input w-full pl-12 pr-4 py-4 glassmorphism rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/50 border-none h-14 placeholder:text-slate-400 text-base" placeholder="Email" type="email"/>
</div>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
<input class="form-input w-full pl-12 pr-4 py-4 glassmorphism rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/50 border-none h-14 placeholder:text-slate-400 text-base" placeholder="Password" type="password"/>
</div>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">account_balance_wallet</span>
<input class="form-input w-full pl-12 pr-4 py-4 glassmorphism rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/50 border-none h-14 placeholder:text-slate-400 text-base" placeholder="Monthly Budget" type="number"/>
</div>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">group</span>
<input class="form-input w-full pl-12 pr-4 py-4 glassmorphism rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/50 border-none h-14 placeholder:text-slate-400 text-base" placeholder="Partner's Email (Optional)" type="email"/>
</div>
</div>
<div class="pt-4">
<button class="w-full h-14 px-5 flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white text-lg font-bold tracking-wide shadow-lg shadow-[var(--primary-color)]/30 transform active:scale-95 transition-transform duration-150 ease-in-out">
<span class="truncate">Send Invitation</span>
</button>
</div>
<div class="text-center">
<button class="text-slate-500 text-sm font-medium hover:text-[var(--primary-color)] transition-colors">
                        Back
                    </button>
</div>
</div>
</div>
</div>

</body></html>