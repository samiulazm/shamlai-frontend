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
  Smartphone,
  Truck,
  DollarSign,
  Globe,
  Video,
  MessageCircle,
  Target,
  Send,
  Shield
} from "lucide-react";

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const categories = [
    { id: "all", name: "All Features", icon: Sparkles },
    { id: "bangladesh", name: "🇧🇩 Bangladesh", icon: Globe },
    { id: "facebook-live", name: "📱 Facebook Live", icon: Video },
    { id: "ecommerce", name: "E-commerce", icon: ShoppingCart },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "automation", name: "Automation", icon: Bot },
  ];

  const features = [
    // Bangladesh-Specific Features
    {
      id: 1,
      category: "bangladesh",
      title: "বিকাশ, নগদ, রকেট পেমেন্ট",
      titleEn: "bKash, Nagad & Rocket Payment",
      description: "বাংলাদেশের সবচেয়ে জনপ্রিয় মোবাইল ফিন্যান্সিয়াল সার্ভিস ইন্টিগ্রেশন",
      descriptionEn: "Bangladesh's most popular mobile financial service integrations with auto-verification",
      icon: Smartphone,
      color: "from-pink-500 to-rose-600",
      benefits: [
        "bKash Payment Gateway (Checkout & Tokenized)",
        "Nagad & Rocket mobile banking integration",
        "Auto payment verification & refunds",
        "৳ BDT currency support"
      ]
    },
    {
      id: 2,
      category: "bangladesh",
      title: "পাঠাও, রেডেক্স, স্টেডফাস্ট",
      titleEn: "Pathao, Redx & Steadfast Delivery",
      description: "স্বয়ংক্রিয় কুরিয়ার বুকিং এবং ট্র্যাকিং সিস্টেম",
      descriptionEn: "Automated courier booking and tracking with all major Bangladesh delivery services",
      icon: Truck,
      color: "from-blue-500 to-indigo-600",
      benefits: [
        "Pathao, Redx, eCourier, Steadfast integration",
        "Auto courier booking & tracking",
        "Bulk order processing (100+ orders)",
        "Inside/Outside Dhaka detection"
      ]
    },
    {
      id: 3,
      category: "bangladesh",
      title: "ক্যাশ অন ডেলিভারি (COD)",
      titleEn: "Cash on Delivery (COD)",
      description: "সম্পূর্ণ COD সাপোর্ট যাচাইকরণ সহ",
      descriptionEn: "Complete COD support with verification and partial payment options",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      benefits: [
        "Full COD support with verification",
        "Partial payment (advance + COD)",
        "Phone verification before dispatch",
        "COD fraud detection"
      ]
    },
    {
      id: 4,
      category: "bangladesh",
      title: "বাংলা ভাষা সাপোর্ট",
      titleEn: "Bengali Language Support",
      description: "১০০% বাংলা ইন্টারফেস এবং কমিউনিকেশন",
      descriptionEn: "100% Bengali interface with localized invoices, SMS and receipts",
      icon: Globe,
      color: "from-purple-500 to-pink-600",
      benefits: [
        "100% Bengali interface",
        "Bengali SMS, invoices, receipts",
        "BDT currency with ৳ symbol",
        "Bengali customer support"
      ]
    },
    // Facebook Live Seller Features
    {
      id: 5,
      category: "facebook-live",
      title: "Facebook Live Shopping",
      titleBn: "ফেসবুক লাইভ শপিং",
      description: "Track live comments and convert them to orders automatically from your Facebook Live",
      descriptionBn: "লাইভ কমেন্ট ট্র্যাক করুন এবং স্বয়ংক্রিয়ভাবে অর্ডারে রূপান্তর করুন",
      icon: Video,
      color: "from-blue-600 to-purple-600",
      benefits: [
        "Live comment tracking",
        "Auto order from 'inbox' or '+1' comments",
        "Live sales counter during broadcast",
        "Post-live order dashboard"
      ]
    },
    {
      id: 6,
      category: "facebook-live",
      title: "Facebook & Instagram Ads",
      titleBn: "ফেসবুক ও ইনস্টাগ্রাম বিজ্ঞাপন",
      description: "Maximize your social media ROI with integrated ads management and tracking",
      descriptionBn: "ইন্টিগ্রেটেড বিজ্ঞাপন ম্যানেজমেন্ট এবং ট্র্যাকিং দিয়ে ROI বৃদ্ধি করুন",
      icon: Target,
      color: "from-pink-500 to-red-600",
      benefits: [
        "Facebook Pixel integration",
        "Instagram Shopping setup",
        "Retargeting & conversion tracking",
        "Ad performance analytics"
      ]
    },
    {
      id: 7,
      category: "facebook-live",
      title: "Facebook Messenger Chatbot",
      titleBn: "ফেসবুক মেসেঞ্জার চ্যাটবট",
      description: "Automate customer support with Bengali language chatbot on Messenger and WhatsApp",
      descriptionBn: "মেসেঞ্জার এবং WhatsApp এ বাংলা ভাষা চ্যাটবট দিয়ে স্বয়ংক্রিয় গ্রাহক সেবা",
      icon: MessageCircle,
      color: "from-indigo-500 to-blue-600",
      benefits: [
        "Bengali language chatbot",
        "WhatsApp Business API",
        "24/7 automated support",
        "Order status auto-reply"
      ]
    },
    {
      id: 8,
      category: "facebook-live",
      title: "Social Media Order Manager",
      titleBn: "সোশ্যাল মিডিয়া অর্ডার ম্যানেজার",
      description: "Manage all your social media orders from one unified inbox",
      descriptionBn: "একটি ইউনিফাইড ইনবক্স থেকে সমস্ত সোশ্যাল মিডিয়া অর্ডার পরিচালনা করুন",
      icon: Send,
      color: "from-cyan-500 to-blue-600",
      benefits: [
        "Unified inbox (FB, Instagram, WhatsApp)",
        "Auto-import orders from comments/DMs",
        "Bulk messaging",
        "Customer history tracking"
      ]
    },
    // Enhanced E-commerce Features
    {
      id: 9,
      category: "ecommerce",
      title: "Quick Store Setup",
      titleBn: "দ্রুত দোকান সেটআপ",
      description: "Launch your Bangladesh-optimized online store in minutes",
      descriptionBn: "মিনিটের মধ্যে বাংলাদেশ-অপটিমাইজড অনলাইন দোকান চালু করুন",
      icon: Store,
      color: "from-blue-500 to-indigo-600",
      benefits: [
        "Bangladesh market optimized templates",
        "Mobile-first responsive design",
        "Bengali & English support",
        "SEO optimized for BD market"
      ]
    },
    {
      id: 10,
      category: "ecommerce",
      title: "Smart Product Management",
      titleBn: "স্মার্ট পণ্য ব্যবস্থাপনা",
      description: "Manage inventory with size/color variants and pre-order support",
      descriptionBn: "সাইজ/রঙের ভেরিয়েন্ট এবং প্রি-অর্ডার সাপোর্ট সহ ইনভেন্টরি পরিচালনা করুন",
      icon: Package,
      color: "from-purple-500 to-pink-600",
      benefits: [
        "Size/color variant management",
        "Pre-order & backorder support",
        "Bulk product import/export",
        "Automated inventory tracking"
      ]
    },
    {
      id: 11,
      category: "ecommerce",
      title: "SMS Notifications (বাংলা)",
      titleEn: "SMS Notifications (Bengali)",
      description: "Automated Bengali SMS for order updates and customer communication",
      descriptionBn: "অর্ডার আপডেট এবং গ্রাহক যোগাযোগের জন্য স্বয়ংক্রিয় বাংলা SMS",
      icon: Send,
      color: "from-green-500 to-teal-600",
      benefits: [
        "Auto SMS updates (Bengali/English)",
        "Order confirmation & tracking SMS",
        "Bulk SMS campaigns",
        "Two-way SMS support"
      ]
    },
    {
      id: 12,
      category: "analytics",
      title: "Real-time Sales Dashboard",
      titleBn: "রিয়েল-টাইম বিক্রয় ড্যাশবোর্ড",
      description: "Track sales, orders, and customer analytics with BD location insights",
      descriptionBn: "বিডি লোকেশন ইনসাইট সহ বিক্রয়, অর্ডার এবং গ্রাহক বিশ্লেষণ ট্র্যাক করুন",
      icon: BarChart3,
      color: "from-orange-500 to-red-600",
      benefits: [
        "Live sales dashboard",
        "BD location analytics (division/district)",
        "Revenue & profit tracking",
        "Customer behavior insights"
      ]
    },
    {
      id: 13,
      category: "automation",
      title: "AI Order Management",
      titleBn: "AI অর্ডার ম্যানেজমেন্ট",
      description: "Smart order processing with fraud detection and auto courier booking",
      descriptionBn: "জালিয়াতি সনাক্তকরণ এবং স্বয়ংক্রিয় কুরিয়ার বুকিং সহ স্মার্ট অর্ডার প্রসেসিং",
      icon: Bot,
      color: "from-violet-500 to-purple-600",
      benefits: [
        "AI-powered fraud detection",
        "Auto courier selection & booking",
        "Smart order routing",
        "Automated order confirmation"
      ]
    },
    {
      id: 14,
      category: "ecommerce",
      title: "Customer Database & CRM",
      titleBn: "গ্রাহক ডাটাবেস এবং CRM",
      description: "Build lasting customer relationships with loyalty programs and reviews",
      descriptionBn: "লয়্যালটি প্রোগ্রাম এবং রিভিউ সহ দীর্ঘস্থায়ী গ্রাহক সম্পর্ক তৈরি করুন",
      icon: Users,
      color: "from-pink-500 to-rose-600",
      benefits: [
        "Customer profiles & purchase history",
        "Loyalty points system",
        "Product review & rating system",
        "Customer segmentation"
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
              🇧🇩 বাংলাদেশের জন্য বিশেষভাবে তৈরি
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              ফেসবুক লাইভ সেলার এবং{" "}
              <span className="bg-gradient-to-r from-brand-indigo to-purple-600 bg-clip-text text-transparent">
                SME ব্যবসার জন্য
              </span>
            </h1>
            <p className="mb-4 text-lg text-gray-600 sm:text-xl">
              বিকাশ, নগদ, রকেট, পাঠাও, রেডেক্স - সব একসাথে!
            </p>
            <p className="mb-8 text-base text-gray-500">
              Facebook Live Shopping, Messenger Chatbot, COD, Courier Integration & More
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="btn btn-primary flex items-center gap-2">
                ফ্রি শুরু করুন
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/demo" className="btn btn-outline">
                ডেমো দেখুন
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
              আজই শুরু করুন আপনার অনলাইন ব্যবসা!
            </h2>
            <p className="mb-2 text-lg text-indigo-100">
              হাজারো ফেসবুক লাইভ সেলার এবং SME ব্যবসায়ী ইতিমধ্যে Shamlai ব্যবহার করছেন
            </p>
            <p className="mb-8 text-base text-indigo-200">
              Join thousands of Facebook Live sellers and SME businesses growing with Shamlai
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="btn bg-white text-brand-indigo hover:bg-gray-50">
                ১৪ দিন ফ্রি ট্রায়াল শুরু করুন
              </Link>
              <Link href="/" className="btn border-2 border-white text-white hover:bg-white/10">
                আরও জানুন
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
