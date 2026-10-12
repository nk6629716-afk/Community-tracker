import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  MapPin, 
  Printer, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Download, 
  Copy, 
  Camera, 
  Upload, 
  RefreshCw, 
  Scan, 
  AlertCircle,
  ExternalLink,
  LocateFixed,
  X,
  Radio
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Vector3, Vector4 } from '../components/common/DecorativeVectors';

interface QuickQRProps {
  onQuickReport: (locationName: string, coords?: { lat: number; lng: number }) => void;
}

interface Station {
  name: string;
  zone: string;
  desc: string;
  coords: string;
}

export const QuickQR: React.FC<QuickQRProps> = ({ onQuickReport }) => {
  // Mode switcher: Generate Placards vs Scan QR Code
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');

  // Station generation state
  const [selectedStation, setSelectedStation] = useState<string>('Connaught Place Inner Circle');
  const [customStation, setCustomStation] = useState<string>('');
  const [customZone, setCustomZone] = useState<string>('Custom Designated Zone');
  const [customCoords, setCustomCoords] = useState<string>('28.6139, 77.2090');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Generated QR output state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // In-app Scanner state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    rawText: string;
    locationName?: string;
    coords?: { lat: number; lng: number };
    isCitypulseUrl: boolean;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const predefinedStations: Station[] = [
    {
      name: 'Connaught Place Inner Circle',
      zone: 'Rajiv Chowk Metro Hub',
      desc: 'High transit pedestrian plaza and central commercial core',
      coords: '28.6315, 77.2167',
    },
    {
      name: 'Chandni Chowk Market Gate',
      zone: 'Old Delhi Heritage District',
      desc: 'High footfall bazaar lane and historic market corridor',
      coords: '28.6506, 77.2303',
    },
    {
      name: 'Lajpat Nagar Central Market',
      zone: 'South Delhi Commercial Hub',
      desc: 'Dense pedestrian shopping promenade and transit shelter',
      coords: '28.5677, 77.2433',
    },
    {
      name: 'Rohini Sector 14 Transit Point',
      zone: 'North West Delhi Arterial Hub',
      desc: 'Bus stop cluster and residential connector crossing',
      coords: '28.7159, 77.1189',
    },
    {
      name: 'Dwarka Sector 12 Metro Station',
      zone: 'South West Delhi Transit Node',
      desc: 'Sub-city commuter node and institutional access junction',
      coords: '28.5921, 77.0460',
    },
    {
      name: 'Delhi University North Campus',
      zone: 'Vishwavidyalaya Student Corridor',
      desc: 'High student pedestrian density and university transit stop',
      coords: '28.6896, 77.2124',
    },
    {
      name: 'Hauz Khas Pedestrian Gate',
      zone: 'South Delhi Urban Village',
      desc: 'Heritage park boundary and café promenade corridor',
      coords: '28.5535, 77.1944',
    },
  ];

  const activeStation: Station = predefinedStations.find((s) => s.name === selectedStation) || {
    name: customStation || 'Delhi Community Point',
    zone: customZone || 'Custom Location',
    desc: 'Custom designated community reporting zone in Delhi NCR',
    coords: customCoords || '28.6139, 77.2090',
  };

  // Generate real, high-resolution scannable QR Code
  useEffect(() => {
    let isCancelled = false;
    const generateCode = async () => {
      try {
        setIsGeneratingQr(true);
        const [latStr, lngStr] = (activeStation.coords || '28.6139, 77.2090')
          .split(',')
          .map((s) => s.trim());
        
        const baseUrl = window.location.origin + window.location.pathname;
        const targetUrl = `${baseUrl}?tab=report&location=${encodeURIComponent(
          activeStation.name
        )}&lat=${latStr}&lng=${lngStr}&qr=1`;

        if (!isCancelled) {
          setQrTargetUrl(targetUrl);
        }

        // Generate data URL with high error correction (H)
        const url = await QRCode.toDataURL(targetUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#0a0f1d',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });

        if (!isCancelled) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate scannable QR code:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingQr(false);
        }
      }
    };

    generateCode();
    return () => {
      isCancelled = true;
    };
  }, [activeStation.name, activeStation.coords]);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!qrTargetUrl) return;
    navigator.clipboard.writeText(qrTargetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Citypulse_QR_${activeStation.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordsStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        setCustomCoords(coordsStr);
        setCustomStation(customStation || 'My Current Location Point');
        setSelectedStation(customStation || 'My Current Location Point');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not acquire GPS position. Please enter manually.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Helper to parse detected QR text
  const parseDecodedText = (text: string) => {
    try {
      const parsedUrl = new URL(text);
      const isCitypulse = parsedUrl.origin === window.location.origin || text.includes('tab=report');
      const location = parsedUrl.searchParams.get('location') || undefined;
      const lat = parsedUrl.searchParams.get('lat');
      const lng = parsedUrl.searchParams.get('lng');
      
      const coords = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

      setScanResult({
        rawText: text,
        locationName: location ? decodeURIComponent(location) : undefined,
        coords,
        isCitypulseUrl: isCitypulse,
      });
    } catch {
      // Plain text payload or non-URL
      setScanResult({
        rawText: text,
        isCitypulseUrl: false,
      });
    }
  };

  // In-app Camera Scanner Methods
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions or upload an image.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        stopCamera();
        parseDecodedText(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  // File Upload Decoder
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            parseDecodedText(code.data);
          } else {
            alert('No valid QR code could be detected in this image. Please ensure the QR code is clearly visible and in focus.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [activeLat, activeLng] = (activeStation.coords || '28.6139, 77.2090')
    .split(',')
    .map((s) => parseFloat(s.trim()));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-2 -bottom-2 w-28 h-24 opacity-15 text-[#123B5D] pointer-events-none hidden sm:block">
          <Vector4 className="w-full h-full" />
        </div>
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-[#123B5D] border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-[#2F6F8F]" />
            Physical-Digital Civic Bridge
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE SCANNABLE QR
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17202A] tracking-tight relative z-10">
          Civic QR Code Stations & Scanner
        </h1>
        <p className="text-sm text-[#667085] mt-1 max-w-2xl leading-relaxed relative z-10">
          Deploy printable QR placards at public bus stops, university gates, and public parks. When residents scan with their phone camera, Citypulse opens with their exact GPS coordinates auto-locked.
        </p>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              setActiveTab('generate');
              stopCamera();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Station Placards</span>
          </button>

          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Live Camera Scanner & Upload</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PLACARD GENERATOR */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Station Selector & Configuration */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Select Public Station
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {predefinedStations.length} Preset Points
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {predefinedStations.map((station) => {
                const isSelected = selectedStation === station.name;
                return (
                  <div
                    key={station.name}
                    onClick={() => setSelectedStation(station.name)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#123B5D] bg-[#123B5D]/5 ring-1 ring-[#123B5D]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#2F6F8F]" />
                        <span>{station.name}</span>
                      </h4>
                      {isSelected && <Check className="w-4 h-4 text-[#123B5D]" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{station.desc}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{station.zone}</span>
                      <span>📍 {station.coords}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Location Creator */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Create Custom Civic Station:
              </label>
              <input
                type="text"
                value={customStation}
                onChange={(e) => {
                  setCustomStation(e.target.value);
                  setSelectedStation(e.target.value);
                }}
                placeholder="e.g. North Gate Bus Shelter #4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-[#123B5D]"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customCoords}
                  onChange={(e) => setCustomCoords(e.target.value)}
                  placeholder="28.6139, 77.2090"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-[#123B5D]"
                />
                <button
                  type="button"
                  disabled={isLocating}
                  onClick={handleUseCurrentLocation}
                  className="px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#123B5D] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Detect GPS from current device"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'My GPS'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Printable Placard Preview Card */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-6 sm:p-8 shadow-sm text-center space-y-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-16 right-4 w-28 h-28 opacity-10 text-[#123B5D] pointer-events-none">
              <Vector3 className="w-full h-full" />
            </div>

            {/* Top Official Header */}
            <div className="w-full bg-[#123B5D] text-white py-3 px-4 rounded-xl shadow-xs relative z-10">
              <div className="text-[11px] font-mono tracking-widest uppercase text-sky-200">
                MUNICIPAL CIVIC MONITORING STATION
              </div>
              <div className="text-lg font-black tracking-tight">Citypulse Point</div>
            </div>

            {/* Station Title */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#2F6F8F] uppercase tracking-wider">
                OFFICIAL REPORTING PLACARD
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeStation.name}
              </h2>
              <p className="text-xs text-slate-500">{activeStation.zone}</p>
              <p className="text-[11px] font-mono text-slate-400">GPS: {activeStation.coords}</p>
            </div>

            {/* REAL High-Resolution Scannable QR Code */}
            <div className="relative p-3 bg-white border-4 border-slate-950 rounded-2xl shadow-xl inline-block group">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Scannable QR code for ${activeStation.name}`}
                  className="w-56 h-56 object-contain block mx-auto transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
                  <span className="text-xs">Generating Scannable QR...</span>
                </div>
              )}

              {/* Center Citypulse Identifier Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-white rounded-lg border-2 border-slate-950 flex items-center justify-center shadow-md">
                  <span className="font-black text-xs text-[#123B5D]">CP</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 max-w-xs">
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                Point any smartphone camera to immediately submit an issue at this location.
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Works with iPhone Camera, Google Lens, and all standard QR scanners.
              </p>
            </div>

            {/* Direct Link Preview & Copy */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                <span>Encoded Destination URL:</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[#123B5D] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-600 truncate bg-white p-1.5 rounded border border-slate-200">
                {qrTargetUrl || 'Generating URL...'}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  onQuickReport(activeStation.name, !isNaN(activeLat) && !isNaN(activeLng) ? { lat: activeLat, lng: activeLng } : undefined)
                }
                className="w-full py-3 bg-[#123B5D] hover:bg-[#0B263D] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-97 cursor-pointer"
              >
                <span>Test Scan & Report Here</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Download PNG image of this QR code"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Print official station placard"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Placard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IN-APP LIVE CAMERA SCANNER & UPLOAD */}
      {activeTab === 'scan' && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Civic QR Code Reader
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan physical station placards using your device camera or upload a saved QR photo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Upload QR Image</span>
              </button>

              {!isScanning ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0B263D] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Camera Viewer / Scanning Area */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-w-lg mx-auto flex items-center justify-center border-2 border-slate-800 shadow-2xl">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isScanning ? 'hidden' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isScanning && (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <Scan className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">Camera Offline</h4>
                  <p className="text-slate-400 text-xs max-w-xs">
                    Click "Start Camera" to scan live or click "Upload QR Image" to decode an existing photo or screenshot.
                  </p>
                </div>
              </div>
            )}

            {/* Scanning Laser Reticle Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-300" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-300" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-300" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-300" />
                  
                  {/* Laser line */}
                  <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="px-3 py-1 rounded-full bg-black/75 text-cyan-300 text-xs font-mono font-bold tracking-wider">
                    ALIGN QR CODE IN FRAME
                  </span>
                </div>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Decoded QR Results Display */}
          {scanResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 text-white space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-white">QR Code Successfully Decoded!</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {scanResult.locationName ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-cyan-300 uppercase font-mono font-bold block">
                      Target Civic Station:
                    </span>
                    <strong className="text-base text-white">{scanResult.locationName}</strong>
                    {scanResult.coords && (
                      <span className="block text-xs font-mono text-slate-400 mt-0.5">
                        📍 GPS: {scanResult.coords.lat}, {scanResult.coords.lng}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onQuickReport(scanResult.locationName!, scanResult.coords)}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <span>Lodge Civic Signal at this Station &rarr;</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-[10px] text-slate-400 block font-mono">Decoded Payload:</span>
                    <span className="font-mono text-slate-200 break-all">{scanResult.rawText}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onQuickReport(scanResult.rawText)}
                    className="w-full py-2.5 bg-[#123B5D] hover:bg-[#0B263D] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Use Decoded Text as Location & Lodge Signal &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
