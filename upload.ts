const MAX_SIZE = 5 * 1024 * 1024;

type PlatformEnv = { VITE_PLATFORM_SERVICES_URL?: string; VITE_PLATFORM_SERVICE_TOKEN?: string };
const env = ((import.meta as unknown as { env?: PlatformEnv }).env || {}) as PlatformEnv;

async function readUrl(response: Response): Promise<string> {
  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error('پاسخ سرویس ذخیره‌سازی نامعتبر بود.');
  return data.url;
}

/**
 * Uploads one image and returns its permanent public URL.
 * Tries platform storage straight from the app first, and falls back to the
 * app's own server, so a picture still gets through if one path is unavailable.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file) throw new Error('تصویری انتخاب نشده است.');
  if (file.size > MAX_SIZE) throw new Error('حجم تصویر «' + file.name + '» بیشتر از ۵ مگابایت است؛ تصویر کوچک‌تری انتخاب کنید.');
  if (file.type && !file.type.startsWith('image/')) throw new Error('فقط فایل تصویری قابل انتخاب است.');

  let tooLarge = false;
  let failed = false;

  const base = (env.VITE_PLATFORM_SERVICES_URL || '').replace(/\/+$/, '');
  const token = env.VITE_PLATFORM_SERVICE_TOKEN || '';
  if (base && token) {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(base + '/storage/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
      if (response.ok) return await readUrl(response);
      if (response.status === 413) tooLarge = true;
      failed = true;
      console.error('direct storage upload failed with', response.status);
    } catch (error) { failed = true; console.error('direct storage upload threw', error); }
  }

  try {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: form });
    if (response.ok) return await readUrl(response);
    if (response.status === 413) tooLarge = true;
    failed = true;
    console.error('server upload failed with', response.status);
  } catch (error) { failed = true; console.error('server upload threw', error); }

  if (tooLarge) throw new Error('حجم تصویر بیشتر از حد مجاز است؛ تصویر کوچک‌تری انتخاب کنید.');
  if (failed) throw new Error('بارگذاری تصویر انجام نشد؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.');
  throw new Error('امکان بارگذاری تصویر در این لحظه وجود ندارد.');
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) urls.push(await uploadImage(file));
  return urls;
}
