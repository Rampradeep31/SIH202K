import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, AlertTriangle, Search } from 'lucide-react';
import { api } from '../services/api';

interface AuthorizedAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  surveyNo: string;
  district: string;
  taluk: string;
  village: string;
}

export const AuthorizedAccessDrawer: React.FC<AuthorizedAccessDrawerProps> = ({
  isOpen,
  onClose,
  surveyNo,
  district,
  taluk,
  village
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && surveyNo) {
      setLoading(true);
      setError(null);
      
      // Log the audit event — the backend attributes this to whatever role
      // is actually selected (X-User-Role header), not a self-declared one.
      api.recordAuditLog({
        survey_no: surveyNo,
        district: district || 'Unknown',
        taluk: taluk || 'Unknown',
        village: village || 'Unknown',
        access_type: 'Full Record Access',
        data_source: 'Authorized API',
        status: 'Requested',
        reason: 'User requested authorized land records'
      }).catch(err => console.error("Failed to log audit event", err));

      // Fetch the data — clearance tier is resolved server-side from the
      // caller's real role, not a value this component can choose. The
      // response is a flat object (land_identification, ownership_records,
      // guideline_and_stamp_duty, ...), not { data: {...} } — a previous
      // version of this component read `res.data` and `res.authorization_status
      // === 'Denied'`, neither of which ever matched the real shape, so it
      // silently showed "No data available" for every request regardless
      // of role or success.
      api.getAuthorizedLandRecord(surveyNo, district, taluk, village)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching authorized records', err);
          setError('Service temporarily unavailable.');
          setLoading(false);
        });
    }
  }, [isOpen, surveyNo, district, taluk, village]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#1A1F1C]/20 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full md:w-1/2 lg:w-[45%] xl:w-[40%] bg-[#FAF9F5] shadow-2xl z-50 overflow-y-auto border-l border-[#E2DDD5] flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#FAF9F5] z-10 px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#1E6B48]/10 text-[#1E6B48] rounded-xl border border-[#1E6B48]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1A1F1C]">Authorized Land Record Access</h2>
              <p className="text-xs text-[#5E6460] font-medium">TN-LGIP Secure Integration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#E2DDD5] text-[#5E6460] hover:text-[#1A1F1C] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 space-y-6">
          
          {/* Context Info */}
          <div className="bg-white rounded-2xl border border-[#E2DDD5] p-4 shadow-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#858B87]">Survey No</span>
                <p className="font-mono font-bold text-[#C04A26]">{surveyNo || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#858B87]">Village</span>
                <p className="font-semibold text-[#1A1F1C]">{village || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#858B87]">Taluk</span>
                <p className="font-semibold text-[#1A1F1C]">{taluk || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#858B87]">District</span>
                <p className="font-semibold text-[#1A1F1C]">{district || 'N/A'}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-[#1E6B48]/20 border-t-[#1E6B48] rounded-full animate-spin" />
              <p className="text-sm font-semibold text-[#5E6460]">Retrieving authorized records...</p>
            </div>
          ) : error ? (
            <div className="bg-[#C04A26]/10 rounded-2xl border border-[#C04A26]/20 p-6 flex flex-col items-center text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-[#C04A26]" />
              <div>
                <h3 className="font-bold text-[#1A1F1C]">Access Restricted</h3>
                <p className="text-sm text-[#C04A26]">{error}</p>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Authorization Status — reflects the real clearance tier returned
                  by the backend for the caller's actual role, not a fixed label */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
                data.authorization_status?.is_authorized
                  ? 'bg-[#1E6B48]/10 text-[#1E6B48] border-[#1E6B48]/20'
                  : 'bg-[#C04A26]/10 text-[#C04A26] border-[#C04A26]/20'
              }`}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">
                  {data.authorization_status?.clearance_level || 'PUBLIC_RESTRICTED'} — {data.authorization_status?.access_notice}
                </span>
              </div>

              {/* Land Identification & Patta */}
              {data.land_identification && (
                <section>
                  <h3 className="text-sm font-bold text-[#1A1F1C] uppercase tracking-wider mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[#858B87]" />
                    Survey & Patta Details
                  </h3>
                  <div className="bg-white rounded-xl border border-[#E2DDD5] p-4 shadow-xs grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#858B87] block">Survey Number</span>
                      <span className="font-mono font-bold text-[#1A1F1C]">{data.land_identification.survey_number}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#858B87] block">Patta Number</span>
                      <span className="font-mono font-bold text-[#1A1F1C]">{data.land_identification.patta_number}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#858B87] block">Owner Name(s)</span>
                      <span className="font-semibold text-[#1A1F1C]">{data.ownership_records?.pattadhar_name || 'Restricted'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#858B87] block">Area</span>
                      <span className="text-[#1A1F1C]">{data.land_identification.area_acres} acres ({data.land_identification.area_ha} ha)</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Encumbrance Details */}
              {data.property_encumbrance && (
                <section>
                  <h3 className="text-sm font-bold text-[#1A1F1C] uppercase tracking-wider mb-3 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-[#858B87]" />
                    Encumbrance Summary
                  </h3>
                  <div className="bg-white rounded-xl border border-[#E2DDD5] p-4 shadow-xs">
                    <p className="text-sm text-[#1A1F1C] mb-2"><span className="font-semibold">Status:</span> {data.property_encumbrance.summary}</p>
                    <p className="text-xs text-[#5E6460]"><span className="font-semibold">Search Period:</span> {data.property_encumbrance.search_period}</p>
                  </div>
                </section>
              )}

              {/* Valuation & Zoning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.guideline_and_stamp_duty && (
                  <div className="bg-white rounded-xl border border-[#E2DDD5] p-4 shadow-xs">
                    <h4 className="text-[10px] uppercase font-bold text-[#858B87] mb-1">Guideline Value</h4>
                    <p className="text-lg font-bold text-[#1A1F1C]">₹{data.guideline_and_stamp_duty.guideline_value_per_unit?.toLocaleString()} {data.guideline_and_stamp_duty.unit_class}</p>
                    <p className="text-xs text-[#5E6460] mt-1">Total parcel value: ₹{data.guideline_and_stamp_duty.total_parcel_guideline_value_inr?.toLocaleString()}</p>
                  </div>
                )}
                {data.land_use_zoning && (
                  <div className="bg-white rounded-xl border border-[#E2DDD5] p-4 shadow-xs">
                    <h4 className="text-[10px] uppercase font-bold text-[#858B87] mb-1">Land Use Zone</h4>
                    <p className="text-sm font-bold text-[#1A1F1C]">{data.land_use_zoning.master_plan_zone}</p>
                    <p className="text-[10px] text-[#5E6460] font-semibold mt-1 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                      {data.land_use_zoning.conversion_regulations}
                    </p>
                  </div>
                )}
              </div>

              {/* Data Provenance Footer */}
              <div className="pt-4 border-t border-[#E2DDD5] mt-6">
                <h4 className="text-[10px] font-bold text-[#858B87] uppercase tracking-wider mb-2">Data Provenance</h4>
                <div className="bg-[#FAF9F5] rounded-xl border border-[#E2DDD5] p-3 text-[10px] text-[#5E6460] space-y-1 font-mono">
                  <p><span className="font-bold">Source:</span> Tamil Nadu Government / Authorized API</p>
                  <p><span className="font-bold">Geography:</span> {village}, {taluk}, {district}</p>
                  <p><span className="font-bold">Access Time:</span> {new Date(data.authorization_status?.timestamp || Date.now()).toLocaleString()}</p>
                  <p className="text-[#1E6B48] mt-2 font-bold">Audit log recorded successfully.</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-semibold text-[#5E6460]">No data available for this location.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
