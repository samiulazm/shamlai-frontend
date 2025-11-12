'use client';

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  Zap,
  Bot,
  BarChart3,
  ShoppingCart,
  Package,
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Truck,
  Smartphone,
  MessageCircle,
  Globe,
  Banknote,
  Video,
  Share2,
  Phone,
  ShoppingBag
} from "lucide-react";

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const categories = [
    { id: "all", name: "All Features", icon: Sparkles },
    { id: "bangladesh", name: "🇧🇩 Bangladesh", icon: ShoppingBag },
    { id: "facebook", name: "Facebook Live", icon: Video },
    { id: "ecommerce", name: "E-commerce", icon: ShoppingCart },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "automation", name: "Automation", icon: Bot },
  ];

  const features = [
    {
      id: 1,
      category: "bangladesh",
      title: "বিকাশ, নগদ, রকেট পেমেন্ট",
      description: "সব জনপ্রিয় মোবাইল ব্যাংকিং সিস্টেম সাপোর্ট। bKash, Nagad, Rocket দিয়ে সহজে পেমেন্ট নিন।",
      icon: Smartphone,
      color: "from-pink-600 to-rose-600",
      benefits: [
        "bKash Payment Gateway (Checkout & Tokenized)",
        "Nagad instant payment integration",
        "Rocket mobile banking support",
        "Automatic payment verification",
        "One-click refund processing",
        "Real-time transaction alerts"
      ]
    },
    {
      id: 2,
      category: "bangladesh",
      title: "পাঠাও, রেডেক্স, স্টেডফাস্ট",
      description: "বাংলাদেশের সব ডেলিভারি সার্ভিস এক জায়গায়। Pathao, Redx, eCourier, Steadfast সব কানেক্টেড।",
      icon: Truck,
      color: "from-green-600 to-emerald-600",
      benefits: [
        "Pathao Courier auto-booking",
        "Redx instant parcel creation",
        "eCourier & Steadfast integration",
        "Real-time tracking with customer SMS",
        "Auto shipping cost calculator",
        "Bulk order processing for 100+ orders",
        "Inside/Outside Dhaka detection"
      ]
    },
    {
      id: 3,
      category: "bangladesh",
      title: "Cash on Delivery (COD)",
      description: "ক্যাশ অন ডেলিভারি সম্পূর্ণ সাপোর্ট। গ্রাহকরা পণ্য হাতে পেয়ে টাকা দেবেন।",
      icon: Banknote,
      color: "from-orange-600 to-amber-600",
      benefits: [
        "Full COD support with verification",
        "Partial payment (advance + COD)",
        "Phone call verification before dispatch",
        "Auto SMS to confirm COD orders",
        "Easy return & refund for COD",
        "COD tracking dashboard"
      ]
    },
    {
      id: 4,
      category: "bangladesh",
      title: "বাংলা ভাষা সাপোর্ট",
      description: "সম্পূর্ণ বাংলায় কাজ করুন। দোকান, প্রোডাক্ট, অর্ডার সব বাংলায় ম্যানেজ করুন।",
      icon: Globe,
      color: "from-teal-600 to-cyan-600",
      benefits: [
        "Full Bengali interface (100% বাংলা)",
        "Bilingual product descriptions",
        "Bengali SMS notifications to customers",
        "Bengali invoice & receipt generation",
        "BDT currency with ৳ symbol",
        "Bengali date & number formats"
      ]
    },
    {
      id: 5,
      category: "facebook",
      title: "Facebook Live Shopping",
      description: "ফেসবুক লাইভ করে সরাসরি বিক্রি করুন! লাইভের কমেন্ট থেকে অটো অর্ডার তৈরি হয়।",
      icon: Video,
      color: "from-blue-600 to-indigo-700",
      benefits: [
        "Facebook Live comment tracking",
        "Auto order from 'inbox' or '+1' comments",
        "Live sales counter on screen",
        "Instant customer reply automation",
        "Product catalog sync with FB Live",
        "Post-live order management dashboard"
      ]
    },
    {
      id: 6,
      category: "facebook",
      title: "Facebook & Instagram Ads",
      description: "ফেসবুক ও ইনস্টাগ্রাম এ এড চালান এবং সরাসরি অর্ডার নিন। Pixel integration সহ!",
      icon: Share2,
      color: "from-purple-600 to-pink-600",
      benefits: [
        "Facebook Pixel integration",
        "Instagram Shopping setup",
        "Direct checkout from FB/IG ads",
        "Retargeting pixel for cart abandonment",
        "Conversion tracking dashboard",
        "Ad performance analytics"
      ]
    },
    {
      id: 7,
      category: "facebook",
      title: "Facebook Messenger Chatbot",
      description: "ফেসবুক মেসেঞ্জারে AI চ্যাটবট। বাংলায় কথা বলে, অর্ডার নেয়, প্রোডাক্ট দেখায়!",
      icon: MessageCircle,
      color: "from-sky-600 to-blue-600",
      benefits: [
        "Facebook Messenger bot (Bengali support)",
        "WhatsApp Business API integration",
        "Auto-reply to product inquiries",
        "Send product catalog in chat",
        "Order status updates via Messenger",
        "24/7 automated customer service"
      ]
    },
    {
      id: 8,
      category: "facebook",
      title: "Social Media Order Manager",
      description: "ফেসবুক পেজ, ইনস্ট, হোয়াটসঅ্যাপ সব জায়গার অর্ডার এক ড্যাশবোর্ডে দেখুন!",
      icon: ShoppingBag,
      color: "from-rose-600 to-red-600",
      benefits: [
        "Unified inbox for FB, Instagram, WhatsApp",
        "Auto-import orders from comments/DMs",
        "Customer phone number extraction",
        "Duplicate order prevention",
        "Bulk message to customers",
        "Order confirmation screenshots"
      ]
    },
    {
      id: 9,
      category: "ecommerce",
      title: "Quick Store Setup",
      description: "মাত্র ২ ক্লিকে দোকান তৈরি করুন। কোডিং এর দরকার নেই!",
      icon: Store,
      color: "from-blue-500 to-indigo-600",
      benefits: [
        "Ready-made BD e-commerce templates",
        "Drag-and-drop customization",
        "Mobile-first responsive design",
        "SEO optimized for Bangladesh market",
        "Custom domain support (.com.bd)",
        "Free SSL certificate"
      ]
    },
    {
      id: 10,
      category: "ecommerce",
      title: "Smart Product Management",
      description: "প্রোডাক্ট ম্যানেজমেন্ট সহজ। সাইজ, কালার ভ্যারিয়েন্ট, স্টক ট্র্যাকিং সব আছে।",
      icon: Package,
      color: "from-purple-500 to-pink-600",
      benefits: [
        "Unlimited products & variants (Size, Color)",
        "Bulk product import from Excel",
        "Auto low stock alerts",
        "Product image gallery (10+ images)",
        "Pre-order & advance booking system",
        "Flash sale & discount management"
      ]
    },
    {
      id: 11,
      category: "automation",
      title: "SMS Notifications (বাংলা)",
      description: "গ্রাহকদের অটো এসএমএস পাঠান। অর্ডার কনফার্ম, শিপমেন্ট, ডেলিভারি - সব আপডেট!",
      icon: Phone,
      color: "from-green-600 to-teal-600",
      benefits: [
        "Auto SMS for order confirmation",
        "Shipping & delivery SMS updates",
        "Bengali SMS templates",
        "Bulk SMS for promotions",
        "OTP verification for customers",
        "Integration with local SMS providers"
      ]
    },
    {
      id: 12,
      category: "analytics",
      title: "Real-time Sales Dashboard",
      description: "লাইভ সেলস দেখুন। কত টাকা বিক্রি হলো, কোন প্রোডাক্ট বেশি বিক্রি - সব এক নজরে!",
      icon: BarChart3,
      color: "from-orange-500 to-red-600",
      benefits: [
        "Live sales counter (today, this week, month)",
        "Product-wise sales reports",
        "Customer location analytics (division/district)",
        "Payment method breakdown",
        "Peak sales time analysis",
        "Export reports to Excel"
      ]
    },
    {
      id: 13,
      category: "automation",
      title: "AI Order Management",
      description: "AI দিয়ে অর্ডার ম্যানেজ করুন। অটো স্ট্যাটাস আপডেট, কুরিয়ার বুকিং, এসএমএস সব!",
      icon: Bot,
      color: "from-violet-500 to-purple-600",
      benefits: [
        "Auto order status updates",
        "Smart fraud detection for fake orders",
        "Auto courier booking based on location",
        "Predicted delivery date calculator",
        "Auto customer follow-up messages",
        "Intelligent inventory management"
      ]
    },
    {
      id: 14,
      category: "ecommerce",
      title: "Customer Database & CRM",
      description: "সব কাস্টমারের তথ্য সেভ থাকে। রিপিট অর্ডার, ফোন নাম্বার, ঠিকানা সব একসাথে!",
      icon: Users,
      color: "from-pink-500 to-rose-600",
      benefits: [
        "Complete customer profiles",
        "Order history & repeat customer tracking",
        "Customer segmentation (VIP, regular, new)",
        "Birthday & special occasion reminders",
        "Loyalty points system",
        "Customer review & rating collection"
      ]
    }
  ];

  const filteredFeatures = selectedCategory === "all"
    ? features
    : features.filter(f => f.category === selectedCategory);

  const toggleFeature = (id: number) => {
    setExpandedFeature(expandedFeature === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
        <div className="container-responsive">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-indigo-700">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Shamlai</span>
              </Link>
              <div className="hidden items-center gap-6 md:flex">
                <Link href="/#features" className="text-sm font-medium text-gray-700 hover:text-brand-indigo">
                  Features
                </Link>
                <Link href="/features" className="text-sm font-medium text-brand-indigo">
                  All Features
                </Link>
                <Link href="/#pricing" className="text-sm font-medium text-gray-700 hover:text-brand-indigo">
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-indigo">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Start free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 lg:py-24">
        <div className="container-responsive relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" />
              🇧🇩 বাংলাদেশের জন্য তৈরি | Made for Bangladesh
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              ফেসবুক লাইভ সেলার ও{" "}
              <span className="bg-gradient-to-r from-brand-indigo to-purple-600 bg-clip-text text-transparent">
                SME ব্যবসার সব সুবিধা
              </span>
            </h1>
            <p className="mb-8 text-lg text-gray-600 sm:text-xl">
              বিকাশ, পাঠাও, Facebook Live Shopping, বাংলা এসএমএস -
              বাংলাদেশী ই-কমার্স বিজনেসের জন্য দরকারি সব ফিচার এক জায়গায়!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="btn btn-primary flex items-center gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/demo" className="btn btn-outline">
                View demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Categories */}
      <section className="border-b bg-white py-6">
        <div className="container-responsive">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-brand-indigo text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24">
        <div className="container-responsive">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures.map((feature) => {
              const Icon = feature.icon;
              const isExpanded = expandedFeature === feature.id;

              return (
                <div
                  key={feature.id}
                  className="card overflow-hidden transition-all hover:shadow-lg"
                >
                  <div className="card-pad">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mb-4 text-gray-600">
                      {feature.description}
                    </p>

                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <span>{isExpanded ? "Hide" : "Show"} benefits</span>
                      <ArrowRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-2 rounded-lg bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4">
                        {feature.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="mx-auto max-w-md py-12 text-center">
              <p className="text-gray-500">No features found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="container-responsive">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              আপনার ব্যবসা শুরু করতে প্রস্তুত?
            </h2>
            <p className="mb-8 text-lg text-indigo-100">
              হাজারো বাংলাদেশী সেলার Shamlai দিয়ে তাদের ব্যবসা বাড়াচ্ছেন।
              Facebook Live থেকে ফুল টাইম ই-কমার্স - আপনিও শুরু করুন আজই!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="btn bg-white text-brand-indigo hover:bg-gray-50">
                Start your free trial
              </Link>
              <Link href="/" className="btn border-2 border-white text-white hover:bg-white/10">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container-responsive">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo to-indigo-700">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Shamlai</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2024 Shamlai. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/#features" className="text-sm text-gray-600 hover:text-brand-indigo">
                Features
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-600 hover:text-brand-indigo">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-gray-600 hover:text-brand-indigo">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
