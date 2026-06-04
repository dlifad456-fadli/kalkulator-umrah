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
  Users,
  Trash2,
  Plus,
  Share2,
  Printer,
  FileText,
  ChevronDown,
  ChevronUp,
  PenLine,
  CloudDownload
} from 'lucide-react';

const OPTIONAL_PACKAGE_KEYS = new Set(['gold', 'platinum']);
const isOptionalPackage = (tierKey) => OPTIONAL_PACKAGE_KEYS.has(tierKey);

const formatNumberWithSeparator = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const numeric = Number(String(val).replace(/[^\d]/g, ''));
  if (Number.isNaN(numeric)) return '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric);
};

const sanitizeNumericInput = (val) => String(val ?? '').replace(/[^\d]/g, '');

const newExtraServiceRow = () => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, label: '', price: 0 });

/** Harga SAR/kamar dibagi jumlah jamaah per kamar (quad=4, triple=3, double=2). */
const HOTEL_SHARING_DIVISOR = { quad: 4, triple: 3, double: 2 };
const HOTEL_SHARING_LABEL = { quad: 'Quad', triple: 'Triple', double: 'Double' };
const TRAVEL_DAYS = 2;

const getMaxHotelDays = (totalDays) => Math.max(0, Number(totalDays) - TRAVEL_DAYS);

/** Batasi malam Madinah + Makkah agar tidak melebihi durasi paket dikurangi hari perjalanan. */
const clampTierHotelDays = (tier, field, rawValue, maxHotelDays) => {
  const requested = Math.max(0, Number(rawValue) || 0);
  let madiDays = field === 'madiDays' ? requested : Number(tier.madiDays) || 0;
  let makkDays = field === 'makkDays' ? requested : Number(tier.makkDays) || 0;

  if (madiDays + makkDays > maxHotelDays) {
    if (field === 'madiDays') {
      madiDays = Math.max(0, maxHotelDays - makkDays);
    } else {
      makkDays = Math.max(0, maxHotelDays - madiDays);
    }
  }

  const applied = field === 'madiDays' ? madiDays : makkDays;
  return { madiDays, makkDays, wasClamped: requested !== applied };
};

const defaultTierHotel = (madiName, makkName, madiSar, makkSar) => ({
  madiHotelName: madiName,
  makkHotelName: makkName,
  madiDays: 5,
  makkDays: 9,
  madiPriceSar: madiSar,
  makkPriceSar: makkSar,
  hotelSharing: 'quad',
  extraServices: [newExtraServiceRow()]
});

/** Gabungan input bersama + satu tier (hotel + layanan tambahan). */
const buildMergedPackageInputs = (baseInputs, tier) => ({
  ...baseInputs,
  madiHotelName: tier.madiHotelName,
  makkHotelName: tier.makkHotelName,
  madiDays: tier.madiDays,
  makkDays: tier.makkDays,
  madiPriceSar: tier.madiPriceSar,
  makkPriceSar: tier.makkPriceSar,
  hotelSharing: tier.hotelSharing ?? 'quad',
  extraServices: tier.extraServices
});

const computePackageResults = (p, r) => {
  const pax = Math.max(1, Number(p.jumlahPax) || 20);
  const sharingKey = HOTEL_SHARING_DIVISOR[p.hotelSharing] ? p.hotelSharing : 'quad';
  const roomDiv = HOTEL_SHARING_DIVISOR[sharingKey];
  const sharingShort = HOTEL_SHARING_LABEL[sharingKey];

  const cost1 = (p.madiPriceSar * p.madiDays * r.sar) / roomDiv;
  const cost2 = (p.makkPriceSar * p.makkDays * r.sar) / roomDiv;
  const cost3 = (cost1 + cost2) / pax;
  const cost4 = (p.mutoPriceSar * p.totalDays * r.sar) / pax;
  const cost5 = p.busVisaSar * r.sar;
  const cost6 = p.handlingUsd * r.usd;
  const cost7 = p.mealSar * r.sar;
  const cost8 = Number(p.reserveFund);
  const cost9 = Number(p.insuranceIndo);
  const cost10 = Number(p.ticketInternational);
  const cost11 = Number(p.ticketDomestic);
  const cost12 = Number(p.equipment);
  const totalExtraServicesPrice = p.extraServices.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
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
  const cost15 = (subtotal1_14 + 4000000) / pax;
  const cost16 = Number(p.manasik);
  const cost17 = Number(p.transportIndo);
  const cost18 = Number(p.agentFee);
  const cost19 = p.tipSar * r.sar;
  const cost20 = Number(p.profit);

  const totalHpp = subtotal1_14 + cost15 + cost16 + cost17 + cost18 + cost19 + cost20;
  const hargaModal = totalHpp - cost20;
  const currentHotelTotal = cost1 + cost2;

  const summaryItems = [
    {
      id: 1,
      label: `Madinah (${p.madiHotelName}) - ${p.madiDays}N · ${sharingShort} (÷${roomDiv})`,
      value: cost1
    },
    {
      id: 2,
      label: `Makkah (${p.makkHotelName}) - ${p.makkDays}N · ${sharingShort} (÷${roomDiv})`,
      value: cost2
    },
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
    hargaModal,
    currentHotelTotal,
    totalExtraServicesPrice,
    totalHotelDays: Number(p.madiDays) + Number(p.makkDays),
    pax
  };
};

const LS_KEY = 'trz_umrah_calc_last_inputs_v1';

const safeParseJSON = (val) => {
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
};

const App = () => {
  const defaultStateRef = React.useRef(null);

  const [rates, setRates] = useState({
    sar: 4200,
    usd: 15800
  });
  const [rateMode, setRateMode] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);
  const [showOptionalPackages, setShowOptionalPackages] = useState(false);

  const [inputs, setInputs] = useState({
    totalDays: 16,
    jumlahPax: 20,
    mutoPriceSar: 250,
    busVisaSar: 600,
    handlingUsd: 50,
    mealSar: 30,
    reserveFund: 200000,
    insuranceIndo: 200000,
    ticketInternational: 18000000,
    ticketDomestic: 0,
    equipment: 1500000,
    handlingIndo: 200000,
    manasik: 300000,
    transportIndo: 200000,
    agentFee: 1000000,
    tipSar: 0,
    profit: 2000000,
    tiers: {
      silver: defaultTierHotel('Burj Mawaddah / Setaraf', 'Manazil / Setaraf', 360, 370),
      gold: defaultTierHotel('Millennium / Setaraf', 'Swissotel / Setaraf', 420, 440),
      platinum: defaultTierHotel('Pullman Zamzam / Setaraf', 'Clock Tower / Setaraf', 520, 550)
    }
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadPersistedState = () => {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = safeParseJSON(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  };

  const persistStateRef = React.useRef(null);

  const persistToLocalStorage = (next) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore quota/security errors
      console.error(e);
    }
  };

  const debouncedPersistRef = React.useRef(null);

  const schedulePersist = (next) => {
    if (debouncedPersistRef.current) clearTimeout(debouncedPersistRef.current);
    debouncedPersistRef.current = setTimeout(() => persistToLocalStorage(next), 350);
  };

  useEffect(() => {
    // capture defaults once
    if (!defaultStateRef.current) {
      defaultStateRef.current = {
        rates: { sar: 4200, usd: 15800 },
        rateMode: 'auto',
        showOptionalPackages: false,
        inputs: {
          totalDays: 16,
          jumlahPax: 20,
          mutoPriceSar: 250,
          busVisaSar: 600,
          handlingUsd: 50,
          mealSar: 30,
          reserveFund: 200000,
          insuranceIndo: 200000,
          ticketInternational: 18000000,
          ticketDomestic: 0,
          equipment: 1500000,
          handlingIndo: 200000,
          manasik: 300000,
          transportIndo: 200000,
          agentFee: 1000000,
          tipSar: 0,
          profit: 2000000,
          tiers: {
            silver: defaultTierHotel('Burj Mawaddah / Setaraf', 'Manazil / Setaraf', 360, 370),
            gold: defaultTierHotel('Millennium / Setaraf', 'Swissotel / Setaraf', 420, 440),
            platinum: defaultTierHotel('Pullman Zamzam / Setaraf', 'Clock Tower / Setaraf', 520, 550)
          }
        }
      };
    }

    const persisted = loadPersistedState();
    if (!persisted) return;

    if (persisted.inputs) setInputs(persisted.inputs);
    if (persisted.rates) setRates(persisted.rates);
    if (typeof persisted.rateMode === 'string') setRateMode(persisted.rateMode);
    if (typeof persisted.showOptionalPackages === 'boolean') setShowOptionalPackages(persisted.showOptionalPackages);

    // if user last used auto mode, we can refresh rates automatically; otherwise respect manual values
  }, []);

  useEffect(() => {
    const next = {
      inputs,
      rates,
      rateMode,
      showOptionalPackages
    };

    schedulePersist(next);
  }, [inputs, rates, rateMode, showOptionalPackages]);

  const handleResetLastInput = () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch (e) {
      console.error(e);
    }

    const d = defaultStateRef.current;
    if (d) {
      setRates(d.rates);
      setRateMode(d.rateMode);
      setShowOptionalPackages(d.showOptionalPackages);
      setInputs(d.inputs);
    }

    showToast('Input terakhir direset.');
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
    if (rateMode === 'auto') {
      fetchRates();
    }
  }, [rateMode]);

  const formatIDR = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);

  const results = useMemo(() => {
    const { tiers, ...base } = inputs;
    const tierKeys = [
      { key: 'silver', label: 'Silver', accent: 'slate' },
      { key: 'gold', label: 'Gold', accent: 'amber' },
      { key: 'platinum', label: 'Platinum', accent: 'violet' }
    ];
    const packages = tierKeys.map(({ key, label, accent }) => {
      const merged = buildMergedPackageInputs(base, tiers[key]);
      return {
        key,
        label,
        accent,
        ...computePackageResults(merged, rates)
      };
    });
    return { packages, pax: packages[0]?.pax ?? 1 };
  }, [inputs, rates]);

  const visiblePackages = useMemo(
    () => results.packages.filter((pkg) => !isOptionalPackage(pkg.key) || showOptionalPackages),
    [results.packages, showOptionalPackages]
  );

  const maxHotelDays = getMaxHotelDays(inputs.totalDays);

  const handleInputChange = (field, value) => {
    if (field === 'totalDays') {
      const days = Number(value);
      const hotelDays = getMaxHotelDays(days);
      const madi = Math.floor(hotelDays / 2);
      const makk = hotelDays - madi;

      setInputs((prev) => ({
        ...prev,
        totalDays: value,
        tiers: Object.fromEntries(
          Object.entries(prev.tiers).map(([k, t]) => [
            k,
            { ...t, madiDays: madi, makkDays: makk }
          ])
        )
      }));
    } else {
      setInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleTierFieldChange = (tierKey, field, value) => {
    if (field === 'madiDays' || field === 'makkDays') {
      const tier = inputs.tiers[tierKey];
      const limit = getMaxHotelDays(inputs.totalDays);
      const { madiDays, makkDays, wasClamped } = clampTierHotelDays(tier, field, value, limit);
      if (wasClamped) {
        showToast(
          `Total malam hotel maksimal ${limit}N (durasi paket ${inputs.totalDays} hari − ${TRAVEL_DAYS} hari perjalanan).`
        );
      }
      setInputs((prev) => ({
        ...prev,
        tiers: {
          ...prev.tiers,
          [tierKey]: { ...prev.tiers[tierKey], madiDays, makkDays }
        }
      }));
      return;
    }

    setInputs((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: { ...prev.tiers[tierKey], [field]: value }
      }
    }));
  };

  const addExtraService = (tierKey) => {
    setInputs((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...prev.tiers[tierKey],
          extraServices: [...prev.tiers[tierKey].extraServices, newExtraServiceRow()]
        }
      }
    }));
  };

  const removeExtraService = (tierKey, id) => {
    setInputs((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...prev.tiers[tierKey],
          extraServices: prev.tiers[tierKey].extraServices.filter((s) => s.id !== id)
        }
      }
    }));
  };

  const handleExtraServiceChange = (tierKey, id, field, value) => {
    setInputs((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...prev.tiers[tierKey],
          extraServices: prev.tiers[tierKey].extraServices.map((s) =>
            s.id === id ? { ...s, [field]: value } : s
          )
        }
      }
    }));
  };

  const handleRateChange = (field, value) => {
    if (rateMode !== 'manual') return;
    setRates((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const isRateManual = rateMode === 'manual';

  const handlePrint = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleShare = async () => {
    const tierLines = visiblePackages
      .map(
        (pkg) =>
          `${pkg.label}: HPP ${formatIDR(pkg.totalHpp)} | Modal ${formatIDR(pkg.hargaModal)} | Jual ~${formatIDR(Math.ceil(pkg.totalHpp / 100000) * 100000)}`
      )
      .join('\n');
    const shareText =
      `RINGKASAN HPP UMRAH (${inputs.totalDays} HARI, ${results.pax} PAX)\n` +
      `${tierLines}\n` +
      `Kurs (${isRateManual ? 'Manual' : 'Update'}): SAR ${formatIDR(rates.sar)} | USD ${formatIDR(rates.usd)}`;

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

              <div
                className="flex items-center gap-2 bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm"
                title="Membagi biaya bed mutowif, jasa mutowif, dan tour leader ke tiap jamaah"
              >
                <Users className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Pax</span>
                <NumericInput
                  value={inputs.jumlahPax}
                  onChange={(value) => handleInputChange('jumlahPax', value)}
                  className="w-12 bg-transparent font-black text-emerald-900 focus:outline-none text-center border-b border-emerald-400/50"
                />
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200">
                <PlaneTakeoff className="w-3.5 h-3.5" />
                <span>2 Hari Perjalanan</span>
              </div>

              {isRateManual ? (
                <div className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-amber-200">
                  <PenLine className="w-3 h-3" />
                  Kurs Manual
                </div>
              ) : (
                lastUpdated && (
                  <div className="flex items-center gap-1 text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    <Clock className="w-3 h-3" />
                    Kurs: {lastUpdated}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex flex-col gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto">
              <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setRateMode('auto')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold transition-colors ${
                    !isRateManual
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <CloudDownload className="w-3.5 h-3.5 shrink-0" />
                  Kurs Update
                </button>
                <button
                  type="button"
                  onClick={() => setRateMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold border-l border-slate-200 transition-colors ${
                    isRateManual
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5 shrink-0" />
                  Kurs Manual
                </button>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurs SAR</label>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-medium">Rp</span>
                    <NumericInput
                      value={rates.sar}
                      onChange={(value) => handleRateChange('sar', value)}
                      readOnly={!isRateManual}
                      className={`w-20 font-bold focus:outline-none rounded-md px-1 ${
                        isRateManual ? 'bg-amber-50/50' : 'bg-slate-50 text-slate-700 cursor-default'
                      }`}
                    />
                  </div>
                </div>
                <div className="w-px bg-slate-200 self-stretch min-h-[2.5rem]" />
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurs USD</label>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-medium">Rp</span>
                    <NumericInput
                      value={rates.usd}
                      onChange={(value) => handleRateChange('usd', value)}
                      readOnly={!isRateManual}
                      className={`w-24 font-bold focus:outline-none rounded-md px-1 ${
                        isRateManual ? 'bg-amber-50/50' : 'bg-slate-50 text-slate-700 cursor-default'
                      }`}
                    />
                  </div>
                </div>
                {!isRateManual && (
                  <button
                    type="button"
                    onClick={fetchRates}
                    disabled={loading}
                    className={`p-2 rounded-lg transition-all ${
                      loading ? 'animate-spin text-slate-300' : 'text-emerald-600 hover:bg-emerald-50 active:scale-95'
                    }`}
                    title="Ambil kurs terbaru"
                  >
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                {isRateManual
                  ? 'Masukkan kurs SAR dan USD secara manual untuk perhitungan HPP.'
                  : 'Kurs diambil otomatis dari API. Klik refresh untuk memperbarui.'}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 print:hidden">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                  <Hotel className="w-5 h-5 text-emerald-600" />
                  Hotel &amp; Layanan Tambahan (per jenis paket)
                </h2>
                <div
                  className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-fit ${
                    (results.packages[0]?.totalHotelDays ?? 0) > maxHotelDays
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <Info className="w-3 h-3" /> Malam hotel: {results.packages[0]?.totalHotelDays ?? 0}N / maks. {maxHotelDays}N (paket − {TRAVEL_DAYS} hari perjalanan)
                </div>
              </div>
               
              <button
                type="button"
                onClick={() => setShowOptionalPackages((v) => !v)}
                className={`mb-4 w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-colors ${
                  showOptionalPackages
                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {showOptionalPackages ? (
                  <>
                    <ChevronUp className="w-4 h-4 shrink-0" />
                    Sembunyikan Paket Gold &amp; Platinum
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 shrink-0" />
                    Tampilkan Paket Gold &amp; Platinum
                  </>
                )}
              </button>
              <div
                className={`grid grid-cols-1 gap-6 ${showOptionalPackages ? 'xl:grid-cols-3' : 'max-w-md'}`}
              >
                {visiblePackages.map((pkg) => {
                  const tierKey = pkg.key;
                  const tier = inputs.tiers[tierKey];
                  const tierCard =
                    pkg.accent === 'gold'
                      ? 'border-amber-200 bg-amber-50/40'
                      : pkg.accent === 'violet'
                        ? 'border-violet-200 bg-violet-50/40'
                        : 'border-slate-200 bg-slate-50/60';
                  const badgeClass =
                    pkg.accent === 'gold'
                      ? 'bg-amber-200 text-amber-950'
                      : pkg.accent === 'violet'
                        ? 'bg-violet-200 text-violet-950'
                        : 'bg-slate-200 text-slate-900';
                  const pinClass =
                    pkg.accent === 'gold' ? 'text-amber-700' : pkg.accent === 'violet' ? 'text-violet-700' : 'text-slate-600';
                  const tierHotelDays = (Number(tier.madiDays) || 0) + (Number(tier.makkDays) || 0);
                  const tierHotelOverLimit = tierHotelDays > maxHotelDays;
                  const hotelNightsInputClass = `w-full p-2 bg-white border rounded-lg outline-none text-sm ${
                    tierHotelOverLimit ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'
                  }`;

                  return (
                    <div
                      key={tierKey}
                      className={`rounded-2xl border p-4 space-y-4 ${tierCard}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${badgeClass}`}>
                          Paket {pkg.label}
                        </span>
                        <span
                          className={`text-[10px] font-semibold tabular-nums ${
                            tierHotelOverLimit ? 'text-red-600' : 'text-slate-600'
                          }`}
                        >
                          {tierHotelDays}N / {maxHotelDays}N · {formatIDR(pkg.currentHotelTotal)}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${pinClass}`}>
                          Pembagian kamar (SAR/kamar)
                        </span>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                          {[
                            { value: 'quad', label: 'Quad', hint: '÷4' },
                            { value: 'triple', label: 'Triple', hint: '÷3' },
                            { value: 'double', label: 'Double', hint: '÷2' }
                          ].map((opt, idx) => {
                            const active = (tier.hotelSharing ?? 'quad') === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleTierFieldChange(tierKey, 'hotelSharing', opt.value)}
                                className={`flex-1 py-2 px-1 text-center transition-colors border-slate-200 ${
                                  idx > 0 ? 'border-l' : ''
                                } ${active ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                <span className="block text-[10px] font-black leading-tight">{opt.label}</span>
                                <span className={`block text-[9px] font-semibold leading-tight ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {opt.hint}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className={`text-xs font-semibold flex items-center gap-1 ${pinClass}`}>
                          <MapPin className="w-3 h-3" /> Hotel Makkah
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                          value={tier.makkHotelName}
                          onChange={(e) => handleTierFieldChange(tierKey, 'makkHotelName', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <NumericInput
                            className={hotelNightsInputClass}
                            placeholder="Malam"
                            title={`Maks. ${maxHotelDays} malam total (Madinah + Makkah)`}
                            value={tier.makkDays}
                            onChange={(value) => handleTierFieldChange(tierKey, 'makkDays', value)}
                          />
                          <NumericInput
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                            placeholder="SAR/kmr"
                            value={tier.makkPriceSar}
                            onChange={(value) => handleTierFieldChange(tierKey, 'makkPriceSar', value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className={`text-xs font-semibold flex items-center gap-1 ${pinClass}`}>
                          <MapPin className="w-3 h-3" /> Hotel Madinah
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                          value={tier.madiHotelName}
                          onChange={(e) => handleTierFieldChange(tierKey, 'madiHotelName', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <NumericInput
                            className={hotelNightsInputClass}
                            placeholder="Malam"
                            title={`Maks. ${maxHotelDays} malam total (Madinah + Makkah)`}
                            value={tier.madiDays}
                            onChange={(value) => handleTierFieldChange(tierKey, 'madiDays', value)}
                          />
                          <NumericInput
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                            placeholder="SAR/kmr"
                            value={tier.madiPriceSar}
                            onChange={(value) => handleTierFieldChange(tierKey, 'madiPriceSar', value)}
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-200/80 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Layanan tambahan
                          </h3>
                          <button
                            type="button"
                            onClick={() => addExtraService(tierKey)}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"
                          >
                            <Plus className="w-3 h-3 inline mr-0.5" /> Tambah
                          </button>
                        </div>
                        <div className="space-y-2">
                          {tier.extraServices.map((service) => (
                            <div key={service.id} className="grid grid-cols-12 gap-2 items-end bg-white/80 p-2 rounded-xl border border-slate-100">
                              <div className="col-span-12 sm:col-span-6">
                                <input
                                  type="text"
                                  placeholder="Keterangan"
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                                  value={service.label}
                                  onChange={(e) => handleExtraServiceChange(tierKey, service.id, 'label', e.target.value)}
                                />
                              </div>
                              <div className="col-span-10 sm:col-span-5 relative">
                                <NumericInput
                                  placeholder="IDR"
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg pl-7 text-xs"
                                  value={service.price}
                                  onChange={(value) => handleExtraServiceChange(tierKey, service.id, 'price', value)}
                                />
                                <span className="absolute left-2 top-2 text-[9px] font-bold text-slate-300">RP</span>
                              </div>
                              <div className="col-span-2 sm:col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeExtraService(tierKey, service.id)}
                                  className="text-slate-300 hover:text-red-500 p-1"
                                  aria-label="Hapus layanan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Subtotal layanan: {formatIDR(pkg.totalExtraServicesPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
              <div className="flex flex-col gap-3 mb-6 border-b border-emerald-700 pb-4 print:border-slate-300">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-emerald-300 print:text-emerald-600 shrink-0" /> Summary HPP
                      {showOptionalPackages ? ' — 3 Paket' : ' — Silver'}
                    </h2>
                    <div className="hidden print:block text-right text-[10px] text-slate-400 shrink-0">
                      TRZ Umrah Calculator
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOptionalPackages((v) => !v)}
                    className={`print:hidden w-full flex items-center justify-center gap-2 text-[11px] font-bold px-3 py-2 rounded-lg border transition-colors ${
                      showOptionalPackages
                        ? 'bg-emerald-700/40 text-emerald-100 border-emerald-600/50 hover:bg-emerald-700/60'
                        : 'bg-white/10 text-emerald-100 border-white/20 hover:bg-white/15'
                    }`}
                  >
                    {showOptionalPackages ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                        Sembunyikan Gold &amp; Platinum
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        + Gold &amp; Platinum
                      </>
                    )}
                  </button>
                </div>

                <div className="hidden print:grid grid-cols-1 gap-1.5 text-[11px] font-medium mb-4 pb-4 border-b border-slate-300 text-slate-700">
                  <div>Paket: {inputs.totalDays} Hari</div>
                  <div>Pax: {results.pax} Jamaah</div>
                  <div>Kurs SAR: {formatIDR(rates.sar)}</div>
                  <div>Kurs USD: {formatIDR(rates.usd)}</div>
                </div>

                <div className="space-y-6 mb-6 print:space-y-5">
                  {visiblePackages.map((pkg) => {
                    const ringClass =
                      pkg.key === 'gold'
                        ? 'border-amber-400/35 bg-amber-500/5 print:border-amber-200 print:bg-amber-50/80'
                        : pkg.key === 'platinum'
                          ? 'border-violet-400/35 bg-violet-500/5 print:border-violet-200 print:bg-violet-50/80'
                          : 'border-slate-300/30 bg-slate-900/20 print:border-slate-200 print:bg-slate-50';
                    return (
                      <div
                        key={pkg.key}
                        className={`rounded-2xl border p-4 print:break-inside-avoid ${ringClass}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 border-b border-white/10 pb-3 print:border-slate-200">
                          <h3 className="text-sm font-black uppercase tracking-wide text-emerald-100 print:text-emerald-900">
                            {pkg.label}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-emerald-200/90 print:text-slate-600">
                            <span>Hotel {formatIDR(pkg.currentHotelTotal)}</span>
                            <span>Layanan ekstra {formatIDR(pkg.totalExtraServicesPrice)}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4 print:space-y-1.5">
                          {pkg.items.map((item) => {
                            const isLaba = item.id === 20;
                            return (
                              <div
                                key={`${pkg.key}-${item.id}`}
                                className={`summary-row flex justify-between text-[11px] leading-tight group ${
                                  isLaba ? 'pt-2 mt-2 border-t border-emerald-700/30 print:border-slate-300' : ''
                                }`}
                              >
                                <span
                                  className={`summary-label pr-2 ${
                                    isLaba
                                      ? 'font-black text-yellow-300 text-[12px] print:text-yellow-700 uppercase'
                                      : 'text-emerald-200/90 group-hover:text-white print:text-slate-600'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                <span
                                  className={`summary-value tabular-nums ${
                                    isLaba
                                      ? 'font-black text-yellow-300 text-[12px] print:text-yellow-700'
                                      : 'font-semibold text-white/95 print:text-slate-900'
                                  }`}
                                >
                                  {formatIDR(item.value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-3 border-t border-emerald-700/40 pt-4 print:border-slate-200">
                          <div className="flex justify-between items-end">
                            <span className="text-blue-300 font-medium uppercase text-[10px] print:text-blue-700">Harga Modal</span>
                            <span className="text-base font-extrabold text-blue-200 print:text-blue-700">{formatIDR(pkg.hargaModal)}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-emerald-200 font-medium uppercase text-[10px] print:text-slate-500">HPP per Pax</span>
                            <span className="text-xl font-black text-white print:text-slate-900">{formatIDR(pkg.totalHpp)}</span>
                          </div>
                          <div className="bg-white/10 p-4 rounded-xl border border-white/10 print:bg-slate-50 print:border-none">
                            <h4 className="text-[10px] uppercase font-black text-emerald-300 mb-1 print:text-emerald-800">
                              Rekomendasi Jual
                            </h4>
                            <p className="text-xl font-black text-white print:text-slate-900">
                              {formatIDR(Math.ceil(pkg.totalHpp / 100000) * 100000)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-2 print:hidden border-t border-emerald-700/50 pt-6">
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-emerald-700 text-white py-2.5 rounded-xl flex justify-center items-center gap-2 text-xs font-bold transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>

                  <button
                    type="button"
                    onClick={handleResetLastInput}
                    className="flex-1 bg-white text-rose-700 py-2.5 rounded-xl flex justify-center items-center gap-2 text-xs font-bold border border-rose-200 shadow-sm transition-all active:scale-95"
                    title="Hapus data input terakhir"
                  >
                    <Trash2 className="w-4 h-4" /> Reset
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
                <h4 className="font-bold mb-2 uppercase text-[10px] text-slate-500 flex items-center gap-1 flex-wrap">
                  <Info className="w-3.5 h-3.5" /> Info Kurs
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black normal-case tracking-normal ${
                      isRateManual ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    {isRateManual ? 'Manual' : 'Update'}
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-medium opacity-90">
                  <div className="bg-white p-2 rounded-lg border">1 USD = {formatIDR(rates.usd)}</div>
                  <div className="bg-white p-2 rounded-lg border">1 SAR = {formatIDR(rates.sar)}</div>
                </div>
                {!isRateManual && lastUpdated && (
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    Diperbarui: {lastUpdated}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
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
          .sticky {
            top: 0 !important;
          }
          .print\\:w-full {
            max-width: 720px !important;
            margin: 0 auto !important;
          }
          .summary-row {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            align-items: start !important;
            column-gap: 10px !important;
            row-gap: 2px !important;
            margin: 0 !important;
          }
          .summary-label {
            white-space: normal !important;
            line-height: 1.15 !important;
            padding-right: 0 !important;
          }
          .summary-value {
            white-space: nowrap !important;
            text-align: right !important;
            line-height: 1.15 !important;
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

const NumericInput = ({ value, onChange, className, placeholder, title, readOnly = false }) => (
  <input
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    className={className}
    placeholder={placeholder}
    title={title}
    readOnly={readOnly}
    value={formatNumberWithSeparator(value)}
    onChange={readOnly ? undefined : (e) => onChange(sanitizeNumericInput(e.target.value))}
  />
);

export default App;
