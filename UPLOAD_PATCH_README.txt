// Patch snippet for netlify/functions/upload.mjs:
// Add these lines right before returning the JSON response after creating the DB row.
const origin = new URL(request.url).origin;
const shareUrl = `${origin}/share/${id}`;
const fallbackUrl = `${origin}/.netlify/functions/share?id=${id}`;
// Then return both:
return jsonResponse({ id, shareUrl, fallbackUrl });
