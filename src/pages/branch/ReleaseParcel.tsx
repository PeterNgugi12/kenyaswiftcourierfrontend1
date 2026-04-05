import { useState, useEffect } from "react";
import { Search, Unlock, CheckCircle, AlertTriangle, Printer, Shield, CreditCard, Loader2, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranchAuth } from "@/hooks/useBranchAuth";
import { formatCurrency } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import api from "@/api/axios";

type Step = "search" | "details" | "payment" | "identity" | "complete";

interface Parcel {
  id: string;
  tracking_number: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description?: string; // Make it optional since it might be missing
  origin_branch: string;
  destination_branch: string;
  weight: string | number;
  amount: string | number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'destination';
  status: 'pending' | 'booked' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  trip?: {
    trip_number: string;
    vehicle_plate: string;
    driver_name: string;
    driver_phone: string;
  };
  branch?: {
    name: string;
    town: string;
  };
}

interface Receipt {
  description: any;
  receipt_number: string;
  tracking_number: string;
  generated_at: string;
  company: {
    name: string;
    code: string;
    logo: string | null;
    contact: {
      phone: string;
      email: string;
      website: string;
    };
  };
  origin_branch: {
    name: string;
    code: string;
    town: string;
    address: string;
  };
  served_by: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  sender: {
    name: string;
    phone: string;
  };
  receiver: {
    name: string;
    phone: string;
  };
  collector: {
    name: string;
    id_number: string;
    phone: string;
    relationship: string;
  };
  parcel: {
    tracking_number: string;
    description: string;
    weight: string;
    amount: string;
    payment_method: string;
    payment_status: string;
    status: string;
    destination: string;
    booked_at: string;
    released_at: string;
  };
  footer: {
    thank_you: string;
    message: string;
    website: string;
    support: string;
    disclaimer: string;
  };
  qr_data: string;
}

// Helper to get description from localStorage
const getStoredDescription = (trackingNumber: string): string | null => {
  try {
    const stored = localStorage.getItem(`parcel_${trackingNumber}`);
    if (stored) {
      const data = JSON.parse(stored);
      return data.description || null;
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }
  return null;
};

// Helper to store description in localStorage
const storeDescription = (trackingNumber: string, description: string) => {
  try {
    localStorage.setItem(`parcel_${trackingNumber}`, JSON.stringify({
      description,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error storing in localStorage:", error);
  }
};

const ReleaseParcel = () => {
  const { user } = useBranchAuth();
  const [step, setStep] = useState<Step>("search");
  const [trackingInput, setTrackingInput] = useState("");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [storedDescription, setStoredDescription] = useState<string | null>(null);
  
  const [identity, setIdentity] = useState({
    collectorName: "", 
    idNumber: "", 
    phone: "", 
    relationship: "Receiver",
  });
  
  const [payment, setPayment] = useState({ 
    method: "Cash", 
    confirmed: false,
    processing: false 
  });
  
  const [error, setError] = useState("");

  // Helper function to get description from various possible locations
  const getParcelDescription = (parcelData: Parcel | null, receiptData: Receipt | null, storedDesc: string | null): string => {
    console.log("🔍 Getting release parcel description from:");
    console.log("- parcelData?.description:", parcelData?.description);
    console.log("- receiptData?.parcel?.description:", receiptData?.parcel?.description);
    console.log("- receiptData?.description:", receiptData?.description);
    console.log("- storedDescription:", storedDesc);
    
    // Try all possible locations where description might be stored
    const description = (
      parcelData?.description || 
      receiptData?.parcel?.description || 
      receiptData?.description || 
      storedDesc ||
      '—'
    );
    
    console.log("✅ Final description:", description);
    return description;
  };

  // Helper function to get description for receipt view
  const getReceiptDescription = (): string => {
    return getParcelDescription(parcel, receipt, storedDescription);
  };

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log("📦 parcel state changed:", parcel);
    if (parcel) {
      console.log("📦 Full parcel object:", JSON.stringify(parcel, null, 2));
      console.log("📦 parcel description:", parcel.description);
      console.log("📦 parcel description type:", typeof parcel.description);
      
      // Check localStorage for description
      const stored = getStoredDescription(parcel.tracking_number);
      if (stored) {
        console.log("📦 Found stored description:", stored);
        setStoredDescription(stored);
      }
    }
  }, [parcel]);

  useEffect(() => {
    console.log("🧾 receipt state changed:", receipt);
    if (receipt) {
      console.log("🧾 Full receipt object:", JSON.stringify(receipt, null, 2));
      console.log("🧾 receipt parcel description:", receipt.parcel?.description);
    }
  }, [receipt]);

  const searchParcel = async () => {
    if (!trackingInput.trim()) {
      setError("Enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      console.log("🔍 Searching for parcel:", trackingInput);
      const response = await api.get(`/branch/parcels/tracking/${trackingInput}`);
      
      console.log("📡 Search response:", response.data);
      
      if (response.data.success) {
        console.log("✅ Parcel found:", response.data.data);
        console.log("✅ Parcel description from DB:", response.data.data.description);
        
        // Check localStorage for description
        const stored = getStoredDescription(trackingInput);
        if (stored) {
          console.log("✅ Found stored description:", stored);
          setStoredDescription(stored);
        }
        
        setParcel(response.data.data);
        setStep("details");
      }
    } catch (error: any) {
      console.error("❌ Failed to find parcel:", error);
      setError(error.response?.data?.message || 'Parcel not found');
      setParcel(null);
    } finally {
      setLoading(false);
    }
  };

  const collectPayment = async () => {
    if (!parcel) return;
    
    setPayment(p => ({ ...p, processing: true }));
    
    try {
      console.log("💰 Processing payment for parcel:", parcel.tracking_number);
      const response = await api.post('/branch/parcels/collect-payment', {
        parcel_id: parcel.id,
        payment_method: payment.method,
        amount: parcel.amount
      });
      
      console.log("💰 Payment response:", response.data);
      
      if (response.data.success) {
        console.log("✅ Payment collected successfully");
        setPayment(p => ({ ...p, confirmed: true }));
        toast.success('Payment collected successfully');
        
        // Update parcel payment status
        setParcel(prev => prev ? { ...prev, payment_status: 'paid' } : null);
      }
    } catch (error: any) {
      console.error("❌ Failed to collect payment:", error);
      toast.error(error.response?.data?.message || 'Failed to collect payment');
    } finally {
      setPayment(p => ({ ...p, processing: false }));
    }
  };

  const releaseParcel = async () => {
    if (!parcel) return;
    
    if (!identity.collectorName || !identity.idNumber || !identity.phone) {
      setError("All identity fields marked * are required.");
      return;
    }

    setReleasing(true);
    setError("");
    
    try {
      console.log("🔓 Releasing parcel:", parcel.tracking_number);
      console.log("📦 Release data:", {
        parcel_id: parcel.id,
        collector_name: identity.collectorName,
        collector_id_number: identity.idNumber,
        collector_phone: identity.phone,
        relationship: identity.relationship,
        payment_method: payment.method
      });
      
      const response = await api.post('/branch/parcels/release', {
        parcel_id: parcel.id,
        collector_name: identity.collectorName,
        collector_id_number: identity.idNumber,
        collector_phone: identity.phone,
        relationship: identity.relationship,
        payment_method: payment.method
      });
      
      console.log("📡 Release response:", response.data);
      
      if (response.data.success) {
        console.log("✅ Parcel released successfully");
        console.log("🧾 Receipt received:", response.data.data.receipt);
        console.log("🧾 Receipt description:", response.data.data.receipt.parcel?.description);
        setReceipt(response.data.data.receipt);
        setStep("complete");
        toast.success('Parcel released successfully');
      }
    } catch (error: any) {
      console.error("❌ Failed to release parcel:", error);
      setError(error.response?.data?.message || 'Failed to release parcel');
    } finally {
      setReleasing(false);
    }
  };

  const handleReset = () => {
    setStep("search");
    setParcel(null);
    setReceipt(null);
    setTrackingInput("");
    setStoredDescription(null);
    setIdentity({ collectorName: "", idNumber: "", phone: "", relationship: "Receiver" });
    setPayment({ method: "Cash", confirmed: false, processing: false });
    setError("");
  };

  const handlePrint = () => {
    if (!receipt) return;
    
    const description = getReceiptDescription();
    console.log("🖨️ Printing receipt with description:", description);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Release Receipt - ${receipt.tracking_number}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: #f3f4f6;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 16px;
              }
              
              .receipt {
                max-width: 400px;
                width: 100%;
                background: white;
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15);
              }
              
              /* Header */
              .header {
                background: linear-gradient(145deg, #0B2C4F 0%, #1A3F66 100%);
                padding: 28px 24px;
                color: white;
                position: relative;
              }
              
              .header::after {
                content: '';
                position: absolute;
                bottom: -20px;
                left: 0;
                right: 0;
                height: 40px;
                background: linear-gradient(to bottom right, transparent 49%, white 50%);
              }
              
              .company-name {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
                margin-bottom: 4px;
              }
              
              .company-tagline {
                font-size: 13px;
                opacity: 0.9;
                font-weight: 400;
              }
              
              .receipt-badge {
                position: absolute;
                top: 24px;
                right: 24px;
                background: #10B981;
                padding: 8px 16px;
                border-radius: 40px;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.5px;
                color: white;
              }
              
              /* Info Row */
              .info-row {
                background: #F8FAFC;
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #E2E8F0;
                font-size: 12px;
              }
              
              .info-left {
                color: #475569;
              }
              
              .info-right {
                font-weight: 600;
                color: #0B2C4F;
                font-family: 'Courier New', monospace;
              }
              
              /* Tracking Section */
              .tracking-section {
                padding: 24px;
                text-align: center;
                background: #F1F5F9;
              }
              
              .tracking-label {
                font-size: 11px;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
              }
              
              .tracking-number {
                font-size: 24px;
                font-weight: 800;
                font-family: 'Courier New', monospace;
                color: #0B2C4F;
                letter-spacing: 1px;
                word-break: break-all;
                background: white;
                padding: 12px 16px;
                border-radius: 16px;
                border: 1px solid #E2E8F0;
              }
              
              /* Section */
              .section {
                padding: 20px 24px;
                border-bottom: 1px solid #E2E8F0;
              }
              
              .section-title {
                font-size: 14px;
                font-weight: 700;
                color: #0B2C4F;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .section-icon {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #DBEAFE;
                color: #1E40AF;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
              }
              
              .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
              }
              
              .detail-label {
                font-size: 11px;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-bottom: 2px;
              }
              
              .detail-value {
                font-size: 15px;
                font-weight: 600;
                color: #0F172A;
              }
              
              .collector-card {
                background: #EFF6FF;
                border-radius: 16px;
                padding: 16px;
                margin-top: 8px;
              }
              
              .payment-card {
                background: #F0FDF4;
                border-radius: 16px;
                padding: 16px;
                margin-top: 8px;
              }
              
              .amount-large {
                font-size: 28px;
                font-weight: 800;
                color: #059669;
                margin: 8px 0;
              }
              
              /* Footer */
              .footer {
                background: #0F172A;
                padding: 24px;
                text-align: center;
              }
              
              .footer-message {
                color: #E2E8F0;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
              }
              
              .footer-note {
                color: #64748B;
                font-size: 11px;
              }
              
              .footer-disclaimer {
                color: #475569;
                font-size: 10px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px dashed #334155;
              }
              
              /* Print Button */
              .print-btn-container {
                padding: 20px;
                text-align: center;
                background: white;
              }
              
              .print-btn {
                background: #0B2C4F;
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 40px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                max-width: 280px;
                box-shadow: 0 4px 6px rgba(11, 44, 79, 0.2);
                transition: all 0.2s;
              }
              
              .print-btn:hover {
                background: #1A3F66;
                transform: translateY(-2px);
                box-shadow: 0 6px 8px rgba(11, 44, 79, 0.25);
              }
              
              @media print {
                body {
                  background: white;
                  padding: 0;
                }
                
                .receipt {
                  box-shadow: none;
                  border: 1px solid #E2E8F0;
                  max-width: 100%;
                }
                
                .print-btn-container {
                  display: none;
                }
                
                .header::after {
                  display: none;
                }
              }
              
              @media (max-width: 480px) {
                .grid-2 {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <!-- Header -->
              <div class="header">
                <div class="company-name">${receipt.company.name}</div>
                <div class="company-tagline">Parcel Release Receipt</div>
                <div class="receipt-badge">RELEASED</div>
              </div>
              
              <!-- Info Row -->
              <div class="info-row">
                <span class="info-left">Receipt No:</span>
                <span class="info-right">${receipt.receipt_number}</span>
              </div>
              <div class="info-row" style="border-top: none; padding-top: 0;">
                <span class="info-left">Date:</span>
                <span class="info-right">${receipt.generated_at}</span>
              </div>
              
              <!-- Tracking Number -->
              <div class="tracking-section">
                <div class="tracking-label">Tracking Number</div>
                <div class="tracking-number">${receipt.tracking_number}</div>
              </div>
              
              <!-- Parcel Info -->
              <div class="section">
                <div class="section-title">
                  <span class="section-icon">📦</span>
                  Parcel Information
                </div>
                <div class="grid-2">
                  <div>
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${description}</div>
                  </div>
                  <div>
                    <div class="detail-label">Weight</div>
                    <div class="detail-value">${receipt.parcel.weight}</div>
                  </div>
                  <div>
                    <div class="detail-label">From</div>
                    <div class="detail-value">${receipt.origin_branch.name}</div>
                  </div>
                  <div>
                    <div class="detail-label">To</div>
                    <div class="detail-value">${receipt.parcel.destination}</div>
                  </div>
                </div>
              </div>
              
              <!-- Sender & Receiver -->
              <div class="section">
                <div class="grid-2">
                  <div>
                    <div class="section-title" style="margin-bottom: 8px;">
                      <span class="section-icon" style="background: #DBEAFE;">📤</span>
                      Sender
                    </div>
                    <div class="detail-value">${receipt.sender.name}</div>
                    <div style="font-size: 12px; color: #475569; margin-top: 4px;">${receipt.sender.phone}</div>
                  </div>
                  <div>
                    <div class="section-title" style="margin-bottom: 8px;">
                      <span class="section-icon" style="background: #DCFCE7;">📥</span>
                      Receiver
                    </div>
                    <div class="detail-value">${receipt.receiver.name}</div>
                    <div style="font-size: 12px; color: #475569; margin-top: 4px;">${receipt.receiver.phone}</div>
                  </div>
                </div>
              </div>
              
              <!-- Collector Information -->
              <div class="section">
                <div class="section-title">
                  <span class="section-icon" style="background: #EFF6FF;">🆔</span>
                  Collector Information
                </div>
                <div class="collector-card">
                  <div class="grid-2">
                    <div>
                      <div class="detail-label">Name</div>
                      <div class="detail-value">${receipt.collector.name}</div>
                    </div>
                    <div>
                      <div class="detail-label">ID Number</div>
                      <div class="detail-value">${receipt.collector.id_number}</div>
                    </div>
                    <div>
                      <div class="detail-label">Phone</div>
                      <div class="detail-value">${receipt.collector.phone}</div>
                    </div>
                    <div>
                      <div class="detail-label">Relationship</div>
                      <div class="detail-value">${receipt.collector.relationship}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Payment Information -->
              <div class="section">
                <div class="section-title">
                  <span class="section-icon" style="background: #F0FDF4;">💰</span>
                  Payment Information
                </div>
                <div class="payment-card">
                  <div class="detail-label">Amount</div>
                  <div class="amount-large">${receipt.parcel.amount}</div>
                  <div style="margin-top: 12px;">
                    <div class="grid-2">
                      <div>
                        <div class="detail-label">Method</div>
                        <div class="detail-value">${receipt.parcel.payment_method}</div>
                      </div>
                      <div>
                        <div class="detail-label">Status</div>
                        <div class="detail-value" style="color: #059669;">${receipt.parcel.payment_status}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Release Info -->
              <div class="section" style="border-bottom: none;">
                <div class="grid-2">
                  <div>
                    <div class="detail-label">Released By</div>
                    <div class="detail-value">${receipt.served_by.name}</div>
                  </div>
                  <div>
                    <div class="detail-label">Released At</div>
                    <div class="detail-value">${receipt.parcel.released_at}</div>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <div class="footer-message">${receipt.footer.thank_you}</div>
                <div class="footer-note">${receipt.footer.message}</div>
                <div class="footer-disclaimer">${receipt.footer.disclaimer}</div>
              </div>
              
              <!-- Print Button -->
              <div class="print-btn-container">
                <button class="print-btn" onclick="window.print()">
                  🖨️ Print Receipt
                </button>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateIdentity = (field: string, value: string) => {
    setIdentity(prev => ({ ...prev, [field]: value }));
  };

  if (step === "complete" && receipt) {
    const description = getReceiptDescription();
    console.log("🎯 Rendering receipt with description:", description);
    
    return (
      <div className="animate-fade-in max-w-lg mx-auto px-4 sm:px-0">
        <div className="form-section p-4 sm:p-6 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Parcel Released! 🎉</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Parcel has been successfully released to the collector.</p>

          {/* Mobile-optimized receipt card */}
          <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 text-left shadow-lg">
            <div className="text-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-dashed border-slate-200">
              <div className="text-xs text-muted-foreground mb-1">Release Confirmation</div>
              <div className="text-xl sm:text-2xl font-bold font-mono break-all" style={{ color: "hsl(var(--navy))" }}>
                {receipt.tracking_number}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Released: {receipt.parcel.released_at}
              </div>
              <div className="mt-2 inline-block px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                Receipt: {receipt.receipt_number}
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Parcel Details - Mobile optimized grid */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">📦 PARCEL DETAILS</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="text-sm font-medium break-words">{description}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Weight</div>
                    <div className="text-sm font-medium">{receipt.parcel.weight}</div>
                  </div>
                </div>
              </div>

              {/* Sender & Receiver on mobile */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">👤 SENDER</div>
                  <div className="text-sm font-medium break-words">{receipt.sender.name}</div>
                  <div className="text-xs text-muted-foreground">{receipt.sender.phone}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">👥 RECEIVER</div>
                  <div className="text-sm font-medium break-words">{receipt.receiver.name}</div>
                  <div className="text-xs text-muted-foreground">{receipt.receiver.phone}</div>
                </div>
              </div>

              {/* Collector Info - Highlighted */}
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="text-xs font-semibold text-blue-800 mb-2">🆔 COLLECTOR INFORMATION</div>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-blue-600 text-xs sm:text-sm">Name:</span>
                    <span className="font-medium text-blue-900 text-sm break-words">{receipt.collector.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-blue-600 text-xs sm:text-sm">ID Number:</span>
                    <span className="font-medium text-blue-900 text-sm">{receipt.collector.id_number}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-blue-600 text-xs sm:text-sm">Phone:</span>
                    <span className="font-medium text-blue-900 text-sm">{receipt.collector.phone}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-blue-600 text-xs sm:text-sm">Relationship:</span>
                    <span className="font-medium text-blue-900 text-sm">{receipt.collector.relationship}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-emerald-50 rounded-lg p-3 sm:p-4">
                <div className="text-xs font-semibold text-emerald-800 mb-2">💰 PAYMENT</div>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-emerald-600 text-xs sm:text-sm">Amount:</span>
                    <span className="font-medium text-emerald-900 text-sm">{receipt.parcel.amount}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-emerald-600 text-xs sm:text-sm">Method:</span>
                    <span className="font-medium text-emerald-900 text-sm">{receipt.parcel.payment_method}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                    <span className="text-emerald-600 text-xs sm:text-sm">Status:</span>
                    <span className="font-medium text-emerald-900 text-sm">{receipt.parcel.payment_status}</span>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="border-t border-dashed border-slate-200 pt-3">
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                  <span className="text-muted-foreground text-xs sm:text-sm">Released By:</span>
                  <span className="font-medium text-sm">{receipt.served_by.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground mt-1">
                  <span>Branch:</span>
                  <span>{receipt.origin_branch.name}</span>
                </div>
              </div>

              <div className="text-center mt-3 sm:mt-4 pt-3 border-t-2 border-dashed border-slate-200">
                <p className="text-sm font-medium text-emerald-600">✨ {receipt.footer.thank_you} ✨</p>
                <p className="text-xs text-muted-foreground mt-1">{receipt.footer.message}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" className="w-full sm:flex-1 gap-2 h-10 sm:h-11 text-sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print Receipt
            </Button>
            <Button 
              className="w-full sm:flex-1 h-10 sm:h-11 text-sm" 
              onClick={handleReset}
              style={{ background: "hsl(var(--navy))", color: "white" }}
            >
              Release Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Release Parcel</h1>
          <p className="page-subtitle text-xs sm:text-sm">Verify receiver identity before releasing parcel</p>
        </div>
      </div>

      {/* Step 1: Search - Mobile optimized */}
      <div className="form-section p-4 sm:p-6 mb-4">
        <h3 className="form-section-title flex items-center gap-2 text-sm sm:text-base mb-3">
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--navy))" }}>
            1
          </span>
          Find Parcel
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value.toUpperCase())}
              placeholder={isMobile ? "Enter tracking #" : "Enter tracking number e.g. NBO-MSA-007821"}
              className="pl-9 font-mono h-10 sm:h-11 text-sm"
              onKeyDown={e => e.key === "Enter" && searchParcel()}
              disabled={loading}
            />
          </div>
          <Button 
            onClick={searchParcel} 
            disabled={loading}
            className="w-full sm:w-auto h-10 sm:h-11 text-sm"
            style={{ background: "hsl(var(--navy))", color: "white" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {parcel && (
        <>
          {/* Parcel Info - Mobile optimized */}
          <div className="form-section p-4 sm:p-6 mb-4">
            <h3 className="form-section-title flex items-center gap-2 text-sm sm:text-base mb-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--navy))" }}>
                2
              </span>
              Parcel Details
            </h3>
            
            {/* Mobile-optimized grid - 1 column on mobile, 2 on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-2.5">
              {/* Tracking Number - Highlighted */}
              <div className="col-span-1 sm:col-span-2 bg-blue-50 p-3 rounded-lg mb-2">
                <div className="text-xs text-muted-foreground">Tracking Number</div>
                <div className="text-base sm:text-lg font-mono font-bold" style={{ color: "hsl(var(--navy))" }}>
                  {parcel.tracking_number}
                </div>
              </div>

              {/* Status with Badge */}
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-semibold mt-0.5">
                  <span className={parcel.status === 'arrived' ? "badge-success" : "badge-warning"}>
                    {parcel.status === 'arrived' ? 'Arrived ✓' : parcel.status}
                  </span>
                </div>
              </div>

              {/* Payment Status with Badge */}
              <div>
                <div className="text-xs text-muted-foreground">Payment Status</div>
                <div className="text-sm font-semibold mt-0.5">
                  <span className={parcel.payment_status === 'paid' ? "badge-success" : "badge-warning"}>
                    {parcel.payment_status === 'paid' ? '✅ Pre-paid' : '❌ Pay at pickup'}
                  </span>
                </div>
              </div>

              {/* Sender Info */}
              <div>
                <div className="text-xs text-muted-foreground">Sender</div>
                <div className="text-sm font-semibold mt-0.5 break-words">{parcel.sender_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sender Phone</div>
                <div className="text-sm font-semibold mt-0.5">{parcel.sender_phone}</div>
              </div>

              {/* Receiver Info */}
              <div>
                <div className="text-xs text-muted-foreground">Receiver</div>
                <div className="text-sm font-semibold mt-0.5 break-words">{parcel.receiver_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Receiver Phone</div>
                <div className="text-sm font-semibold mt-0.5">{parcel.receiver_phone}</div>
              </div>

              {/* Parcel Details */}
              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm font-semibold mt-0.5 break-words">
                  {parcel.description || storedDescription || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Weight</div>
                <div className="text-sm font-semibold mt-0.5">{parcel.weight ? `${parcel.weight} kg` : '—'}</div>
              </div>

              {/* Trip Info */}
              <div className="col-span-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Vehicle</div>
                <div className="text-sm font-semibold mt-0.5">
                  {parcel.trip ? `${parcel.trip.vehicle_plate} (${parcel.trip.driver_name})` : '—'}
                </div>
              </div>

              {/* Arrival Time */}
              <div className="col-span-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Arrived At</div>
                <div className="text-sm font-semibold mt-0.5">{parcel.updated_at ? formatDate(parcel.updated_at) : '—'}</div>
              </div>

              {/* Amount */}
              <div className="col-span-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="text-lg font-bold mt-0.5 text-emerald-600">{formatCurrency(Number(parcel.amount))}</div>
              </div>
            </div>

            {/* Payment Collection Section */}
            {parcel.payment_status !== 'paid' && (
              <div className="mt-4 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start sm:items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <span className="text-sm font-semibold text-amber-800">Payment Required Before Release</span>
                </div>
                
                {/* Mobile-optimized payment layout */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-1">
                    <Label className="text-xs font-medium mb-1 block">Payment Method</Label>
                    <select 
                      className="w-full h-10 sm:h-9 px-3 rounded-lg border border-input bg-background text-sm" 
                      value={payment.method} 
                      onChange={e => setPayment(p => ({ ...p, method: e.target.value }))}
                      disabled={payment.processing}
                    >
                      <option>Cash</option>
                      <option>M-Pesa</option>
                      <option>Bank</option>
                    </select>
                  </div>
                  <Button
                    size={isMobile ? "default" : "sm"}
                    className="w-full sm:w-auto gap-1.5 h-10 sm:h-9"
                    style={{ background: "hsl(38,95%,52%)", color: "hsl(220 50% 8%)" }}
                    onClick={collectPayment}
                    disabled={payment.confirmed || payment.processing}
                  >
                    {payment.processing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    {payment.confirmed 
                      ? `✓ ${formatCurrency(Number(parcel.amount))} Collected` 
                      : `Collect ${formatCurrency(Number(parcel.amount))}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Identity Verification - Mobile optimized */}
          <div className="form-section p-4 sm:p-6 mb-4">
            <h3 className="form-section-title flex items-center gap-2 text-sm sm:text-base mb-3">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "hsl(var(--navy))" }} />
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--navy))" }}>
                3
              </span>
              Identity Verification
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 font-medium">
                ⚠️ Mandatory — Collector must present National ID. Record details below before releasing parcel.
              </p>
            </div>
            
            {/* Mobile-optimized form - 1 column on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Relationship to Receiver</Label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm" 
                  value={identity.relationship} 
                  onChange={e => updateIdentity("relationship", e.target.value)}
                  disabled={releasing}
                >
                  <option>Receiver</option>
                  <option>Family Member</option>
                  <option>Friend</option>
                  <option>Agent</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Collector Full Name *</Label>
                <Input 
                  value={identity.collectorName} 
                  onChange={e => updateIdentity("collectorName", e.target.value)} 
                  placeholder="As on ID card"
                  className="h-10 text-sm"
                  disabled={releasing}
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">National ID Number *</Label>
                <Input 
                  value={identity.idNumber} 
                  onChange={e => updateIdentity("idNumber", e.target.value)} 
                  placeholder="e.g. 12345678"
                  className="h-10 text-sm"
                  disabled={releasing}
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Collector Phone *</Label>
                <Input 
                  value={identity.phone} 
                  onChange={e => updateIdentity("phone", e.target.value)} 
                  placeholder="+254 700 000000"
                  className="h-10 text-sm"
                  disabled={releasing}
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          </div>

          {/* Release Button - Full width on mobile */}
          <Button
            onClick={releaseParcel}
            disabled={
              releasing || 
              (parcel.payment_status !== 'paid' && !payment.confirmed) ||
              !identity.collectorName ||
              !identity.idNumber ||
              !identity.phone
            }
            className="w-full h-12 sm:h-12 text-sm sm:text-base font-semibold gap-2"
            style={{ background: "hsl(0,84%,58%)", color: "white" }}
          >
            {releasing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Unlock className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {releasing ? "Releasing Parcel..." : isMobile ? "🔓 Release Parcel" : "🔓 Release Parcel — Confirm & Generate Receipt"}
          </Button>
          
          {parcel.payment_status !== 'paid' && !payment.confirmed && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Payment must be collected before parcel can be released
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ReleaseParcel;