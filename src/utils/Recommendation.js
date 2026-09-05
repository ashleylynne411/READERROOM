const presetDatabase = [ /* Preset Schemas */ ];

function recommendAtmosphere(bookInput) {
  const normalizedInput = bookInput.toLowerCase().trim();
  
  const matches = presetDatabase.map(preset => {
    let score = 0;
    
    // Direct Tag Matching
    preset.genreTags.forEach(tag => {
      if (normalizedInput.includes(tag)) score += 5;
    });

    // Keyword Inferences
    if (normalizedInput.includes("academy") || normalizedInput.includes("magic")) {
      if (preset.presetId.includes("wizard") || preset.presetId.includes("library")) score += 4;
    }
    if (normalizedInput.includes("london") || normalizedInput.includes("sherlock")) {
      if (preset.presetId.includes("detective") || preset.presetId.includes("fog")) score += 4;
    }
    if (normalizedInput.includes("space") || normalizedInput.includes("ship")) {
      if (preset.presetId.includes("space") || preset.presetId.includes("cyberpunk")) score += 4;
    }

    return { preset, score };
  });

  return matches
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(m => m.preset);
}