import React, { useState } from 'react';
import {
  BrandHeader,
  BannerCarousel,
  CategoryNav,
  ProductGrid,
  CartBar,
  ProductDetailDrawer,
  CartDrawer,
  CheckoutDrawer,
  OrderSuccessModal,
  ToastContainer,
} from '../components';
import type { CreateOrderV2Response } from '@config/contracts';

export function PublicApp() {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastOrderResponse, setLastOrderResponse] = useState<CreateOrderV2Response | null>(null);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    customerName: string;
    customerPhone: string;
    locationName: string;
    deliveryLabel: string;
    isScheduled: boolean;
    scheduledDate?: string;
    paymentMethod: string;
    total: number;
    supportPhone?: string;
  } | null>(null);

  const handleOrderSuccess = (
    response: CreateOrderV2Response,
    details: {
      customerName: string;
      customerPhone: string;
      locationName: string;
      deliveryLabel: string;
      isScheduled: boolean;
      scheduledDate?: string;
      paymentMethod: string;
      total: number;
      supportPhone?: string;
    }
  ) => {
    setLastOrderResponse(response);
    setLastOrderDetails(details);
    setSuccessModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col antialiased selection:bg-accent selection:text-white">
      {/* Toast Notifications Container */}
      <ToastContainer />

      {/* Brand & Tower Header */}
      <BrandHeader />

      {/* Promotional Banners Carousel */}
      <div className="w-full max-w-[768px] mx-auto px-4">
        <BannerCarousel />
      </div>

      {/* Sticky Category Navigation */}
      <CategoryNav />

      {/* Main Catalog Body */}
      <main className="flex-1 w-full max-w-[768px] mx-auto px-4">
        {/* Dynamic Product Grid */}
        <ProductGrid />
      </main>

      {/* Floating Bottom Cart Bar */}
      <CartBar />

      {/* Interactive Drawers */}
      <ProductDetailDrawer />
      <CartDrawer />
      <CheckoutDrawer onOrderSuccess={handleOrderSuccess} />

      {/* Order Confirmation Modal */}
      <OrderSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        orderResponse={lastOrderResponse}
        orderDetails={lastOrderDetails}
      />
    </div>
  );
}
