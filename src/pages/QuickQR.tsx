import React, { useState } from 'react';
import { QrCode, MapPin, Printer, ArrowRight, Sparkles, Check, Download } from 'lucide-react';
import { Vector3, Vector4 } from '../components/common/DecorativeVectors';

interface QuickQRProps {
  onQuickReport: (locationName: string) => void;
}

export const QuickQR: React.FC<QuickQRProps> = ({ onQuickReport }) => {
  const [selectedStation, setSelectedStation] = useState<string>('College Gate');
  const [customStation, setCustomStation] = useState<string>('');

  const predefinedStations = [
    {
      name: 'College Gate',
      zone: 'North Campus Entrance',
      desc: 'High transit pedestrian gate and vehicle drop-off zone',
      coords: '37.7749, -122.4194',
    },
    {
      name: 'Library Road',
      zone: 'Academic Quadrangle',
      desc: 'Heavy student pathway near central reading halls',
      coords: '37.7725, -122.4147',
    },
    {
      name: 'Bus Stop 4',
      zone: 'Municipal Transit Hub',
      desc: 'Frequent passenger wait shelter and commuter node',
      coords: '37.7781, -122.4215',
    },
    {
      name: 'Market Square',
      zone: 'Civic Commercial District',
      desc: 'High footfall public shopping and sanitation area',
      coords: '37.7760, -122.4172',
    },
    {
      name: 'Hostel Block C',
      zone: 'Student Residential Quarters',
      desc: 'Dormitory perimeter and residential water/waste junction',
      coords: '37.7712, -122.4230',
    },
  ];

  const activeStation = predefinedStations.find((s) => s.name === selectedStation) || {
    name: customStation || 'Campus Point',
    zone: 'Custom Location',
    desc: 'Custom designated community reporting zone',
    coords: '37.7749, -122.4194',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative Vector 4 (signal broadcast) */}
        <div className="absolute -right-2 -bottom-2 w-28 h-24 opacity-15 text-[#123B5D] pointer-events-none hidden sm:block">
          <Vector4 className="w-full h-full" />
        </div>
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-[#123B5D] border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-[#2F6F8F]" />
            Physical-Digital Bridge
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17202A] tracking-tight relative z-10">
          QR Code Quick Report Stations
        </h1>
        <p className="text-sm text-[#667085] mt-1 max-w-2xl leading-relaxed relative z-10">
          Deploy printable QR placards at public bus stops, university gates, and public parks. When residents scan with their camera, it opens Citypulse with their exact location automatically locked in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Station Selector & Configuration */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-slate-900">
            Select a Public Station
          </h3>

          <div className="space-y-2.5">
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
                      {station.name}
                    </h4>
                    {isSelected && <Check className="w-4 h-4 text-[#123B5D]" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{station.desc}</p>
                  <span className="inline-block text-[10px] font-mono text-slate-400 mt-1">
                    {station.coords}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Custom location input */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Or Create Custom Station:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customStation}
                onChange={(e) => {
                  setCustomStation(e.target.value);
                  setSelectedStation(e.target.value);
                }}
                placeholder="e.g., North Cafeteria Plaza"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-[#123B5D]"
              />
            </div>
          </div>
        </div>

        {/* Printable Placard Preview Card */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 shadow-sm text-center space-y-6 flex flex-col items-center relative overflow-hidden">
          {/* Subtle civic watermark Vector 3 */}
          <div className="absolute top-16 right-4 w-28 h-28 opacity-10 text-[#123B5D] pointer-events-none">
            <Vector3 className="w-full h-full" />
          </div>
          <div className="w-full bg-[#123B5D] text-white py-3 px-4 rounded-xl shadow-xs relative z-10">
            <div className="text-[11px] font-mono tracking-widest uppercase text-sky-200">
              MUNICIPAL CIVIC MONITORING
            </div>
            <div className="text-lg font-black tracking-tight">Citypulse Point</div>
          </div>

          {/* Station Badge */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#2F6F8F] uppercase tracking-wider">
              OFFICIAL REPORTING STATION
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeStation.name}
            </h2>
            <p className="text-xs text-slate-500">{activeStation.zone}</p>
          </div>

          {/* Stylized QR Code Graphic */}
          <div className="relative p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-md inline-block">
            <QrCode className="w-44 h-44 text-slate-900" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 bg-white rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                <span className="font-black text-xs text-[#123B5D]">CP</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 max-w-xs leading-relaxed font-medium">
            Point your smartphone camera to immediately submit an issue at this location.
          </div>

          {/* Simulated Quick Action */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onQuickReport(activeStation.name)}
              className="w-full py-3 bg-[#123B5D] hover:bg-[#0B263D] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-97 cursor-pointer"
            >
              <span>Test Scan & Report Here</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Station Placard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
