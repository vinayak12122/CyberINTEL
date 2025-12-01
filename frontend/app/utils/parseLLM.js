export function parseLLMChunk(raw) {
    if (!raw) return "";

    let text = raw.trim();

    text = text.replace(/\[p\]/gi, "\n\n");

    text = text.replace(/\n?[*-]\s+/g, match => "\n" + match.trim());

    return text + "\n";
}