"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { Toaster } from "@hexio/ui/components/sonner";
import React from "react";
import {
  Sparkles,
  PlayCircle,
  Lock,
  MessageSquare,
  Folder,
  FileText,
  Zap,
  FileEdit,
  Plus,
  Image as ImageIcon,
  Smile,
  Code,
  Paperclip,
  Mic,
  Send,
  Triangle,
  CircleDot,
  LayoutGrid,
  Infinity as InfinityIcon,
  PieChart,
  Twitter,
  Github,
} from "lucide-react";

export default function Page() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark antialiased transition-colors duration-200">
      <header className="fixed top-0 w-full z-50 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-text-light dark:bg-text-dark rounded-full flex items-center justify-center">
                <Sparkles className="text-surface-light dark:text-surface-dark w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tight">Hex</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark font-medium transition-colors"
                href="#"
              >
                Features
              </a>
              <a
                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark font-medium transition-colors"
                href="#"
              >
                Solutions
              </a>
              <a
                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark font-medium transition-colors"
                href="#"
              >
                Pricing
              </a>
              <a
                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark font-medium transition-colors"
                href="#"
              >
                Resources
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <a
                className="hidden md:block text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark font-medium transition-colors"
                href="#"
              >
                Log in
              </a>
              <a
                className="bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-opacity-90 transition-opacity"
                href="/chat"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Unlock the Power of AI with <span className="text-primary">Hex</span>
          </h1>
          <p className="text-xl text-text-muted-light dark:text-text-muted-dark mb-10 max-w-2xl mx-auto">
            Simplify your workflows with our intelligent chat, writing, and coding
            assistants. One platform to do it all, faster and better.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <a
              className="bg-primary text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-opacity w-full sm:w-auto shadow-lg shadow-primary/30"
              href="/chat"
            >
              Get Started for Free
            </a>
            <a
              className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-background-light dark:hover:bg-border-dark transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
              href="#"
            >
              <PlayCircle className="w-5 h-5" />
              Watch Demo
            </a>
          </div>
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden bg-surface-light dark:bg-surface-dark">
            <div className="h-10 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mx-auto flex items-center gap-2 px-3 py-1 bg-surface-light dark:bg-surface-dark rounded border border-border-light dark:border-border-dark text-xs text-text-muted-light dark:text-text-muted-dark">
                <Lock className="w-3.5 h-3.5" />
                Hex.io
              </div>
            </div>
            <div className="flex h-[600px]">
              <div className="w-64 border-r border-border-light dark:border-border-dark flex flex-col p-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                  <div className="w-6 h-6 bg-text-light dark:bg-text-dark rounded-full flex items-center justify-center">
                    <Sparkles className="text-surface-light dark:text-surface-dark w-3 h-3" />
                  </div>
                  <span className="font-bold">Hex</span>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg flex items-center gap-3 font-medium">
                    <MessageSquare className="w-[18px] h-[18px]" />
                    AI Chat
                  </div>
                  <div className="hover:bg-background-light dark:hover:bg-border-dark px-3 py-2 rounded-lg flex items-center gap-3 text-text-muted-light dark:text-text-muted-dark font-medium transition-colors cursor-pointer">
                    <Folder className="w-[18px] h-[18px]" />
                    Projects
                  </div>
                  <div className="hover:bg-background-light dark:hover:bg-border-dark px-3 py-2 rounded-lg flex items-center gap-3 text-text-muted-light dark:text-text-muted-dark font-medium transition-colors cursor-pointer">
                    <FileText className="w-[18px] h-[18px]" />
                    Documents
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="h-16 border-b border-border-light dark:border-border-dark flex items-center justify-between px-8">
                  <h2 className="font-bold text-lg">AI Chat</h2>
                  <button className="bg-text-light dark:bg-text-dark text-surface-light dark:text-surface-dark px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Upgrade
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <h3 className="text-4xl font-bold mb-4">Welcome to Hex</h3>
                  <p className="text-text-muted-light dark:text-text-muted-dark mb-10">
                    Get started by giving Hex a task and Chat can do the rest.
                  </p>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                    <div className="border border-border-light dark:border-border-dark rounded-xl p-3 flex items-center gap-3 hover:border-primary cursor-pointer transition-colors bg-surface-light dark:bg-surface-dark">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                        <FileEdit className="w-5 h-5" />
                      </div>
                      <span className="font-medium flex-1 text-left">Write copy</span>
                      <Plus className="text-text-muted-light w-4 h-4" />
                    </div>
                    <div className="border border-border-light dark:border-border-dark rounded-xl p-3 flex items-center gap-3 hover:border-primary cursor-pointer transition-colors bg-surface-light dark:bg-surface-dark">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="font-medium flex-1 text-left">Image generation</span>
                      <Plus className="text-text-muted-light w-4 h-4" />
                    </div>
                    <div className="border border-border-light dark:border-border-dark rounded-xl p-3 flex items-center gap-3 hover:border-primary cursor-pointer transition-colors bg-surface-light dark:bg-surface-dark">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <Smile className="w-5 h-5" />
                      </div>
                      <span className="font-medium flex-1 text-left">Create avatar</span>
                      <Plus className="text-text-muted-light w-4 h-4" />
                    </div>
                    <div className="border border-border-light dark:border-border-dark rounded-xl p-3 flex items-center gap-3 hover:border-primary cursor-pointer transition-colors bg-surface-light dark:bg-surface-dark">
                      <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                        <Code className="w-5 h-5" />
                      </div>
                      <span className="font-medium flex-1 text-left">Write code</span>
                      <Plus className="text-text-muted-light w-4 h-4" />
                    </div>
                  </div>
                  <div className="w-full max-w-3xl mt-auto">
                    <div className="border-2 border-primary/30 rounded-2xl p-2 bg-surface-light dark:bg-surface-dark flex flex-col shadow-sm">
                      <input
                        className="bg-transparent border-none focus:ring-0 text-text-light dark:text-text-dark placeholder-text-muted-light dark:placeholder-text-muted-dark px-4 py-3 w-full outline-none"
                        placeholder="Summarize the latest|"
                        type="text"
                      />
                      <div className="flex justify-between items-center px-2 py-2 border-t border-border-light dark:border-border-dark mt-2">
                        <div className="flex gap-4 text-text-muted-light dark:text-text-muted-dark">
                          <button className="flex items-center gap-1 text-sm hover:text-text-light dark:hover:text-text-dark">
                            <Paperclip className="w-4 h-4" />
                            Attach
                          </button>
                          <button className="flex items-center gap-1 text-sm hover:text-text-light dark:hover:text-text-dark">
                            <Mic className="w-4 h-4" />
                            Voice
                          </button>
                        </div>
                        <button className="bg-primary text-white p-2 rounded-xl flex items-center justify-center hover:bg-opacity-90">
                          <Send className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-center text-text-muted-light dark:text-text-muted-dark mt-3">
                      Hex may generate inaccurate information. Model: Hex AI v1.3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 border-y border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider mb-8">
            Trusted by forward-thinking teams
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Triangle className="w-6 h-6" /> Acme Corp
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <CircleDot className="w-6 h-6" /> GlobalTech
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <LayoutGrid className="w-6 h-6" /> InnovateCo
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <InfinityIcon className="w-6 h-6" /> Nexus
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <PieChart className="w-6 h-6" /> Stellar
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need in one place
            </h2>
            <p className="text-lg text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto">
              Powerful tools designed to accelerate your workflow and boost creativity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-6">
                <FileEdit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Writing Assistant</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                Draft emails, blog posts, and copy in seconds. Overcome writer's block with contextual suggestions.
              </p>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Intelligent Image Gen</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                Transform text deHexions into stunning, high-quality visuals instantly for your creative projects.
              </p>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-6">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Code Completion</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                Write better code faster. Get intelligent autocomplete, bug fixes, and documentation generation.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-lg text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto">
              Get started in minutes and see the results instantly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-border-light dark:bg-border-dark z-0"></div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-background-light dark:bg-background-dark border-4 border-surface-light dark:border-surface-dark rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-6 shadow-sm">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Connect</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark">
                Sign up and integrate Hex with your favorite tools seamlessly.
              </p>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-background-light dark:bg-background-dark border-4 border-surface-light dark:border-surface-dark rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-6 shadow-sm">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Chat</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark">
                Simply tell Hex what you need using natural language.
              </p>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-background-light dark:bg-background-dark border-4 border-surface-light dark:border-surface-dark rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-6 shadow-sm">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Create</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark">
                Review the generated content, refine, and publish your work.
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer className="bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-text-light dark:bg-text-dark rounded-full flex items-center justify-center">
                  <Sparkles className="text-surface-light dark:text-surface-dark w-4 h-4" />
                </div>
                <span className="font-bold text-xl">Hex</span>
              </div>
              <p className="text-text-muted-light dark:text-text-muted-dark mb-6 max-w-sm">
                The ultimate AI companion to accelerate your productivity and creative workflows.
              </p>
              <form className="flex max-w-sm">
                <input
                  className="flex-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-l-lg px-4 py-2 focus:outline-none focus:border-primary dark:focus:border-primary text-text-light dark:text-text-dark"
                  placeholder="Enter your email"
                  type="email"
                />
                <button
                  className="bg-primary text-white px-4 py-2 rounded-r-lg font-medium hover:bg-opacity-90 transition-colors"
                  type="submit"
                >
                  Subscribe
                </button>
              </form>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Features
                  </a>
                </li>
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Integrations
                  </a>
                </li>
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Pricing
                  </a>
                </li>
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    About Us
                  </a>
                </li>
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Careers
                  </a>
                </li>
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Blog
                  </a>
                </li>
                <li>
                  <a className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors" href="#">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border-light dark:border-border-dark">
            <p className="text-text-muted-light dark:text-text-muted-dark text-sm mb-4 md:mb-0">
              © 2024 Hex AI. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors" href="#">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors" href="#">
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}