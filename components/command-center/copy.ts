export const userCopy = {
  home: {
    processingLocationNoticeTitle: 'Operational processing lives in Build Intelligence',
    processingLocationNoticeBody: 'Home is a strategic overview. Source entry and processing actions are intentionally separated into the dedicated build workspace.',
    latestPackageTitle: 'Latest intelligence package'
  },
  build: {
    processingUpdateTitle: 'Processing update',
    storageTemporary: 'Storage service is temporarily unavailable. Please retry shortly.',
    delayed: 'Processing is temporarily delayed. Please retry your request.',
    unavailable: 'The intelligence service is temporarily unavailable. Please retry in a moment.'
  }
} as const;

export const supportCopy = {
  diagnostics: {
    routePrefix: '/api/'
  }
} as const;
