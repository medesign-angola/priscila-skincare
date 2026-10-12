import { mergeConfig, type Plugin, type UserConfig } from 'vite';

const adminShellPlugin: Plugin = {
  name: 'priscila-admin-shell',
  enforce: 'post',
  transformIndexHtml(html) {
    return html
      .replace(/<html lang="[^"]*">/, '<html lang="pt">')
      .replace(
        /<title>[^<]*<\/title>/,
        '<title>Priscila Skincare — Administração</title>',
      );
  },
};

export default (config: UserConfig) =>
  mergeConfig(config, {
    plugins: [adminShellPlugin],
  });
