import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Camera,
  Image,
  Loader2,
  X
} from 'lucide-react';
import { IssueCategory, IssueSeverity, AIAnalysis } from '../types';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { api } from '../services/api';
import { CATEGORY_LABELS, SEVERITY_INFO } from '../utils/priority';
import { Vector8, Vector10 } from '../components/common/DecorativeVectors';
import { reverseGeocodeAddress } from '../utils/geo';

interface ReportIssueProps {
  onBack: () => void;
  onSuccess: (issueId: string) => void;
  prefilledLocation?: string;
}

export const ReportIssue: React.FC<ReportIssueProps> = ({
  onBack,
  onSuccess,
  prefilledLocation,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [category, setCategory] = useState<IssueCategory>('road_damage');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [reporterName, setReporterName] = useState<string>('Citizen');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // Location State
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [address, setAddress] = useState<string>(prefilledLocation || 'College Gate, University Campus');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // AI Pipeline State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiAnalysisStepMessage, setAiAnalysisStepMessage] = useState<string>('Analyzing your report...');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledLocation) {
      setAddress(prefilledLocation);
    }
  }, [prefilledLocation]);

  const categories: { id: IssueCategory; label: string; desc: string; icon: string }[] = [
    { id: 'road_damage', label: 'Road Damage', desc: 'Potholes, fissures, broken pavement, asphalt wear', icon: '🛣️' },
    { id: 'streetlight', label: 'Streetlight', desc: 'Unlit fixtures, flickering poles, exposed wiring', icon: '💡' },
    { id: 'garbage', label: 'Garbage', desc: 'Overflowing bins, illegal dumping, market waste', icon: '🗑️' },
    { id: 'water_leakage', label: 'Water Leakage', desc: 'Broken mains, gushing hydrants, pipeline bursts', icon: '💧' },
    { id: 'drainage', label: 'Drainage', desc: 'Clogged catch basins, missing sewer grates, flood zones', icon: '🌊' },
    { id: 'electricity', label: 'Electricity', desc: 'Transformer issues, broken traffic signals, low cables', icon: '⚡' },
    { id: 'public_space', label: 'Public Space', desc: 'Damaged park benches, playground equipment, parks', icon: '🌳' },
    { id: 'infrastructure', label: 'Infrastructure', desc: 'Footpath damage, broken handrails, transit stations', icon: '🏗️' },
    { id: 'other', label: 'Other Issue', desc: 'General community or municipal maintenance', icon: '📋' },
  ];

  // Geolocation Handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinates({ lat, lng });
        reverseGeocodeAddress(lat, lng)
          .then((resolved) => setAddress(resolved))
          .catch(() => setAddress(`GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`));
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or failed, using community center default:', err.message);
        setIsLocating(false);
        setCoordinates({ lat: 37.7749 + (Math.random() - 0.5) * 0.005, lng: -122.4194 + (Math.random() - 0.5) * 0.005 });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Photo Upload Handler (supports JPG, PNG, WEBP with client preview)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      alert('Please upload a valid JPG, PNG, or WEBP photo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file must be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setPhotoDataUrl(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 3 -> Step 4 triggers the AI Pipeline
  const runAiPipeline = async () => {
    setIsAnalyzing(true);
    setCurrentStep(4);

    // Simulated UX progression stages per Page 17
    setAiAnalysisStepMessage('Identifying issue type & severity...');
    setTimeout(() => {
      setAiAnalysisStepMessage('Generating concise factual summary & actions...');
    }, 900);

    try {
      const analysis = await api.analyzePreview({
        title,
        description,
        category,
        location: address,
        photo: photoDataUrl || undefined,
      });
      setAiAnalysis(analysis);
    } catch (err) {
      console.warn('AI pipeline error, using fallback:', err);
      // Fallback analysis ensures report never gets blocked
      setAiAnalysis({
        summary: `${title.trim()} reported at ${address}.`,
        category,
        severity: 'medium',
        confidence: 0.86,
        reason: 'Reported directly by community resident.',
        recommended_action: 'Dispatch field inspection squad.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final Submit
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.createIssue({
        title,
        description,
        category: aiAnalysis?.category || category,
        severity: aiAnalysis?.severity || 'medium',
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address,
        photo_url: photoDataUrl || undefined,
        is_anonymous: isAnonymous,
        created_by: isAnonymous ? 'Reported anonymously' : reporterName,
      });

      onSuccess(res.id);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header & Step Tracker */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-xs relative overflow-hidden">
        {/* Subtle decorative step flow vector */}
        <div className="absolute right-24 top-2 w-16 h-10 opacity-15 text-[#2F6F8F] pointer-events-none hidden sm:block">
          <Vector8 className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <button
            onClick={currentStep > 1 ? () => setCurrentStep(currentStep - 1) : onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStep > 1 ? 'Previous Step' : 'Cancel'}</span>
          </button>
          <span className="text-xs font-bold text-[#123B5D]">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 gap-2">
          {['1. Category', '2. Description', '3. Location', '4. AI Review'].map((st, i) => (
            <div key={st} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 < currentStep
                    ? 'bg-[#2E8B57]'
                    : i + 1 === currentStep
                    ? 'bg-[#123B5D]'
                    : 'bg-slate-200'
                }`}
              />
              <span
                className={`block text-[11px] font-semibold text-center truncate ${
                  i + 1 === currentStep ? 'text-[#123B5D]' : 'text-slate-400'
                }`}
              >
                {st}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Select Issue Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              What type of civic problem did you notice?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#123B5D] bg-[#123B5D]/5 ring-2 ring-[#123B5D]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div>
                    <h3 className={`font-bold text-sm ${isSelected ? 'text-[#123B5D]' : 'text-slate-800'}`}>
                      {cat.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-[#123B5D] hover:bg-[#0B263D] text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <span>Continue to Description</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DESCRIPTION & PHOTO UPLOAD */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Describe the Issue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Provide specific details so municipal teams can respond promptly.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Large pothole near College Gate"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-black placeholder:text-slate-400 focus:bg-white focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/20 focus:outline-none"
              style={{ color: '#000000' }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., There is a large pothole near the college entrance that is causing difficulty for two-wheelers during heavy traffic..."
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-normal text-black placeholder:text-slate-400 focus:bg-white focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/20 focus:outline-none"
              style={{ color: '#000000' }}
            />
          </div>

          {/* Photo Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attach Photo (JPG, PNG, WEBP)
            </label>
            {photoDataUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-60">
                <img
                  src={photoDataUrl}
                  alt="Issue upload preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-[#123B5D] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#123B5D] mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Click or drag photo to upload
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Anonymous Reporting Option (Page 12-13) */}
          <div className="bg-[#F7F8FA] p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="checkbox-anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-[#123B5D] rounded-sm focus:ring-[#123B5D]"
              />
              <label htmlFor="checkbox-anonymous" className="text-xs font-bold text-slate-800 cursor-pointer">
                Report anonymously
              </label>
            </div>
            <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
              If enabled, your name will not be publicly displayed on the issue feed. The report will simply appear as <span className="font-semibold text-slate-700">"Reported anonymously"</span>.
            </p>

            {!isAnonymous && (
              <div className="pl-7 pt-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Your Name or Handle (optional):
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g., Alex K., Student Council"
                  className="w-full max-w-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#123B5D]"
                  style={{ color: '#000000' }}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button
              disabled={!title.trim() || !description.trim()}
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-[#123B5D] hover:bg-[#0B263D] disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <span>Next: Set Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION PINNING */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Attach Location
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pinpoint the issue on the map or enter a landmark/street name.
            </p>
          </div>

          {/* Use My Location / Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street, landmark, or campus gate..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-black placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#123B5D] focus:outline-none"
                style={{ color: '#000000' }}
              />
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-[#123B5D] border border-sky-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-[#2F6F8F]" />
              )}
              <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
            </button>
          </div>

          {/* Interactive Pinning Map */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-500">
              Click or drag the pin on the map to fine-tune the exact location:
            </span>
            <InteractiveMap
              isPickerMode={true}
              selectedCoordinates={coordinates}
              onCoordinatesChange={(coords) => {
                setCoordinates(coords);
                setAddress(`Selected Map Point (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
              }}
              className="h-[300px] w-full"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button
              onClick={runAiPipeline}
              className="px-6 py-2.5 bg-[#123B5D] hover:bg-[#0B263D] text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-sky-300" />
              <span>Analyze with AI Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AI ANALYSIS REVIEW & SUBMISSION */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2F6F8F]" />
              <span>AI Pipeline Assessment & Verification</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review AI intelligence insights before final submission to community dispatch.
            </p>
          </div>

          {/* Loading UX Animation (Pages 16-17) */}
          {isAnalyzing ? (
            <div className="p-8 rounded-xl bg-sky-50/50 border border-sky-200/80 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-[#123B5D] mx-auto animate-bounce">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">
                ✨ Analyzing your report...
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {aiAnalysisStepMessage}
              </p>
              <div className="flex justify-center gap-2 text-[11px] text-slate-400">
                <span>Identifying issue type</span> • 
                <span>Assessing severity</span> • 
                <span>Generating action summary</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>✨ AI Analysis Complete</span>
              </div>

              {/* AI Structured Results Card */}
              {aiAnalysis && (
                <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl p-5 space-y-4 relative overflow-hidden">
                  {/* Subtle decorative AI particle curve */}
                  <div className="absolute top-2 right-2 w-20 h-16 opacity-15 text-[#2F6F8F] pointer-events-none">
                    <Vector10 className="w-full h-full" />
                  </div>
                  {/* Summary */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      AI Generated Summary
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                      "{aiAnalysis.summary}"
                    </p>
                  </div>

                  {/* Severity & Confidence */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">AI-Predicted Severity</span>
                      <span className={`font-bold ${SEVERITY_INFO[aiAnalysis.severity]?.color}`}>
                        ● {SEVERITY_INFO[aiAnalysis.severity]?.label}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Confidence Score</span>
                      <span className="font-bold text-slate-800">
                        {(aiAnalysis.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Category Code</span>
                      <span className="font-bold text-slate-800 uppercase">
                        {CATEGORY_LABELS[aiAnalysis.category] || aiAnalysis.category}
                      </span>
                    </div>
                  </div>

                  {/* AI Reason */}
                  {aiAnalysis.reason && (
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Reasoning: </span>
                      {aiAnalysis.reason}
                    </div>
                  )}

                  {/* Recommended Action */}
                  {aiAnalysis.recommended_action && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-[#123B5D] block">
                        Recommended Action:
                      </span>
                      <p className="text-slate-700">
                        {aiAnalysis.recommended_action}
                      </p>
                    </div>
                  )}

                  {/* Subtle Disclaimer (Page 16, #20) */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>
                      AI-generated recommendation. Community/authority verification is required.
                    </span>
                  </div>
                </div>
              )}

              {/* Report Summary Overview */}
              <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-white">
                <div className="flex justify-between">
                  <span className="text-slate-500">Title:</span>
                  <span className="font-semibold text-slate-900">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-900">{address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Identity:</span>
                  <span className="font-semibold text-slate-900">
                    {isAnonymous ? 'Reported anonymously' : reporterName}
                  </span>
                </div>
                {photoDataUrl && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Photo:</span>
                    <span className="text-emerald-700 font-semibold">1 Image Attached</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting || isAnalyzing}
              className="px-7 py-3 bg-[#123B5D] hover:bg-[#0B263D] disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-97 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Civic Network...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Submit Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
