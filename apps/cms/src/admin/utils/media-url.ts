export function resolveAdminMediaUrl(value?: string): string | undefined {
  if (!value || typeof window === 'undefined') return value;

  const input = value.trim();
  const fileUriIndex = input.toLowerCase().indexOf('file:///');
  if (fileUriIndex >= 0) {
    const filePath = input.slice(fileUriIndex + 'file://'.length);
    const uploadsIndex = filePath.toLowerCase().indexOf('/uploads/');
    const publicPath = uploadsIndex >= 0 ? filePath.slice(uploadsIndex) : filePath;
    return `${window.location.origin}/${publicPath.replace(/^\/+/, '')}`;
  }

  try {
    const url = new URL(input, window.location.origin);
    if (
      ['localhost', '127.0.0.1', 'cms', 'host.docker.internal'].includes(
        url.hostname.toLowerCase(),
      )
    ) {
      return `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch {
    return input;
  }
}
