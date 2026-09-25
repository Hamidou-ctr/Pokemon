const responseCacheByUrl = new Map(); // url -> Promise mit der Antwort, jede URL wird nur einmal geladen

function fetchJsonWithCache(url) {
  if (!responseCacheByUrl.has(url)) {
    let responsePromise = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
      }
      return response.json();
    });
    responsePromise.catch(() => responseCacheByUrl.delete(url)); // fehlgeschlagene Anfragen dürfen erneut versucht werden
    responseCacheByUrl.set(url, responsePromise);
  }
  return responseCacheByUrl.get(url);
}

function fetchPokemonById(pokemonId) {
  return fetchJsonWithCache(`${pokeApiBaseUrl}/pokemon/${pokemonId}`);
}
