/**
 * Calls /api/generate using SSE streaming.
 * onChunk(accumulatedText) is called after each chunk with the full text so far.
 * Returns the complete text when the stream ends.
 */
export async function streamGenerate({ toolId, input, session, lang }, onChunk) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({
      toolId,
      input,
      userId: session?.user?.id,
      lang,
    }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(json.error ?? 'Request failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    // SSE events are separated by double newlines
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return fullText;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (typeof parsed.text === 'string') {
            fullText += parsed.text;
            onChunk(fullText);
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }
  }

  return fullText;
}
