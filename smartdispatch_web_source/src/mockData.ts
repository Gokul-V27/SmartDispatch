/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Order, Worker, Alert } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Dell Inspiron 15 3520',
    brand: 'Dell',
    modelNumber: 'IN3520-7890',
    sku: 'SKU-DELL-IN15',
    category: 'Electronics',
    colorName: 'Silver',
    colorHex: '#C0C0C0',
    weightKg: 1.65,
    weightToleranceGrams: 80,
    stockQty: 42,
    priceRs: 48999,
    description: '15.6" FHD display with AMD Ryzen 5 processor, 16GB RAM, 512GB SSD, running Windows 11.',
    photos: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=60'
    ]
  },
  {
    id: 'prod-2',
    name: 'HP Pavilion x360 convertible',
    brand: 'HP',
    modelNumber: 'PAV-X360-14',
    sku: 'SKU-HP-PAV14',
    category: 'Electronics',
    colorName: 'Space Grey',
    colorHex: '#4A4A4A',
    weightKg: 1.51,
    weightToleranceGrams: 50,
    stockQty: 18,
    priceRs: 56500,
    description: 'Intel i5 12th Gen, 14-inch Touchscreen 2-in-1, backlit keyboard, stylus pen included.',
    photos: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=60'
    ]
  },
  {
    id: 'prod-3',
    name: 'Apex Heavy Duty Toolbox',
    brand: 'Apex',
    modelNumber: 'APX-TB-99',
    sku: 'SKU-APX-TOOL',
    category: 'Hardware',
    colorName: 'Signal Orange',
    colorHex: '#F97316',
    weightKg: 4.20,
    weightToleranceGrams: 200,
    stockQty: 25,
    priceRs: 3499,
    description: 'Steel latch industrial grade toolbox with customizable foam organizers.',
    photos: [
      'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=60'
    ]
  },
  {
    id: 'prod-4',
    name: 'Premium Leather Ergonomic Chair',
    brand: 'Sihoo',
    modelNumber: 'SIH-M57-L',
    sku: 'SKU-SIH-CHAIR',
    category: 'Furniture',
    colorName: 'Matte Black',
    colorHex: '#111827',
    weightKg: 18.50,
    weightToleranceGrams: 500,
    stockQty: 8,
    priceRs: 12900,
    description: 'Full grain leather high back executive chair with advanced lumber adaptive support.',
    photos: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60'
    ]
  },
  {
    id: 'prod-5',
    name: 'Waterproof Canvas Field Jacket',
    brand: 'Timberland',
    modelNumber: 'TIM-FJ-02',
    sku: 'SKU-TIM-JKT',
    category: 'Clothing',
    colorName: 'Olive Green',
    colorHex: '#3F6212',
    weightKg: 0.95,
    weightToleranceGrams: 30,
    stockQty: 60,
    priceRs: 5299,
    description: 'Ultra-durable military standard heavy-weave canvas jacket with thermal lining.',
    photos: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=60'
    ]
  }
];

export const INITIAL_WORKERS: Worker[] = [
  {
    id: 'wrk-1',
    workerId: 'WK-04219',
    name: 'Anish Nair',
    email: 'anish@smartdispatch.com',
    phone: '+91 9447382103',
    role: 'PACKER',
    isActive: true,
    packagesPackedToday: 18,
    accuracyRate: 99.4
  },
  {
    id: 'wrk-2',
    workerId: 'WK-01822',
    name: 'Siddharth Rao',
    email: 'sid.rao@smartdispatch.com',
    phone: '+91 9885432109',
    role: 'PACKER',
    isActive: true,
    packagesPackedToday: 24,
    accuracyRate: 100.0
  },
  {
    id: 'wrk-3',
    workerId: 'WK-09255',
    name: 'Pooja Sharma',
    email: 'pooja.sharma@smartdispatch.com',
    phone: '+91 8129347568',
    role: 'SUPERVISOR',
    isActive: true,
    packagesPackedToday: 0,
    accuracyRate: 98.9
  },
  {
    id: 'wrk-4',
    workerId: 'WK-05331',
    name: 'Vikram Joshi',
    email: 'vjoshi@smartdispatch.com',
    phone: '+91 7042531980',
    role: 'PACKER',
    isActive: false,
    packagesPackedToday: 0,
    accuracyRate: 95.2
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-8051',
    customerName: 'Karan Malhotra',
    customerPhone: '+91 9876543210',
    status: 'PACKED',
    packerWorkerId: 'wrk-1',
    packerName: 'Anish Nair',
    totalRs: 52498,
    dockAssignment: 'Bay 4',
    truckId: 'TR-MH-12-9900',
    nfcSealedAt: '2026-06-06T04:22:15Z',
    qrVerified: true,
    shippingAddress: {
      recipientName: 'Karan Malhotra',
      phone: '+91 9876543210',
      addressLine1: 'Flat 402, Signature Elite, HSR Layout Sector 2',
      addressLine2: 'Near NIFT College, Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560102'
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Dell Inspiron 15 3520',
        sku: 'SKU-DELL-IN15',
        quantity: 1,
        unitPriceRs: 48999,
        ocrVerified: true,
        visionVerified: true,
        weightVerified: true,
        verifiedAt: '2026-06-06T04:18:22Z',
        evidencePhotoPath: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      },
      {
        id: 'item-2',
        productId: 'prod-3',
        productName: 'Apex Heavy Duty Toolbox',
        sku: 'SKU-APX-TOOL',
        quantity: 1,
        unitPriceRs: 3499,
        ocrVerified: true,
        visionVerified: true,
        weightVerified: true,
        verifiedAt: '2026-06-06T04:21:05Z',
        evidencePhotoPath: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=60'
      }
    ],
    createdAt: '2026-06-05T10:15:00Z',
    updatedAt: '2026-06-06T04:22:15Z'
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-8052',
    customerName: 'Aishwarya Sen',
    customerPhone: '+91 9123456789',
    status: 'PACKING',
    packerWorkerId: 'wrk-2',
    packerName: 'Siddharth Rao',
    totalRs: 56500,
    shippingAddress: {
      recipientName: 'Aishwarya Sen',
      phone: '+91 9123456789',
      addressLine1: 'Rowhouse No. 5, Silver Oak Enclave',
      addressLine2: 'Kalyani Nagar, Behind Joggers Park',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411006'
    },
    items: [
      {
        id: 'item-3',
        productId: 'prod-2',
        productName: 'HP Pavilion x360 convertible',
        sku: 'SKU-HP-PAV14',
        quantity: 1,
        unitPriceRs: 56500,
        ocrVerified: true,
        visionVerified: false,
        weightVerified: false,
        verifiedAt: '2026-06-06T05:30:11Z'
      }
    ],
    createdAt: '2026-06-05T14:30:00Z',
    updatedAt: '2026-06-06T05:30:11Z'
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-2026-8053',
    customerName: 'Rahul Deshmukh',
    customerPhone: '+91 8888882211',
    status: 'VERIFIED',
    packerWorkerId: 'wrk-1',
    packerName: 'Anish Nair',
    totalRs: 5299,
    shippingAddress: {
      recipientName: 'Rahul Deshmukh',
      phone: '+91 8888882211',
      addressLine1: 'P703, Mantri Espana',
      addressLine2: 'Deverabeesanahalli, Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560103'
    },
    items: [
      {
        id: 'item-4',
        productId: 'prod-5',
        productName: 'Waterproof Canvas Field Jacket',
        sku: 'SKU-TIM-JKT',
        quantity: 1,
        unitPriceRs: 5299,
        ocrVerified: true,
        visionVerified: true,
        weightVerified: true,
        verifiedAt: '2026-06-06T05:40:00Z',
        evidencePhotoPath: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=60'
      }
    ],
    createdAt: '2026-06-05T18:12:00Z',
    updatedAt: '2026-06-06T05:40:00Z'
  },
  {
    id: 'ord-104',
    orderNumber: 'ORD-2026-8054',
    customerName: 'Meera Krishnan',
    customerPhone: '+91 7760924355',
    status: 'PENDING',
    totalRs: 57997,
    shippingAddress: {
      recipientName: 'Meera Krishnan',
      phone: '+91 7760924355',
      addressLine1: '12-A, Temple View Residency',
      addressLine2: 'Sastri Nagar Ext, Adyar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pinCode: '600020'
    },
    items: [
      {
        id: 'item-5',
        productId: 'prod-1',
        productName: 'Dell Inspiron 15 3520',
        sku: 'SKU-DELL-IN15',
        quantity: 1,
        unitPriceRs: 48999,
        ocrVerified: false,
        visionVerified: false,
        weightVerified: false
      },
      {
        id: 'item-6',
        productId: 'prod-5',
        productName: 'Waterproof Canvas Field Jacket',
        sku: 'SKU-TIM-JKT',
        quantity: 1,
        unitPriceRs: 5299,
        ocrVerified: false,
        visionVerified: false,
        weightVerified: false
      },
      {
        id: 'item-7',
        productId: 'prod-3',
        productName: 'Apex Heavy Duty Toolbox',
        sku: 'SKU-APX-TOOL',
        quantity: 1,
        unitPriceRs: 3499,
        ocrVerified: false,
        visionVerified: false,
        weightVerified: false
      }
    ],
    createdAt: '2026-06-06T02:10:00Z',
    updatedAt: '2026-06-06T02:10:00Z'
  },
  {
    id: 'ord-105',
    orderNumber: 'ORD-2026-8055',
    customerName: 'Sameer Hegde',
    customerPhone: '+91 9901234567',
    status: 'DELIVERED',
    packerWorkerId: 'wrk-2',
    packerName: 'Siddharth Rao',
    totalRs: 12900,
    dockAssignment: 'Bay 2',
    truckId: 'TR-KA-03-7712',
    nfcSealedAt: '2026-06-05T09:20:00Z',
    shippingAddress: {
      recipientName: 'Sameer Hegde',
      phone: '+91 9901234567',
      addressLine1: 'C-704, Royal Crest Apartments',
      addressLine2: 'Kanakapura Main Road, JP Nagar 6th Phase',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560078'
    },
    items: [
      {
        id: 'item-8',
        productId: 'prod-4',
        productName: 'Premium Leather Ergonomic Chair',
        sku: 'SKU-SIH-CHAIR',
        quantity: 1,
        unitPriceRs: 12900,
        ocrVerified: true,
        visionVerified: true,
        weightVerified: true,
        verifiedAt: '2026-06-05T09:12:00Z',
        evidencePhotoPath: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60'
      }
    ],
    createdAt: '2026-06-04T11:00:00Z',
    updatedAt: '2026-06-05T14:45:00Z'
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    severity: 'CRITICAL',
    alertType: 'COLOR_MISMATCH',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8052',
    workerName: 'Siddharth Rao',
    detail: 'Expected HP Pavilion 14 to be [Space Grey (#4A4A4A)], but vision AI scan matched [Silver (#C0C0C0)]. Package packing halted.',
    isResolved: false,
    createdAt: '2026-06-06T05:30:11Z'
  },
  {
    id: 'alert-2',
    severity: 'WARNING',
    alertType: 'WEIGHT_FAIL',
    orderId: 'ord-101',
    orderNumber: 'ORD-2026-8051',
    workerName: 'Anish Nair',
    detail: 'Weight scale measured 6.25kg, but expected total weight is 5.85kg. Supervisor approved override with comment: "Included free promotional calendar accessory." (ID 992)',
    isResolved: true,
    createdAt: '2026-06-06T04:20:10Z',
    resolvedAt: '2026-06-06T04:21:05Z'
  },
  {
    id: 'alert-3',
    severity: 'CRITICAL',
    alertType: 'WRONG_PRODUCT',
    orderId: 'ord-104',
    orderNumber: 'ORD-2026-8054',
    detail: 'OCR Barcode scan returned SKU-HP-PAV14 but expected SKU-DELL-IN15 inside order items list.',
    isResolved: false,
    createdAt: '2026-06-06T05:45:00Z'
  }
];
