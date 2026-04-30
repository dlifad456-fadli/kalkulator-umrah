import React, { useState, useMemo, useEffect } from 'react';
import {
  Hotel,
  Bus,
  Plane,
  UserCheck,
  ShieldCheck,
  Wallet,
  RefreshCcw,
  Info,
  Clock,
  MapPin,
  PlusCircle,
  CalendarDays,
  PlaneTakeoff,
  Trash2,
  Plus,
  Share2,
  Printer,
  FileText
} from 'lucide-react';

const formatNumberWithSeparator = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const numeric = Number(String(val).replace(/[^\d]/g, ''));
  if (Number.isNaN(numeric)) return '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric);
};

const sanitizeNumericInput = (val) => String(val ?? '').replace(/[^\d]/g, '');

const App = () => {
  const [rates, setRates] = useState({
    sar: 4200,
    usd: 15800
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);

  const [inputs, setInputs] = useState({
    madiHotelName: 'Burj Mawaddah / Setaraf',
    makkHotelName: 'Manazil / Setaraf',
    totalDays: 16,
    madiDays: 5,
    makkDays: 9,
    madiPriceSar: 360,
    makkPriceSar: 370,
    mutoPriceSar: 250,
    busVisaSar: 600,
    handlingUsd: 50,
    mealSar: 30,
    reserveFund: 200000,
    insuranceIndo: 200000,
    ticketInternational: 14500000,
    ticketDomestic: 0,
    equipment: 1500000,
    extraServices: [{ id: Date.now(), label: '', price: 0 }],
    handlingIndo: 200000,
    manasik: 300000,
    transportIndo: 200000,
    agentFee: 1000000,
    tipSar: 50,
    profit: 2000000
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();

      if (data && data.rates) {
        const usdToIdr = data.rates.IDR;
        const usdToSar = data.rates.SAR;
        const sarToIdr = usdToIdr / usdToSar;

        setRates({
          usd: Math.round(usdToIdr),
          sar: Math.round(sarToIdr)
        });
        setLastUpdated(new Date().toLocaleString('id-ID'));
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengambil kurs terbaru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const formatIDR = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);

  const results = useMemo(() => {
    const p = inputs;
    const r = rates;

    const cost1 = (p.madiPriceSar * p.madiDays * r.sar) / 4;
    const cost2 = (p.makkPriceSar * p.makkDays * r.sar) / 4;
    const cost3 = (cost1 + cost2) / 20;
    const cost4 = (p.mutoPriceSar * p.totalDays * r.sar) / 20;
    const cost5 = p.busVisaSar * r.sar;
    const cost6 = p.handlingUsd * r.usd;
    const cost7 = p.mealSar * r.sar;
    const cost8 = Number(p.reserveFund);
    const cost9 = Number(p.insuranceIndo);
    const cost10 = Number(p.ticketInternational);
    const cost11 = Number(p.ticketDomestic);
    const cost12 = Number(p.equipment);
    const totalExtraServicesPrice = p.extraServices.reduce(
      (acc, curr) => acc + Number(curr.price || 0),
      0
    );
    const cost13 = totalExtraServicesPrice;
    const cost14 = Number(p.handlingIndo);
    const subtotal1_14 =
      cost1 +
      cost2 +
      cost3 +
      cost4 +
      cost5 +
      cost6 +
      cost7 +
      cost8 +
      cost9 +
      cost10 +
      cost11 +
      cost12 +
      cost13 +
      cost14;
    const cost15 = (subtotal1_14 + 4000000) / 20;
    const cost16 = Number(p.manasik);
    const cost17 = Number(p.transportIndo);
    const cost18 = Number(p.agentFee);
    const cost19 = p.tipSar * r.sar;
    const cost20 = Number(p.profit);

    const totalHpp = subtotal1_14 + cost15 + cost16 + cost17 + cost18 + cost19 + cost20;

    const summaryItems = [
      { id: 1, label: `Madinah (${p.madiHotelName}) - ${p.madiDays}H`, value: cost1 },
      { id: 2, label: `Makkah (${p.makkHotelName}) - ${p.makkDays}H`, value: cost2 },
      { id: 3, label: 'Bed Mutowif', value: cost3 },
      { id: 4, label: 'Jasa Mutowif', value: cost4 },
      { id: 5, label: 'Bus & Visa', value: cost5 },
      { id: 6, label: 'Handling Saudi', value: cost6 },
      { id: 7, label: 'Meal Bandara', value: cost7 },
      { id: 8, label: 'Biaya Cadangan', value: cost8 },
      { id: 9, label: 'Asuransi Indo', value: cost9 },
      { id: 10, label: 'Tiket CGK-JED', value: cost10 },
      { id: 11, label: 'Tiket Domestik', value: cost11 },
      { id: 12, label: 'Perlengkapan', value: cost12 }
    ];

    p.extraServices.forEach((service, index) => {
      if (service.label || service.price > 0) {
        summaryItems.push({
          id: `13-${index}`,
          label: `Layanan: ${service.label || 'Lainnya'}`,
          value: Number(service.price || 0)
        });
      }
    });

    summaryItems.push(
      { id: 14, label: 'Handling Indo', value: cost14 },
      { id: 15, label: 'Biaya Tour Leader', value: cost15 },
      { id: 16, label: 'Biaya Manasik', value: cost16 },
      { id: 17, label: 'Transport Lokal Indo', value: cost17 },
      { id: 18, label: 'Fee Agen', value: cost18 },
      { id: 19, label: 'Tip', value: cost19 },
      { id: 20, label: 'Laba', value: cost20 }
    );

    return {
      items: summaryItems,
      totalHpp,
      totalHotelDays: Number(p.madiDays) + Number(p.makkDays)
    };
  }, [inputs, rates]);

  const handleInputChange = (field, value) => {
    if (field === 'totalDays') {
      const days = Number(value);
      const hotelDays = Math.max(0, days - 2);
      const madi = Math.floor(hotelDays / 2);
      const makk = hotelDays - madi;

      setInputs((prev) => ({
        ...prev,
        totalDays: value,
        madiDays: madi,
        makkDays: makk
      }));
    } else {
      setInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const addExtraService = () => {
    setInputs((prev) => ({
      ...prev,
      extraServices: [...prev.extraServices, { id: Date.now(), label: '', price: 0 }]
    }));
  };

  const removeExtraService = (id) => {
    setInputs((prev) => ({
      ...prev,
      extraServices: prev.extraServices.filter((s) => s.id !== id)
    }));
  };

  const handleExtraServiceChange = (id, field, value) => {
    setInputs((prev) => ({
      ...prev,
      extraServices: prev.extraServices.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    }));
  };

  const handleRateChange = (field, value) => {
    setRates((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const handlePrint = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleShare = async () => {
    const shareText =
      `RINGKASAN HPP UMRAH (${inputs.totalDays} HARI)\n` +
      `Hotel Makkah: ${inputs.makkHotelName}\n` +
      `Hotel Madinah: ${inputs.madiHotelName}\n` +
      `Total HPP: ${formatIDR(results.totalHpp)}\n` +
      `Update Kurs SAR: ${formatIDR(rates.sar)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'HPP Umrah', text: shareText });
      } catch (err) {
        console.error(err);
      }
    } else {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('Ringkasan disalin ke clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 overflow-x-hidden">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold border border-slate-700 print:hidden">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 flex items-center gap-2">
              <img src="/logo-trz.svg" alt="Logo TRZ" className="w-8 h-8 object-contain" />
              Kalkulator HPP Umrah TRZ
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-2 bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Paket</span>
                <NumericInput
                  value={inputs.totalDays}
                  onChange={(value) => handleInputChange('totalDays', value)}
                  className="w-10 bg-transparent font-black text-emerald-900 focus:outline-none text-center border-b border-emerald-400/50"
                />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Hari</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200">
                <PlaneTakeoff className="w-3.5 h-3.5" />
                <span>2 Hari Perjalanan</span>
              </div>

              {lastUpdated && (
                <div className="flex items-center gap-1 text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  <Clock className="w-3 h-3" />
                  Update: {lastUpdated}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurs SAR</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-medium">Rp</span>
                  <NumericInput value={rates.sar} onChange={(value) => handleRateChange('sar', value)} className="w-20 font-bold focus:outline-none" />
                </div>
              </div>
              <div className="w-px bg-slate-200 self-stretch" />
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurs USD</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-medium">Rp</span>
                  <NumericInput value={rates.usd} onChange={(value) => handleRateChange('usd', value)} className="w-24 font-bold focus:outline-none" />
                </div>
              </div>
              <button
                onClick={fetchRates}
                disabled={loading}
                className={`p-2 rounded-lg transition-all ${
                  loading ? 'animate-spin text-slate-300' : 'text-emerald-600 hover:bg-emerald-50 active:scale-95'
                }`}
                title="Refresh Kurs"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 print:hidden">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                  <Hotel className="w-5 h-5 text-emerald-600" /> Hotel Akomodasi
                </h2>
                <div className="text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 bg-emerald-50 text-emerald-700">
                  <Info className="w-3 h-3" /> Total Hotel: {results.totalHotelDays} Hari
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" /> Hotel Makkah
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                    value={inputs.makkHotelName}
                    onChange={(e) => handleInputChange('makkHotelName', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <NumericInput
                      className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                      placeholder="Hari"
                      value={inputs.makkDays}
                      onChange={(value) => handleInputChange('makkDays', value)}
                    />
                    <NumericInput
                      className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                      placeholder="SAR"
                      value={inputs.makkPriceSar}
                      onChange={(value) => handleInputChange('makkPriceSar', value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" /> Hotel Madinah
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                    value={inputs.madiHotelName}
                    onChange={(e) => handleInputChange('madiHotelName', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <NumericInput
                      className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                      placeholder="Hari"
                      value={inputs.madiDays}
                      onChange={(value) => handleInputChange('madiDays', value)}
                    />
                    <NumericInput
                      className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                      placeholder="SAR"
                      value={inputs.madiPriceSar}
                      onChange={(value) => handleInputChange('madiPriceSar', value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
                <Bus className="w-5 h-5 text-emerald-600" /> Land Arrangement Saudi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup
                  label="Durasi Paket"
                  value={inputs.totalDays}
                  onChange={(v) => handleInputChange('totalDays', v)}
                  icon={<CalendarDays className="w-3 h-3" />}
                />
                <InputGroup
                  label="Jasa Mutowif (SAR/Hari)"
                  value={inputs.mutoPriceSar}
                  onChange={(v) => handleInputChange('mutoPriceSar', v)}
                />
                <InputGroup
                  label="Bus & Visa (SAR Total)"
                  value={inputs.busVisaSar}
                  onChange={(v) => handleInputChange('busVisaSar', v)}
                />
                <InputGroup
                  label="Handling Saudi (USD)"
                  value={inputs.handlingUsd}
                  onChange={(v) => handleInputChange('handlingUsd', v)}
                />
                <InputGroup
                  label="Meal Bandara (SAR)"
                  value={inputs.mealSar}
                  onChange={(v) => handleInputChange('mealSar', v)}
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                  <PlusCircle className="w-5 h-5 text-emerald-600" /> Layanan Tambahan
                </h2>
                <button
                  onClick={addExtraService}
                  className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                >
                  <Plus className="w-3 h-3 inline mr-1" /> Tambah
                </button>
              </div>
              <div className="space-y-4">
                {inputs.extraServices.map((service) => (
                  <div key={service.id} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-xl">
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Keterangan"
                        className="w-full p-2 bg-white border rounded-lg text-sm"
                        value={service.label}
                        onChange={(e) => handleExtraServiceChange(service.id, 'label', e.target.value)}
                      />
                    </div>
                    <div className="col-span-5 relative">
                      <NumericInput
                        placeholder="Harga IDR"
                        className="w-full p-2 bg-white border rounded-lg pl-8 text-sm"
                        value={service.price}
                        onChange={(value) => handleExtraServiceChange(service.id, 'price', value)}
                      />
                      <span className="absolute left-2 top-2.5 text-[10px] font-bold text-slate-300">RP</span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeExtraService(service.id)} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
                <Plane className="w-5 h-5 text-emerald-600" /> Transportasi & Udara
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup
                  label="Tiket Internasional"
                  value={inputs.ticketInternational}
                  onChange={(v) => handleInputChange('ticketInternational', v)}
                  isIdr
                />
                <InputGroup
                  label="Tiket Domestik"
                  value={inputs.ticketDomestic}
                  onChange={(v) => handleInputChange('ticketDomestic', v)}
                  isIdr
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Operasional & Perlengkapan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputGroup
                  label="Perlengkapan"
                  value={inputs.equipment}
                  onChange={(v) => handleInputChange('equipment', v)}
                  isIdr
                />
                <InputGroup
                  label="Asuransi Indo"
                  value={inputs.insuranceIndo}
                  onChange={(v) => handleInputChange('insuranceIndo', v)}
                  isIdr
                />
                <InputGroup
                  label="Manasik"
                  value={inputs.manasik}
                  onChange={(v) => handleInputChange('manasik', v)}
                  isIdr
                />
                <InputGroup
                  label="Handling Indo"
                  value={inputs.handlingIndo}
                  onChange={(v) => handleInputChange('handlingIndo', v)}
                  isIdr
                />
                <InputGroup
                  label="Cadangan"
                  value={inputs.reserveFund}
                  onChange={(v) => handleInputChange('reserveFund', v)}
                  isIdr
                />
                <InputGroup
                  label="Transport Lokal"
                  value={inputs.transportIndo}
                  onChange={(v) => handleInputChange('transportIndo', v)}
                  isIdr
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
                <UserCheck className="w-5 h-5 text-emerald-600" /> Lain-lain & Laba
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputGroup label="Tip (SAR)" value={inputs.tipSar} onChange={(v) => handleInputChange('tipSar', v)} />
                <InputGroup label="Fee Agen" value={inputs.agentFee} onChange={(v) => handleInputChange('agentFee', v)} isIdr />
                <InputGroup label="Laba" value={inputs.profit} onChange={(v) => handleInputChange('profit', v)} isIdr />
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:block print:w-full print:absolute print:top-0 print:left-0 print:m-0">
            <div className="sticky top-8 space-y-4 print:relative">
              <div className="bg-emerald-800 text-white rounded-3xl p-6 shadow-2xl border border-emerald-700/50 print:bg-white print:text-slate-900 print:shadow-none print:p-0">
                <div className="flex justify-between items-center mb-6 border-b border-emerald-700 pb-4 print:border-slate-300">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-emerald-300 print:text-emerald-600" /> Summary HPP
                  </h2>
                  <div className="hidden print:block text-right text-[10px] text-slate-400">TRZ Umrah Calculator</div>
                </div>

                <div className="space-y-3 mb-8 print:space-y-2">
                  {results.items.map((item) => {
                    const isLaba = item.id === 20;
                    return (
                      <div
                        key={item.id}
                        className={`flex justify-between text-[12px] leading-tight group ${
                          isLaba ? 'pt-2 mt-2 border-t border-emerald-700/30 print:border-slate-300' : ''
                        }`}
                      >
                        <span
                          className={`pr-2 ${
                            isLaba
                              ? 'font-black text-white text-[13px] print:text-slate-900 uppercase'
                              : 'text-emerald-200 group-hover:text-white print:text-slate-600'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`tabular-nums ${
                            isLaba
                              ? 'font-black text-white text-[13px] print:text-slate-900'
                              : 'font-semibold text-white print:text-slate-900'
                          }`}
                        >
                          {formatIDR(item.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 border-t border-emerald-700 pt-6 print:border-slate-300">
                  <div className="flex justify-between items-end">
                    <span className="text-emerald-200 font-medium uppercase text-[10px] print:text-slate-500">HPP per Pax</span>
                    <span className="text-2xl font-black text-white print:text-slate-900">{formatIDR(results.totalHpp)}</span>
                  </div>

                  <div className="bg-white/10 p-5 rounded-2xl border border-white/10 mt-2 print:bg-slate-50 print:border-none">
                    <h3 className="text-[10px] uppercase font-black text-emerald-300 mb-1 print:text-emerald-800">
                      Rekomendasi Jual
                    </h3>
                    <p className="text-2xl font-black text-white print:text-slate-900">
                      {formatIDR(Math.ceil(results.totalHpp / 100000) * 100000)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 print:hidden border-t border-emerald-700/50 pt-6">
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-emerald-700 text-white py-2.5 rounded-xl flex justify-center items-center gap-2 text-xs font-bold transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl flex justify-center items-center gap-2 text-xs font-bold transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4" /> Cetak
                  </button>
                  <button
                    onClick={handlePrint}
                    className="w-full bg-white text-emerald-800 py-2.5 rounded-xl flex justify-center items-center gap-2 text-xs font-bold border border-white shadow-sm transition-all active:scale-95"
                  >
                    <FileText className="w-4 h-4" /> Simpan PDF
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 border border-slate-200 p-5 rounded-2xl text-slate-700 text-sm shadow-sm print:hidden">
                <h4 className="font-bold mb-2 uppercase text-[10px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Info Kurs
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-medium opacity-90">
                  <div className="bg-white p-2 rounded-lg border">1 USD = {formatIDR(rates.usd)}</div>
                  <div className="bg-white p-2 rounded-lg border">1 SAR = {formatIDR(rates.sar)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: auto;
          }
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, isIdr = false, icon = null }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-600 flex items-center gap-1">
      {icon} {label}
    </label>
    <div className="relative group">
      <NumericInput
        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none pl-9 transition-all text-sm"
        value={value}
        onChange={onChange}
      />
      <span className="absolute left-3 top-3 text-[10px] font-bold text-slate-400 uppercase">{isIdr ? 'Rp' : ''}</span>
    </div>
  </div>
);

const NumericInput = ({ value, onChange, className, placeholder }) => (
  <input
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    className={className}
    placeholder={placeholder}
    value={formatNumberWithSeparator(value)}
    onChange={(e) => onChange(sanitizeNumericInput(e.target.value))}
  />
);

export default App;
