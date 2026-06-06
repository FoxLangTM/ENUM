export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Jeśli wchodzisz na główną stronę, pobierz body.html
    if (url.pathname === "/") {
      return fetch(new URL("/body.html", request.url));
    }

    // W przeciwnym razie serwuj plik normalnie
    return fetch(request);
  },
};