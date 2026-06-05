// lib/smart-fetch.ts
import { addToSyncQueue } from './offline-db';

function generateQueueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `queue-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildPayload(body: BodyInit | null | undefined): any {
  if (!body) return {};
  if (typeof body === 'string') return JSON.parse(body);
  if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) return body;
  if (typeof body === 'object') return body;
  return {};
}

interface SmartFetchOptions extends RequestInit {
  /** Jika offline, simpan ke queue dengan tipe ini */
  queueType?: string;
  /** Skip queue (selalu coba fetch langsung) */
  skipQueue?: boolean;
}

/**
 * Smart fetch: otomatis queue ke IndexedDB jika offline
 */
export async function smartFetch(url: string, options: SmartFetchOptions = {}) {
  const { queueType, skipQueue, ...fetchOptions } = options;
  const isOnline = navigator.onLine;

  // Jika online → fetch langsung
  if (isOnline) {
    try {
      const response = await fetch(url, fetchOptions);

      // Jika gagal dan ada queueType, queue untuk retry
      if (!response.ok && queueType && !skipQueue) {
        console.warn(`⚠️ [SmartFetch] HTTP ${response.status}, queue untuk retry`);
        await addToSyncQueue({
          queueId: generateQueueId(),
          type: queueType,
          endpoint: url,
          method: (fetchOptions.method as any) || 'POST',
          payload: buildPayload(fetchOptions.body),
        });
      }

      return response;
    } catch (err) {
      // Network error → queue
      if (queueType && !skipQueue) {
        console.warn(`⚠️ [SmartFetch] Network error, queue untuk retry`);
        await addToSyncQueue({
          queueId: generateQueueId(),
          type: queueType,
          endpoint: url,
          method: (fetchOptions.method as any) || 'POST',
          payload: buildPayload(fetchOptions.body),
        });
      }
      throw err;
    }
  }

  // Jika offline → langsung queue
  if (queueType && !skipQueue) {
    console.log(`📴 [SmartFetch] Offline, queue: ${queueType}`);
    await addToSyncQueue({
      queueId: generateQueueId(),
      type: queueType,
      endpoint: url,
      method: (fetchOptions.method as any) || 'POST',
      payload: buildPayload(fetchOptions.body),
    });

    // Return response tiruan agar kode tidak crash
    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Data disimpan untuk sync saat online',
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  throw new Error('Offline dan tidak ada queueType');
}
