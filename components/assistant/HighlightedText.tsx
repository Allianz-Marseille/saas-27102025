"use client";

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  currentMatchIndex?: number;
  matchIndexInText?: number;
}

export function HighlightedText({
  text,
  searchQuery,
  currentMatchIndex = -1,
  matchIndexInText = -1,
}: HighlightedTextProps) {
  if (!searchQuery) {
    return <>{text}</>;
  }

  const parts: { text: string; isMatch: boolean; isActive: boolean }[] = [];
  let lastIndex = 0;
  let matchCount = 0;

  const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texte avant le match
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isMatch: false,
        isActive: false,
      });
    }

    // Le match
    const isActive = matchCount === currentMatchIndex;
    parts.push({
      text: match[0],
      isMatch: true,
      isActive,
    });

    lastIndex = match.index + match[0].length;
    matchCount++;
  }

  // Texte après le dernier match
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isMatch: false,
      isActive: false,
    });
  }

  return (
    <>
      {parts.map((part, index) => {
        if (!part.isMatch) {
          return <span key={index}>{part.text}</span>;
        }

        return (
          <mark
            key={index}
            className={`rounded px-0.5 ${
              part.isActive
                ? "bg-orange-400 text-white font-semibold"
                : "bg-yellow-200 text-gray-900"
            }`}
          >
            {part.text}
          </mark>
        );
      })}
    </>
  );
}

