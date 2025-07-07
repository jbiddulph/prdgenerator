"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

async function fetchIdeas() {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prdIdeas: true }),
  });
  const data = await res.json();
  return data.ideas || [];
}

async function generatePRD(phrase: string) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: `Write a detailed Product Requirements Document (PRD) in Markdown format for the following idea: ${phrase}` }),
  });
  const data = await res.json();
  return data.result || "";
}

export default function Home() {
  const [phrases, setPhrases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [prd, setPrd] = useState<string>("");
  const [prdLoading, setPrdLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const prdSectionRef = useRef<HTMLDivElement>(null);

  const regenerate = async () => {
    setLoading(true);
    setSelectedPhrase(null);
    setPrd("");
    const ideas = await fetchIdeas();
    setPhrases(ideas);
    setLoading(false);
  };

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhraseClick = async (phrase: string) => {
    setSelectedPhrase(phrase);
    setPrd("");
    setPrdLoading(true);
    setTimeout(() => {
      prdSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // slight delay for smooth UX
    const prdText = await generatePRD(phrase);
    setPrd(prdText);
    setPrdLoading(false);
  };

  const handleCopy = async () => {
    if (prd) {
      await navigator.clipboard.writeText(prd);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    }
  };

  const handleDownload = (ext: string) => {
    if (!prd) return;
    const blob = new Blob([prd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedPhrase || "prd"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 sm:p-8 pb-20 gap-8 sm:gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-2xl">
        {/* Phrase Buttons at the Top */}
      <h1 className="text-2xl font-bold text-center">Product Requirements Document Generator</h1>
      <div className="w-full max-w-5xl mx-auto mt-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Template Ideas</h2>
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            onClick={regenerate}
            type="button"
            disabled={loading}
          >
            {loading ? "Loading..." : "Regenerate"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto">
          {phrases.length === 0 && !loading && (
            <span className="text-gray-400">No ideas found.</span>
          )}
          {phrases.map((phrase, idx) => (
            <button
              key={idx}
              className={`w-full px-4 py-3 rounded border text-left bg-white hover:bg-blue-50 transition shadow-sm font-medium text-base sm:text-sm ${selectedPhrase === phrase ? "border-blue-500 bg-blue-100" : "border-gray-200"}`}
              onClick={() => handlePhraseClick(phrase)}
              disabled={prdLoading}
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
        <div ref={prdSectionRef} className="w-full">
          {prdLoading && (
            <div className="mt-8 flex flex-col items-center justify-center gap-2">
              <PulsatingLoader />
              <div className="text-blue-600">Generating PRD for "{selectedPhrase}"...</div>
            </div>
          )}
          {prd && !prdLoading && (
            <div className="mt-8 w-full">
              <div className="flex gap-2 mb-2">
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  onClick={handleCopy}
                >
                  {copySuccess ? "Copied!" : "Copy PRD"}
                </button>
                <button
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                  onClick={() => handleDownload("md")}
                >
                  Download .md
                </button>
                <button
                  className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm"
                  onClick={() => handleDownload("prd")}
                >
                  Download .prd
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 overflow-x-auto whitespace-pre-wrap prose prose-sm max-w-none">
                <MarkdownRenderer content={prd} />
              </div>
              <p>
                This is a tool that generates product requirements documents based on
                a user's input.
              </p>
              <p>
                It uses the OpenAI API to generate the document.
              </p>
            </div>
          )}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        PRD Generator
      </footer>
    </div>
  );
}

function PulsatingLoader() {
  return (
    <div className="flex items-center justify-center">
      <span className="inline-block w-4 h-4 rounded-full bg-blue-500 animate-pulse"></span>
      <span className="inline-block w-4 h-4 rounded-full bg-blue-400 animate-pulse ml-1 delay-150"></span>
      <span className="inline-block w-4 h-4 rounded-full bg-blue-300 animate-pulse ml-1 delay-300"></span>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</pre>;
}
