const cache = new Map(); // url -> Promise mit der Antwort, jede URL wird nur einmal geladen

function fetchJson(url) {
  if (!cache.has(url)) {
    let request = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
      }
      return response.json();
    });
    request.catch(() => cache.delete(url)); // fehlgeschlagene Anfragen dürfen erneut versucht werden
    cache.set(url, request);
  }
  return cache.get(url);
}

function loadPokemon(pokemonId) {
  return fetchJson(`${baseUrl}/pokemon/${pokemonId}`);
}
