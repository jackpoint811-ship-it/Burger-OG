import React from 'react';
import {
  BrandHeader,
  BannerCarousel,
  CategoryNav,
  ProductGrid,
  CartBar,
  ProductDetailDrawer,
  CartDrawer,
  ToastContainer,
} from '../components';

export function PublicApp() {
  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col antialiased selection:bg-accent selection:text-white">
      {/* Toast Notifications Container */}
      <ToastContainer />

      {/* Brand & Tower Header */}
      <BrandHeader />

      {/* Sticky Category Navigation */}
      <CategoryNav />

      {/* Main Catalog Body */}
      <main className="flex-1 w-full max-w-[768px] mx-auto px-4">
        {/* Promotional Banners Carousel */}
        <BannerCarousel />

        {/* Dynamic Product Grid */}
        <ProductGrid />
      </main>

      {/* Floating Bottom Cart Bar */}
      <CartBar />

      {/* Interactive Drawers */}
      <ProductDetailDrawer />
      <CartDrawer />
    </div>
  );
}
