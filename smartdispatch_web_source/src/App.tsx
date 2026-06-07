/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import {
  LayoutDashboard,
  Box,
  Package,
  Users,
  Printer,
  BellRing,
  BarChart3,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Save,
  Download,
  MapPin,
  Barcode,
  Wifi,
  QrCode,
  ArrowRight,
  Clock,
  Truck,
  UserCheck,
  RefreshCw,
  PlusCircle,
  FileCheck2,
  Sparkles,
  Info,
  ShieldCheck,
  X,
  Smartphone
} from 'lucide-react';
import { Order, Product, Worker, Alert, OrderStatus } from './types';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { PrintCenterPage } from './pages/PrintCenterPage';
import { WorkersPage } from './pages/WorkersPage';
import { AlertsPage } from './pages/AlertsPage';
import { PerformancePage } from './pages/PerformancePage';
import { HistoryPage } from './pages/HistoryPage';
import { EmulatorPage } from './pages/EmulatorPage';
import NfcScanButton from './pages/NfcScanButton';
import NfcOrderDetailPage from './pages/NfcOrderDetailPage';
import TrackingPage from './pages/TrackingPage';
import { BackendApi } from './services/backendApi';
import { authService } from './services/authService';
import { NfcPayload } from './types';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'print' | 'workers' | 'alerts' | 'emulator' | 'analytics' | 'history' | 'tracking' | 'nfc-order'>('dashboard');
  const [nfcOrderData, setNfcOrderData] = useState<NfcPayload | null>(null);
  
  // App Mode & Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState('admin@smartdispatch.com');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Data State managed in memory for interactive prototype
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load Data Effect
  useEffect(() => {
    if (isAuthenticated) {
      fetchDataFromBackend();
    }
  }, [isAuthenticated]);

  const fetchDataFromBackend = async () => {
    try {
      const [fetchedProducts, fetchedOrders, fetchedWorkers] = await Promise.all([
        BackendApi.fetchProducts(),
        BackendApi.fetchOrders(),
        BackendApi.fetchWorkers()
      ]);
      setProducts(fetchedProducts);
      setOrders(fetchedOrders);
      setWorkers(fetchedWorkers);
    } catch (e) {
      addToast('Failed to fetch data from backend. Check if backend is running.', 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login({ email: loginEmail, password: loginPassword });
      setIsAuthenticated(true);
      addToast('Logged in successfully', 'success');
    } catch (e: any) {
      addToast(e.message || 'Login failed', 'error');
    }
  };

  // Time & Live Sync Display
  const [currentTime, setCurrentTime] = useState<string>('2026-06-06 05:48:55');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'error' | 'info' }[]>([]);

  // NFC Handshaking & Animated Transition state
  const [activeNfcHandshaking, setActiveNfcHandshaking] = useState<{
    orderId: string;
    targetStatus: 'PACKED' | 'DELIVERED';
    statusText: string;
  } | null>(null);

  // Product Tab States
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  
  // New Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    brand: '',
    modelNumber: '',
    sku: '',
    category: 'Electronics',
    colorName: 'Silver',
    colorHex: '#C0C0C0',
    weightKg: 1.5,
    weightToleranceGrams: 100,
    stockQty: 50,
    priceRs: 15999,
    description: '',
    photos: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=60']
  });

  // Order Details / List State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [bulkSelectedOrderIds, setBulkSelectedOrderIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState<boolean>(false);
  const [bulkAssignTargetPackerId, setBulkAssignTargetPackerId] = useState<string>('');
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<string>('');
  const [showBulkPrintModal, setShowBulkPrintModal] = useState<boolean>(false);

  // Print Center States
  const [printQueueFilter, setPrintQueueFilter] = useState<'all' | 'ready' | 'packing' | 'printed'>('ready');
  const [selectedPrintOrderId, setSelectedPrintOrderId] = useState<string>('ord-101');
  const [isEditLabelMode, setIsEditLabelMode] = useState<boolean>(false);
  const [editLabelData, setEditLabelData] = useState<{
    recipientName: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
  }>({
    recipientName: '',
    addressLine1: '',
    addressLine2: '',
    phone: ''
  });

  // Worker Management Dialog / Form States
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState<'PACKER' | 'SUPERVISOR'>('PACKER');

  // Mobile Packer Emulator State
  const [simWorkerId, setSimWorkerId] = useState('WK-04219');
  const [simPin, setSimPin] = useState('');
  const [isSimLoggedIn, setIsSimLoggedIn] = useState(true);
  const [simSelectedOrderId, setSimSelectedOrderId] = useState<string | null>(null);
  const [simActiveItemIndex, setSimActiveItemIndex] = useState(0);
  const [simWeightInput, setSimWeightInput] = useState<number>(1.65);
  const [simOtpInput, setSimOtpInput] = useState<string[]>(['', '', '', '', '', '']);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);

  // NFC Physical Seal Print dispatch Popup States
  const [nfcPopupOrder, setNfcPopupOrder] = useState<Order | null>(null);
  const [showNfcPopup, setShowNfcPopup] = useState<boolean>(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(true); // Enabled by default for continuous express dispatches
  const [autoPrintCountdown, setAutoPrintCountdown] = useState<number | null>(null);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [batteryLevel, setBatteryLevel] = useState<number>(92);
  const [isQrScannerActive, setIsQrScannerActive] = useState<boolean>(false);
  const [previouslyPackedOrderIds, setPreviouslyPackedOrderIds] = useState<string[]>([]);

  // Computed Orders List based on search and status filter
  const filteredOrders = orders.filter(o => {
    const matchQuery = o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    const matchFilter = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    return matchQuery && matchFilter;
  });

  // Web Audio Context Synthesized beep tone
  const playBuzzerSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Crisp clear high pitch
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); // Ambient soft volume
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Browsers bypass blocking
    }
  };

  // Watch for any order that has just transitioned to 'PACKED' (NFC Sealed Status)
  useEffect(() => {
    const packedOrders = orders.filter(o => o.status === 'PACKED');
    const newlyPacked = packedOrders.find(o => !previouslyPackedOrderIds.includes(o.id));
    if (newlyPacked) {
      // Register this ID as previously handled so we don't spam triggers
      setPreviouslyPackedOrderIds(prev => [...prev, newlyPacked.id]);
      
      // Auto-set as selected print order
      setSelectedPrintOrderId(newlyPacked.id);
      
      // Automatically navigate to Print Center tab
      setActiveTab('print');
      
      // Trigger the premium auto-print popup
      setNfcPopupOrder(newlyPacked);
      setShowNfcPopup(true);
      playBuzzerSound();
      
      if (autoPrintEnabled) {
        setAutoPrintCountdown(3); // Start 3-second automatic print dispatch countdown
      }
    }
  }, [orders, previouslyPackedOrderIds, autoPrintEnabled]);

  // Handle countdown logic
  useEffect(() => {
    if (autoPrintCountdown === null) return;
    if (autoPrintCountdown === 0) {
      setAutoPrintCountdown(null);
      if (nfcPopupOrder) {
        // Mark printed automatically
        setOrders(prev =>
          prev.map(o => (o.id === nfcPopupOrder.id ? { ...o, printedAt: new Date().toISOString() } : o))
        );
        addToast(`[AUTO-PRINT SYSTEM] ${nfcPopupOrder.orderNumber} shipping label printed successfully!`, 'success');
        playBuzzerSound();
      }
      return;
    }

    const interval = setTimeout(() => {
      setAutoPrintCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(interval);
  }, [autoPrintCountdown, nfcPopupOrder]);

  // Trigger temporary notification
  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Sync animation
  const triggerSync = async () => {
    setIsSyncing(true);
    if (isAuthenticated) {
      await fetchDataFromBackend();
    }
    setTimeout(() => {
      setIsSyncing(false);
      addToast('Real-time warehouse registry synced', 'success');
    }, 1000);
  };

  // Real-time background polling (Simulating SSE/WebSockets for Prototype)
  useEffect(() => {
    if (!isAuthenticated) return;
    const pollTimer = setInterval(() => {
      fetchDataFromBackend();
    }, 3000); // Poll every 3 seconds
    return () => clearInterval(pollTimer);
  }, [isAuthenticated]);

  // Keep GMT time updated
  useEffect(() => {
    const timer = setInterval(() => {
      const gmt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setCurrentTime(gmt);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fluctuate battery level simulation
  useEffect(() => {
    const battTimer = setInterval(() => {
      setBatteryLevel(prev => {
        if (prev <= 12) return 98; // simulated charging reset
        return prev - 1;
      });
    }, 15000);
    return () => clearInterval(battTimer);
  }, []);

  // Update Edit Label Data when print order selection changes
  useEffect(() => {
    const order = orders.find(o => o.id === selectedPrintOrderId);
    if (order) {
      setEditLabelData({
        recipientName: order.shippingAddress.recipientName,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        phone: order.shippingAddress.phone
      });
    }
  }, [selectedPrintOrderId, orders]);

  // Handle adding a product
  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.brand) {
      addToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      const created = await BackendApi.createProduct(newProduct);
      setProducts(prev => [created, ...prev]);
      setShowAddProductModal(false);
      addToast(`Product "${newProduct.name}" created in catalog`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to create product', 'error');
    }
  };

  // Handle resolving an alert
  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a))
    );
    addToast('Telemetry warning flags resolved by supervisor.', 'info');
  };

  // Handle assigning packer
  const handleAssignPacker = async (orderId: string, workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    try {
      await BackendApi.assignPacker(orderId, workerId);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? {
          ...o,
          packerWorkerId: workerId,
          packerName: worker?.name,
          status: o.status === 'PENDING' ? 'ASSIGNED' : o.status
        } : o))
      );
      addToast(`Order has been assigned to ${worker?.name || 'Packer'}.`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to assign packer', 'error');
    }
  };

  // Handle bulk assigning a list of orders to a single packer
  const handleBulkAssignPacker = async (orderIds: string[], workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    try {
      await Promise.all(orderIds.map(id => BackendApi.assignPacker(id, workerId)));
      setOrders(prev =>
        prev.map(o => (orderIds.includes(o.id) ? {
          ...o,
          packerWorkerId: workerId,
          packerName: worker.name,
          status: o.status === 'PENDING' ? 'ASSIGNED' : o.status
        } : o))
      );
      addToast(`Successfully assigned ${orderIds.length} orders to ${worker.name}.`, 'success');
      setBulkSelectedOrderIds([]);
    } catch (e: any) {
      addToast('Failed to assign some orders', 'error');
    }
  };

  // Generate individual standard thermal shipping label PDF in A6 format
  const generateShippingLabelPdf = (order: Order) => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a6'
      });

      // Outer Card boundary
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(1);
      doc.rect(4, 4, 97, 140); 

      // Header black banner
      doc.setFillColor(17, 24, 39);
      doc.rect(4.5, 4.5, 96, 14, 'F');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("SMARTDISPATCH WAREHOUSE", 8, 11);

      doc.setFontSize(7);
      doc.setTextColor(249, 115, 22); 
      const priorityLabel = order.totalRs > 50000 ? 'PRIORITY URGENT' : 'STANDARD';
      doc.text(priorityLabel, 72, 11);

      doc.setFontSize(5);
      doc.setTextColor(156, 163, 175);
      doc.text("LOGISTICS SYSTEM STANDARD", 8, 15);

      // Section Barcode Divider line
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.5);
      doc.line(4, 18.5, 101, 18.5);

      // Barcode generator representation
      doc.setFillColor(17, 24, 39);
      const barsVec = [2, 1, 3, 1, 4, 2, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3];
      let cursorX = 14;
      for (const bW of barsVec) {
        doc.rect(cursorX, 21.5, bW * 1.1, 11, 'F');
        cursorX += bW * 1.1 + 0.8;
      }

      doc.setFont("Courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(`*${order.orderNumber}*`, 33, 36.5);

      // Label details Divider line
      doc.line(4, 39.5, 101, 39.5);

      // Sender and recipient info
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.text("SENDER / FROM:", 7, 44);
      doc.setFont("Helvetica", "normal");
      doc.text("SMARTDISPATCH HUB 04", 7, 48);
      doc.text("Sector 12 Outer Ring Rd,", 7, 52);
      doc.text("HSR Layout Area, KA 560102", 7, 56);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("RECIPIENT / TO:", 52, 44);
      doc.text(order.customerName, 52, 48);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(order.shippingAddress.addressLine1.substring(0, 32), 52, 52);
      doc.text((order.shippingAddress.addressLine2 || "").substring(0, 32), 52, 56);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.pinCode}`, 52, 60);
      doc.setFont("Courier", "bold");
      doc.text(`TEL: ${order.shippingAddress.phone}`, 52, 64.5);

      // Items specs Divider line
      doc.setLineWidth(0.4);
      doc.line(4, 67.5, 101, 67.5);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("CONSOLIDATED SPECIFICATIONS CHECK", 7, 72.5);

      let specsY = 78.5;
      doc.setFontSize(6.5);
      doc.text("Product Specs & SKU Reference", 7, specsY);
      doc.text("Qty", 72, specsY);
      doc.text("Verified", 84, specsY);

      doc.setLineWidth(0.2);
      doc.line(4, specsY + 1.5, 101, specsY + 1.5);
      specsY += 5.5;

      doc.setFont("Helvetica", "normal");
      order.items.forEach(item => {
        if (specsY < 125) {
          doc.text(item.productName.substring(0, 31), 7, specsY);
          doc.text(item.quantity.toString(), 73, specsY);
          doc.text("PASS ✓", 85, specsY);
          specsY += 4.5;
        }
      });

      // Under-box status
      doc.setFillColor(243, 244, 246);
      doc.rect(4.5, 126.5, 96, 12.5, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(31, 41, 55);
      doc.text("NFC SECURITY SEAL STATUS: VERIFIED SEALED", 7, 131.5);
      doc.setFont("Courier", "normal");
      doc.setFontSize(6);
      doc.text(`Routing Code Ref: ${order.truckId || "MH-12-9900"} - DOCK BAY 4`, 7, 136);

      doc.save(`Shipping_Label_${order.orderNumber}.pdf`);
    } catch (err) {
      console.error(err);
      addToast("Failed to generate individual labels", "error");
    }
  };

  // Iterate sequentially through packed orders and trigger print process
  const handlePrintAllReadyLabels = () => {
    const readyOrders = orders.filter(o => o.status === 'PACKED');
    if (readyOrders.length === 0) {
      addToast("No ready orders with status 'PACKED' found in shipping queue", "error");
      return;
    }

    addToast(`Iterating through ${readyOrders.length} packed orders...`, 'success');

    // Sequence them to prevent bulk browser block
    readyOrders.forEach((o, index) => {
      setTimeout(() => {
        handleMarkPrinted(o.id);
        generateShippingLabelPdf(o);
        if (index === readyOrders.length - 1) {
          addToast(`Sequenced print flow completed for ${readyOrders.length} dispatches!`, 'success');
        }
      }, index * 1200);
    });
  };

  // Export filtered orders as CSV structure
  const exportToCsv = () => {
    const activeFilteredOrders = orders.filter(o => {
      const matchQuery = o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
      const matchFilter = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      return matchQuery && matchFilter;
    });

    if (activeFilteredOrders.length === 0) {
      addToast("No filtered orders available to export in current view status", "error");
      return;
    }

    try {
      const headers = [
        "Order Identifier",
        "Recipient Name",
        "Phone Contact",
        "Status",
        "Order Value (INR)",
        "Assigned Operator",
        "Dock Bay Assignment",
        "Truck ID Ref",
        "Total SKUs count",
        "Created At Time"
      ];

      const rows = activeFilteredOrders.map(o => [
        `="${o.orderNumber}"`, 
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${o.status}"`,
        o.totalRs,
        `"${(o.packerName || '').replace(/"/g, '""')}"`,
        `"${o.dockAssignment || ''}"`,
        `"${o.truckId || ''}"`,
        o.items.reduce((sum, item) => sum + item.quantity, 0),
        `"${o.createdAt}"`
      ]);

      const csvDump = [
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvDump], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DispatchRegistryExport_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast(`CSV export completed successfully size ${activeFilteredOrders.length} counts!`, 'success');
    } catch (err) {
      console.error(err);
      addToast("Failed to generate and export CSV", "error");
    }
  };

  // Generate aggregate shipping manifest + labels inside single document
  const generateBulkConsolidatedPdfReport = () => {
    try {
      const selectedOrders = orders.filter(o => bulkSelectedOrderIds.includes(o.id));
      if (selectedOrders.length === 0) {
        addToast("No bulk selections found to consolidate details.", "error");
        return;
      }

      // PDF initialization
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Title & Page 1 layout
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text("SMARTDISPATCH BULK PRINT DISPATCH MANIFEST", 15, 23);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Consolidated summary shipping manifest. Generated: ${new Date().toUTCString()}`, 15, 29);
      doc.text(`Aggregated selections: ${selectedOrders.length} orders total in audit registry.`, 15, 34);

      // Line separator
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.4);
      doc.line(15, 38, 195, 38);

      // Table summary
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("SELECTED RUNTIME ITEMS INVENTORY", 15, 47);

      let rowY = 55;
      doc.setFontSize(8.5);
      doc.text("Order ID Reference", 15, rowY);
      doc.text("Recipient Name", 58, rowY);
      doc.text("Integrity State", 98, rowY);
      doc.text("Items count", 126, rowY);
      doc.text("Summary Value", 152, rowY);

      doc.setLineWidth(0.3);
      doc.line(15, rowY + 2, 195, rowY + 2);
      rowY += 7.5;

      doc.setFont("Helvetica", "normal");
      selectedOrders.forEach(o => {
        if (rowY < 265) {
          doc.text(o.orderNumber, 15, rowY);
          doc.text(o.customerName, 58, rowY);
          doc.text(o.status, 98, rowY);
          doc.text(o.items.reduce((sum, item) => sum + item.quantity, 0).toString() + " items", 126, rowY);
          doc.text(`INR ${o.totalRs.toLocaleString('en-IN')}`, 152, rowY);
          rowY += 6.5;
        }
      });

      // Totals Line
      doc.setDrawColor(156, 163, 175);
      doc.line(15, rowY, 195, rowY);
      rowY += 6;
      doc.setFont("Helvetica", "bold");
      doc.text("TOTAL ACCUMULATED SHIPMENT VALUE:", 15, rowY);
      const totalAccumVal = selectedOrders.reduce((sum, o) => sum + o.totalRs, 0);
      doc.text(`INR ${totalAccumVal.toLocaleString('en-IN')}`, 152, rowY);

      // Footer
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("* Ensure all physical seals remain unaltered and NFC signatures verified prior to carrier departure.", 15, 275);

      // Sequential labels pages
      selectedOrders.forEach(order => {
        doc.addPage();

        const tagX = 40;
        const tagY = 40;
        const tagW = 130;
        const tagH = 180;

        // Border rectangle
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.8);
        doc.rect(tagX, tagY, tagW, tagH);

        // Header color Block Fill
        doc.setFillColor(17, 24, 39);
        doc.rect(tagX + 0.5, tagY + 0.5, tagW - 1, 18, 'F');

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text("SMARTDISPATCH SHIPPING TRUCK TAG", tagX + 8, tagY + 11);

        doc.setFontSize(7.5);
        doc.setTextColor(249, 115, 22);
        const statTxt = order.totalRs > 50000 ? "PRIORITY SPECIAL" : "STANDARD ROUTE";
        doc.text(statTxt, tagX + 92, tagY + 11);

        doc.setFontSize(6.5);
        doc.setTextColor(156, 163, 175);
        doc.text("AUTOMATED PHYSICAL PACKER AUDIT SIGNATURE v3.2", tagX + 8, tagY + 15);

        // Simulated Barcode
        doc.setFillColor(17, 24, 39);
        const combVec = [3, 1, 4, 1, 2, 3, 5, 1, 3, 4, 1, 2, 4, 2, 1, 5, 1];
        let runX = tagX + 16;
        for (const itemW of combVec) {
          doc.rect(runX, tagY + 25, itemW * 1.5, 18, 'F');
          runX += itemW * 1.5 + 1.2;
        }

        doc.setFont("Courier", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(`*${order.orderNumber}*`, tagX + 45, tagY + 49);

        // Divider
        doc.setLineWidth(0.4);
        doc.line(tagX, tagY + 53, tagX + tagW, tagY + 53);

        // Address Grid
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.text("STORE / ORIGIN FROM:", tagX + 8, tagY + 60);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("SMARTDISPATCH MAIN HUB 04", tagX + 8, tagY + 65);
        doc.text("Sector 12 Outer Ring Rd, HSR Layout", tagX + 8, tagY + 70);
        doc.text("Bengaluru, KA - 560102", tagX + 8, tagY + 75);

        doc.setFont("Helvetica", "bold");
        doc.text("DELIVER DESTINATION TO:", tagX + 70, tagY + 60);
        doc.text(order.customerName, tagX + 70, tagY + 65);
        doc.setFont("Helvetica", "normal");
        doc.text(order.shippingAddress.addressLine1.substring(0, 32), tagX + 70, tagY + 70);
        doc.text((order.shippingAddress.addressLine2 || "").substring(0, 32), tagX + 70, tagY + 75);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.pinCode}`, tagX + 70, tagY + 80);
        doc.setFont("Courier", "bold");
        doc.text(`TEL: ${order.shippingAddress.phone}`, tagX + 70, tagY + 86);

        // Line Divider
        doc.line(tagX, tagY + 90, tagX + tagW, tagY + 90);

        // Items Summary Section
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("CONSOLIDATING SPECIFICATIONS DETAILED", tagX + 8, tagY + 96);

        let activeY = tagY + 104;
        doc.setFontSize(7.5);
        doc.text("Standard Item Profile info & SKU Model", tagX + 8, activeY);
        doc.text("Qty", tagX + 85, activeY);
        doc.text("Verified", tagX + 100, activeY);
        doc.line(tagX + 5, activeY + 1.5, tagX + tagW - 5, activeY + 1.5);
        activeY += 7;

        doc.setFont("Helvetica", "normal");
        order.items.forEach(item => {
          if (activeY < tagY + 155) {
            doc.text(item.productName.substring(0, 35), tagX + 8, activeY);
            doc.text(item.quantity.toString(), tagX + 86, activeY);
            doc.text("PASS ✓", tagX + 101, activeY);
            activeY += 5.5;
          }
        });

        // Grey bottom container status
        doc.setFillColor(243, 244, 246);
        doc.rect(tagX + 1, tagY + tagH - 15, tagW - 2, 14, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(31, 41, 55);
        doc.text("NFC SECURITY SEAL SIGNATURE: RECORDED AND SECURED", tagX + 8, tagY + tagH - 9);
        doc.setFont("Courier", "normal");
        doc.setFontSize(6.5);
        doc.text(`Carrier routing docking bay: BAY 04 — Trunk Ref: ${order.truckId || "MH-12-9900"}`, tagX + 8, tagY + tagH - 4);
      });

      doc.save(`Consolidated_ThermalLabels_Report_${selectedOrders.length}.pdf`);
    } catch (error) {
      console.error(error);
      addToast("Failed to generate bulk consolidated labels PDF report", "error");
    }
  };

  // Generate SKU barcode tags sheet using jsPDF
  const generateBarcodePdfSheet = (sku: string, productName: string) => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Page Title and Branding
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39); // deep dark
      doc.text("SMARTDISPATCH REPLENISHMENT SHEET", 15, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gray
      doc.text(`Generated SKU barcode tags for physical warehouse rack replenishment.`, 15, 25);
      doc.text(`Timestamp: ${new Date().toUTCString()}`, 15, 30);

      // Line separator
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 33, 195, 33);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text(`PRODUCT: ${productName.toUpperCase()}`, 15, 42);
      doc.text(`SKU REFERENCE: ${sku}`, 15, 47);

      // Draw barcode sheets in a 3x5 grid on the page
      const cols = 3;
      const rows = 4;
      const cardWidth = 55;
      const cardHeight = 35;
      const startX = 15;
      const startY = 55;
      const spacingX = 8;
      const spacingY = 8;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (cardWidth + spacingX);
          const y = startY + r * (cardHeight + spacingY);

          // Draw tag background box
          doc.setDrawColor(209, 213, 219); // cool gray
          doc.setLineWidth(0.3);
          doc.rect(x, y, cardWidth, cardHeight);

          // Header Text in box
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(55, 65, 81);
          doc.text("SMARTDISPATCH REPLENISH", x + 3, y + 6);

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(6);
          doc.setTextColor(156, 163, 175);
          doc.text("RACK REPLENISHMENT TAG", x + 3, y + 9);

          // Custom PDF Vector Barcode Lines Emulation
          const barcodeX = x + 5;
          const barcodeY = y + 12;
          const barcodeHeight = 12;
          const barcodeWidth = 45;

          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.6);
          
          // Pattern hash from the SKU string
          let seedValue = 0;
          for (let i = 0; i < sku.length; i++) {
            seedValue += sku.charCodeAt(i);
          }
          
          doc.setLineWidth(0.4);
          let currentBarX = barcodeX;
          for (let bar = 0; bar < 32; bar++) {
            const isBlack = (seedValue * (bar + 17) + (bar % 3)) % 11 > 4;
            const barLineWidth = ((bar * 7 + seedValue) % 4 === 0) ? 0.8 : 0.4;
            if (isBlack) {
              doc.setLineWidth(barLineWidth);
              doc.line(currentBarX, barcodeY, currentBarX, barcodeY + barcodeHeight);
            }
            currentBarX += barLineWidth + 0.8;
            if (currentBarX > barcodeX + barcodeWidth - 3) break;
          }

          // Text representation under barcode
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text(`*${sku}*`, x + cardWidth / 2, y + cardHeight - 4, { align: "center" });
        }
      }

      // Save PDF document
      doc.save(`Replenishment_Barcodes_${sku}.pdf`);
      addToast(`Replenishment Barcodes PDF for SKU ${sku} generated and downloaded successfully.`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Error generating barcode PDF: ${err.message}`, 'error');
    }
  };

  const uniqueHistoryCustomers = Array.from(new Set(orders.map(o => o.customerName)));
  useEffect(() => {
    if (!selectedHistoryCustomer && uniqueHistoryCustomers.length > 0) {
      setSelectedHistoryCustomer(uniqueHistoryCustomers[0]);
    }
  }, [orders, selectedHistoryCustomer]);

  // Handle advancing order status
  const handleAdvanceOrderStatus = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let nextStatus: OrderStatus = order.status;
    const current = order.status;
    if (current === 'PENDING') nextStatus = 'ASSIGNED';
    else if (current === 'ASSIGNED') nextStatus = 'PACKING';
    else if (current === 'PACKING') nextStatus = 'VERIFIED';
    else if (current === 'VERIFIED') nextStatus = 'PACKED';
    else if (current === 'PACKED') nextStatus = 'SHIPPED';
    else if (current === 'SHIPPED') nextStatus = 'DELIVERED';

    try {
      await BackendApi.updateOrderStatus(orderId, nextStatus);
      setOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          
          if (nextStatus === 'VERIFIED') {
            const updatedItems = o.items.map(item => ({
              ...item,
              ocrVerified: true,
              visionVerified: true,
              weightVerified: true,
              verifiedAt: currentTime
            }));
            addToast('All items verified: OCR match, Vision Color, and weight values match standard specifications.', 'success');
            return { ...o, items: updatedItems, status: nextStatus };
          }
          if (nextStatus === 'PACKED') {
            addToast('NFC sealed recorded: Physical package UID bound to tracking.', 'success');
          }
          return { ...o, status: nextStatus };
        })
      );
    } catch (e: any) {
      addToast('Failed to advance order status', 'error');
    }
  };

  // Handle printed mark
  const handleMarkPrinted = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, printedAt: new Date().toISOString() } : o))
    );
    addToast('Shipping standard label printed. Package status updated.', 'success');
  };

  // Handle NFC Tap simulation
  const handleNfcSealTapSimulation = async (orderId: string) => {
    if (activeNfcHandshaking) return;
    
    // Trigger electromagnetic coupling state
    setActiveNfcHandshaking({
      orderId,
      targetStatus: 'PACKED',
      statusText: 'Coupling electromagnetic 13.56 MHz Radio Frequency Field...'
    });

    try {
      // Find a packer worker or use the logged in user
      const packer = workers.find(w => w.role === 'PACKER');
      if (packer) {
        await BackendApi.sealNfc(`NFC-TAG-${Date.now()}`, packer.id);
      } else {
        await BackendApi.updateOrderStatus(orderId, 'PACKED');
      }
      setTimeout(() => {
        setOrders(prev =>
          prev.map(o => {
            if (o.id === orderId) {
              const updatedItems = o.items.map(item => ({
                ...item,
                ocrVerified: true,
                visionVerified: true,
                weightVerified: true,
                verifiedAt: currentTime
              }));
              return {
                ...o,
                items: updatedItems,
                status: 'PACKED' as OrderStatus,
                nfcSealedAt: currentTime
              };
            }
            return o;
          })
        );
        playBuzzerSound();
        addToast('Pulsed physical NFC seal emulation complete! Box package sealed permanently.', 'success');
        setActiveNfcHandshaking(null);
      }, 450); // 450ms includes 300ms handshake and 150ms settling phase
    } catch (e: any) {
      addToast('Failed to seal NFC tag on backend', 'error');
      setActiveNfcHandshaking(null);
    }
  };

  // Save modified label contents from edit mode
  const handleSaveLabelEdits = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? {
        ...o,
        shippingAddress: {
          ...o.shippingAddress,
          recipientName: editLabelData.recipientName,
          addressLine1: editLabelData.addressLine1,
          addressLine2: editLabelData.addressLine2,
          phone: editLabelData.phone
        }
      } : o))
    );
    setIsEditLabelMode(false);
    addToast('Label data modifications updated successfully.', 'success');
  };

  // Generate random pending order generator for testing
  const handleGeneratePendingOrder = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `ORD-2026-${idNum}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      customerName: ['Rajesh Kumar', 'Deepika Nair', 'Aftab Begum', 'Smriti Mandhana', 'Hardik Pandya', 'Kiran Shah'][Math.floor(Math.random() * 6)],
      customerPhone: `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'PENDING',
      totalRs: randomProduct.priceRs,
      shippingAddress: {
        recipientName: 'Recipient Name',
        phone: '+91 9885430219',
        addressLine1: 'H-90, Smart Tech Park, Electronic City',
        addressLine2: 'Phase 1, behind Infosys Campus',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560100'
      },
      items: [
        {
          id: `item-${Date.now()}`,
          productId: randomProduct.id,
          productName: randomProduct.name,
          sku: randomProduct.sku,
          quantity: 1,
          unitPriceRs: randomProduct.priceRs,
          ocrVerified: false,
          visionVerified: false,
          weightVerified: false
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
    addToast(`New test order '${orderNum}' successfully generated!`, 'success');
  };

  // High-Speed Multi-Sensor Verification Auto-Pilot Dispatcher
  const runAutoPilotForOrder = async (orderId: string) => {
    if (isAutoPiloting) return;
    setIsAutoPiloting(true);
    setSimLogs([]);
    const log = (msg: string) => {
      setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        log("❌ Error: Target order not found in registry.");
        setIsAutoPiloting(false);
        return;
      }
      
      log(`🤖 SPEED-RUN TIMELINE INITIATION for Order ${order.orderNumber}`);

      // Step 1: Assign Packer if needed
      await new Promise(resolve => setTimeout(resolve, 800));
      log(`⚡ Phase 1/4: Authenticating Worker & Registering Assignment...`);
      const selectedWorker = workers.find(w => w.role === 'PACKER') || workers[0];
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        packerWorkerId: selectedWorker.id,
        packerName: selectedWorker.name,
        status: o.status === 'PENDING' ? 'ASSIGNED' : o.status
      } : o));
      log(`✓ Worker "${selectedWorker.name}" (ID ${selectedWorker.workerId}) allocated.`);

      // Step 2: Multi-Sensor Laser Checks (OCR + Color Chromatic + Weighment)
      await new Promise(resolve => setTimeout(resolve, 1000));
      log(`⚡ Phase 2/4: Executing multi-sensor OCR and RGB Chromatographic match...`);
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'PACKING',
          items: o.items.map(item => ({
            ...item,
            ocrVerified: true,
            visionVerified: true,
            weightVerified: true,
            verifiedAt: new Date().toISOString()
          }))
        };
      }));
      log(`✓ Barcode SKU sequence matching is accurate (100% match).`);
      log(`✓ Visual RGB Color camera matched correct chromatic casing.`);
      log(`✓ Package balanced on weigh-beam within specified limit.`);

      // Step 3: NFC RF-Chip Sealed
      await new Promise(resolve => setTimeout(resolve, 800));
      log(`⚡ Phase 3/4: Transmitting encrypted NDEF package payload over 13.5MHz loop...`);
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'PACKED',
        nfcSealedAt: new Date().toISOString()
      } : o));
      log(`✓ RFID/NFC physical tag encoded and sealed securely on box.`);

      // Step 4: OTP Verification & Handover
      await new Promise(resolve => setTimeout(resolve, 800));
      log(`⚡ Phase 4/4: Simulating GPS waypoint arrival & delivery OTP handover...`);
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      log(`✉ Customer SMS dispatch complete. Generated OTP code: ${randomOtp}.`);
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'DELIVERED',
        updatedAt: new Date().toISOString()
      } : o));
      log(`✓ Delivery agent handshake complete. OTP: [${randomOtp}] authorized successfully.`);
      log(`🎉 ORDER ${order.orderNumber} COMPLETELY DISPATCHED & DELIVERED!`);
      addToast(`Order ${order.orderNumber} successfully auto-piloted to delivery!`, 'success');
    } catch (err) {
      log(`❌ Error encountered: ${(err as Error).message}`);
    } finally {
      setIsAutoPiloting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] text-[#F1F5F9] font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Toast Notification Container */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${
                  n.type === 'success' ? 'bg-[#0A0F1A]/80 border-[#3F6212]/50 text-[#84CC16]' :
                  n.type === 'error' ? 'bg-[#0A0F1A]/80 border-[#991B1B]/50 text-[#F87171]' :
                  'bg-[#0A0F1A]/80 border-[#1E3A8A]/50 text-[#60A5FA]'
                }`}
              >
                {n.type === 'success' && <CheckCircle2 size={20} className="text-[#84CC16]" />}
                {n.type === 'error' && <XCircle size={20} className="text-[#F87171]" />}
                {n.type === 'info' && <Info size={20} className="text-[#60A5FA]" />}
                <p className="text-sm font-medium">{n.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center shadow-lg shadow-[#F97316]/20">
              <Package size={32} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            SmartDispatch Hub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to your administration account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#111827] py-8 px-4 shadow-2xl border border-gray-800 sm:rounded-xl sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-lg shadow-sm bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-lg shadow-sm bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#F97316] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] focus:ring-offset-gray-900 transition-colors"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-[#F1F5F9] font-sans flex flex-col md:flex-row relative selection:bg-[#F97316] selection:text-white">
      
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 40 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-[#090D16]/95 border border-[rgba(255,255,255,0.08)] shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-xl p-4 pointer-events-auto flex gap-3.5 relative overflow-hidden"
            >
              {/* Glowing Indicator bar */}
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                n.type === 'success'
                  ? 'bg-emerald-500 shadow-[0_0_12px_#10B981]'
                  : n.type === 'error'
                  ? 'bg-rose-500 shadow-[0_0_12px_#F43F5E]'
                  : 'bg-cyan-500 shadow-[0_0_12px_#06B6D4]'
              }`} />

              {/* Icon selection with premium ring colors */}
              <div className={`p-2 rounded-lg shrink-0 ${
                n.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                  : n.type === 'error'
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                  : 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
              }`}>
                {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {n.type === 'error' && <XCircle className="w-5 h-5" />}
                {n.type === 'info' && <Info className="w-5 h-5" />}
              </div>

              {/* Message Details */}
              <div className="flex-grow flex flex-col justify-center text-left">
                <span className={`text-[10px] font-mono font-black tracking-widest uppercase mb-1 ${
                  n.type === 'success'
                    ? 'text-emerald-400'
                    : n.type === 'error'
                    ? 'text-rose-400'
                    : 'text-cyan-400'
                }`}>
                  {n.type === 'success' ? 'SYSTEM SECURED ✓' : n.type === 'error' ? 'TELEMETRY EXCEPTION ⚠' : 'SIGNAL CONVEYOR'}
                </span>
                <span className="text-[11.5px] font-sans font-medium text-gray-200 leading-relaxed pr-6">{n.text}</span>
              </div>

              {/* Manual cancel button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(item => item.id !== n.id));
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition duration-150 p-0.5 rounded cursor-pointer border-none bg-transparent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* 240px FIXED SIDEBAR LAYOUT */}
      {/* ========================================================= */}
      <aside className="w-full md:w-[245px] shrink-0 bg-[#080E1C] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.08)] flex flex-col z-20">
        
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#F97316] to-[#F59E0B] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-[#F1F5F9]">SMARTDISPATCH</h1>
              <span className="text-[10px] text-[#22D3A0] uppercase font-mono tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#22D3A0] rounded-full animate-ping inline-block" />
                Live Hub
              </span>
            </div>
          </div>
          <button 
            onClick={triggerSync}
            title="Force synchronization"
            className={`p-1.5 rounded bg-[#111827] border border-[rgba(255,255,255,0.08)] text-gray-400 hover:text-white transition duration-200 cursor-pointer ${isSyncing ? 'animate-spin text-[#F97316]' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="p-4 flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders Registry', icon: Package, badge: orders.filter(o => o.status === 'PENDING').length },
            { id: 'history', label: 'Order History', icon: Clock },
            { id: 'tracking', label: 'Public Tracking', icon: MapPin },
            { id: 'print', label: 'Print Center', icon: Printer, badge: orders.filter(o => o.status === 'PACKED' && !o.printedAt).length },
            { id: 'emulator', label: 'Packer App Emulator', icon: Smartphone, badge: orders.filter(o => ['ASSIGNED', 'PACKING', 'VERIFIED'].includes(o.status)).length },
            { id: 'products', label: 'Product Catalog', icon: Box },
            { id: 'workers', label: 'Warehouse Packers', icon: Users },
            { id: 'alerts', label: 'Telemetry Alerts', icon: BellRing, badge: alerts.filter(a => !a.isResolved).length },
            { id: 'analytics', label: 'Dispatch Performance', icon: BarChart3 }
          ].map(item => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSelectedOrderId(null);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-medium tracking-wide transition relative overflow-hidden cursor-pointer ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {/* Active Sliding Background Pill */}
                {isActive && (
                  <motion.span
                    layoutId="activeNavigationPill"
                    className="absolute inset-0 bg-[#1e293b]/70 border-l-[3px] border-[#F97316] rounded-lg -z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <div className="flex items-center gap-3 z-10 relative">
                  <IconComponent className={`w-4 h-4 transition-colors duration-150 ${isActive ? 'text-[#F97316]' : 'text-gray-400 group-hover:text-gray-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md font-mono z-10 relative transition-all duration-150 ${isActive ? 'bg-[#F97316] text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-gray-800 text-gray-300'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Live Active Operator Profile Section */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#050B15] text-[11px] font-mono flex flex-col gap-1.5 text-gray-400">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-gray-500">OPERATOR:</span>
            <span className="text-[#22D3A0] font-semibold">SU-ADMIN-SHARMA</span>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-gray-500">SYSTEM STACK:</span>
            <span className="text-gray-300">Spring + Vite</span>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-gray-500">NFC ENCODER:</span>
            <span className="text-gray-300">13.56MHz Smart</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#22D3A0] rounded-full ambient-glow inline-block" />
            <span className="text-[10px] text-gray-500">NODE DISPATCH INGRESS OK</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN SYSTEM CONTENT CANVAS */}
      {/* ========================================================= */}
      <main className="flex-1 bg-[#0A0F1A] p-4 md:p-8 overflow-y-auto flex flex-col gap-6 z-10">
        
        {/* Top Header bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)] gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest font-semibold">
                SYSTEM OPERATIONAL
              </span>
              <span className="text-[10px] text-gray-500 font-mono">DOCK STATION 4</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F1F5F9] capitalize">
              {activeTab === 'print' ? 'Print Center & Labels Queue' : activeTab === 'emulator' ? 'Packer Emulator & Fast-Forward' : activeTab === 'history' ? 'Customer Order History & Timeline' : `${activeTab} Management`}
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              {activeTab === 'dashboard' && 'Continuous automated scanning metrics and warehouse dispatches.'}
              {activeTab === 'products' && 'Create and maintain specifications for OCR and vision sensor checks.'}
              {activeTab === 'orders' && 'Real-time state machine tracking from PENDING to verified physical deliveries.'}
              {activeTab === 'history' && 'Trace client delivery timelines, sensor metrics, and NFC cryptographic seals.'}
              {activeTab === 'print' && 'Render and dispatch standards-compliant thermal labels for NFC sealed orders.'}
              {activeTab === 'emulator' && 'Fast-forward packer operations, simulate mobile workflow, barcode scans, weight scales, and NFC tags.'}
              {activeTab === 'workers' && 'Track packer accuracy, throughput rates, and logged credentials.'}
              {activeTab === 'alerts' && 'Inspect optical detection errors, weight deviation triggers and manual overrides.'}
              {activeTab === 'analytics' && 'Operational reports, error ratios, and dispatch efficiency charts.'}
            </p>
          </div>

          {/* Current system clock and dynamic tags info */}
          <div className="flex flex-row items-center gap-3 self-start md:self-auto shrink-0 font-mono bg-[#111827] border border-[rgba(255,255,255,0.08)] p-3 rounded-lg text-xs">
            <Clock className="w-4 h-4 text-[#F97316]" />
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px]">GMT CALENDAR SYSTEM</span>
              <span className="text-[#F1F5F9] font-medium">{currentTime}</span>
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* INTERACTIVE TAB SYSTEM CONTROLLER */}
        {/* ========================================================= */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD METRICS */}
          {activeTab === 'dashboard' && (
            <DashboardPage
              orders={orders}
              alerts={alerts}
              setActiveTab={setActiveTab}
              setOrderStatusFilter={setOrderStatusFilter}
              addToast={addToast}
              handleResolveAlert={handleResolveAlert}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRODUCTS CATALOGUE */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <ProductsPage
              products={products}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              productCategory={productCategory}
              setProductCategory={setProductCategory}
              showAddProductModal={showAddProductModal}
              setShowAddProductModal={setShowAddProductModal}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              handleCreateProduct={handleCreateProduct}
              generateBarcodePdfSheet={generateBarcodePdfSheet}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 3: ORDERS REGISTRY & VERIFICATION FLOW */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <OrdersPage
              orders={orders}
              workers={workers}
              filteredOrders={filteredOrders}
              orderSearch={orderSearch}
              setOrderSearch={setOrderSearch}
              orderStatusFilter={orderStatusFilter}
              setOrderStatusFilter={setOrderStatusFilter}
              exportToCsv={exportToCsv}
              bulkSelectedOrderIds={bulkSelectedOrderIds}
              setBulkSelectedOrderIds={setBulkSelectedOrderIds}
              setShowBulkPrintModal={setShowBulkPrintModal}
              setShowBulkAssignModal={setShowBulkAssignModal}
              selectedOrderId={selectedOrderId}
              setSelectedOrderId={setSelectedOrderId}
              handleAssignPacker={handleAssignPacker}
              setNfcPopupOrder={setNfcPopupOrder}
              setShowNfcPopup={setShowNfcPopup}
              playBuzzerSound={playBuzzerSound}
              autoPrintEnabled={autoPrintEnabled}
              setAutoPrintCountdown={setAutoPrintCountdown}
              handleAdvanceOrderStatus={handleAdvanceOrderStatus}
              activeNfcHandshaking={activeNfcHandshaking}
              handleNfcSealTapSimulation={handleNfcSealTapSimulation}
              setSelectedPrintOrderId={setSelectedPrintOrderId}
              setActiveTab={setActiveTab}
              showBulkAssignModal={showBulkAssignModal}
              bulkAssignTargetPackerId={bulkAssignTargetPackerId}
              setBulkAssignTargetPackerId={setBulkAssignTargetPackerId}
              handleBulkAssignPacker={handleBulkAssignPacker}
              showBulkPrintModal={showBulkPrintModal}
              generateBulkConsolidatedPdfReport={generateBulkConsolidatedPdfReport}
              addToast={addToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 4: PRINT CENTER (THREE PANEL LAYOUT FROM M3-A PROMPT)*/}
          {/* ========================================================= */}
          {activeTab === 'print' && (
            <PrintCenterPage
              orders={orders}
              handlePrintAllReadyLabels={handlePrintAllReadyLabels}
              printQueueFilter={printQueueFilter}
              setPrintQueueFilter={setPrintQueueFilter}
              selectedPrintOrderId={selectedPrintOrderId}
              setSelectedPrintOrderId={setSelectedPrintOrderId}
              isEditLabelMode={isEditLabelMode}
              setIsEditLabelMode={setIsEditLabelMode}
              handleSaveLabelEdits={handleSaveLabelEdits}
              editLabelData={editLabelData}
              setEditLabelData={setEditLabelData}
              handleMarkPrinted={handleMarkPrinted}
              activeNfcHandshaking={activeNfcHandshaking}
              handleNfcSealTapSimulation={handleNfcSealTapSimulation}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 5: WAREHOUSE PACKERS */}
          {/* ========================================================= */}
          {activeTab === 'workers' && (
            <WorkersPage 
              workers={workers}
              setWorkers={setWorkers}
              showAddWorkerModal={showAddWorkerModal}
              setShowAddWorkerModal={setShowAddWorkerModal}
              newWorkerName={newWorkerName}
              setNewWorkerName={setNewWorkerName}
              newWorkerRole={newWorkerRole}
              setNewWorkerRole={setNewWorkerRole}
              addToast={addToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 6: TELEMETRY ALERTS TRAGS */}
          {/* ========================================================= */}
          {activeTab === 'alerts' && (
            <AlertsPage 
              alerts={alerts}
              handleResolveAlert={handleResolveAlert}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 7: DISPATCH PERFORMANCE METRICS */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <PerformancePage 
              orders={orders}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: CUSTOMER ORDER HISTORY & TIMELINE */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <HistoryPage
              orders={orders}
              selectedHistoryCustomer={selectedHistoryCustomer}
              setSelectedHistoryCustomer={setSelectedHistoryCustomer}
              addToast={addToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 8: WAREHOUSE PACKER EMULATOR & HIGH SPEED TESTING */}
          {/* ========================================================= */}
          {activeTab === 'emulator' && (
            <EmulatorPage
              orders={orders}
              setOrders={setOrders}
              workers={workers}
              addToast={addToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 9: PUBLIC TRACKING */}
          {/* ========================================================= */}
          {activeTab === 'tracking' && (
            <TrackingPage />
          )}

          {/* ========================================================= */}
          {/* TAB 10: NFC ORDER DATA (Admin view) */}
          {/* ========================================================= */}
          {activeTab === 'nfc-order' && nfcOrderData && (
            <NfcOrderDetailPage 
              nfcData={nfcOrderData} 
              onBack={() => setActiveTab('dashboard')} 
            />
          )}

        </AnimatePresence>

      </main>

      {/* FLOATING NFC SCAN BUTTON */}
      {isAuthenticated && (
        <NfcScanButton 
          onNfcScanned={(payload) => {
            setNfcOrderData(payload);
            setActiveTab('nfc-order');
          }} 
        />
      )}

    </div>
  );
}
