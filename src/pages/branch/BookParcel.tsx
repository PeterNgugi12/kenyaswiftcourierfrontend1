import React, { useState, useEffect } from "react";
import { 
  Package, 
  CheckCircle, 
  Printer, 
  AlertTriangle, 
  Loader2, 
  Download, 
  QrCode, 
  Copy, 
  Share2, 
  Wallet, 
  TrendingUp, 
  Info, 
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParcelBooking } from "@/hooks/useParcelBooking";
import { useBranchAuth } from "@/hooks/useBranchAuth";
import { formatCurrency } from "@/lib/utils";
import { toast } from 'react-hot-toast';

// Helper function to format phone number with +254 prefix
const formatPhoneNumber = (value: string) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // If empty, return empty
  if (!digits) return '+254';
  
  // If starts with 0, replace with +254
  if (digits.startsWith('0')) {
    return '+254' + digits.substring(1);
  }
  
  // If starts with 7, 1, or 0 (for new formats), add +254
  if (digits.startsWith('7') || digits.startsWith('1') || digits.startsWith('0')) {
    return '+254' + digits;
  }
  
  // If starts with 254, add +
  if (digits.startsWith('254')) {
    return '+' + digits;
  }
  
  // If already has +, keep as is
  if (value.startsWith('+')) {
    return value;
  }
  
  // Default: add +254
  return '+254' + digits;
};

// Helper to validate Kenyan phone number
const isValidKenyanPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned.startsWith('254')) return false;
  
  const after254 = cleaned.substring(3);
  
  if (after254.length !== 9) return false;
  
  const firstDigit = after254[0];
  const firstTwoDigits = after254.substring(0, 2);
  
  const validMobilePrefixes = ['7', '11', '10'];
  const validLandlinePrefixes = ['20', '40', '50', '60', '65', '67'];
  
  return validMobilePrefixes.includes(firstDigit) || 
         validMobilePrefixes.includes(firstTwoDigits) || 
         validLandlinePrefixes.includes(firstTwoDigits);
};

const BookParcel = () => {
  const { user } = useBranchAuth();
  const { 
    branches, 
    trips, 
    walletBalance, 
    loading, 
    canBookParcel,
    createParcel,
    generateTrackingPreview,
    refresh
  } = useParcelBooking();

  const [form, setForm] = useState({
    senderName: "", 
    senderPhone: "+254",
    receiverName: "", 
    receiverPhone: "+254",
    description: "", 
    destinationBranch: "",
    weight: "",
    amount: "", 
    paymentMethod: "Cash",
    paymentStatus: "paid", 
    tripId: "",
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [createdParcel, setCreatedParcel] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phoneErrors, setPhoneErrors] = useState({
    sender: "",
    receiver: ""
  });
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [showFeeInfo, setShowFeeInfo] = useState(true); // Always show fee info

  // Platform fee constant - ALWAYS charged to company
  const PLATFORM_FEE = 5;

  // Create branch map for lookup
  const branchMap = React.useMemo(() => {
    return branches.reduce((acc, branch) => {
      acc[branch.id] = branch;
      return acc;
    }, {} as Record<string, any>);
  }, [branches]);

  // Helper function to get description from various possible locations
  const getDescription = () => {
    console.log("Getting description from:");
    console.log("- receipt?.parcel?.description:", receipt?.parcel?.description);
    console.log("- receipt?.description:", receipt?.description);
    console.log("- createdParcel?.description:", createdParcel?.description);
    console.log("- form.description:", form.description);
    
    // Try all possible locations where description might be stored
    // Prioritize form.description since we know it's correct from the submission
    if (form.description && form.description !== 'N/A') {
      return form.description;
    }
    
    return (
      receipt?.parcel?.description || 
      receipt?.description || 
      createdParcel?.description || 
      createdParcel?.parcel?.description ||
      'N/A'
    );
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log("🔄 receipt state changed:", receipt);
    console.log("🔄 submitted state:", submitted);
    if (receipt) {
      console.log("✅ Receipt is now available:", receipt.tracking_number);
      console.log("📝 Receipt full object:", JSON.stringify(receipt, null, 2));
      console.log("📝 Receipt description from getDescription():", getDescription());
    }
  }, [receipt, submitted]);

  useEffect(() => {
    console.log("📦 createdParcel state changed:", createdParcel);
    if (createdParcel) {
      console.log("📦 createdParcel full object:", JSON.stringify(createdParcel, null, 2));
    }
  }, [createdParcel]);

  // Show fee info always - removed dependency on paymentStatus
  useEffect(() => {
    setShowFeeInfo(true);
  }, []);

  const update = (k: string, v: string) => {
    // Handle phone number formatting
    if (k === 'senderPhone' || k === 'receiverPhone') {
      const formatted = formatPhoneNumber(v);
      setForm(f => ({ ...f, [k]: formatted }));
      
      // Validate phone
      if (formatted && formatted !== '+254' && formatted.length > 4) {
        const isValid = isValidKenyanPhone(formatted);
        setPhoneErrors(prev => ({
          ...prev,
          [k === 'senderPhone' ? 'sender' : 'receiver']: isValid ? '' : 'Invalid Kenyan phone number'
        }));
      } else {
        setPhoneErrors(prev => ({
          ...prev,
          [k === 'senderPhone' ? 'sender' : 'receiver']: ''
        }));
      }
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
  };

  useEffect(() => {
    if (form.destinationBranch) {
      generateTrackingPreview(form.destinationBranch).then(tracking => {
        if (tracking) console.log('Preview tracking:', tracking);
      });
    }
  }, [form.destinationBranch, generateTrackingPreview]);

  const validateForm = () => {
    // Validate sender phone
    if (form.senderPhone && form.senderPhone !== '+254' && form.senderPhone.length > 4) {
      if (!isValidKenyanPhone(form.senderPhone)) {
        toast.error('Invalid sender phone number');
        return false;
      }
    } else if (form.senderPhone === '+254' || form.senderPhone.length <= 4) {
      toast.error('Please enter a complete sender phone number');
      return false;
    }

    // Validate receiver phone
    if (form.receiverPhone && form.receiverPhone !== '+254' && form.receiverPhone.length > 4) {
      if (!isValidKenyanPhone(form.receiverPhone)) {
        toast.error('Invalid receiver phone number');
        return false;
      }
    } else if (form.receiverPhone === '+254' || form.receiverPhone.length <= 4) {
      toast.error('Please enter a complete receiver phone number');
      return false;
    }

    // Validate trip assignment - now required
    if (!form.tripId) {
      toast.error('Please select a trip for this parcel');
      return false;
    }

    // Check wallet balance for platform fee - ALWAYS required
    if (walletBalance < PLATFORM_FEE) {
      toast.error(`Insufficient wallet balance. Need at least KES ${PLATFORM_FEE} for platform fee`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=".repeat(60));
    console.log("📝 FORM SUBMISSION STARTED");
    console.log("=".repeat(60));
    
    // Validate required fields
    if (!form.destinationBranch) {
      toast.error('Please select a destination branch');
      return;
    }

    if (!form.tripId) {
      toast.error('Please select a trip for this parcel');
      return;
    }

    if (!form.amount) {
      toast.error('Please enter amount');
      return;
    }

    // Validate phone numbers and wallet
    if (!validateForm()) {
      return;
    }

    // Store previous balance before submission
    setPreviousBalance(walletBalance);

    const submitData = {
      sender_name: form.senderName,
      sender_phone: form.senderPhone,
      receiver_name: form.receiverName,
      receiver_phone: form.receiverPhone,
      description: form.description,
      destination_branch: form.destinationBranch,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      amount: parseFloat(form.amount),
      payment_method: form.paymentMethod,
      payment_status: form.paymentStatus as 'paid' | 'pending' | 'destination',
      trip_id: form.tripId // Now required, so no fallback to undefined
    };

    setSubmitting(true);
    try {
      const response = await createParcel(submitData);
      
      console.log("📦 Response from createParcel:", JSON.stringify(response, null, 2));
      
      // Refresh wallet balance to get updated amount
      await refresh.wallet();
      
      // Show success message with fee deduction info - ALWAYS show fee deduction
      toast.success(
        <div>
          <p className="font-bold">Parcel Booked Successfully! 🎉</p>
          <p className="text-sm">KES {PLATFORM_FEE} platform fee deducted from company wallet</p>
          <p className="text-xs text-blue-600">New balance: {formatCurrency(walletBalance - PLATFORM_FEE)}</p>
        </div>,
        { duration: 6000 }
      );
      
      // Set the data
      if (response.parcel) {
        setCreatedParcel(response.parcel);
      } else {
        setCreatedParcel(response);
      }
      
      if (response.receipt) {
        setReceipt(response.receipt);
      } else {
        // If no receipt in response, use the response as receipt
        setReceipt(response);
      }
      
      setSubmitted(true);
      
    } catch (error: any) {
      console.error("❌ Error in handleSubmit:", error);
      toast.error(error.response?.data?.message || 'Failed to create parcel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => { 
    setSubmitted(false); 
    setCreatedParcel(null);
    setReceipt(null);
    setPreviousBalance(null);
    setPhoneErrors({ sender: "", receiver: "" });
    setForm({ 
      senderName: "", 
      senderPhone: "+254",
      receiverName: "", 
      receiverPhone: "+254",
      description: "", 
      destinationBranch: "",
      weight: "", 
      amount: "", 
      paymentMethod: "Cash", 
      paymentStatus: "paid", 
      tripId: "" 
    }); 
  };

  const handlePrint = () => {
    // Helper function to extract numeric amount
    const extractAmount = (value: any): number => {
      if (!value) return 0;
      
      // If it's already a number
      if (typeof value === 'number') return value;
      
      // If it's a string, remove non-numeric characters and parse
      if (typeof value === 'string') {
        // Remove 'KES', commas, spaces and keep only numbers and decimal point
        const numericString = value.replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(numericString);
        return isNaN(parsed) ? 0 : parsed;
      }
      
      return 0;
    };

    // Get values with proper parsing
    const description = getDescription();
    
    // Try different sources for amount
    const rawAmount = 
      receipt?.parcel?.amount || 
      createdParcel?.amount || 
      form.amount || 
      receipt?.amount || 
      0;
    
    const amount = extractAmount(rawAmount);
    const isPaid = receipt.parcel?.payment_status === 'paid' || createdParcel?.payment_status === 'paid';
    const trackingNumber = receipt.tracking_number || createdParcel?.tracking_number || 'N/A';
    const receiptNumber = receipt.receipt_number || 'N/A';
    const date = receipt.generated_at || new Date().toLocaleString();
    
    // Format amount for display
    const formattedAmount = amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Parcel Receipt - ${trackingNumber}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(5px);
                padding: 6px 14px;
                border-radius: 40px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.5px;
                border: 1px solid rgba(255, 255, 255, 0.3);
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
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              }
              
              /* Route */
              .route {
                padding: 24px;
                border-bottom: 1px solid #E2E8F0;
              }
              
              .route-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
              }
              
              .location {
                flex: 1;
                text-align: center;
              }
              
              .location-icon {
                font-size: 24px;
                margin-bottom: 6px;
              }
              
              .location-label {
                font-size: 10px;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }
              
              .location-name {
                font-size: 15px;
                font-weight: 700;
                color: #0F172A;
                margin-bottom: 2px;
              }
              
              .location-town {
                font-size: 11px;
                color: #475569;
              }
              
              .route-arrow {
                color: #2563EB;
                font-size: 20px;
                font-weight: 300;
              }
              
              /* Parties */
              .parties {
                padding: 24px;
                border-bottom: 1px solid #E2E8F0;
              }
              
              .parties-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
              }
              
              .party-card {
                background: #F8FAFC;
                padding: 16px;
                border-radius: 16px;
              }
              
              .party-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
              }
              
              .party-icon {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
              }
              
              .sender-icon {
                background: #DBEAFE;
                color: #1E40AF;
              }
              
              .receiver-icon {
                background: #DCFCE7;
                color: #166534;
              }
              
              .party-name {
                font-weight: 700;
                font-size: 13px;
                color: #0F172A;
              }
              
              .party-phone {
                font-size: 11px;
                color: #475569;
                font-family: monospace;
                margin-top: 4px;
              }
              
              /* Parcel Details */
              .parcel-details {
                padding: 24px;
                border-bottom: 1px solid #E2E8F0;
              }
              
              .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
              }
              
              .section-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #FEF3C7;
                color: #92400E;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
              }
              
              .section-title {
                font-size: 16px;
                font-weight: 700;
                color: #0F172A;
              }
              
              .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
              }
              
              .detail-item {
                background: #F8FAFC;
                padding: 12px;
                border-radius: 12px;
              }
              
              .detail-item.full-width {
                grid-column: span 2;
              }
              
              .detail-label {
                font-size: 10px;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-bottom: 4px;
              }
              
              .detail-value {
                font-size: 18px;
                font-weight: 700;
                color: #0F172A;
              }
              
              .detail-value.amount {
                color: #059669;
                font-size: 24px;
              }
              
              .detail-description {
                font-size: 15px;
                font-weight: 600;
                color: #0F172A;
                text-transform: capitalize;
              }
              
              /* Payment Status */
              .payment-status {
                padding: 16px 24px;
                background: ${isPaid ? '#F0FDF4' : '#FEF3C7'};
                border-bottom: 1px solid ${isPaid ? '#86EFAC' : '#FCD34D'};
              }
              
              .status-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 40px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: ${isPaid ? '#059669' : '#D97706'};
                color: white;
                margin-right: 12px;
              }
              
              .status-text {
                font-size: 14px;
                font-weight: 500;
                color: ${isPaid ? '#065F46' : '#92400E'};
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
              
              .tracking-note {
                color: #94A3B8;
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
              
              @media (max-width: 380px) {
                .parties-grid {
                  grid-template-columns: 1fr;
                }
                
                .details-grid {
                  grid-template-columns: 1fr;
                }
                
                .detail-item.full-width {
                  grid-column: span 1;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <!-- Header -->
              <div class="header">
                <div class="company-name">${receipt.company?.name || 'Chania Sacco'}</div>
                <div class="company-tagline">Parcel Service Receipt</div>
                <div class="receipt-badge">BOOKING CONFIRMED</div>
              </div>
              
              <!-- Info Row -->
              <div class="info-row">
                <span class="info-left">Receipt No:</span>
                <span class="info-right">${receiptNumber}</span>
              </div>
              <div class="info-row" style="border-top: none; padding-top: 0;">
                <span class="info-left">Date:</span>
                <span class="info-right">${date}</span>
              </div>
              
              <!-- Tracking Number -->
              <div class="tracking-section">
                <div class="tracking-label">Tracking Number</div>
                <div class="tracking-number">${trackingNumber}</div>
              </div>
              
              <!-- Route -->
              <div class="route">
                <div class="route-container">
                  <div class="location">
                    <div class="location-icon">📍</div>
                    <div class="location-label">From</div>
                    <div class="location-name">${receipt.origin_branch?.name || 'N/A'}</div>
                    <div class="location-town">${receipt.origin_branch?.town || ''}</div>
                  </div>
                  <div class="route-arrow">→</div>
                  <div class="location">
                    <div class="location-icon">🎯</div>
                    <div class="location-label">To</div>
                    <div class="location-name">${receipt.parcel?.destination || receipt.destination || 'N/A'}</div>
                    <div class="location-town">${branches.find(b => b.id === form.destinationBranch)?.town || ''}</div>
                  </div>
                </div>
              </div>
              
              <!-- Sender & Receiver -->
              <div class="parties">
                <div class="parties-grid">
                  <div class="party-card">
                    <div class="party-title">
                      <div class="party-icon sender-icon">📤</div>
                      <span class="party-name">SENDER</span>
                    </div>
                    <div class="party-name">${receipt.sender?.name || 'N/A'}</div>
                    <div class="party-phone">${receipt.sender?.phone || 'N/A'}</div>
                  </div>
                  
                  <div class="party-card">
                    <div class="party-title">
                      <div class="party-icon receiver-icon">📥</div>
                      <span class="party-name">RECEIVER</span>
                    </div>
                    <div class="party-name">${receipt.receiver?.name || 'N/A'}</div>
                    <div class="party-phone">${receipt.receiver?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <!-- Parcel Details -->
              <div class="parcel-details">
                <div class="section-header">
                  <div class="section-icon">📦</div>
                  <span class="section-title">Parcel Information</span>
                </div>
                
                <div class="details-grid">
                  <div class="detail-item full-width">
                    <div class="detail-label">Description</div>
                    <div class="detail-description">${description}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Weight</div>
                    <div class="detail-value">${receipt.parcel?.weight || createdParcel?.weight || form.weight || 'N/A'} kg</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value amount">KES ${formattedAmount}</div>
                  </div>
                </div>
              </div>
              
              <!-- Payment Status -->
              <div class="payment-status">
                <span class="status-badge">${isPaid ? 'PAID' : 'PENDING'}</span>
                <span class="status-text">
                  ${isPaid ? 'Payment completed at origin branch' : 'Payment to be collected at destination'}
                </span>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <div class="footer-message">Thank you for choosing ${receipt.company?.name || 'Chania Sacco'}!</div>
                <div class="footer-note">Your parcel is in safe hands</div>
                <div class="tracking-note">Track your parcel anytime using the tracking number above</div>
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

  const handleCopyTracking = () => {
    if (createdParcel?.tracking_number) {
      navigator.clipboard.writeText(createdParcel.tracking_number);
      toast.success('Tracking number copied to clipboard');
    } else if (receipt?.tracking_number) {
      navigator.clipboard.writeText(receipt.tracking_number);
      toast.success('Tracking number copied to clipboard');
    }
  };

  const handleShareTracking = async () => {
    const trackingNumber = createdParcel?.tracking_number || receipt?.tracking_number;
    if (trackingNumber && navigator.share) {
      try {
        await navigator.share({
          title: 'Parcel Tracking Number',
          text: `Your parcel tracking number is: ${trackingNumber}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyTracking();
    }
  };

  // Loading state
  if (loading.branches) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Receipt view
  if (submitted && receipt) {
    const description = getDescription();
    
    return (
      <div className="animate-fade-in max-w-2xl mx-auto px-4 sm:px-0">
        <div className="form-section p-4 sm:p-6">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Parcel Booked Successfully! 🎉</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Your tracking number has been generated</p>
          </div>

          {/* Fee Deduction Notice - ALWAYS show since platform fee is always charged */}
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 text-sm sm:text-base">Platform Fee Deducted</p>
                <p className="text-xs sm:text-sm text-amber-700">
                  KES {PLATFORM_FEE} has been deducted from company wallet
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  New wallet balance: {formatCurrency(walletBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Receipt Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg">
            {/* Company Header */}
            <div className="text-center mb-4 sm:mb-6 pb-4 border-b-2 border-dashed border-slate-200">
              <h3 className="text-xl sm:text-2xl font-bold" style={{ color: "hsl(var(--navy))" }}>
                {receipt.company?.name || 'Chania Sacco'}
              </h3>
            </div>

            {/* Receipt Info */}
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground mb-4">
              <span>Receipt: {receipt.receipt_number || 'N/A'}</span>
              <span>{receipt.generated_at || new Date().toLocaleString()}</span>
            </div>

            {/* Tracking Number */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
              <div className="text-xs text-blue-600 uppercase mb-1">Tracking Number</div>
              <div className="text-lg sm:text-2xl font-mono font-bold break-all" style={{ color: "hsl(var(--navy))" }}>
                {receipt.tracking_number || createdParcel?.tracking_number || 'N/A'}
              </div>
              <div className="flex gap-2 justify-center mt-2">
                <Button variant="ghost" size="sm" className="gap-1" onClick={handleCopyTracking}>
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
                {navigator.share && (
                  <Button variant="ghost" size="sm" className="gap-1" onClick={handleShareTracking}>
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-100 rounded-lg p-3 mb-4 gap-3">
              <div className="text-center flex-1">
                <div className="text-xs text-muted-foreground">FROM</div>
                <div className="font-semibold text-sm">{receipt.origin_branch?.name || 'N/A'}</div>
              </div>
              <div className="text-blue-600 font-bold rotate-90 sm:rotate-0">→</div>
              <div className="text-center flex-1">
                <div className="text-xs text-muted-foreground">TO</div>
                <div className="font-semibold text-sm">{receipt.parcel?.destination || receipt.destination || 'N/A'}</div>
              </div>
            </div>

            {/* Sender & Receiver */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">📤 SENDER</div>
                <div className="font-medium text-sm">{receipt.sender?.name || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">{receipt.sender?.phone || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">📥 RECEIVER</div>
                <div className="font-medium text-sm">{receipt.receiver?.name || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">{receipt.receiver?.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3 text-sm sm:text-base">📦 Parcel Details</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium text-right">{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{receipt.parcel?.weight || createdParcel?.weight || form.weight || 'N/A'} {receipt.parcel?.weight || createdParcel?.weight || form.weight ? 'kg' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(receipt.parcel?.amount || createdParcel?.amount || form.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className={`font-medium ${(receipt.parcel?.payment_status === 'paid' || createdParcel?.payment_status === 'paid') ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {(receipt.parcel?.payment_status === 'paid' || createdParcel?.payment_status === 'paid') ? 'Paid at Origin' : 'Pay at Destination'}
                  </span>
                </div>
                
                {/* Show fee deduction - ALWAYS show */}
                <div className="mt-3 pt-3 border-t border-dashed">
                  <div className="flex justify-between text-amber-600">
                    <span className="text-muted-foreground">Platform Fee (deducted):</span>
                    <span className="font-medium">- KES {PLATFORM_FEE}.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Served By */}
            <div className="text-center text-xs sm:text-sm border-t border-dashed border-slate-200 pt-4">
              <div className="text-muted-foreground mb-1">Served by: {receipt.served_by?.name || user?.full_name || 'N/A'}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button onClick={handlePrint} className="w-full gap-2 h-11 sm:h-12 text-sm sm:text-base" style={{ background: "hsl(var(--navy))", color: "white" }}>
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              Print Receipt
            </Button>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button variant="outline" onClick={handleCopyTracking} className="gap-2 text-xs sm:text-sm h-10 sm:h-11">
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                Copy Tracking
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2 text-xs sm:text-sm h-10 sm:h-11">
                <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                Book Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4 sm:px-0">
      {/* Company Wallet Card - prominently displayed at the top */}
      <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-100" />
              <span className="text-blue-100 text-xs sm:text-sm font-medium">Company Wallet</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(walletBalance)}</div>
            <p className="text-blue-100 text-xs sm:text-sm mt-2">
              Each parcel booked deducts KES {PLATFORM_FEE} platform fee
            </p>
          </div>
          <div className="bg-white/20 p-3 sm:p-4 rounded-xl">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </div>
        
        {/* Show previous balance if available */}
        {previousBalance !== null && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-400 text-xs sm:text-sm">
            <div className="flex justify-between text-blue-100">
              <span>Previous balance:</span>
              <span>{formatCurrency(previousBalance)}</span>
            </div>
            <div className="flex justify-between text-blue-100 mt-1">
              <span>After deduction:</span>
              <span className="font-bold">{formatCurrency(walletBalance)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Low Balance Warning */}
      {walletBalance < PLATFORM_FEE && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 text-sm sm:text-base">Insufficient Wallet Balance</p>
              <p className="text-xs sm:text-sm text-amber-700">
                Your company wallet has {formatCurrency(walletBalance)}. 
                You need at least KES {PLATFORM_FEE} to book a parcel.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="page-header mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Book Parcel</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            Create a new parcel booking at {user?.branch?.name || 'Branch'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Sender */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="form-section-title text-sm sm:text-base mb-3">Sender Information</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Sender Name *</Label>
              <Input 
                value={form.senderName} 
                onChange={e => update("senderName", e.target.value)} 
                placeholder="Full name" 
                required 
                disabled={submitting}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Sender Phone *</Label>
              <Input 
                value={form.senderPhone} 
                onChange={e => update("senderPhone", e.target.value)} 
                placeholder="+254 712 345678" 
                required 
                disabled={submitting}
                className={`h-9 sm:h-10 text-sm ${phoneErrors.sender ? "border-red-500" : ""}`}
              />
              {phoneErrors.sender && (
                <p className="text-xs text-red-500 mt-1">{phoneErrors.sender}</p>
              )}
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="form-section-title text-sm sm:text-base mb-3">Receiver Information</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Receiver Name *</Label>
              <Input 
                value={form.receiverName} 
                onChange={e => update("receiverName", e.target.value)} 
                placeholder="Full name" 
                required 
                disabled={submitting}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Receiver Phone *</Label>
              <Input 
                value={form.receiverPhone} 
                onChange={e => update("receiverPhone", e.target.value)} 
                placeholder="+254 712 345678" 
                required 
                disabled={submitting}
                className={`h-9 sm:h-10 text-sm ${phoneErrors.receiver ? "border-red-500" : ""}`}
              />
              {phoneErrors.receiver && (
                <p className="text-xs text-red-500 mt-1">{phoneErrors.receiver}</p>
              )}
            </div>
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Destination Branch *</Label>
              <select
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm"
                value={form.destinationBranch}
                onChange={e => update("destinationBranch", e.target.value)}
                required
                disabled={submitting || loading.branches}
              >
                <option value="">— Select Destination —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.town})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parcel */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="form-section-title text-sm sm:text-base mb-3">Parcel Details</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Parcel Description *</Label>
              <Input 
                value={form.description} 
                onChange={e => update("description", e.target.value)} 
                placeholder="e.g. Clothes, Electronics, Documents" 
                required 
                disabled={submitting}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Weight (kg) *</Label>
                <Input 
                  type="number" 
                  value={form.weight} 
                  onChange={e => update("weight", e.target.value)} 
                  placeholder="e.g. 2.5" 
                  step="0.1"
                  min="0.1"
                  required 
                  disabled={submitting}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Amount (KES) *</Label>
                <Input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => update("amount", e.target.value)} 
                  placeholder="e.g. 200" 
                  min="1"
                  required 
                  disabled={submitting}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Payment Method</Label>
                <select 
                  className="w-full h-9 sm:h-10 px-3 rounded-lg border border-input bg-background text-sm" 
                  value={form.paymentMethod} 
                  onChange={e => update("paymentMethod", e.target.value)}
                  disabled={submitting}
                >
                  <option>Cash</option>
                  <option>M-Pesa</option>
                  <option>Bank</option>
                </select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 block">Payment Status *</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {[
                    { v: "paid", l: "✅ Paid at Origin" }, 
                    { v: "destination", l: "⏳ Pay at Destination" }
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => update("paymentStatus", v)}
                      disabled={submitting}
                      className={`flex-1 py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${
                        form.paymentStatus === v 
                          ? "border-amber bg-amber/10 text-foreground" 
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fee Info - ALWAYS show since platform fee is always charged */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-800">Platform Fee: KES {PLATFORM_FEE}</p>
                  <p className="text-xs text-blue-600">
                    This amount will be deducted from your company wallet for using our booking system
                  </p>
                  {walletBalance < PLATFORM_FEE && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Insufficient wallet balance! Please top up to continue.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Assignment - Now Required */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="form-section-title text-sm sm:text-base mb-3">Assign to Trip *</h3>
          
          {/* Show loading state */}
          {loading.trips ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading available trips...</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800">No available trips found</p>
              <p className="text-xs text-amber-600 mt-1">
                Please check if there are scheduled trips from your branch
              </p>
            </div>
          ) : (
            <>
              <select 
                className="w-full h-10 sm:h-11 px-3 rounded-lg border border-input bg-background text-sm"
                value={form.tripId}
                onChange={e => update("tripId", e.target.value)}
                required
                disabled={submitting || loading.trips}
              >
                <option value="">— Select a trip —</option>
                {trips.map(t => {
                  // Try to get branch info from the map if available
                  const originBranch = branchMap[t.origin_branch_id];
                  const destBranch = branchMap[t.destination_branch_id];
                  
                  let routeDisplay = t.route || 'Route not set';
                  if (originBranch && destBranch) {
                    routeDisplay = `${originBranch.code || originBranch.name} → ${destBranch.code || destBranch.name}`;
                  }
                  
                  return (
                    <option key={t.id} value={t.id}>
                      {t.trip_number} | {routeDisplay} ({t.vehicle_plate || 'No vehicle'})
                    </option>
                  );
                })}
              </select>
              
              {/* Show trip count */}
              <p className="text-xs text-muted-foreground mt-2">
                {trips.length} trip{trips.length !== 1 ? 's' : ''} available
              </p>
            </>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={
            submitting || 
            branches.length === 0 || 
            !!phoneErrors.sender || 
            !!phoneErrors.receiver ||
            !form.tripId || // Trip is now required
            walletBalance < PLATFORM_FEE // Always check wallet balance for platform fee
          } 
          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2" 
          style={{ background: "hsl(var(--navy))", color: "white" }}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          {submitting ? "Booking Parcel..." : "Book Parcel"}
        </Button>
      </form>
    </div>
  );
};

export default BookParcel;