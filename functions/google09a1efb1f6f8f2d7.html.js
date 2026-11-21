export async function onRequest() {
  return new Response("google-site-verification: google09a1efb1f6f8f2d7.html", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  });
}
