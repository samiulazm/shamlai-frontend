"use client";

import Link from "next/link";
import { 
  Check, Store, Zap, Bot, Boxes, Truck, 
  BarChart3, ShoppingBag, MessageSquare, Sparkles,
  ArrowRight, Users, TrendingUp, Package, Shield,
  Globe, CreditCard, Smartphone, Star, ChevronRight,
  Clock, DollarSign, Headphones
} from "lucide-react";
import { useState } from "react";

export default function Landing(){
  const [activePlan, setActivePlan] = useState("Growth");

  return (
    <main>
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
                <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</Link>
                <Link href="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900">All Features</Link>
                <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">How it works</Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</Link>
              <Link href="/signup" className="btn btn-primary">Start free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 lg:py-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container-responsive relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
                <Sparkles className="h-4 w-4" /> Launch in 2 clicks
              </div>
              <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Build your shop in <span className="bg-gradient-to-r from-brand-indigo to-purple-600 bg-clip-text text-transparent">two clicks</span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-gray-600">
                Create a stunning storefront, manage products & orders, connect delivery partners, and let AI handle customer support on Facebook & Instagram—all in one platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="btn btn-primary text-base px-8 py-3 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40">
                  Start free trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/demo" className="btn btn-outline text-base px-8 py-3">
                  View live demo
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl bg-white p-4 shadow-2xl">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-6 grid grid-cols-3 gap-3">
                      {[Store, ShoppingBag, BarChart3, Package, MessageSquare, Truck].map((Icon, i) => (
                        <div key={i} className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Icon className="h-7 w-7 text-brand-indigo" />
                        </div>
                      ))}
                    </div>
                    <div className="text-sm font-medium text-gray-600">Shamlai Dashboard</div>
                    <div className="mt-2 text-2xl font-bold">Everything in one place</div>
                    <div className="mt-3 text-gray-500">Complete e-commerce solution</div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-purple-200 opacity-60 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-indigo-200 opacity-60 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-white py-12">
        <div className="container-responsive">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { value: "10,000+", label: "Active Shops", icon: Store },
              { value: "₹50M+", label: "Monthly GMV", icon: TrendingUp },
              { value: "99.9%", label: "Uptime", icon: Shield },
              { value: "24/7", label: "Support", icon: Headphones }
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                  <Icon className="h-6 w-6 text-brand-indigo" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <div className="mt-1 text-sm text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="container-responsive">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <Zap className="h-4 w-4" /> Powerful Features
            </div>
            <h2 className="mt-4 text-4xl font-bold">Everything you need to sell online</h2>
            <p className="mt-4 text-lg text-gray-600">Complete e-commerce solution built for modern businesses</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                title: "Beautiful Storefronts", 
                desc: "Choose from professionally designed themes. Customize colors, fonts, and layouts without code.",
                icon: Store,
                color: "indigo"
              },
              { 
                title: "Product Management", 
                desc: "Add unlimited products with variants, images, pricing, and inventory tracking.",
                icon: Package,
                color: "purple"
              },
              { 
                title: "Order Processing", 
                desc: "Manage orders from placement to delivery with real-time status updates.",
                icon: ShoppingBag,
                color: "pink"
              },
              { 
                title: "Delivery Integration", 
                desc: "Connect with RedX, Pathao, Steadfast and other major courier services.",
                icon: Truck,
                color: "emerald"
              },
              { 
                title: "AI Chatbot", 
                desc: "Automated customer support on Facebook & Instagram. Answer questions instantly.",
                icon: Bot,
                color: "blue"
              },
              { 
                title: "Analytics & Reports", 
                desc: "Track sales, revenue, customers, and growth with detailed insights.",
                icon: BarChart3,
                color: "orange"
              },
              { 
                title: "Payment Gateway", 
                desc: "Accept payments via bKash, Nagad, Rocket, and credit/debit cards.",
                icon: CreditCard,
                color: "green"
              },
              { 
                title: "Mobile Optimized", 
                desc: "Your store looks perfect on all devices. Mobile-first design.",
                icon: Smartphone,
                color: "violet"
              },
              { 
                title: "Custom Domain", 
                desc: "Connect your own domain and build your brand identity.",
                icon: Globe,
                color: "cyan"
              }
            ].map(({ title, desc, icon: Icon, color }) => (
              <div key={title} className="group card hover:shadow-lg transition-all duration-300">
                <div className="card-pad">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                  </div>
                  <div className="mt-4 text-xl font-semibold">{title}</div>
                  <p className="mt-2 text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="text-4xl font-bold">Get started in 3 simple steps</h2>
            <p className="mt-4 text-lg text-gray-600">Launch your online store in minutes, not months</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up for free. No credit card required. Choose your store name and you're ready to go.",
                icon: Users
              },
              {
                step: "02",
                title: "Add products & customize",
                desc: "Upload products, pick a theme, set up payments and delivery. Everything is point-and-click simple.",
                icon: Boxes
              },
              {
                step: "03",
                title: "Launch & grow",
                desc: "Share your store link, start selling, and watch your business grow with our AI-powered tools.",
                icon: TrendingUp
              }
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="card hover:shadow-lg transition-shadow">
                  <div className="card-pad">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-5xl font-bold text-indigo-100">{step}</div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100">
                        <Icon className="h-7 w-7 text-brand-indigo" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold">{title}</h3>
                    <p className="mt-3 text-gray-600">{desc}</p>
                  </div>
                </div>
                {step !== "03" && (
                  <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:block">
                    <ChevronRight className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 py-20 text-white">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="text-4xl font-bold">Loved by business owners</h2>
            <p className="mt-4 text-lg text-indigo-100">See what our customers have to say</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Fatima Rahman",
                role: "Fashion Store Owner",
                text: "Shamlai helped me launch my boutique online in just 2 days. The AI chatbot handles most customer questions automatically!",
                rating: 5
              },
              {
                name: "Karim Ahmed",
                role: "Electronics Retailer",
                text: "The delivery integrations are game-changing. RedX and Pathao integration makes order fulfillment so easy.",
                rating: 5
              },
              {
                name: "Nusrat Jahan",
                role: "Cosmetics Brand",
                text: "Best investment for my business. Sales increased 3x after moving to Shamlai. The dashboard is super intuitive!",
                rating: 5
              }
            ].map((testimonial) => (
              <div key={testimonial.name} className="card bg-white/10 backdrop-blur-sm border-white/20">
                <div className="card-pad">
                  <div className="mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/90">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="mt-6">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-indigo-200">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="text-4xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Choose the plan that fits your business</p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "৳0",
                period: "forever",
                description: "Perfect for getting started",
                features: [
                  "1 storefront",
                  "50 orders/month",
                  "Basic theme",
                  "Mobile optimized",
                  "Email support"
                ],
                cta: "Start free",
                popular: false
              },
              {
                name: "Growth",
                price: "৳1,490",
                period: "per month",
                description: "For growing businesses",
                features: [
                  "Custom domain",
                  "Unlimited orders",
                  "All themes",
                  "Courier integrations",
                  "Payment gateways",
                  "Priority support",
                  "Analytics dashboard"
                ],
                cta: "Start free trial",
                popular: true
              },
              {
                name: "Pro",
                price: "৳2,990",
                period: "per month",
                description: "For established brands",
                features: [
                  "Everything in Growth",
                  "AI chatbot",
                  "Advanced reports",
                  "Custom integrations",
                  "API access",
                  "Dedicated support",
                  "White-label option"
                ],
                cta: "Start free trial",
                popular: false
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card relative ${plan.popular ? 'border-2 border-brand-indigo shadow-xl scale-105' : ''} transition-transform hover:scale-105`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-brand-indigo px-4 py-1 text-sm font-medium text-white">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className="card-pad">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{plan.name}</div>
                    <div className="mt-4 flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold">{plan.price}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">{plan.period}</div>
                    <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 w-full ${plan.popular ? 'btn btn-primary' : 'btn btn-outline'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-indigo to-purple-600 py-20">
        <div className="container-responsive text-center">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Ready to grow your business?
          </h2>
          <p className="mt-4 text-xl text-indigo-100">
            Join thousands of merchants already selling with Shamlai
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn bg-white text-brand-indigo hover:bg-gray-50 text-lg px-8 py-3 shadow-xl">
              Start free trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/demo" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3">
              View demo
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-indigo-100">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Secure & reliable</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span>No hidden fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-900 text-gray-400">
        <div className="container-responsive py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-indigo">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Shamlai</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                The complete e-commerce platform for modern businesses. Build your online store in minutes and start selling today.
              </p>
              <div className="mt-6 flex gap-4">
                {["Facebook", "Instagram", "Twitter", "LinkedIn"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <Globe className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white">Product</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Updates</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white">Resources</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 text-sm md:flex-row">
            <p>© 2025 Shamlai. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
