"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";

export default function DemoPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: "var(--text-primary, #212121)" }}
          >
            Rekkferga Demo
          </h1>
          <p
            className="text-xl mb-6"
            style={{ color: "var(--text-secondary, #757575)" }}
          >
            Demonstrasjon av komponenter og temaer
          </p>

          {/* Theme Switcher */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setTheme("light")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === "light"
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor: "var(--primary, #1976d2)",
                color: "var(--primary-text, #ffffff)",
              }}
            >
              Lys
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === "dark" ? "opacity-100" : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor: "var(--secondary, #ff9800)",
                color: "var(--secondary-text, #000000)",
              }}
            >
              Mørk
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === "system"
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor: "var(--surface-variant, #f5f5f5)",
                color: "var(--text-primary, #212121)",
                border: "1px solid var(--border, #e0e0e0)",
              }}
            >
              System
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div
            className="flex bg-surface rounded-lg p-1"
            style={{ backgroundColor: "var(--surface-variant, #f5f5f5)" }}
          >
            {["overview", "components", "themes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-text"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                style={{
                  backgroundColor:
                    activeTab === tab
                      ? "var(--primary, #1976d2)"
                      : "transparent",
                  color:
                    activeTab === tab
                      ? "var(--primary-text, #ffffff)"
                      : "var(--text-secondary, #757575)",
                }}
              >
                {tab === "overview" && "Oversikt"}
                {tab === "components" && "Komponenter"}
                {tab === "themes" && "Temaer"}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div
              className="rounded-lg p-6 border transition-colors cursor-pointer hover:border-primary"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Fergekaier
              </h3>
              <p style={{ color: "var(--text-secondary, #757575)" }}>
                Utforsk fergekaier i ditt område og finn ruter.
              </p>
            </div>

            <div
              className="rounded-lg p-6 border transition-colors cursor-pointer hover:border-primary"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Ruteplanlegger
              </h3>
              <p style={{ color: "var(--text-secondary, #757575)" }}>
                Planlegg reiser med ferge og kollektivtransport.
              </p>
            </div>

            <div
              className="rounded-lg p-6 border transition-colors cursor-pointer hover:border-primary"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Sanntidsinfo
              </h3>
              <p style={{ color: "var(--text-secondary, #757575)" }}>
                Få oppdatert informasjon om avganger og forsinkelser.
              </p>
            </div>
          </div>
        )}

        {activeTab === "components" && (
          <div className="space-y-6">
            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Header Komponent
              </h3>
              <p style={{ color: "var(--text-secondary, #757575)" }}>
                Header-komponenten viser logoen og støtter tema-bytte. Den
                bruker CSS custom properties for farger og tilpasser seg
                automatisk til lys/mørk tema.
              </p>
            </div>

            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Tema System
              </h3>
              <p style={{ color: "var(--text-secondary, #757575)" }}>
                Appen støtter tre temaer: lys, mørk og system. System-temaet
                følger operativsystemets innstillinger automatisk.
              </p>
            </div>
          </div>
        )}

        {activeTab === "themes" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Lys Tema
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "var(--primary, #1976d2)" }}
                  ></div>
                  <span style={{ color: "var(--text-secondary, #757575)" }}>
                    Primær: #1976d2
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "var(--secondary, #ff9800)" }}
                  ></div>
                  <span style={{ color: "var(--text-secondary, #757575)" }}>
                    Sekundær: #ff9800
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor: "var(--surface, #ffffff)",
                      borderColor: "var(--border, #e0e0e0)",
                    }}
                  ></div>
                  <span style={{ color: "var(--text-secondary, #757575)" }}>
                    Overflate: #ffffff
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--border, #e0e0e0)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-primary, #212121)" }}
              >
                Mørk Tema
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "var(--primary, #90caf9)" }}
                  ></div>
                  <span style={{ color: "var(--text-secondary, #757575)" }}>
                    Primær: #90caf9
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "var(--secondary, #ffcc80)" }}
                  ></div>
                  <span style={{ color: "var(--text-secondary, #757575)" }}>
                    Sekundær: #ffcc80
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor: "var(--surface, #151718)",
                      borderColor: "var(--border, #2a2a2a)",
                    }}
                  ></div>
                  <span style={{ color: "var(--text-secondary, #757575)" }}>
                    Overflate: #151718
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
