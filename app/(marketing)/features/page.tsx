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
  Sparkles
} from "lucide-react";

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const categories = [
    { id: "all", name: "All Features", icon: Sparkles },
    { id: "ecommerce", name: "E-commerce", icon: ShoppingCart },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "automation", name: "Automation", icon: Bot },
  ];

  const features = [
    {
      id: 1,
      category: "ecommerce",
      title: "Quick Store Setup",
      description: "Launch your online store in minutes with our streamlined setup process.",
      icon: Store,
      color: "from-blue-500 to-indigo-600",
      benefits: [
        "Pre-built store templates",
        "Drag-and-drop customization",
        "Mobile-responsive design",
        "SEO optimized out of the box"
      ]
    },
    {
      id: 2,
      category: "ecommerce",
      title: "Smart Product Management",
      description: "Manage inventory, variants, and pricing with intelligent tools.",
      icon: Package,
      color: "from-purple-500 to-pink-600",
      benefits: [
        "Bulk product import",
        "Automated inventory tracking",
        "Multi-variant support",
        "Dynamic pricing rules"
      ]
    },
    {
      id: 3,
      category: "ecommerce",
      title: "Seamless Checkout",
      description: "Optimize conversions with a fast, secure checkout experience.",
      icon: CreditCard,
      color: "from-green-500 to-emerald-600",
      benefits: [
        "One-click checkout",
        "Multiple payment gateways",
        "Guest checkout option",
        "Abandoned cart recovery"
      ]
    },
    {
      id: 4,
      category: "analytics",
      title: "Real-time Analytics",
      description: "Track sales, visitors, and performance metrics in real-time.",
      icon: BarChart3,
      color: "from-orange-500 to-red-600",
      benefits: [
        "Live sales dashboard",
        "Customer behavior insights",
        "Revenue forecasting",
        "Custom report builder"
      ]
    },
    {
      id: 5,
      category: "analytics",
      title: "Growth Metrics",
      description: "Understand your business growth with comprehensive metrics.",
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-600",
      benefits: [
        "Customer lifetime value",
        "Conversion rate tracking",
        "Product performance analysis",
        "Marketing ROI calculator"
      ]
    },
    {
      id: 6,
      category: "automation",
      title: "AI-Powered Assistant",
      description: "Let AI handle customer inquiries and routine tasks automatically.",
      icon: Bot,
      color: "from-violet-500 to-purple-600",
      benefits: [
        "24/7 customer support bot",
        "Automated order updates",
        "Smart product recommendations",
        "Natural language processing"
      ]
    },
    {
      id: 7,
      category: "automation",
      title: "Marketing Automation",
      description: "Automate your marketing campaigns and boost engagement.",
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
      benefits: [
        "Email campaign automation",
        "Social media scheduling",
        "Targeted promotions",
        "Customer segmentation"
      ]
    },
    {
      id: 8,
      category: "ecommerce",
      title: "Customer Management",
      description: "Build lasting relationships with comprehensive customer tools.",
      icon: Users,
      color: "from-pink-500 to-rose-600",
      benefits: [
        "Customer profiles & history",
        "Loyalty program management",
        "Review & rating system",
        "Communication hub"
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
              Powerful Features for Modern Commerce
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-brand-indigo to-purple-600 bg-clip-text text-transparent">
                grow your business
              </span>
            </h1>
            <p className="mb-8 text-lg text-gray-600 sm:text-xl">
              Discover how Shamlai's comprehensive feature set empowers merchants
              to build, manage, and scale their online stores with ease.
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
              Ready to experience these features?
            </h2>
            <p className="mb-8 text-lg text-indigo-100">
              Join thousands of merchants who are already growing their business with Shamlai.
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
