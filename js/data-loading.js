const responseCacheByUrl = new Map(); // url -> Promise mit der Antwort, jede URL wird nur einmal geladen

function fetchJsonWithCache(url) {
  if (!responseCacheByUrl.has(url)) {
    responseCacheByUrl.set(url, fetchJsonAndForgetFailure(url));
  }
  return responseCacheByUrl.get(url);
}

// Fehlgeschlagene Anfragen werden aus dem Cache entfernt, damit sie erneut versucht werden dürfen
function fetchJsonAndForgetFailure(url) {
  let responsePromise = fetchJsonFromNetwork(url);
  responsePromise.catch(() => responseCacheByUrl.delete(url));
  return responsePromise;
}

function fetchJsonFromNetwork(url) {
  return fetch(url).then((response) => readJsonOrThrow(response, url));
}

function readJsonOrThrow(response, url) {
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

function fetchPokemonById(pokemonId) {
  return fetchJsonWithCache(`${pokeApiBaseUrl}/pokemon/${pokemonId}`);
}
