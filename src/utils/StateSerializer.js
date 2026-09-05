class StateSerializer {
  static encodeState(presetId, audioLayers) {
    const layerString = Object.entries(audioLayers)
      .map(([id, vol]) => `${id}:${Math.round(vol * 100)}`)
      .join(',');
    
    const params = new URLSearchParams({
      p: presetId,
      l: layerString
    });
    
    return `${window.location.origin}/room?${params.toString()}`;
  }

  static decodeState(queryString) {
    const params = new URLSearchParams(queryString);
    const presetId = params.get('p');
    const layersRaw = params.get('l');
    
    const layers = {};
    if (layersRaw) {
      layersRaw.split(',').forEach(pair => {
        const [id, vol] = pair.split(':');
        layers[id] = parseInt(vol, 10) / 100;
      });
    }

    return { presetId, layers };
  }
}