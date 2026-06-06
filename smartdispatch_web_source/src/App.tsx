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
import { BackendApi } from './services/backendApi';
import { authService } from './services/authService';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'print' | 'workers' | 'alerts' | 'emulator' | 'analytics' | 'history'>('dashboard');
  
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
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              {/* Stats overview banner staggered entry */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                
                {/* Stat block 1 */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusFilter('PENDING');
                    addToast("Navigated to Pending Orders", "info");
                  }}
                  className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-[#F97316]/40 transition duration-350 cursor-pointer"
                >
                  <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pending Orders</span>
                    <span className="text-2xl font-bold font-mono text-[#F1F5F9] mt-1 block">
                      {orders.filter(o => o.status === 'PENDING').length}
                    </span>
                    <span className="text-[10px] text-[#F97316] font-semibold mt-1 inline-flex items-center gap-1">
                      Needs packing assign
                    </span>
                  </div>
                  <div className="absolute right-0 bottom-0 top-0 w-1 bg-amber-500 opacity-60" />
                </motion.div>
 
                {/* Stat block 2 */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusFilter('PACKING');
                    addToast("Navigated to Active Packing Orders", "info");
                  }}
                  className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-blue-500/40 transition duration-350 cursor-pointer"
                >
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Packing Now</span>
                    <span className="text-2xl font-bold font-mono text-[#F1F5F9] mt-1 block">
                      {orders.filter(o => ['ASSIGNED', 'PACKING'].includes(o.status)).length}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold mt-1 inline-flex items-center gap-1">
                      Active on Flutter App
                    </span>
                  </div>
                  <div className="absolute right-0 bottom-0 top-0 w-1 bg-blue-500 opacity-60" />
                </motion.div>
 
                {/* Stat block 3 */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
                  onClick={() => {
                    setActiveTab('print');
                    addToast("Navigated to Print Center (NFC Sealed Orders Queue)", "info");
                  }}
                  className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-[#22D3A0]/40 transition duration-350 cursor-pointer"
                >
                  <div className="p-3 bg-[#22D3A0]/10 rounded-lg text-[#22D3A0]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">NFC Sealed Sealed</span>
                    <span className="text-2xl font-bold font-mono text-[#22D3A0] mt-1 block">
                      {orders.filter(o => ['PACKED', 'SHIPPED', 'DELIVERED'].includes(o.status)).length}
                    </span>
                    <span className="text-[10px] text-[#22D3A0] font-semibold mt-1 inline-flex items-center gap-1">
                      Zero errors reported
                    </span>
                  </div>
                  <div className="absolute right-0 bottom-0 top-0 w-1 bg-[#22D3A0] opacity-60" />
                </motion.div>
 
                {/* Stat block 4 */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
                  onClick={() => {
                    setActiveTab('alerts');
                    addToast("Navigated to Telemetry Alerts Ledger", "info");
                  }}
                  className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-start gap-4 shadow-md relative overflow-hidden group hover:border-[#EF4444]/40 transition duration-350 cursor-pointer"
                >
                  <div className="p-3 bg-[#EF4444]/10 rounded-lg text-[#EF4444]">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Active Alerts</span>
                    <span className="text-2xl font-bold font-mono text-[#EF4444] mt-1 block">
                      {alerts.filter(a => !a.isResolved).length}
                    </span>
                    <span className="text-[10px] text-[#EF4444] font-semibold mt-1 inline-flex items-center gap-1">
                      Optical/Weight mismatch
                    </span>
                  </div>
                  <div className="absolute right-0 bottom-0 top-0 w-1 bg-[#EF4444] opacity-60" />
                </motion.div>
 
              </motion.div>

              {/* Warehouse dispatch center flow overview helper banner */}
              <div className="bg-gradient-to-r from-blue-950/40 via-[#0A0F1A] to-amber-950/40 border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#22D3A0] rounded-full animate-ping shrink-0" />
                  <p className="text-xs text-gray-300 font-medium max-w-2xl">
                    <strong className="text-white">SmartDispatch Dispatch Flow Guide:</strong> Products are compiled into orders. Warehouse packers scan items over the Flutter Mobile App (verifying OCR text + RGB color camera checks + standard weight tolerances). Sealed items write physical order hashes into local <strong className="text-[#F97316]">NFC chips</strong> before being released to the Delivery driver.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('print')}
                  className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono flex items-center gap-2 tracking-wide transition duration-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Center Queue →
                </button>
              </div>

              {/* Grid content blocks */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Left col - Recent Orders */}
                <div className="xl:col-span-7 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Registry: Recent Orders Status</h3>
                      <p className="text-[11px] text-gray-500 font-mono">Live synchronization with barcode scanners</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-[#F97316] hover:underline hover:text-amber-500 inline-flex items-center gap-1 font-semibold"
                    >
                      View all orders
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-900/40 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                          <th className="p-4 font-semibold">Order ID</th>
                          <th className="p-4 font-semibold">Customer</th>
                          <th className="p-4 font-semibold">Quantity</th>
                          <th className="p-4 font-semibold">Total Price</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold">Packer Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id} className="hover:bg-gray-800/20 transition-colors">
                            <td className="p-4 font-mono text-gray-300 font-semibold">{o.orderNumber}</td>
                            <td className="p-4">
                              <span className="font-semibold block text-white">{o.customerName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{o.shippingAddress.city}, {o.shippingAddress.state}</span>
                            </td>
                            <td className="p-4 text-center font-semibold text-gray-300 font-mono">
                              {o.items.reduce((sum, item) => sum + item.quantity, 0)} items
                            </td>
                            <td className="p-4 font-semibold text-gray-300 font-mono">₹{o.totalRs.toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wide ${
                                o.status === 'PENDING' ? 'bg-[#1F2937] text-gray-300 border border-gray-600/20' :
                                o.status === 'ASSIGNED' ? 'bg-blue-950/40 text-blue-400 border border-blue-500/10' :
                                o.status === 'PACKING' ? 'bg-amber-950/40 text-amber-500 border border-amber-500/25' :
                                o.status === 'VERIFIED' ? 'bg-purple-950/40 text-purple-400 border border-purple-500/10' :
                                o.status === 'PACKED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/25' :
                                o.status === 'SHIPPED' ? 'bg-[#0F172A] text-sky-400 border border-sky-400/20' :
                                'bg-[#0F172A] text-emerald-400 border border-emerald-400/40' // Delivered
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-gray-400">
                              {o.packerName ? (
                                <span className="inline-flex items-center gap-1.5 text-gray-300">
                                  <UserCheck className="w-3 h-3 text-[#22D3A0]" />
                                  {o.packerName}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">Unassigned</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right col - Recent Telemetry Alerts */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                  
                  {/* Alert panel block */}
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">Anomalous Telemetry Feeds</h3>
                        <p className="text-[11px] text-gray-500 font-mono">Optical OCR scanning sensor logs</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-950 text-red-400 rounded border border-red-500/20">
                        {alerts.filter(a => !a.isResolved).length} UNRESOLVED
                      </span>
                    </div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.08
                          }
                        }
                      }}
                      initial="hidden"
                      animate="show"
                      className="p-4 flex flex-col gap-3 max-h-[360px] overflow-y-auto"
                    >
                      {alerts.map(alert => (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 12 },
                            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
                          }}
                          whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
                          key={alert.id}
                          className={`p-3.5 rounded-lg border transition-colors duration-200 ${
                            alert.isResolved
                              ? 'bg-gray-950/20 border-[rgba(255,255,255,0.04)] text-gray-500'
                              : alert.severity === 'CRITICAL'
                              ? 'bg-rose-950/10 border-rose-500/20 text-rose-300'
                              : 'bg-amber-950/10 border-amber-500/20 text-amber-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                alert.isResolved ? 'bg-gray-600' : alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                              }`} />
                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-gray-900/60 px-2 py-0.5 rounded text-gray-300">
                                {alert.alertType}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-gray-500">
                              {alert.createdAt.substring(11, 16)} GMT
                            </span>
                          </div>
                          
                          <p className={`text-[11px] mt-2 block leading-relaxed ${alert.isResolved ? 'text-gray-500' : 'text-gray-200'}`}>
                            <strong className="text-white font-semibold block mb-0.5">Order {alert.orderNumber}</strong>
                            {alert.detail}
                          </p>

                          {alert.workerName && (
                            <span className="text-[10px] text-gray-400 font-mono mt-1.5 block">
                              Packer unit: {alert.workerName}
                            </span>
                          )}

                          <div className="mt-2.5 flex items-center justify-end">
                            {alert.isResolved ? (
                              <span className="text-[10px] font-mono text-emerald-400 inline-flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Resolved
                              </span>
                            ) : (
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                className="px-3 py-1 text-[10px] font-bold font-mono rounded bg-white text-gray-950 hover:bg-orange-500 hover:text-white transition duration-150 cursor-pointer"
                              >
                                Supervisor Resolve Flags
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* System stats block */}
                  <div className="bg-gradient-to-br from-[#111827] to-[#080E1C] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wide">Optical Accuracy Engine</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-mono text-[#22D3A0]">99.1%</span>
                        <span className="text-[10px] text-gray-500 font-mono">GLOBAL MEAN</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 max-w-sm">
                        Calculated from OCR SKU correlation, RGB neural models and weighment specifications over 1,220 dispatches.
                      </p>
                    </div>
                    <ShieldCheck className="w-12 h-12 text-[#22D3A0] opacity-20" />
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRODUCTS CATALOGUE */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Search / Filters block */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search name, brand, SKU..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs placeholder-gray-500 text-white min-w-[200px] outline-none focus:border-[#F97316] transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5">
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <select
                      value={productCategory}
                      onChange={e => setProductCategory(e.target.value)}
                      className="bg-transparent border-0 py-2 text-xs text-gray-300 pointer-events-auto outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Clothing">Clothing</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono flex items-center gap-2 tracking-wide transition duration-150 cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Specification Item
                </button>
              </div>

              {/* Products Catalog Table Grid */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden mt-4">
                <div className="p-4 bg-gray-900/30 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-widest font-semibold">Active Optical Registry Specifications</span>
                  <span className="text-[11px] text-[#F97316] font-mono">{products.length} Products listed</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900/40 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                        <th className="p-4">Visual asset</th>
                        <th className="p-4">SKU / Model</th>
                        <th className="p-4">Brand / Title</th>
                        <th className="p-4">OCR Check String</th>
                        <th className="p-4">Weight Spec</th>
                        <th className="p-4">Sensor Color</th>
                        <th className="p-4 text-right">Standard Rate</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                      {products
                        .filter(p => {
                          const query = productSearch.toLowerCase();
                          const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query);
                          const matchesCat = productCategory === 'All' || p.category === productCategory;
                          return matchesSearch && matchesCat;
                        })
                        .map(p => (
                          <tr key={p.id} className="hover:bg-gray-800/25 transition-colors">
                            <td className="p-4">
                              <img
                                src={p.photos[0]}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-24 h-24 rounded object-cover border border-[rgba(255,255,255,0.08)]"
                              />
                            </td>
                            <td className="p-4">
                              <span className="font-mono text-gray-300 font-bold block">{p.sku}</span>
                              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block mt-0.5">{p.category}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-white font-bold block">{p.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{p.brand} · {p.modelNumber}</span>
                            </td>
                            <td className="p-4 font-mono font-semibold text-amber-500">
                              {p.sku} {p.brand} {p.modelNumber.substring(0, 5)}
                            </td>
                            <td className="p-4">
                              <span className="font-mono text-gray-300 font-bold block">{p.weightKg.toFixed(2)} kg</span>
                              <span className="text-[9px] text-gray-500 font-mono block">±{p.weightToleranceGrams}g limits</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-gray-600 shadow-sm inline-block shrink-0" style={{ backgroundColor: p.colorHex }} />
                                <span className="text-gray-300 font-medium">{p.colorName}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono text-gray-300 font-bold">
                              ₹{p.priceRs.toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => generateBarcodePdfSheet(p.sku, p.name)}
                                title="Download printable barcode tags"
                                className="px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-gray-900 border border-gray-800 text-[#F97316] hover:bg-[#F97316] hover:text-white hover:border-[#F97316] transition duration-150 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Barcode tags
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Product Modal Drawer Simulation */}
              <AnimatePresence>
                {showAddProductModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#111827] border border-[rgba(255,255,255,0.12)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col gap-6"
                    >
                    <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <PlusCircle className="text-[#F97316] w-5 h-5" />
                          New Optical Verification Specification
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">Specify correct labels, HEX colors and metric thresholds for OCR camera comparison.</p>
                      </div>
                      <button
                        onClick={() => setShowAddProductModal(false)}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateProduct} className="flex flex-col gap-5">
                      {/* Section A */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">PRODUCT SPECIFICATION NAME *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dell Inspiron 15"
                            value={newProduct.name}
                            onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">BRAND TITLE *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dell / HP"
                            value={newProduct.brand}
                            onChange={e => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Section B / C */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">SKU BARCODE PATTERN *</label>
                          <input
                            type="text"
                            required
                            placeholder="SKU-XXXX-XXXX"
                            value={newProduct.sku}
                            onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 font-mono outline-none focus:border-[#F97316] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">MODEL NUMBER</label>
                          <input
                            type="text"
                            placeholder="e.g. IN3520-22"
                            value={newProduct.modelNumber}
                            onChange={e => setNewProduct(prev => ({ ...prev, modelNumber: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">CATEGORY</label>
                          <select
                            value={newProduct.category}
                            onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white outline-none focus:border-[#F97316] transition-colors"
                          >
                            <option value="Electronics">Electronics</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Clothing">Clothing</option>
                          </select>
                        </div>
                      </div>

                      {/* Weight Tolerances */}
                      <div className="p-4 bg-gray-950/40 rounded-lg border border-[rgba(255,255,255,0.04)]">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider block mb-3 font-mono">Sensoring Metrics (RGB Camera + Weight Bounds)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[10px] text-gray-400 font-mono block mb-1">COLOR NAME</label>
                            <input
                              type="text"
                              placeholder="e.g. Silver"
                              value={newProduct.colorName}
                              onChange={e => setNewProduct(prev => ({ ...prev, colorName: e.target.value }))}
                              className="w-full px-3 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-mono block mb-1">HEX RGB SWATCH</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={newProduct.colorHex}
                                onChange={e => setNewProduct(prev => ({ ...prev, colorHex: e.target.value }))}
                                className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={newProduct.colorHex}
                                onChange={e => setNewProduct(prev => ({ ...prev, colorHex: e.target.value }))}
                                className="w-full px-2 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] text-white text-xs font-mono rounded"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-mono block mb-1">STANDARD MASS (KG)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="2.5"
                              value={newProduct.weightKg}
                              onChange={e => setNewProduct(prev => ({ ...prev, weightKg: Number(e.target.value) }))}
                              className="w-full px-3 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white text-right font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-mono block mb-1">TOLERANCE (GRAMS)</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={newProduct.weightToleranceGrams}
                              onChange={e => setNewProduct(prev => ({ ...prev, weightToleranceGrams: Number(e.target.value) }))}
                              className="w-full px-3 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white text-right font-mono"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-[#F97316] font-mono mt-3">
                          * Neural sensors cross-check physical packaging RGB values and force sensors against these specifications.
                        </p>
                      </div>

                      {/* Pricing and Stock */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">STANDARD STOCK QUANTITY</label>
                          <input
                            type="number"
                            value={newProduct.stockQty}
                            onChange={e => setNewProduct(prev => ({ ...prev, stockQty: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white text-right font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">PRICE IN INDIAN RUPEES (₹)</label>
                          <input
                            type="number"
                            value={newProduct.priceRs}
                            onChange={e => setNewProduct(prev => ({ ...prev, priceRs: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white text-right font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                        <button
                          type="button"
                          onClick={() => setShowAddProductModal(false)}
                          className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 whitespace-nowrap bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                        >
                          Save Specifications
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ORDERS REGISTRY & VERIFICATION FLOW */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <motion.div
                key="orders"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Left col: Orders List with stats filter */}
                  <div className="flex-1 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden self-start w-full">
                    
                    <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search order number or name..."
                          value={orderSearch}
                          onChange={e => setOrderSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs placeholder-gray-500 text-white min-w-[220px] outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex wrap items-center gap-1.5 p-1 bg-gray-900 rounded-lg">
                          {['ALL', 'PENDING', 'PACKING', 'PACKED', 'DELIVERED'].map((filterVal) => (
                            <button
                              key={filterVal}
                              onClick={() => setOrderStatusFilter(filterVal as any)}
                              className={`px-3 py-1 text-[10px] font-bold uppercase rounded font-mono transition duration-150 cursor-pointer ${
                                orderStatusFilter === filterVal ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {filterVal}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={exportToCsv}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold tracking-wide transition duration-150 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(16,185,129,0.15)] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                        </button>
                      </div>
                    </div>

                    {/* Sliding Bulk Assignment Active Bar */}
                    {bulkSelectedOrderIds.length > 0 && (
                      <div className="bg-[#1E293B] border-b border-[rgba(255,255,255,0.08)] p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                          <span className="text-xs font-mono text-gray-300">
                            <strong className="text-white font-semibold font-mono">{bulkSelectedOrderIds.length}</strong> orders selected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowBulkPrintModal(true)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono font-bold text-[11px] tracking-wide transition duration-150 flex items-center gap-1.5 shadow-[0_0_12px_rgba(37,99,235,0.2)] cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Bulk Print Preview
                          </button>
                          <button
                            onClick={() => setShowBulkAssignModal(true)}
                            className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded font-mono font-bold text-[11px] tracking-wide transition duration-150 flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.2)] cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Bulk Assign Packer
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-900/40 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                            <th className="p-4 w-[40px]">
                              <input
                                type="checkbox"
                                checked={filteredOrders.length > 0 && filteredOrders.every(o => bulkSelectedOrderIds.includes(o.id))}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setBulkSelectedOrderIds(filteredOrders.map(o => o.id));
                                  } else {
                                    setBulkSelectedOrderIds([]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-700 bg-[#0A0F1A] text-[#F97316] accent-[#F97316] focus:ring-0 cursor-pointer"
                                onClick={e => e.stopPropagation()}
                              />
                            </th>
                            <th className="p-4">ID Reference</th>
                            <th className="p-4">Client Name</th>
                            <th className="p-4">Item Breakdown</th>
                            <th className="p-4">Order Value</th>
                            <th className="p-4">Assigned Packer</th>
                            <th className="p-4">Verification Check</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                          {filteredOrders.map(o => {
                            const isSelected = selectedOrderId === o.id;
                            const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
                            const verifiedCount = o.items.filter(i => i.ocrVerified && i.visionVerified && i.weightVerified).length;
                            const isAllVerified = verifiedCount === o.items.length;
                            
                            const isBulkSelected = bulkSelectedOrderIds.includes(o.id);
                            
                            return (
                              <tr
                                key={o.id}
                                className={`transition-colors cursor-pointer ${
                                  isSelected ? 'bg-orange-500/10 hover:bg-orange-500/15' : 'hover:bg-gray-800/15'
                                } ${isBulkSelected ? 'bg-orange-500/5' : ''}`}
                                onClick={() => setSelectedOrderId(o.id)}
                              >
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isBulkSelected}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setBulkSelectedOrderIds(prev => [...prev, o.id]);
                                      } else {
                                        setBulkSelectedOrderIds(prev => prev.filter(id => id !== o.id));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-gray-700 bg-gray-800 text-[#F97316] accent-[#F97316] focus:ring-0 cursor-pointer"
                                  />
                                </td>
                                <td className="p-4 font-mono">
                                  <div className="font-bold text-[#F1F5F9]">{o.orderNumber}</div>
                                  <span className="text-[10px] text-gray-500 block">Created: {o.createdAt.substring(11, 16)} GMT</span>
                                </td>
                                <td className="p-4 font-bold text-white">{o.customerName}</td>
                                <td className="p-4 font-mono text-gray-300">
                                  {totalQty} product{totalQty > 1 ? 's' : ''}
                                </td>
                                <td className="p-4 font-mono font-bold text-gray-300">
                                  ₹{o.totalRs.toLocaleString('en-IN')}
                                </td>
                                <td className="p-4">
                                  {o.packerName ? (
                                    <span className="text-gray-300 font-semibold">{o.packerName}</span>
                                  ) : (
                                    <select
                                      defaultValue=""
                                      onClick={e => e.stopPropagation()}
                                      onChange={e => {
                                        if (e.target.value) handleAssignPacker(o.id, e.target.value);
                                      }}
                                      className="bg-gray-800 text-gray-300 rounded border border-gray-700 p-1.5 text-xs text-left"
                                    >
                                      <option value="" disabled>Assign Packer</option>
                                      {workers.filter(w => w.isActive).map(w => (
                                        <option key={w.id} value={w.id}>{w.name} ({w.workerId})</option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="p-4">
                                  {o.status === 'PENDING' ? (
                                    <span className="text-gray-500 font-mono text-[10px] uppercase">Unassigned</span>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold ${
                                        o.status === 'DELIVERED' || o.status === 'PACKED' || o.status === 'VERIFIED'
                                          ? 'bg-emerald-950 text-emerald-400'
                                          : 'bg-amber-950 text-amber-500 animate-pulse'
                                      }`}>
                                        {verifiedCount}/{o.items.length} items ok
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2 px-1">
                                    {o.status === 'PACKED' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNfcPopupOrder(o);
                                          setShowNfcPopup(true);
                                          playBuzzerSound();
                                          if (autoPrintEnabled) {
                                            setAutoPrintCountdown(3);
                                          }
                                        }}
                                        className="bg-[#22D3A0]/10 text-[#22D3A0] hover:bg-[#22D3A0]/20 border border-[#22D3A0]/25 px-2.5 py-1 rounded text-[10px] font-bold font-mono tracking-wide flex items-center gap-1.5 transition duration-150 cursor-pointer"
                                        title="Instant Thermal Print Dispatch Label"
                                      >
                                        <Printer className="w-3.5 h-3.5" /> Print Label
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOrderId(o.id);
                                      }}
                                      className="text-[#F97316] hover:underline font-bold text-xs font-mono cursor-pointer shrink-0"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right col: Order Details inspection pane */}
                <div className="w-full lg:w-[380px] bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shrink-0 flex flex-col gap-5 p-5">
                  {selectedOrderId ? (
                    (() => {
                      const order = orders.find(o => o.id === selectedOrderId)!;
                      const verifiedCount = order.items.filter(i => i.ocrVerified && i.visionVerified && i.weightVerified).length;
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
                            <div>
                              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">DRILL-DOWN LOGS</span>
                              <h3 className="text-sm font-bold font-mono text-[#F97316]">{order.orderNumber}</h3>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase font-mono ${
                              order.status === 'PENDING' ? 'bg-[#1F2937] text-gray-300' :
                              order.status === 'PACKED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                              'bg-amber-950 text-amber-400 border border-amber-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          {/* Customer Profile */}
                          <div>
                            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase block mb-1">CLIENT PROFILE</span>
                            <div className="p-3 bg-gray-950/40 rounded-lg text-xs leading-relaxed border border-[rgba(255,255,255,0.03)]">
                              <span className="text-white font-bold block">{order.customerName}</span>
                              <span className="text-gray-400 block font-mono">{order.customerPhone}</span>
                              <span className="text-gray-400 font-mono text-[11px] block mt-1.5">
                                {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}, {order.shippingAddress.city}, {order.shippingAddress.pinCode}
                              </span>
                            </div>
                          </div>

                          {/* Items status */}
                          <div>
                            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase block mb-1.5">VERIFICATION MATRIX</span>
                            <div className="flex flex-col gap-2">
                              {order.items.map(item => (
                                <div key={item.id} className="p-3 bg-gray-950/20 rounded-lg border border-[rgba(255,255,255,0.02)]">
                                  <span className="text-[11px] font-bold text-white block mb-2">{item.productName}</span>
                                  <div className="grid grid-cols-3 gap-1 px-1">
                                    <div className="flex flex-col items-center p-1.5 bg-gray-900/50 rounded border border-gray-800 text-center">
                                      <span className="text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">[OCR SKU]</span>
                                      <span className={`text-[10px] font-mono font-bold mt-1 inline-flex items-center gap-1 ${item.ocrVerified ? 'text-[#22D3A0]' : 'text-gray-500 animate-pulse'}`}>
                                        {item.ocrVerified ? 'PASS ✓' : 'PEND !'}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center p-1.5 bg-gray-900/50 rounded border border-gray-800 text-center">
                                      <span className="text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">[RGB COLOR]</span>
                                      <span className={`text-[10px] font-mono font-bold mt-1 inline-flex items-center gap-1 ${item.visionVerified ? 'text-[#22D3A0]' : 'text-gray-500 animate-pulse'}`}>
                                        {item.visionVerified ? 'PASS ✓' : 'PEND !'}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center p-1.5 bg-gray-900/50 rounded border border-gray-800 text-center">
                                      <span className="text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">[WEIGHMENT]</span>
                                      <span className={`text-[10px] font-mono font-bold mt-1 inline-flex items-center gap-1 ${item.weightVerified ? 'text-[#22D3A0]' : 'text-gray-500 animate-pulse'}`}>
                                        {item.weightVerified ? 'PASS ✓' : 'PEND !'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dynamic Emulated Operations buttons */}
                          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
                            {order.status === 'PENDING' && (
                              <p className="text-[11px] text-gray-400 italic font-mono text-center">Assign to active worker to trigger packing sensor simulation workflow.</p>
                            )}

                            {order.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order.id)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                              >
                                Trigger Worker Packing Scan
                              </button>
                            )}

                            {order.status === 'PACKING' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order.id)}
                                className="w-full py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                              >
                                Emulate OCR + Weight Sensor PASS
                              </button>
                            )}

                            {order.status === 'VERIFIED' && (
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] text-center text-amber-500 font-mono block animate-pulse">✓ ALL SENSORS VALID — SYSTEM READY FOR PHYSICAL SEAL</span>
                                {activeNfcHandshaking && activeNfcHandshaking.orderId === order.id ? (
                                  <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30 text-center flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-emerald-500/5 animate-pulse" />
                                    <div className="relative">
                                      <motion.div
                                        className="absolute inset-x-[-12px] inset-y-[-12px] rounded-full bg-emerald-400/20"
                                        animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                      />
                                      <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-400/40 flex items-center justify-center z-10 relative">
                                        <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider animate-pulse flex items-center gap-1.5 z-10">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                      300ms Cryptographic Coupling...
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleNfcSealTapSimulation(order.id)}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
                                  >
                                    <Wifi className="w-4 h-4 animate-bounce" />
                                    Pulse Phone NFC Seal (13.56MHz)
                                  </button>
                                )}
                              </div>
                            )}

                            {order.status === 'PACKED' && (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPrintOrderId(order.id);
                                    setActiveTab('print');
                                  }}
                                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-[#F97316] border border-[#F97316]/30 rounded text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
                                >
                                  <Printer className="w-4 h-4" /> Load Print Center Label
                                </button>
                                <button
                                  onClick={() => handleAdvanceOrderStatus(order.id)}
                                  className="w-full py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                                >
                                  Dispatch to Shipping Truck
                                </button>
                              </div>
                            )}

                            {order.status === 'SHIPPED' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order.id)}
                                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
                              >
                                Mock OTP Delivery Verification
                              </button>
                            )}

                            {order.status === 'DELIVERED' && (
                              <span className="text-center p-3 bg-emerald-950/40 rounded border border-emerald-500/20 text-[#22D3A0] text-xs font-mono font-semibold block uppercase">
                                Delivered Successfully
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-20 text-gray-500 font-mono select-none">
                      <FileCheck2 className="w-12 h-12 text-gray-600 mb-3" />
                      <p className="text-xs">SELECT AN ORDER REGISTRY RECORD</p>
                      <p className="text-[10px] text-gray-600 max-w-[200px] mt-1">Select from listing on left to view simulated hardware scanning states.</p>
                    </div>
                  )}
                </div>

              </div>

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PRINT CENTER (THREE PANEL LAYOUT FROM M3-A PROMPT)*/}
          {/* ========================================================= */}
          {activeTab === 'print' && (
            <motion.div
              key="print"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-5"
            >
              
              {/* Dynamic Queue Print Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Printer className="text-amber-500 w-4 h-4" />
                    Automated Thermal Label Dispatch Queue
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    Total Packed Orders Ready for Carrier Handover: <span className="text-[#22D3A0] font-bold">{orders.filter(o => o.status === 'PACKED').length}</span>
                  </p>
                </div>
                <button
                  onClick={handlePrintAllReadyLabels}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-[#EA580C] hover:to-[#C2410C] text-white font-mono text-xs font-bold rounded-lg transition-transform duration-150 active:scale-95 flex items-center gap-2 shadow-[0_4px_12px_rgba(234,88,12,0.18)] self-start sm:self-auto cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print All Ready Labels (Packed)
                </button>
              </div>

              {/* Three-panel grid matching the specification exactly */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* ═══ LEFT PANEL ═══ Print Queue */}
                <div className="xl:col-span-3 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                    <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider block">PACKAGING QUEUE</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">Shipping Queue</h3>
                  </div>

                  {/* Filter selector */}
                  <div className="grid grid-cols-4 p-1.5 bg-gray-950/60 border-b border-[rgba(255,255,255,0.05)] text-[10px] font-mono">
                    {(['all', 'ready', 'packing', 'printed'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setPrintQueueFilter(f)}
                        className={`py-1 rounded text-center uppercase font-bold transition duration-150 cursor-pointer ${
                          printQueueFilter === f ? 'bg-[#F97316] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Queue List */}
                  <div className="flex flex-col max-h-[500px] overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
                    {orders
                      .filter(o => {
                        if (printQueueFilter === 'all') return true;
                        if (printQueueFilter === 'ready') return o.status === 'PACKED' && !o.printedAt;
                        if (printQueueFilter === 'packing') return ['ASSIGNED', 'PACKING', 'VERIFIED'].includes(o.status);
                        if (printQueueFilter === 'printed') return o.printedAt != null;
                        return true;
                      })
                      .map(o => {
                        const isSelectedRef = selectedPrintOrderId === o.id;
                        const isUrgent = o.totalRs > 50000;
                        const verifiedAtSomePoint = o.items.every(i => i.ocrVerified && i.visionVerified && i.weightVerified);
                        return (
                          <div
                            key={o.id}
                            onClick={() => {
                              setSelectedPrintOrderId(o.id);
                              setIsEditLabelMode(false);
                            }}
                            className={`p-3.5 text-left border-l-4 transition-all cursor-pointer ${
                              isSelectedRef ? 'bg-orange-500/10 border-l-[#F97316]' : 'hover:bg-gray-800/15 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-[#F97316]">{o.orderNumber}</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-[#EF4444]' : 'bg-[#22D3A0]'}`} title={isUrgent ? 'Urgent Value' : 'Normal Priority'} />
                            </div>
                            <span className="text-xs font-semibold text-white block mt-1">{o.customerName}</span>
                            
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-2">
                              <span>{o.items.length} SKUs</span>
                              <span>·</span>
                              <span>{o.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono">
                              {o.nfcSealedAt ? (
                                <span className="text-emerald-400 inline-flex items-center gap-1">
                                  <Wifi className="w-3 h-3 rotate-90" /> NFC Sealed
                                </span>
                              ) : (
                                <span className="text-amber-500 uppercase">Wait Seal...</span>
                              )}

                              {o.printedAt ? (
                                <span className="text-gray-500">Printed</span>
                              ) : (
                                <span className="bg-amber-950/60 text-amber-500 px-1.5 py-0.5 rounded">READY PRINT</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* ═══ CENTRE PANEL ═══ Label Preview */}
                <div className="xl:col-span-6 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 flex flex-col gap-4">
                  
                  {/* Toolbar */}
                  {(() => {
                    const orderItem = orders.find(o => o.id === selectedPrintOrderId);
                    if (!orderItem) return <p className="text-xs text-gray-500 mt-10 text-center font-mono">No order selected in queue</p>;
                    const allPass = orderItem.items.every(i => i.ocrVerified && i.visionVerified && i.weightVerified);
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4 gap-3">
                          <div>
                            <span className="text-[10px] text-[#64748B] font-mono block">ACTIVE PREVIEW</span>
                            <span className="text-sm font-bold text-white font-mono">{orderItem.orderNumber} ({orderItem.customerName})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditLabelMode ? (
                              <>
                                <button
                                  onClick={() => handleSaveLabelEdits(orderItem.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold font-mono tracking-wide flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" /> Save Specs
                                </button>
                                <button
                                  onClick={() => setIsEditLabelMode(false)}
                                  className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded text-xs font-bold font-mono tracking-wide cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setIsEditLabelMode(true)}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit Template
                              </button>
                            )}

                            <button
                              onClick={() => {
                                handleMarkPrinted(orderItem.id);
                                window.print();
                              }}
                              className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Standard A6
                            </button>
                          </div>
                        </div>

                        {/* Physical Print Copy standard A6 card */}
                        <div className="bg-white text-gray-950 p-6 rounded-lg max-w-sm sm:max-w-md w-full mx-auto shadow-2xl border-2 border-gray-900 flex flex-col gap-4 font-sans select-text relative">
                          
                          {/* QR Verified Badge Indicator */}
                          {orderItem.qrVerified && (
                            <div className="absolute top-3 right-3 z-30 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-mono font-black py-1 px-2.5 rounded-md shadow-[0_4px_12px_rgba(16,185,129,0.30)] animate-pulse flex items-center gap-1 leading-none">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>QR VERIFIED</span>
                            </div>
                          )}

                          {/* Heading label bar Header */}
                          <div className="border-b-4 border-gray-900 pb-3 flex items-start justify-between">
                            <div>
                              <span className="text-sm tracking-wider font-extrabold uppercase bg-gray-950 text-white px-2.5 py-0.5 rounded">SMARTDISPATCH</span>
                              <span className="text-[10px] text-gray-600 font-mono block mt-1 tracking-widest font-bold">WAREHOUSE SYSTEM STANDARD</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black font-mono uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-sm inline-block">
                                {orderItem.totalRs > 50000 ? 'PRIORITY URGENT' : 'STANDARD SHIP'}
                              </span>
                              <span className="text-[10px] text-gray-600 font-mono font-bold block mt-1">DOCK BAY 4</span>
                            </div>
                          </div>

                          {/* Barcode section */}
                          <div className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded border border-gray-300">
                            {/* Simple simulated vector styled barcode lines representing SKU */}
                            <div className="flex gap-[2px] items-stretch h-14 bg-transparent">
                              {[3, 1, 4, 1, 5, 2, 6, 2, 7, 1, 8, 3, 4, 1, 2, 1, 5, 3, 2, 4, 1, 2, 1, 5, 1, 8].map((w, index) => (
                                <div key={index} className={`bg-gray-950`} style={{ width: `${w * 1.5}px` }} />
                              ))}
                            </div>
                            <span className="text-xs font-mono font-bold mt-1.5 tracking-widest block text-gray-800">
                              *{orderItem.orderNumber.replace('ORD-', 'SKU-')}*
                            </span>
                          </div>

                          {/* Address Delivery blocks */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="border-r border-gray-300 pr-2">
                              <span className="text-[10px] font-bold text-gray-500 tracking-wider block mb-0.5">DISPATCH WAREHOUSE:</span>
                              <span className="font-bold text-gray-900 block">SMARTDISPATCH HUB 04</span>
                              <span className="text-gray-600 block leading-tight text-[11px] mt-0.5">
                                Sector 12 Outer Ring Rd,<br />HSR Layout Area Phase 2,<br />Bengaluru, KA 560102
                              </span>
                            </div>

                            <div className="pl-1">
                              <span className="text-[10px] font-bold text-gray-500 tracking-wider block mb-0.5">SHIPPING RECIPIENT:</span>
                              
                              {isEditLabelMode ? (
                                <div className="flex flex-col gap-1.5 bg-yellow-50 p-2 rounded border border-yellow-300">
                                  <input
                                    type="text"
                                    value={editLabelData.recipientName}
                                    onChange={e => setEditLabelData(prev => ({ ...prev, recipientName: e.target.value }))}
                                    className="w-full p-1 bg-white border border-gray-400 text-xs text-gray-900 rounded font-sans font-bold"
                                    placeholder="Recipient Name"
                                  />
                                  <input
                                    type="text"
                                    value={editLabelData.addressLine1}
                                    onChange={e => setEditLabelData(prev => ({ ...prev, addressLine1: e.target.value }))}
                                    className="w-full p-1 bg-white border border-gray-400 text-[11px] text-gray-900 rounded font-sans"
                                    placeholder="Address Line 1"
                                  />
                                  <input
                                    type="text"
                                    value={editLabelData.addressLine2}
                                    onChange={e => setEditLabelData(prev => ({ ...prev, addressLine2: e.target.value }))}
                                    className="w-full p-1 bg-white border border-gray-400 text-[11px] text-gray-900 rounded font-sans"
                                    placeholder="Address Line 2"
                                  />
                                  <input
                                    type="text"
                                    value={editLabelData.phone}
                                    onChange={e => setEditLabelData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full p-1 bg-white border border-gray-400 text-xs text-gray-900 rounded font-mono"
                                    placeholder="Phone Contact"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="font-bold text-gray-900 block text-[13px]">{orderItem.customerName}</span>
                                  <span className="text-gray-800 block text-[11px] leading-tight mt-0.5">
                                    {orderItem.shippingAddress.addressLine1},<br />
                                    {orderItem.shippingAddress.addressLine2},<br />
                                    {orderItem.shippingAddress.city}, {orderItem.shippingAddress.pinCode}
                                  </span>
                                  <span className="text-gray-700 font-mono text-[11px] font-bold block mt-1.5">
                                    TEL: {orderItem.shippingAddress.phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Items Breakdown list */}
                          <div className="border-t border-b border-gray-900 py-2.5">
                            <span className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1.5 uppercase font-mono">CONSOLIDATING SPECIFICATIONS:</span>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-gray-900 font-bold bg-transparent text-gray-900 select-none">
                                  <th className="py-1 text-[9px] uppercase tracking-wider">ITEM SPECIFICATION (PRODUCT & SKU)</th>
                                  <th className="py-1 text-right text-[9px] uppercase tracking-wider">VERIFIED MASS (SAFETY CHECK)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-250">
                                {orderItem.items.slice(0, 2).map(pItem => (
                                  <tr key={pItem.id} className="font-mono">
                                    <td className="py-2 text-left font-sans">
                                      <span className="font-bold block text-gray-900 leading-tight">{pItem.productName}</span>
                                      <span className="text-[10px] text-gray-600 font-mono mt-0.5 block">{pItem.sku}</span>
                                    </td>
                                    <td className="py-2 text-right">
                                      <span className="inline-block bg-amber-50 text-amber-800 border border-amber-400/40 px-2.5 py-1 rounded-md font-black text-xs shadow-sm">
                                        ⚖ 1.6kg PASSED
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Labels Footer Block */}
                          <div className="flex items-center justify-between text-[11px] text-gray-700 font-mono select-none">
                            <div>
                              <span>WEIGHT MASS: </span>
                              <strong className="text-gray-950 font-bold">5.85 kg total</strong>
                            </div>
                            <div>
                              <span>OPERATOR ID: </span>
                              <strong className="text-gray-950 font-bold">WK-04219</strong>
                            </div>
                          </div>

                          {/* Stamp of security assurance */}
                          <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-[10px] text-gray-500 italic">
                            <span>Secured using smart RFID 13.56 MHz verification standard.</span>
                            <div className="w-12 h-12 rounded-full border-4 border-emerald-600/30 flex items-center justify-center p-0.5 shrink-0 select-none rotate-12">
                              <span className="text-[7.5px] font-black text-emerald-700 tracking-tighter text-center leading-none">VERIFIED<br />SYSTEM</span>
                            </div>
                          </div>

                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* ═══ RIGHT PANEL ═══ Telemetry Details */}
                <div className="xl:col-span-3 flex flex-col gap-5">
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                    <span className="text-[10px] text-[#22D3A0] font-mono uppercase tracking-widest block font-bold mb-3">SYSTEM TELEMETRY SUMMARY</span>
                    
                    {(() => {
                      const orderRef = orders.find(o => o.id === selectedPrintOrderId);
                      if (!orderRef) return <p className="text-xs text-gray-500 italic">No selection</p>;
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-gray-300">Order Checks Metrics:</span>
                            
                            {[
                              { label: 'Optical SKU OCR check', pass: orderRef.items.every(i => i.ocrVerified) },
                              { label: 'RGB Image color match model', pass: orderRef.items.every(i => i.visionVerified) },
                              { label: 'Sensory weight tolerance scale', pass: orderRef.items.every(i => i.weightVerified) },
                              { label: 'NFC Sealed physical binding text', pass: orderRef.nfcSealedAt !== undefined }
                            ].map((checkItem, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-950/40 rounded border border-[rgba(255,255,255,0.02)] text-xs">
                                <span className="text-gray-400 font-mono">{checkItem.label}</span>
                                {checkItem.pass ? (
                                  <span className="text-[#22D3A0] font-bold font-mono text-[11px]">PASS ✓</span>
                                ) : (
                                  <span className="text-amber-500 font-bold font-mono text-[11px] animate-pulse">PENDING !</span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="p-3 bg-gray-950/20 rounded border border-[rgba(255,255,255,0.03)] flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-gray-500 font-mono uppercase">CONSOLIDATED SPECIFICS</span>
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-gray-400">Total volume:</span>
                              <span className="text-white">1 Package Carton</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-gray-400">Target dock:</span>
                              <span className="text-[#F97316] font-bold">{orderRef.dockAssignment || 'Bay 4'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-gray-400">Truck reference:</span>
                              <span className="text-white">{orderRef.truckId || 'KA-12-MB-9000'}</span>
                            </div>
                          </div>

                          {/* Simulation Helpers */}
                          <div className="p-3 bg-orange-950/10 border border-orange-500/10 rounded">
                            <span className="text-[11px] font-bold font-mono text-[#F97316] block uppercase mb-1">PROTOTYPE ACTIONS:</span>
                            <p className="text-[10px] text-gray-400 leading-normal mb-2">Simulate a packer holding their android phone to write physical NDEF tags:</p>
                            {activeNfcHandshaking && activeNfcHandshaking.orderId === orderRef.id ? (
                              <div className="w-full py-1.5 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] rounded text-[10px] font-mono tracking-wide text-center animate-pulse">
                                Handshaking NFC antenna...
                              </div>
                            ) : (
                              <button
                                onClick={() => handleNfcSealTapSimulation(orderRef.id)}
                                className="w-full py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/30 border border-[#F97316]/40 text-white rounded text-[10px] font-mono tracking-wide transition duration-150 cursor-pointer"
                              >
                                Tap simulated NFC sticker
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>

            </motion.div>
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
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Drawer / Selector: Customer Cards */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2">Select Active Account</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Select a customer to pull historical dispatches, sensor integrity records, and package timeline states.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {uniqueHistoryCustomers.map(customer => {
                        const isChosen = selectedHistoryCustomer === customer;
                        const customerOrders = orders.filter(o => o.customerName === customer);
                        const totalOrdersCount = customerOrders.length;
                        const totalSpent = customerOrders.reduce((acc, curr) => acc + curr.totalRs, 0);

                        return (
                          <button
                            key={customer}
                            onClick={() => setSelectedHistoryCustomer(customer)}
                            className={`w-full p-3 rounded-lg border text-left flex flex-col gap-1.5 transition-all duration-150 cursor-pointer ${
                              isChosen
                                ? 'bg-[#F97316]/10 border-[#F97316]/50 text-white'
                                : 'bg-gray-800/20 border-transparent hover:bg-gray-800/40 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs truncate max-w-[130px]">{customer}</span>
                              <span className="px-1.5 py-0.5 bg-gray-900 rounded text-[9px] font-mono text-gray-400 font-extrabold pb-0.5 pt-0.5">
                                {totalOrdersCount} ord
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                              <span>Spent Total:</span>
                              <span className="text-emerald-400 font-bold font-mono">₹{totalSpent.toLocaleString('en-IN')}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer stats summary */}
                  {selectedHistoryCustomer && (
                    <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono border-b border-[rgba(255,255,255,0.06)] pb-2">
                        Account Dossier
                      </h4>
                      <div className="flex flex-col gap-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Security Ring:</span>
                          <span className="text-emerald-400 font-bold">Standard Secure</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Node Hub:</span>
                          <span className="text-gray-300 font-bold">DOCK-04</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">NFC Seals:</span>
                          <span className="text-gray-300 font-bold">
                            {orders.filter(o => o.customerName === selectedHistoryCustomer && (o.status === 'PACKED' || o.status === 'DELIVERED')).length} OK
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Area: Timelines & past orders */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  {selectedHistoryCustomer ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest font-mono text-gray-300">
                          Timeline Dossier - {selectedHistoryCustomer}
                        </h3>
                        <span className="text-xs text-gray-500 font-mono">
                          {orders.filter(o => o.customerName === selectedHistoryCustomer).length} total records
                        </span>
                      </div>

                      {orders.filter(o => o.customerName === selectedHistoryCustomer).map(order => {
                        const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

                        // Dynamic timeline steps
                        const steps = [
                          {
                            title: "System Order Registered",
                            desc: "Order record securely committed of node ingress system telemetry database.",
                            timestamp: `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT`,
                            status: "COMPLETED",
                            icon: FileCheck2,
                            iconColor: "text-emerald-400"
                          },
                          {
                            title: order.packerName ? `Assigned to Dispatch Packer` : `Pending Packer Assignment`,
                            desc: order.packerName 
                              ? `Operator "${order.packerName}" assigned to verify physical specifications.`
                              : "Order sits in unassigned packing queue awaiting warehouse worker assignment.",
                            timestamp: order.packerName ? `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT` : null,
                            status: order.packerName ? "COMPLETED" : "PENDING",
                            icon: Users,
                            iconColor: order.packerName ? "text-emerald-400" : "text-gray-600"
                          },
                          {
                            title: "Cryptographic NFC Seal Appended",
                            desc: order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED'
                              ? `13.56MHz physical container tag sealed, locking telemetry specifications inside NDEF memory.`
                              : "Pending verification of standard, weights and optic constraints.",
                            timestamp: order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED'
                              ? `${order.createdAt.substring(0, 10)} ${order.createdAt.substring(11, 16)} GMT`
                              : null,
                            status: (order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED') ? "COMPLETED" : "AWAITING",
                            icon: Wifi,
                            iconColor: (order.status === 'PACKED' || order.status === 'DELIVERED' || order.status === 'VERIFIED') ? "text-emerald-400" : "text-gray-600"
                          },
                          {
                            title: "Delivered To Destination Handover",
                            desc: order.status === 'DELIVERED'
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
            <motion.div
              key="emulator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              {/* Speed run quickbar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F97316]" /> Warehouse Interactive Simulation Workspace
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Use on-demand test inputs to stress test high speed optical and RFID dispatches.</p>
                </div>
                <div className="flex items-center gap-3 self-stretch md:self-auto">
                  <button
                    onClick={handleGeneratePendingOrder}
                    className="flex-grow md:flex-grow-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-mono transition duration-200 flex items-center justify-center gap-2 cursor-pointer border border-slate-750"
                  >
                    <PlusCircle className="w-4 h-4 text-[#F97316]" /> Spawn Test Order
                  </button>
                </div>
              </div>

              {/* Two Panel Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Column A: Virtual Android Device (Left: 5 cols) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-3 flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22D3A0] animate-pulse" /> Active Android Emulator
                  </span>
                  
                  {/* Smartphone Housing Frame */}
                  <div className="w-full max-w-[340px] h-[610px] bg-[#0E1524] rounded-[42px] border-[5px] border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative p-4 flex flex-col justify-between overflow-hidden">
                    
                    {/* Top Speaker/Camera Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-700 rounded-b-2xl z-40 flex items-center justify-center gap-2">
                      <div className="w-10 h-1 bg-gray-900 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
                    </div>

                    {/* Virtual System Notification Bar */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 px-3 pt-3 pb-1 z-30 font-mono">
                      <span>{currentTime.substring(11, 16)} GMT</span>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-mono font-semibold">{batteryLevel}%</span>
                          <div className="w-5 h-2.5 border border-gray-500 rounded-[3px] p-[1px] flex items-center relative gap-[1px]">
                            <div 
                              className={`h-full rounded-[1px] transition-all duration-300 ${batteryLevel < 20 ? 'bg-red-500' : 'bg-[#22D3A0]'}`} 
                              style={{ width: `${batteryLevel}%` }} 
                            />
                            <div className="w-[1.5px] h-1 bg-gray-500 rounded-r-[1px] absolute -right-[2px] top-[2px]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-[#22D3A0]" />
                          <span className="font-bold text-[#F97316]">5G LTE</span>
                        </div>
                      </div>
                    </div>

                    {/* Device screen workspace */}
                    <div className="flex-1 bg-gray-950 rounded-[28px] overflow-hidden flex flex-col justify-between border border-white/[0.04] p-4 relative">
                      
                      {/* Sub-view: Login Pin-Pad */}
                      {!isSimLoggedIn ? (
                        <div className="flex-1 flex flex-col justify-between pt-4">
                          <div className="text-center">
                            <Smartphone className="w-10 h-10 text-[#F97316] mx-auto mb-2" />
                            <h4 className="text-sm font-extrabold text-white">SmartDispatch Log-in</h4>
                            <p className="text-[10px] text-gray-400 mt-1 max-w-[180px] mx-auto">Gloves-friendly touchscreen entry credentials.</p>
                          </div>

                          <div className="my-2">
                            <label className="text-[9px] font-bold text-gray-500 uppercase font-mono block mb-1">Select Identity</label>
                            <select 
                              value={simWorkerId} 
                              onChange={(e) => setSimWorkerId(e.target.value)}
                              className="w-full p-2 bg-[#111827] border border-gray-800 text-xs text-white rounded font-mono"
                            >
                              {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name} ({w.workerId})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="bg-gray-900/80 p-2 rounded border border-gray-800 text-center">
                              <span className="text-base font-bold font-mono tracking-[0.4em] text-white">
                                {simPin.split('').map(() => '*').join('') || <span className="text-gray-600 font-normal text-xs font-sans">Enter Any 4-Digit PIN</span>}
                              </span>
                            </div>

                            {/* Number Gridpad */}
                            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                  key={num}
                                  onClick={() => simPin.length < 4 && setSimPin(prev => prev + num)}
                                  className="py-2 bg-[#111827] hover:bg-slate-800 border border-gray-800 text-white rounded font-mono font-bold active:scale-95 transition-transform cursor-pointer"
                                >
                                  {num}
                                </button>
                              ))}
                              <button
                                onClick={() => setSimPin('')}
                                className="py-2 bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/40 rounded font-mono active:scale-95 cursor-pointer"
                              >
                                CLR
                              </button>
                              <button
                                onClick={() => simPin.length < 4 && setSimPin(prev => prev + '0')}
                                className="py-2 bg-[#111827] hover:bg-slate-800 border border-gray-800 text-white rounded font-mono font-bold active:scale-95 cursor-pointer"
                              >
                                0
                              </button>
                              <button
                                onClick={() => {
                                  setIsSimLoggedIn(true);
                                  addToast(`Simulated Session: Worker access authorized.`, 'success');
                                }}
                                className="py-2 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/40 rounded font-mono active:scale-95 cursor-pointer font-bold"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // If Logged In
                        <div className="flex-1 flex flex-col justify-between">
                          
                          {/* Inner Mobile App Nav Bar */}
                          <div className="flex items-center justify-between border-b border-gray-800/80 pb-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-[#F97316]/20 rounded-full flex items-center justify-center">
                                <span className="text-[9px] text-[#F97316] font-bold">W</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white leading-none">
                                  {workers.find(w => w.id === simWorkerId)?.name || 'Anish Nair'}
                                </span>
                                <span className="text-[8px] text-gray-500 font-mono mt-0.5">{workers.find(w => w.id === simWorkerId)?.workerId || 'WK-04219'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setIsSimLoggedIn(false);
                                setSimPin('');
                                setSimSelectedOrderId(null);
                              }}
                              className="text-[10px] text-red-400 font-mono hover:underline cursor-pointer bg-transparent border-none"
                            >
                              Log out
                            </button>
                          </div>

                          {/* App Body Screens */}
                          {!simSelectedOrderId ? (
                            // Mobile Dashboard List
                            <div className="flex-1 flex flex-col gap-3 justify-between">
                              <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono mb-2">Assigned Packings Queue</h5>
                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                  {orders.filter(o => ['PENDING', 'ASSIGNED', 'PACKING'].includes(o.status)).length === 0 ? (
                                    <div className="text-center py-6 bg-[#111827]/40 rounded border border-dashed border-gray-850">
                                      <p className="text-[10px] text-gray-400">All orders fully processed.</p>
                                      <button 
                                        onClick={handleGeneratePendingOrder}
                                        className="mt-2 text-[9px] px-2.5 py-1 bg-[#F97316] text-white font-mono rounded cursor-pointer"
                                      >
                                        Spawn New Order
                                      </button>
                                    </div>
                                  ) : (
                                    orders.filter(o => ['PENDING', 'ASSIGNED', 'PACKING'].includes(o.status)).map(order => (
                                      <div 
                                        key={order.id}
                                        onClick={() => {
                                          setSimSelectedOrderId(order.id);
                                          setSimActiveItemIndex(0);
                                        }}
                                        className="p-2 bg-[#111827] hover:bg-[#1f293d] border border-gray-800 rounded-lg cursor-pointer transition flex items-center justify-between"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-xs font-bold font-mono text-[#F97316]">{order.orderNumber}</span>
                                          <span className="text-[9px] text-gray-400 mt-0.5">{order.customerName}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[8px] px-1 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded font-mono font-bold">
                                            {order.status}
                                          </span>
                                          <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              <div className="p-2 bg-emerald-950/10 border border-emerald-500/10 rounded-lg">
                                <span className="text-[10px] font-bold text-[#22D3A0] block font-mono">STREAK INCENTIVES</span>
                                <p className="text-[9px] text-gray-400 mt-1">Pack 2 more packages accurately within error specs to secure your daily premium dispatch bonus!</p>
                              </div>
                            </div>
                          ) : (
                            // Detailed Scanning Screen
                            (() => {
                              const activeOrder = orders.find(o => o.id === simSelectedOrderId);
                              if (!activeOrder) {
                                setSimSelectedOrderId(null);
                                return null;
                              }

                              const itemToVerify = activeOrder.items[simActiveItemIndex];
                              const isAllVerified = activeOrder.items.every(i => i.ocrVerified && i.visionVerified && i.weightVerified);

                              return (
                                <div className="flex-1 flex flex-col justify-between">
                                  <div className="flex items-center justify-between gap-2 mb-2 p-1 bg-gray-900 rounded">
                                    <button
                                      onClick={() => setSimSelectedOrderId(null)}
                                      className="text-[9px] text-gray-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer bg-transparent border-none"
                                    >
                                      ← Back
                                    </button>
                                    <span className="text-[10px] text-gray-400 font-semibold font-mono">{activeOrder.orderNumber}</span>
                                  </div>

                                  {!isAllVerified ? (
                                    // Live Scan Simulation Layout
                                    <div className="flex flex-col gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">Verifying Item {simActiveItemIndex + 1}/{activeOrder.items.length}</span>
                                        <span className="text-xs font-bold text-white truncate mt-0.5">{itemToVerify?.productName}</span>
                                        <span className="text-[9px] font-mono text-gray-500">Target SKU: {itemToVerify?.sku}</span>
                                      </div>

                                      {/* Virtual Camera Viewfinder */}
                                      <div className="w-full h-24 bg-[#111827] border border-gray-800 rounded-lg relative overflow-hidden flex flex-col items-center justify-center">
                                        {/* Camera viewfinder grids */}
                                        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#F97316]" />
                                        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#F97316]" />
                                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#F97316]" />
                                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#F97316]" />
                                        
                                        {/* Scanner bar pulse */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-400 animate-pulse opacity-80" />

                                        {isQrScannerActive ? (
                                          <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center gap-1 z-10">
                                            <QrCode className="w-8 h-8 text-emerald-400 animate-pulse" />
                                            <span className="text-[8px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">QR SCANNER ACTIVE</span>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Holographic item display */}
                                            <Barcode className="w-6 h-6 text-white/25 mb-1" />
                                            <span className="text-[8px] font-mono text-gray-400 select-none">ALIGN FOR INTEGRATED SCAN</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Verified checklist indicators */}
                                      <div className="grid grid-cols-3 gap-1">
                                        <div className={`p-1 rounded text-center text-[8px] border ${itemToVerify?.ocrVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-400'}`}>
                                          <span className="font-bold block">OCR SKU</span>
                                          <span>{itemToVerify?.ocrVerified ? 'PASS ✓' : 'PENDING'}</span>
                                        </div>
                                        <div className={`p-1 rounded text-center text-[8px] border ${itemToVerify?.visionVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-400'}`}>
                                          <span className="font-bold block">COLOR RGB</span>
                                          <span>{itemToVerify?.visionVerified ? 'PASS ✓' : 'PENDING'}</span>
                                        </div>
                                        <div className={`p-1 rounded text-center text-[8px] border ${itemToVerify?.weightVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-850 text-gray-400'}`}>
                                          <span className="font-bold block">WEIGHT BEAM</span>
                                          <span>{itemToVerify?.weightVerified ? 'PASS ✓' : 'PENDING'}</span>
                                        </div>
                                      </div>

                                      {/* Interactive Simulation Buttons on device */}
                                      <div className="flex flex-col gap-1 text-[10px]">
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <button
                                            onClick={() => {
                                              setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                                ...o, status: 'PACKING', items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, ocrVerified: true } : it)
                                              } : o));
                                              addToast('OCR scan decoded matching SKU code perfectly!', 'success');
                                            }}
                                            className="py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/30 border border-[#F97316]/35 text-white rounded font-mono font-bold cursor-pointer text-left px-2 text-[9px] flex items-center justify-between"
                                          >
                                            <span>Simulate Barcode</span>
                                            <Barcode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (isQrScannerActive) return;
                                              setIsQrScannerActive(true);
                                              playBuzzerSound();
                                              addToast("Initiating camera-based QR code verification check...", "info");
                                              
                                              setTimeout(() => {
                                                setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                                  ...o, status: 'PACKING', qrVerified: true, items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, ocrVerified: true } : it)
                                                } : o));
                                                setIsQrScannerActive(false);
                                                addToast('QR Code verification success: incoming item registered!', 'success');
                                              }, 1500);
                                            }}
                                            className="verify-qr-btn py-1.5 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/35 text-blue-200 rounded font-mono font-bold cursor-pointer text-left px-2 text-[9px] flex items-center justify-between transition duration-150"
                                          >
                                            <span>Verify QR Scanner</span>
                                            <QrCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                              ...o, items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, visionVerified: true } : it)
                                            } : o));
                                            addToast('Vision camera aligned silver/charcoal casing chromatic hue!', 'success');
                                          }}
                                          className="w-full py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/30 border border-[#F97316]/30 text-white rounded font-mono font-bold cursor-pointer text-left px-2"
                                        >
                                          2. Simulate RGB Casing Verify
                                        </button>
                                        <div className="p-1.5 bg-gray-900 border border-gray-850 rounded">
                                          <div className="flex items-center justify-between text-[9px] mb-1">
                                            <span className="text-gray-400 font-mono">Dynamic weight input:</span>
                                            <span className="font-mono text-white text-right">{simWeightInput.toFixed(2)} kg</span>
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => {
                                                // Trigger alarm sequence if weight is too high/low
                                                const correctWeightRange = 1.5;
                                                const tolerance = 0.15;
                                                const diff = Math.abs(simWeightInput - correctWeightRange);
                                                
                                                if (diff > tolerance) {
                                                  // Create high severity physical alarm
                                                  const newAlertId = `al-${Date.now()}`;
                                                  const newAlert: Alert = {
                                                    id: newAlertId,
                                                    severity: 'CRITICAL',
                                                    alertType: 'WEIGHT_FAIL',
                                                    orderId: activeOrder.id,
                                                    orderNumber: activeOrder.orderNumber,
                                                    workerName: workers.find(w => w.id === simWorkerId)?.name || 'Anish Nair',
                                                    detail: `Physical weight variance violation: Measured weight is ${(simWeightInput).toFixed(2)} kg (Expected: ${correctWeightRange} kg).`,
                                                    isResolved: false,
                                                    createdAt: new Date().toISOString()
                                                  };
                                                  setAlerts(prev => [newAlert, ...prev]);
                                                  addToast('ALARM TRIGGERED: Scale container weight discrepancy!', 'error');
                                                } else {
                                                  setOrders(prev => prev.map(o => o.id === simSelectedOrderId ? {
                                                    ...o, items: o.items.map((it, idx) => idx === simActiveItemIndex ? { ...it, weightVerified: true } : it)
                                                  } : o));
                                                  addToast('Packer box weight verified accurately.', 'success');
                                                }
                                              }}
                                              className="flex-1 py-1 bg-blue-900/30 text-blue-300 border border-blue-800/30 rounded font-mono text-[9px] cursor-pointer"
                                            >
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SMART DISPATCH LABELS POPUP (NFC SEAL INSTANT PRINT) */}
          {/* ========================================================= */}
          {showNfcPopup && nfcPopupOrder && (
            <motion.div
              key="nfc-print-dispatch-popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-[#090D16]/95 border-2 border-[#22D3A0]/30 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(34,211,160,0.15)] relative flex flex-col md:flex-row gap-8 text-[#F1F5F9]"
              >
                {/* Holographic Signal Effects */}
                <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#22D3A0] to-teal-500 rounded-t-2xl" />
                
                {/* Cancel button */}
                <button
                  onClick={() => {
                    setShowNfcPopup(false);
                    setAutoPrintCountdown(null);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 p-2 rounded-full cursor-pointer transition border border-gray-700/50"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* LEFT CONTEXT PANEL - Real-time telemetry, barcodes, status and configuration */}
                <div className="flex-1 flex flex-col justify-between gap-6 md:max-w-xs font-sans">
                  
                  {/* Status Banner */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22D3A0] animate-ping" />
                      <span className="text-[10px] font-bold text-[#22D3A0] uppercase font-mono tracking-wider">RF 13.56 MHz SEAL ESTABLISHED</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
                      Physical NFC Seal Bind Completed!
                    </h2>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Encrypted cryptographic hash successfully written to RFID box sticker tags for high-security tracking.
                    </p>
                  </div>

                  {/* Smart automated printing parameters toggle */}
                  <div className="p-4 bg-gray-950/60 border border-white/[0.05] rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Auto-Print Thermal</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${autoPrintEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-550'}`}>
                        {autoPrintEnabled ? 'ACTIVE-CONVEYOR' : 'PAUSED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-left">
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Automatically trigger A6 printer within 3 seconds of a secure sensory NFC package sealing.
                      </p>
                      
                      <button
                        onClick={() => {
                          const nextVal = !autoPrintEnabled;
                          setAutoPrintEnabled(nextVal);
                          if (!nextVal) setAutoPrintCountdown(null);
                          else setAutoPrintCountdown(3);
                          addToast(nextVal ? 'Automation enabled. Countdown initiated.' : 'Automation disabled. Manual touch required.', 'info');
                        }}
                        className={`w-11 h-6 rounded-full p-1 transition duration-150 relative cursor-pointer outline-none border-none shrink-0 ${autoPrintEnabled ? 'bg-[#22D3A0]' : 'bg-gray-800'}`}
                      >
                        <div className={`w-4 h-4 bg-[#0F172A] rounded-full shadow-md transition duration-155 absolute top-1 ${autoPrintEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    {/* Countdown indicator */}
                    {autoPrintCountdown !== null && (
                      <div className="p-2.5 bg-emerald-950/20 text-emerald-400 font-mono text-[11px] rounded border border-emerald-500/10 flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Countdown: {autoPrintCountdown}s
                        </span>
                        <span className="animate-pulse">PRINTER ENGAGED</span>
                      </div>
                    )}
                  </div>

                  {/* Manual touch-screen quick prints */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        setAutoPrintCountdown(null);
                        setOrders(prev =>
                          prev.map(o => (o.id === nfcPopupOrder.id ? { ...o, printedAt: new Date().toISOString() } : o))
                        );
                        // Open the printing system manually
                        playBuzzerSound();
                        window.print();
                        addToast(`Manual label print job dispatched for ${nfcPopupOrder.orderNumber}!`, 'success');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#EA580C] hover:to-orange-500 text-white font-extrabold font-mono text-xs rounded-xl transition duration-200 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer border-none uppercase tracking-wide"
                    >
                      <Printer className="w-4 h-4" /> One-Touch Safe Print
                    </button>

                    <button
                      onClick={() => {
                        setShowNfcPopup(false);
                        setAutoPrintCountdown(null);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold font-mono text-xs rounded-xl transition duration-200 cursor-pointer border border-slate-700/55 text-center"
                    >
                      Bypass and Load Next Order
                    </button>
                  </div>

                </div>

                {/* RIGHT THERMAL CARD PANEL - Standards compliant A6 Label design preview */}
                <div className="flex-grow flex flex-col gap-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">PRO DIGITAL-TWIN PRINT-COPY PREVIEW</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const nextOrientation = printOrientation === 'portrait' ? 'landscape' : 'portrait';
                          setPrintOrientation(nextOrientation);
                          addToast(`Feed direction set to ${nextOrientation.toUpperCase()} for thermal printers`, 'info');
                        }}
                        className="rotate-print-btn px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-lg text-[10px] font-mono font-bold transition duration-150 flex items-center gap-1.5 cursor-pointer border border-slate-700/65"
                      >
                        <RefreshCw className="w-3 h-3 text-[#F97316]" />
                        <span>Rotate Print ({printOrientation.toUpperCase()})</span>
                      </button>
                      <span className="text-xs text-gray-400">Standard A6 Formatting</span>
                    </div>
                  </div>

                  {/* Real Physical Printable Card Frame */}
                  <div className={`printable-label-wrapper bg-white text-gray-950 p-6 rounded-xl w-full mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-slate-900 flex flex-col gap-4 font-sans select-text relative transition-all duration-500 ease-in-out ${printOrientation === 'landscape' ? 'max-w-2xl aspect-[1.414]' : 'max-w-[420px] aspect-[0.707]'}`}>
                    
                    {/* QR Verified Badge Indicator */}
                    {nfcPopupOrder.qrVerified && (
                      <div className="absolute top-3 right-3 z-30 bg-emerald-600 border border-emerald-500 text-white text-[9px] font-mono font-black py-1 px-2.5 rounded-md shadow-[0_4px_12px_rgba(16,185,129,0.30)] animate-pulse flex items-center gap-1 leading-none">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>QR VERIFIED</span>
                      </div>
                    )}

                    {/* Watermark badge style visual */}
                    <div className="absolute top-[40%] right-6 w-24 h-24 rounded-full border-4 border-emerald-600/15 flex items-center justify-center p-1 select-none pointer-events-none rotate-12 bg-transparent">
                      <span className="text-[10px] font-black text-emerald-700/25 tracking-tighter text-center leading-none uppercase">APPROVED<br />RFID SEALED<br />SECURE</span>
                    </div>

                    {/* Label Header */}
                    <div className="border-b-4 border-gray-950 pb-3 flex items-start justify-between">
                      <div>
                        <span className="text-xs tracking-wider font-extrabold uppercase bg-gray-950 text-white px-2.5 py-0.5 rounded">SMARTDISPATCH</span>
                        <span className="text-[9px] text-gray-500 font-mono block mt-1 tracking-widest font-black">STATIONARY THERMAL DISPATCH</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 bg-gray-900 text-white rounded shadow-sm inline-block`}>
                          {nfcPopupOrder.totalRs > 50000 ? 'PRIORITY URGENT' : 'STANDARD EXPRESS'}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono block mt-1">DOCK BAY STATION 4</span>
                      </div>
                    </div>

                    {/* Integrated Barcode & QR Code Section */}
                    <div className="grid grid-cols-12 gap-3 p-3 bg-gray-100 rounded-lg border border-gray-300">
                      
                      {/* Barcode section (left 8 cols) */}
                      <div className="col-span-8 flex flex-col items-center justify-center border-r border-gray-300 pr-3">
                        {/* Realistic multi-line vector barcode representation */}
                        <div className="flex gap-[1.5px] items-stretch h-12 bg-transparent w-full">
                          {[3, 1, 4, 1, 5, 2, 6, 2, 7, 1, 8, 3, 4, 1, 2, 1, 5, 3, 2, 4, 1, 2, 1, 5, 1, 8, 3, 1].map((w, index) => (
                            <div key={index} className="bg-gray-950 flex-grow" style={{ minWidth: `${w}px` }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono font-extrabold mt-1.5 tracking-wider text-gray-800">
                          *{nfcPopupOrder.orderNumber.replace('ORD-', 'SKUID-')}*
                        </span>
                      </div>

                      {/* QR Code Section (right 4 cols) */}
                      <div className="col-span-4 flex flex-col items-center justify-center pl-2">
                        {/* High details simulated SVG QR Code representing order track payload */}
                        <div className="w-12 h-12 bg-[#0F172A] p-1 rounded flex flex-wrap content-between justify-between">
                          <div className="w-3.5 h-3.5 border-2 border-white rounded-[1px]" />
                          <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                          <div className="w-3.5 h-3.5 border-2 border-white rounded-[1px]" />
                          
                          <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                          <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                          <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />

                          <div className="w-3.5 h-3.5 border-2 border-white rounded-[1px]" />
                          <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                          <div className="w-3.5 h-3.5 border border-[#22D3A0] rounded-[1px] flex items-center justify-center">
                            <div className="w-1 h-1 bg-[#22D3A0] rounded-full" />
                          </div>
                        </div>
                        <span className="text-[7.5px] font-mono font-bold mt-1 text-gray-500 uppercase">SYS_TRACK</span>
                      </div>

                    </div>

                    {/* Sender and Recipient Coordinates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      
                      {/* Left: Dispatch parameters */}
                      <div className="border-r border-gray-300 pr-2">
                        <span className="text-[9px] font-bold text-gray-400 tracking-wider block mb-0.5 uppercase font-mono">FROM DIRECTORY RAIL:</span>
                        <span className="font-extrabold text-gray-900 block">SMARTDISPATCH HUB 04</span>
                        <span className="text-gray-600 block leading-normal text-[11px] mt-0.5 font-medium">
                          Sector 12 Outer Ring Rd,<br />HSR Layout Area Phase 2,<br />Bengaluru, KA 560102
                        </span>
                      </div>

                      {/* Right: Recipient coordinates */}
                      <div className="pl-1">
                        <span className="text-[9px] font-bold text-gray-400 tracking-wider block mb-0.5 uppercase font-mono">TO RECIPIENT COORD:</span>
                        <span className="font-extrabold text-gray-900 block text-[13px]">{nfcPopupOrder.customerName}</span>
                        <span className="text-gray-700 block text-[11px] leading-tight font-medium mt-0.5 font-sans">
                          {nfcPopupOrder.shippingAddress.addressLine1},<br />
                          {nfcPopupOrder.shippingAddress.addressLine2},<br />
                          {nfcPopupOrder.shippingAddress.city}, {nfcPopupOrder.shippingAddress.pinCode}
                        </span>
                        <span className="text-gray-900 font-mono text-[11px] font-black block mt-1.5">
                          CONTACT: {nfcPopupOrder.shippingAddress.phone}
                        </span>
                      </div>

                    </div>

                    {/* Items consolidation table */}
                    <div className="border-t border-b border-gray-950 py-2.5">
                      <span className="text-[9px] font-bold text-gray-400 tracking-wider block mb-1.5 uppercase font-mono">CONSOLIDATING SPECIFICATIONS:</span>
                      
                      {/* SCREEN PREVIEW VIEW - Displays requested items details including 1.6kg mass and verification */}
                      <table className="w-full text-left text-xs font-sans print:hidden">
                        <thead>
                          <tr className="border-b border-gray-450 text-gray-550 select-none text-[8.5px] font-bold uppercase">
                            <th className="py-1">ITEM SPECIFICATION (PRODUCT & SKU)</th>
                            <th className="py-1 text-right">VERIFIED MASS (SAFETY CHECK)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {nfcPopupOrder.items.slice(0, 2).map(pItem => (
                            <tr key={pItem.id} className="font-sans">
                              <td className="py-2 text-left">
                                <span className="font-bold block text-gray-950 leading-tight">{pItem.productName}</span>
                                <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">{pItem.sku}</span>
                              </td>
                              <td className="py-2 text-right">
                                <span className="inline-block bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md font-extrabold text-xs">
                                  ⚖ 1.6kg PASSED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* PHYSICAL PRINT SECURE VIEW - Rendered only when printed to prevent brand identification/theft risks */}
                      <div className="hidden print:block p-3.5 border-2 border-dashed border-gray-950 bg-gray-50 rounded-xl text-center font-mono my-1">
                        <div className="flex items-center justify-center gap-1.5 mb-1.5 text-gray-900">
                          <span className="text-[10px] font-black uppercase tracking-wider">🔒 SECURED DOUBLE-TWIN CARGO SHIELD</span>
                        </div>
                        <p className="text-[9.5px] text-gray-700 leading-normal font-sans font-medium">
                          Itemized merchant nomenclature and barcode catalog maps are concealed under transport authority guidelines to prevent routing-stage cargo division & theft.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-300 text-left">
                          <div>
                            <span className="text-[8px] text-gray-500 block font-bold">DECLARED CARGO MASS:</span>
                            <span className="text-[12px] font-black text-gray-950">5.85 kg Bulk Net</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-gray-500 block font-bold">RFID SEAL STATE:</span>
                            <span className="text-[11px] font-black text-emerald-800 uppercase">ACTIVE SEALED ✓</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Calibration values */}
                    <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono">
                      <div>
                        <span>TOTAL REGISTERED MASS: </span>
                        <strong className="text-gray-950 font-bold">5.85 kg total</strong>
                      </div>
                      <div>
                        <span>OPERATOR KEY: </span>
                        <strong className="text-gray-950 font-bold">WK-04219</strong>
                      </div>
                    </div>

                    {/* Assurance Stamp */}
                    <div className="flex items-center gap-2 border-t border-gray-200 pt-3 text-[10px] text-gray-500 leading-relaxed font-mono">
                      <div className="flex flex-col flex-grow text-left">
                        <span className="font-bold flex items-center gap-1 text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5" /> SECURE SEAL CONFIRMED (13.56 MHz RFID)
                        </span>
                        <span className="mt-0.5 text-[9px] block">Cryptographic hash UID written securely on physical parcel tag labels.</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border-[3px] border-emerald-600/40 p-0.5 flex items-center justify-center select-none rotate-12 shrink-0 bg-transparent">
                        <span className="text-[7px] font-black text-emerald-700 tracking-tight text-center leading-none uppercase">AUTOMATED<br />DISPATCH<br />APPROVED</span>
                      </div>
                    </div>

                    {/* Dynamic System Timestamp of Print Request */}
                    <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between text-[8px] text-gray-400 font-mono">
                      <span className="tracking-wider uppercase">SECURE THERMAL TAG GENERATION ENGINE</span>
                      <span className="font-bold text-gray-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-[#F97316]" />
                        TS: {currentTime}
                      </span>
                    </div>

                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

    </div>
  );
}
