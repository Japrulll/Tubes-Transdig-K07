<script setup>

</script>

<template>
  <div class="h-screen bg-white flex flex-col px-5 my-5 gap-8">
    <img src="/Hero.png" class="h-1/5"/>
    <div class="flex flex-1 flex-col gap-1.25">
        <p class="text-[10px] font-black font-sans text-emerald-700">TEMAN JELAJAH TAMANMU</p>
        <div class="w-2/3">
            <p class="text-[32px] font-sans font-medium"> Selamat datang di <span class="text-emerald-600 font-medium"> SETARA</span> </p>
        </div>
        <p class="text-[13px] font-medium text-gray-400">Jelajahi Kiara Artha Park. Info spot akan muncul otomatis saat Anda mendekat.</p>
        <div class="mt-2 p-5 bg-emerald-50 rounded-2xl border border-gray-300 flex flex-row gap-3">
            <img src="/iconbintang.png" class=" w-12 h-12">
            <div class="w-full h-full flex flex-col gap-1">
                <p class="text-[13px] font-sans font-black">Mengapa butuh lokasi?</p>
                <p class="text-[10px] font-sans">Lokasi hanya diproses di ponsel untuk mendeteksi spot terdekat dan tidak dikirim ke server.</p>
            </div>
        </div>
        <div class="mt-auto flex flex-col gap-3 mb-10">
            <button class="bg-emerald-700 text-center text-white font-bold font-sans rounded-4xl p-4">
                <p>Izinkan Akses Lokasi</p>
            </button>
            <button class="bg-white text-center text-emerald-700 border border-emerald-700 font-bold font-sans rounded-4xl p-4">
                <p>Gunakan Mode QR</p>
            </button>
        </div>
    </div>
  </div>
</template>

<!-- <style scoped>

</style> -->
